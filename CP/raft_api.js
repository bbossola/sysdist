var db = require('../db.js');
var raft = require('./raft.js');

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

exports.update = function(request, response) {
    var update = request.body;
    if (update.data) {
        console.log("Update: "+JSON.stringify(update));
    } else {
        process.stdout.write("Update: "+JSON.stringify(update)+"\r");
    }

    raft.handle_update_request(update, function(err) {
        response.status(200).end();
    });
}
