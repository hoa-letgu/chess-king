// utils/chessEngine.ts
import { Chess, Move } from "chess.js";

export const PIECE_VALUES: Record<string, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

export function evaluateBoard(game: Chess): number {
  const board = game.board();
  let score = 0;

  for (const row of board) {
    for (const piece of row) {
      if (!piece) continue;
      const v = PIECE_VALUES[piece.type];
      score += piece.color === "w" ? v : -v;
    }
  }
  return score;
}

export function negamax(
  game: Chess,
  depth: number,
  alpha: number,
  beta: number
): number {
  if (depth === 0 || game.isGameOver()) {
    const evalScore = evaluateBoard(game);
    return game.turn() === "w" ? evalScore : -evalScore;
  }

  let best = -Infinity;
  const moves = game.moves({ verbose: true }) as Move[];

  for (const mv of moves) {
    game.move(mv);
    const score = -negamax(game, depth - 1, -beta, -alpha);
    game.undo();

    if (score > best) best = score;
    if (score > alpha) alpha = score;
    if (alpha >= beta) break;
  }

  return best;
}

export function findBestMove(game: Chess, depth: number): Move | null {
  const moves = game.moves({ verbose: true }) as Move[];
  if (!moves.length) return null;

  let bestScore = -Infinity;
  let bestMoves: Move[] = [];

  for (const mv of moves) {
    game.move(mv);
    const score = -negamax(game, depth - 1, -Infinity, Infinity);
    game.undo();

    if (score > bestScore) {
      bestScore = score;
      bestMoves = [mv];
    } else if (score === bestScore) {
      bestMoves.push(mv);
    }
  }

  return bestMoves[Math.floor(Math.random() * bestMoves.length)];
}
