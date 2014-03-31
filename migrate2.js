/**
 * Module dependencies.
 */

console.log("Initializing node: " + new Date());
var config = require('./config.js');
var azure = require("azure");
var fs=require('fs');
var async = require('async');
var ChatwalaMessageDocuments = require('./api/messagesAPI/ChatwalaMessageDocuments.js');
var SASHelper = require('./api/SASHelper.js');
var GUIDUtil = require('GUIDUtil');

var rimraf = require('rimraf');
var AdmZip = require('adm-zip');
var archiver = require('archiver');
var request = require('request');
var MigrateHelper = require('./api/migrate/MigrateHelper.js');

"use strict";

var CWMongoClient = require('./cw_mongo.js');



var http = require('http');
var path = require('path');

var queue = [];
// all environments

CWMongoClient.getConnection(function (err, db) {
    if (err) {
        console.log("Unable to connect to mongo DB.");
        queue.forEach(function (object) {
            object.res.send(500);
        });
    } else {
        console.log("Launching queued requests");
        queue.forEach(function (object) {
            object.next();
        });
    }

    queue = [];
});


function migrate() {
    var timenow = new Date().getTime();
    console.log("Start Time: " + timenow);
    MigrateHelper.migrateAllWalas();
}

function checkWalasForUserId(user_id){
    CWMongoClient.getConnection(function (err, db) {
        if (err) {
            console.log(err);
            return;
        } else {
            var collection = db.collection('messages');
            var query = {};
            query[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.OWNER_USER_ID] = user_id;
            query[ChatwalaMessageDocuments.MESSAGE_PROPERTIES.OWNER_ROLE] = ChatwalaMessageDocuments.ROLE_RECIPIENT;

            collection.find(
                query,
                {},
                function(err, cursor) {
                    if(err) {
                        var response = new Response();
                        response.response_code = responseCodes["failure"];
                        callback(err, response);
                    }
                    else {
                        cursor.toArray(function(err, documents) {
                            console.log(err);

                            if(documents){
                                console.log("documents: ");
                                console.log(documents);
                                console.log(documents.length);
                                var message_id_array = [];

                                for(var i=0; i<documents.length;i++) {

                                    if(message_id_array.indexOf(documents[i].message_id) < 0){
                                        message_id_array.push(documents[i].message_id);
                                    }
                                }
                                var doesnt_exist = [];

                                checkExists(message_id_array,0,doesnt_exist, function(does_not_exist){
                                   console.log("The following message_id's do not exist on blob storage: ");
                                   console.log(does_not_exist);
                                })

                            }
                            else{
                                console.log("no documents from query");
                                console.log(err);
                            }
                        });

                    }
                }
            )
        }
    });

}

function checkExists(messages_array, index, notExist, callback){
    if(index === messages_array.length){
        callback(notExist);
    }
    var msg_id = messages_array[index];
    var url = "http://chatwalaprodshard1.blob.core.windows.net/messages/" + msg_id;
    console.log(url);
    request(url, function(error, response, body){
        console.log(response.statusCode);
        if (response.statusCode !== 200) {
            notExist.push({
                "code": response.statusCode,
                "message_id": msg_id
            })
        }
        checkExists(messages_array,++index,notExist,callback);
    })

}

migrate();
//checkWalasForUserId("d80ba84b-7785-c219-5ee5-74130eff8e2a");

