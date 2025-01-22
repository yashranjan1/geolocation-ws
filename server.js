// const express = require("express");
// const { createServer } = require("node:http");
// const { Server } = require("socket.io");
// const { join } = require("node:path");

// const app = express();
// const server = createServer(app);
// const io = new Server(server, {
//   cors: {
//     origin: "*",
//     methods: ["GET", "POST"],
//   },
// });
// const roomRoles = new Map();

// app.get("/", (req, res) => {
//   res.sendFile(join(__dirname, "index.html"));
// });

// let isOngoing = false;
// io.on("connection", (socket) => {
//   socket.on("init", (data) => {
//     const { room, role } = data;

//     if (!roomRoles.has(room)) {
//       roomRoles.set(room, { mechanic: null, client: null });
//     }

//     const roomData = roomRoles.get(room);

//     if (role === "service") {
//       if (roomData.mechanic) {
//         console.log("Already a mechanic in the room");
//         return socket.disconnect();
//       } else {
//         console.log("Joined room");
//         roomData.mechanic = socket.id;
//       }
//     } else if (role === "client") {
//       if (roomData.client) {
//         console.log("Already a client in the room");
//         return socket.disconnect();
//       } else {
//         console.log("Joined room");
//         roomData.client = socket.id;
//       }
//     } else {
//       console.log("Invalid role");
//       socket.emit("error", "Invalid role");
//       return socket.disconnect();
//     }

//     socket.join(room);
//     socket.role = role;
//     socket.room = room;
//     console.log(`${role} ${socket.id} user connected to the room ${room}`);
//   });
//   socket.on("send-location", (data) => {
//     console.log("Recieved coords:", data);
//     data.latitude = data.latitude + Math.random() * 0.001;
//     data.longitude = data.longitude + Math.random() * 0.001;
//     socket.to(data.room).emit("recv-location", data);
//   });

//   socket.on("complete-task", (data) => {
//     const { message, room } = data;
//     if (socket.client && socket.mechanic) {
//       socket.to(room).emit("complete-task", data);
//       console.log("Emitting task completion");
//     } else {
//       console.log("service: ", socket.mechanic, "client: ", socket.client);
//       console.log("either one is missing");
//     }
//   });
//   //   socket.on("disconnect", () => {
//   //     const { room, role } = socket;
//   //     if (room) {
//   //       const roomData = roomRoles.get(room);

//   //       // Remove the user from the room's role
//   //       if (role === "service" && roomData && roomData.service === socket.id) {
//   //         roomData.service = null;
//   //         console.log(`Mechanic left room ${room}`);
//   //       } else if (
//   //         role === "client" &&
//   //         roomData &&
//   //         roomData.client === socket.id
//   //       ) {
//   //         roomData.client = null;
//   //         console.log(`Client left room ${room}`);
//   //       }

//   //       // Clean up the room entry if empty
//   //       if (roomData && !roomData.service && !roomData.client) {
//   //         roomRoles.delete(room);
//   //         console.log(`Room ${room} is now empty and deleted.`);
//   //       }
//   //     }
//   //     console.log(`User disconnected: ${socket.id}`);
//   //   });

//   socket.on("disconnect", () => {
//     const { room, role } = socket;
//     if (room) {
//       const roomData = roomRoles.get(room);

//       // Remove the user from the room's role
//       if (role === "service" && roomData && roomData.mechanic === socket.id) {
//         roomData.mechanic = null;
//         console.log(`Mechanic left room ${room}`);
//       } else if (
//         role === "client" &&
//         roomData &&
//         roomData.client === socket.id
//       ) {
//         roomData.client = null;
//         console.log(`Client left room ${room}`);
//       }

//       // Clean up the room entry only if both client and service roles are null
//       if (roomData && !roomData.mechanic && !roomData.client) {
//         roomRoles.delete(room);
//         console.log(`Room ${room} is now empty and deleted.`);
//       }
//     }
//     console.log(`User disconnected: ${socket.id}`);
//   });
// });

// app.get("/otp-accepted/:room", (req, res) => {
//   isOngoing = true;
//   console.log(req.url);

//   // Notify all clients in a specific room (e.g., "room1") about the ongoing task
//   const room = req.params.room; // Assume the room is passed as a query parameter
//   console.log(room);
//   if (room) {
//     io.to(room).emit("status-ongoing", {
//       message: "Task is ongoing",
//       taskStatus: true,
//     });

//     console.log("Endpoint hit, task is now ongoing");
//     res.send({ status: `Task marked as ongoing in room ${room}` });
//   } else {
//     res.status(400).send({ error: "Invalid room or room does not exist" });
//   }
// });

// // app.get('/otp-accepted', () => {
// // 	isOngoing = true
// // 	console.log('endpoint hit')
// // })

// server.listen(3001, () => {
//   console.log("Server is running on port 3001");
// });



const express = require("express");
const { createServer } = require("node:http");
const { Server } = require("socket.io");
const { join } = require("node:path");

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const roomRoles = new Map();

app.get("/", (req, res) => {
  res.sendFile(join(__dirname, "index.html"));
});

let isOngoing = false;

io.on("connection", (socket) => {
  socket.on("init", (data) => {
    const { room, role } = data;

    if (!roomRoles.has(room)) {
      roomRoles.set(room, { mechanic: null, client: null });
    }

    const roomData = roomRoles.get(room);

    if (role === "service") {
      if (roomData.mechanic) {
        console.log("A mechanic is already in the room");
        socket.emit("error", "A mechanic is already assigned to this room.");
        return socket.disconnect();
      } else {
        roomData.mechanic = socket.id;
      }
    } else if (role === "client") {
      if (roomData.client) {
        console.log("A client is already in the room");
        socket.emit("error", "A client is already assigned to this room.");
        return socket.disconnect();
      } else {
        roomData.client = socket.id;
      }
    } else {
      console.log("Invalid role");
      socket.emit("error", "Invalid role provided.");
      return socket.disconnect();
    }

    socket.join(room);
    socket.role = role;
    socket.room = room;
    console.log(`${role} ${socket.id} connected to room ${room}`);
  });

  socket.on("send-location", (data) => {
    console.log("Received coords:", data);
    data.latitude += Math.random() * 0.001;
    data.longitude += Math.random() * 0.001;
    socket.to(data.room).emit("recv-location", data);
  });

  socket.on("complete-task", (data) => {
    const { message, room } = data;
    const roomData = roomRoles.get(room);

    if (roomData?.mechanic && roomData?.client) {
      io.to(room).emit("complete-task", { message, room });
      console.log("Task completion broadcasted to room:", room);
    } else {
      console.log(
        "Either client or mechanic is missing in room:",
        room,
        roomData
      );
    }
  });

  socket.on("disconnect", () => {
    const { room, role } = socket;

    if (room) {
      const roomData = roomRoles.get(room);

      if (role === "service" && roomData && roomData.mechanic === socket.id) {
        roomData.mechanic = null;
        console.log(`Mechanic left room ${room}`);
      } else if (
        role === "client" &&
        roomData &&
        roomData.client === socket.id
      ) {
        roomData.client = null;
        console.log(`Client left room ${room}`);
      }

      if (roomData && !roomData.mechanic && !roomData.client) {
        roomRoles.delete(room);
        console.log(`Room ${room} is now empty and has been deleted.`);
      }
    }

    console.log(`User disconnected: ${socket.id}`);
  });
});

app.get("/otp-accepted/:room", (req, res) => {
  isOngoing = true;
  const room = req.params.room;

  if (room) {
    io.to(room).emit("status-ongoing", {
      message: "Task is ongoing",
      taskStatus: true,
    });

    console.log(`Task marked as ongoing in room ${room}`);
    res.send({ status: `Task marked as ongoing in room ${room}` });
  } else {
    res.status(400).send({ error: "Invalid room or room does not exist" });
  }
});

server.listen(3001, () => {
  console.log("Server is running on port 3001");
});
