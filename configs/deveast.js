module.exports = {
    "db": {
        "mongodb": "mongodb://chatwala-dev:OFXd6OICqM8vr.ME3OCbh.l2T9GjAuXFF.7Hp9gDXNE-@ds030607.mongolab.com:30607/chatwala-dev"
    },
    "azure": {
        "partition_key": "chatwalanonprod",
        "currentShardKey":"s1",
        "blobStorageShard" : {
            "s1":{
                "storage_name":"chatwalanonprod",
                "storage_key": "ygOmUO60gJd/zJNbgmvO6D3TsOgqfy506oYXQFr6gPUtt8WTFaeF8PUW831UINLr1Aig+jkVPCQSuX4986Kxrw==",
                "container": "dev-messages",
                "message_thumbnail_container": "dev-pictures",
                "base_url": "https://chatwalanonprod.blob.core.windows.net/"

            }
        },
        "oldStorage": {
            "storage_name": "chatwaladeveast",
            "storage_key": "4f+gAOTgCVGswb1CUSe5N13Xo3bFW1LYwoNweBgeeVRdOpjoMzE69cpUPUVpEmxd0R+FHxxfLdF0fVfQNmil0A==",
            "container": "messages"
        },
        "nonShardedBlobStorage" : {
            "storage_name": "chatwaladeveast",
            "storage_key": "4f+gAOTgCVGswb1CUSe5N13Xo3bFW1LYwoNweBgeeVRdOpjoMzE69cpUPUVpEmxd0R+FHxxfLdF0fVfQNmil0A==",
            "container": "pictures",
            "base_url": "https://chatwaladeveast.blob.core.windows.net/pictures/"
        },
        "hub_name" : "chatwala-dev-push",
        "hub_endpoint" : "sb://chatwala-dev-push-ns.servicebus.windows.net/",
        "hub_keyname" : "DefaultFullSharedAccessSignature",
        "hub_key" : "JafmIo0Vf5WEDxikPZZupFNxHvp13nJ5bGXIGrFs/mw=",
        "groundControl" : {
            "storage_name":"chatwalanonprod",
            "storage_key":"ygOmUO60gJd/zJNbgmvO6D3TsOgqfy506oYXQFr6gPUtt8WTFaeF8PUW831UINLr1Aig+jkVPCQSuX4986Kxrw==",
            "container": "dev-configs"
        }
    },
    "share_base_url": "http://chatwala.com/dev/?",
    "short_base_url": "http://chatwala.com/dev/?",
    "returnShortUrls": true
};