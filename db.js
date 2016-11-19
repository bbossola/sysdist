var database = {}

exports.save = function(key, val, callback) {
    database[key] = val;
    setTimeout(function() {
        callback();
    }, randomTime())
}

exports.load = function(key, callback) {
    setTimeout(function() {
        callback(database[key]);
    }, randomTime())
}

exports.data = function(key) {
    return database;
}

var randomTime = function() {
    return Math.floor(Math.random() * 2000)
}