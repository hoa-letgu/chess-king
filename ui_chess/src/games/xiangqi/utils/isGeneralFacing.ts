// isGeneralFacing.ts
import type { XiangqiPieceKey } from "./pieces";

/** Kiểm tra tướng có đối mặt nhau hay không */
export function isGeneralFacing(
  board: (XiangqiPieceKey | null | "")[][]
): boolean {
  let redR = -1, redC = -1;
  let blackR = -1, blackC = -1;

  // Tìm vị trí hai tướng
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 9; c++) {
      const p = board[r][c];
      if (p === "G") { redR = r; redC = c; }
      if (p === "g") { blackR = r; blackC = c; }
    }
  }

  // Nếu không cùng cột → không đối mặt
  if (redC !== blackC) return false;

  // Kiểm tra giữa hai tướng có quân nào không
  const c = redC;
  const [start, end] = redR < blackR
    ? [redR + 1, blackR - 1]
    : [blackR + 1, redR - 1];

  for (let r = start; r <= end; r++) {
    if (board[r][c] !== null && board[r][c] !== "") return false;
  }

  // Nếu không có quân cản → vi phạm
  return true;
}
