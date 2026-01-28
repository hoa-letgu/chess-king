// src/games/go/utils/goPlay.ts
import type { Board, Stone } from "./rules";
import { opposite } from "./rules";
import { removeDeadGroups, getGroup } from "./liberties";

export type PlayResult = {
  board: Board;
  captured: boolean;
};

export function playMove(
  board: Board,
  r: number,
  c: number,
  color: Exclude<Stone, null>
): PlayResult | null {
  // ❌ ô đã có quân
  if (board[r][c] !== null) return null;

  // clone board
  const next: Board = board.map(row => [...row]);
  next[r][c] = color;

  const enemy = opposite(color);

  // ăn quân đối phương
  const beforeKey = JSON.stringify(next);
  const after = removeDeadGroups(next, enemy);
  const afterKey = JSON.stringify(after);

  const captured = beforeKey !== afterKey;

  // suicide check (sau capture)
  const group = getGroup(after, r, c);
  if (!group || group.liberties === 0) {
    return null;
  }

  return {
    board: after,
    captured,
  };
}
