exports.init = function(app, port) {
    console.log("CP mode (majority quorum, rift)");

    var rift = require('./rift.js');
    rift.whoami(port);
    
    var rift_api = require('./rift_api.js');
    app.get("/rift/vote", rift_api.vote_request);
    app.get("/rift/update", rift_api.update);
}

exports.store = function(app) {
   return require('./store.js');
}

