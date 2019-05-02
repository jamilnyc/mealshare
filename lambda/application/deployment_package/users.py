"""
users.py
Class for managing users in the MealShare App
"""
import boto3
from botocore.exceptions import ClientError

class MealShareUsers:
    USERS_TABLE_NAME = 'mealshare_users'
    PREFERENCES_TABLE_NAME = 'mealshare_user_preferences'
    REGION = 'us-east-1'
    USER_POOL_ID = 'us-east-1_KT19Ovd41'

    def __init__(self):
        self.dynamodb = boto3.resource('dynamodb', region_name=self.REGION)
        self.users_table = self.dynamodb.Table(self.USERS_TABLE_NAME)
        self.preferences_table = self.dynamodb.Table(self.PREFERENCES_TABLE_NAME)
        self.cognito_client = boto3.client('cognito-idp')

    def is_valid_user(self, user_id):
        """
        Return whether or not the given user exists.
        """
        key = {
            'user_id': user_id
        }
        try:
            response = self.users_table.get_item(Key=key)
            if 'Item' in response:
                item = response['Item']
                if 'user_id' in item and item['user_id'] == user_id:
                    return True
        except ClientError as e:
            print('ERROR searching for user ID {}'.format(user_id))
            print(e.response['Error']['message'])

        return False

    def get_user_preferences(self, user_id):
        """
        Return the current preferences for this user.
        """
        key = {
            'user_id': user_id
        }
        try:
            response = self.preferences_table.get_item(Key=key)
            if 'Item' in response:
                item = response['Item']
                if 'user_id' in item and item['user_id'] == user_id:
                    return item
        except ClientError as e:
            print('ERROR retrieving user preferences for user {}'.format(user_id))
            print(e.response['Error']['message'])

        return None

    def get_user_data(self, user_id):
        """
        Return the user's personal data (name, email, etc.).
        """
        key = {
            'user_id': user_id
        }
        try:
            response = self.users_table.get_item(Key=key)
            if 'Item' in response:
                item = response['Item']
                if 'user_id' in item and item['user_id'] == user_id:
                    return item
        except ClientError as e:
            print('ERROR getting user data for user {}'.format(user_id))
            print(e.response['Error']['message'])

        return False

    def get_user_cognito_data(self, event):
        """
        Return the username of the user making this authenticated request.
        """
        
        # Extract the unique token in the request
        requestContext = event['requestContext']
        identity = requestContext['identity']
        auth_provider = identity['cognitoAuthenticationProvider']
        sub = auth_provider.split(':CognitoSignIn:')[1]

        # Find a matching user in Cognito
        my_filter = 'sub = "{}"'.format(sub)
        response = self.cognito_client.list_users(
            UserPoolId=self.USER_POOL_ID,
            Limit=1,
            Filter=my_filter
        )
        print(response)
        
        if not 'Users' in response or len(response['Users']) == 0:
            return {}

        # Get the first matching user
        user_data = response['Users'][0]
        user = {
            'user_id': user_data['Username'],
            'attributes': {}
        }

        # Enumerate all their cognito attributes
        for attribute in user_data['Attributes']:
            key = attribute['Name']
            value = attribute['Value']
            user['attributes'][key] = value
        return user