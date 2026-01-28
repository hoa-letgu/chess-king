const ZOBRIST = {
  PIECES: [],
  CASTLING: [],
  EN_PASSANT: [],
  BLACK_TO_MOVE: 0,
};

const PIECE_MAP = {
  p: 0,
  n: 1,
  b: 2,
  r: 3,
  q: 4,
  k: 5,
  P: 6,
  N: 7,
  B: 8,
  R: 9,
  Q: 10,
  K: 11,
};

function random32Bit() {
  return Math.floor(Math.random() * 0xffffffff);
}

function initZobrist() {
  for (let i = 0; i < 12; i++) {
    ZOBRIST.PIECES[i] = [];
    for (let j = 0; j < 64; j++) {
      ZOBRIST.PIECES[i][j] = random32Bit();
    }
  }

  for (let i = 0; i < 16; i++) {
    ZOBRIST.CASTLING[i] = random32Bit();
  }

  for (let i = 0; i < 8; i++) {
    ZOBRIST.EN_PASSANT[i] = random32Bit();
  }

  ZOBRIST.BLACK_TO_MOVE = random32Bit();
}

initZobrist();

export { ZOBRIST, PIECE_MAP };
