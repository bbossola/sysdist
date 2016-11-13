var express = require("express");

var p2p = require('./p2p.js');
var api_db = require('./api_database.js');
var api_2pc = require('./api_2pc.js');

var app = express();
app.use(require('body-parser').json());

app.get("/database/:key", api_db.get);
app.post("/database/:key/:val", api_db.post);

app.post("/2pc/propose", api_2pc.propose);
app.post("/2pc/commit/:id", api_2pc.commit);
app.post("/2pc/rollback/:id", api_2pc.rollback);

var port = (process.argv.length > 2) ? parseInt(process.argv[2],10) : 3001

p2p.init(port)
app.listen(port, function() {
    console.log("Hello service started on port "+port+"\n");
});
