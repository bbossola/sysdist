var db = require('../db.js');
var raft = require('./raft.js');
var store = require('./store.js');

var valueof = require('./utils.js').valueof
var log_request = require('../logger.js').log_request;

var write_ahead_log = {}

exports.vote_request = function(request, response) {
    var from = request.body.from;
    var term = request.body.term;

    raft.handle_vote_request(from, term, function(err, yesno) {
        var status = yesno ? 201 : 404;
        response.status(status).end();
    });
};

exports.beat_request = function(request, response) {
    var update = request.body;
    if (update.data) {
        console.log("Beat ", JSON.stringify(update), "\n");
    } else {
        process.stdout.write("Beat "+JSON.stringify(update)+"\r");
    }

    raft.handle_beat_request(update, function(err) {
        response.status(200).end();
    });
}

exports.get_history = function(request, response) {
    var from = request.body;
    store.get_history(from, function(err, result) {
        response.status(200)
            .json(result)
            .end();
    });
}
