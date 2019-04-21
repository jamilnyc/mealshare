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
    
    MealShareApp.getGroupDetails = function() {
        // Get group_id from URL
        var groupId = location.hash.substring(1);
        
        // Make request to get group details
        
        // Print group details to the page
        
        // If the user is not part of the group, they are denied access
        jQuery('#group-message-container').show();
    };
    
    MealShareApp.getCurrentGroupId = function() {
        var groupId = location.hash.substring(1);
        if (groupId == null || groupId == '') {
            return null;
        }
        return groupId;
    };
    
    MealShareApp.addGroupMessage = function(newMessage) {
        var groupId = MealShareApp.getCurrentGroupId();
        if (groupId == null) {
            console.error('No group ID found, can not add message');
            return;
        }
        
        MealShareApp.useToken(function (token, accessKey, secretKey, sessionToken) {
            var username = MealShareApp.getCurrentUserName();
            var bodyParams = {
                'group_id': groupId,
                'op': 'write',
                'message': newMessage
            };
            var requestParams = {}

            var newClientCredentials = MealShareApp.getNewClientCredentials()
            MealShareApp.apiClient = apigClientFactory.newClient(newClientCredentials);
            
            MealShareApp.apiClient.groupChatPost(requestParams, bodyParams, requestParams).then(function(result) {
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
    
    MealShareApp.getGroupMessages = function() {
        var groupId = MealShareApp.getCurrentGroupId();
        if (groupId == null) {
            console.error('No group ID found, can not load chats');
            return;
        }
        
        MealShareApp.useToken(function (token, accessKey, secretKey, sessionToken) {
            var username = MealShareApp.getCurrentUserName();
            var bodyParams = {
                'group_id': groupId,
                'op': 'read'
            };
            var requestParams = bodyParams;
            console.log(requestParams);

            console.log('New client');
            var newClientCredentials = MealShareApp.getNewClientCredentials()
            MealShareApp.apiClient = apigClientFactory.newClient(newClientCredentials);
            
            MealShareApp.apiClient.groupChatPost(requestParams, bodyParams, requestParams).then(function(result) {
                // TODO: Check response structure
                console.log(result)
                
                // Call the function that modifies our UI
//                if (receiveCallback != null) {
//                    receiveCallback(botMessage)                    
//                }
            }).catch(function(result) {
                console.error('ERROR: Unable to load chat message');
                console.log(result);
                if (result.status === 401 || result.status === 403) {
                    alert('You are not authorized to perform this action!');
                }
            })
        });
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
    
    MealShareApp.getEvents = function(groupId, limit) {
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
})();