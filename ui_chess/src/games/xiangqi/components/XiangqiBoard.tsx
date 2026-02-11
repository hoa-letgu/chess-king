// src/games/xiangqi/components/XiangqiBoard.tsx
import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import type { XiangqiPieceKey } from "@/games/xiangqi/utils/pieces";
import { XIANGQI_PIECE_IMG, isXiangqiPieceKey } from "@/games/xiangqi/utils/pieces";

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

// ✅ TÁCH OFFSET 4 PHÍA (ảnh viền không đều phải làm vậy)
const OFFSET_L = 3.3;
const OFFSET_R = 3.3;

const OFFSET_T = 4.6;   // giảm nhẹ
const OFFSET_B = 6.4;   // tăng nhẹ


const BOARD_W = 100 - OFFSET_L - OFFSET_R;
const BOARD_H = 100 - OFFSET_T - OFFSET_B;

// ===== DEBUG OVERLAY =====
const DEBUG_GRID = true;
const GRID_COLOR = "rgba(255, 0, 0, 0.55)";
const GRID_THICKNESS = 1;
const DOT_COLOR = "rgba(0, 255, 255, 0.9)";
const DOT_RADIUS_PX = 2.2;

// Click zone scale (khuyến nghị)
const CELL_SCALE = 0.8;

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

  // ✅ Tự set aspect ratio theo ảnh nền để tránh crop khi dùng cover
  const [boardRatio, setBoardRatio] = useState<string>("9 / 10");

  useEffect(() => {
    const img = new Image();
    img.src = "/xiangqi/chineseboard.png";
    img.onload = () => {
      setBoardRatio(`${img.naturalWidth} / ${img.naturalHeight}`);
    };
  }, []);

  /* ===== square -> % position (GIAO ĐIỂM) ===== */
  const squareToPos = (sq: string) => {
    const file = sq[0];
    const rank = Number(sq.slice(1)); // 1..10

    const c = files.indexOf(file); // 0..8
    const r = 10 - rank; // 0..9

    const vr = isRedView ? r : 9 - r;
    const vc = isRedView ? c : 8 - c;

    return {
      left: OFFSET_L + (vc * BOARD_W) / 8,
      top: OFFSET_T + (vr * BOARD_H) / 9,
    };
  };

  /* ===== DEBUG: GRID OVERLAY ===== */
  const DebugGridOverlay = () => {
    if (!DEBUG_GRID) return null;

    return (
      <div
        style={{
          position: "absolute",
          left: `${OFFSET_L}%`,
          top: `${OFFSET_T}%`,
          width: `${BOARD_W}%`,
          height: `${BOARD_H}%`,
          pointerEvents: "none",
          zIndex: 30,

          outline: `${GRID_THICKNESS}px solid ${GRID_COLOR}`,
          outlineOffset: "0px",

          backgroundImage: `
            repeating-linear-gradient(
              to right,
              ${GRID_COLOR} 0px,
              ${GRID_COLOR} ${GRID_THICKNESS}px,
              transparent ${GRID_THICKNESS}px,
              transparent calc(100% / 8)
            ),
            repeating-linear-gradient(
              to bottom,
              ${GRID_COLOR} 0px,
              ${GRID_COLOR} ${GRID_THICKNESS}px,
              transparent ${GRID_THICKNESS}px,
              transparent calc(100% / 9)
            )
          `,
        }}
      />
    );
  };

  /* ===== DEBUG: DOTS (90 giao điểm) ===== */
  const DebugDotsOverlay = () => {
    if (!DEBUG_GRID) return null;

    const dots: JSX.Element[] = [];
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 9; c++) {
        const x = (c / 8) * 100;
        const y = (r / 9) * 100;
        dots.push(
          <circle
            key={`d_${r}_${c}`}
            cx={`${x}%`}
            cy={`${y}%`}
            r={DOT_RADIUS_PX}
            fill={DOT_COLOR}
          />
        );
      }
    }

    return (
      <svg
        style={{
          position: "absolute",
          left: `${OFFSET_L}%`,
          top: `${OFFSET_T}%`,
          width: `${BOARD_W}%`,
          height: `${BOARD_H}%`,
          pointerEvents: "none",
          zIndex: 31,
          overflow: "visible",
        }}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {dots}
      </svg>
    );
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
            width: `${(BOARD_W / 8) * CELL_SCALE}%`,
            height: `${(BOARD_H / 9) * CELL_SCALE}%`,
            left: `${OFFSET_L + (vc * BOARD_W) / 8}%`,
            top: `${OFFSET_T + (vr * BOARD_H) / 9}%`,
            transform: "translate(-50%, -50%)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            background: "transparent",
            border: "none",
            padding: 0,
            zIndex: 20,
            ...style,
          }}
        >
          {!hideStatic && isXiangqiPieceKey(pieceKey) && (
            <img
              src={XIANGQI_PIECE_IMG[pieceKey]}
              style={{ width: "75%", height: "75%", pointerEvents: "none" }}
              alt=""
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
        alt=""
      />
    );
  };

  /* ===== ROOT ===== */
  return (
    <div
      className="relative mx-auto border rounded-lg overflow-hidden shadow"
      style={{
        width: "100%",
        maxWidth: "min(100vw, 900px)",
        aspectRatio: boardRatio,

        backgroundImage: "url('/xiangqi/chineseboard.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <DebugGridOverlay />
      <DebugDotsOverlay />

      {squares}
      {renderMovingPiece()}
    </div>
  );
}
