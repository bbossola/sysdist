var async = require('async');
var rest = require('unirest');
var http = require('http');

var peers = require('../p2p.js').peers;

exports.submit = function(key, val, callback) {
    var tx = {
        id: make_id(),
        key: key,
        val: val
    }

    console.log('1. proposing to peers: ', JSON.stringify(tx));
    async.parallel(create_tasks_propose(tx), function(err, results) {
        console.log('2. propoosal results:', JSON.stringify(results));
        if (is_successful(results)) {
            console.log('3. sending commit to peers...');
            async.parallel(create_tasks_commit(tx), function(err, results) {
                console.log('4. commit results:', JSON.stringify(results));
                callback(is_successful(results))
            });
        }
        else {
            console.log('3. failure - sending rollback to peers');
            async.parallel(create_tasks_rollback(tx), function(err, results) {
                callback(false)
            });
        }
    });
};

create_tasks_propose = function(tx) {
    tasks = []
    peers().forEach(function(peer) {
        tasks.push(function(callback) {
            var url = "http://" + peer.host + ":" + peer.port + "/2pc/propose";
            console.log("Sending %s to url %s", url, JSON.stringify(tx))
            rest.post(url)
                .headers({
                    'Content-Type': 'application/json'
                })
                .send(JSON.stringify(tx))
                .end(function(response) {
                    callback(null, response.statusCode);
                })
        });
    });
    return tasks;
}

create_tasks_commit = function(tx) {
    tasks = []
    peers().forEach(function(peer) {
        tasks.push(function(callback) {
            var url = "http://" + peer.host + ":" + peer.port + "/2pc/commit/" + tx.id;
            rest.post(url).end(function(response) {
                callback(null, response.statusCode);
            })
        });
    });
    return tasks;
}

create_tasks_rollback = function(tx) {
    tasks = []
    peers().forEach(function(peer) {
        tasks.push(function(callback) {
            var url = "http://" + peer.host + ":" + peer.port + "/2pc/rollback/" + tx.id;
            rest.post(url).end(function(response) {
                callback(null, 200);
            })
        });
    });
    return tasks;
}

is_successful = function(results) {
    for (i = 0; i < results.length; i++) {
        if (results[i] != 200)
            return false;
    }

    return true;
}


make_id = function() {
    return Math.random().toString(36).substring(2, 5);
}