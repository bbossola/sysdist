var db = require('../db.js');

var publish_log = require('./raft.js').publish_log;

exports.save = function(key, val, callback) {
    publish_log(key, val, function(err) {
        if (!err) {
            db.save(key, val, callback);
        } else {
            callback(err);
        }
    });
}

exports.load = function(key, callback) {
    db.load(key, callback);
}

exports.data = db.data;
