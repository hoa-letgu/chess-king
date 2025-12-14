// src/games/go/utils/territory.ts
import type { Board, Stone } from "./rules";

export function estimateTerritory(
  board: Board,
  color: Exclude<Stone, null>
): number {
  const size = board.length;
  const visited = new Set<string>();
  let score = 0;

  const dirs = [[1,0],[-1,0],[0,1],[0,-1]];

  function dfs(r: number, c: number) {
    const stack = [[r, c]];
    const empties: [number, number][] = [];
    const borders = new Set<Stone>();

    while (stack.length) {
      const [x, y] = stack.pop()!;
      const k = `${x},${y}`;
      if (visited.has(k)) continue;
      visited.add(k);

      empties.push([x, y]);

      for (const [dx, dy] of dirs) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= size || ny >= size) continue;

        const t = board[nx][ny];
        if (t === null) stack.push([nx, ny]);
        else borders.add(t);
      }
    }

    if (borders.size === 1 && borders.has(color)) {
      return empties.length;
    }
    return 0;
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (board[r][c] === null && !visited.has(`${r},${c}`)) {
        score += dfs(r, c);
      }
    }
  }

  return score;
}
