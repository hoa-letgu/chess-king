// src/games/go/utils/goCandidates.ts
import type { Board, Stone } from "./rules";

const DIRS = [
  [1,0],[-1,0],[0,1],[0,-1]
];

export function generateCandidates(
  board: Board,
  max = 12
): { r: number; c: number }[] {
  const size = board.length;
  const set = new Set<string>();
  const out: { r:number;c:number }[] = [];

  function add(r:number,c:number){
    const k = `${r},${c}`;
    if (!set.has(k)) {
      set.add(k);
      out.push({ r, c });
    }
  }

  for (let r=0;r<size;r++){
    for (let c=0;c<size;c++){
      if (board[r][c]) {
        for (const [dr,dc] of DIRS) {
          const nr=r+dr,nc=c+dc;
          if (nr>=0&&nc>=0&&nr<size&&nc<size && !board[nr][nc]) {
            add(nr,nc);
          }
        }
      }
    }
  }

  // fallback: nếu bàn trống → trung tâm
  if (out.length === 0) {
    const mid = Math.floor(size/2);
    add(mid, mid);
  }

  return out.slice(0, max);
}
