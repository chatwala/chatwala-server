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

migrate();


