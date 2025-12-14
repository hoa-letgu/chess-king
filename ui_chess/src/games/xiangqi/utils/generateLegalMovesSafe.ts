import { squareToCoord } from "./rules";
import { cloneBoard } from "./cloneBoard";
import { isInCheck } from "./isInCheck";
import type { XiangqiPieceKey } from "./pieces";
import { generateLegalMoves } from "./rules";

export function generateLegalMovesSafe(
  board: (XiangqiPieceKey | null | "")[][],
  square: string,
  piece: XiangqiPieceKey
): string[] {
  const rawMoves = generateLegalMoves(board, square, piece);
  const color = piece === piece.toUpperCase() ? "red" : "black";

  const safeMoves: string[] = [];

  for (const to of rawMoves) {
    const [r1, c1] = squareToCoord(square);
    const [r2, c2] = squareToCoord(to);

    const next = cloneBoard(board);
    next[r2][c2] = piece;
    next[r1][c1] = null;

    // 🚫 Nếu sau nước này tướng vẫn bị chiếu → LOẠI
    if (!isInCheck(next, color)) {
      safeMoves.push(to);
    }
  }

  return safeMoves;
}
