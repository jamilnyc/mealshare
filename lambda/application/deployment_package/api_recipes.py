import json
import boto3

from users import MealShareUsers
from recipes import MealShareRecipes

class RecipesApi:
    def __init__(self):
        self.mealShareUsers = MealShareUsers()
        self.mealShareRecipes = MealShareRecipes()
    
    def get_bad_request(self, status_message):
        return {
            'statusCode': 400,
            'statusMessage': 'Bad Request: {}'.format(status_message)
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
        
        if op == 'recommend':
            return self.get_recommended_recipes(event)
        
        return self.get_bad_request('Invalid op field given: {}'.format(op))
    
    def get_recommended_recipes(self, event):
        recipes = self.mealShareRecipes.search_vegan(limit=5)
        
        if recipes:
            return {
                'statusCode': 200,
                'recipes': recipes
            }
        else:
            return {
                'statusCode': 404,
                'recipes': [],
                'statusMessage': 'No recipes found'
            }