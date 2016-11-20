var db = require('../db.js');

var valueof = require('./utils.js').valueof

var smart_read = require('./quorum.js').smart_read;
var sloppy_write = require('./quorum.js').sloppy_write;

exports.save = function(key, val, callback) {
    sloppy_write(key, val, function(err, tx) {
        if (!err) {
            db.save(key, valueof(tx), callback);
        } else {
            callback(err);
        }
    });
}

exports.load = function(key, callback) {
    smart_read(key, function(err, val) {
        callback(err, val)
    });
}

exports.data = db.data;