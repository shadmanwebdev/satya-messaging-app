import io from 'socket.io-client';

let socket = null;

export const initializeSocket = (serverUrl, userId) => {
    socket = io(serverUrl);

    socket.on('connect', () => {
        console.log('Connected to socket server');
        socket.emit('authenticate', { user_id: userId });
    });

    return socket;
};

export const getSocket = () => {
    if (!socket) {
        throw new Error('Socket not initialized. Call initializeSocket first.');
    }
    return socket;
};
