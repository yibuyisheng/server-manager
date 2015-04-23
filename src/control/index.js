import io from 'socket.io-client';
import repl from 'repl';
import utils from 'utilities';

let socket = io.connect('http://localhost:8008/control');

socket.on('connect', function() {});
socket.on('init-done', function() {
    dealer.startRepl();
    dealer.on('command', (cmd) => {
        socket.emit('command', JSON.stringify({
            command: cmd,
            ip: ''
        }));
    });
});
socket.on('command-done', function(message) {
    dealer.commandDone(message);
});

let dealer = utils.base.extend({
    startRepl: function() {
        let _this = this;
        repl.start({
            prompt: "> ",
            input: process.stdin,
            output: process.stdout,
            eval: function evalFn(cmd, context, filename, callback) {
                if (_this._evalCallback) {
                    return callback(null, '当前有命令正在执行，请等待执行完成！');
                }
                _this._evalCallback = callback;
                _this.trigger('command', cmd.replace(/\n/g, ''));
            }
        });
    },
    commandDone: function(message) {
        this._evalCallback instanceof Function && this._evalCallback(null, message);
        this._evalCallback = null;
    }
}, utils.eventDealer);