var express = require("express");

var p2p = require('./p2p.js');
var api_store = require('./api_store.js');

var app = express();
app.use(require('body-parser').json());

var mode = (process.env.MODE == undefined ? "AC" : process.env.MODE)
var engine = require('./'+mode+"/init.js");
engine.init(app);

api_store.init(engine)
app.get("/database/:key", api_store.get);
app.post("/database/:key/:val", api_store.post);

var port = (process.argv.length > 2) ? parseInt(process.argv[2], 10) : 3001
p2p.init(port)
app.listen(port, function() {
    console.log("Hello service started on port " + port + "\n");
});