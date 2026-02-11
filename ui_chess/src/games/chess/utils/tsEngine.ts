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
  pvUci: string[];
  summary: string;
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

// Map overhead rất lớn, 1<<20 có thể nặng RAM.
// Nếu chạy browser yếu, giảm xuống 1<<19 hoặc 1<<18.
const MAX_TT_SIZE = 1 << 20;

// mỗi bao nhiêu nodes thì check time 1 lần (2^11 = 2048)
const TIME_CHECK_MASK = 2047;

// Zobrist fen-key cache size (giúp giảm CPU)
const FEN_KEY_CACHE_MAX = 50_000;

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

  killers: Array<[string | null, string | null]>;
  history: Map<string, number>;

  tt: Map<bigint, TTEntry>;

  rootBestUci: string | null;
  rootScore: number;
  pvMoveUci: string | null;
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

function getPieceKey(piece: any): PieceKey | null {
  if (!piece) return null;
  const t = piece.type as string;
  if (piece.color === "w") return t.toUpperCase() as PieceKey;
  return t as PieceKey;
}

function zobristKey(game: Chess): bigint {
  const b = game.board();
  let key = 0n;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = b[r][c];
      if (!piece) continue;
      const pk = getPieceKey(piece);
      if (!pk) continue;

      // chess.js board[r][c]: r=0 rank8. convert to a1=0:
      const file = c;
      const rank = 7 - r;
      const idx = file + rank * 8;

      key ^= Z.pieceSquare[pk][idx];
    }
  }

  if (game.turn() === "b") key ^= Z.side;
  return key;
}

// cache zobrist theo fen để giảm CPU
const fenKeyCache = new Map<string, bigint>();
function zobristKeyFast(game: Chess): bigint {
  const fen = game.fen();
  const hit = fenKeyCache.get(fen);
  if (hit != null) return hit;

  const k = zobristKey(game);
  fenKeyCache.set(fen, k);

  if (fenKeyCache.size > FEN_KEY_CACHE_MAX) fenKeyCache.clear();
  return k;
}

// ============================
// Stop / time check
// ============================
function shouldStop(state: SearchState): boolean {
  if ((state.nodes & TIME_CHECK_MASK) !== 0) return false;
  if (Date.now() >= state.deadline) {
    state.stop = true;
    return true;
  }
  return false;
}

// ============================
// Evaluation (White POV)
// ============================
function evalPieceSquare(file: string, rank: number, type: string): number {
  let bonus = 0;

  // center
  if ((file === "d" || file === "e") && (rank === 4 || rank === 5)) bonus += 15;
  if ((file === "c" || file === "d" || file === "e" || file === "f") && rank >= 3 && rank <= 6) bonus += 5;

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
  if (game.isCheckmate()) return -MATE;
  if ((game as any).isDraw?.() || (game as any).isStalemate?.() || (game as any).isInsufficientMaterial?.()) return 0;

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

      // pawn near promotion
      if (piece.type === "p") {
        if (piece.color === "w" && rank === 7) score += 400;
        if (piece.color === "b" && rank === 2) score -= 400;
      }
    }
  }

  // mobility nhẹ (giúp bot bớt “đứng hình”)
  // hệ số 1 để không quá tốn/không làm eval lệch
  const mobility = game.moves().length;
  score += game.turn() === "w" ? mobility : -mobility;

  return score;
}

function evaluateSTM(game: Chess): number {
  const wScore = evaluateBoard(game);
  return game.turn() === "w" ? wScore : -wScore;
}

// ============================
// Move helpers
// ============================
function uciOf(mv: Move): string {
  const promo = (mv as any).promotion ? String((mv as any).promotion) : "";
  return `${mv.from}${mv.to}${promo}`;
}

function mvvLvaScore(mv: Move): number {
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

// ============================
// Ordering
// ============================
function scoreForOrdering(
  state: SearchState,
  mv: Move,
  ply: number,
  ttBestUci?: string | null
): number {
  const uci = uciOf(mv);

  // PV first
  if (state.pvMoveUci && uci === state.pvMoveUci) return 10_000_000;

  // TT best move (second priority)
  if (ttBestUci && uci === ttBestUci) return 9_000_000;

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

  return 0;
}

function orderMoves(
  state: SearchState,
  moves: Move[],
  ply: number,
  ttBestUci?: string | null
): Move[] {
  return moves
    .map((mv) => ({ mv, s: scoreForOrdering(state, mv, ply, ttBestUci) }))
    .sort((a, b) => b.s - a.s)
    .map((x) => x.mv);
}

// ============================
// Quiescence
// ============================
function quiescence(state: SearchState, game: Chess, alpha: number, beta: number, ply: number): number {
  if (state.stop) return 0;

  state.nodes++;
  if (shouldStop(state)) return 0;

  const standPat = evaluateSTM(game);
  if (standPat >= beta) return beta;
  if (standPat > alpha) alpha = standPat;

  // noisy moves only: captures/promotions
  let moves = (game.moves({ verbose: true }) as Move[]).filter((m) => isCapture(m) || isPromotion(m));
  if (!moves.length) return alpha;

  // QS ordering: MVV-LVA only (rẻ + đúng mục đích)
  moves.sort((a, b) => mvvLvaScore(b) - mvvLvaScore(a));

  // limit vừa đủ mạnh mà vẫn nhanh
  if (moves.length > 32) moves = moves.slice(0, 32);

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

  state.nodes++;
  if (shouldStop(state)) return 0;

  const key = zobristKeyFast(game);

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

  let moves = game.moves({ verbose: true }) as Move[];
  if (!moves.length) return evaluateSTM(game);

  const ttBestUci = tt?.bestUci ?? null;
  moves = orderMoves(state, moves, ply, ttBestUci);

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

  // TT flag
  let flag = TT_EXACT;
  if (bestScore <= alphaOrig) flag = TT_UPPER;
  else if (bestScore >= beta) flag = TT_LOWER;

  // TT eviction
  if (state.tt.size >= MAX_TT_SIZE) {
    let removed = 0;
    const target = Math.floor(MAX_TT_SIZE / 4);
    for (const k of state.tt.keys()) {
      state.tt.delete(k);
      if (++removed >= target) break;
    }
  }

  // TT store (1 lần)
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
// PV helpers
// ============================
function uciToMoveObj(uci: string): any {
  const from = uci.slice(0, 2);
  const to = uci.slice(2, 4);
  const promotion = uci.length >= 5 ? uci[4] : undefined;
  return { from, to, promotion };
}

function buildPvFromTT(game: Chess, tt: Map<bigint, TTEntry>, maxPlies = 16): string[] {
  const pv: string[] = [];
  const clone = new Chess(game.fen());

  for (let i = 0; i < maxPlies; i++) {
    const key = zobristKeyFast(clone);
    const e = tt.get(key);
    const uci = e?.bestUci;
    if (!uci) break;

    const mvObj = uciToMoveObj(uci);
    const made = clone.move(mvObj);
    if (!made) break;

    pv.push(uci);
    if (clone.isGameOver()) break;
  }

  return pv;
}

// ============================
// Explain move
// ============================
function explainMove(rootFen: string, best: Move): { summary: string; flags: BestMoveResult["flags"] } {
  const g = new Chess(rootFen);

  const isCap = Boolean((best as any).captured);
  const capPiece = (best as any).captured ? String((best as any).captured) : undefined;
  const isPromo = Boolean((best as any).promotion);
  const promo = (best as any).promotion ? String((best as any).promotion) : undefined;

  g.move({ from: best.from, to: best.to, promotion: promo });
  const isCheck = Boolean((g as any).isCheck?.() ?? (g as any).inCheck?.() ?? false);
  const isMate = g.isCheckmate?.() ?? false;

  const parts: string[] = [];

  if (isMate) parts.push("Chiếu hết (checkmate)");
  else if (isCheck) parts.push("Chiếu vua (check)");

  if (isCap) parts.push(`Ăn quân (${capPiece})`);
  if (isPromo) parts.push(`Phong cấp (${promo})`);

  if (parts.length === 0) parts.push("Cải thiện vị trí / phát triển quân");

  return {
    summary: parts.join(" • "),
    flags: {
      isCapture: isCap,
      captured: capPiece,
      isCheck,
      isMate,
      isPromotion: isPromo,
      promotion: promo,
    },
  };
}

// ============================
// Public API
// ============================
export function findBestMoveTS(
  game: Chess,
  opts: { maxDepth: number; timeLimitMs: number; preferDepth?: number; cache?: EngineCache }
): BestMoveResult {
  const start = Date.now();
  const deadline = start + Math.max(50, opts.timeLimitMs);

  const cache = opts.cache;

  const state: SearchState = {
    stop: false,
    deadline,
    nodes: 0,

    killers: cache?.killers ?? Array.from({ length: 128 }, () => [null, null]),
    history: cache?.history ?? new Map(),
    tt: cache?.tt ?? new Map(),

    rootBestUci: null,
    rootScore: 0,
    pvMoveUci: null,
  };

  const rootFen = game.fen();
  const rootMoves = game.moves({ verbose: true }) as Move[];

  if (!rootMoves.length) {
    return {
      move: null,
      depthReached: 0,
      nodes: 0,
      timeMs: Date.now() - start,
      scoreCp: 0,
      pvUci: [],
      summary: "Không có nước đi",
      flags: { isCapture: false, isCheck: false, isMate: false, isPromotion: false },
    };
  }

  let bestMove: Move | null = rootMoves[0] ?? null;
  let bestScore = -INF;
  let depthReached = 0;

  for (let depth = 1; depth <= opts.maxDepth; depth++) {
    let alpha = -INF;
    let beta = INF;

    // aspiration window nhẹ
    if (depth > 1 && Math.abs(bestScore) < MATE / 2) {
      alpha = bestScore - 80;
      beta = bestScore + 80;
    }

    state.rootBestUci = null;
    state.rootScore = 0;

    // PV hint từ iteration trước
    state.pvMoveUci = bestMove ? uciOf(bestMove) : state.pvMoveUci;

    let score = alphaBeta(state, game, depth, alpha, beta, 0);

    if (state.stop) break;

    if (score <= alpha || score >= beta) {
      // research full window
      score = alphaBeta(state, game, depth, -INF, INF, 0);
      if (state.stop) break;
    }

    depthReached = depth;
    bestScore = score;

    if (state.rootBestUci) {
      const mv = rootMoves.find((m) => uciOf(m) === state.rootBestUci) ?? null;
      bestMove = mv;
    }

    // deadline guard (ngoài shouldStop để dừng sớm hơn 1 chút)
    // nếu muốn ép đủ depth (không khuyến khích trên UI thread)
	if (Date.now() >= deadline && depth >= (opts.preferDepth ?? 0)) break;

  }

  const pvUci = buildPvFromTT(new Chess(rootFen), state.tt, 16);

  let summary = "Không rõ";
  let flags: BestMoveResult["flags"] = {
    isCapture: false,
    isCheck: false,
    isMate: false,
    isPromotion: false,
  };

  if (bestMove) {
    const ex = explainMove(rootFen, bestMove);
    summary = ex.summary;
    flags = ex.flags;
  }

  return {
    move: bestMove,
    depthReached,
    nodes: state.nodes,
    timeMs: Date.now() - start,
    scoreCp: bestScore,
    pvUci,
    summary,
    flags,
  };
}
