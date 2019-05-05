var MealShareApp = window.MealShareApp || {};

(function scopeWrapper($) {

    MealShareApp.createGroup = function(groupName, callback) {
        MealShareApp.useToken(function (token, accessKey, secretKey, sessionToken) {
            var bodyParams = {
                'group_name': groupName,
                'op': 'create'
            };

            var newClientCredentials = MealShareApp.getNewClientCredentials()
            MealShareApp.apiClient = apigClientFactory.newClient(newClientCredentials);
            MealShareApp.apiClient.groupsPost({}, bodyParams, {}).then(function(result) {
                // TODO: Check response structure
                console.log(result)
                if (callback) {
                    callback(result.data);
                }
            }).catch(function(result) {
                console.error('ERROR: Unable to create group');
                console.log(result);
                if (result.status === 401 || result.status === 403) {
                    alert('You are not authorized to perform this action!');
                }
            });
        });
    };
    
    MealShareApp.getEvents = function(groupId, limit, callback) {
        MealShareApp.useToken(function (token, accessKey, secretKey, sessionToken) {
            var bodyParams = {
                'group_id': groupId,
                'limit': limit,
                'op': 'read_event'
            };

            var newClientCredentials = MealShareApp.getNewClientCredentials()
            MealShareApp.apiClient = apigClientFactory.newClient(newClientCredentials);
            MealShareApp.apiClient.groupsPost({}, bodyParams, {}).then(function(result) {
                // TODO: Check response structure
                console.log(result)
                if (callback) {
                    callback(result);
                }
            }).catch(function(result) {
                console.error('ERROR: Unable to load chat message');
                console.log(result);
                if (result.status === 401 || result.status === 403) {
                    alert('You are not authorized to perform this action!');
                }
            });
        }); 
    };
    
    MealShareApp.getCurrentUserEvents = function() {
        MealShareApp.useToken(function (token, accessKey, secretKey, sessionToken) {
            var bodyParams = {
                'op': 'user_events'
            };

            var newClientCredentials = MealShareApp.getNewClientCredentials()
            MealShareApp.apiClient = apigClientFactory.newClient(newClientCredentials);
            MealShareApp.apiClient.groupsPost({}, bodyParams, {}).then(function(result) {
                // TODO: Check response structure
                console.log(result)
            }).catch(function(result) {
                console.error('ERROR: Unable to load chat message');
                console.log(result);
                if (result.status === 401 || result.status === 403) {
                    alert('You are not authorized to perform this action!');
                }
            });
        }); 
    };
    
    MealShareApp.loadRecipes = function(callback) {
        MealShareApp.useToken(function (token, accessKey, secretKey, sessionToken) {
            var bodyParams = {
                'op': 'recommend',
                'limit': 3
            };

            var newClientCredentials = MealShareApp.getNewClientCredentials()
            MealShareApp.apiClient = apigClientFactory.newClient(newClientCredentials);
            MealShareApp.apiClient.recipesPost({}, bodyParams, {}).then(function(result) {
                // TODO: Check response structure
                console.log(result)
                if(callback) {
                    callback(result.data);
                }
            }).catch(function(result) {
                console.error('ERROR: Unable to load recipes');
                console.log(result);
                if (result.status === 401 || result.status === 403) {
                    alert('You are not authorized to perform this action!');
                }
            });
        }); 
    };
})($);