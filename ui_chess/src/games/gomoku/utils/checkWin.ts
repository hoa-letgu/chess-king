//src\games\gomoku\utils\checkWin.ts
export type Cell = "X" | "O" | null;
export type Pos = { r: number; c: number };

const DIRS = [
  { dr: 0, dc: 1 },   // →
  { dr: 1, dc: 0 },   // ↓
  { dr: 1, dc: 1 },   // ↘
  { dr: 1, dc: -1 },  // ↙
];

export function checkWin(
  board: Cell[][],
  lastR: number,
  lastC: number
): Pos[] | null {
  const sizeR = board.length;
  const sizeC = board[0].length;
  const me = board[lastR][lastC];
  if (!me) return null;

  for (const { dr, dc } of DIRS) {
    const line: Pos[] = [{ r: lastR, c: lastC }];

    // đi xuôi
    let r = lastR + dr;
    let c = lastC + dc;
    while (
      r >= 0 &&
      c >= 0 &&
      r < sizeR &&
      c < sizeC &&
      board[r][c] === me
    ) {
      line.push({ r, c });
      r += dr;
      c += dc;
    }

    // đi ngược
    r = lastR - dr;
    c = lastC - dc;
    while (
      r >= 0 &&
      c >= 0 &&
      r < sizeR &&
      c < sizeC &&
      board[r][c] === me
    ) {
      line.unshift({ r, c });
      r -= dr;
      c -= dc;
    }

    if (line.length >= 5) {
      return line.slice(0, 5);
    }
  }

  return null;
}
