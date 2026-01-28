import type { Board, Stone } from "../utils/rules";
import { boardToKey } from "../utils/boardKey";
import { playMove } from "../utils/goPlay";

export function useGoMove({
  board,
  turn,
  playerColor,
  setBoard,
  setTurn,
  history,
  setHistory,
}: {
  board: Board;
  turn: Exclude<Stone, null>;
  playerColor: Exclude<Stone, null>;
  setBoard: (b: Board) => void;
  setTurn: (s: Exclude<Stone, null>) => void;
  history: string[];
  setHistory: (h: string[]) => void;
}) {
  const handleClick = (r: number, c: number) => {
    // ❌ không phải lượt người
    if (turn !== playerColor) return;

    // ❌ ô đã có quân
    if (board[r][c] !== null) return;

    // ✅ thử đánh (đã xử lý capture + suicide)
    const next = playMove(board, r, c, turn);
    if (!next) return;

    const key = boardToKey(next);

    // ✅ SIMPLE KO
    if (
      history.length >= 2 &&
      key === history[history.length - 2]
    ) {
      return;
    }

    setBoard(next);
    setHistory([...history, key]);
    setTurn(turn === "black" ? "white" : "black");
  };

  return { handleClick };
}
