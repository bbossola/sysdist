var sprintf = require("sprintf-js").sprintf;

exports.log_request = function(request, message) {
	console.log(sprintf("%-4.4s %-15.15s %s", request.method, request.url, message));
}