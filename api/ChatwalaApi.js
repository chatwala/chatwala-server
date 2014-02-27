var MessageApi = require("./messageAPI/MessageApi.js");
var UserApi = require("./userAPI/ThreadApi.js");
var ThreadApi = require("./threadAPI/ThreadApi.js");

var ChatwalaApi = {
    "Messages": MessageApi,
    "Users": UserApi,
    "Threads":ThreadApi

};

module.exports = ChatwalaApi;