import io from 'socket.io-client';
import { exec } from 'child_process';

let socket = io.connect('http://localhost:8008/node');

socket.on('command', function(data) {
    try {
        exec(data.command, function(error, stdout, stderr) {
            socket.emit('command-done', {
                errorMessage: error && error.message,
                stdout: String(stdout),
                stderr: String(stderr),
                cmdId: data.cmdId
            });
        });
    } catch(error) {
        socket.emit('command-done', {
            errorMessage: error.message,
            cmdId: data.cmdId
        });
    }

});