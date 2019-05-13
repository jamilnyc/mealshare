import json
import boto3

from messages import MealShareMessages
from groups import MealShareGroups
from users import MealShareUsers

class GroupChatApi:
    def __init__(self):
        self.mealShareMessages = MealShareMessages()
        self.mealShareGroups = MealShareGroups()
        self.mealShareUsers = MealShareUsers()
    
    def get(self, user_id, group_id):
        if not self.mealShareGroups.is_user_in_group(user_id, group_id):
            return {
                'messages': None,
                'statusCode': 401
            }
        
        messages = self.mealShareMessages.get_messages_by_group(group_id)
        return {
            'messages': messages,
            'statusCode': 200
        }
        
    def get_bad_request(self, status_message):
        return {
            'statusCode': 400,
            'statusMessage': 'Bad Request: {}'.format(status_message)
        }
        
    def post(self, event):
        body = None
        if 'body' in event:
            body = event['body']
            body = json.loads(body)
        if not body:
            return self.get_bad_request('Post body is empty')
        
        if not 'op' in body or not body['op']:
            return self.get_bad_request('Operation (op) field not specified')
        op = body['op']
        
        # You can either read messages or add them.
        if op == 'read':
            return self.read(event)
        if op == 'write':
            return self.write(event)
        
        return self.get_bad_request('Invalid op field given: {}'.format(op))
    
    def read(self, event):
        """
        Return the messages of the given group, if the user belongs to it.
        """
        
        body = event['body']
        body = json.loads(body)
        
        # Determine who is requesting messages and for which group
        user = self.mealShareUsers.get_user_cognito_data(event)
        user_id = user['user_id']
        group_id = body['group_id']
        
        # Users can only read messages from groups they belong to
        if not self.mealShareGroups.is_user_in_group(user_id, group_id):
            return {
                'messages': None,
                'statusCode': 401
            }
        
        messages = self.mealShareMessages.get_messages_by_group(group_id)
        return {
            'messages': messages,
            'statusCode': 200
        }
        
    def write(self, event):
        """
        Add a message to the given group, if the user is a member.
        """
        
        body = event['body']
        body = json.loads(body)
        
        # Determine the user attempting to add the message
        user = self.mealShareUsers.get_user_cognito_data(event)
        user_id = user['user_id']
        
        # Users must specify a group and message to add
        if not 'group_id' in body:
            return get_bad_request('POST body missing group_id')
        if not 'message' in body:
            return get_bad_request('POST body missing message')
        
        # Users can only add messages to groups they are members of
        group_id = body['group_id']
        if not self.mealShareGroups.is_user_in_group(user_id, group_id):
            return {
                'messages': None,
                'statusCode': 401,
                'statusMessage': 'You are not a member of group {}'.format(group_id)
            }
        
        # Attempt to add the message to the group chat
        message = body['message']
        item = self.mealShareMessages.add_message_to_group(group_id, user_id, message)
        if item:
            return {
                'statusCode': 200,
                'statusMessage': 'Message added to group {} by user {}'.format(group_id, user_id),
                'message': item
            }
        else:
            return {
                'statusCode': 500,
                'statusMessage': 'Failed to add message to group {} by user {}'.format(group_id, user_id)
            }