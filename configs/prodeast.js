module.exports = {
    "db": {
        "mongodb": "mongodb://MongoLab:KMVJmLeJWPrOr4q64Z__AyRDmPwj4mR_Z90dPkeqFd4-@ds030917-a0.mongolab.com:30917,ds030917-a1.mongolab.com:30916/MongoLab"
    },
    "azure": {
        "currentShardKey":"s1",
        "blobStorageShard" : {
            "s1":{
                "storage_name":"chatwalaprodshard1",
                "storage_key": "lBfjsBY8UN/PoS2UemfLml1I1suTdz2SLotdRoetJ709wh5ObA9ZaF1qPPSERV6CmklrRV198UqffDCrwtO3EA==",
                "container":"messages",
                "base_url": "https://chatwalaprodshard1.blob.core.windows.net/messages/"
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
        "hub_key" : "L51Y1MDKwajeg7dIPVq6WL3prxTodrcDKATMzv4w88M="
    },
    "share_base_url": "http://chatwala.com/?"
};