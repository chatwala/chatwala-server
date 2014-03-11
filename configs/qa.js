module.exports = {
    "db": {
        "mongodb": "mongodb://chatwala-qa:kfCqmBxGNV7ErnGrOK8ODFm8iMRukeqf3quz0ZOiL.o-@ds035747.mongolab.com:35747/chatwala-qa"
    },
    "azure": {
        "partition_key": "chatwalanonprod",
        "currentShardKey":"s1",
        "blobStorageShard" : {
            "s1":{
                "storage_name":"chatwalanonprod",
                "storage_key": "ygOmUO60gJd/zJNbgmvO6D3TsOgqfy506oYXQFr6gPUtt8WTFaeF8PUW831UINLr1Aig+jkVPCQSuX4986Kxrw==",
                "container": "qa-messages",
                "base_url": "http://chatwalanonprod.blob.core.windows.net/qa-messages/"
            }
        },
        "oldStorage": {
            "storage_name":"chatwalaqa",
            "storage_key": "HMFwj6+oly8gx/Tsk3qpzx5/uXCbqgMEDITUASEJu3wJnAhD9f0QaC5G1xf+/WPNDIuD264Z+35x5t16un6kww==",
            "container": "messages"
        },
        "nonShardedBlobStorage" : {
            "storage_name":"chatwalanonprod",
            "storage_key":"ygOmUO60gJd/zJNbgmvO6D3TsOgqfy506oYXQFr6gPUtt8WTFaeF8PUW831UINLr1Aig+jkVPCQSuX4986Kxrw==",
            "container":"qa-pictures",
            "base_url": "https://chatwalanonprod.blob.core.windows.net/qa-pictures/"
        },
        "hub_name" : "chatwala-dev-push",
        "hub_endpoint" : "sb://chatwala-dev-push-ns.servicebus.windows.net/",
        "hub_keyname" : "DefaultFullSharedAccessSignature",
        "hub_key" : "JafmIo0Vf5WEDxikPZZupFNxHvp13nJ5bGXIGrFs/mw="
    },
    "share_base_url": "http://chatwala.com/qa/?"
};