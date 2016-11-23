var db = require('../db.js');

var raft = require('./raft.js');

exports.save = function(key, val, callback) {
    raft.write(key, val, function(err, data) {
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

exports.get_history = function(from, callback) {
    var result = {};
    var data = db.data();
    for (var key of Object.keys(data)) {
        val = data[key];
        if (val.term > from.term) {
            result[key] = val;
        } else if (val.term == from.term && val.tick > from.tick) {
            result[key] = val;
        }
    }

    console.log("Update request " + JSON.stringify(from) + " received - result:\n", JSON.stringify(result, null, 2));
    callback(null, result);
}

exports.data = db.data;