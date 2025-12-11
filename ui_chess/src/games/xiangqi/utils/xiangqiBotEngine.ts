// src/games/xiangqi/utils/xiangqiBotEngine.ts
import { generateAllMoves, squareToCoord } from "./rules";
import { cloneBoard } from "./cloneBoard";
import { isInCheck } from "./isInCheck";
import type { XiangqiPieceKey } from "./pieces";

type Side = "red" | "black";
type Board = (XiangqiPieceKey | null | "")[][];

type BotMove = {
  from: string;
  to: string;
  piece: XiangqiPieceKey;
  capture: XiangqiPieceKey | null;
};

const MATE_SCORE = 100000;

// Giá trị vật chất cơ bản
const PIECE_VALUE: Record<string, number> = {
  G: 10000, g: 10000,
  R: 500,   r: 500,
  H: 250,   h: 250,
  E: 150,   e: 150,
  A: 150,   a: 150,
  C: 300,   c: 300,
  S: 120,   s: 120,
};

// ============================
// 1. Positional (PST) đơn giản
// r: 0..9 (trên→dưới từ phía đen)
// c: 0..8
// ============================
function pstSoldier(side: Side, r: number, c: number): number {
  // Ưu tiên trung tâm và đã qua sông
  const centerBonus = (c === 4 ? 8 : (c === 3 || c === 5 ? 4 : 0));

  if (side === "red") {
    if (r <= 4) return 18 + centerBonus;   // qua sông
    if (r <= 6) return 10 + centerBonus;
    return 4;
  } else {
    if (r >= 5) return 18 + centerBonus;   // qua sông
    if (r >= 3) return 10 + centerBonus;
    return 4;
  }
}

function pstHorse(side: Side, r: number, c: number): number {
  // Ngựa thích trung tâm
  const center = (c >= 2 && c <= 6 && r >= 2 && r <= 7) ? 10 : 0;
  return 6 + center;
}

function pstChariot(side: Side, r: number, c: number): number {
  // Xe mạnh ở hàng và cột mở
  return 12;
}

function pstCannon(side: Side, r: number, c: number): number {
  // Pháo thích trung tâm
  const center = (c >= 2 && c <= 6 && r >= 2 && r <= 7) ? 8 : 0;
  return 6 + center;
}

function pstElephant(side: Side, r: number, c: number): number {
  // Tượng phòng thủ
  return 4;
}

function pstAdvisor(side: Side, r: number, c: number): number {
  // Sĩ luôn trong cung, ít thay đổi
  return 3;
}

function pstGeneral(side: Side, r: number, c: number): number {
  // Tướng an toàn trong cung
  return 0;
}

function pieceSide(p: XiangqiPieceKey): Side {
  return p === p.toUpperCase() ? "red" : "black";
}

function positionalValue(p: XiangqiPieceKey, r: number, c: number): number {
  const side = pieceSide(p);
  const code = p.toUpperCase();

  switch (code) {
    case "S": return pstSoldier(side, r, c);
    case "H": return pstHorse(side, r, c);
    case "R": return pstChariot(side, r, c);
    case "C": return pstCannon(side, r, c);
    case "E": return pstElephant(side, r, c);
    case "A": return pstAdvisor(side, r, c);
    case "G": return pstGeneral(side, r, c);
    default: return 0;
  }
}

// ============================
// 2. Eval tổng: vật chất + PST
// score > 0: lợi cho đỏ
// ============================
function evaluate(board: Board): number {
  let score = 0;

  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 9; c++) {
      const p = board[r][c] as XiangqiPieceKey | null;
      if (!p) continue;

      const base = PIECE_VALUE[p] ?? 0;
      const pos  = positionalValue(p, r, c);
      const val  = base + pos;

      if (p === p.toUpperCase()) score += val;  // đỏ
      else score -= val;                        // đen
    }
  }

  return score;
}

// ============================
// 3. Board key dùng cho hòa lặp lại
// ============================
export function boardToKey(board: Board, sideToMove: Side): string {
  const rows = board.map(row =>
    row.map(p => (p ? p : ".")).join("")
  );
  return rows.join("/") + "|" + sideToMove;
}

// Đếm số lần xuất hiện key trong history
function countKey(historyKeys: string[], key: string): number {
  return historyKeys.reduce((acc, k) => (k === key ? acc + 1 : acc), 0);
}

// ============================
// 4. Minimax + Alpha-beta
// ============================
function minimax(
  board: Board,
  depth: number,
  alpha: number,
  beta: number,
  sideToMove: Side,
  botSide: Side,
  historyKeys: string[]
): number {
  const isMaximizing = sideToMove === botSide;

  // Sinh tất cả nước đi
  const moves = generateAllMoves(board, sideToMove);
  const inCheck = isInCheck(board, sideToMove);

  // Điều kiện dừng: hết nước / hết sâu
  if (depth === 0 || moves.length === 0) {
    if (moves.length === 0) {
      if (inCheck) {
        // Chiếu bí bên sideToMove
        return sideToMove === botSide ? -MATE_SCORE : MATE_SCORE;
      } else {
        // Stalemate
        return 0;
      }
    }
    // Eval tĩnh
    const e = evaluate(board);
    // Đổi về góc nhìn bot
    return botSide === "red" ? e : -e;
  }

  if (isMaximizing) {
    let best = -Infinity;

    for (const mv of moves) {
      const [r1, c1] = squareToCoord(mv.from);
      const [r2, c2] = squareToCoord(mv.to);

      const tmp = cloneBoard(board);
      const piece = tmp[r1][c1] as XiangqiPieceKey;
      tmp[r2][c2] = piece;
      tmp[r1][c1] = null;

      const nextSide: Side = sideToMove === "red" ? "black" : "red";
      const key = boardToKey(tmp, nextSide);

      // Hòa do lặp lại -> coi điểm là 0
      const repeatTimes = countKey(historyKeys, key);
      let score: number;
      if (repeatTimes >= 2) {
        score = 0;
      } else {
        score = minimax(
          tmp,
          depth - 1,
          alpha,
          beta,
          nextSide,
          botSide,
          [...historyKeys, key]
        );
      }

      if (score > best) best = score;
      if (score > alpha) alpha = score;
      if (alpha >= beta) break;
    }

    return best;
  } else {
    let best = Infinity;

    for (const mv of moves) {
      const [r1, c1] = squareToCoord(mv.from);
      const [r2, c2] = squareToCoord(mv.to);

      const tmp = cloneBoard(board);
      const piece = tmp[r1][c1] as XiangqiPieceKey;
      tmp[r2][c2] = piece;
      tmp[r1][c1] = null;

      const nextSide: Side = sideToMove === "red" ? "black" : "red";
      const key = boardToKey(tmp, nextSide);

      const repeatTimes = countKey(historyKeys, key);
      let score: number;
      if (repeatTimes >= 2) {
        score = 0;
      } else {
        score = minimax(
          tmp,
          depth - 1,
          alpha,
          beta,
          nextSide,
          botSide,
          [...historyKeys, key]
        );
      }

      if (score < best) best = score;
      if (score < beta) beta = score;
      if (alpha >= beta) break;
    }

    return best;
  }
}

// ============================
// 5. API: tìm nước đi tốt nhất
// ============================
export function findBestBotMove(
  board: Board,
  botColor: Side,
  historyKeys: string[],
  depth: number = 3
): BotMove | null {
  const allMoves = generateAllMoves(board, botColor);
  if (allMoves.length === 0) return null;

  let bestScore = -Infinity;
  let bestMove: BotMove | null = null;

  for (const mv of allMoves) {
    const [r1, c1] = squareToCoord(mv.from);
    const [r2, c2] = squareToCoord(mv.to);

    const tmp = cloneBoard(board);
    const piece = tmp[r1][c1] as XiangqiPieceKey;
    const captured = tmp[r2][c2] as XiangqiPieceKey | null;

    tmp[r2][c2] = piece;
    tmp[r1][c1] = null;

    // Bỏ nước tự để mình bị chiếu
    if (isInCheck(tmp, botColor)) continue;

    const nextSide: Side = botColor === "red" ? "black" : "red";
    const key = boardToKey(tmp, nextSide);

    const repeatTimes = countKey(historyKeys, key);
    let score: number;
    if (repeatTimes >= 2) {
      score = 0;
    } else {
      score = minimax(
        tmp,
        depth - 1,
        -Infinity,
        Infinity,
        nextSide,
        botColor,
        [...historyKeys, key]
      );
    }

    if (score > bestScore) {
      bestScore = score;
      bestMove = {
        from: mv.from,
        to: mv.to,
        piece,
        capture: captured ?? null,
      };
    }
  }

  return bestMove;
}
