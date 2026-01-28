import { Chess, Move } from "chess.js";
import { PIECE_VALUES } from "./chessEngine";

/* ================= CONSTANTS ================= */

const CENTER = new Set([
  "d4","e4","d5","e5",
  "c3","d3","e3","f3",
  "c4","f4","c5","f5",
  "c6","d6","e6","f6",
]);

/* ================= MAIN ================= */

export function orderMovesHeuristic(game: Chess, moves: Move[]): Move[] {
  return moves
    .map(m => ({ mv: m, score: scoreMove(game, m) }))
    .sort((a, b) => b.score - a.score)
    .map(x => x.mv);
}

/* ================= SCORE MOVE ================= */

function scoreMove(game: Chess, mv: Move): number {
  let score = 0;
  const ply = game.history().length;

  /* ===== 1. CAPTURE (MVV–LVA) ===== */
  if (mv.captured) {
    score +=
      PIECE_VALUES[mv.captured] -
      PIECE_VALUES[mv.piece] / 10;
  }

  /* ===== 2. PROMOTION ===== */
  if ((mv as any).promotion === "q") {
    score += 2000; // cực ưu tiên phong hậu
  }

  /* ===== 3. CHECK BONUS ===== */
  game.move(mv);
  if (game.inCheck()) score += 120;
  game.undo();

  /* ===== 4. BAD TRADE / HANGING PIECE (CỰC QUAN TRỌNG) ===== */
  if (!mv.captured && isBadTrade(game, mv)) {
    if (mv.piece === "q") score -= 4000; // CẤM thí hậu
    if (mv.piece === "r") score -= 2000;
    if (mv.piece === "b" || mv.piece === "n") score -= 1000;
  }

  /* ===== 5. CẤM THÍ HẬU SỚM ===== */
  if (ply < 20 && mv.piece === "q" && !mv.captured) {
    score -= 2500;
  }

  /* ===== 6. CENTER CONTROL ===== */
  if (CENTER.has(mv.to)) score += 30;

  /* ===== 7. PIECE-SPECIFIC HEURISTICS ===== */
  switch (mv.piece) {
    case "p": score += pawnScore(game, mv); break;
    case "n": score += knightScore(mv); break;
    case "b": score += bishopScore(mv); break;
    case "r": score += rookScore(game, mv); break;
    case "q": score += queenScore(game); break;
    case "k": score += kingScore(game, mv); break;
  }

  return score;
}

/* ================= PIECE HEURISTICS ================= */

function pawnScore(game: Chess, mv: Move): number {
  const rank = Number(mv.to[1]);
  let s = 0;
  const ply = game.history().length;

  // Phá chắn vua sớm = rất nguy hiểm
  if (ply < 12 && ["f","g"].includes(mv.from[0])) {
    s -= 200;
  }

  s += game.turn() === "w" ? rank * 6 : (8 - rank) * 6;
  return s;
}

function knightScore(mv: Move): number {
  let s = 0;
  if (CENTER.has(mv.to)) s += 60;
  if (mv.to[0] === "a" || mv.to[0] === "h") s -= 40;
  return s;
}

function bishopScore(mv: Move): number {
  const df = Math.abs(
    mv.from.charCodeAt(0) - mv.to.charCodeAt(0)
  );
  return df >= 3 ? 40 : 0;
}

function rookScore(game: Chess, mv: Move): number {
  let s = 0;
  const rank = Number(mv.to[1]);

  // Rook lên hàng 7
  if (
    (game.turn() === "w" && rank === 7) ||
    (game.turn() === "b" && rank === 2)
  ) {
    s += 80;
  }

  return s;
}

function queenScore(game: Chess): number {
  const ply = game.history().length;
  if (ply < 10) return -80; // hạn chế hậu đi sớm
  return 0;
}

function kingScore(game: Chess, mv: Move): number {
  const ply = game.history().length;

  // Nhập thành = ưu tiên tuyệt đối
  if (mv.san === "O-O" || mv.san === "O-O-O") {
    return 300;
  }

  // Cấm vua đi sớm
  if (ply < 12) {
    return -800;
  }

  return -80;
}

/* ================= TRADE EVALUATION ================= */

/**
 * Quân đi xong mà bị đối phương ăn lại
 * bằng quân rẻ hơn → trade xấu
 */
function isBadTrade(game: Chess, mv: Move): boolean {
  game.move(mv);

  const replies = game.moves({ verbose: true }) as Move[];
  let worstLoss = 0;

  for (const r of replies) {
    if (r.to === mv.to && r.captured) {
      const loss = PIECE_VALUES[r.captured];
      if (loss > worstLoss) worstLoss = loss;
    }
  }

  game.undo();

  const selfValue = PIECE_VALUES[mv.piece];

  // nếu bị ăn bởi quân < 1/2 giá trị mình → xấu
  return worstLoss > 0 && worstLoss < selfValue;
}
