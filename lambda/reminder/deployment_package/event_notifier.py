import boto3
from botocore.exceptions import ClientError
from boto3.dynamodb.conditions import Key
import time
import datetime

class EventNotifier:
    REGION = 'us-east-1'
    EVENTS_TABLE_NAME = 'mealshare_events'
    MEMBERSHIP_TABLE_NAME = 'mealshare_group_membership'
    USERS_TABLE_NAME = 'mealshare_users'

    def __init__(self):
        self.dynamodb = boto3.resource('dynamodb', region_name=self.REGION)
        self.events_table = self.dynamodb.Table(self.EVENTS_TABLE_NAME)
        self.membership_table = self.dynamodb.Table(self.MEMBERSHIP_TABLE_NAME)
        self.users_table = self.dynamodb.Table(self.USERS_TABLE_NAME)
        self.sns_client = boto3.client('sns')

    def get_events(self, then):
        """
        Return events that are occurring from now until the given timestamp.
        """
        events = []
        now = int(time.time())
        expression = Key('event_timestamp').between(now, then)

        try:
            # Use the secondary index defined on the table to do a reverse lookup
            response = self.events_table.scan(
                FilterExpression=expression
            )
            for item in response['Items']:
                events.append(item)

            # Pagination
            while 'LastEvaluatedKey' in response:
                response = self.events_table.query(
                    FilterExpression=expression,
                    ExclusiveStartKey=response['LastEvaluatedKey']
                )
                for item in response['Items']:
                    events.append(item)

        except ClientError as e:
            print(e.response['Error'])

        return events

    def get_timestamp_for_tomorrow(self):
        now = int(time.time())
        then = now + (60 * 60 * 24)
        return then

    def get_users_for_event(self, event):
        user_ids = []
        group_id = None
        if 'group_id' in event:
            group_id = event['group_id']

        if not group_id:
            return user_ids

        expression = Key('group_id').eq(group_id)
        try:
            response = self.membership_table.query(
                KeyConditionExpression=expression
            )

            for i in response['Items']:
                user_ids.append(i['user_id'])

            # Paginate through remaining groups.
            while 'LastEvaluatedKey' in response:
                response = self.membership_table.query(
                    KeyConditionExpression=expression,
                    ExclusiveStartKey=response['LastEvaluatedKey']
                )
                for i in response['Items']:
                    user_ids.append(i['user_id'])
        except ClientError as e:
            print('Error get users in group {}'.format(group_id))
            print(e.response['Error'])

        return user_ids

    def get_message(self, user_id, event):
        event_name = 'Your Event'
        if 'event_name' in event:
            event_name = event['event_name']

        location = 'Unknown'
        if 'location' in event:
            location = event['location']

        timestamp = int(event['event_timestamp'])
        date_string = datetime.datetime.fromtimestamp(timestamp).strftime('%B %d, %Y at %I:%M %p')

        message = 'MealShare Reminder for {}: You have {} on {}, located at {}.'.format(user_id, event_name, date_string, location)
        return message

    def notify_participants(self):
        ts = self.get_timestamp_for_tomorrow()
        print('Tomorrow: {}'.format(ts))
        events = self.get_events(ts)
        print(events)
        for event in events:
            user_ids = self.get_users_for_event(event)
            for user_id in user_ids:
                message = self.get_message(user_id, event)
                self.send_notification(user_id, message)

    def send_notification(self, user_id, message):
        print(message)
        phone_number = self.get_phone_number(user_id)
        print('Phone: {}'.format(phone_number))
        if (phone_number):
            self.sns_client.publish(PhoneNumber=phone_number, Message=message)

    def get_phone_number(self, user_id):
        phone_number = None
        key = {
            'user_id': user_id
        }
        try:
            response = self.users_table.get_item(Key=key)
            if 'Item' in response:
                item = response['Item']
                if 'user_id' in item and item['user_id'] == user_id:
                    if 'phone_number' in item:
                        phone_number = item['phone_number']
        except ClientError as e:
            print('ERROR getting user data for user {}'.format(user_id))
            print(e.response['Error'])

        return phone_number