// src/games/go/utils/ko.ts
import type { Board } from "./rules";

export function boardToKey(board: Board): string {
  return board.map(r =>
    r.map(c => (c ? c[0] : ".")).join("")
  ).join("/");
}
