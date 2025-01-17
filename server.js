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
const roomRoles = new Map();

app.get('/', (req, res) => {
	res.sendFile(join(__dirname, 'index.html'));
});

io.on('connection', (socket) => { 
	socket.on('init', (data) => {

		const { room, role } = data;

		if (!roomRoles.has(room)) {
			roomRoles.set(room, { mechanic: null, client: null });
		}

		const roomData = roomRoles.get(room);

		if (role === 'service') {
			if (roomData.mechanic) {
				console.log('Already a mechanic in the room');
				return socket.disconnect();
			}
			else {
				console.log('Joined room');
				roomData.mechanic = socket.id;
			}
		}
		else if (role === 'client') {
			if (roomData.client) {
				console.log('Already a client in the room');
				return socket.disconnect();
			}
			else {
				console.log('Joined room');
				roomData.client = socket.id;
			}
		}
		else {
			console.log('Invalid role');
			socket.emit('error', 'Invalid role');
			return socket.disconnect();
		}

		socket.join(room);
		socket.role = role;
		socket.room = room;
		console.log(`${role} user connected to the room ${room}`);
		
	});
	socket.on('send-location', (data) => {
		console.log("Recieved coords:", data)
		data.latitude = data.latitude + Math.random() * 0.001
		data.longitude = data.longitude + Math.random() * 0.001
		socket.to(data.room).emit('recv-location', data); 
	});  
	socket.on('disconnect', () => {
		const { room, role } = socket;
		if (room) {
		  const roomData = roomRoles.get(room);
	
		  // Remove the user from the room's role
		  if (role === 'service' && roomData && roomData.service === socket.id) {
			roomData.service = null;
			console.log(`Mechanic left room ${room}`);
		  } else if (role === 'client' && roomData && roomData.client === socket.id) {
			roomData.client = null;
			console.log(`Client left room ${room}`);
		  }
	
		  // Clean up the room entry if empty
		  if (roomData && !roomData.service && !roomData.client) {
			roomRoles.delete(room);
			console.log(`Room ${room} is now empty and deleted.`);
		  }
		}
		console.log(`User disconnected: ${socket.id}`);
	  });
});


server.listen(3001, () => {
	console.log('Server is running on port 3001');
});