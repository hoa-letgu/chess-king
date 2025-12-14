// src/games/go/hooks/useGoBot.ts
import { useEffect } from "react";
import type { Board, Stone } from "../utils/rules";
import { findBotMove } from "../utils/goBot";

export function useGoBot({
  enabled,
  board,
  turn,
  botColor,
  setBoard,
  setTurn,
}: {
  enabled: boolean;
  board: Board;
  turn: Exclude<Stone, null>;
  botColor: Exclude<Stone, null>;
  setBoard: (b: Board) => void;
  setTurn: (s: Exclude<Stone, null>) => void;
}) {
  useEffect(() => {
    if (!enabled) return;
    if (turn !== botColor) return;

    const t = setTimeout(() => {
      const mv = findBotMove(board, botColor);
      if (!mv) return;

      const next = board.map(r => [...r]);
      next[mv.r][mv.c] = botColor;

      setBoard(next);
      setTurn(botColor === "black" ? "white" : "black");
    }, 400);

    return () => clearTimeout(t);
  }, [enabled, board, turn, botColor]);
}
