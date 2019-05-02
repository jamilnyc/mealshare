import boto3
from botocore.exceptions import ClientError
from boto3.dynamodb.conditions import Key, Attr

from users import MealShareUsers

class MealSharePreferences:
    VALID_DINING_PREFERENCES = ['Pick Up', 'Drop Off', 'Eat Together']

    USERS_TABLE_NAME = 'mealshare_users'
    PREFERENCES_TABLE_NAME = 'mealshare_user_preferences'
    REGION = 'us-east-1'
    USER_POOL_ID = 'us-east-1_KT19Ovd41'

    def __init__(self):
        self.dynamodb = boto3.resource('dynamodb', region_name=self.REGION)
        self.preferences_table = self.dynamodb.Table(self.PREFERENCES_TABLE_NAME)

    def update_preferences(self, user_id, data):
        dietary_preferences = []
        if 'dietary_preferences' in data and isinstance(data['dietary_preferences'], list):
            for d in data['dietary_preferences']:
                if isinstance(d, str):
                    dietary_preferences.append(d)

        price_range = 3
        if 'price_range' in data and isinstance(data['price_range'], int):
            if data['price_range'] <= 5 and data['price_range'] > 0:
                price_range = data['price_range']
        
        favorite_dish = ''
        if 'favorite_dish' in data and isinstance(data['favorite_dish'], str):
            favorite_dish = data['favorite_dish']
            
        cooking_ability = 5
        if 'cooking_ability' in data and isinstance(data['cooking_ability'], int):
            if data['cooking_ability'] <= 10 and data['cooking_ability'] >= 0:
                cooking_ability = data['cooking_ability']

        dining_preference = self.VALID_DINING_PREFERENCES[0]
        if 'dining_preference' in data and data['dining_preference'] in self.VALID_DINING_PREFERENCES:
            dining_preference = data['dining_preference']

        item = {
            "user_id": user_id,
            "dietary_preferences": dietary_preferences,
            "price_range": price_range,
            "favorite_dish": favorite_dish,
            "cooking_ability": cooking_ability,
            "dining_preference": dining_preference
        }
        response = self.preferences_table.put_item(Item=item)

        if 'ResponseMetadata' in response:
            if 'HTTPStatusCode' in response['ResponseMetadata']:
                if response['ResponseMetadata']['HTTPStatusCode'] == 200:
                    return True
        return False

    def get_preferences(self, user_id):
        key = {
            'user_id': user_id
        }
        try:
            response = self.preferences_table.get_item(Key=key)
            if 'Item' in response:
                item = response['Item']
                if 'user_id' in item and item['user_id'] == user_id:
                    clean_item = item
                    if 'price_range' in item:
                        clean_item['price_range'] = int(item['price_range'])
                    if 'cooking_ability' in item:
                        clean_item['cooking_ability'] = int(item['cooking_ability'])

                    return clean_item
        except ClientError as e:
            print('ERROR getting user data for user {}'.format(user_id))
            print(e.response['Error']['message'])

        return None
        
    def find_similar_users(self, user_id):
        # Query for this user's preferences
        matching_users = []
        user_preferences = self.get_preferences(user_id)
        if not user_preferences:
            return matching_users

        # Get this user's address from user data
        mealShareUsers = MealShareUsers()
        user_data = mealShareUsers.get_user_data(user_id)

        # Find users that have similar price range
        price_range = 3
        if 'price_range' in user_preferences:
            price_range = user_preferences['price_range']
        expression = Key('price_range').eq(price_range)
        index_name = 'price_range-user_id-index'
        try:
            response = self.preferences_table.query(
                IndexName=index_name,
                KeyConditionExpression=expression
            )
            for i in response['Items']:
                if i['user_id'] != user_id:
                    matching_users.append(i['user_id'])
        except ClientError as e:
            print('ERROR finding by price range')
            print(e.response['Error'])

        # Find users that have similar cooking ability or different?
        cooking_ability = 5
        if 'cooking_ability' in user_preferences:
            cooking_ability = user_preferences['cooking_ability']

        # Scan and filter for users with a matching dietary preference
        dietary_preferences = user_preferences['dietary_preferences']
        complete_expression = None
        for d in dietary_preferences:
            if complete_expression:
                fe = Attr('dietary_preferences').contains(d)
                complete_expression = complete_expression or fe
            else:
                complete_expression = Attr('dietary_preferences').contains(d)

        try:
            response = self.preferences_table.scan(FilterExpression=complete_expression)
            for i in response['Items']:
                if i['user_id'] != user_id:
                    matching_users.append(i['user_id'])
        except ClientError as e:
            print('ERROR finding by dietary preferences')
            print(e.response['Error'])

        unique_matching_users = list(set(matching_users))
        return unique_matching_users
