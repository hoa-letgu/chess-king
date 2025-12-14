// src/games/go/utils/score.ts
import type { Board, Stone } from "./rules";

const DIRS = [
  [1, 0], [-1, 0],
  [0, 1], [0, -1],
];

export function scoreBoard(board: Board) {
  const size = board.length;
  const visited = new Set<string>();

  let territoryBlack = 0;
  let territoryWhite = 0;
  let stonesBlack = 0;
  let stonesWhite = 0;

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const cell = board[r][c];
      if (cell === "black") stonesBlack++;
      if (cell === "white") stonesWhite++;

      if (cell !== null) continue;

      const key = `${r},${c}`;
      if (visited.has(key)) continue;

      // flood fill vùng trống
      const stack = [[r, c]];
      let area: [number, number][] = [];
      let borders = new Set<Stone>();

      while (stack.length) {
        const [x, y] = stack.pop()!;
        const k = `${x},${y}`;
        if (visited.has(k)) continue;
        visited.add(k);

        area.push([x, y]);

        for (const [dx, dy] of DIRS) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= size || ny >= size) continue;

          const t = board[nx][ny];
          if (t === null) stack.push([nx, ny]);
          else borders.add(t);
        }
      }

      if (borders.size === 1) {
        if (borders.has("black")) territoryBlack += area.length;
        if (borders.has("white")) territoryWhite += area.length;
      }
    }
  }

  return {
    territoryBlack,
    territoryWhite,
    stonesBlack,
    stonesWhite,
  };
}
