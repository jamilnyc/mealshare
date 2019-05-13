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
        if op == 'read':
            return self.get_recipe_by_id(event)
        
        return self.get_bad_request('Invalid op field given: {}'.format(op))
    
    def get_recommended_recipes(self, event):
        body = event['body']
        body = json.loads(body)
        limit = body['limit'] if 'limit' in body else 5
        recipes = self.mealShareRecipes.get_random_recipes(field_name='vegetarian', limit=limit)
        
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
            
    def get_recipe_by_id(self, event):
        body = event['body']
        body = json.loads(body)
        
        if 'recipe_id' not in body:
            return get_bad_request('POST body missing recipe_id')
        
        recipe_id = body['recipe_id']
        recipes = self.mealShareRecipes.get_recipe_by_id(recipe_id)
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