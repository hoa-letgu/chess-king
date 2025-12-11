//moveGenerator.ts
import type { XiangqiPieceKey } from "./pieces";
import { cloneBoard } from "./utilsBoard";
import { isGeneralFacing } from "./isGeneralFacing";

// ==========================
// 1. Helper cơ bản
// ==========================
function insideBoard(r: number, c: number) {
  return r >= 0 && r < 10 && c >= 0 && c < 9;
}

function isRed(p?: XiangqiPieceKey | null) {
  return p && p >= "A" && p <= "Z";
}

function sameSide(a?: XiangqiPieceKey | null, b?: XiangqiPieceKey | null) {
  if (!a || !b) return false;
  return isRed(a) === isRed(b);
}

// ==========================
// 2. Tướng (General / 王 / 将)
// ==========================
function genGeneral(board, r, c, piece: XiangqiPieceKey) {
  const moves = [];
  const red = isRed(piece);

  const palaceRows = red ? [7, 8, 9] : [0, 1, 2];
  const palaceCols = [3, 4, 5];

  const dirs = [[1,0],[-1,0],[0,1],[0,-1]];

  for (const [dr, dc] of dirs) {
    const nr = r + dr;
    const nc = c + dc;
    if (!insideBoard(nr, nc)) continue;
    if (!palaceRows.includes(nr) || !palaceCols.includes(nc)) continue;

    const target = board[nr][nc];
    if (!sameSide(piece, target)) {
      moves.push({ from: [r,c], to: [nr,nc] });
    }
  }

  return moves;
}

// ==========================
// 3. Sĩ (Advisor / 士)
// ==========================
function genAdvisor(board, r, c, piece: XiangqiPieceKey) {
  const moves = [];
  const red = isRed(piece);

  const palaceRows = red ? [7, 8, 9] : [0, 1, 2];
  const palaceCols = [3, 4, 5];

  const dirs = [
    [1,1], [1,-1], [-1,1], [-1,-1]
  ];

  for (const [dr, dc] of dirs) {
    const nr = r + dr;
    const nc = c + dc;
    if (!insideBoard(nr,nc)) continue;
    if (!palaceRows.includes(nr) || !palaceCols.includes(nc)) continue;

    const target = board[nr][nc];
    if (!sameSide(piece, target)) {
      moves.push({ from:[r,c], to:[nr,nc] });
    }
  }

  return moves;
}

// ==========================
// 4. Tượng (Elephant / 象)
// ==========================
function genElephant(board, r, c, piece: XiangqiPieceKey) {
  const moves = [];
  const red = isRed(piece);

  const dirs = [
    [2,2], [2,-2], [-2,2], [-2,-2]
  ];

  for (const [dr, dc] of dirs) {
    const nr = r + dr;
    const nc = c + dc;
    if (!insideBoard(nr,nc)) continue;

    // Tượng không được qua sông
    if (red && nr < 5) continue;
    if (!red && nr > 4) continue;

    // Mắt tượng
    const mr = r + dr/2;
    const mc = c + dc/2;
    if (board[mr][mc]) continue;

    const target = board[nr][nc];
    if (!sameSide(piece, target)) {
      moves.push({ from:[r,c], to:[nr,nc] });
    }
  }

  return moves;
}

// ==========================
// 5. Mã (Horse / 马)
// ==========================
function genHorse(board, r, c, piece: XiangqiPieceKey) {
  const moves = [];
  // Mã có chân cản
  const horseMoves = [
    [-2,-1, -1,0], [-2,1, -1,0],
    [2,-1, 1,0],   [2,1, 1,0],
    [-1,-2, 0,-1], [1,-2, 0,-1],
    [-1,2, 0,1],   [1,2, 0,1],
  ];

  for (const [dr, dc, br, bc] of horseMoves) {
    const nr = r + dr;
    const nc = c + dc;
    if (!insideBoard(nr,nc)) continue;

    const blockR = r + br;
    const blockC = c + bc;
    if (board[blockR][blockC]) continue;

    const target = board[nr][nc];
    if (!sameSide(piece, target)) {
      moves.push({ from:[r,c], to:[nr,nc] });
    }
  }

  return moves;
}

// ==========================
// 6. Xe (Chariot / 车)
// ==========================
function genChariot(board, r, c, piece: XiangqiPieceKey) {
  const moves = [];

  const dirs = [
    [1,0], [-1,0], [0,1], [0,-1]
  ];

  for (const [dr, dc] of dirs) {
    let nr = r + dr;
    let nc = c + dc;
    while (insideBoard(nr,nc)) {
      const target = board[nr][nc];
      if (!target) {
        moves.push({ from:[r,c], to:[nr,nc] });
      } else {
        if (!sameSide(piece, target)) {
          moves.push({ from:[r,c], to:[nr,nc] });
        }
        break;
      }
      nr += dr;
      nc += dc;
    }
  }

  return moves;
}

// ==========================
// 7. Pháo (Cannon / 炮)
// ==========================
function genCannon(board, r, c, piece: XiangqiPieceKey) {
  const moves = [];
  const dirs = [
    [1,0], [-1,0], [0,1], [0,-1]
  ];

  for (const [dr, dc] of dirs) {
    let nr = r + dr;
    let nc = c + dc;
    let jumped = false;

    while (insideBoard(nr,nc)) {
      const target = board[nr][nc];
      if (!jumped) {
        if (!target) {
          moves.push({ from:[r,c], to:[nr,nc] });
        } else {
          jumped = true;
        }
      } else {
        if (target) {
          if (!sameSide(piece, target)) {
            moves.push({ from:[r,c], to:[nr,nc] });
          }
          break;
        }
      }

      nr += dr;
      nc += dc;
    }
  }

  return moves;
}

// ==========================
// 8. Tốt (Soldier / 兵)
// ==========================
function genSoldier(board, r, c, piece: XiangqiPieceKey) {
  const moves = [];
  const red = isRed(piece);

  const forward = red ? -1 : 1;

  // Đi thẳng
  let nr = r + forward;
  let nc = c;
  if (insideBoard(nr,nc) && !sameSide(piece, board[nr][nc])) {
    moves.push({ from:[r,c], to:[nr,nc] });
  }

  // Qua sông → đi ngang
  const crossed = red ? r <= 4 : r >= 5;
  if (crossed) {
    for (const dc of [-1,1]) {
      nr = r;
      nc = c + dc;
      if (insideBoard(nr,nc) && !sameSide(piece, board[nr][nc])) {
        moves.push({ from:[r,c], to:[nr,nc] });
      }
    }
  }

  return moves;
}

// ==========================
// 9. Tổng hợp moves từng quân
// ==========================
function generateMoves(board, r, c, piece: XiangqiPieceKey) {
  switch (piece.toLowerCase()) {
    case "g": return genGeneral(board, r, c, piece);
    case "a": return genAdvisor(board, r, c, piece);
    case "e": return genElephant(board, r, c, piece);
    case "h": return genHorse(board, r, c, piece);
    case "r": return genChariot(board, r, c, piece);
    case "c": return genCannon(board, r, c, piece);
    case "s": return genSoldier(board, r, c, piece);
    default: return [];
  }
}

// ==========================
// 10. Không cho tướng đối mặt
// ==========================
function violatesGeneralFacing(board) {
  return isGeneralFacing(board);
}

// ==========================
// 11. Không cho tự chiếu
// ==========================
function causesSelfCheck(board, piece: XiangqiPieceKey, turnRed: boolean) {
  // Nếu đã đối mặt → sai
  if (violatesGeneralFacing(board)) return true;

  return false;
}

// ==========================
// 12. API chính
// ==========================
export function generateLegalMoves(
  board: (XiangqiPieceKey | null)[][],
  square: string
) {
  if (!square) return [];

  const files = "abcdefghi";
  const file = square[0];
  const rank = Number(square.slice(1));

  const c = files.indexOf(file);
  const r = 10 - rank;

  if (!insideBoard(r,c)) return [];

  const piece = board[r][c];
  if (!piece) return [];

  const turnRed = isRed(piece);

  const rawMoves = generateMoves(board, r, c, piece);
  const legal = [];

  for (const mv of rawMoves) {
    const [r1, c1] = mv.from;
    const [r2, c2] = mv.to;

    const newBoard = cloneBoard(board);
    newBoard[r2][c2] = piece;
    newBoard[r1][c1] = null;

    if (!causesSelfCheck(newBoard, piece, turnRed)) {
      legal.push({
        from: square,
        to: files[c2] + (10 - r2),
      });
    }
  }

  return legal;
}
// ==========================
// 13. Lấy tất cả ô bị tấn công bởi 1 bên
// ==========================
export function getAllAttacks(
  board: (XiangqiPieceKey | null)[][],
  side: "red" | "black"
) {
  const attacks: { r: number; c: number }[] = [];

  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 9; c++) {
      const piece = board[r][c];

      if (!piece) continue;

      const isPieceRed = piece >= "A" && piece <= "Z";
      if (side === "red" && !isPieceRed) continue;
      if (side === "black" && isPieceRed) continue;

      // Tạo moves cho quân này
      const raw = generateMoves(board, r, c, piece);

      for (const mv of raw) {
        attacks.push({ r: mv.to[0], c: mv.to[1] });
      }
    }
  }

  return attacks;
}

