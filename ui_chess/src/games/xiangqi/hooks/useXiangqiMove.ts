// src/games/xiangqi/hooks/useXiangqiMove.ts
import { useState } from "react";
import type { XiangqiPieceKey } from "@/games/xiangqi/utils/pieces";

import {
  generateLegalMoves,
  squareToCoord,
} from "@/games/xiangqi/utils/rules";

import { cloneBoard } from "@/games/xiangqi/utils/cloneBoard";
import { isGeneralFacing } from "@/games/xiangqi/utils/isGeneralFacing";
import { isInCheck } from "@/games/xiangqi/utils/isInCheck";

type Side = "red" | "black";

export function useXiangqiMove({
  board,
  currentTurn,
  onMoveApplied,
}: {
  board: (XiangqiPieceKey | null | "")[][];
  currentTurn: Side;
  onMoveApplied: (move: {
    from: string;
    to: string;
    piece: XiangqiPieceKey;
    capture: XiangqiPieceKey | null;
    check: boolean;
    lastMove: { from: string; to: string };
  }) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [legalTargets, setLegalTargets] = useState<string[]>([]);

  const handleClick = (square: string) => {
    const [r, c] = squareToCoord(square);
    const piece = board[r][c] as XiangqiPieceKey | null;
    const pieceColor = piece
      ? piece === piece.toUpperCase()
        ? "red"
        : "black"
      : null;

    // CLICK 1 → chọn quân
    if (!selected) {
      if (!piece) return;
      if (pieceColor !== currentTurn) return;

      setSelected(square);
      const moves = generateLegalMoves(board, square, piece);
      setLegalTargets(moves);
      return;
    }

    // CLICK 2 → chọn ô đến
    if (!legalTargets.includes(square)) {
      setSelected(null);
      setLegalTargets([]);
      return;
    }

    const [r1, c1] = squareToCoord(selected);
    const [r2, c2] = squareToCoord(square);
    const movingPiece = board[r1][c1] as XiangqiPieceKey;

    const tmp = cloneBoard(board);
    tmp[r2][c2] = movingPiece;
    tmp[r1][c1] = null;

    // Cấm tướng đối mặt
    if (isGeneralFacing(tmp)) {
      console.log("⛔ Tướng đối mặt, không hợp lệ!");
      return;
    }

    const enemySide = currentTurn === "red" ? "black" : "red";
    const check = isInCheck(tmp, enemySide);

    const capture = board[r2][c2]
      ? (board[r2][c2] as XiangqiPieceKey)
      : null;

    onMoveApplied({
      from: selected,
      to: square,
      piece: movingPiece,
      capture,
      check,
      lastMove: { from: selected, to: square },
    });

    setSelected(null);
    setLegalTargets([]);
  };

  return {
    selectedSquare: selected,
    legalTargets,
    handleClick,
  };
}
