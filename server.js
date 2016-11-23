var express = require("express");

var p2p = require('./p2p.js');
var api_store = require('./api_store.js');

var mode = (process.env.MODE == undefined ? "CP" : process.env.MODE)
var port = (process.argv.length > 2) ? parseInt(process.argv[2], 10) : 3001

// var request = require('unirest').request;
// console.log('request', request);
// console.log('request.options', request.options);

var app = express();
app.use(require('body-parser').json());
app.use(function(req, res, next) {
    res.setHeader('X-Sys-Id', port)
    next();
})

var engine = require('./' + mode + "/init.js");
engine.init(app, port);

api_store.init(engine)
app.get("/admin/dump", api_store.dump);
app.get("/admin/clean", function(request, response) {
    for (var i = 0; i < 25; i++)
        console.log("\n");
    response.status(200).end();
});

app.get("/database/:key", api_store.get);
app.post("/database/:key/:val", api_store.post);

p2p.init(port);
var host = p2p.host_by_port(port); 

app.listen(port, host, function() {
    console.log("Service started on", host+":"+port);

    if (port == 3004 || port == 3006) {
        require('./db.js').slowness(5000);
        console.log("...and I am slow!\n");
    } else {
        console.log("\n");
    }
});