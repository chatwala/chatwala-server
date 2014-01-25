module.exports = {
    "db": {
        "mongodb": "mongodb://MongoLab:KMVJmLeJWPrOr4q64Z__AyRDmPwj4mR_Z90dPkeqFd4-@ds030917-a0.mongolab.com:30917,ds030917-a1.mongolab.com:30916/MongoLab"
    },
    "azure": { 
        "storage_name": "chatwalaprod",
        "storage_key": "/IF7b5QfBEFlzYhkHWodelQBUnsx4/anmEuCzSobXjwlcfacFZYbqutQ0SO1M6mR2n6wFDtynCYN6n2MKfJzsw==",
        "partition_key": "chatwalaprod",
        "hub_name" : "chatwala-prod-push",
        "hub_endpoint" : "sb://chatwala-dev-push-ns.servicebus.windows.net/",
        "hub_keyname" : "DefaultFullSharedAccessSignature",
        "hub_key" : "L51Y1MDKwajeg7dIPVq6WL3prxTodrcDKATMzv4w88M="
    }
};