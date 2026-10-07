const express = require('express');
const socket = require('socket.io');

const app = express();
const PORT = 4000;

app.use(express.static('public'));

const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor de Chat activo en el puerto ${PORT}`);
});

const io = socket(server, {
    maxHttpBufferSize: 1e8 // Permite envío de imágenes y documentos
});

io.on('connection', (socket) => {
    console.log('Cliente conectado:', socket.id);

    socket.on('chat', (data) => {
        io.sockets.emit('chat', data);
    });

    socket.on('typing', (data) => {
        socket.broadcast.emit('typing', data);
    });
});