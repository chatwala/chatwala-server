/**
 * Created by samirahman on 3/21/14.
 */

var GUIDUtil = require('GUIDUtil');
var crc = require('crc');

var guid = GUIDUtil.GUID();

var _crcTable;
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

var crc32 = function(str) {
    var crcTable = _crcTable || (_crcTable = makeCRCTable());
    var crc = 0 ^ (-1);

    for (var i = 0; i < str.length; i++ ) {
        crc = (crc >>> 8) ^ crcTable[(crc ^ str.charCodeAt(i)) & 0xFF];
    }

    return (crc ^ (-1)) >>> 0;
};


console.log("guid=" + guid);


var dec = crc32(guid);
console.log(typeof dec);
console.log(dec);

/*
if(hex.charAt(0)=='0' && hex.charAt(1)=='-') {
    hex = hex.substring(1);
}*/

var radix = dec.toString(36);
console.log("radix="+radix);



