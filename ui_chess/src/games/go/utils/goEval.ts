// src/games/go/utils/goEval.ts
import type { Board, Stone } from "./rules";

export function evaluateBoard(
  board: Board,
  bot: Stone
): number {
  let score = 0;
  const size = board.length;
  const mid = Math.floor(size / 2);

  for (let r=0;r<size;r++){
    for (let c=0;c<size;c++){
      const p = board[r][c];
      if (!p) continue;

      let v = 10;
      v -= Math.abs(r - mid);
      v -= Math.abs(c - mid);

      score += p === bot ? v : -v;
    }
  }
  return score;
}
