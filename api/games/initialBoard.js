// api/games/xiangqi/initialBoard.js

// 10 hàng × 9 cột
export const initialBoard = [
  ["r", "h", "e", "a", "g", "a", "e", "h", "r"],
  [null, null, null, null, null, null, null, null, null],
  [null, "c", null, null, null, null, null, "c", null],
  ["s", null, "s", null, "s", null, "s", null, "s"],
  [null, null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null, null],
  ["S", null, "S", null, "S", null, "S", null, "S"],
  [null, "C", null, null, null, null, null, "C", null],
  [null, null, null, null, null, null, null, null, null],
  ["R", "H", "E", "A", "G", "A", "E", "H", "R"],
];

/**
 * Clone board sâu để tránh reference bug
 */
export function cloneBoard(board = initialBoard) {
  return board.map(row => [...row]);
}
