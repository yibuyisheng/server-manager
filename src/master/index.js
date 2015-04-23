import io from 'socket.io';
import utils from 'utilities';

let server = io();

server.of('/control').on('connection', function (socket) {
    dealer.controls.push(socket);
    socket.emit('init-done');
    socket.on('command', function (data) {
        data = JSON.parse(data);
        dealer.dispatchCommand(data.command, data.ip, socket);
    });
});

server.of('/node').on('connection', function(socket) {
    dealer.nodes.push(socket);
});

server.listen(8008, function () {
    console.log('监听8008端口中...');
});

let dealer = utils.base.extend({
    controls: [],
    nodes: [],
    dispatchCommand: function(command, ipRegExp, socket) {
        this.nodes.forEach((nodeSocket) => {
            let ip = this._getRemoteAddressFromSocket(nodeSocket);
            if (new RegExp(ipRegExp).test(ip)) {
                nodeSocket.emit('command', JSON.stringify({
                    command: command
                }));
            }
        });
        setTimeout(() => {
            socket.emit('command-done', command + ' executed successfully');
        }, 1000);
    },
    _getRemoteAddressFromSocket: function(socket) {
        return socket.conn.remoteAddress.slice(6);
    }
}, utils.eventDealer);