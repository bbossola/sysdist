var peers = []

var net = require('net');
// var sock = net.Socket;
// net.Socket = function(options) {
//     // if (console.log) {
//     //     console.log("socket!", JSON.stringify(options));
//     // }

//     sock(options);
// };

// var origCall = net.Socket.prototype.call;
// net.Socket.prototype.call = function (thisArg) {
//     var args = Array.prototype.slice.call(arguments, 1);
//     if (console.log) {
//         console.log("socket!", JSON.stringify(args));
//     }
//     origCall.apply(thisArg, args);
// };



host_by_port = function(port) {
    return "127.0.0." + (port - 3000);
};

var current_port;
exports.init = function(localport) {
    for (port = 3001; port <= 3005; port++) {
        if (port != localport) {
            host = host_by_port(port);
            peers.push({
                port: port,
                host: host
            })
        }
    }
    current_port = localport;
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