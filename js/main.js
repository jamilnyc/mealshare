var MealShareApp = window.MealShareApp || {};

(function scopeWrapper($) {
    /**
     * @type {Object} Cognito User Pool that manages the user activities and session.
     */
    MealShareApp.userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
    
    /**
     * @type {string} Token used to authorize responses to the API gateway.
     */
    MealShareApp.token = null;
    
    /**
     * @type {Object} The client that communicates with AWS API Gateway for the chatbot
     */
    MealShareApp.apiClient = apigClientFactory.newClient();
    
    AWS.config.region = 'us-east-1';
    
    
    /**
     * Sends the given user input to the chatbot and calls the callback with
     * the response if successful.
     * 
     * @param {string} userInput The input message typed by the user.
     * @param {function} receiveCallback Callback function that is called when the bot responds.
     */
    MealShareApp.getResponse = function(userInput, receiveCallback) {
        MealShareApp.useToken(function (token, accessKey, secretKey, sessionToken) {
            var requestParams = {};
            var username = MealShareApp.getCurrentUserName();
            
            var postRequest = {};

            console.log('New client');
            var newClientCredentials = {
                accessKey: AWS.config.credentials.accessKeyId, //'ACCESS_KEY',
                secretKey: AWS.config.credentials.secretAccessKey, //'SECRET_KEY',
                sessionToken: AWS.config.credentials.sessionToken, // 'SESSION_TOKEN', //OPTIONAL: If you are using temporary credentials you must include the session token
                region: 'us-east-1' // OPTIONAL: The region where the API is deployed, by default this parameter is set to us-east-1
            };
            console.log(newClientCredentials);
            apiClient = apigClientFactory.newClient(newClientCredentials);
            console.log(apiClient);
            
            apiClient.chatbotPost({}, postRequest, requestParams).then(function(result) {
                // TODO: Check response structure
                var botMessage = result.data.messages[0].unstructured.text;
                console.log("Bot Says: " + botMessage);
                
                // Call the function that modifies our UI
                if (receiveCallback != null) {
                    receiveCallback(botMessage)                    
                }
            }).catch(function(result) {
                console.error('ERROR: Unable to load chat message');
                console.log(result);
                if (result.status === 401 || result.status === 403) {
                    alert('Unauthorized: You must be logged in to do that.');
                }
            })
        });
    };

})();