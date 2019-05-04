var MealShareApp = window.MealShareApp || {};

(function scopeWrapper($) {
    MealShareApp.getRecipeIdFromUrl = function() {
        var urlParams = new URLSearchParams(window.location.search);
        var userId = urlParams.get('recipeId');
        console.log('Recipe ID: ' + userId);
        return userId;
    };

    MealShareApp.loadRecipeDetail = function(recipeId) {
        MealShareApp.useToken(function (token, accessKey, secretKey, sessionToken) {
            var bodyParams = {
                'op': 'read',
                'recipe_id': recipeId
            };

            var newClientCredentials = MealShareApp.getNewClientCredentials()
            MealShareApp.apiClient = apigClientFactory.newClient(newClientCredentials);
            MealShareApp.apiClient.recipesPost({}, bodyParams, {}).then(function(result) {
                // TODO: Check response structure
                console.log(result);
                var recipes = result.data.recipes;
                if (recipes.length <= 0) {
                    alert('Unknown recipe');
                    return;
                }

                var recipe = recipes[0];
                jQuery('body').append('<h1>' + recipe.title + '</h1>');
                jQuery('body').append('<img src="' + recipe.image + '" />');
                
            }).catch(function(result) {
                console.error('ERROR: Unable to load recipe');
                console.log(result);
                if (result.status === 401 || result.status === 403) {
                    alert('You are not authorized to perform this action!');
                }
            });
        }); 
    };
})();