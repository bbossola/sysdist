var db = require('../db.js');
var execute_2pc = require('./2pc.js').submit;

console.log("Using two-phase commit store (2PC)");

exports.save = function(key, val, callback) {
    execute_2pc(key, val, function(success) {
        callback(success);
    });
}

exports.load = function(key, callback) {
 	db.load(key, callback);
}

exports.data = db.data;

