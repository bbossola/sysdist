var clone = require('./clone.js').clone;

var database = {}

var wait_time = 500;
exports.slowness = function(amount) {
    wait_time = amount;
}

exports.save = function(key, val, callback) {
    database[key] = clone(val);
    setTimeout(function() {
        callback(null);
    }, randomTime())
}

exports.load = function(key, callback) {
    setTimeout(function() {
        callback(null, clone(database[key]));
    }, randomTime())
}

exports.data = function(key) {
    return database;
}

var randomTime = function() {
    return wait_time/2 + Math.floor(Math.random() * wait_time)
}
