var MessagesApi = require("./messagesAPI/MessagesApi.js");
var UserApi = require("./userAPI/UserApi.js");
var ThreadApi = require("./threadAPI/ThreadApi.js");

var ChatwalaApi = {
    "Messages": MessagesApi,
    "Users": UserApi,
    "Threads":ThreadApi

};

module.exports = ChatwalaApi;