// src/games/go/utils/boardKey.ts
import type { Board } from "./rules";

export function boardToKey(board: Board): string {
  return board
    .map(row => row.map(c => (c === null ? "." : c[0])).join(""))
    .join("/");
}
