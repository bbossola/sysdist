var async = require('async');
var rest = require('unirest');
var http = require('http');

var peers = require('../p2p.js').peers;
var  = require('../p2p.js').host_by_port

var whoami = null;
var status = follower;

var curr_term = 0;
var curr_leader = null;
var last_update_seen = 0;
var votes = {};

const LEADER_TIMEOUT = 1500;

exports.publish = function(key, val, callback) {
    callback("unimplemented!");
}

exports.handle_vote_request = function(from, term, callback) {
    console.log("- vote request received");
    if (!votes[term]) {
        console.log("- voting for "+from+" for term " + term);
        votes[term] = message.from;
        callback(null, true);
    } else {
        console.log("- already voted for term", term);
        callback(null, false);
    }
};

exports.handle_update_request = function(data, callback) {
    callback();
]};


setInterval(function() {
    console.log("Status:", status.name);
    handle(null, function(err) {
        if (err)
            console.log("Error? ", err);
    });
}, 1000);

iam_follower = function() {
    console.log("Follower mode");
    if (Date.now() - last_update_seen > LEADER_TIMEOUT) {
        console.log("No leader detected - switching to candidate mode");
        curr_term++;
        votes[curr_term] = whoami; 
        status = iam_candidate;
        status();
    }
};

iam_candidate = function() {
    console.log("Candidate mode");
};

iam_leader = function() {
    console.log("Leader mode");
};

do_update_all = function(callback) {
    async.parallel(create_tasks_update(), function(err, results) {
        console.log('Update results:', JSON.stringify(results));
    }
]};

create_tasks_propose = function(write_log) {
    tasks = []
    peers().forEach(function(peer) {
        tasks.push(function(callback) {
            var url = "http://" + peer.host + ":" + peer.port + "/quorum/update";
            console.log("Sending %s to url %s", url, JSON.stringify(tx))
            rest.post(url)
//                .headers({
//                     'Content-Type': 'application/json'
//                 })
//                .send(JSON.stringify(write_log))
                .end(function(response) {
                    callback(null, response.statusCode);
                })
        });
    });
    return tasks;
}
randomize = function(amount) {
    var half = amount / 2;
    return half + Math.floor(Math.random() * half);
}


exports.whoami = function(who) {
    whoami = who;
}

