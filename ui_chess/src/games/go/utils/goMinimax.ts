import type { Board, Stone } from "./rules";
import { scoreBoard } from "./score";
import { opposite } from "./rules";

type Move = { r: number; c: number };

function clone(b: Board): Board {
  return b.map(r => [...r]);
}

function generateMoves(board: Board): Move[] {
  const m: Move[] = [];
  for (let r = 0; r < board.length; r++)
    for (let c = 0; c < board.length; c++)
      if (board[r][c] === null) m.push({ r, c });
  return m;
}

function minimax(
  board: Board,
  turn: Exclude<Stone, null>,
  bot: Exclude<Stone, null>,
  depth: number
): number {
  if (depth === 0) {
    const s = scoreBoard(board);
    return bot === "black"
      ? s.territoryBlack - s.territoryWhite
      : s.territoryWhite - s.territoryBlack;
  }

  const moves = generateMoves(board);
  let best = turn === bot ? -Infinity : Infinity;

  for (const mv of moves) {
    const next = clone(board);
    next[mv.r][mv.c] = turn;

    const val = minimax(next, opposite(turn), bot, depth - 1);

    best = turn === bot
      ? Math.max(best, val)
      : Math.min(best, val);
  }

  return best;
}

export function findMinimaxMove(
  board: Board,
  bot: Exclude<Stone, null>,
  depth = 5
): Move | null {
  let bestScore = -Infinity;
  let bestMove: Move | null = null;

  for (const mv of generateMoves(board)) {
    const next = clone(board);
    next[mv.r][mv.c] = bot;

    const score = minimax(next, opposite(bot), bot, depth - 1);
    if (score > bestScore) {
      bestScore = score;
      bestMove = mv;
    }
  }

  return bestMove;
}
