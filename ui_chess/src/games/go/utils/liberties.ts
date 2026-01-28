// src/games/go/utils/liberties.ts
import type { Board, Stone } from "./rules";

const DIRS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

export type GroupInfo = {
  stones: [number, number][];
  liberties: number;
};

export function getGroup(
  board: Board,
  r: number,
  c: number
): { stones: [number, number][], liberties: number } {
  const color = board[r][c];
  if (!color) return { stones: [], liberties: 0 };

  const visited = new Set<string>();
  const liberties = new Set<string>();
  const stack = [[r, c]];
  const stones: [number, number][] = [];

  while (stack.length) {
    const [x, y] = stack.pop()!;
    const k = `${x},${y}`;
    if (visited.has(k)) continue;
    visited.add(k);
    stones.push([x, y]);

    for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      const nx = x + dx, ny = y + dy;
      if (!board[nx]?.[ny]) {
        liberties.add(`${nx},${ny}`);
      } else if (board[nx][ny] === color) {
        stack.push([nx, ny]);
      }
    }
  }

  return { stones, liberties: liberties.size };
}

export function removeDeadGroups(
  board: Board,
  color: Exclude<Stone, null>
): Board {
  const size = board.length;
  const next = board.map(r => [...r]);
  const visited = new Set<string>();

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (next[r][c] !== color) continue;

      const key = `${r},${c}`;
      if (visited.has(key)) continue;

      const g = getGroup(next, r, c, visited);
      if (g.liberties === 0) {
        for (const [gr, gc] of g.stones) {
          next[gr][gc] = null;
        }
      }
    }
  }

  return next;
}
