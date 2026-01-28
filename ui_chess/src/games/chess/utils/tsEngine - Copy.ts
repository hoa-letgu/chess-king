// src/games/chess/utils/tsEngine.ts
import { Chess, Move } from "chess.js";

// ============================
// Types
// ============================
export type BestMoveResult = {
  move: Move | null;
  depthReached: number;
  nodes: number;
  timeMs: number;
  scoreCp: number; // centipawns relative to side-to-move at root
  // NEW
  pvUci: string[];        // principal variation in UCI
  summary: string;        // explain move purpose
  flags: {
    isCapture: boolean;
    captured?: string;
    isCheck: boolean;
    isMate: boolean;
    isPromotion: boolean;
    promotion?: string;
  };
};
export type EngineCache = {
  tt: Map<bigint, any>;
  history: Map<string, number>;
  killers: Array<[string | null, string | null]>;
};

export function createEngineCache(): EngineCache {
  return {
    tt: new Map(),
    history: new Map(),
    killers: Array.from({ length: 128 }, () => [null, null]),
  };
}


// ============================
// Config
// ============================
const INF = 1_000_000_000;
const MATE = 10_000_000;
const MAX_TT_SIZE = 1 << 20; // ~1M entries (Map overhead is big; adjust if needed)

const PIECE_VALUES: Record<string, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20_000,
};

// TT flags
const TT_EXACT = 0;
const TT_LOWER = 1;
const TT_UPPER = 2;

type TTEntry = {
  key: bigint;
  depth: number;
  score: number;
  flag: number;
  bestUci: string | null;
};

type SearchState = {
  stop: boolean;
  deadline: number;
  nodes: number;

  // heuristics
  killers: Array<[string | null, string | null]>; // [ply] -> two killer moves in UCI
  history: Map<string, number>; // key: "fromto[promo]" score

  // transposition table
  tt: Map<bigint, TTEntry>;

  // root
  rootBestUci: string | null;
  rootScore: number;
  pvMoveUci: string | null; // from previous iteration
};

// ============================
// Zobrist (BigInt)
// ============================
const FILES = "abcdefgh";
const PIECES = ["P", "N", "B", "R", "Q", "K", "p", "n", "b", "r", "q", "k"] as const;
type PieceKey = (typeof PIECES)[number];

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function rand64(rng: () => number): bigint {
  // 64-bit from 2x32
  const hi = BigInt((rng() * 0xffffffff) >>> 0);
  const lo = BigInt((rng() * 0xffffffff) >>> 0);
  return (hi << 32n) ^ lo;
}

type ZobristTables = {
  pieceSquare: Record<PieceKey, bigint[]>;
  side: bigint;
};

const Z: ZobristTables = (() => {
  const rng = mulberry32(1337);
  const pieceSquare: any = {};
  for (const p of PIECES) {
    pieceSquare[p] = Array.from({ length: 64 }, () => rand64(rng));
  }
  return { pieceSquare, side: rand64(rng) };
})();

function squareIndex(sq: string): number {
  const f = FILES.indexOf(sq[0]);
  const r = Number(sq[1]);
  // a1 = 0, b1 = 1 ... a2 = 8 ... a8 = 56
  return f + (r - 1) * 8;
}

function getPieceKey(piece: any): PieceKey | null {
  if (!piece) return null;
  const t = piece.type as string; // "p","n","b","r","q","k"
  if (piece.color === "w") return t.toUpperCase() as PieceKey;
  return t as PieceKey;
}

function zobristKey(game: Chess): bigint {
  // Build from board each time (simple + safe). Faster is incremental hashing.
  const b = game.board();
  let key = 0n;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = b[r][c];
      if (!piece) continue;
      const pk = getPieceKey(piece);
      if (!pk) continue;
      // chess.js board[r][c]: r=0 is rank 8. Convert to index a1=0:
      const file = c;
      const rank = 7 - r;
      const idx = file + rank * 8;
      key ^= Z.pieceSquare[pk][idx];
    }
  }

  if (game.turn() === "b") key ^= Z.side;
  return key;
}

// ============================
// Evaluation
// - returns score from White POV (positive = white better)
// ============================
function evalPieceSquare(file: string, rank: number, type: string): number {
  let bonus = 0;

  // center
  if ((file === "d" || file === "e") && (rank === 4 || rank === 5)) bonus += 15;
  if ((file === "c" || file === "d" || file === "e" || file === "f") && rank >= 3 && rank <= 6)
    bonus += 5;

  if (type === "p") {
    if (rank >= 4 && rank <= 6) bonus += 4;
    if (rank === 7) bonus += 8;
  }

  if (type === "k") {
    if (rank >= 3 && rank <= 6) bonus -= 20;
    else bonus += 10;
  }

  return bonus;
}

function evaluateBoard(game: Chess): number {
  if (game.isCheckmate()) return -MATE; // side-to-move is checkmated
  // chess.js draw helpers vary by version
  if ((game as any).isDraw?.() || (game as any).isStalemate?.() || (game as any).isInsufficientMaterial?.())
    return 0;

  const board = game.board();
  let score = 0;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece) continue;

      const base = PIECE_VALUES[piece.type] ?? 0;
      const file = FILES[c];
      const rank = 8 - r;
      const pos = evalPieceSquare(file, rank, piece.type);
      const final = base + pos;

      score += piece.color === "w" ? final : -final;

      if (piece.type === "p") {
        if (piece.color === "w" && rank === 7) score += 400;
        if (piece.color === "b" && rank === 2) score -= 400;
      }
    }
  }

  // mobility
  const mobility = game.moves().length * 2;
  score += game.turn() === "w" ? mobility : -mobility;

  return score;
}

// convert to "side-to-move perspective" for negamax
function evaluateSTM(game: Chess): number {
  const wScore = evaluateBoard(game);
  return game.turn() === "w" ? wScore : -wScore;
}

// ============================
// Move helpers
// ============================
function uciOf(mv: Move): string {
  // chess.js Move: from,to plus optional promotion
  const promo = (mv as any).promotion ? String((mv as any).promotion) : "";
  return `${mv.from}${mv.to}${promo}`;
}

function mvvLvaScore(mv: Move): number {
  // captured is piece type: "p","n",...
  const victim = (mv as any).captured ? PIECE_VALUES[(mv as any).captured] ?? 0 : 0;
  const attacker = PIECE_VALUES[(mv as any).piece] ?? 0;
  return victim * 10 - attacker;
}

function isCapture(mv: Move): boolean {
  return Boolean((mv as any).captured);
}

function isPromotion(mv: Move): boolean {
  return Boolean((mv as any).promotion);
}

function isCheckMove(game: Chess, mv: Move): boolean {
  game.move(mv);
  const inCheck = Boolean((game as any).isCheck?.() ?? (game as any).inCheck?.());
  game.undo();
  return inCheck;
}

// ============================
// Ordering
// ============================
function scoreForOrdering(state: SearchState, game: Chess, mv: Move, ply: number): number {
  const uci = uciOf(mv);

  // PV move first
  if (state.pvMoveUci && uci === state.pvMoveUci) return 10_000_000;

  // TT best move (if we stored for this position, handled in caller by pvMoveUci injection)

  // Captures: MVV-LVA
  if (isCapture(mv)) return 5_000_000 + mvvLvaScore(mv);

  // Promotions
  if (isPromotion(mv)) return 4_500_000;

  // Killer moves
  const ks = state.killers[ply];
  if (ks) {
    if (ks[0] === uci) return 4_000_000;
    if (ks[1] === uci) return 3_900_000;
  }

  // History heuristic
  const hist = state.history.get(uci) ?? 0;
  if (hist) return 1_000_000 + hist;

  // Check bonus (expensive; keep small and only if needed)
  // You can comment this out if too slow:
  // if (isCheckMove(game, mv)) return 900_000;

  return 0;
}

function orderMoves(state: SearchState, game: Chess, moves: Move[], ply: number): Move[] {
  return moves
    .map((mv) => ({ mv, s: scoreForOrdering(state, game, mv, ply) }))
    .sort((a, b) => b.s - a.s)
    .map((x) => x.mv);
}

// ============================
// Quiescence
// ============================
function quiescence(state: SearchState, game: Chess, alpha: number, beta: number, ply: number): number {
  if (state.stop) return 0;

  state.nodes++;
  if (Date.now() >= state.deadline) {
    state.stop = true;
    return 0;
  }

  let standPat = evaluateSTM(game);
  if (standPat >= beta) return beta;
  if (standPat > alpha) alpha = standPat;

  // Only captures + promotions (and you can add checks if desired)
  let moves = (game.moves({ verbose: true }) as Move[]).filter((m) => isCapture(m) || isPromotion(m));
  moves = orderMoves(state, game, moves, ply);

  for (const mv of moves) {
    game.move(mv);
    const score = -quiescence(state, game, -beta, -alpha, ply + 1);
    game.undo();

    if (state.stop) return 0;

    if (score >= beta) return beta;
    if (score > alpha) alpha = score;
  }

  return alpha;
}

// ============================
// AlphaBeta (Negamax) + TT
// ============================
function alphaBeta(
  state: SearchState,
  game: Chess,
  depth: number,
  alpha: number,
  beta: number,
  ply: number
): number {
  if (state.stop) return 0;

  // time check
  if (Date.now() >= state.deadline) {
    state.stop = true;
    return 0;
  }

  const key = zobristKey(game);

  // TT probe
  const tt = state.tt.get(key);
  if (tt && tt.depth >= depth) {
    if (tt.flag === TT_EXACT) return tt.score;
    if (tt.flag === TT_LOWER) alpha = Math.max(alpha, tt.score);
    else if (tt.flag === TT_UPPER) beta = Math.min(beta, tt.score);
    if (alpha >= beta) return tt.score;
  }

  if (depth <= 0 || game.isGameOver()) {
    return quiescence(state, game, alpha, beta, ply);
  }

  state.nodes++;

  let moves = game.moves({ verbose: true }) as Move[];
  if (!moves.length) return evaluateSTM(game);

  // If TT has best move, treat as PV move for ordering
  if (tt?.bestUci) state.pvMoveUci = tt.bestUci;

  moves = orderMoves(state, game, moves, ply);

  let bestScore = -INF;
  let bestUci: string | null = null;
  const alphaOrig = alpha;

  for (const mv of moves) {
    game.move(mv);

    const score = -alphaBeta(state, game, depth - 1, -beta, -alpha, ply + 1);

    game.undo();

    if (state.stop) return 0;

    if (score > bestScore) {
      bestScore = score;
      bestUci = uciOf(mv);

      // root tracking
      if (ply === 0) {
        state.rootBestUci = bestUci;
        state.rootScore = bestScore;
      }
    }

    if (score > alpha) alpha = score;
    if (alpha >= beta) {
      // beta cutoff => update killers/history for quiet moves
      const uci = uciOf(mv);

      if (!isCapture(mv) && !isPromotion(mv)) {
        const ks = state.killers[ply] ?? (state.killers[ply] = [null, null]);
        if (ks[0] !== uci) {
          ks[1] = ks[0];
          ks[0] = uci;
        }
        state.history.set(uci, (state.history.get(uci) ?? 0) + depth * depth);
      }
      break;
    }
  }

  // TT store
  if (state.tt.size > MAX_TT_SIZE) {
    // crude aging: clear whole table (simple). You can implement LRU later.
    state.tt.clear();
  }

  let flag = TT_EXACT;
  if (bestScore <= alphaOrig) flag = TT_UPPER;
  else if (bestScore >= beta) flag = TT_LOWER;

  state.tt.set(key, {
    key,
    depth,
    score: bestScore,
    flag,
    bestUci,
  });

  return bestScore;
}

// ============================
// Public API
// ============================
export function findBestMoveTS(
  game: Chess,
  opts: { maxDepth: number; timeLimitMs: number; preferDepth?: number }
): BestMoveResult {
  const start = Date.now();
  const deadline = start + Math.max(50, opts.timeLimitMs);
  const cache = opts.cache;
  const state: SearchState = {
    stop: false,
    deadline,
    nodes: 0,
    killers: Array.from({ length: 128 }, () => [null, null]),
    history: new Map(),
    tt: new Map(),
    rootBestUci: null,
    rootScore: 0,
    pvMoveUci: null,
  };

  const rootMoves = game.moves({ verbose: true }) as Move[];
  if (!rootMoves.length) {
    return { move: null, depthReached: 0, nodes: 0, timeMs: Date.now() - start, scoreCp: 0 };
  }

    let bestMove: Move | null = rootMoves[0] ?? null; // ✅ fallback
	let bestScore = -INF;
	let depthReached = 0;


  // Iterative deepening
  for (let depth = 1; depth <= opts.maxDepth; depth++) {
    // aspiration window (optional)
    let alpha = -INF;
    let beta = INF;

    // if we already have score, narrow window
    if (depth > 1 && Math.abs(bestScore) < MATE / 2) {
      alpha = bestScore - 80;
      beta = bestScore + 80;
    }

    // search (with possible re-search if aspiration fails)
    state.rootBestUci = null;
    state.rootScore = 0;
    state.pvMoveUci = bestMove ? uciOf(bestMove) : state.pvMoveUci;

    let score = alphaBeta(state, game, depth, alpha, beta, 0);

    if (state.stop) break;

    if (score <= alpha || score >= beta) {
      // re-search full window
      score = alphaBeta(state, game, depth, -INF, INF, 0);
      if (state.stop) break;
    }

    depthReached = depth;
    bestScore = score;

    // pick best move by matching uci
    if (state.rootBestUci) {
      const mv = rootMoves.find((m) => uciOf(m) === state.rootBestUci) ?? null;
      bestMove = mv;
    }

    // time guard
    if (Date.now() >= deadline) break;
  }

  return {
    move: bestMove,
    depthReached,
    nodes: state.nodes,
    timeMs: Date.now() - start,
    scoreCp: bestScore,
  };
}
