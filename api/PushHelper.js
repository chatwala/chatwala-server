/**
 * Created by samirahman on 2/24/14.
 */

var config = require('../config.js');
var azure = require('azure');
var hub = azure.createNotificationHubService(config.azure.hub_name, config.azure.hub_endpoint, config.azure.hub_keyname, config.azure.hub_key);

var PushHelper=(function() {

    var REPLY_MESSAGE = "You have received a new Chatwala reply.";

    function registerPushToken(platform_type, user_id, push_token, callback) {


        // Function called when registration is completed.
        var registrationComplete = function(error, registration) {
            if (!error) {
                // Return the registration.
                console.log("Successfully registered user device for push notifications.");
                callback(null);
            }
            else {
                console.log("Push notification registration failed with error: ", error);
                callback(error);
            }
        };


        // Get existing registrations.
        hub.listRegistrationsByTag(user_id, function (error, existingRegs) {
            var firstRegistration = true;
            if (existingRegs.length > 0) {
                for (var i = 0; i < existingRegs.length; i++) {
                    if (firstRegistration) {
                        existingRegs[i].DeviceToken = push_token;
                        hub.updateRegistration(existingRegs[i], registrationComplete);
                        firstRegistration = false;
                    } else {
                        // We shouldn't have any extra registrations; delete if we do.
                        hub.deleteRegistration(existingRegs[i].RegistrationId, null);
                    }
                }
            } else {
                // Create a new registration.
                if (platform_type === 'ios') {
                    console.log("Starting APNS registration.");
                    var template = '{\"aps\":{\"alert\":\"$(message)\", \"content-available\":\"1\"}}';
                    hub.apns.createTemplateRegistration(push_token,
                        [user_id], template, registrationComplete);
                }
                else if (platform_type === 'android') {
                    console.log("Starting GCM registration.");
                    var template = '{\"message\":\"$(message)\"}';
                    hub.gcm.createTemplateRegistration(push_token,
                        [user_id], template, registrationComplete);
                }
            }
        });
    }


    function sendPush(recipient_id, callback) {
        var payload = {"message": REPLY_MESSAGE};

        hub.send(recipient_id, payload, function (err, result, responseObject) {
            if (err) {
                console.log("Error sending APNS payload to " + recipient_id);
                console.log(err);
                callback(err,null);
            }
            else {
                console.log('successfully sent push notification to user: ' + recipient_id);
                callback(null,null);
            }
        });
    }

    return {
        "registerPushToken": registerPushToken,
        "sendPush": sendPush
    }
}());

module.exports = PushHelper;