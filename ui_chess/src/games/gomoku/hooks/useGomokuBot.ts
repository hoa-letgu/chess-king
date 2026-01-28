import { useEffect } from "react";

type Cell = "X" | "O" | null;

const BOT: Cell = "O";
const HUMAN: Cell = "X";

const DIRS = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1],
];

function cloneBoard(board: Cell[][]) {
  return board.map(r => [...r]);
}

/* ================== HEURISTIC ================== */
function evaluateLine(count: number, openEnds: number) {
  if (count >= 5) return 100000;
  if (count === 4 && openEnds === 2) return 10000;
  if (count === 4 && openEnds === 1) return 1000;
  if (count === 3 && openEnds === 2) return 500;
  if (count === 3 && openEnds === 1) return 50;
  if (count === 2 && openEnds === 2) return 10;
  return 1;
}

function evaluateBoard(board: Cell[][]): number {
  let score = 0;
  const rows = board.length;
  const cols = board[0].length;

  function scorePlayer(player: Cell) {
    let s = 0;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (board[r][c] !== player) continue;

        for (const [dr, dc] of DIRS) {
          let cnt = 1;
          let open = 0;

          let i = 1;
          while (
            board[r + i * dr]?.[c + i * dc] === player
          ) {
            cnt++;
            i++;
          }
          if (board[r + i * dr]?.[c + i * dc] === null)
            open++;

          i = 1;
          while (
            board[r - i * dr]?.[c - i * dc] === player
          ) {
            cnt++;
            i++;
          }
          if (board[r - i * dr]?.[c - i * dc] === null)
            open++;

          s += evaluateLine(cnt, open);
        }
      }
    }
    return s;
  }

  score += scorePlayer(BOT);
  score -= scorePlayer(HUMAN) * 1.1;

  return score;
}

/* ================== MOVE PRUNING ================== */
function getCandidateMoves(board: Cell[][]): [number, number][] {
  const moves = new Set<string>();
  const rows = board.length;
  const cols = board[0].length;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!board[r][c]) continue;

      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const nr = r + dr;
          const nc = c + dc;
          if (
            board[nr]?.[nc] === null
          ) {
            moves.add(`${nr},${nc}`);
          }
        }
      }
    }
  }

  if (moves.size === 0) {
    return [[Math.floor(rows / 2), Math.floor(cols / 2)]];
  }

  return [...moves].map(m =>
    m.split(",").map(Number) as [number, number]
  );
}

/* ================== MINIMAX ================== */
function minimax(
  board: Cell[][],
  depth: number,
  alpha: number,
  beta: number,
  maximizing: boolean
): number {
  if (depth === 0) {
    return evaluateBoard(board);
  }

  const moves = getCandidateMoves(board);

  if (maximizing) {
    let maxEval = -Infinity;
    for (const [r, c] of moves) {
      const b = cloneBoard(board);
      b[r][c] = BOT;
      const evalScore = minimax(
        b,
        depth - 1,
        alpha,
        beta,
        false
      );
      maxEval = Math.max(maxEval, evalScore);
      alpha = Math.max(alpha, evalScore);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const [r, c] of moves) {
      const b = cloneBoard(board);
      b[r][c] = HUMAN;
      const evalScore = minimax(
        b,
        depth - 1,
        alpha,
        beta,
        true
      );
      minEval = Math.min(minEval, evalScore);
      beta = Math.min(beta, evalScore);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

/* ================== HOOK ================== */
export function useGomokuBot({
  enabled,
  board,
  turn,
  winner,
  onMove,
}: {
  enabled: boolean;
  board: Cell[][];
  turn: Cell;
  winner: Cell | null;
  onMove: (r: number, c: number) => void;
}) {
  useEffect(() => {
    if (!enabled || winner || turn !== BOT) return;

    let bestScore = -Infinity;
    let bestMove: [number, number] | null = null;

    const moves = getCandidateMoves(board);

    for (const [r, c] of moves) {
      const b = cloneBoard(board);
      b[r][c] = BOT;
      const score = minimax(b, 2, -Infinity, Infinity, false);

      if (score > bestScore) {
        bestScore = score;
        bestMove = [r, c];
      }
    }

    if (bestMove) {
      setTimeout(() => {
        onMove(bestMove[0], bestMove[1]);
      }, 300);
    }
  }, [enabled, board, turn, winner, onMove]);
}
