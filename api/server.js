// server.js
import { createServer } from "http";
import { Server } from "socket.io";
import express from "express";
import cors from "cors";

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*", // sửa lại domain của bạn nếu cần
  },
});

// roomId -> { fen, history, historyIndex }
const rooms = new Map();

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("room:join", ({ roomId }) => {
    if (!roomId) return;
    socket.join(roomId);

    let roomState = rooms.get(roomId);
    if (!roomState) {
      roomState = {
        fen: null,
        history: null,
        historyIndex: 0,
      };
      rooms.set(roomId, roomState);
    }

    // Bình thường bạn có thể quản lý color phức tạp hơn
    // Ở đây đơn giản: người đầu là trắng, người thứ hai là đen
    const clients = Array.from(io.sockets.adapter.rooms.get(roomId) || []);
    let color = "w";
    if (clients.length >= 2) color = "b"; // tạm: client thứ 2 là đen

    socket.emit("room:joined", {
      roomId,
      color,
      fen: roomState.fen,
      history: roomState.history,
      historyIndex: roomState.historyIndex,
    });

    socket.to(roomId).emit("room:player-joined", { roomId, color });
  });

  // Nhận cập nhật ván cờ rồi broadcast cho client khác
  socket.on("game:state", ({ roomId, fen, history, historyIndex, lastMove }) => {
  rooms.set(roomId, { fen, history, historyIndex, lastMove });
  socket.to(roomId).emit("game:update", { fen, history, historyIndex, lastMove });
});


  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

const PORT = 3001;
httpServer.listen(PORT, () => {
  console.log("http://localhost:"+PORT);
});
