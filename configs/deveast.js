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
                "base_url": "http://chatwalanonprod.blob.core.windows.net/sandbox-messages/"
            }
        },
        "oldStorage": {
            "storage_name":"chatwalaqa",
            "storage_key": "7XPBy0ojEUrW+AZAi2YRGs26UAR4c/f+zLwHZbvsJIrx7LP9KQ1pV4xjvYyOVSIjCnTJ6bO2qld9BzrXBa51Cg==",
            "container": "messages"
        },
        "nonShardedBlobStorage" : {
            "storage_name":"chatwalanonprod",
            "storage_key":"ygOmUO60gJd/zJNbgmvO6D3TsOgqfy506oYXQFr6gPUtt8WTFaeF8PUW831UINLr1Aig+jkVPCQSuX4986Kxrw==",
            "container":"dev-pictures",
            "base_url": "https://chatwalanonprod.blob.core.windows.net/dev-pictures/"
        },
        "hub_name" : "chatwala-dev-push",
        "hub_endpoint" : "sb://chatwala-dev-push-ns.servicebus.windows.net/",
        "hub_keyname" : "DefaultFullSharedAccessSignature",
        "hub_key" : "JafmIo0Vf5WEDxikPZZupFNxHvp13nJ5bGXIGrFs/mw="
    },
    "share_base_url": "http://chatwala.com/sandbox/?"
};