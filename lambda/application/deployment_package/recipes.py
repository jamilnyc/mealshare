import requests
import json
import time

class MealShareRecipes:
    URL = 'https://search-mealshare-v5pl4obhpj2lxwujtgkbqrjj3y.us-east-1.es.amazonaws.com'
    INDEX = 'recipes'
    DOCUMENT_TYPE = '_doc'

    S3_URL = 'https://s3.amazonaws.com'

    def get_search_endpoint(self):
        endpoint = "{}/{}/_search".format(self.URL, self.INDEX)
        return endpoint

    def make_query(self, method, params):
        endpoint = self.get_search_endpoint()
        response = None
        if method == 'get':
            response = requests.get(endpoint, params)
        elif method == 'post':
            headers = {
                'Content-Type': 'application/json'
            }
            params = json.dumps(params)
            response = requests.post(url=endpoint, data=params, headers=headers)
            print(response.json())

        return self.get_formatted_results(response.json())

    def basic_search(self, terms, limit=5):
        q = ",".join(terms)
        queryParams = {
            'q': q,
            'size': limit
        }
        return self.make_query('get', queryParams)

    def search_by_flag(self, field_name, limit=5):
        queryParams = {
            'query': {
                'term': {
                    field_name: True
                }
            },
            'size': limit
        }
        return self.make_query('post', queryParams)

    def search_vegan(self, limit=5):
        return self.search_by_flag('vegan', limit)

    def get_random_recipes(self, field_name=None, limit=5):
        random_seed = str(time.time())
        random_seed = random_seed.replace('.', '')
        requestBody = {
            "size": limit,
            "query": {
                "function_score": {
                    "functions": [
                        {
                            "random_score": {
                                "seed": random_seed
                            }
                        }
                    ]
                }
            }
        }

        if field_name:
            requestBody["query"]["function_score"]["query"] = {
                "term": {
                    field_name: True
                }
            }
        return self.make_query('post', requestBody)

    def get_recipe_by_id(self, id):
        queryParams = {
            'query': {
                'term': {
                    '_id': id
                }
            },
            'size': 1
        }
        return self.make_query('post', queryParams)

    def get_formatted_results(self, response):
        results = []
        if 'hits' in response:
            if 'hits' in response['hits']:
                for h in response['hits']['hits']:
                    fields = h['_source']
                    title = fields['title'] if 'title' in fields else 'Recipe {}'.format(h['_id'])
                    cuisine = fields['cuisine'] if 'cuisine' in fields else 'Unknown Cuisine'
                    url = fields['url'] if 'url' in fields else None
                    image = fields['image'] if 'image' in fields else None
                    dairyFree = True if 'dairyFree' in fields and fields['dairyFree'] else False
                    glutenFree = True if 'glutenFree' in fields and fields['glutenFree']  else False
                    cheap = True if 'cheap' in fields and fields['cheap']  else False
                    vegan = True if 'vegan' in fields and fields['vegan']  else False
                    vegetarian = True if 'vegetarian' in fields and fields['vegetarian']  else False
                    veryHealthy = True if 'veryHealthy' in fields and fields['veryHealthy'] else False
                    servings = int(fields['servings']) if 'servings' in fields else 1
                    cookingTime = int(fields['CookingTime']) if 'CookingTime' in fields else 60

                    item = {
                        'id': h['_id'],
                        'title': title,
                        'cuisine': cuisine,
                        'url': url,
                        'image': image,
                        'dairyFree': dairyFree,
                        'glutenFree': glutenFree,
                        'cheap': cheap,
                        'vegan': vegan,
                        'vegetarian': vegetarian,
                        'healthy': veryHealthy,
                        'servings': servings,
                        'cookingTime': cookingTime
                    }
                    results.append(item)
        return results
