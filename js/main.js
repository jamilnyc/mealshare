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
    
    

})();