import type { GoState } from "../engine/goEngine";
import { applyMove } from "../engine/goEngine";
import { opposite } from "../utils/rules";
import { getGroup } from "../utils/liberties";

type Move = [number, number];

const REGION = 3;          // 7x7
const MAX_DEPTH = 5;       // sâu nhưng node ít
const MAX_MOVES = 6;       // cắt nhánh mạnh

/* ================= TRANSPOSITION TABLE ================= */
const TT = new Map<string, number>();

/* ================= HOT REGION (QUANH LAST MOVE) ================= */
function getHotPoints(state: GoState): Move[] {
  const size = state.board.length;

  // opening
  if (!state.lastMove) {
    const m = Math.floor(size / 2);
    return [[m, m]];
  }

  const [lr, lc] = state.lastMove;
  const pts: Move[] = [];

  for (let r = lr - REGION; r <= lr + REGION; r++) {
    for (let c = lc - REGION; c <= lc + REGION; c++) {
      if (r < 0 || c < 0 || r >= size || c >= size) continue;
      if (state.board[r][c] === null) pts.push([r, c]);
    }
  }

  return pts;
}

/* ================= FORCING MOVE CHECK ================= */
function isCaptureMove(state: GoState, r: number, c: number): boolean {
  const enemy = opposite(state.turn);

  for (const [nr, nc] of [
    [r - 1, c],
    [r + 1, c],
    [r, c - 1],
    [r, c + 1],
  ]) {
    if (
      nr >= 0 &&
      nc >= 0 &&
      nr < state.board.length &&
      nc < state.board.length &&
      state.board[nr][nc] === enemy
    ) {
      const g = getGroup(state.board, nr, nc);
      if (g.liberties === 1) return true;
    }
  }
  return false;
}

/* ================= MOVE GENERATION (CỰC GỌN – CỰC CHẤT) ================= */
function generateMoves(state: GoState): Move[] {
  const moves: { m: Move; score: number }[] = [];

  for (const [r, c] of getHotPoints(state)) {
    const res = applyMove(state, r, c);
    if (!res.ok) continue;

    const g = getGroup(res.state.board, r, c);
    let score = 0;

    // sống
    score += g.liberties * 30;

    // tự sát
    if (g.liberties === 1) score -= 800;

    // bắt quân (forcing)
    if (isCaptureMove(state, r, c)) score += 1500;

    // ưu tiên nối nhóm
    for (const [nr, nc] of [
      [r - 1, c],
      [r + 1, c],
      [r, c - 1],
      [r, c + 1],
    ]) {
      if (
        nr >= 0 &&
        nc >= 0 &&
        nr < state.board.length &&
        nc < state.board.length &&
        state.board[nr][nc] === state.turn
      ) {
        score += 200;
      }
    }

    moves.push({ m: [r, c], score });
  }

  return moves
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_MOVES)
    .map(x => x.m);
}

/* ================= ĐÁNH GIÁ (LOCAL – CHÍNH XÁC) ================= */
function evaluate(state: GoState, me: string): number {
  let score = 0;

  for (let r = 0; r < state.board.length; r++) {
    for (let c = 0; c < state.board.length; c++) {
      const s = state.board[r][c];
      if (!s) continue;

      const g = getGroup(state.board, r, c);
      const sign = s === me ? 1 : -1;

      score += sign * g.liberties * 20;

      if (g.liberties === 1) score -= sign * 500;
      if (g.liberties >= 4) score += sign * 100;
    }
  }

  return score;
}

/* ================= ALPHA–BETA (NODE RẤT ÍT) ================= */
function alphaBeta(
  state: GoState,
  depth: number,
  alpha: number,
  beta: number,
  maximizing: boolean,
  me: string
): number {
  const key =
    state.lastMove?.join(",") +
    "|" +
    depth +
    "|" +
    state.turn;

  if (TT.has(key)) return TT.get(key)!;

  if (depth === 0) {
    const v = evaluate(state, me);
    TT.set(key, v);
    return v;
  }

  const moves = generateMoves(state);
  if (!moves.length) return evaluate(state, me);

  let best = maximizing ? -Infinity : Infinity;

  for (const [r, c] of moves) {
    const res = applyMove(state, r, c);
    if (!res.ok) continue;

    const v = alphaBeta(
      res.state,
      depth - 1,
      alpha,
      beta,
      !maximizing,
      me
    );

    if (maximizing) {
      best = Math.max(best, v);
      alpha = Math.max(alpha, best);
    } else {
      best = Math.min(best, v);
      beta = Math.min(beta, best);
    }

    if (alpha >= beta) break;
  }

  TT.set(key, best);
  return best;
}

/* ================= BOT MOVE ================= */
export function thinkBotMove(state: GoState): Move | null {
  TT.clear();
  const me = state.turn;

  let best: Move | null = null;
  let bestScore = -Infinity;

  for (const [r, c] of generateMoves(state)) {
    const res = applyMove(state, r, c);
    if (!res.ok) continue;

    const score = alphaBeta(
      res.state,
      MAX_DEPTH,
      -Infinity,
      Infinity,
      false,
      me
    );

    if (score > bestScore) {
      bestScore = score;
      best = [r, c];
    }
  }

  return best;
}
