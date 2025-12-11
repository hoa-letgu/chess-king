// utils/xfengenerator.ts
// ===============================================
// X-FEN CHO CỜ TƯỚNG (10 × 9)
// ===============================================
//
// - Chữ hoa = đỏ
// - Chữ thường = đen
// - Ký tự quân:
//   K/k = Tướng
//   A/a = Sĩ
//   E/e = Tượng
//   H/h = Mã
//   R/r = Xe
//   C/c = Pháo
//   S/s = Tốt
//
// - Mỗi hàng: quân hoặc số ô trống
// - Hàng 10 → hàng 1 (giống cờ vua FEN)
// ===============================================

import type { XiangqiPieceKey } from "./pieces";

export function fenToBoard(fen: string) {
  const [boardPart, turnPart] = fen.split(" ");

  const rows = boardPart.split("/");
  if (rows.length !== 10) {
    console.error("Invalid FEN rows:", rows);
    return { board: [], turn: "red" };
  }

  const board: (XiangqiPieceKey | null)[][] = [];

  for (let r = 0; r < 10; r++) {
    const row = rows[r];
    const line: (XiangqiPieceKey | null)[] = [];

    for (const ch of row) {
      if (/\d/.test(ch)) {
        const n = Number(ch);
        for (let i = 0; i < n; i++) line.push(null);
      } else {
        line.push(ch as XiangqiPieceKey);
      }
    }

    // đảm bảo đủ 9 cột
    while (line.length < 9) line.push(null);

    board.push(line);
  }

  return {
    board,
    turn: turnPart === "b" ? "black" : "red"
  };
}

export function boardToFen(board: (XiangqiPieceKey | null)[][], turn: "red" | "black") {
  const rows: string[] = [];

  for (let r = 0; r < 10; r++) {
    let row = "";
    let empty = 0;

    for (let c = 0; c < 9; c++) {
      const piece = board[r][c];

      if (piece) {
        if (empty > 0) {
          row += empty.toString();
          empty = 0;
        }
        row += piece;
      } else {
        empty++;
      }
    }

    if (empty > 0) row += empty.toString();
    rows.push(row);
  }

  const fenBoard = rows.join("/");
  const fenTurn = turn === "black" ? "b" : "w";

  return `${fenBoard} ${fenTurn}`;
}
