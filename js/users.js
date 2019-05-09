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
                'op': 'read',
                'user_id': userId
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
        jQuery('body').append('<h1>' + fullName + '</h1>');
        var imgSrc = "https://s3.amazonaws.com/dam-mealshare/avatars/" + userId + ".jpg";
        jQuery('body').append('<img class="avatar" src=' + imgSrc + ' />');
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
		var events = result.data.events;
                if (events.length > 0) {
                    console.log('Loading Event'); 
                    var event = events[0];
                    jQuery('#next-meal-name').text('Next Meal: ' + event.event_name);
                    var date = new Date(event.event_timestamp * 1000);
                    jQuery('#next-meal-date').text(date.toLocaleDateString('default'));
                    jQuery('#next-meal-time').text(date.toLocaleTimeString('default'));
                    jQuery('#next-meal-location').text(event.location);
                    jQuery('#next-meal-food').text('Food: ' + event.recipe_name);

                    // Load Event Map
                    MealShareApp.initializeMap('home-map', event.event_name, event.location);
                }

		var groupId = events[0].group_id;
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
		    d.setDate(d.getDate() + 1);
		}

		//groups
		// hard 8 because there are 8 groups that show on homepage
		for (var i=0; i < 8; i++){
		    var group_id = '#group-' + (i+1);
		    if (i < groups.length) {    
			jQuery(group_id+' p').text(groups[i].group_name);
		    }
		    else {
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

})();
