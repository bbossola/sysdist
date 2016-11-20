exports.init = function(app) {
    console.log("AP mode (sloppy quorum)");
    var quorum = require('./quorum_api.js');

    app.post("/quorum/propose", quorum.propose);
    app.post("/quorum/commit/:id", quorum.commit);
    app.post("/quorum/rollback/:id", quorum.rollback);

    app.get("/quorum/read/:key", quorum.read);
    app.post("/quorum/repair", quorum.repair);
}

exports.store = function(app) {
   return require('./store.js');
}

