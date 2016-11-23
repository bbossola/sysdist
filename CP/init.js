exports.init = function(app, port) {
    console.log("CP mode (majority quorum, raft)");

    var raft = require('./raft.js');
    raft.init(port);

    var raft_api = require('./raft_api.js');
    app.post("/raft/update", raft_api.beat_request);
    app.post("/raft/voteforme", raft_api.vote_request);
    app.get("/raft/history", raft_api.get_history);
}

exports.store = function(app) {
   return require('./store.js');
}
