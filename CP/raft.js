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

var beat_timeout = 0;

var election_term = 0;
var election_timeout = 0;

var write_buffer = undefined;

const DEFAULT_TICK_TIMEOUT = 1000;
const DEFAULT_UPDATE_TIMEOUT = 2500;
const DEFAULT_ELECTION_TIMEOUT = 5000;

const MAJORITY = Math.floor(p2p.peers().length / 2) + 1;

(function loop() {
    var rand = Math.floor(Math.random() * DEFAULT_TICK_TIMEOUT / 2) + DEFAULT_TICK_TIMEOUT / 2;
    setTimeout(function() {
        status();
        loop();
    }, rand);
}());

me_follower = function() {
    if (Date.now() > election_timeout) {
        election_term = (election_term == 0) ? current_term+1 : election_term+1;
        console.log("No leader detected in current term "+current_term+" - I will run an election for term ", election_term);
        current_leader = null;
        switch_status(me_candidate);
        do_request_votes(election_term);
    }
};

me_candidate = function() {
};

me_leader = function() {
    current_tick++;
    do_send_heartbeat();
};

exports.init = function(port) {
    myport = port;
    switch_status(me_follower);
}

exports.handle_vote_request = function(from, term, callback) {
    if (Date.now() < beat_timeout) {
        console.log("- vote request from " + from + " in term " + term+ " but I am in the beat!");
        callback("in the beat");
        return;
    }
    
    reset_election_timeout();

    current_votes[term] = current_votes[term] || {};
    var votes = current_votes[term];
    if (!votes[myport] && term > current_term) {
        console.log("- vote request: voting for " + from + " in term " + term+ "            ");
        votes[myport] = from;
        callback(null, true);
    } else if (term <= current_term) {
        console.log("- vote request: term " + term + " too old, we are in " + current_term+ "      ");
        callback(null, false);
    } else {
        console.log("- vote request: already voted in term " + term + " for " + votes[myport]);
        callback(null, false);
    }
};

exports.handle_beat_request = function(update, callback) {
    if (update.term < current_term) {
        callback("too-old");
        return;
    } else if (update.term == current_term && update.tick < current_tick) {
        callback("too-old");
        return;
    }

    reset_election_timeout();
    if (status == me_candidate) {
        console.log("Ops! Somebody is already in charge, election aborted!")
        switch_status(me_follower);
    } else if (status == me_leader) {
        console.log("Ops! Two leaders here? Let's start an election!")
        switch_status(me_candidate);
        callback("two-leaders");
        return;
    }

    if ((current_term != update.term && update.tick != 1) ||
        (current_term == update.term && update.tick - current_tick > 1)) {
        console.log("Asking history from term  " + current_term + " and tick "+current_tick +" to " + update.from);
        var url = httpurl(update.from) + "/raft/history";
        rest.get(url)
            .json({term: current_term, tick: current_tick})
            .end(function(response) {
                result = response.body;
                console.log("History received:", JSON.stringify(result));
                var save_tasks = [];
                for (var key of Object.keys(result)) {
                    save_tasks.push(function(callback) {
                       db.save(key, result[key], callback);
                    });
                }
                async.series(save_tasks, callback);
            });
    }

    reset_beat_timeout();
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
 
create_save_task = function(key, val) {
    console.log("--> will save "+key+"="+JSON.stringify(val));
    return function(callback) {
        console.log("--> going to save "+key+"="+JSON.stringify(val));
        db.save(key, val, callback);
    }
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
    } else if (current_leader == null) {
        callback("No leader at the moment!");
    } else {
        console.log("Forwarding write request of " + key + " to leader " + current_leader + " for value " + val)
        var url = httpurl(current_leader) + "/database/" + key + "/" + val;
        rest.post(url)
            .end(function(response) {
                callback((response.statusCode != 201) ? "error" : null);
            });
    }
}

do_request_votes = function(term) {
    if (current_votes[term] && current_votes[term][myport]) {
        console.log('cannot run for term '+term+', I already voted!');
        return;
    }

    current_votes[term] = current_votes[term] || {};
    current_votes[term][myport] = myport;

    var votes = current_votes[term];
    async.parallel(create_vote_requests(votes, term), function(err) {
        if (status != me_candidate) {
            return;
        }
        console.log('Election results:', votes);
        console.log('- %d vote received out of %d required for term %d', numberOf(votes), MAJORITY, term);
        if (numberOf(votes) < MAJORITY) {
            console.log('- failed :(');
            switch_status(me_follower);
        } else {
            console.log('- success!');
            current_tick = 0;
            current_term = term;
            current_leader = myport;
            switch_status(me_leader);
        }
        reset_election_timeout()
        console.log()
    });
};

create_vote_requests = function(votes, term) {
    console.log("Challenging to be a leader in term", term);

    var vote_request = {
        from: myport,
        term: term
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

do_send_heartbeat = function() {
    var buffer = write_buffer;
    write_buffer = null;

    reset_beat_timeout();
    process.stdout.write('LEADER - updating for term=' + current_term + ', tick=' + current_tick + ', data=' + JSON.stringify(buffer) + '      \r');
    async.parallel(create_updates(buffer), function(err, results) {
        var number_of_peers = 1+number_of_followers(results)
        if (number_of_peers < MAJORITY) {
            console.log("It appears I have not enough followers, just "+ number_of_peers + " responded to my update");  
            status = me_follower;
            err = "failed";
        }

        if (buffer) {
            data = {
                val: buffer.val,
                term: buffer.term,
                tick: buffer.tick
            };
            console.log
            buffer.callback(err, data);
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
                .end(function(response) {
                    callback(null, response.statusCode);
                });
        };

        tasks.push(timeout(task, DEFAULT_UPDATE_TIMEOUT, "timeout"));
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

number_of_followers = function(results) {
    var total = 0;
    for (var result of results) {
        if (result == 200)
            total++;
    }

    return total;
}

reset_election_timeout = function() {
    election_timeout = Date.now() + randomize(DEFAULT_ELECTION_TIMEOUT);
}

reset_beat_timeout = function() {
    beat_timeout = Date.now() + randomize(DEFAULT_TICK_TIMEOUT);
}

randomize = function(amount) {
    var third = amount / 2;
    return third + Math.floor(Math.random() * third * 2);
}

me_leader.to_s = '"leader"';
me_follower.to_s = '"follower"';
me_candidate.to_s = '"candidate"';

switch_status = function(new_status) {
    console.log("Switching from " + status.to_s + " to " + new_status.to_s);
    status = new_status;
    reset_election_timeout();
}


