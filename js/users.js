var MealShareApp = window.MealShareApp || {};
var mS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
daysInWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

(function scopeWrapper($) {
    MealShareApp.getUserDetails = function(userId) {
        if (!userId) {
            alert('Invalid User ID, can not load data');
            return;
        }

        MealShareApp.useToken(function (token, accessKey, secretKey, sessionToken) {
            var bodyParams = {
                'op': 'home'
            };

            var newClientCredentials = MealShareApp.getNewClientCredentials()
            MealShareApp.apiClient = apigClientFactory.newClient(newClientCredentials);
            MealShareApp.apiClient.usersPost({}, bodyParams, {}).then(function(result) {
                console.log(result.data);      
                MealShareApp.loadUserDetailsFromResponse(result.data); 
           }).catch(function(result) {
                console.error('ERROR: Unable to load user data');
                console.log(result);
                if (result.status === 401 || result.status === 403) {
                    alert('You are not authorized to perform this action!');
                }
            });
        }); 
    };

    MealShareApp.getUserIdFromUrl = function() {
        var urlParams = new URLSearchParams(window.location.search);
        var userId = urlParams.get('userId');
        console.log('User ID: ' + userId);
        return userId;
    };

    MealShareApp.loadUserDetailsFromResponse = function(data) {
        var fullName = data.user_data.first_name + ' ' + data.user_data.last_name;
        var userId = data.user_data.user_id;

        // Load username
        jQuery('#user-info h1').text(fullName);

        // Load image
        var imgSrc = "https://s3.amazonaws.com/dam-mealshare/avatars/" + userId + ".jpg";
        jQuery('#user-info img').attr('src', imgSrc);

        var userPreferences = data.user_data.user_preferences;
        if (!userPreferences) {
            return;
        }

        var favoriteDish = userPreferences.favorite_dish;
        if (favoriteDish) {
            jQuery('#favorite-dish-input').val(favoriteDish);
        }

        var diningPreference = userPreferences.dining_preference;
        if (diningPreference) {
            var id = '#pick-up';
            if (diningPreference == 'Drop Off') {
                id = '#drop-off';
            } else if (diningPreference == 'Eat Together') {
                id = '#eat-together';
            }
            jQuery(id).attr('selected', 'selected');
        }

        var dietaryPreferences = userPreferences.dietary_preferences;
        if (dietaryPreferences) {
            dietaryPreferences.forEach(function(preference) {
                var id = '#' + preference;
                jQuery(id).prop('checked', true);
            });
        }

        var d = new Date();
        var events = data.events;
        console.log(events);
        jQuery('#availability-month').text(mS[d.getMonth()])
        if (events.length > 0) {    
            for (var i=0; i < daysInWeek.length; i++) {        
                var header = '#h-day-'+ (i+1);
                var cell = '#d-day-'+ (i+1);
                jQuery(header).text(daysInWeek[(d.getDay() % 7)]);
                jQuery(cell).text(d.getDate());
            
                
                for(var j= 0; j < events.length; j++) {
                    var event = events[j];
                    var date = new Date(event.event_timestamp * 1000);
                
                    
                    if (d.getFullYear() == date.getFullYear() &&
                        d.getMonth() == date.getMonth() && 
                        d.getDate() == date.getDate()) {
                        jQuery(cell).attr('class', 'shaded')
                    }
                    
                }
                d.setDate(d.getDate() + 1);
            }
        }
       
    };


    // Used on the home page
    MealShareApp.getUserDetailsHome = function() {
        MealShareApp.useToken(function (token, accessKey, secretKey, sessionToken) {
            var bodyParams = {
                'op': 'home'
            };

            var newClientCredentials = MealShareApp.getNewClientCredentials()
            MealShareApp.apiClient = apigClientFactory.newClient(newClientCredentials);
            MealShareApp.apiClient.usersPost({}, bodyParams, {}).then(function(result) {
            console.log(result.data);                
            
            //event
            var groupId = null;
            var events = result.data.events;

            var d = new Date();
            var eventFound = false;
            if (events.length > 0) {
                console.log('Loading Event'); 
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
                            eventFound = true;
                            break
                         }
                }
                // Load Event Map
                if (eventFound) {
                    MealShareApp.initializeMap('home-map', event.event_name, event.location);
                }
            }

            if (!eventFound) {
                    jQuery('#next-meal-name').text('No upcoming events!');
                    jQuery('#next-meal-date').text('Check out your groups');
                    jQuery('#next-meal-time').text('And create an event!');
                    jQuery('#next-meal-location').text('');
                    jQuery('#next-meal-food').text('');
                    jQuery('#home-map').html('<img id="no-map" src="img/no-map.jpg" />');
                }

            var groups = result.data.groups;
            console.log(groups[0].group_name);
            for (var i=0; i < groups.length; i++) {
                if (groups[i].group_id == groupId) {
                jQuery('#next-meal-group').text(groups[i].group_name);
                }   
            }

            //availability 
            var d = new Date();
            jQuery('#availability-month').text(mS[d.getMonth()])    
            for (var i=0; i < daysInWeek.length; i++) {        
                var header = '#h-day-'+ (i+1);
                var cell = '#d-day-'+ (i+1);
                jQuery(header).text(daysInWeek[(d.getDay() % 7)]);
                jQuery(cell).text(d.getDate());
                
                
                for(var j= 0; j < events.length; j++) {
                    var event = events[j];
                    var date = new Date(event.event_timestamp * 1000);
                    console.log(event)
                    
                    if (d.getFullYear() == date.getFullYear() &&
                        d.getMonth() == date.getMonth() && 
                        d.getDate() == date.getDate()) {
                        jQuery(cell).attr('class', 'shaded')
                    }
                    
                }
                
                



                d.setDate(d.getDate() + 1);
            }

            //groups
            // hard 8 because there are 8 groups that show on homepage
            for (var i=0; i < 8; i++) {
                var group_id = '#group-' + (i+1);
                if (i < groups.length) {    
                    // jQuery(group_id + ' p').text(groups[i].group_name);
                    jQuery(group_id)[0].innerHTML = '';
                    jQuery(group_id).append('<p>' + groups[i].group_name + '</p>');
                    var url = '/group.html?groupId=' + groups[i].group_id;
                    jQuery(group_id).append('<a href="' + url + '"><img src="img/group.png"></a>');
                } else {
                    jQuery(group_id).hide();
                }
            }
                        
            
            }).catch(function(result) {
                    console.error('ERROR: Unable to load user data');
                    console.log(result);
                    if (result.status === 401 || result.status === 403) {
                        alert('You are not authorized to perform this action!');
                    }
                });
            }); 
    };

    MealShareApp.goToProfile = function () {
          MealShareApp.useToken(function (token, accessKey, secretKey, sessionToken) {
            var bodyParams = {
                'op': 'home'
            };

            var newClientCredentials = MealShareApp.getNewClientCredentials()
            MealShareApp.apiClient = apigClientFactory.newClient(newClientCredentials);
            MealShareApp.apiClient.usersPost({}, bodyParams, {}).then(function(result) {
                console.log(result.data);
                url = "profile.html?userId=" + result.data.user_id;
                 location.replace(url);
            }).catch(function(result) {
                console.error('ERROR: Unable to load user data');
                console.log(result);
                if (result.status === 401 || result.status === 403) {
                    alert('You are not authorized to perform this action!');
                }
            });
        }); 
    };

    MealShareApp.goToCalendar = function () {
          MealShareApp.useToken(function (token, accessKey, secretKey, sessionToken) {
            var bodyParams = {
                'op': 'home'
            };

            var newClientCredentials = MealShareApp.getNewClientCredentials()
            MealShareApp.apiClient = apigClientFactory.newClient(newClientCredentials);
            MealShareApp.apiClient.usersPost({}, bodyParams, {}).then(function(result) {
                console.log(result.data);
                url = "calendar.html?userId=" + result.data.user_id;
                location.replace(url);

            }).catch(function(result) {
                console.error('ERROR: Unable to load user data');
                console.log(result);
                if (result.status === 401 || result.status === 403) {
                    alert('You are not authorized to perform this action!');
                }
            });
        }); 
    };

    MealShareApp.userCalendarDetails = function () {
        MealShareApp.useToken(function (token, accessKey, secretKey, sessionToken) {
            var bodyParams = {
                'op': 'home'
            };

            var newClientCredentials = MealShareApp.getNewClientCredentials()
            MealShareApp.apiClient = apigClientFactory.newClient(newClientCredentials);
            MealShareApp.apiClient.usersPost({}, bodyParams, {}).then(function(result) {
                console.log(result.data);

                //events
                var events = result.data.events;
                var d = new Date();
                if (events.length > 0) {
                    console.log('Loading Event'); 
                    var event = events[events.length - 1];
                    var date = new Date(event.event_timestamp * 1000);
                    for (var i = 0; i < events.length; i++) {
                        event = events[events.length - 1 - i]
                        var date = new Date(event.event_timestamp * 1000);
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
                                groupId = event.group_id
                                var groups = result.data.groups;
                                for (var j=0; j < groups.length; j++) {
                                    if (groups[j].group_id == groupId) {
                                    jQuery('#next-meal-group').text(groups[j].group_name);
                                    }   
                                }
                                break
                             }
                    }
                }

                var rowCount = jQuery('#calendar tr').length - 1;
                d = new Date();
                d.setDate(1);
                day = d.getDay();
                d.setDate(1 - day);
                numEvents = 0;
                //console.log(events[numEvents].event_timestamp.getFullYear());

                console.log(events.length);
                for (var i = 0; i < rowCount; i++) {
                    row_id = "#tr-" + (i+1)
                    for (var j = 0; j < 7; j++ ){
                        if (numEvents < events.length) {
                            eDate = new Date(events[events.length - 1 - numEvents ].event_timestamp * 1000);
                            if (d.getFullYear() == eDate.getFullYear() &&
                                d.getMonth() == eDate.getMonth() &&
                                d.getDate() == eDate.getDate()) {
                                console.log(eDate.getDate());
                                console.log(d.getDate())
                                cell_id ="#td-" + ((7*i) + (j+1))
                                jQuery(cell_id).attr('class', 'day shaded')
                                numEvents++;
                            } 
                            d.setDate(d.getDate() + 1)
                        } else {
                            break;
                        }
                    }
                }
                

            }).catch(function(result) {
                console.error('ERROR: Unable to load user data');
                console.log(result);
                if (result.status === 401 || result.status === 403) {
                    alert('You are not authorized to perform this action!');
                }
            });
        }); 
    };

    MealShareApp.showEvent = function (day, month, year) {
        MealShareApp.useToken(function (token, accessKey, secretKey, sessionToken) {
            var bodyParams = {
                'op': 'home'
            };

            var newClientCredentials = MealShareApp.getNewClientCredentials()
            MealShareApp.apiClient = apigClientFactory.newClient(newClientCredentials);
            MealShareApp.apiClient.usersPost({}, bodyParams, {}).then(function(result) {
                console.log(result.data);

                var events = result.data.events;
                console.log(day)
                for (var i = 0; i < events.length; i++) {
                    event = events[events.length - 1 - i]
                    var date = new Date(event.event_timestamp * 1000);
                    if (date.getFullYear() == year &&
                        date.getMonth() == month &&
                        date.getDate() == day) {
                        jQuery('#next-meal-name').text('Next Meal: ' + event.event_name);
                        var date = new Date(event.event_timestamp * 1000);
                        jQuery('#next-meal-date').text(date.toLocaleDateString('default'));
                        jQuery('#next-meal-time').text(date.toLocaleTimeString('default'));
                        jQuery('#next-meal-location').text(event.location);
                        jQuery('#next-meal-food').text('Food: ' + event.recipe_name);
                        groupId = event.group_id
                        var groups = result.data.groups;
                        for (var j=0; j < groups.length; j++) {
                            if (groups[j].group_id == groupId) {
                            jQuery('#next-meal-group').text(groups[j].group_name);
                            }   
                        }
                    }
                }

            }).catch(function(result) {
                console.error('ERROR: Unable to load user data');
                console.log(result);
                if (result.status === 401 || result.status === 403) {
                    alert('You are not authorized to perform this action!');
                }
        });
        
    });
}


})();
