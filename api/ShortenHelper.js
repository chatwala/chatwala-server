var azure = require("azure");
var config = require('../config.js');

var ShortenHelper=(function() {
    var toBase = function (decimal, base) {
        var symbols =
            "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_-".split("");

        var conversion = "";

        if (base > symbols.length || base <= 1) {
            return false;
        }

        while (decimal >= 1) {
            conversion = symbols[(decimal - (base * Math.floor(decimal / base)))] +
                conversion;
            decimal = Math.floor(decimal / base);
        }

        return (base < 11) ? parseInt(conversion) : conversion;
    }

    var makeCRCTable = function(){
        var c;
        var crcTable = [];
        for(var n =0; n < 256; n++){
            c = n;
            for(var k =0; k < 8; k++){
                c = ((c&1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
            }
            crcTable[n] = c;
        }
        return crcTable;
    }

    var _crcTable = makeCRCTable();

    var crc32 = function(str) {
        var crc = 0 ^ (-1);

        for (var i = 0; i < str.length; i++ ) {
            crc = (crc >>> 8) ^ _crcTable[(crc ^ str.charCodeAt(i)) & 0xFF];
        }

        return (crc ^ (-1)) >>> 0;
    };

    var createShortId=function(message_id) {
        var checksum = crc32(message_id);
        return toBase(checksum, 64);
    };

    var incrementShortId=function(shortId, increment) {
        var hexInc = toBase(increment, 64);
        return (hexInc +"" + shortId);
    };

    return {
        "createShortId": createShortId,
        "incrementShortId":incrementShortId
    };

}());

module.exports=ShortenHelper
