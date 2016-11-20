var store;
var log_request = require('./logger.js').log_request;

exports.init = function(engine) {
	store = engine.store();
}

exports.get = function(request, response) {
    var key = request.params.key;  
    log_request(request, "key=" + key + "...");

    store.load(key, function(err, val) {
        console.log("store.load - val="+val+", err="+err)
        if (val != undefined) {
            response.status(200);
            response.json({
                "key": key,
                "val": val
            });
            log_request(request, "value for key " + key + " is: " + val);
        } else {
            response.status(404).json({
                "error": "Value for key " + key + " not present"
            });
            log_request(request, "value for key " + key + " not present");
        }
    });
};

exports.post = function(request, response) {
    var key = request.params.key;  
    var val = request.params.val;

    log_request(request, "value posted for key " + key + " is: " + val);
    store.save(key, val, function(error) {
        if (error == undefined) {
            response.status(201).end();
        } else {
            response.status(422).json({
                "error": error
            }).end();
        }
    });
}

exports.dump = function(request, response) {
    console.log("\n=========== DATABASE ===========");
    console.log(JSON.stringify(store.data(), null, 2), "\n");
    response.status(200).end();
};

