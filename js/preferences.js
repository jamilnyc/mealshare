var MealShareApp = window.MealShareApp || {};

(function scopeWrapper($) {
    MealShareApp.uploadedImageData = null;

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
                alert('Preferences Updated!');
                window.location.reload();
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
    
    MealShareApp.uploadImage = function() {
        if (!MealShareApp.uploadedImageData) {
            alert('Please select an image first');
            return;
        }

        MealShareApp.useToken(function (token, accessKey, secretKey, sessionToken) {
            var bodyParams = {
                'op': 'avatar',
                'encoded_image': MealShareApp.uploadedImageData
            }
            var requestParams = {}

            var newClientCredentials = MealShareApp.getNewClientCredentials()
            MealShareApp.apiClient = apigClientFactory.newClient(newClientCredentials);
            
            MealShareApp.apiClient.userPreferencesPost(requestParams, bodyParams, requestParams).then(function(result) {
                // TODO: Check response structure
                console.log(result)
                if (result.data.statusCode == 200) {
                    alert('Upload successful');
                    window.location.reload();
                }
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


jQuery("#pref-edit-option-edit button").on("click", function() {
    jQuery("#avatar-container").show();
    jQuery("#favorite-dish input").attr('disabled', false);
    jQuery("#dining-pref select").prop('disabled', false);
    jQuery("#dietary-pref input").attr('disabled', false);

    jQuery("#pref-edit-option-edit").hide();
    jQuery("#pref-edit-option-save").show();
    $("#pref-edit-option-save").attr('class', 'other');
});

$("#pref-edit-option-save button").on("click", function() {
    // Updating UI
    jQuery("#avatar-container").hide();
    jQuery("#favorite-dish input").attr('disabled', true);

    jQuery("#dining-pref select").prop('disabled', true);
    jQuery("#pref-edit-option-edit").show();
    jQuery("#pref-edit-option-save").hide();
    jQuery("#dietary-pref input").attr('disabled', true);
    $("#pref-edit-option-save").attr('class', 'hidden');

    // Collect preference data
    var dietaryPreferences = [];
    var checkBoxes = jQuery('#dietary-pref input[type="checkbox"]');
    checkBoxes.each(function (index, checkBox) {
        var isChecked = jQuery(checkBox).prop("checked");
        var id = jQuery(checkBox).attr("id");
        if (isChecked) {
            dietaryPreferences.push(id);
        }
    });
    console.log('Dietary Preferences: ' + dietaryPreferences);

    var favoriteDish = jQuery('#favorite-dish-input').val();
    console.log('Favorite Dish: ' + favoriteDish);

    var diningPreference = jQuery("#dining-pref select").val();
    if (!diningPreference) {
        diningPreference = 'Pick Up';
    }

    var preferences = {
        'dietary_preferences': dietaryPreferences,
        'favorite_dish': favoriteDish,
        'dining_preference': diningPreference
    };

    MealShareApp.updatePreferences(preferences);
});


jQuery(function() {
    jQuery("#favorite-dish input").attr('disabled', true);
    jQuery("#dining-pref select").prop('disabled', true);
    jQuery("#dietary-pref input").attr('disabled', true);
});