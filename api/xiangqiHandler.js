// server/xiangqiHandler.js
import { boardToFen, fenToBoard } from "./xfengenerator.js";
import { initialBoard } from "./initialBoard.js";


/**
 * Trạng thái 1 phòng cờ tướng
 * {
 *   fen: string,
 *   turn: "red" | "black",
 *   players: { red: socketId | null, black: socketId | null }
 * }
 */

const XIANGQI_INITIAL_FEN = boardToFen(initialBoard, "red");

export function attachXiangqiHandlers(io) {
  // roomName -> state
  const rooms = new Map();

  io.on("connection", (socket) => {
    console.log("[Xiangqi] client connected:", socket.id);

    // =============================
    // LIST ROOMS
    // =============================
    socket.on("xiangqi:rooms:list", () => {
      const list = [];
      for (const [roomName, state] of rooms.entries()) {
        list.push({
          roomName,
          players: {
            red: state.players.red ? true : false,
            black: state.players.black ? true : false,
          },
        });
      }
      socket.emit("xiangqi:rooms:list:response", list);
    });

    // =============================
    // CREATE ROOM
    // =============================
    socket.on("xiangqi:room:create", ({ roomName }) => {
      if (!roomName) return;

      if (rooms.has(roomName)) {
        socket.emit("xiangqi:error", { message: "Phòng đã tồn tại" });
        return;
      }

      const state = {
        fen: XIANGQI_INITIAL_FEN,
        turn: "red",
        players: {
          red: null,
          black: null,
        },
      };

      rooms.set(roomName, state);
      console.log("[Xiangqi] create room:", roomName);

      socket.emit("xiangqi:room:created", { roomName });
    });

    // =============================
    // JOIN ROOM + CHỌN MÀU
    // preferredSide: "red" | "black" | "any"
    // =============================
    socket.on("xiangqi:room:join", async ({ roomName, preferredSide }) => {
      const state = rooms.get(roomName);
      if (!state) {
        socket.emit("xiangqi:error", { message: "Phòng không tồn tại" });
        return;
      }

      // Chọn màu
      let assignedSide = null;

      if (preferredSide === "red" || preferredSide === "black") {
        if (!state.players[preferredSide]) {
          assignedSide = preferredSide;
        }
      }

      if (!assignedSide) {
        // auto gán
        if (!state.players.red) assignedSide = "red";
        else if (!state.players.black) assignedSide = "black";
        else assignedSide = null; // spectator
      }

      // join socket.io room
      await socket.join(roomName);

      if (assignedSide) {
        state.players[assignedSide] = socket.id;
      }

      // Gửi state hiện tại cho người vừa join
      socket.emit("xiangqi:room:joined", {
        roomName,
        side: assignedSide,          // "red" / "black" / null (spectator)
        fen: state.fen,
        turn: state.turn,
        players: state.players,
      });

      // Broadcast cho các client khác trong phòng
      io.to(roomName).emit("xiangqi:state", {
        roomName,
        fen: state.fen,
        turn: state.turn,
        players: state.players,
      });

      console.log(
        `[Xiangqi] ${socket.id} join room=${roomName} as side=${assignedSide}`
      );
    });

    // =============================
    // LEAVE ROOM
    // =============================
    socket.on("xiangqi:room:leave", async ({ roomName }) => {
      const state = rooms.get(roomName);
      if (!state) return;

      await socket.leave(roomName);

      if (state.players.red === socket.id) state.players.red = null;
      if (state.players.black === socket.id) state.players.black = null;

      // Nếu phòng trống hết thì xóa
      if (!state.players.red && !state.players.black) {
        rooms.delete(roomName);
        console.log("[Xiangqi] delete empty room:", roomName);
      } else {
        io.to(roomName).emit("xiangqi:state", {
          roomName,
          fen: state.fen,
          turn: state.turn,
          players: state.players,
        });
      }
    });

    // =============================
    // XỬ LÝ NƯỚC ĐI
    // (Ở đây trust client, không validate full luật trên server)
    // =============================
    socket.on("xiangqi:move", ({ roomName, from, to }) => {
      const state = rooms.get(roomName);
      if (!state) return;

      const { board, turn } = fenToBoard(state.fen);

      // XÁC ĐỊNH NGƯỜI NÀO ĐANG ĐI
      const sideMoving = turn; // "red" | "black"
      const playerSocketId = state.players[sideMoving];

      if (playerSocketId !== socket.id) {
        socket.emit("xiangqi:error", { message: "Không phải lượt của bạn" });
        return;
      }

      // Apply move đơn giản trên server
      const [r1, c1] = squareToCoord(from);
      const [r2, c2] = squareToCoord(to);

      const piece = board[r1][c1];
      if (!piece) {
        socket.emit("xiangqi:error", { message: "Không có quân ở ô xuất phát" });
        return;
      }

      board[r2][c2] = piece;
      board[r1][c1] = null;

      const nextTurn = turn === "red" ? "black" : "red";
      const newFen = boardToFen(board, nextTurn);

      state.fen = newFen;
      state.turn = nextTurn;

      io.to(roomName).emit("xiangqi:move", {
        roomName,
        from,
        to,
        fen: newFen,
        turn: nextTurn,
      });

      // Gửi state mới
      io.to(roomName).emit("xiangqi:state", {
        roomName,
        fen: state.fen,
        turn: state.turn,
        players: state.players,
      });
    });

    // =============================
    // DISCONNECT
    // =============================
    socket.on("disconnect", () => {
      console.log("[Xiangqi] client disconnected:", socket.id);

      for (const [roomName, state] of rooms.entries()) {
        let changed = false;
        if (state.players.red === socket.id) {
          state.players.red = null;
          changed = true;
        }
        if (state.players.black === socket.id) {
          state.players.black = null;
          changed = true;
        }

        if (changed) {
          // Nếu phòng trống thì xóa
          if (!state.players.red && !state.players.black) {
            rooms.delete(roomName);
          } else {
            io.to(roomName).emit("xiangqi:state", {
              roomName,
              fen: state.fen,
              turn: state.turn,
              players: state.players,
            });
          }
        }
      }
    });
  });
}

/**
 * squareToCoord dùng chung với client:
 * "a10".."i1" → [r,c] (0..9, 0..8)
 */
function squareToCoord(sq) {
  const files = "abcdefghi";
  const file = files.indexOf(sq[0]);
  const rank = Number(sq.slice(1));
  return [10 - rank, file];
}
