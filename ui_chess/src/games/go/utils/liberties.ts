// src/games/go/utils/liberties.ts
import type { Board, Stone } from "./rules";
import { opposite } from "./rules";


const DIRS = [
  [1, 0], [-1, 0],
  [0, 1], [0, -1],
];

export function getGroup(
  board: Board,
  r: number,
  c: number,
  visited = new Set<string>()
): { stones: [number, number][], liberties: number } {
  const size = board.length;
  const color = board[r][c];
  if (!color) return { stones: [], liberties: 0 };

  const key = `${r},${c}`;
  if (visited.has(key)) return { stones: [], liberties: 0 };
  visited.add(key);

  let stones: [number, number][] = [[r, c]];
  let liberties = 0;

  for (const [dr, dc] of DIRS) {
    const nr = r + dr, nc = c + dc;
    if (nr < 0 || nc < 0 || nr >= size || nc >= size) continue;

    const t = board[nr][nc];
    if (t === null) liberties++;
    else if (t === color) {
      const g = getGroup(board, nr, nc, visited);
      stones = stones.concat(g.stones);
      liberties += g.liberties;
    }
  }

  return { stones, liberties };
}

export function removeDeadGroups(
  board: Board,
  color: Stone
): Board {
  const size = board.length;
  const next = board.map(r => [...r]);

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (next[r][c] !== color) continue;
      const g = getGroup(next, r, c);
      if (g.liberties === 0) {
        for (const [gr, gc] of g.stones) {
          next[gr][gc] = null;
        }
      }
    }
  }

  return next;
}
