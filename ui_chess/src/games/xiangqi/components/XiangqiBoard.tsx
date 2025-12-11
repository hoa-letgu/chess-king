// src/games/xiangqi/components/XiangqiBoard.tsx
import type { CSSProperties } from "react";
import type { XiangqiPieceKey } from "@/games/xiangqi/utils/pieces";
import { XIANGQI_PIECE_IMG, isXiangqiPieceKey } from "@/games/xiangqi/utils/pieces";

type LastMove = {
  from: string;
  to: string;
} | null;

type MovingPiece = {
  piece: XiangqiPieceKey;
  square: string;        // ô hiện tại của quân đang bay (from → to)
};

type Props = {
  board: (XiangqiPieceKey | null | "")[][];
  selectedSquare?: string | null;
  legalTargets?: string[];
  lastMove?: LastMove;
  viewSide?: "red" | "black";
  onClick?: (square: string) => void;

  // ⭐ Animation
  movingPiece?: MovingPiece | null;
  hideSquare?: string | null;   // ẩn quân tĩnh tại ô này (quân đang bay)
};

export function XiangqiBoard({
  board,
  selectedSquare = null,
  legalTargets = [],
  lastMove = null,
  viewSide = "red",
  onClick,
  movingPiece = null,
  hideSquare = null,
}: Props) {
  const files = "abcdefghi";
  const isRedView = viewSide === "red";

  const squares: JSX.Element[] = [];

  // helper: square → {left, top} %
  const squareToPos = (sq: string) => {
    const file = sq[0];
    const rank = Number(sq.slice(1)); // 1..10

    const c = files.indexOf(file);    // 0..8
    const r = 10 - rank;             // 0..9 (trên -> dưới)

    const vr = isRedView ? r : 9 - r;   // view row
    const vc = isRedView ? c : 8 - c;   // view col

    return {
      left: (vc * 100) / 9,
      top: (vr * 100) / 10,
    };
  };

  // ================================
  // RENDER 10 x 9 Ô (XOAY THEO VIEW)
  // ================================
  for (let vr = 0; vr < 10; vr++) {
    for (let vc = 0; vc < 9; vc++) {
      const r = isRedView ? vr : 9 - vr;
      const c = isRedView ? vc : 8 - vc;

      const piece = board?.[r]?.[c] || null;

      const file = files[c];
      const rank = 10 - r;
      const square = `${file}${rank}`;

      const isSelected = selectedSquare === square;
      const isLegal = legalTargets.includes(square);
      const isLastFrom = lastMove?.from === square;
      const isLastTo = lastMove?.to === square;

      const style: CSSProperties = {};

      if (isLastFrom) style.background = "rgba(255, 215, 0, 0.35)";
      if (isLastTo) style.background = "rgba(255, 220, 0, 0.55)";

      if (isSelected) {
        style.outline = "3px solid rgba(80,180,255,0.9)";
        style.outlineOffset = "-2px";
      }

      if (isLegal) {
        style.boxShadow = "inset 0 0 0 3px rgba(50,150,255,0.65)";
      }

      const pieceKey = piece as XiangqiPieceKey;
      const hideStatic = hideSquare === square;

      squares.push(
        <button
          key={square}
          onClick={() => onClick?.(square)}
          style={{
            position: "absolute",
            width: `${100 / 9}%`,
            height: `${100 / 10}%`,
            left: `${(vc * 100) / 9}%`,
            top: `${(vr * 100) / 10}%`,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            background: "transparent",
            border: "none",
            padding: 0,
            ...style,
          }}
        >
          {!hideStatic && isXiangqiPieceKey(pieceKey) && (
            <img
              src={XIANGQI_PIECE_IMG[pieceKey]}
              style={{
                width: "80%",
                height: "80%",
                pointerEvents: "none",
              }}
            />
          )}
        </button>
      );
    }
  }

  const renderMovingPiece = () => {
    if (!movingPiece) return null;

    const { left, top } = squareToPos(movingPiece.square);

    return (
      <img
        src={XIANGQI_PIECE_IMG[movingPiece.piece]}
        style={{
          position: "absolute",
          width: `${100 / 9}%`,
          height: `${100 / 10}%`,
          left: `${left}%`,
          top: `${top}%`,
          transition: "left 180ms linear, top 180ms linear",
          pointerEvents: "none",
          zIndex: 50,
        }}
      />
    );
  };

  return (
    <div
      className="relative mx-auto border rounded-lg overflow-hidden shadow"
      style={{
        width: "100%",
        maxWidth: 520,
        aspectRatio: "9 / 10",
        backgroundImage: "url('/xiangqi/chineseboard.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {squares}
      {renderMovingPiece()}
    </div>
  );
}
