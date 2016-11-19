exports.init = function(app) {
    console.log("AC mode (two-phase commit)");
    var api_2pc = require('./api_2pc.js');
    app.post("/2pc/propose", api_2pc.propose);
    app.post("/2pc/commit/:id", api_2pc.commit);
    app.post("/2pc/rollback/:id", api_2pc.rollback);
}

exports.store = function(app) {
   return require('./store.js');
}

