import { getAllAttacks } from "./moveGenerator";

export function isInCheck(board, side: "red" | "black") {
  // ⛔ Nếu board null / undefined → KHÔNG BÁO LỖI
  if (!board || !Array.isArray(board) || board.length !== 10) {
    return false;
  }
  for (let r = 0; r < 10; r++) {
    if (!Array.isArray(board[r]) || board[r].length !== 9) return false;
  }

  const general = side === "red" ? "G" : "g";

  let gr = -1, gc = -1;

  // Tìm vị trí tướng
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] === general) {
        gr = r;
        gc = c;
      }
    }
  }

  // Không tìm thấy tướng → coi như không bị chiếu
  if (gr === -1 || gc === -1) return false;

  // Lấy tất cả ô bị đối phương tấn công
  const attacks = getAllAttacks(board, side === "red" ? "black" : "red");

  if (!Array.isArray(attacks)) return false;

  return attacks.some(a => a.r === gr && a.c === gc);
}
