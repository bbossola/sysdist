var db = require('../db.js');

var write = require('./raft.js').write;

exports.save = function(key, val, callback) {
    write(key, val, function(err) {
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
