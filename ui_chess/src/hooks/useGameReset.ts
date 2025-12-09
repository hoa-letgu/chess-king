import { Chess } from "chess.js";

export function useGameReset(setters: any) {
  const {
    setFen,
    setHistory,
    setHistoryIndex,
    setOnlineColor,
    setDeadKingSquare,
    setLastMove,
    setCapturedPiece,
    setIsAnimating,
  } = setters;

  const resetBoardState = () => {
    const g = new Chess();
    const f = g.fen();

    setFen(f);
    setHistory([f]);
    setHistoryIndex(0);
    setOnlineColor(null);
    setDeadKingSquare(null);
    setLastMove(null);
    setCapturedPiece(null);
    setIsAnimating(false);
  };

  const resetMatchOnly = () => {
    const g = new Chess();
    const f = g.fen();
    setFen(f);
    setHistory([f]);
    setHistoryIndex(0);
  };

  return { resetBoardState, resetMatchOnly };
}
