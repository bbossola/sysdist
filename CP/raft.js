var timeout = require('async-timeout');
var async = require('async');
var rest = require('unirest');
var http = require('http');
var p2p = require('../p2p.js');
var db = require('../db.js');

var clone = require('../clone.js').clone;
var httpurl = require('../p2p.js').httpurl;

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

const DEFAULT_TICK_TIMEOUT = 200;
const DEFAULT_ELECTION_TIMEOUT = 5000;

(function loop() {
    var rand = Math.floor(Math.random() * DEFAULT_TICK_TIMEOUT/2)+DEFAULT_TICK_TIMEOUT/2;
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

me_candidate = function() {

};

me_leader = function() {
    do_send_updates();
};

exports.whoami = function(port) {
    myport = port;
    switch_status(me_follower);
}

exports.write = function(key, val, callback) {
    if (status == me_leader) {
        if (!write_buffer) {
            write_buffer = {
                key: key,
                val: val,
                term: current_term,
                tick: current_tick,
                callback: callback
            };
        } else {
            callback("Too busy");
        }
    } else {
        console.log("Forwarding write request of " + key + " to leader " + current_leader + " for value " + val)
        var url = httpurl(current_leader) + "/database/" + key + "/" + val;
        rest.post(url)
            .end(function(response) {
                callback((response.statusCode != 201) ? "error" : null);
            });
    }
}

exports.handle_vote_request = function(from, term, callback) {
    if (term < current_term) {
        callback();
        return;
    }

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
        switch_status(me_follower);
        return;
    } else if (status == me_leader) {
        console.log("Ops! Two leaders here? Let's start an election!")
        switch_status(me_candidate);
        return;
    }

    if ((current_term != update.term && update.tick != 1) ||
        (current_term == update.term && update.tick - current_tick > 1)) {
        console.log("NEED WRITE LOG!! current: " + current_term + "," + current_tick + " - received: " + update.term + "," + update.tick);
    }

    current_tick = update.tick;
    current_term = update.term;
    current_leader = update.from;

    if (update.data != null) {
        data = {
            val: update.data.val,
            term: update.data.term,
            tick: update.data.tick
        }
        db.save(update.data.key, data, callback);
    } else {
        callback();
    }
};

do_request_votes = function(term) {
    current_votes[term] = current_votes[term] || {};
    current_votes[term][myport] = myport;

    var votes = current_votes[term];
    var majority = Math.floor(p2p.peers().length / 2) + 1;
    async.parallel(create_vote_requests(votes), function(err) {
        if (status != me_candidate) {
            return;
        }
        console.log('Election results:', votes);
        console.log('- %d vote received out of %d required for term %d', numberOf(votes), majority, term);
        if (numberOf(votes) < majority) {
            console.log('- failed :(');
            switch_status(me_follower);
        } else {
            console.log('- success!');
            current_tick = 0;
            current_leader = myport;
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
    p2p.peers().forEach(function(peer) {
        var task = function(callback) {
            var url = httpurl(peer.port) + "/raft/voteforme";
            rest.post(url)
                .localAddress(p2p.localAddress())
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
        }
        tasks.push(timeout(task, DEFAULT_ELECTION_TIMEOUT, "timeout"));
    });
    return tasks;
}

do_send_updates = function() {
    var buffer = write_buffer;
    write_buffer = null;

    process.stdout.write('LEADER - updating for term=' + current_term + ', tick=' + current_tick + ', data=' + JSON.stringify(buffer) + '\r');
    async.parallel(create_updates(buffer), function(err) {
        if (buffer) {
            data = {
                val: buffer.val,
                term: buffer.term,
                tick: buffer.tick
            };
            buffer.callback(null, data);
        }
    });
};

create_updates = function(buffer) {
    var update = {
        from: myport,
        term: current_term,
        tick: current_tick,
        data: buffer
    };
    var tasks = [];
    p2p.peers().forEach(function(peer) {
        var task = function(callback) {
            var url = httpurl(peer.port) + "/raft/update";
            rest.post(url)
                .localAddress(p2p.localAddress())
                .headers({
                    'Content-Type': 'application/json'
                })
                .send(JSON.stringify(update))
                .end(callback);
        };
        tasks.push(timeout(task, DEFAULT_ELECTION_TIMEOUT, "timeout"));
    });
    return tasks;
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
    election_timeout = Date.now() + randomize(DEFAULT_ELECTION_TIMEOUT);
}

randomize = function(amount) {
    var third = amount / 2;
    return third + Math.floor(Math.random() * third * 2);
}

me_leader.to_s = '"leader"';
me_follower.to_s = '"follower"';
me_candidate.to_s = '"candidate"';

switch_status = function(new_status) {
    console.log("Switching from " + status.to_s + " to " + new_status.to_s + "\n");
    status = new_status;
    reset_election_timeout();
}