var db = require('../db.js');
var log_request = require('../logger.js').log_request;

var write_ahead_log = {}

exports.propose = function(request, response) {  
    var tx = request.body;
    if (!is_valid(tx)) {
        response.status(400).json({
            "error": "invalid proposal"
        });
        log_request(request, "invalid proposal: " + JSON.stringify(tx));
        return;
    }

    if (write_ahead_log[tx.key] === undefined) {
        write_ahead_log[tx.key] = tx;
        response.status(200).send();
        log_request(request, "accepted transaction proposal: " + JSON.stringify(tx));
    } else {
        response.status(400).json({
            "error": "a tranasction for key " + tx.key + " is already present"
        });
        log_request(request, "refused transaction proposal: " + JSON.stringify(tx) + " - already in progress");
    }
};

exports.commit = function(request, response) {
    var id = request.params.id;
    var tx = find_transaction(id);

    if (tx != undefined) {
        db.save(tx.key, tx.val, function() {
            delete write_ahead_log[tx.key];
            response.status(200).send();
            log_request(request, "transaction executed: " + JSON.stringify(tx));
        });

    } else {
        response.status(400).json({
            "error": "tranasction id " + id + " not present"
        });
        log_request(request, "transaction not found for id " + id + " - log: " + JSON.stringify(write_ahead_log));
    }
};

exports.rollback = function(request, response) {
    var id = request.params.id;
    var tx = find_transaction(id);

    if (tx != undefined) {
        delete write_ahead_log[tx.key];
        response.status(200).send();
        log_request(request, "transaction rolled back: " + JSON.stringify(tx));
    } else {
        response.status(400).json({
            "error": "transaction id " + id + " not present"
        });
        log_request(request, "transaction not found for id " + id + " - log: " + JSON.stringify(write_ahead_log));
    }
};

find_transaction = function(id) {
    for (var key in write_ahead_log) {
        if (write_ahead_log.hasOwnProperty(key)) {
            var tx = write_ahead_log[key];
            if (tx.id === id) {
                return tx;
            }
        }
    }
}

is_valid = function(tx) {
    return tx != undefined &&
        tx.key != undefined &&
        tx.id != undefined &&
        tx.val != undefined;
}