// chess.server.js
import { Chess } from "chess.js";

// roomName -> state
// thêm white / black để nhớ người nào màu nào
const rooms = new Map();

export default function registerChessServer(io, socket) {

  console.log("Chess module active for:", socket.id);

  // ======================================
  // 1) LIST ROOMS
  // ======================================
  socket.on("rooms:list", () => {
    const list = [];

    for (const [roomName] of rooms.entries()) {
      const clients = io.sockets.adapter.rooms.get(roomName);
      list.push({
        roomName,
        players: clients ? clients.size : 0,
      });
    }

    socket.emit("rooms:list:response", list);
  });

  // ======================================
  // 2) CREATE ROOM
  // ======================================
  socket.on("room:create", ({ name }) => {
    const roomName = String(name || "").trim();
    console.log(name);

    if (!roomName) {
      socket.emit("room:create:error", "Tên phòng không được để trống!");
      return;
    }

    if (!/^[A-Za-z0-9 ]{1,20}$/.test(roomName)) {
      socket.emit(
        "room:create:error",
        "Tên phòng chỉ dùng chữ / số / khoảng trắng (tối đa 20 ký tự)"
      );
      return;
    }

    if (rooms.size >= 9) {
      socket.emit("room:limit-reached", "Chỉ cho phép tối đa 9 phòng!");
      return;
    }

    if (rooms.has(roomName)) {
      socket.emit("room:name-exists", "Tên phòng đã tồn tại!");
      return;
    }

    const game = new Chess();
    rooms.set(roomName, {
      fen: game.fen(),
      history: [game.fen()],
      historyIndex: 0,
      lastMove: null,
      white: null,
      black: null,
    });

    socket.emit("room:created", { roomName });
    io.emit("rooms:update");
  });

  // ======================================
  // 3) JOIN ROOM (FIX MÀU CHUẨN)
  // ======================================
  socket.on("room:join", ({ roomName }) => {
    let roomState = rooms.get(roomName);

    if (!roomState) {
      const game = new Chess();
      roomState = {
        fen: game.fen(),
        history: [game.fen()],
        historyIndex: 0,
        lastMove: null,
        white: null,
        black: null,
      };
      rooms.set(roomName, roomState);
    }

    const room = io.sockets.adapter.rooms.get(roomName);
    const clients = room ? [...room] : [];

    // Nếu phòng FULL thật
    if (clients.length >= 2 && !clients.includes(socket.id)) {
      socket.emit("room:full", roomName);
      return;
    }

    // GÁN MÀU
    let color = null;

    if (roomState.white === socket.id) color = "w";
    else if (roomState.black === socket.id) color = "b";
    else if (!roomState.white) {
      roomState.white = socket.id;
      color = "w";
    } else if (!roomState.black) {
      roomState.black = socket.id;
      color = "b";
    } else {
      socket.emit("room:full", roomName);
      return;
    }

    socket.join(roomName);

    socket.emit("room:joined", {
      roomName,
      color,
      fen: roomState.fen,
      history: roomState.history,
      historyIndex: roomState.historyIndex,
      lastMove: roomState.lastMove,
    });

    io.to(roomName).emit("room:players", {
      roomName,
      players: (io.sockets.adapter.rooms.get(roomName)?.size || 0),
    });

    io.emit("rooms:update");
  });

  // ======================================
  // 4) LEAVE ROOM REQUEST
  // ======================================
  socket.on("room:leave:request", ({ roomName }) => {
    socket.to(roomName).emit("room:leave:confirm", { from: socket.id });
  });

  socket.on("room:leave:approved", ({ roomName }) => {
    const room = io.sockets.adapter.rooms.get(roomName);
    if (!room) return;

    const players = [...room];

    io.to(roomName).emit("room:force-leave");

    players.forEach((id) => {
      const s = io.sockets.sockets.get(id);
      if (s) s.leave(roomName);
    });

    rooms.delete(roomName);
    io.emit("rooms:update");
  });

  socket.on("room:leave:denied", () => {
    socket.emit("room:leave:denied");
  });

  // ======================================
  // 5) DRAW REQUEST
  // ======================================
  socket.on("draw:offer", ({ roomName }) => {
    socket.to(roomName).emit("draw:offer:received");
  });

  socket.on("draw:accept", ({ roomName }) => {
    io.to(roomName).emit("draw:accepted");
  });

  socket.on("draw:reject", ({ roomName }) => {
    socket.to(roomName).emit("draw:rejected");
  });

  // ======================================
  // 6) GAME UPDATE
  // ======================================
  socket.on("game:state", ({ roomName, fen, history, historyIndex, lastMove, moveId }) => {
    if (!roomName) return;

    const roomState = rooms.get(roomName);
    if (!roomState) return;

    roomState.fen = fen;
    roomState.history = history;
    roomState.historyIndex = historyIndex;
    roomState.lastMove = lastMove;

    socket.to(roomName).emit("game:update", {
      fen,
      history,
      historyIndex,
      lastMove,
      moveId,
    });
  });

  socket.on("game:restart", ({ roomName }) => {
    const state = rooms.get(roomName);
    if (!state) return;

    const game = new Chess();
    state.fen = game.fen();
    state.history = [state.fen];
    state.historyIndex = 0;
    state.lastMove = null;

    io.to(roomName).emit("game:restart", {
      fen: state.fen,
      history: state.history,
      historyIndex: state.historyIndex,
    });
  });

  // ======================================
  // 7) CLEAR EMPTY ROOMS
  // ======================================
  socket.on("rooms:clear", () => {
    let removed = 0;

    for (const [roomName] of rooms.entries()) {
      const clients = io.sockets.adapter.rooms.get(roomName);
      if (!clients || clients.size === 0) {
        rooms.delete(roomName);
        removed++;
      }
    }

    socket.emit("rooms:clear:done", { removed });
    io.emit("rooms:update");
  });

  // ======================================
  // 8) DISCONNECT
  // ======================================
  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);

    for (const [roomName] of rooms.entries()) {
      const room = io.sockets.adapter.rooms.get(roomName);
      if (!room || room.size === 0) {
        rooms.delete(roomName);
        io.emit("rooms:update");
        continue;
      }
      if (room.size === 1) {
        io.to(roomName).emit("room:left");
      }
    }
  });
}
