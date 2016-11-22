var async = require('async');
var rest = require('unirest');
var http = require('http');

var peers = require('../p2p.js').peers;

var status = {
    to_s: '"<init>"'
};
var myport = null;

var current_term = 0;
var current_tick = 0;
var current_leader = null;
var current_votes = {};
var election_timeout = 0;

var write_buffer = undefined;

const DEFAULT_ELECTION_TIMEOUT = 5000;

(function loop() {
    var rand = Math.round(Math.random() * 2000) + 500;
    setTimeout(function() {
        tick();
        status();
        loop();
    }, rand);
}());

tick = function() {
    current_tick++;
}

me_follower = function() {
    if (Date.now() > election_timeout) {
        current_term++;
        console.log("No leader detected - I will run an election for term " + current_term);
        switch_status(me_candidate);
        do_request_votes(current_term);
    }
};

me_candidate = function() {};

me_leader = function() {
    do_send_updates();
};

exports.whoami = function(port) {
    myport = port;
    switch_status(me_follower);
}

exports.write = function(key, val, callback) {
    if (write_buffer) {
        callback("Too busy");
        return;
    }

    write_buffer = {key: key, val: val, callback: callback};
}

exports.handle_vote_request = function(from, term, callback) {
    console.log("- vote request received for term ", term);
    reset_election_timeout();

    current_votes[term] = current_votes[term] || {};
    var votes = current_votes[term];
    if (!votes[myport] && term >= current_term) {
        console.log("- voting for " + from + " in term " + term);
        votes[myport] = from;
        callback(null, true);
    } else if (term < current_term) {
        console.log("- term " + term + " too old, we are now in " + current_term);
        callback(null, false);
    } else {
        console.log("- already voted in term " + term + " for " + votes[myport]);
        callback(null, false);
    }
};

exports.handle_update_request = function(update, callback) {
    reset_election_timeout();
    if (status == me_candidate) {
        console.log("Ops! Somebody is already in charge, election attempt aborted :)")
        switch_status(follower);
        return;
    } else if (status == me_leader) {
        console.log("Ops! Two leaders here? Let's start an election!")
        switch_status(candidate);
        return;
    }

    if ((current_term != update.term && update.tick != 1) ||
        (current_term == update.term && update.tick - current_tick > 1)) {
        console.log("NEED WRITE LOG!! current: " + current_term + "," + current_tick + " - received: " + update.term + "," + update.tick);
    }

    current_tick = update.tick;
    current_term = update.term;
    current_leader = update.from;
    callback();
};

do_request_votes = function(term) {
    current_votes[term] = current_votes[term] || {};
    current_votes[term][myport] = myport;

    var votes = current_votes[term];
    var majority = Math.floor(peers().length / 2) + 1;
    async.parallel(create_vote_requests(votes), function(err) {
        console.log('Election results:', votes);
        console.log('- %d vote received out of %d required for term %d', numberOf(votes), majority, term);
        if (numberOf(votes) < majority) {
            console.log('- failed :(');
            switch_status(me_follower);
        } else {
            console.log('- success!');
            current_tick = 0;
            switch_status(me_leader);
        }
        reset_election_timeout()
        console.log()
    });
};

create_vote_requests = function(votes) {
    console.log("Challenging to be a leader in term " + current_term);

    var vote_request = {
        from: myport,
        term: current_term
    };
    var tasks = [];
    peers().forEach(function(peer) {
        tasks.push(function(callback) {
            var url = "http://" + peer.host + ":" + peer.port + "/raft/voteforme";
            rest.post(url)
                .headers({
                    'Content-Type': 'application/json'
                })
                .send(JSON.stringify(vote_request))
                .end(function(response) {
                    if (response.statusCode == 201) {
                        votes[response.headers['x-sys-id']] = myport;
                    }
                    callback(null);
                });
        })
    });
    return tasks;
}

do_send_updates = function() {
    console.log('Sending updates to the crowd - term=' + current_term + ", tick=" + current_tick);
    async.parallel(create_updates(), function(err) {
        
    });
};

create_updates = function() {
    var update = {
        from: myport,
        term: current_term,
        tick: current_tick,
        data: write_buffer
    };
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

numberOf = function(votes) {
    var count = 0;
    for (var key of Object.keys(votes)) {
        if (votes[key] == myport)
            count++
    }

    return count;
}

reset_election_timeout = function() {
    election_timeout = Date.now() + DEFAULT_ELECTION_TIMEOUT;
}


me_leader.to_s = '"leader"';
me_follower.to_s = '"follower"';
me_candidate.to_s = '"candidate"';

switch_status = function(new_status) {
    console.log("Switching from " + status.to_s + " to " + new_status.to_s);
    status = new_status;
    reset_election_timeout();
}