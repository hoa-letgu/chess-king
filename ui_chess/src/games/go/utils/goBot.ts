import { applyMove } from "./goEngine";
import type { GoState } from "./goEngine";
import type { Stone } from "./rules";

export function findBotMove(
  state: GoState,
  bot: Stone
): { r: number; c: number } | null {
  const size = state.board.length;

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const res = applyMove(state, r, c);
      if (res.ok) return { r, c };
    }
  }

  return null;
}
