import Promise from 'promise';

function requestId() {
    requestId.__id = requestId.__id || 0;
    requestId.__id++;
    return requestId.__id;
}

function request(socket, message, data) {
    return new Promise(function(resolve, reject) {
        let id = requestId();

        socket.emit(message, {data: data, requestId: id});

        socket.on(message + '-done', listener);

        function listener(data) {
            if (data.requestId === id) {
                resolve(data.data);
                socket.removeListener(message + '-done', listener);
            }
        }
    });
}


export default request;
