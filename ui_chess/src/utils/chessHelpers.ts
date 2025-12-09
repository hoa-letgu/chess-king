// ===============================
// CHUYỂN Ô CỜ thành TỌA ĐỘ (%)
// ===============================
export function squareToXY(sq: string) {
  const file = sq[0];
  const rank = Number(sq[1]);

  return {
    x: "abcdefgh".indexOf(file) * 12.5,
    y: (8 - rank) * 12.5,
  };
}

// =====================================
// TÌM Ô VUA BỊ CHIẾU (nếu có)
// =====================================
export function findKingInCheck(game: any): string | null {
  if (!game.inCheck()) return null;

  const board = game.board();

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p && p.type === "k" && p.color === game.turn()) {
        const square = "abcdefgh"[c] + (8 - r);
        return square;
      }
    }
  }

  return null;
}
export function getMovePath(from: string, to: string): { x: number; y: number }[] {
  const files = "abcdefgh";

  const fx = files.indexOf(from[0]);
  const fy = Number(from[1]);
  const tx = files.indexOf(to[0]);
  const ty = Number(to[1]);

  // =============== KNIGHT (L-shape) ==================
  const isKnight =
    (Math.abs(fx - tx) === 1 && Math.abs(fy - ty) === 2) ||
    (Math.abs(fx - tx) === 2 && Math.abs(fy - ty) === 1);

  if (isKnight) {
    return getKnightPath(from, to);  // ⭐ sử dụng animation đẹp hơn
  }

  // =============== OTHER PIECES =======================
  const path = [];
  let x = fx, y = fy;

  const stepX = Math.sign(tx - fx);
  const stepY = Math.sign(ty - fy);

  while (x !== tx || y !== ty) {
    x += stepX;
    y += stepY;
    path.push({ x, y });
  }

  return path;
}

function getKnightPath(from: string, to: string) {
  const files = "abcdefgh";

  const fx = files.indexOf(from[0]);
  const fy = Number(from[1]);
  const tx = files.indexOf(to[0]);
  const ty = Number(to[1]);

  const midX = (fx + tx) / 2;
  const midY = (fy + ty) / 2;

  return [
    { x: fx, y: fy },             // start
    { x: midX, y: midY - 0.6 },   // jump peak (điểm cao nhất)
    { x: tx, y: ty },             // end
  ];
}

