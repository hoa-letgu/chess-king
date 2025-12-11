// src/games/xiangqi/utils/initialBoard.ts
import type { XiangqiPieceKey } from "./pieces";

// 10 hàng × 9 cột
export const initialBoard: (XiangqiPieceKey | null)[][] = [
  // Hàng 10 (đen trên)
  ["r", "h", "e", "a", "g", "a", "e", "h", "r"],
  // Hàng 9
  [null, null, null, null, null, null, null, null, null],
  // Hàng 8
  [null, "c", null, null, null, null, null, "c", null],
  // Hàng 7
  ["s", null, "s", null, "s", null, "s", null, "s"],
  // Hàng 6
  [null, null, null, null, null, null, null, null, null],
  // Hàng 5
  [null, null, null, null, null, null, null, null, null],
  // Hàng 4
  ["S", null, "S", null, "S", null, "S", null, "S"],
  // Hàng 3
  [null, "C", null, null, null, null, null, "C", null],
  // Hàng 2
  [null, null, null, null, null, null, null, null, null],
  // Hàng 1 (đỏ dưới)
  ["R", "H", "E", "A", "G", "A", "E", "H", "R"],
];
