const { Server } = require("socket.io");
const express = require("express");
const app = express();
const cors = require("cors");
const http = require('http');
const path = require('path')
const axios = require('axios');

const PISTON_URL = process.env.PISTON_URL || 'http://localhost:2000/api/v2/piston/execute';
app.use(express.json());
app.use(cors());
app.use(express.static('../client/build'));

app.post('/api/execute', async (req, res) => {
  try {
    const { language, version, files } = req.body;
    if (!language || !version || !files) {
      return res.status(400).json({ error: 'Missing language, version, or files payload.' });
    }

    const response = await axios.post(PISTON_URL, {
      language,
      version,
      files,
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    });

    res.json(response.data);
  } catch (err) {
    console.error('Execute proxy error:', err?.response?.status, err?.response?.data || err.message);
    const status = err?.response?.status || 500;
    res.status(status).json({ error: 'Execution failed', details: err?.response?.data || err.message });
  }
});

app.use((req, res, next) => {
  res.sendFile(path.join(__dirname, '../client/build', 'index.html'))
})

const server = http.createServer(app);
const io = new Server(server, { cors: true })


const emailToSocketIdMap = new Map();
const socketidToEmailMap = new Map();
const getAllConnectedClients = (roomId) => {
  return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(
    (socketId) => {
      return {
        socketId,
        email: socketidToEmailMap.get(socketId),
      };
    }
  );
};
io.on("connection", (socket) => {
  console.log(`Socket Connected`, socket.id);
  socket.on("room:join", (data) => {
    const { email, room } = data;
    emailToSocketIdMap.set(email, socket.id);
    socketidToEmailMap.set(socket.id, email);
    socket.join(room);
    io.to(room).emit("user:joined", { email, id: socket.id });
    console.log(`${socket.id} joined ${room}`);
    io.to(socket.id).emit("room:join", data);
    const clients = getAllConnectedClients(room);
    clients.forEach(({ socketId }) => {
      io.emit("new", { clients });
    });
  });

  socket.on("code:change", ({ roomId, code }) => {
    console.log("cdoe", code);
    socket.in(roomId).emit("code:change", { code });

    console.log(roomId);
  });
  // for handling video off event

  socket.on("user:video:toggle", ({ to, isVideoOff, email }) => {
    console.log("user:video:toggle", to, isVideoOff, email);
    io.to(to).emit("remote:video:toggle", { isVideoOff, email });
  });
  socket.on("sync:code", ({ id, code }) => {
    io.to(id).emit("code:change", { code });
  });
  socket.on("user:call", ({ to, offer, email }) => {
    io.to(to).emit("incomming:call", {
      from: socket.id,
      offer,
      fromEmail: email,
    });
  });
  // handling code output
  socket.on("output", ({ roomId, output }) => {
    console.log("output", output);
    socket.in(roomId).emit("output", { output });
  });

  socket.on("language:change", ({ roomId, language, snippet }) => {
    console.log(snippet, roomId);
    socket.in(roomId).emit("language:change", { language, snippet })
  })
  socket.on("call:accepted", ({ to, ans }) => {
    if (!ans) {
      io.to(to).emit("call:failed", { reason: "Peer could not start media." });
      return;
    }
    io.to(to).emit("call:accepted", { from: socket.id, ans });
  });

  socket.on("peer:nego:needed", ({ to, offer }) => {
    console.log("peer:nego:needed", offer);
    io.to(to).emit("peer:nego:needed", { from: socket.id, offer });
  });

  socket.on("peer:nego:done", ({ to, ans }) => {
    // console.log("peer:nego:done", ans);

    io.to(to).emit("peer:nego:final", { from: socket.id, ans });
  });

  socket.on("leave:room", ({ roomId, email }) => {
    socket.leave(roomId);
    console.log(`${email} left ${roomId}`);
    socket.to(roomId).emit("user:left", { email });
  });

  socket.on("wait:for:call", ({ to, email }) => {
    console.log("wait:for:call", to, email);
    io.to(to).emit("wait:for:call", { from: socket.id, email });
  });
  socket.on("disconnecting", () => {

    io.emit("user:left", { id: socket.id });

    console.log(`Socket Disconnected: ${socket.id}`);
  });
});
app.get("/", (req, res) => {
  res.send("Server is running");
})
const PORT = process.env.PORT || 8000;
server.listen(PORT, () => console.log(`Listening on port ${PORT}`));