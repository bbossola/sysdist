var peers = []

host_by_port = function(port) {
    return "sys" + port;
};

exports.init = function(localport) {
    for (port = 3001; port <= 3004; port++) {
        if (port != localport) {
            peers.push({
                port: port,
                host: "sys" + port
            })
        }
    }
};

exports.peers = function() {
    return peers;
};

exports.host_by_port = host_by_port;
