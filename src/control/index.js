import io from 'socket.io-client';
import repl from 'repl';
import utils from 'utilities';

let socket = io.connect('http://localhost:8008/control');

socket.on('connect', function() {});
socket.on('init-done', function() {
    dealer.startRepl();
    dealer.on('command', (cmdData) => {
        socket.emit('command', JSON.stringify(cmdData));
    });
});
socket.on('command-done', function(data) {
    dealer.commandDone(data, data.cmdId);
});

let dealer = utils.base.extend({
    _evalCallbacks: {},
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

                let cmdId = _this._generateCommandId();
                _this._evalCallbacks[cmdId] = callback;
                _this.trigger('command', {
                    command: cmd.replace(/\n/g, ''),
                    ip: '',
                    cmdId: cmdId
                });
            }
        });
    },
    commandDone: function(data, cmdId) {
        let cb = this._evalCallbacks[cmdId];
        if (!(cb instanceof Function)) return;

        let message = [];
        if (data.errorMessage) {
            message = message.push(data.errorMessage);
        } else if (data.result) {
            for (let k in data.result) {
                message.push(k + '\n' + (data.result[k].errorMessage || data.result[k].stderr || data.result[k].stdout));
            }
        }
        cb(null, message.join('\n'));
        this._evalCallbacks[cmdId] = null;
    },
    _generateCommandId: function() {
        this._uid = this._uid || 0;
        this._uid++;
        return this._uid;
    }
}, utils.eventDealer);