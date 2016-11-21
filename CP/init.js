exports.init = function(app, port) {
    console.log("CP mode (majority quorum, raft)");

    var raft = require('./raft.js');
    raft.whoami(port);

    var raft_api = require('./raft_api.js');
    app.get("/raft/vote", raft_api.vote_request);
    app.get("/raft/update", raft_api.update);
}

exports.store = function(app) {
   return require('./store.js');
}
