// games/xiangqi.server.js

export default function registerXiangqiServer(io, socket) {
  // ============================
  // ROOM STORAGE (Xiangqi)
  // ============================
  // roomId -> state
  if (!io.xiangqiRooms) {
    io.xiangqiRooms = new Map();
  }
  const rooms = io.xiangqiRooms;
  function createRoom(roomId) {
    return {
      roomId,
      fen: null,
      turn: "red",
      lastMove: null,
      players: {
        red: null,
        black: null,
      },
    };
  }
function assignSeat(room, socketId) {
  // Nếu socket đã có seat → giữ nguyên
  if (room.players.red === socketId) return "red";
  if (room.players.black === socketId) return "black";

  // Chỉ gán nếu slot trống
  if (!room.players.red) {
    room.players.red = socketId;
    return "red";
  }

  if (!room.players.black) {
    room.players.black = socketId;
    return "black";
  }

  return "spectator";
}

  function removeSeat(room, socketId) {
    if (room.players.red === socketId) room.players.red = null;
    if (room.players.black === socketId) room.players.black = null;
  }

  function listRooms() {
    const out = [];
    for (const [roomId, r] of rooms.entries()) {
      const count =
        (r.players.red ? 1 : 0) + (r.players.black ? 1 : 0);
      out.push({ roomName: roomId, players: count });
    }
    return out;
  }

  // ============================
  // LIST ROOMS
  // ============================
  socket.on("rooms:list", () => {
    socket.emit("rooms:list:response", listRooms());
  });

  // ============================
  // CREATE ROOM
  // ============================
socket.on("room:create", ({ name, initFen }) => {
  const roomId = String(name || "").trim();
  if (!roomId) return;

  if (!rooms.has(roomId)) rooms.set(roomId, createRoom(roomId));
  const room = rooms.get(roomId);

  // ✅ nếu room chưa có fen, set ngay
  if (!room.fen && initFen) {
    room.fen = initFen;
    room.turn = "red";
    room.lastMove = null;
  }

  const seat = assignSeat(room, socket.id);
  socket.join(roomId);

  socket.emit("room:joined", { roomId, seat, state: room });
  io.to(roomId).emit("xiangqi:state", room);
  io.emit("rooms:list:response", listRooms());
});

  // ============================
  // JOIN ROOM
  // ============================
socket.on("room:join", ({ roomId, initFen }) => {
  const id = String(roomId || "").trim();
  if (!id) return;

  if (!rooms.has(id)) rooms.set(id, createRoom(id));
  const room = rooms.get(id);

  if (!room.fen && initFen) {
    room.fen = initFen;
    room.turn = "red";
    room.lastMove = null;
  }

  const seat = assignSeat(room, socket.id);
  socket.join(id);

  socket.emit("room:joined", { roomId: id, seat, state: room });
  io.to(id).emit("xiangqi:state", room);
  io.emit("rooms:list:response", listRooms());
});


  // ============================
  // LEAVE ROOM
  // ============================

  
  // ============================
// LEAVE ROOM (HỦY PHÒNG)
// ============================
socket.on("xiangqi:leave", ({ roomId }) => {
  const room = rooms.get(roomId);
  if (!room) return;

  // Thông báo cho tất cả client trong room
  io.to(roomId).emit("xiangqi:room_closed");

  // Cho tất cả socket rời room
  const sockets = io.sockets.adapter.rooms.get(roomId);
  if (sockets) {
    for (const sid of sockets) {
      const s = io.sockets.sockets.get(sid);
      if (s) s.leave(roomId);
    }
  }

  // Xóa room hoàn toàn
  rooms.delete(roomId);

  // Update danh sách phòng
  io.emit("rooms:list:response", listRooms());
});


// ============================
// DRAW REQUEST
// ============================
socket.on("xiangqi:draw:request", ({ roomId }) => {
  const room = rooms.get(roomId);
  if (!room) return;

  const isRed = room.players.red === socket.id;
  const isBlack = room.players.black === socket.id;

  if (!isRed && !isBlack) return;

  // Gửi sang đối phương
  socket.to(roomId).emit("xiangqi:draw:requested", {
    from: isRed ? "red" : "black",
  });
});

socket.on("xiangqi:draw:accept", ({ roomId }) => {
  const room = rooms.get(roomId);
  if (!room) return;

  // 1️⃣ thông báo kết quả hòa
  io.to(roomId).emit("xiangqi:draw:result", { result: "draw" });

  // 2️⃣ thông báo room đóng (⭐ QUAN TRỌNG)
  io.to(roomId).emit("xiangqi:room_closed");

  // 3️⃣ cho tất cả socket rời room
  const sockets = io.sockets.adapter.rooms.get(roomId);
  if (sockets) {
    for (const sid of sockets) {
      const s = io.sockets.sockets.get(sid);
      if (s) s.leave(roomId);
    }
  }

  // 4️⃣ xóa room
  rooms.delete(roomId);

  io.emit("rooms:list:response", listRooms());
});



socket.on("xiangqi:draw:reject", ({ roomId }) => {
  const room = rooms.get(roomId);
  if (!room) return;

  socket.to(roomId).emit("xiangqi:draw:rejected");
});



  // ============================
  // SYNC STATE
  // ============================
  socket.on("xiangqi:sync", ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room) return;
    socket.emit("xiangqi:state", room);
  });

  // ============================
  // RECEIVE MOVE (FEN)
  // ============================
  socket.on("xiangqi:move", ({ roomId, fen, turn, lastMove }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    const isRed = room.players.red === socket.id;
    const isBlack = room.players.black === socket.id;

    if (!isRed && !isBlack) return;

    const seat = isRed ? "red" : "black";

    // khóa lượt
    if (room.turn !== seat) return;

    room.fen = fen;
    room.turn = turn;
    room.lastMove = lastMove || null;

    io.to(roomId).emit("xiangqi:state", room);
  });

  // ============================
  // DISCONNECT
  // ============================
  socket.on("disconnect", () => {
    for (const [roomId, room] of rooms.entries()) {
      const before = { ...room.players };
      removeSeat(room, socket.id);

      if (
        before.red !== room.players.red ||
        before.black !== room.players.black
      ) {
        io.to(roomId).emit("room:state", room);
      }
    }
    io.emit("rooms:list:response", listRooms());
  });
}
