export function isCheckmate(board, side) {
  if (!isInCheck(board, side)) return false;

  const moves = generateLegalMoves(board, side);

  for (const mv of moves) {
    const clone = cloneBoard(board);
    clone[mv.to.r][mv.to.c] = clone[mv.from.r][mv.from.c];
    clone[mv.from.r][mv.from.c] = null;

    if (!isInCheck(clone, side)) {
      return false; // Có nước thoát
    }
  }

  return true; // Không có nước thoát nào
}
