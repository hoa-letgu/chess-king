// src/games/go/utils/goPlay.ts
import type { Board, Stone } from "./rules";
import { opposite } from "./rules";
import { removeDeadGroups, getGroup } from "./liberties";

export function playMove(
  board: Board,
  r: number,
  c: number,
  color: Stone
): Board | null {
  if (board[r][c] !== null) return null;

  const next = board.map(row => [...row]);
  next[r][c] = color;

  // ăn đối phương
  const enemy = opposite(color as any);
  const after = removeDeadGroups(next, enemy);

  // suicide check
  const g = getGroup(after, r, c);
  if (g.liberties === 0) return null;

  return after;
}
