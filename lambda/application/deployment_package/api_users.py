import json
import boto3

from users import MealShareUsers
from preferences import MealSharePreferences
from groups import MealShareGroups

class UsersApi:
    def __init__(self):
        self.mealShareUsers = MealShareUsers()
        self.mealSharePreferences = MealSharePreferences()
        self.mealShareGroups = MealShareGroups()
    
    def get_bad_request(self, status_message):
        """
        Return a generic HTTP Bad Request Response to indicate incorrect parameters.
        """
        return {
            'statusCode': 400,
            'statusMessage': 'Bad Request: {}'.format(status_message)
        }
        
    def post(self, event):
        """
        Main function that handles POST requests to the User resource.
        """
        
        # POST messages should always have a request body.
        body = None
        if 'body' in event:
            body = event['body']
            body = json.loads(body)
        if not body:
            return self.get_bad_request('Post body is empty')
        
        # All POST operations are differentiated by the 'op' parameter
        if not 'op' in body or not body['op']:
            return self.get_bad_request('Operation (op) field not specified')
        op = body['op']
        
        # Only valid operations are processed
        if op == 'read':
            return self.get_user_info(event)
        if op == 'home':
            return self.get_all_user_info(event)
            
        return self.get_bad_request('Invalid op field given: {}'.format(op))
        
    def get_user_info(self, event):
        """
        Returns data for the given user.
        """
        body = event['body']
        body = json.loads(body)
        
        if 'user_id' not in body:
            return self.get_bad_request('POST body missing user_id')
        
        user_id = body['user_id']
        basic_data = self.mealShareUsers.get_user_data(user_id)
        preferences = self.mealSharePreferences.get_preferences(user_id)
        
        success = (basic_data)
        print(basic_data)
        print(preferences)
        if success:
            return {
                'statusCode': 200,
                'statusMessage': 'Successfully retrieved data for user {}'.format(user_id),
                'user_id': user_id,
                'user_data': basic_data,
                'user_preferences': preferences
            }
        else:
            return {
                'statusCode': 500,
                'statusMessage': 'FAILED to read data for user {}'.format(user_id),
                'user_id': user_id
            }
            
    def get_all_user_info(self, event):
        """
        Returns data for the given user.
        """
        body = event['body']
        body = json.loads(body)
        
        user = self.mealShareUsers.get_user_cognito_data(event)
        user_id = user['user_id']
        basic_data = self.mealShareUsers.get_user_data(user_id)
        preferences = self.mealSharePreferences.get_preferences(user_id)
        group_ids = self.mealShareGroups.get_groups_by_user_id(user_id)
        
        groups = []
        for gid in group_ids:
            details = self.mealShareGroups.get_group_details(gid, include_users=False, include_events=False, include_messages=False)
            print(details)
            groups.append(details)
        events = self.mealShareGroups.get_events_by_user_id(user_id)
        
        success = (basic_data)
        if success:
            return {
                'statusCode': 200,
                'statusMessage': 'Successfully retrieved all data for user {}'.format(user_id),
                'user_id': user_id,
                'user_data': basic_data,
                'user_preferences': preferences,
                'groups': groups,
                'events': events
            }
        else:
            return {
                'statusCode': 500,
                'statusMessage': 'FAILED to read data for user {}'.format(user_id),
                'user_id': user_id
            }