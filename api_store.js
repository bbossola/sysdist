var store;
var log_request = require('./logger.js').log_request;

exports.init = function(engine) {
	store = engine.store();
}

exports.get = function(request, response) {
    var key = request.params.key;  
    var val = store.load(key, function(val) {
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
            log_request(request, "value for key " + key + " not present - database: " + JSON.stringify(store.data()));
        }
    });
};

exports.post = function(request, response) {
    var key = request.params.key;  
    var val = request.params.val;

    log_request(request, "value posted for key " + key + " is: " + val);
    store.save(key, val, function(success) {
        code = success ? 201 : 422
        response.status(code).end();
    });
}