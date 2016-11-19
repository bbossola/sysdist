var peers = []

exports.init = function(localport) {
    for (port = 3001; port <= 3003; port++) {
        if (port != localport) {
            peers.push({
                port: port,
                host: "sys" + port
            })
        }
    }

    console.log("Current peers: ", JSON.stringify(peers))
};

exports.peers = function() {
    return peers;
}