exports.clone = function(val) {
	return !val ? undefined : JSON.parse(JSON.stringify(val));
}
