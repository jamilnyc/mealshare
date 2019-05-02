var MealShareApp = window.MealShareApp || {};

(function scopeWrapper($) {
    MealShareApp.updatePreferences = function(preferences) {
        MealShareApp.useToken(function (token, accessKey, secretKey, sessionToken) {
            var bodyParams = preferences
            bodyParams['op'] = 'update'
            var requestParams = {}

            var newClientCredentials = MealShareApp.getNewClientCredentials()
            MealShareApp.apiClient = apigClientFactory.newClient(newClientCredentials);
            
            MealShareApp.apiClient.userPreferencesPost(requestParams, bodyParams, requestParams).then(function(result) {
                // TODO: Check response structure
                console.log(result)

            }).catch(function(result) {
                console.error('ERROR: Unable to load chat message');
                console.log(result);
                if (result.status === 401 || result.status === 403) {
                    alert('You are not authorized to perform this action!');
                }
            })
        });
    };
    
    
    MealShareApp.findPeople = function () {
        MealShareApp.useToken(function (token, accessKey, secretKey, sessionToken) {
            var bodyParams = {}
            bodyParams['op'] = 'find'
            var requestParams = {}

            var newClientCredentials = MealShareApp.getNewClientCredentials()
            MealShareApp.apiClient = apigClientFactory.newClient(newClientCredentials);
            
            MealShareApp.apiClient.userPreferencesPost(requestParams, bodyParams, requestParams).then(function(result) {
                // TODO: Check response structure
                console.log(result)

            }).catch(function(result) {
                console.error('ERROR: Unable to load chat message');
                console.log(result);
                if (result.status === 401 || result.status === 403) {
                    alert('You are not authorized to perform this action!');
                }
            })
        });
    };
    
    MealShareApp.uploadImage = function(encodedImage) {
        MealShareApp.useToken(function (token, accessKey, secretKey, sessionToken) {
            var bodyParams = {
                'op': 'avatar',
                'encoded_image': encodedImage
            }
            var requestParams = {}

            var newClientCredentials = MealShareApp.getNewClientCredentials()
            MealShareApp.apiClient = apigClientFactory.newClient(newClientCredentials);
            
            MealShareApp.apiClient.userPreferencesPost(requestParams, bodyParams, requestParams).then(function(result) {
                // TODO: Check response structure
                console.log(result)

            }).catch(function(result) {
                console.error('ERROR: Unable to load chat message');
                console.log(result);
                if (result.status === 401 || result.status === 403) {
                    alert('You are not authorized to perform this action!');
                }
            })
        });
    };
})();