module.exports = {
    "db": {
        "mongodb": "mongodb://chatwala-sandbox:RKjUdLzWpOWD1G1F0a2xgluwt6YJSc9uzACAmP9z5VQ-@ds031088.mongolab.com:31088/chatwala-sandbox"
    },
    "azure": { 
        "partition_key": "chatwalanonprod",
        "currentShardKey":"s1",
        "blobStorageShard" : {
            "s1":{
                "storage_name":"chatwalanonprod",
                "storage_key": "ygOmUO60gJd/zJNbgmvO6D3TsOgqfy506oYXQFr6gPUtt8WTFaeF8PUW831UINLr1Aig+jkVPCQSuX4986Kxrw==",
                "container": "sandbox-messages",
                "message_thumbnail_container": "sandbox-pictures",
                "base_url": "https://chatwalanonprod.blob.core.windows.net/"
            }
        },
        "oldStorage": {
            "storage_name":"chatwalasandbox",
            "storage_key": "HMFwj6+oly8gx/Tsk3qpzx5/uXCbqgMEDITUASEJu3wJnAhD9f0QaC5G1xf+/WPNDIuD264Z+35x5t16un6kww==",
            "container": "messages"
        },
        "nonShardedBlobStorage" : {
            "storage_name":"chatwalanonprod",
            "storage_key":"ygOmUO60gJd/zJNbgmvO6D3TsOgqfy506oYXQFr6gPUtt8WTFaeF8PUW831UINLr1Aig+jkVPCQSuX4986Kxrw==",
            "container":"sandbox-pictures",
            "base_url": "https://chatwalanonprod.blob.core.windows.net/sandbox-pictures/"
        },
        "hub_name" : "chatwala-dev-push",
        "hub_endpoint" : "sb://chatwala-dev-push-ns.servicebus.windows.net/",
        "hub_keyname" : "DefaultFullSharedAccessSignature",
        "hub_key" : "JafmIo0Vf5WEDxikPZZupFNxHvp13nJ5bGXIGrFs/mw=",
        "groundControl" : {
            "storage_name":"chatwalanonprod",
            "storage_key":"ygOmUO60gJd/zJNbgmvO6D3TsOgqfy506oYXQFr6gPUtt8WTFaeF8PUW831UINLr1Aig+jkVPCQSuX4986Kxrw==",
            "container": "sandbox-configs"
        }
    },
    "share_base_url": "http://chatwala.com/sandbox/?",
    "short_base_url": "http://chatwala.com/sandbox/?",
    "returnShortUrls": true
};