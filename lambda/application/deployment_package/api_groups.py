import json
import boto3

from groups import MealShareGroups
from users import MealShareUsers

class GroupsApi:
    def __init__(self):
        self.mealShareGroups = MealShareGroups()
        self.mealShareUsers = MealShareUsers()
    
    def get_bad_request(self, status_message):
        return {
            'statusCode': 400,
            'statusMessage': 'Bad Request: {}'.format(status_message)
        }
    
    def get(self):
        groups = self.mealShareGroups.get_all_groups()
        return {
            'groups': groups,
            'statusCode': 200
        }
        
    def post(self, event):
        # Create a group and add the creating user
        body = None
        if 'body' in event:
            body = event['body']
            body = json.loads(body)
        if not body:
            return self.get_bad_request('Post body is empty')
        
        if not 'op' in body or not body['op']:
            return self.get_bad_request('Operation (op) field not specified')
        op = body['op']
        
        if op == 'create':
            return self.create_group(event)
        if op == 'add':
            return self.add_new_member(event)
        if op == 'create_event':
            return self.create_event(event)
        if op == 'read_event':
            return self.get_events(event)
        if op == 'user_events':
            return self.get_events_by_user_id(event)
        
        return self.get_bad_request('Invalid op field given: {}'.format(op))
        
    def create_group(self, event):
        """
        Create a group and add the requesting user to it.
        """
        body = event['body']
        body = json.loads(body)

        # Required field in POST body
        if 'group_name' not in body:
            return get_bad_request('POST body missing group_name')

        group_name = body['group_name']
        user = self.mealShareUsers.get_user_cognito_data(event)
        user_id = user['user_id']
        
        # Add the creator to the group, as the initial member
        group_id = self.mealShareGroups.create_group(group_name)
        success = self.mealShareGroups.add_user_to_group(user_id, group_id)
        if success:
            return {
                'statusCode': 200,
                'statusMessage': 'Successfully created group {} with ID {}'.format(group_name, group_id),
                'group_id': group_id,
                'group_name': group_name,
                'user_id': user_id
            }
        else:
            return {
                'statusCode': 500,
                'statusMessage': 'FAILED to create group {} by user {}'.format(group_name, user_id),
                'group_id': group_id,
                'group_name': group_name,
                'user_id': user_id
            }
            
    def create_event(self, event):
        """
        Create an event on the given group.
        """
        body = event['body']
        body = json.loads(body)

        # Check all required fields are here
        required_fields = ['group_id', 'event_timestamp', 'location']
        for f in required_fields:
            if f not in body:
                return get_bad_request('POST body missing field {}'.format(f))

        group_id = body['group_id']
        event_timestamp = body['event_timestamp']
        event_timestamp = int(event_timestamp)
        location = body['location']
        
        recipe_name = None
        if 'recipe_name' in body:
            recipe_name = body['recipe_name']
        
        event_name = None
        if 'event_name' in body:
            event_name = body['event_name']
        
        
        user = self.mealShareUsers.get_user_cognito_data(event)
        current_user = user['user_id']
        
        # Requesting user must already be a member
        if not self.mealShareGroups.is_user_in_group(current_user, str(group_id)):
            return {
                'statusCode': 401,
                'statusMessage': 'User {} is not a member of the group ID {} and cannot create an event'.format(current_user, group_id),
                'group_id': group_id,
                'user_id': current_user
            }
        
        event_name = self.mealShareGroups.create_event(group_id, event_timestamp, location, recipe_name, event_name)
        if not event_name:
            return {
                'statusCode': 500,
                'statusMessage': 'FAILED to create event for group {} by user {}'.format(group_id, current_user),
                'event_name': None
            }
        else:
            return {
                'statusCode': 200,
                'statusMessage': 'Successfully created {} by {} for {}'.format(event_name, current_user, group_id),
                'group_id': group_id,
                'user_id': current_user,
                'event_name': event_name
            }
    
    def add_new_member(self, event):
        """
        Add a member to a group, by an existing group member.
        """
        body = event['body']
        body = json.loads(body)

        required_fields = ['group_id', 'new_user_id']
        for f in required_fields:
            if f not in body:
                return get_bad_request('POST body missing field {}'.format(f))

        group_id = body['group_id']
        new_user_id = body['new_user_id']
        
        user = self.mealShareUsers.get_user_cognito_data(event)
        current_user = user['user_id']
        
        # Requesting user must already be a member
        if not self.mealShareGroups.is_user_in_group(current_user, str(group_id)):
            return {
                'statusCode': 401,
                'statusMessage': 'User {} is not a member of the group ID {} and can not add a person to it'.format(current_user, group_id),
                'group_id': group_id,
                'new_user_id': new_user_id
            }
        
        # Check if adding was successful
        success = self.mealShareGroups.add_user_to_group(new_user_id, group_id)
        if success:
            return {
                'statusCode': 200,
                'statusMessage': 'Successfully added {} to group {}'.format(new_user_id, group_id),
                'group_id': group_id,
                'new_user_id': new_user_id
            }
        else:
            return {
                'statusCode': 500,
                'statusMessage': 'FAILED to add user {} to group {} by {}'.format(new_user_id, group_id, current_user),
                'group_id': group_id,
                'new_user_id': new_user_id
            }

    def get_events(self, lambda_event):
        """
        Return all the events of the requested group, if the user is a member.
        """
        
        body = lambda_event['body']
        body = json.loads(body)

        required_fields = ['group_id']
        for f in required_fields:
            if f not in body:
                return get_bad_request('POST body missing field {}'.format(f))

        group_id = body['group_id']
        limit = 10
        if 'limit' in body:
            limit = body['limit']
            limit = int(limit)
        
        user = self.mealShareUsers.get_user_cognito_data(lambda_event)
        current_user = user['user_id']
        
        # Requesting user must already be a member
        if not self.mealShareGroups.is_user_in_group(current_user, str(group_id)):
            return {
                'statusCode': 401,
                'statusMessage': 'User {} is not a member of {}'.format(current_user, group_id),
                'group_id': group_id,
                'user_id': current_user
            }
        
        events = self.mealShareGroups.get_events(group_id, limit)
        return {
            'statusCode': 200,
            'events': events,
            'group_id': group_id,
            'user_id': current_user
        }
        
    def get_events_by_user_id(self, lambda_event):
        """
        Get all the upcoming events for the requesting user, to create a calendar.
        """
        user = self.mealShareUsers.get_user_cognito_data(lambda_event)
        current_user = user['user_id']
        events = self.mealShareGroups.get_events_by_user_id(current_user)
        return {
            'statusCode': 200,
            'events': events,
            'user_id': current_user
        }