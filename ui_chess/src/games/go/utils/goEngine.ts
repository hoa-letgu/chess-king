// src/games/go/engine/goEngine.ts
import type { Board, Stone } from "../utils/rules";
import { opposite } from "../utils/rules";
import { playMove } from "../utils/goPlay";
import { boardToKey } from "../utils/boardKey";

export function applyMove(
  state: {
    board: Board;
    turn: Exclude<Stone, null>;
    history: string[];
  },
  r: number,
  c: number
) {
  const { board, turn, history } = state;

  // ✔ playMove trả về Board | null
  const nextBoard = playMove(board, r, c, turn);
  if (!nextBoard) return { ok: false };

  // 🔴 DÒNG QUAN TRỌNG – CHỈ TRUYỀN Board
  const key = boardToKey(nextBoard);

  return {
    ok: true,
    state: {
      board: nextBoard,
      turn: opposite(turn),
      history: [...history, key],
    },
  };
}
