var peers = []

host_by_port = function(port) {
    return "127.0.0." + (port - 3000);
};

var current_port;
exports.init = function(localport) {
    for (port = 3001; port <= 3004; port++) {
        if (port != localport) {
            host = host_by_port(port);
            peers.push({
                port: port,
                host: host
            })
        }
    }

    current_port = localport;
    console.log("Expected peers:",peers.length)
};

exports.peers = function() {
    return peers;
};

exports.localAddress = function() {
    return host_by_port(current_port);
};

exports.httpurl = function(port) {
    return 'http://' + host_by_port(port) + ":" + port;
};


exports.host_by_port = host_by_port;