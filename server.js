const express = require('express');
const { createServer } = require('node:http');
const { Server } = require('socket.io');
const { join } = require('node:path');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});


app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'index.html'));
});

io.on('connection', (socket) => { 

  socket.on('init', (data) => {
    console.log('User connected');
    socket.join(data.room);
  });
  
  socket.on('send message', (data) => {
    console.log('rec received:', data);
    console.log(socket.rooms);
    io.to(data.room).emit('rec message', data.message); 
  });  
  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});


server.listen(3001, () => {
  console.log('Server is running on port 3000');
});