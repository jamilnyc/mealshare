var MealShareApp = window.MealShareApp || {};

(function scopeWrapper($) {
    MealShareApp.getUserGroups = function() {
        groups = [
            {"group_id": "1", "group_name": "My Group 1"},
            {"group_id": "2", "group_name": "My Group 2"}          
        ];
        
        groups.forEach(function (group, index) {
            var groupName = group['group_name'];
            var groupUrl = '/groups.html#' + group['group_id'];
            console.log('Adding group ' + groupName);
            var listItem = '<li><a href="' + groupUrl + '">' + groupName + '</a></li>';
            jQuery('#my-groups-list').append(listItem);
        });
        
        jQuery('#my-groups-container').show();
    };
    
   
    
    MealShareApp.createGroup = function(groupName) {
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
            }).catch(function(result) {
                console.error('ERROR: Unable to load chat message');
                console.log(result);
                if (result.status === 401 || result.status === 403) {
                    alert('You are not authorized to perform this action!');
                }
            });
        });
    };
    
    MealShareApp.addMemberToGroup = function(userId, groupId) {
        MealShareApp.useToken(function (token, accessKey, secretKey, sessionToken) {
            var bodyParams = {
                'group_id': groupId,
                'new_user_id': userId,
                'op': 'add'
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
    
    MealShareApp.createEvent = function(groupId, eventTimestamp, location, recipeName, eventName) {
        MealShareApp.useToken(function (token, accessKey, secretKey, sessionToken) {
            var bodyParams = {
                'group_id': groupId,
                'event_timestamp': eventTimestamp,
                'location': location,
                'recipe_name': recipeName, 
                'event_name': eventName,
                'op': 'create_event'
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