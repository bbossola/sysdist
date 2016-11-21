exports.init = function(app, port) {
    console.log("CP mode (majority quorum, raft)");

    var raft = require('./raft.js');
    raft.whoami(port);

    var raft_api = require('./raft_api.js');
    app.post("/raft/update", raft_api.update);
    app.post("/raft/voteforme", raft_api.vote_request);
}

exports.store = function(app) {
   return require('./store.js');
}
