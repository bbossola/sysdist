var db = require('../db.js');
var execute_2pc = require('./2pc.js').submit;

exports.save = function(key, val, callback) {
    execute_2pc(key, val, function(error) {
        if (error == undefined) {
            db.save(key, val, callback);
        } else {
            callback(error);
        }
    });
}

exports.load = function(key, callback) {
    db.load(key, callback);
}

exports.data = db.data;