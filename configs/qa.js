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
                "message_thumbnail_container" : "qa-pictures",
                "base_url": "https://chatwalanonprod.blob.core.windows.net/"
            }
        },
        "oldStorage": {
            "storage_name":"chatwalaqa",
            "storage_key": "7XPBy0ojEUrW+AZAi2YRGs26UAR4c/f+zLwHZbvsJIrx7LP9KQ1pV4xjvYyOVSIjCnTJ6bO2qld9BzrXBa51Cg==",
            "container": "messages"
        },
        "nonShardedBlobStorage" : {
            "storage_name":"chatwalaqa",
            "storage_key":"7XPBy0ojEUrW+AZAi2YRGs26UAR4c/f+zLwHZbvsJIrx7LP9KQ1pV4xjvYyOVSIjCnTJ6bO2qld9BzrXBa51Cg==",
            "container":"pictures",
            "base_url": "https://chatwalaqa.blob.core.windows.net/pictures/"
        },
        "hub_name" : "chatwala-qa-push",
        "hub_endpoint" : "sb://chatwala-dev-push-ns.servicebus.windows.net/",
        "hub_keyname" : "DefaultFullSharedAccessSignature",
        "hub_key" : "gePyfv/kICC7LLYzvoZHmjO4yXZQoED1xUkjb5mHqsQ=",
        "groundControl" : {
            "storage_name":"chatwalanonprod",
            "storage_key":"ygOmUO60gJd/zJNbgmvO6D3TsOgqfy506oYXQFr6gPUtt8WTFaeF8PUW831UINLr1Aig+jkVPCQSuX4986Kxrw==",
            "container": "qa-configs"
        }
    },
    "share_base_url": "http://chatwala.com/qa/?",
    "short_base_url": "http://chatwala.com/qa/?",
    "returnShortUrls": true

};

