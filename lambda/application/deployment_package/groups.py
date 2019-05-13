"""
Model class for the mealshare_groups table.
"""

import boto3
from botocore.exceptions import ClientError
from boto3.dynamodb.conditions import Key
import time
from datetime import datetime, timedelta

from messages import MealShareMessages

class MealShareGroups:
    GROUP_TABLE_NAME = 'mealshare_groups'
    MEMBERSHIP_TABLE_NAME = 'mealshare_group_membership'
    EVENTS_TABLE_NAME = 'mealshare_events'

    REGION = 'us-east-1'
    SECONDARY_INDEX = 'user_id-group_id-index'

    def __init__(self):
        # Initialize clients for DynamoDB
        self.dynamodb = boto3.resource('dynamodb', region_name=self.REGION)
        self.group_table = self.dynamodb.Table(self.GROUP_TABLE_NAME)
        self.membership_table = self.dynamodb.Table(self.MEMBERSHIP_TABLE_NAME)
        self.events_table = self.dynamodb.Table(self.EVENTS_TABLE_NAME)

    def get_all_groups(self):
        try:
            response = self.group_table.scan()
            return response['Items']
        except ClientError as e:
            print('ERROR retrieving all groups')
            print(e.response['Error']['Message'])

    def get_group_details(self, group_id, include_users=True, include_events=True, include_messages=True):
        group_id = str(group_id)
        expression = Key('group_id').eq(group_id)
        group_details = {}
        try:
            response = self.group_table.query(
                KeyConditionExpression=expression
            )
            if not response['Items'] or len(response['Items']) == 0:
                return group_details

            item = response['Items'][0]
            group_details['group_id'] = item['group_id']
            group_details['group_name'] = item['group_name']
            if include_users:
                group_details['members'] = self.get_members_by_group(str(group_id))
            
            if include_events:
                group_details['events'] = self.get_events(str(group_id), limit=10)

            if include_messages:
                mealShareMessages = MealShareMessages()
                recent_messages = mealShareMessages.get_messages_by_group(str(group_id))
                group_details['recent_messages'] = recent_messages

        except ClientError as e:
            print('Error getting details for group'.format(group_id))
            print(e.response['Error'])

        return group_details

    def get_members_by_group(self, group_id):
        """
        Return a list of user_id's of each user in the given group.
        """
        members_ids = []
        expression = Key('group_id').eq(group_id)
        try:
            response = self.membership_table.query(
                KeyConditionExpression=expression
            )

            for i in response['Items']:
                members_ids.append(i['user_id'])

            # Paginate through remaining groups.
            while 'LastEvaluatedKey' in response:
                response = self.membership_table.query(
                    KeyConditionExpression=expression,
                    ExclusiveStartKey=response['LastEvaluatedKey']
                )
                for i in response['Items']:
                    members_ids.append(i['user_id'])
        except ClientError as e:
            print('Error get users in group {}'.format(group_id))
            print(e.response['Error']['Message'])

        return members_ids

    def get_groups_by_user_id(self, user_id):
        """
        Return a list of group_id's of groups that the given user belongs to.
        """
        group_ids = []
        expression = Key('user_id').eq(user_id)
        try:
            # Use the secondary index defined on the table to do a reverse lookup
            response = self.membership_table.query(
                KeyConditionExpression=expression,
                IndexName=self.SECONDARY_INDEX
            )
            for item in response['Items']:
                group_ids.append(item['group_id'])

            # Pagination
            while 'LastEvaluatedKey' in response:
                response = self.membership_table.query(
                    KeyConditionExpression=expression,
                    IndexName=self.SECONDARY_INDEX,
                    ExclusiveStartKey=response['LastEvaluatedKey']
                )
                for item in response['Items']:
                    group_ids.append(item['group_id'])

        except ClientError as e:
            print('Error getting groups for user {}'.format(user_id))
            print(e.response['Error']['Message'])

        return group_ids

    def is_user_in_group(self, user_id, group_id):
        """
        Return whether or not the given user is a member of the given group.
        """
        expression = Key('group_id').eq(group_id) & Key('user_id').eq(user_id)
        try:
            response = self.membership_table.query(
                KeyConditionExpression=expression
            )
            if len(response['Items']) > 0:
                return True

        except ClientError as e:
            print('Error finding if {} is in group {}'.format(user_id, group_id))
            print(e.response['Error'])

        return False

    def create_group(self, group_name):
        """
        Create a new row in the mealshare_groups table an return its unique ID.
        """
        group_id = str(time.time()).split('.')[0]
        item = {
            'group_id': group_id,
            'group_name': group_name
        }
        response = self.group_table.put_item(Item=item)

        if 'ResponseMetadata' in response:
            if 'HTTPStatusCode' in response['ResponseMetadata']:
                if response['ResponseMetadata']['HTTPStatusCode'] == 200:
                    return group_id
        return None

    def add_user_to_group(self, user_id, group_id):
        """
        Create a membership row for the given user in the given group.
        """
        item = {
            'group_id': group_id,
            'user_id': user_id
        }
        print(item)

        response = self.membership_table.put_item(Item=item)
        if 'ResponseMetadata' in response:
            if 'HTTPStatusCode' in response['ResponseMetadata']:
                if response['ResponseMetadata']['HTTPStatusCode'] == 200:
                    return True
        return False

    def create_event(self, group_id, timestamp, location, recipe_name=None, event_name=None):
        """
        Create an event for the given group, with all its details.
        """
        # validate timestamp
        if not isinstance(timestamp, int) or timestamp <= 0:
            # set it to one week from now
            days = 7
            one_week_from_now = datetime.now() + timedelta(days)
            timestamp = int(datetime.timestamp(one_week_from_now))

        # Create a default unique name
        if not event_name:
            event_name = 'Event {}-{}'.format(group_id, timestamp)

        if not recipe_name:
            recipe_name = 'None'

        item = {
            'group_id': group_id,
            'event_timestamp': timestamp,
            'location': location,
            'recipe_name': recipe_name,
            'event_name': event_name
        }

        response = self.events_table.put_item(Item=item)
        if 'ResponseMetadata' in response:
            if 'HTTPStatusCode' in response['ResponseMetadata']:
                if response['ResponseMetadata']['HTTPStatusCode'] == 200:
                    return event_name

        return None

    def get_events(self, group_id, limit=10):
        """
        Get all the events for the given group, in reverse chronological order.
        """
        expression = Key('group_id').eq(group_id)
        events = []
        try:
            response = self.events_table.query(
                KeyConditionExpression=expression,
                ScanIndexForward=False,  # Reverse sort by timestamp
                Limit=limit
            )
            for i in response['Items']:
                # Map out fields so we have clean values
                event = {
                    'location': i['location'],
                    'recipe_name': i['recipe_name'],
                    'group_id': i['group_id'],
                    'event_name': i['event_name'],
                    'event_timestamp': int(i['event_timestamp'])
                }
                events.append(event)

            while 'LastEvaluatedKey' in response:
                # Already hit the limit, no more pagination necessary
                if len(events) >= limit:
                    break

                response = self.events_table.query(
                    KeyConditionExpression=expression,
                    ScanIndexForward=False,
                    ExclusiveStartKey=response['LastEvaluatedKey'],
                    Limit=limit
                )
                for i in response['Items']:
                    event = {
                        'location': i['location'],
                        'recipe_name': i['recipe_name'],
                        'group_id': i['group_id'],
                        'event_name': i['event_name'],
                        'event_timestamp': int(i['event_timestamp'])
                    }
                    events.append(event)
                    if len(events) >= limit:
                        break  # Break for loop

        except ClientError as e:
            print('Error reading events for group {}'.format(group_id))
            print(e.response['Error'])

        return events

    def get_events_by_user_id(self, user_id):
        """
        Get all the upcoming events for the user.
        """

        # Find all the groups they belong to.
        group_ids = self.get_groups_by_user_id(user_id)
        events = []

        # Gather all the events from each group
        for group_id in group_ids:
            group_events = self.get_events(group_id, 100)
            events.extend(group_events)

        # Sort by event's timestamp so they are in order
        sorted_events = sorted(events, key=lambda k: k['event_timestamp'], reverse=True)
        return sorted_events
