import { useState } from "react";
import type { Board, Player } from "../utils/types";

export function createBoard(size: number): Board {
  return Array.from({ length: size }, () =>
    Array.from({ length: size }, () => null)
  );
}

export function useGomokuState(size: number) {
  const [board, setBoard] = useState<Board>(() => createBoard(size));
  const [turn, setTurn] = useState<Player>("X");

  const playMove = (r: number, c: number) => {
    setBoard(prev => {
      if (prev[r][c]) return prev;

      const next = prev.map(row => [...row]);
      next[r][c] = turn;
      return next;
    });
    setTurn(t => (t === "X" ? "O" : "X"));
  };

  const reset = () => {
    setBoard(createBoard(size));
    setTurn("X");
  };

  return { board, turn, playMove, reset };
}
