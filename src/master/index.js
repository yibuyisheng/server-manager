import io from 'socket.io';
import utils from 'utilities';
import Promise from 'promise';
import request from '../common/request';

let server = io();

server.of('/control').on('connection', function (socket) {
    dealer.controls.push(socket);
    socket.emit('init-done');

    socket.on('command', function (data) {
        dealer.dispatchCommand(data, socket);
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
    cmdIdControlMap: {},
    dispatchCommand: function(data, controlSocket) {
        let promises = this.nodes.map((nodeSocket) => {
            let ip = this._getRemoteAddressFromSocket(nodeSocket);
            if (new RegExp(data.data.ip)) {
                return request(nodeSocket, 'command', {
                    command: data.data.command
                }).then((result) => {
                    result.ip = this._getRemoteAddressFromSocket(nodeSocket)
                    return result;
                });
            }
        }).filter(function(p) {
            return p;
        });

        if (promises.length) {
            Promise.all.apply(Promise, promises)
                .then(function(results) {
                    controlSocket.emit('command-done', {
                        data: results,
                        requestId: data.requestId
                    });
                })
                .catch(function(error) {
                    controlSocket.emit('command-done', {
                        data: {
                            message: error.message
                        },
                        requestId: data.requestId
                    });
                });
        } else {
            controlSocket.emit('command-done', {
                data: {
                    message: 'can not find node'
                },
                requestId: data.requestId
            });
        }
    },
    _getRemoteAddressFromSocket: function(socket) {
        return socket.conn.remoteAddress.slice(7);
    }
}, utils.eventDealer);