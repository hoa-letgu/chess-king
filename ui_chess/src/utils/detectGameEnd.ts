import { Chess } from "chess.js";

export function detectGameEnd(game: Chess) {
  // ================================
  // 1️⃣ Chiếu bí (CHECKMATE)
  // ================================
  if (game.isCheckmate()) {
    const winner = game.turn() === "w" ? "b" : "w";
    return {
      ended: true,
      winner,
      reason: "checkmate",
    };
  }

  // ================================
  // 2️⃣ Hòa do hết nước đi (STALEMATE)
  // ================================
  if (game.isStalemate()) {
    return {
      ended: true,
      winner: null,
      reason: "stalemate",
    };
  }

  // ================================
  // 3️⃣ Hòa do thiếu quân chiếu bí (Insufficient Material)
  // ================================
  if (game.isInsufficientMaterial()) {
    return {
      ended: true,
      winner: null,
      reason: "insufficient_material",
    };
  }

  // ================================
  // 4️⃣ Hòa do lặp lại 3 lần (Threefold Repetition)
  // ================================
  if (game.isThreefoldRepetition()) {
    return {
      ended: true,
      winner: null,
      reason: "threefold_repetition",
    };
  }

  // ================================
  // 5️⃣ Hòa do 50 nước (Fifty-Move Rule)
  // ================================
  const parts = game.fen().split(" ");
  const halfmoves = Number(parts[4]); // chỉ số thứ 4 trong FEN

  if (halfmoves >= 100) {
    return {
      ended: true,
      winner: null,
      reason: "fifty_move_rule",
    };
  }

  // ================================
  // 6️⃣ Chưa kết thúc
  // ================================
  return {
    ended: false,
    winner: null,
    reason: null,
  };
}
