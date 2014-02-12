var fs = require("fs");
var azure = require("azure");
var GUIDUtil = require('GUIDUtil');
var os = require("os");
var CWMongoClient = require('../cw_mongo.js');
var config = require('../config.js')();
var hub = azure.createNotificationHubService(config.azure.hub_name, config.azure.hub_endpoint, config.azure.hub_keyname, config.azure.hub_key);

var NO_FILES = "files not found";
var NO_BODY = "no post information found for POST /messages";

var utility = require('../utility');

function MessageAPI() {

    if ( arguments.callee._singletonInstance )
        return arguments.callee._singletonInstance;
    arguments.callee._singletonInstance = this;

    this.UknownRecipientMessageSendRequest = function() {

    }

    //PUBLIC Methods
    this.getMessagesReceived = function(strUserID) {
        // ...
    }


    //unknown recipients
    this.startUnknownRecipientMessageSend = function(unknownRecipientMessageSendRequest) {

    }

    this.completeUnknownRecipientMessageSend= function(completeUnknownRecipientMessageSendRequest) {

    }

    this.convertUnknownRecipientMessageToKnownRecipient = function(convertUnknownRecipientMessageToKnownRecipientRequest) {

    }

    //known recipients
    this.startKnownRecipientMessageSend = function(startKnownRecipientMessageSendRequest) {

    }

    this.completeKnownRecipientMessageSend = function(completeKnownRecipientMessageSendRequest) {

    }

    this.flagKnownRecipientMessageAsReceived = function(flagKnownRecipientMessageAsReceivedRequest) {

    }

    //message urls
    this.getMessageUploadURL = function(message_id) {

    }

    this.getMessageDownloadURL = function(message_id) {

    }

    //PRIVATE METHODS
    function sendPushNotificationForMessage() {

    }


}

exports.messageAPI = new MessageAPI();