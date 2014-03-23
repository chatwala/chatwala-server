/**
 * Created by samirahman on 3/21/14.
 */

var GUIDUtil = require('GUIDUtil');
var crc32 = require('buffer-crc32');
var crc = require('crc');

var guid = "s1." + GUIDUtil.GUID();
console.log("guid=" + guid);

var checksum = crc.crc32(guid);
console.log("checksum="+checksum);

//var hex = checksum.toString(16);
var hex = crc.hex32(checksum);

console.log("hex="+ hex);

