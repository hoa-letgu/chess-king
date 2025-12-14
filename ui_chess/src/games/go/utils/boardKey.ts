// src/games/go/utils/boardKey.ts
import type { Board } from "./rules";

export function boardToKey(board: Board): string {
  return board.map(r => r.map(c => c ?? ".").join("")).join("/");
}
