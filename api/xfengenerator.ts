// src/games/xiangqi/utils/xiangqiFen.ts
import type { XiangqiPieceKey } from "./pieces";

export type Side = "red" | "black";
export type XiangqiBoard = (XiangqiPieceKey | null | "")[][];
export type XiangqiFen = string;

/**
 * Chuyển board + lượt đi → X-FEN
 */
export function boardToFen(board: XiangqiBoard, turn: Side): XiangqiFen {
  if (!Array.isArray(board) || board.length !== 10) {
    throw new Error("boardToFen: invalid board (rows != 10)");
  }

  const rows: string[] = [];

  for (let r = 0; r < 10; r++) {
    const row = board[r];
    if (!Array.isArray(row) || row.length !== 9) {
      throw new Error(`boardToFen: invalid row length at r=${r}`);
    }

    let fenRow = "";
    let empty = 0;

    for (let c = 0; c < 9; c++) {
      const p = row[c] as XiangqiPieceKey | null | "";
      if (!p) {
        empty++;
      } else {
        if (empty > 0) {
          fenRow += String(empty);
          empty = 0;
        }
        fenRow += p; // G,A,E,H,R,C,S hoặc g,a,e,h,r,c,s
      }
    }

    if (empty > 0) fenRow += String(empty);
    rows.push(fenRow);
  }

  const sideChar = turn === "red" ? "r" : "b";
  return rows.join("/") + " " + sideChar;
}

/**
 * Parse X-FEN → board + lượt đi
 */
export function fenToBoard(fen: XiangqiFen): { board: XiangqiBoard; turn: Side } {
  const [boardPart, sidePart] = fen.trim().split(/\s+/);

  if (!boardPart) throw new Error("fenToBoard: missing board part");
  const rows = boardPart.split("/");
  if (rows.length !== 10) throw new Error("fenToBoard: must have 10 ranks");

  const board: XiangqiBoard = new Array(10);

  for (let r = 0; r < 10; r++) {
    const rowStr = rows[r];
    const row: (XiangqiPieceKey | null | "")[] = [];
    for (const ch of rowStr) {
      if (/[1-9]/.test(ch)) {
        const n = Number(ch);
        for (let i = 0; i < n; i++) row.push(null);
      } else {
        row.push(ch as XiangqiPieceKey);
      }
    }
    if (row.length !== 9) {
      throw new Error(`fenToBoard: rank ${r} has ${row.length} files, expected 9`);
    }
    board[r] = row;
  }

  const turn: Side = sidePart === "r" ? "red" : "black";
  return { board, turn };
}
