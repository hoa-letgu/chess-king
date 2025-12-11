// src/games/xiangqi/utils/rules.ts
import type { XiangqiPieceKey } from "./pieces";

// --------------------------
// CHUYỂN TỌA ĐỘ ↔ Ô
// --------------------------
export function squareToCoord(sq: string): [number, number] {
  const files = "abcdefghi";
  const file = files.indexOf(sq[0]);
  const rank = Number(sq.slice(1));
  return [10 - rank, file];
}

export function coordToSquare(r: number, c: number): string {
  const files = "abcdefghi";
  return `${files[c]}${10 - r}`;
}

const insideBoard = (r: number, c: number) =>
  r >= 0 && r < 10 && c >= 0 && c < 9;

// --------------------------
// KIỂM TRA MÀU QUÂN
// --------------------------
function pieceColor(p: XiangqiPieceKey | null): "red" | "black" | null {
  if (!p) return null;
  return p === p.toUpperCase() ? "red" : "black";
}

// --------------------------
// LUẬT DI CHUYỂN
// --------------------------
export function generateLegalMoves(
  board: (XiangqiPieceKey | null | "")[][],
  square: string,
  piece?: XiangqiPieceKey          // ⭐ Cho phép optional
): string[] {

  // Nếu piece không truyền vào → tự lấy từ board
  if (!piece) {
    const [rr, cc] = squareToCoord(square);
    piece = board[rr][cc] as XiangqiPieceKey | null;
    if (!piece) return [];         // Không có quân → không có nước
  }

  if (!piece || typeof piece !== "string") return [];

  const [r, c] = squareToCoord(square);
  const color = pieceColor(piece)!;
  const moves: string[] = [];


  const add = (rr: number, cc: number) => {
    if (!insideBoard(rr, cc)) return;
    const target = board[rr][cc] as XiangqiPieceKey | null;
    if (pieceColor(target) === color) return;
    moves.push(coordToSquare(rr, cc));
  };

  // ======================
  // TƯỚNG (G)
  // ======================
  if (piece.toUpperCase() === "G") {
    const palaceCol = [3, 4, 5];
    const palaceRow = color === "red" ? [7, 8, 9] : [0, 1, 2];

    const dirs = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ];

    for (const [dr, dc] of dirs) {
      const rr = r + dr,
        cc = c + dc;
      if (palaceCol.includes(cc) && palaceRow.includes(rr)) add(rr, cc);
    }

    // Đối tướng
    let blocking = false;
    let rr = r + (color === "red" ? -1 : 1);

    while (rr >= 0 && rr < 10) {
      const p2 = board[rr][c];
      if (p2) {
        if (p2.toUpperCase() === "G" && pieceColor(p2) !== color) {
          if (!blocking) moves.push(coordToSquare(rr, c));
        }
        break;
      }
      rr += color === "red" ? -1 : 1;
    }
  }

  // ======================
  // SĨ (A)
  // ======================
  if (piece.toUpperCase() === "A") {
    const palaceCol = [3, 4, 5];
    const palaceRow = color === "red" ? [7, 8, 9] : [0, 1, 2];
    const dirs = [
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1],
    ];

    for (const [dr, dc] of dirs) {
      const rr = r + dr,
        cc = c + dc;
      if (palaceCol.includes(cc) && palaceRow.includes(rr)) add(rr, cc);
    }
  }

  // ======================
// TƯỢNG (E)
// ======================
if (piece.toUpperCase() === "E") {
  const dirs = [
    [2, 2],
    [2, -2],
    [-2, 2],
    [-2, -2],
  ];

  for (const [dr, dc] of dirs) {
    const rr = r + dr;
    const cc = c + dc;

    // Ô đích phải nằm trong bàn
    if (!insideBoard(rr, cc)) continue;

    // Không được qua sông
    if (color === "red" && rr < 5) continue;
    if (color === "black" && rr > 4) continue;

    // Mắt tượng (ô giữa đường chéo)
    const eyeR = r + dr / 2;
    const eyeC = c + dc / 2;

    // Nếu mắt tượng nằm ngoài bàn (lý thuyết không xảy ra, nhưng cứ check cho chắc)
    if (!insideBoard(eyeR, eyeC)) continue;

    // Bị chặn mắt → không đi được
    if (board[eyeR][eyeC]) continue;

    add(rr, cc);
  }
}


  // ======================
// MÃ (H)
// ======================
if (piece.toUpperCase() === "H") {
  const steps = [
    [-2, -1],
    [-2, 1],
    [2, -1],
    [2, 1],
    [-1, -2],
    [-1, 2],
    [1, -2],
    [1, 2],
  ];

  const blockCheck = [
    [-1, 0], // hai nước đầu dùng chân trên/dưới
    [1, 0],
    [0, -1], // hai nước tiếp dùng chân trái/phải
    [0, 1],
  ];

  for (let i = 0; i < steps.length; i++) {
    const [dr, dc] = steps[i];
    const rr = r + dr;
    const cc = c + dc;

    // Chân mã tương ứng
    const [br, bc] = blockCheck[Math.floor(i / 2)];
    const legR = r + br;
    const legC = c + bc;

    // Nếu chân mã nằm ngoài bàn → không có nước này
    if (!insideBoard(legR, legC)) continue;

    // Bị chặn chân → không đi theo hướng này
    if (board[legR][legC]) continue;

    // Nếu ô đích nằm ngoài bàn → bỏ
    if (!insideBoard(rr, cc)) continue;

    add(rr, cc);
  }
}

  // ======================
  // XE (R)
  // ======================
  if (piece.toUpperCase() === "R") {
    // 4 hướng
    const dirs = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ];

    for (const [dr, dc] of dirs) {
      let rr = r + dr,
        cc = c + dc;

      while (insideBoard(rr, cc)) {
        const target = board[rr][cc] as XiangqiPieceKey | null;

        if (!target) {
          moves.push(coordToSquare(rr, cc));
        } else {
          if (pieceColor(target) !== color)
            moves.push(coordToSquare(rr, cc));
          break;
        }

        rr += dr;
        cc += dc;
      }
    }
  }

  // ======================
  // PHÁO (C)
  // ======================
  if (piece.toUpperCase() === "C") {
    const dirs = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ];

    for (const [dr, dc] of dirs) {
      let rr = r + dr,
        cc = c + dc;

      let jumped = false;

      while (insideBoard(rr, cc)) {
        const target = board[rr][cc] as XiangqiPieceKey | null;

        if (!jumped) {
          if (!target) {
            moves.push(coordToSquare(rr, cc));
          } else {
            jumped = true;
          }
        } else {
          if (target) {
            if (pieceColor(target) !== color)
              moves.push(coordToSquare(rr, cc));
            break;
          }
        }

        rr += dr;
        cc += dc;
      }
    }
  }

  // ======================
  // TỐT (S)
  // ======================
  if (piece.toUpperCase() === "S") {
    if (color === "red") {
      // Đi xuống
      if (r - 1 >= 0) add(r - 1, c);

      // Qua sông (r <= 4)
      if (r <= 4) {
        if (c - 1 >= 0) add(r, c - 1);
        if (c + 1 < 9) add(r, c + 1);
      }
    } else {
      // Đi lên
      if (r + 1 < 10) add(r + 1, c);

      // Qua sông (r >= 5)
      if (r >= 5) {
        if (c - 1 >= 0) add(r, c - 1);
        if (c + 1 < 9) add(r, c + 1);
      }
    }
  }

  return moves;
}
// ================================
// TẠO TẤT CẢ NƯỚC ĐI CHO 1 BÊN
// ================================
export function generateAllMoves(
  board: (XiangqiPieceKey | null | "")[][],
  side: "red" | "black"
) {
  // =============================
  // VALIDATE BOARD
  // =============================
  if (!board || !Array.isArray(board) || board.length !== 10) {
    console.warn("generateAllMoves: board invalid!", board);
    return [];
  }

  for (let r = 0; r < 10; r++) {
    if (!Array.isArray(board[r]) || board[r].length !== 9) {
      console.warn("generateAllMoves: row invalid!", r, board[r]);
      return [];
    }
  }

  const moves: { from: string; to: string }[] = [];
  const files = "abcdefghi";

  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 9; c++) {
      const p = board[r][c] as XiangqiPieceKey | null;
      if (!p) continue;

      const color = p === p.toUpperCase() ? "red" : "black";
      if (color !== side) continue;

      const from = files[c] + (10 - r);

      const legal = generateLegalMoves(board, from, p);
      for (const to of legal) {
        moves.push({ from, to });
      }
    }
  }

  return moves;
}


