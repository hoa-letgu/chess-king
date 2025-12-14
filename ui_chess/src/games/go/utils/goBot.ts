// src/games/go/utils/goBot.ts
import type { Board, Stone } from "./rules";
import { opposite } from "./rules";
import { generateCandidates } from "./goCandidates";
import { playMove } from "./goPlay";
import { evaluateBoard } from "./goEval";
import { boardToKey } from "./ko";

function negamax(
  board: Board,
  side: Stone,
  bot: Stone,
  depth: number,
  alpha: number,
  beta: number,
  history: Set<string>
): number {
  if (depth === 0) {
    return evaluateBoard(board, bot);
  }

  const moves = generateCandidates(board);
  let best = -Infinity;

  for (const {r,c} of moves) {
    const next = playMove(board, r, c, side);
    if (!next) continue;

    const key = boardToKey(next);
    if (history.has(key)) continue;

    history.add(key);
    const score =
      -negamax(
        next,
        opposite(side),
        bot,
        depth - 1,
        -beta,
        -alpha,
        history
      );
    history.delete(key);

    best = Math.max(best, score);
    alpha = Math.max(alpha, score);
    if (alpha >= beta) break; // PRUNE
  }

  return best;
}

export function findBotMove(
  board: Board,
  bot: Stone,
  depth = 3
): { r:number;c:number } | null {
  const moves = generateCandidates(board);
  let bestScore = -Infinity;
  let best: any = null;

  const history = new Set<string>();
  history.add(boardToKey(board));

  for (const mv of moves) {
    const next = playMove(board, mv.r, mv.c, bot);
    if (!next) continue;

    const score =
      -negamax(
        next,
        opposite(bot),
        bot,
        depth - 1,
        -Infinity,
        Infinity,
        history
      );

    if (score > bestScore) {
      bestScore = score;
      best = mv;
    }
  }

  return best;
}
