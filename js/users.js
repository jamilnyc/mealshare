var MealShareApp = window.MealShareApp || {};

(function scopeWrapper($) {
    MealShareApp.getUserDetails = function(userId) {
        MealShareApp.useToken(function (token, accessKey, secretKey, sessionToken) {
            var bodyParams = {
                'op': 'read',
                'user_id': userId
            };

            var newClientCredentials = MealShareApp.getNewClientCredentials()
            MealShareApp.apiClient = apigClientFactory.newClient(newClientCredentials);
            MealShareApp.apiClient.usersPost({}, bodyParams, {}).then(function(result) {
                console.log(result)
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

})();