var db = require('./db.js');

var log_request = require('./logger.js').log_request;
var execute_2pc = require('./2pc.js').submit;

exports.get = function(request, response) {
		var key = request.params.key;  
    var val = db.load(key);

    if (val != undefined) {
	    	response.status(200);
	    	response.json({
	        "key": key,
	        "val": val
	    });
    	log_request(request, "value for key "+key+" is: "+val);
    }
    else {
	    	response.status(404).json({"error": "Value for key "+key+" not present"});
    		log_request(request,"value for key "+key+" not present - database: "+JSON.stringify(db.data()));
    }
};

exports.post = function(request, response) {
		var key = request.params.key;  
	  var val = request.params.val;

		log_request(request, "value posted for key "+key+" is: "+val);
		execute_2pc(key, val,  function(success) {
				code = success ? 201 : 406
				response.status(code).end();
		});
}
