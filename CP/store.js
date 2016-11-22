var db = require('../db.js');

var write = require('./raft.js').write;

exports.save = function(key, val, callback) {
    write(key, val, function(err, data) {
        if (!err) {
            if (data) {
                db.save(key, data, callback);
            } else {
                callback(null);
            }
        } else {
            callback(err);
        }
    });
}

exports.load = function(key, callback) {
    db.load(key, callback);
}

exports.data = db.data;
