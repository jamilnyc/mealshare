var MealShareApp = window.MealShareApp || {};

(function scopeWrapper($) {
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
                $('#group-name h3').text(groupName);
                
                // Load Next Event
                var events = result.data.group_data.events;
                if (events.length > 0) {
                    console.log('Loading Event');
                    var event = events[0];
                    jQuery('#next-meal-name').text('Next Meal: ' + event.event_name);
                    var date = new Date(event.event_timestamp * 1000);
                    jQuery('#next-meal-date').text(date.toLocaleDateString('default'));
                    jQuery('#next-meal-time').text(date.toLocaleTimeString('default'));
                    jQuery('#next-meal-location').text(event.location);
                    jQuery('#next-meal-food').text('Food: ' + event.recipe_name);
                }
                
                // Load Members
                var members = result.data.group_data.members;
                if (members && members.length > 0) {
                    console.log('Adding members');
                    jQuery('#ppl-rec').empty();
                    jQuery('#ppl-rec').append('<h5>Members</h5>');
                    members.forEach(function(member) {
                        var imgSrc = "https://s3.amazonaws.com/dam-mealshare/avatars/" + member + ".jpg";
                        var element = '<div class="person"><p>' + member + '</p><img class="avatar" src="' + imgSrc + '"></div>';
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
                            var element = '<div class="recipe"><p>' + recipe.title + '</p><img src="' + imgSrc + '"></div>';
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
               console.log(message.user_id + ' ' + message.message_timestamp + ': ' + message.message_body);
            });
        }
    }
    
})($);

jQuery('.avatar').on('error', function() {
    console.log('replacing image');
    jQuery(this).attr('src', '/img/notavail.png');
});