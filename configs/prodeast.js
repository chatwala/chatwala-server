module.exports = {
    "db": {
        "mongodb": "mongodb://MongoLab:KMVJmLeJWPrOr4q64Z__AyRDmPwj4mR_Z90dPkeqFd4-@ds030917-a0.mongolab.com:30917,ds030917-a1.mongolab.com:30916/MongoLab"
    },
    "azure": {
        "currentShardKey":"s1",
        "blobStorageShard" : {
            "s1":{
                "storage_name":"chatwalaprods1",
                "storage_key": "E9Q1MfTebnbLDp4QnqhtfJwsTv/WJ2kOC4r3Hm9a5IE9UzAVThj9d4kERyIC53m2kZOTJTICU1s7dCpcTgeeSQ==",
                "container":"messages",
                "message_thumbnail_container":"thumbnails",
                "base_url": "https://chatwalaprods1.blob.core.windows.net/"

            }
        },
        "nonShardedBlobStorage" : {
            "storage_name":"chatwalaprod",
            "storage_key": "/IF7b5QfBEFlzYhkHWodelQBUnsx4/anmEuCzSobXjwlcfacFZYbqutQ0SO1M6mR2n6wFDtynCYN6n2MKfJzsw==",
            "container": "pictures",
            "base_url": "https://chatwalaprod.blob.core.windows.net/pictures/"
        },
        "oldStorage": {
            "storage_name":"chatwalaprod",
            "storage_key": "/IF7b5QfBEFlzYhkHWodelQBUnsx4/anmEuCzSobXjwlcfacFZYbqutQ0SO1M6mR2n6wFDtynCYN6n2MKfJzsw==",
            "container": "messages"
        },
        "partition_key": "chatwalaprod",
        "hub_name" : "chatwala-prod-push",
        "hub_endpoint" : "sb://chatwala-dev-push-ns.servicebus.windows.net/",
        "hub_keyname" : "DefaultFullSharedAccessSignature",
        "hub_key" : "L51Y1MDKwajeg7dIPVq6WL3prxTodrcDKATMzv4w88M=",
        "groundControl" : {
            "storage_name":"chatwalaprod",
            "storage_key": "/IF7b5QfBEFlzYhkHWodelQBUnsx4/anmEuCzSobXjwlcfacFZYbqutQ0SO1M6mR2n6wFDtynCYN6n2MKfJzsw==",
            "container": "configs"
        }
    },
    "share_base_url": "http://chatwala.com/?",
    "short_base_url": "http://chatwala.com/?",
    "returnShortUrls": false
};