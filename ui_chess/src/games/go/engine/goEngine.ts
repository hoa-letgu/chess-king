import type { Board, Stone } from "../utils/rules";
import { opposite } from "../utils/rules";
import { boardToKey } from "../utils/boardKey";

export type GoState = {
  board: Board;
  turn: Exclude<Stone, null>;
  history: Set<string>;
  lastMove: [number, number] | null;
};

const DIR = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

function inside(b: Board, r: number, c: number) {
  return r >= 0 && c >= 0 && r < b.length && c < b.length;
}

function collectGroup(
  board: Board,
  r: number,
  c: number,
  color: Exclude<Stone, null>,
  visited = new Set<string>()
): { stones: [number, number][], liberties: number } {
  const key = `${r},${c}`;
  if (visited.has(key)) return { stones: [], liberties: 0 };
  visited.add(key);

  let stones: [number, number][] = [[r, c]];
  let liberties = 0;

  for (const [dr, dc] of DIR) {
    const nr = r + dr;
    const nc = c + dc;
    if (!inside(board, nr, nc)) continue;

    const v = board[nr][nc];
    if (v === null) liberties++;
    else if (v === color) {
      const g = collectGroup(board, nr, nc, color, visited);
      stones.push(...g.stones);
      liberties += g.liberties;
    }
  }

  return { stones, liberties };
}

export function createInitialState(size: number): GoState {
  const board: Board = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => null)
  );

  return {
    board,
    turn: "black",
    history: new Set([boardToKey(board)]),
    lastMove: null,
  };
}

export function applyMove(
  state: GoState,
  r: number,
  c: number
): { ok: false } | { ok: true; state: GoState } {
  const { board, turn, history } = state;
  if (board[r][c] !== null) return { ok: false };

  const next: Board = board.map(row => [...row]);
  next[r][c] = turn;

  // ăn quân
  for (const [dr, dc] of DIR) {
    const nr = r + dr;
    const nc = c + dc;
    if (!inside(next, nr, nc)) continue;
    if (next[nr][nc] === opposite(turn)) {
      const g = collectGroup(next, nr, nc, opposite(turn));
      if (g.liberties === 0) {
        for (const [sr, sc] of g.stones) next[sr][sc] = null;
      }
    }
  }

  // suicide
  const self = collectGroup(next, r, c, turn);
  if (self.liberties === 0) return { ok: false };

  const key = boardToKey(next);
  if (history.has(key)) return { ok: false }; // SUPERKO

  const newHistory = new Set(history);
  newHistory.add(key);

  return {
    ok: true,
    state: {
      board: next,
      turn: opposite(turn),
      history: newHistory,
      lastMove: [r, c],
    },
  };
}
