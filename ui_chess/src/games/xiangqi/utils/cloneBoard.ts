//cloneBoard.ts
export function cloneBoard(board) {
  return board.map(row => [...row]);
}
