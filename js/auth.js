var MealShareApp = window.MealShareApp || {};

(function scopeWrapper($) {
    /**
     * Returns the Username of the current logged in user or 'Student' if not available.
     *
     * @return {string} Current username.
     */
    MealShareApp.getCurrentUserName = function() {
        var currentUser = MealShareApp.userPool.getCurrentUser();
        var username = 'Student';
        if (currentUser && currentUser.username) {
            username = currentUser.username;
        } 
        
        console.log('Username: ' + username);
        return username;
    };

    
    //------------------------------------------
    // Token Functions
    //------------------------------------------
    
    /**
     * Generates a User Pool token with Cognito if one does not exist and then
     * calls the callback function, passing in the token.
     *
     * If the sesion is not valid, the user is taken to the home page.
     * @param {function} callback  Function that is called after a valid token is found/created.
     */
    MealShareApp.useToken = function(callback) {
        if (MealShareApp.token === null) {
            // Attempt to get a session and make new token
            var cognitoUser = MealShareApp.userPool.getCurrentUser();
            if (cognitoUser !== null) {
                cognitoUser.getSession(function(err, session) {
                    if (err) {
                        // There is no valid logged in session
                        alert('You must be logged in to do that.');
                        console.error(err);
                        window.location = '/';
                    }
                    // This token authorizes you to use the API
                    console.log(session);
                    MealShareApp.token = session.getIdToken().getJwtToken();
                    
                    var providerName = 'cognito-idp.us-east-1.amazonaws.com/' + poolData.UserPoolId;
                    var logins = {};
                    logins[providerName] = MealShareApp.token;
                    // console.log(logins);
                    AWS.config.credentials = new AWS.CognitoIdentityCredentials({
                        IdentityPoolId: poolData.IdentityPoolId,
                        Logins: logins
                    });
                    
                    AWS.config.credentials.get(function(err,data) {
                        if (!err) {
                            var id = AWS.config.credentials.identityId;
                            var key = AWS.config.credentials.accessKeyId;
                            var secKey = AWS.config.credentials.secretAccessKey;
                            var sessionToken = AWS.config.credentials.sessionToken;
                            /**
                            console.log('Cognito Identity ID '+ id);
                            console.log('Cognito Key '+ key);
                            console.log('Cognito Secret Key '+ secKey);
                            console.log('Cognito SessionToken '+ sessionToken);
                            */
                            callback(MealShareApp.token, key, secKey, sessionToken);
                        } else {
                            console.error(err);
                        }
                    });
                    
                });
            }
        } else {
            // At this point you are already logged in and have a valid session
            console.log('Token Exists!');
            callback(MealShareApp.token);
        }
    };
    
    MealShareApp.getNewClientCredentials = function() {
        var newClientCredentials = {
            accessKey: AWS.config.credentials.accessKeyId, //'ACCESS_KEY',
            secretKey: AWS.config.credentials.secretAccessKey, //'SECRET_KEY',
            sessionToken: AWS.config.credentials.sessionToken, // 'SESSION_TOKEN', //If you are using temporary credentials you must include the session token
            region: 'us-east-1' // OPTIONAL: The region where the API is deployed, by default this parameter is set to us-east-1
        };  
        return newClientCredentials;
    };
    
    //------------------------------------------
    // User Login/Logout Functions
    //------------------------------------------
    
    /**
     * Checks the current logged in state and redirects the user based on the
     * given parameters.
     *
     * @param {boolean} redirectOnRec   Redirect the user to the chat page if they are logged in.
     * @param {boolean} redirectOnUnrec Redirect the user to the home page if they are NOT logged in.
     */
    MealShareApp.checkLogin = function(redirectOnRec, redirectOnUnrec) {
        var cognitoUser = MealShareApp.userPool.getCurrentUser();
        if (cognitoUser !== null) {
            if (redirectOnRec) {
                // Valid user is logged in, take them to the chat page
                window.location = '/chat.html';
            }
        } else {
            if (redirectOnUnrec) {
                // No one is logged in take them home, where they sign in
                window.location = '/';
            }
        }
    };
    
    /**
     * Logs the user in with the given username/password.
     * 
     * On successful login, they are redirected to the chat page.
     */
    MealShareApp.login = function() {
        var username = jQuery('#username').val();
        var authenticationData = {
            Username: username,
            Password: jQuery('#password').val()
        }
        
        var authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails(authenticationData);
        var userData = {
            Username: username,
            Pool: MealShareApp.userPool
        };
        
        var cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
        cognitoUser.authenticateUser(authenticationDetails, {
            onSuccess: function(result) {
                var accessToken = result.getAccessToken().getJwtToken();
                var idToken = result.idToken.jwtToken;
                console.log(accessToken);
                console.log(idToken);
                
                alert('Logged in successfully!');
                window.location = '/home.html';
            },
            onFailure: function(err) {
                if (err.message) {
                    // Catches errors like wrong password and unconfirmed user
                    alert('ERROR: ' + err.message);
                } else {
                    alert('ERROR: Unable to login');
                }
                console.error(err);
            }
        });
    };
    
    
    /**
     * Clears the users session and logs them out of the application.
     */
    MealShareApp.logout = function() {
        console.log('Signing out user ' + MealShareApp.getCurrentUserName());
        var cognitoUser = MealShareApp.userPool.getCurrentUser();
        cognitoUser.signOut();
        window.location = '/';
    };

    //------------------------------------------
    // User Sign Up Function
    //------------------------------------------

    /**
     * Creates a user in the User Pool with the given username/password/email
     * and redirects them to the confirmation page to enter their code.
     */
    MealShareApp.signup = function() {
        var username = jQuery('#username').val();
        var password = jQuery('#password').val();
        
        var emailValue = jQuery('#email').val();
        var addressValue = jQuery('#address').val();
        var givenNameValue = jQuery('#given_name').val();
        var familyNameValue = jQuery('#family_name').val();
        var phoneValue = jQuery('#phone').val();
        
        if (!username || !password || !emailValue || !addressValue || !givenNameValue || !familyNameValue || !phoneValue) {
            alert('All fields are required!');
            return;
        }
        
        // Additional attributes to track
        var email = new AmazonCognitoIdentity.CognitoUserAttribute({
            Name: 'email',
            Value: emailValue
        });
        
        var phone = new AmazonCognitoIdentity.CognitoUserAttribute({
            Name: 'phone_number',
            Value: phoneValue
        });
        
        var address = new AmazonCognitoIdentity.CognitoUserAttribute({
            Name: 'address',
            Value: addressValue
        });
        
        var givenName = new AmazonCognitoIdentity.CognitoUserAttribute({
            Name: 'given_name',
            Value: givenNameValue
        });
        
        var familyName = new AmazonCognitoIdentity.CognitoUserAttribute({
            Name: 'family_name',
            Value: familyNameValue
        });
        
        var attributes = [email, address, givenName, familyName, phone];
        MealShareApp.userPool.signUp(username, password, attributes, null, function (err, result) {
           if (err) {
               console.error(err);
               if (err.code == "UsernameExistsException") {
                   alert("This username is taken. Please try another.");
               } else if (err.message != null) {
                   alert(err.message);
               }else {
                   alert('ERROR: There was an error signing you up!');
               }
           } else {
               alert('Sign up successful! Please check your email for a verification Code');
               window.location = '/confirm.html#' + username;
           }
        });
    };
    
    
    //------------------------------------------
    // User Confirmation Functions
    //------------------------------------------
    
    /**
     * Confirms the users registration by processing the emailed code with Cognito.
     */
    MealShareApp.confirm = function() {
        var username = location.hash.substring(1);
        if (username == null || username == '') {
            alert('Sorry. This confirmation URL is invalid.');
            return;
        }
        
        var cognitoUser = new AmazonCognitoIdentity.CognitoUser({
            Username: username,
            Pool: MealShareApp.userPool
        });
        
        var code = jQuery('#code').val();
        cognitoUser.confirmRegistration(code, true, function (err, results) {
           if (err) {
               console.error(err);
               if (err.message) {
                   alert(error.message);
               } else {
                   alert('ERROR: There was an error verifying you, ' + username);
               }
           } else {
               alert('You have been successfully verified!');
               window.location = '/';
           }
        });
    };
    
    /**
     * Resends the confirmation code via email to the user trying to confirm their account.
     */
    MealShareApp.resend = function() {
        var username = location.hash.substring(1);
        var cognitoUser = new AmazonCognitoIdentity.CognitoUser({
            Username: username,
            Pool: MealShareApp.userPool
        });
        
        cognitoUser.resendConfirmationCode(function(err) {
           if (err) {
               alert('ERROR: We could not resend the code.');
               console.error(err);
           } else {
               alert('Confirmation code resent to your email!');
           }
        });
    };
})();