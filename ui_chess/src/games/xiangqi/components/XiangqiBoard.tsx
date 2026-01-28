// src/games/xiangqi/components/XiangqiBoard.tsx
import type { CSSProperties } from "react";
import type { XiangqiPieceKey } from "@/games/xiangqi/utils/pieces";
import {
  XIANGQI_PIECE_IMG,
  isXiangqiPieceKey,
} from "@/games/xiangqi/utils/pieces";

/* ================= TYPES ================= */

type LastMove = {
  from: string;
  to: string;
} | null;

type MovingPiece = {
  piece: XiangqiPieceKey;
  square: string;
};

type Props = {
  board: (XiangqiPieceKey | null | "")[][];
  selectedSquare?: string | null;
  legalTargets?: string[];
  lastMove?: LastMove;
  viewSide?: "red" | "black";
  onClick?: (square: string) => void;

  movingPiece?: MovingPiece | null;
  hideSquare?: string | null;
};

/* ================= CONSTANTS ================= */

// canh theo ảnh chineseboard.png (có viền gỗ)
const OFFSET_X = 3;    // %
const OFFSET_Y = 6.5;  // %

const BOARD_W = 100 - OFFSET_X * 2; // phần lưới thật
const BOARD_H = 100 - OFFSET_Y * 2;

/* ================= COMPONENT ================= */

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

  /* ===== square -> % position (GIAO ĐIỂM) ===== */
  const squareToPos = (sq: string) => {
    const file = sq[0];
    const rank = Number(sq.slice(1)); // 1..10

    const c = files.indexOf(file); // 0..8
    const r = 10 - rank;           // 0..9 (top -> bottom)

    const vr = isRedView ? r : 9 - r;
    const vc = isRedView ? c : 8 - c;

    return {
      left: OFFSET_X + (vc * BOARD_W) / 8,
      top: OFFSET_Y + (vr * BOARD_H) / 9,
    };
  };

  /* ===== RENDER CLICK ZONES ===== */
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

      if (isLastFrom) style.background = "rgba(255,215,0,0.35)";
      if (isLastTo) style.background = "rgba(255,220,0,0.55)";

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
            width: `${BOARD_W / 8}%`,
            height: `${BOARD_H / 9}%`,
            left: `${OFFSET_X + (vc * BOARD_W) / 8}%`,
            top: `${OFFSET_Y + (vr * BOARD_H) / 9}%`,
            transform: "translate(-50%, -50%)",
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
                width: "75%",
                height: "75%",
                pointerEvents: "none",
              }}
            />
          )}
        </button>
      );
    }
  }

  /* ===== ANIMATION BAY QUÂN ===== */
  const renderMovingPiece = () => {
    if (!movingPiece) return null;

    const { left, top } = squareToPos(movingPiece.square);

    return (
      <img
        src={XIANGQI_PIECE_IMG[movingPiece.piece]}
        style={{
          position: "absolute",
          width: `${BOARD_W / 8}%`,
          height: `${BOARD_H / 9}%`,
          left: `${left}%`,
          top: `${top}%`,
          transform: "translate(-50%, -50%)",
          transition: "left 180ms linear, top 180ms linear",
          pointerEvents: "none",
          zIndex: 50,
        }}
      />
    );
  };

  /* ===== ROOT ===== */
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
