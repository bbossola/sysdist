var db = require('../db.js');
var rift = require('./rift.js');

var valueof = require('./utils.js').valueof
var log_request = require('../logger.js').log_request;

var write_ahead_log = {}

exports.vote_request = function(request, response) {
    var from = request.headers['x-sys-id'];

    var key = request.params.key;
    db.load(key, function(err, dbvalue) {
        log_request(request, "Read executed on db: " + JSON.stringify(dbvalue));
        if (dbvalue != undefined){
            dbvalue.key = key;
            response.json(dbvalue).status(200).send();
        } else {
            response.status(404).send();
        }
    });
};

exports.update = function(request, response) {
    response.status(200).send();
}