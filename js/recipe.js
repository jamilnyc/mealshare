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
                console.log(result);
                var recipes = result.data.recipes;
                if (recipes.length <= 0) {
                    alert('Unknown recipe');
                    return;
                }

                var recipe = recipes[0];
                jQuery("#recipe-left h2").text(recipe.title);
               	jQuery("#recipe-left img").attr('src', recipe.image); 
                jQuery("#recipe-left a").attr('href', recipe.url);

                MealShareApp.loadRecipeProperties(recipe);
            }).catch(function(result) {
                console.error('ERROR: Unable to load recipe');
                console.log(result);
                if (result.status === 401 || result.status === 403) {
                    alert('You are not authorized to perform this action!');
                }
            });
        }); 
    };

    MealShareApp.loadRecipeProperties = function (recipe) {
        var mapping = {
            'vegan': '#is-vegan-value',
            'vegetarian': '#is-vegetarian-value',
            'dairyFree': '#is-dairy-free-value',
            'glutenFree': '#is-gluten-free-value',
            'healthy': '#is-healthy-value',
            'cheap': '#is-cheap-value'
        };

        var trueValue = '<span class="recipe-true-property">✔</span>';
        var falseValue = '<span class="recipe-false-property">✖</span>';
        for (var property in mapping) {
            if (mapping.hasOwnProperty(property)) {
                // e.g., Is this vegan?
                var cellValue = recipe[property] ? trueValue : falseValue;
                var id = mapping[property];
                jQuery(id).html(cellValue);
            }
        }


        jQuery('#recipe-url').html('Show me how to make it!');
        jQuery('#recipe-url').attr('href', recipe.url);
    };
})();
