var async = require('async');
var rest = require('unirest');
var http = require('http');

var read_quorum = 2
var write_quorum = 1

var peers = require('../p2p.js').peers;
var host_by_port = require('../p2p.js').host_by_port

exports.sloppy_write = function(key, val, callback) {
    var tx = {
        id: make_id(),
        key: key,
        val: val,
        ts: (new Date).getTime()
    }

    console.log('1. sloppy proposal of ' + write_quorum + ' to peers: ', JSON.stringify(tx));
    ask_with_quorum("propose", create_tasks(tx, propose), write_quorum, function(err, responses) {
        if (callback.called)
            return;

        if (has_quorum(responses, write_quorum)) {
            console.log('2. proposal accepted  by quorum of ' + write_quorum);
            tx.quorum = true;
            ask_with_quorum("commit", create_tasks(tx, commit), write_quorum, function(err, responses) {
                if (has_quorum(responses, write_quorum)) {
                    console.log('3. commit accepted  by quorum of ' + write_quorum);
                    callback.called = true;
                    callback(err, tx)
                }
            });
        } else if (!tx.quorum) {
            console.log('2. failure - sending rollback to peers', err);
            ask_with_quorum("rollback", create_tasks(tx, rollback), write_quorum, function(err) {
                callback.called = true;
                callback(err, tx)
            });
        }
    });
};

exports.smart_read = function(key, callback) {
    console.log('1. reading the data "' + key + '" with quorum of ' + read_quorum + ' from peers');
    ask_with_quorum("read", create_tasks(key, read), read_quorum, function(err, responses) {;
        var result = get_agreed_result(responses);
        if (result.response && !callback.called) {
            value = valueof(result.response);
            console.log("2. agreed value '" + value + "' based on " + responses.length + " responses");
            callback.called = true;
            callback(null, value);
        }

        process_disagreement(result);
    });
}

create_tasks = function(arg, task_factory) {
    var tasks = []
    peers().forEach(function(peer) {
        task = task_factory(arg, peer);
        task.id = peer.port;
        tasks.push(task);
    });
    return tasks;
}

propose = function(tx, peer) {
    return function(callback) {
        var url = "http://" + peer.host + ":" + peer.port + "/quorum/propose";
        console.log("Sending %s to url %s", JSON.stringify(tx), url)
        rest.post(url)
            .timeout(10000)
            .headers({
                'Content-Type': 'application/json'
            })
            .send(JSON.stringify(tx))
            .end(function(response) {
                callback(response);
            });
    }
}

commit = function(tx, peer) {
    return function(callback) {
        var url = "http://" + peer.host + ":" + peer.port + "/quorum/commit/" + tx.id;
        rest.post(url).end(function(response) {
            callback(response);
        });
    };
}

rollback = function(tx, peer) {
    return function(callback) {
        var url = "http://" + peer.host + ":" + peer.port + "/quorum/rollback/" + tx.id;
        rest.post(url).end(function(response) {
            callback(response);
        });
    };
}

read = function(key, peer) {
    return function(callback) {
        var url = "http://" + peer.host + ":" + peer.port + "/quorum/read/" + key;
        rest.get(url).end(function(response) {
            callback(response);
        });
    };
}

ask_with_quorum = function(what, tasks, quorum, callback) {

    var votes = 0;
    var responses = [];
    var queue = async.queue(function(task, callback) {
        task(callback);
    }, 3);

    queue.drain = function() {
        if (votes < quorum) {
            var err = "- " + what + ": quorum of " + quorum + " not reached, " + responses.length + " responses, " + votes + " valid votes";
            console.log(err);
            callback(err, responses);
        }
    }

    tasks.forEach(function(task) {
        queue.push(task, function(response) {
            responses.push(response);
            if (response.statusCode == 200 || response.statusCode == 404) {
                votes++;
                console.log("- " + what + ": vote from " + task.id + ": " + response.statusCode);
                if (responses.length >= quorum) {
                    callback(null, responses);
                }
            } else {
                console.log("- " + what + ": vote from " + task.id + ": " + response.statusCode);
            }
        });
    });
}

has_quorum = function(responses, quorum) {
    var total = 0;
    for (var response of responses) {
        if (response.statusCode == 200)
            total++;
    }
    return total == quorum;
}

get_agreed_result = function(responses) {
    var has_value = [];
    var not_found = [];

    console.log("Total responses: " + responses.length);
    for (var response of responses) {
        if (response.statusCode == 200)
            has_value.push(response);
        else if (response.statusCode == 404)
            not_found.push(response);
    }
    console.log("- total 200s:", has_value.length);
    console.log("- total 404s:", not_found.length);

    var response = null;
    var disagreements = [];
    if (not_found.length >= read_quorum) {
        disagreements = has_value;
        response = not_found[0];
    } else if (has_value.length >= read_quorum) {
        disagreements = not_found;

        var results = {};
        for (var response of has_value) {
            value = response.body.val;
            results[value] = response;
        }

        if (Object.keys(results).length > 1) {

        }
    }

    console.log("- value:", valueof(response));
    console.log("- disagreements:", disagreements.length);
    return {
        response: response,
        responses: responses,
        disagreements: disagreements
    };
}

process_disagreement = function(result) {
    console.log('3. disagreements to process: ', result.disagreements.length);
    for (var disagreement of result.disagreements) {
        var port = disagreement.headers['x-sys-id'];
        var host = host_by_port(port);

        var body = result.response.body;
        var url = "http://" + host + ":" + port + "/quorum/repair";
        console.log('- repairing ' + port + ':', JSON.stringify(body))
        rest.post(url)
            .headers({
                'Content-Type': 'application/json'
            })
            .send(JSON.stringify(body))
            .end(function(response) {
                console.log('- response:', response.statusCode)
            });
    }
}

make_id = function() {
    return Math.random().toString(36).substring(2, 5);
}

success = function(err) {
    return !err ? 'success' : err
}

valueof = function(response) {
    if (response && response.statusCode == 200)
        return response.body.val;
    else
        return undefined;
}