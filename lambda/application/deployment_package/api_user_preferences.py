"""
API for managing requests to the User Preferences resource.
"""

import json
import boto3

from preferences import MealSharePreferences
from users import MealShareUsers
from uploads import MealShareUploads

class UserPreferencesApi:
    def __init__(self):
        self.mealSharePreferences = MealSharePreferences()
        self.mealShareUsers = MealShareUsers()
        self.mealShareUploads = MealShareUploads()
    
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
        Main function that handles POST requests to the User Preferences resource.
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
        if op == 'update':
            return self.update_preferences(event)
        if op == 'find':
            return self.find_matching_users(event)
        if op == 'avatar':
            return self.upload_avatar(event)
            
        return self.get_bad_request('Invalid op field given: {}'.format(op))
        
    def update_preferences(self, event):
        """
        Updates the given User Preferences, if the user is able to do so.
        """
        body = event['body']
        body = json.loads(body)
        
        user = self.mealShareUsers.get_user_cognito_data(event)
        user_id = user['user_id']
        
        success = self.mealSharePreferences.update_preferences(user_id, body)
        if success:
            return {
                'statusCode': 200,
                'statusMessage': 'Successfully updated preferences for user {}'.format(user_id),
                'user_id': user_id
            }
        else:
            return {
                'statusCode': 500,
                'statusMessage': 'FAILED to updated preferences for user {}'.format(user_id),
                'user_id': user_id
            }
            
    def find_matching_users(self, event):
        """
        Find similar users to the requesting user.
        """
        user = self.mealShareUsers.get_user_cognito_data(event)
        user_id = user['user_id']
        
        matching_user_ids = self.mealSharePreferences.find_similar_users(user_id)
        
        if matching_user_ids:
            return {
                'statusCode': 200,
                'statusMessage': 'Found some users to match',
                'matching_user_ids': matching_user_ids
            }
        else:
            return {
                'statusCode': 404,
                'statusMessage': 'No users found',
                'matching_user_ids': matching_user_ids
            }
            
    def upload_avatar(self, event):
        body = event['body']
        body = json.loads(body)
        
        user = self.mealShareUsers.get_user_cognito_data(event)
        user_id = user['user_id']
        file_name = "{}.jpg".format(user_id)
        
        if not 'encoded_image' in body:
            return get_bad_request('POST body missing field encoded_image')
        encoded_image = body['encoded_image']

        url = self.mealShareUploads.upload_encoded(file_name, str.encode(encoded_image))
        return {
            'statusCode': 200,
            'statusMessage': 'Image uploaded',
            'url': url
        }