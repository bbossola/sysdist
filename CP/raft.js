var async = require('async');
var rest = require('unirest');
var http = require('http');

var peers = require('../p2p.js').peers;

var status = {name: "noop"};
var myport = null;

var curr_term = 0;
var curr_leader = null;
var curr_votes = {};
var leader_timeout = 0;

const MAX_LEADER_TIMEOUT = 5000;

(function loop() {
    var rand = Math.round(Math.random() * (1000)) + 500;
    setTimeout(function() {
            status();
            loop();
    }, rand);
}());

exports.whoami = function(port) {
    myport = port;
    switch_status(me_follower);
}

exports.publish_log = function(key, val, callback) {
    callback("unimplemented!");
}

exports.handle_vote_request = function(from, term, callback) {
    console.log("- vote request received");

    var votes = curr_votes[term] || {};
    if (!votes[myport]) {
        console.log("- voting for " + from + " in term " + term);
        votes[myport] = from;
        callback(null, true);
    } else {
        console.log("- already voted in term " + term + " for " + votes[term]);
        callback(null, false);
    }
};

exports.handle_update_request = function(from, term, callback) {
    leader_timeout = Date.now() + MAX_LEADER_TIMEOUT;
    curr_term = term;
    curr_leader = from;
    callback();
};


me_follower = function() {
    if (Date.now() > leader_timeout) {
        console.log("No leader detected - switching to candidate mode");
        curr_term++;
        switch_status(me_candidate);
        do_request_votes(curr_term);
    }
};

me_candidate = function() {
};

me_leader = function() {
    do_send_update({});
};

do_request_votes = function(term) {
    var votes = curr_votes[term] || {};
    votes[myport] = myport;
    var majority = Math.floor(peers().length / 2) + 1;
    async.parallel(create_vote_requests(votes), function(err) {
        console.log('Election results:', votes);
        console.log('- %d vote received out of %d required', numberOf(votes), majority);
        if (numberOf(votes) < majority) {
            console.log('- failed :(');
            switch_status(me_follower);
        } else {
            console.log('- success!');
            switch_status(me_leader);
        }
        leader_timeout = Date.now() + MAX_LEADER_TIMEOUT;
        console.log()
    });
};

create_vote_requests = function(votes) {
    console.log("Challenging to be a leader in term "+curr_term);

    var vote_request = {from: myport, term: curr_term};
    var tasks = [];
    peers().forEach(function(peer) {
        tasks.push(function(callback) {
            var url = "http://" + peer.host + ":" + peer.port + "/raft/voteforme";
            console.log("- requesting vote to peer", url);
            rest.post(url)
                .headers({
                    'Content-Type': 'application/json'
                })
                .send(JSON.stringify(vote_request))
                .end(function(response) {
                    if (response.statusCode == 201) {
                        votes[response.headers['x-sys-id']] = true;
                    } else {
                        console.log("ERR:", response.statyusCode);
                    }
                    callback(null);
                });
        })
    });
    return tasks;
}

do_send_update = function(write_log) {
    console.log('Sending updates to the crowd');
    async.parallel(create_updates(write_log), function(err) {
    });
};

create_updates = function(write_log) {
    var update = {from: myport, term: curr_term};
    var tasks = [];
    peers().forEach(function(peer) {
        tasks.push(function(callback) {
            var url = "http://" + peer.host + ":" + peer.port + "/raft/update";
            rest.post(url)
                .headers({
                    'Content-Type': 'application/json'
                })
                .send(JSON.stringify(update))
                .end(callback);
        })
    });
    return tasks;
}

randomize = function(amount) {
    var half = amount / 2;
    return half + Math.floor(Math.random() * half);
}

numberOf = function(object) {
    return Object.keys(object).length;
}

switch_status = function(new_status) {
    console.log("Switching from "+status.name+" to " + new_status.name);
    status = new_status;
}
