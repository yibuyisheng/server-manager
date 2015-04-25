import io from 'socket.io-client';
import repl from 'repl';
import utils from 'utilities';
import request from '../common/request';

let socket = io.connect('http://localhost:8008/control');

socket.on('connect', function() {});
socket.on('init-done', function() {
    dealer.startRepl();
    dealer.on('command', (cmdData) => {
        request(socket, 'command', cmdData.data)
            .then((data) => {
                cmdData.callback(null, dealer.commandDone(data));
            });
    });
});

let dealer = utils.base.extend({
    startRepl: function() {
        let _this = this;
        repl.start({
            prompt: "> ",
            input: process.stdin,
            output: process.stdout,
            eval: function evalFn(cmd, context, filename, callback) {
                _this.trigger('command', {
                    data: {
                        command: cmd.replace(/\n/g, ''),
                        ip: ''
                    },
                    callback: callback
                });
            },
            writer: function(message) {
                return message;
            }
        });
    },
    commandDone: function(data) {
        let message = [];
        if (utils.base.isArray(data)) {
            message.push(data.map(function(result) {
                return result.ip + '\n' + (result.errorMessage || result.stderr || result.stdout);
            }).join('\n'));
        } else if (data.errorMessage) {
            message.push(data.errorMessage);
        }

        return message.join('\n\n');
    },
    _generateCommandId: function() {
        this._uid = this._uid || 0;
        this._uid++;
        return this._uid;
    }
}, utils.eventDealer);