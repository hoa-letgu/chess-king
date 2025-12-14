// src/games/go/hooks/useGoMove.ts
import type { Board, Stone } from "../utils/rules";
import { boardToKey } from "../utils/boardKey";

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
  playerColor: Exclude<Stone, null>;   // ⭐ THÊM
  setBoard: (b: Board) => void;
  setTurn: (s: Exclude<Stone, null>) => void;
  history: string[];
  setHistory: (h: string[]) => void;
}) {
  const handleClick = (r: number, c: number) => {
    // ❌ không phải lượt người → cấm click
    if (turn !== playerColor) return;

    if (board[r][c] !== null) return;

    const next = board.map(row => [...row]);
    next[r][c] = turn;

    const key = boardToKey(next);

    if (history.length >= 2 && history[history.length - 2] === key) {
      return; // KO rule
    }

    setBoard(next);
    setHistory([...history, key]);
    setTurn(turn === "black" ? "white" : "black");
  };

  return { handleClick };
}
