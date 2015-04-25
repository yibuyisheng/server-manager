import io from 'socket.io-client';
import { exec } from 'child_process';

let socket = io.connect('http://localhost:8008/node');

socket.on('command', function(data) {
    try {
        console.log(data);
        exec(data.data.command, function(error, stdout, stderr) {
            console.log(error);
            console.log(stdout);
            console.log(stderr);
            socket.emit('command-done', {
                data: {
                    errorMessage: error && error.message,
                    stdout: String(stdout),
                    stderr: String(stderr)
                },
                requestId: data.requestId
            });
        });
    } catch(error) {
        socket.emit('command-done', {
            data: {
                errorMessage: error.message
            },
            requestId: data.requestId
        });
    }

});