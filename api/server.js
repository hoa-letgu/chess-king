// server.js
import { createServer } from "http";
import { Server } from "socket.io";
import express from "express";
import cors from "cors";

//import registerChessServer from "./games/chess.server.js";
import registerXiangqiServer from "./games/xiangqi.server.js"; // 👈 THÊM DÒNG NÀY

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  // Đăng ký CỜ VUA
  //registerChessServer(io, socket);

  // Đăng ký CỜ TƯỚNG
  registerXiangqiServer(io, socket);
});

httpServer.listen(3001, () => {
  console.log("Server chạy tại http://localhost:3001");
});
