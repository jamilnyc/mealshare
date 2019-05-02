var MealShareApp = window.MealShareApp || {};

(function scopeWrapper($) {
    MealShareApp.getUserData = function(userId) {
        MealShareApp.useToken(function (token, accessKey, secretKey, sessionToken) {
            var bodyParams = {
                'op': 'read',
                'user_id': userId
            };

            var newClientCredentials = MealShareApp.getNewClientCredentials()
            MealShareApp.apiClient = apigClientFactory.newClient(newClientCredentials);
            MealShareApp.apiClient.usersPost({}, bodyParams, {}).then(function(result) {
                // TODO: Check response structure
                console.log(result)
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