var async = require('async');
var rest = require('unirest');
var http = require('http');

var log_request = require('./logger.js').log_request;
var execute_2pc = require('./api_2pc.js').submit;

var database = {}

exports.save = function(key, val) {
		database[key] = val
}

exports.load = function(key) {
		return database[key]
}

exports.data = function(key) {
		return database
}
