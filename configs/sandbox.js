module.exports = {
    "db": {
        "mongodb": "mongodb://chatwala-sandbox:RKjUdLzWpOWD1G1F0a2xgluwt6YJSc9uzACAmP9z5VQ-@ds031088.mongolab.com:31088/chatwala-sandbox"
    },
    "azure": { 
        "partition_key": "chatwalasandbox",
        "currentShardKey":"s1",
        "blobStorageShard" : {
            "s1":{
                "storage_name":"chatwalasandbox",
                "storage_key": "HMFwj6+oly8gx/Tsk3qpzx5/uXCbqgMEDITUASEJu3wJnAhD9f0QaC5G1xf+/WPNDIuD264Z+35x5t16un6kww==",
                "base_url": "https://chatwalasandbox.blob.core.windows.net/messages2/"
            }
        },
        "oldStorage": {
            "storage_name":"chatwalasandbox",
            "storage_key": "HMFwj6+oly8gx/Tsk3qpzx5/uXCbqgMEDITUASEJu3wJnAhD9f0QaC5G1xf+/WPNDIuD264Z+35x5t16un6kww=="
        },
        "nonShardedBlobStorage" : {
            "storage_name":"chatwalaprofilepictures",
            "storage_key":"rAP6UjP+lB9+ApoIJ6KyNTLfrvzkdOPPWaWKoeoCLdu0dG36J8CogDdhPjjxc/5nByMV/nxkTHUCF+FW2vuROg==",
            "container":"sandbox",
            "base_url": "https://chatwalaprofilepictures.blob.core.windows.net/sandbox/"
        },
        "hub_name" : "chatwala-dev-push",
        "hub_endpoint" : "sb://chatwala-dev-push-ns.servicebus.windows.net/",
        "hub_keyname" : "DefaultFullSharedAccessSignature",
        "hub_key" : "JafmIo0Vf5WEDxikPZZupFNxHvp13nJ5bGXIGrFs/mw="
    },
    "share_base_url": "http://chatwala.com/sandbox/?"
};