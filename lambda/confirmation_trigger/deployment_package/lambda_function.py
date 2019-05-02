import json
import logging
import time
import boto3

logger = logging.getLogger()
logger.setLevel(logging.DEBUG)

dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
table = dynamodb.Table('mealshare_users')

def get_db_item(event):
    attributes = event['request']['userAttributes']
    user_id = event['userName']
    item = {
        'user_id': user_id,
        'email': attributes['email'],
        'first_name': attributes['given_name'],
        'last_name': attributes['family_name'],
        'address': attributes['address']
    }
    item['phone_number'] = '5555551234'
    if 'phone_number' in attributes:
        item['phone_number'] = attributes['phone_number']
    logger.debug(item)
    return item

def add_user_to_db(event):
    logger.debug('Adding user to DynamoDB')
    item = get_db_item(event)
    table.put_item(Item=item)
    
def lambda_handler(event, context):
    logger.debug(event)
    logger.debug(context)
    add_user_to_db(event)
    return event
