// utilsBoard.ts

import type { XiangqiPieceKey } from "./pieces";

/** Tạo bản sao (deep clone) của ma trận cờ tướng */
export function cloneBoard(
  board: (XiangqiPieceKey | null | "")[][]
) {
  return board.map(row => [...row]);
}

/** Tạo board rỗng — dùng nếu cần reset */
export function createEmptyBoard(): (XiangqiPieceKey | null)[][] {
  const b: (XiangqiPieceKey | null)[][] = [];
  for (let r = 0; r < 10; r++) {
    const row = new Array(9).fill(null);
    b.push(row);
  }
  return b;
}

/** Debug: in board ra console (tùy chọn) */
export function printBoard(board) {
  console.log(
    board.map(row =>
      row.map(cell => cell || ".").join(" ")
    ).join("\n")
  );
}
