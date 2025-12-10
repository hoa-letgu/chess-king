// server.js
import { createServer } from "http";
import { Server } from "socket.io";
import express from "express";
import cors from "cors";

import rooms from "./roomManager.js";
import { setupChessHandlers } from "./handlers/chessHandler.js";

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  // Gắn handler cờ vua
  setupChessHandlers(io, socket, rooms);
});

httpServer.listen(3001, () => {
  console.log("Server chạy tại http://localhost:3001");
});
