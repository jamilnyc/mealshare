"""
messages.py

Class that handles all interactions with the mealshare_messages table.
"""

import boto3
from botocore.exceptions import ClientError
from boto3.dynamodb.conditions import Key
import time
from decimal import Decimal


class MealShareMessages:
    TABLE_NAME = 'mealshare_messages'
    REGION = 'us-east-1'

    def __init__(self):
        self.dynamodb = boto3.resource('dynamodb', region_name=self.REGION)
        self.table = self.dynamodb.Table(self.TABLE_NAME)

    def get_messages_by_group(self, group_id, timestamp=None, limit=25):
        """
        Return the most recent messages for this group since the given timestamp.
        """
        expression = Key('group_id').eq(group_id)
        if timestamp is not None and int(timestamp) > 0:
            Key('group_id').eq(group_id) & Key('message_timestamp').eq(int(timestamp))
        try:
            response = self.table.query(
                KeyConditionExpression=expression,
                ScanIndexForward=False,
                Limit=limit
            )
            items = response['Items']
            for item in items:
                item['message_timestamp'] = float(item['message_timestamp'])
            return items
        except ClientError as e:
            print('Error reading messages for group {}'.format(group_id))
            print(e.response['Error']['Message'])

        return []

    def add_message_to_group(self, group_id, user_id, message_body):
        """
        Add the given message to the group chat.
        """

        # Convert the current timestamp to one compatible with DynamoDB
        now = time.time()
        now = Decimal(str(now))
        item = {
            'group_id': group_id,
            'user_id': user_id,
            'message_body': message_body,
            'message_timestamp': now
        }

        try:
            response = self.table.put_item(
                Item=item
            )
        except ClientError as e:
            print('Error adding message to group chat')
            print(e.response['Error'])
            return False

        if 'ResponseMetadata' in response:
            if 'HTTPStatusCode' in response['ResponseMetadata']:
                if response['ResponseMetadata']['HTTPStatusCode'] == 200:
                    return item
        return False
