// utils/chessEngine.ts
import { Chess, Move } from "chess.js";
import { openingTree } from "./openingTree";
import { ecoOpenings } from "./ecoTree";

// --------------------------------------
// 1) TYPE SQUARE
// --------------------------------------
export type Square =
  | "a1"|"a2"|"a3"|"a4"|"a5"|"a6"|"a7"|"a8"
  | "b1"|"b2"|"b3"|"b4"|"b5"|"b6"|"b7"|"b8"
  | "c1"|"c2"|"c3"|"c4"|"c5"|"c6"|"c7"|"c8"
  | "d1"|"d2"|"d3"|"d4"|"d5"|"d6"|"d7"|"d8"
  | "e1"|"e2"|"e3"|"e4"|"e5"|"e6"|"e7"|"e8"
  | "f1"|"f2"|"f3"|"f4"|"f5"|"f6"|"f7"|"f8"
  | "g1"|"g2"|"g3"|"g4"|"g5"|"g6"|"g7"|"g8"
  | "h1"|"h2"|"h3"|"h4"|"h5"|"h6"|"h7"|"h8";


// --------------------------------------
// 2) GIÁ TRỊ QUÂN CƠ
// --------------------------------------
export const PIECE_VALUES: Record<string, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

const MATE_SCORE = 10_000_000;
const FILES = "abcdefgh";


// --------------------------------------
// 3) EVAL THÔNG MINH
// --------------------------------------
function evalPieceSquare(file: string, rank: number, type: string): number {
  let bonus = 0;

  // Trung tâm mạnh
  if ((file === "d" || file === "e") && (rank === 4 || rank === 5)) bonus += 15;

  // Trung tâm mở rộng
  if ((file === "c" || file === "d" || file === "e" || file === "f")
      && rank >= 3 && rank <= 6) bonus += 5;

  // Tốt
  if (type === "p") {
    if (rank >= 4 && rank <= 6) bonus += 4;
    if (rank === 7) bonus += 8;
  }

  // Vua
  if (type === "k") {
    if (rank >= 3 && rank <= 6) bonus -= 20;
    else bonus += 10;
  }

  return bonus;
}


// --------------------------------------
// 4) HÀM CHẤM ĐIỂM
// --------------------------------------
export function evaluateBoard(game: Chess): number {
  if (game.isCheckmate()) return -MATE_SCORE;
  if (game.isDraw()) return 0;

  const board = game.board();
  let score = 0;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece) continue;

      const base = PIECE_VALUES[piece.type];
      const file = FILES[c];
      const rank = 8 - r;
      const posScore = evalPieceSquare(file, rank, piece.type);
      const final = base + posScore;

      score += piece.color === "w" ? final : -final;
    }
  }

  // Mobility
  const mobility = game.moves().length * 2;
  score += (game.turn() === "w" ? mobility : -mobility);

  return score;
}


// --------------------------------------
// 5) MOVE ORDERING
// --------------------------------------
function scoreMoveForOrdering(game: Chess, mv: Move): number {
  let score = 0;

  const attacker = game.get(mv.from as any);
  const victim = game.get(mv.to as any);

  // MVV-LVA
  if (attacker && victim) {
    score += PIECE_VALUES[victim.type] * 10 - PIECE_VALUES[attacker.type];
  }

  // Promotion
  if ((mv as any).promotion === "q") score += 800;

  // Check bonus
  game.move(mv);
  if (game.inCheck()) score += 100;
  game.undo();

  return score;
}

function orderMoves(game: Chess, moves: Move[]): Move[] {
  return moves
    .map(m => ({ mv: m, score: scoreMoveForOrdering(game, m) }))
    .sort((a, b) => b.score - a.score)
    .map(x => x.mv);
}


// --------------------------------------
// 6) NEGAMAX + ALPHA-BETA
// --------------------------------------
export function negamax(
  game: Chess,
  depth: number,
  alpha: number,
  beta: number
): number {
  if (depth === 0 || game.isGameOver()) {
    const evalScore = evaluateBoard(game);
    return game.turn() === "w" ? evalScore : -evalScore;
  }

  let best = -Infinity;
  const moves = orderMoves(game, game.moves({ verbose: true }) as Move[]);

  for (const mv of moves) {
    game.move(mv);
    const score = -negamax(game, depth - 1, -beta, -alpha);
    game.undo();

    if (score > best) best = score;
    if (score > alpha) alpha = score;
    if (alpha >= beta) break;
  }

  return best;
}


// ======================================================
// 7) OPENING TREE HELPERS
// ======================================================
function findNextMoveFromOpeningTree(history: string[]): string | null {
  let nodes = openingTree;

  for (const move of history) {
    const found = nodes.find(n => n.move === move);
    if (!found) return null;
    nodes = found.next || [];
  }

  if (!nodes.length) return null;

  // random among valid next moves
  const idx = Math.floor(Math.random() * nodes.length);
  return nodes[idx].move;
}


// ======================================================
// 8) ECO DETECTION
// ======================================================
export function detectOpening(history: string[]) {
  let best: { eco: string; name: string; score: number } | null = null;

  for (const op of ecoOpenings) {
    const line = op.moves;
    let match = 0;

    for (let i = 0; i < Math.min(history.length, line.length); i++) {
      if (history[i] !== line[i]) break;
      match++;
    }

    if (match >= 3) {
      if (!best || match > best.score) {
        best = { eco: op.eco, name: op.name, score: match };
      }
    }
  }
  return best;
}


// ======================================================
// 9) FIND BEST MOVE WITH OPENING PRIORITY + ECO
// ======================================================
export function findBestMove(game: Chess, depth: number): Move | null {
  const moves = game.moves({ verbose: true }) as Move[];
  if (!moves.length) return null;

  // ----- Lịch sử SAN → algebraic -----
  const historySan = game.history();
  const historyAlg = historySan.map(m =>
    m.replace(/[+#x!?]/g, "").replace(/=.*/, "")
  );

  // ======= ƯU TIÊN 1: Opening Tree =======
  const nextOpeningMove = findNextMoveFromOpeningTree(historyAlg);
  if (nextOpeningMove) {
    const candidate = moves.find(
      m => m.from + m.to === nextOpeningMove
    );
    if (candidate) return candidate;
  }

  // ======= ƯU TIÊN 2: Engine Search =======
  let bestScore = -Infinity;
  let bestMoves: Move[] = [];

  const ordered = orderMoves(game, moves);

  for (const mv of ordered) {
    game.move(mv);
    const score = -negamax(game, depth - 1, -Infinity, Infinity);
    game.undo();

    if (score > bestScore) {
      bestScore = score;
      bestMoves = [mv];
    } else if (score === bestScore) {
      bestMoves.push(mv);
    }
  }

  const chosen = bestMoves[Math.floor(Math.random() * bestMoves.length)];

  return chosen;
}

