import type { Board, Stone } from "./rules";
import { scoreBoard } from "./score";
import { opposite } from "./rules";

type Move = { r: number; c: number };

function clone(b: Board): Board {
  return b.map(r => [...r]);
}

function randomMove(board: Board): Move | null {
  const moves: Move[] = [];
  for (let r = 0; r < board.length; r++)
    for (let c = 0; c < board.length; c++)
      if (board[r][c] === null) moves.push({ r, c });
  return moves.length ? moves[Math.floor(Math.random() * moves.length)] : null;
}

export function findMCTSMove(
  board: Board,
  bot: Exclude<Stone, null>,
  opts: { simulations: number; rolloutDepth: number }
): Move | null {

  const scores = new Map<string, number>();

  for (let i = 0; i < opts.simulations; i++) {
    const mv = randomMove(board);
    if (!mv) continue;

    let b = clone(board);
    b[mv.r][mv.c] = bot;
    let t = opposite(bot);

    for (let d = 0; d < opts.rolloutDepth; d++) {
      const rm = randomMove(b);
      if (!rm) break;
      b[rm.r][rm.c] = t;
      t = opposite(t);
    }

    const s = scoreBoard(b);
    const val = bot === "black"
      ? s.territoryBlack - s.territoryWhite
      : s.territoryWhite - s.territoryBlack;

    const key = `${mv.r},${mv.c}`;
    scores.set(key, (scores.get(key) ?? 0) + val);
  }

  let best: Move | null = null;
  let bestScore = -Infinity;

  for (const [k, v] of scores) {
    if (v > bestScore) {
      bestScore = v;
      const [r, c] = k.split(",").map(Number);
      best = { r, c };
    }
  }

  return best;
}
