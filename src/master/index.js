import io from 'socket.io';
import utils from 'utilities';

let server = io();

server.of('/control').on('connection', function (socket) {
    dealer.controls.push(socket);
    socket.emit('init-done');

    socket.on('command', function (data) {
        data = JSON.parse(data);
        dealer.dispatchCommand(data.command, data.ip, data.cmdId, socket);
    });
});

server.of('/node').on('connection', function(socket) {
    dealer.nodes.push(socket);

    socket.on('command-done', (data) => {
        dealer.commandDone(data, socket);
    });
});

server.listen(8008, function () {
    console.log('监听8008端口中...');
});

let dealer = utils.base.extend({
    controls: [],
    nodes: [],
    cmdIdControlMap: {},
    dispatchCommand: function(command, ipRegExp, cmdId, socket) {
        this.cmdIdControlMap[cmdId] = {controlSocket: socket, nodeCount: 0, completeCount: 0, result: {}};
        this.nodes.forEach((nodeSocket) => {
            let ip = this._getRemoteAddressFromSocket(nodeSocket);
            if (new RegExp(ipRegExp).test(ip)) {
                this.cmdIdControlMap[cmdId].nodeCount++;

                nodeSocket.emit('command', {
                    command: command,
                    cmdId: cmdId
                });
            }
        });

        if (!this.cmdIdControlMap[cmdId].nodeCount) {
            this.cmdIdControlMap[cmdId] = null;
            socket.emit('command-done', {
                message: 'can not find node to execute this command!',
                cmdId: cmdId
            });
        }
    },
    commandDone: function(data, nodeSocket) {
        let item = this.cmdIdControlMap[data.cmdId];
        if (!item) return;

        item.completeCount++;
        item.result[this._getRemoteAddressFromSocket(nodeSocket)] = data;

        // 所有节点服务器都执行完了命令
        if (item.nodeCount === item.completeCount) {
            item.controlSocket.emit('command-done', {
                result: item.result,
                cmdId: data.cmdId
            });
        }
    },
    _getRemoteAddressFromSocket: function(socket) {
        return socket.conn.remoteAddress.slice(6);
    }
}, utils.eventDealer);