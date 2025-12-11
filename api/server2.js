// server.js
import { createServer } from "http";
import { Server } from "socket.io";
import express from "express";
import cors from "cors";

import rooms from "./roomManager.js";
import { attachXiangqiHandlers } from "./xiangqiHandler.js";

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });

// GẮN HANDLER CỜ TƯỚNG MỘT LẦN DUY NHẤT
attachXiangqiHandlers(io);

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);
});

httpServer.listen(3001, () => {
  console.log("Server chạy tại http://localhost:3001");
});
