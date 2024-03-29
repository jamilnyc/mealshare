var MealShareApp = window.MealShareApp || {};

(function scopeWrapper($) {
    MealShareApp.messageContainer = jQuery('.msg-group');

    MealShareApp.getCurrentGroupId = function() {
        var urlParams = new URLSearchParams(window.location.search);
        var groupId = urlParams.get('groupId');
        console.log('Group ID: ' + groupId);
        return groupId;
    };
    
    MealShareApp.getGroupDetails = function() {
        // Get group_id from URL
        groupId = MealShareApp.getCurrentGroupId();
        if (!groupId) {
            alert('Invalid Group ID detected!');
            window.location = '/home.html';
            return;
        }
        
        MealShareApp.useToken(function (token, accessKey, secretKey, sessionToken) {
            var bodyParams = {
                'op': 'details',
                'group_id': groupId
            };

            var newClientCredentials = MealShareApp.getNewClientCredentials()
            MealShareApp.apiClient = apigClientFactory.newClient(newClientCredentials);
            MealShareApp.apiClient.groupsPost({}, bodyParams, {}).then(function(result) {
                console.log(result);
                // TODO: Error checking
                
                // Load Group Name
                var groupName = result.data.group_data.group_name;
                $('#group-name h3').text('Your Group: ' + groupName);
                
                // Load Next Event
                var events = result.data.group_data.events;
                var d = new Date();
                var nextEventExists = false;
                if (events.length > 0) {
                    // Get the event furthest out
                    var event = events[events.length - 1];
                    var date = new Date(event.event_timestamp * 1000);

                    for (var i = 0; i < events.length; i++) {
                        event = events[events.length - 1 - i]
                        var date = new Date(event.event_timestamp * 1000);
                        console.log(date)
                        if ( (d.getFullYear() == date.getFullYear() &&
                              d.getMonth() == date.getMonth() && 
                              d.getDate() < date.getDate()) || 
                             (d.getFullYear() == date.getFullYear() &&
                              d.getMonth() < date.getMonth()) ||
                             (d.getFullYear() < date.getFullYear())) {
                                jQuery('#next-meal-name').text('Next Meal: ' + event.event_name);
                                var date = new Date(event.event_timestamp * 1000);
                                jQuery('#next-meal-date').text(date.toLocaleDateString('default'));
                                jQuery('#next-meal-time').text(date.toLocaleTimeString('default'));
                                jQuery('#next-meal-location').text(event.location);
                                jQuery('#next-meal-food').text('Food: ' + event.recipe_name);
                                groupId = event.group_id;
                                nextEventExists = true;
                                break;
                             }
                    }

                    if (nextEventExists) {
                        MealShareApp.initializeMap('next-meal-map', event.event_name, event.location);
                    }
                }

                if (!nextEventExists) {
                    jQuery('#next-meal-name').text('No upcoming events!');
                    jQuery('#next-meal-date').text('Pick a date');
                    jQuery('#next-meal-time').text('Choose a time');
                    jQuery('#next-meal-location').text('Find a place');
                    jQuery('#next-meal-food').text('And create it below!');
                    jQuery('#next-meal-map').html('<img id="no-map" src="img/no-map.jpg" />');
                }


                // Load Members
                var members = result.data.group_data.members;
                if (members && members.length > 0) {
                    console.log('Adding members');
                    jQuery('#ppl-rec').empty();
                    jQuery('#ppl-rec').append('<h5>Members</h5>');
                    members.forEach(function(member) {
                        var imgSrc = "https://s3.amazonaws.com/dam-mealshare/avatars/" + member + ".jpg";
                        var url = '/profile.html?userId=' + member;
                        var element = '<div class="person"><p>' + member + 
                        '<a href="' + url + '"></p><img class="avatar" src="' + imgSrc + '"></a></div>';
                        jQuery('#ppl-rec').append(element);
                    });
                }
                
                // Load Recent Messages
                var recentMessages = result.data.group_data.recent_messages;
                MealShareApp.populateRecentMessages(recentMessages);
                
                // Load Recipes
                var callback = function(data) {
                    console.log('loading recipes');
                    console.log(data);
                    if (data.recipes) {
                        jQuery('#recipe-rec').empty();
                        jQuery('#recipe-rec').append('<h5>Recommended Recipes</h5>');
                        data.recipes.forEach(function(recipe) {
                            var imgSrc = recipe.image;
                            var url = '/recipe.html?recipeId=' + recipe.id;
                            var element = '<div class="recipe"><p>' + recipe.title + 
                                '<a href="' + url + '"></p><img src="' + imgSrc + '"></a></div>';
                            jQuery('#recipe-rec').append(element);
                        });
                    }
                };
                MealShareApp.loadRecipes(callback);

                
            }).catch(function(result) {
                console.log(result);
                if (result.status === 401 || result.status === 403) {
                    alert('You are not authorized to perform this action!');
                }
            });
        }); 
    };
    
    MealShareApp.populateRecentMessages = function(recentMessages) {
        if (recentMessages && recentMessages.length > 0) {
            recentMessages.forEach(function(message) {
                var date = new Date(message.message_timestamp * 1000)
                var dateString = date.toLocaleDateString('default') + ' @ ' + date.toLocaleTimeString('default');
                var messageContent = "<b>" + message.user_id + "</b>" + ' ' + dateString + ': ' + message.message_body;
                console.log(messageContent);
                MealShareApp.messageContainer.prepend("<p>" + messageContent + "</p>");
            });
        }
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
                var message = result.data.message;
                var date = new Date(message.message_timestamp * 1000)
                var dateString = date.toLocaleDateString('default') + ' @ ' + date.toLocaleTimeString('default');
                var messageContent = message.user_id + ' ' + dateString + ': ' + message.message_body;
                MealShareApp.messageContainer.append("<p>" + messageContent + "</p>");
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
            }).catch(function(result) {
                console.error('ERROR: Unable to load chat message');
                console.log(result);
                if (result.status === 401 || result.status === 403) {
                    alert('You are not authorized to perform this action!');
                }
            })
        });
    };

    MealShareApp.addMemberToGroup = function(userId, groupId, callback) {
        if (!userId || !groupId) {
            alert('Please provide a valid user ID and group ID');
            return;
        }

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
                if (callback) {
                    callback(result.data);
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

    MealShareApp.createEvent = function(groupId, eventTimestamp, location, recipeName, eventName, callback) {
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
                if(callback) {
                    callback(result.data);
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
    
})($);


jQuery(function() {
    jQuery('#sendButton').on('click', function() {
        var message = jQuery('#userInput').val();
        jQuery('#userInput').val('');
        MealShareApp.addGroupMessage(message);
    });
});


jQuery('#add-member-button').on('click', function() {
    userId = jQuery('#add-member-name').val();
    groupId = MealShareApp.getCurrentGroupId();
    var callback = function(data) {
        console.log(data);
        if (data.statusCode == 200) {
            alert('User ' + userId + ' successfully added to group ' + groupId);
            window.location.reload();
        }
    };
    MealShareApp.addMemberToGroup(userId, groupId, callback);
});

jQuery('#create-event-button').on('click', function() {
    var groupId = MealShareApp.getCurrentGroupId();
    
    var event_date =  jQuery('#create-event-date').val();
    var event_time = jQuery('#create-event-time').val();
    var cDate = new Date(event_date + " " + event_time);
    
    var timestamp = cDate.getTime()/1000;
    var eventName = jQuery('#create-event-name').val();
    var eventLocation = jQuery('#create-event-location').val();
    var food = jQuery('#create-event-food').val();
    var callback = function(data) {
        console.log(data);
        if (data.statusCode == 200) {
            alert('Event Created Successfully!');
            window.location.reload();
        }
    };
    MealShareApp.createEvent(groupId, timestamp, eventLocation, food, eventName, callback);
});