var db = require('../db.js');

var publish = require('./raft.js').publish;

exports.save = function(key, val, callback) {
    publish(key, val, function(err) {
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
