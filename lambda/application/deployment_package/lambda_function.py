"""
This is the main entry point to the MealShare API.
It dispatches requests based on the path and the HTTP Method.
"""

import json
import logging
import time
import decimal

# custom modules
from api_groups import GroupsApi
from api_group_chat import GroupChatApi
from api_user_preferences import UserPreferencesApi
from api_users import UsersApi
from api_recipes import RecipesApi

groupsApi = GroupsApi()
groupChatApi = GroupChatApi()
userPreferencesApi = UserPreferencesApi()
usersApi = UsersApi()
recipesApi = RecipesApi()

logger = logging.getLogger()
logger.setLevel(logging.DEBUG)

# Helper class to convert a DynamoDB item to JSON.
class DecimalEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, decimal.Decimal):
            if o % 1 > 0:
                return float(o)
            else:
                return int(o)
        return super(DecimalEncoder, self).default(o)

def dispatch_group(event, context):
    http_method = event['httpMethod']
    if http_method == 'GET':
        return groupsApi.get()
    if http_method == 'POST':
        return groupsApi.post(event)
    
    return {}
    
def dispatch_group_chat(event, context):
    http_method = event['httpMethod']
    user_id = None
    group_id = None
    body = None
    
    if http_method == 'GET':
        return groupChatApi.get(user_id, group_id)
    elif http_method == 'POST':
        return groupChatApi.post(event)
    return {}
    
def dispatch_user_preferences(event, context):
    http_method = event['httpMethod']
    
    if http_method == 'POST':
        return userPreferencesApi.post(event)
        
    return {}

def dispatch_users(event, context):
    http_method = event['httpMethod']
    if http_method == 'POST':
        return usersApi.post(event)
    return {}

def dispatch_recipes(event, context):
    http_method = event['httpMethod']
    if http_method == 'POST':
        return recipesApi.post(event)
    return {}

def mealshare_dispatch(event, context):
    """
    Dispatches each request based on the resource it is attempting to access.
    """
    resource = event['resource']
    
    if resource == '/groups':
        return dispatch_group(event, context)
    elif resource == '/group-chat':
        return dispatch_group_chat(event, context)
    elif resource == '/user-preferences':
        return dispatch_user_preferences(event, context)
    elif resource == '/users':
        return dispatch_users(event, context)
    elif resource == '/recipes':
        return dispatch_recipes(event, context)
    return {}

def lambda_handler(event, context):
    logger.debug(event)
    logger.debug(context)
    
    response = mealshare_dispatch(event, context)
    body = json.dumps(response, cls=DecimalEncoder)
    print(body)
    statusCode = 200
    if 'statusCode' in response:
        statusCode = response['statusCode']
        
    return {
        'statusCode': statusCode,
        'body': body,
        "headers": {
            "my_header": "my_value",
            "Access-Control-Allow-Origin": "*"
        }
    }
