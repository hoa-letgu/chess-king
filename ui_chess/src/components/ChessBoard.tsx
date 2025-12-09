// src/components/ChessBoard.tsx
import React, { CSSProperties } from "react";
import { PIECE_IMG } from "@/utils/pieces";

type LastMove = {
  from: string;
  to: string;
  inCheckSquare?: string | null;
  checkBy?: { square: string; piece: string } | null;
  color?: "w" | "b";
} | null;

type MovingPiece = {
  piece: string;        // "P","p","R","r",...
  from: string;
  to: string;
};

type CapturedPiece = {
  square: string;
  piece: string;
};

type Props = {
  board: any[][];
  selectedSquare: string | null;
  legalTargets: string[];
  lastMove: LastMove;
  capturedPiece: CapturedPiece | null;
  movingPiece: MovingPiece | null;
  movingPath: { x: number; y: number }[];
  movingStep: number;
  hidePiece: string | null;
  deadKingSquare: string | null;
  viewColor: "w" | "b";          // ⭐ góc nhìn người chơi
  onClick: (square: string) => void;
};

export function ChessBoard({
  board,
  selectedSquare,
  legalTargets,
  lastMove,
  capturedPiece,
  movingPiece,
  movingPath,
  movingStep,
  hidePiece,
  deadKingSquare,
  viewColor,
  onClick,
}: Props) {
  const squares: JSX.Element[] = [];
  const isWhiteView = viewColor === "w";

  // ================================
  // helper: square ("e4") -> % theo góc nhìn
  // ================================
  const squareToXY = (sq: string) => {
    const files = "abcdefgh";
    const fileIndex = files.indexOf(sq[0]); // 0..7
    const rankNum = Number(sq[1]);          // 1..8

    if (isWhiteView) {
      // a1: x=0, y=87.5 (dưới-trái)
      return {
        x: fileIndex * 12.5,
        y: (8 - rankNum) * 12.5,
      };
    } else {
      // xoay 180° logic: h8 dưới-phải, h1 trên-phải
      return {
        x: (7 - fileIndex) * 12.5,
        y: (rankNum - 1) * 12.5,
      };
    }
  };

  const kingInCheckSquare = lastMove?.inCheckSquare ?? null;

  // ================================
  // RENDER BOARD (flip theo view)
  // ================================
  for (let vr = 0; vr < 8; vr++) {
    for (let vc = 0; vc < 8; vc++) {
      // vr, vc: vị trí hiển thị (0..7)
      // r, c: index thật trong board[]
      const r = isWhiteView ? vr : 7 - vr;
      const c = isWhiteView ? vc : 7 - vc;

      const file = "abcdefgh"[c];
      const rank = 8 - r;
      const square = `${file}${rank}`;
      const piece = board[r][c];

      const pieceKey =
        piece && piece.color === "w"
          ? piece.type.toUpperCase()
          : piece && piece.color === "b"
          ? piece.type
          : null;

      const isSelected = selectedSquare === square;
      const isLegal = legalTargets.includes(square);
      const isLastFrom = lastMove?.from === square;
      const isLastTo = lastMove?.to === square;
      const isKingCheck = kingInCheckSquare === square;
      const isDeadKing = deadKingSquare === square;

      const style: CSSProperties = {};

      // highlight nước vừa đi (cho cả 2 bên – bạn thích có thể đổi màu theo lastMove.color)
      if (isLastFrom) style.background = "rgba(255,215,0,0.35)";
      if (isLastTo) style.background = "rgba(255,220,0,0.55)";

      if (isSelected) style.outline = "3px solid #53a6ff";
      if (isLegal)
        style.boxShadow = "inset 0 0 0 3px rgba(50,150,255,0.65)";

      if (isKingCheck) {
        style.animation = "kingBlink 0.45s ease-in-out 0s 3";
        style.boxShadow = "inset 0 0 12px 4px rgba(255,0,0,0.7)";
      }

      const hideStaticPiece =
        hidePiece === square ||
        (movingPiece && movingPiece.from === square);

      squares.push(
        <button
          key={square}
          onClick={() => onClick(square)}
          style={{
            position: "absolute",
            width: "12.5%",
            height: "12.5%",
            left: `${vc * 12.5}%`,     // dùng cột hiển thị
            top: `${vr * 12.5}%`,      // dùng hàng hiển thị
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            ...style,
          }}
        >
          {pieceKey && !hideStaticPiece && (
            <img
              src={PIECE_IMG[pieceKey]}
              style={{
                width: "80%",
                height: "80%",
                pointerEvents: "none",
                transition: "transform 0.35s ease-out",
                ...(isDeadKing
                  ? { transform: "rotate(90deg)", opacity: 0.9 }
                  : {}),
              }}
            />
          )}
        </button>
      );
    }
  }

  // ================================
  // Quân đang di chuyển (theo movingPath + view)
  // ================================
  const renderMovingPiece = () => {
    if (!movingPiece || !movingPath || movingPath.length === 0) return null;

    const { piece } = movingPiece;
    const step =
      movingPath[movingStep] || movingPath[movingPath.length - 1];

    const fileIndex = step.x; // 0..7
    const rankNum = step.y;   // 1..8

    let xPct: number;
    let yPct: number;

    if (isWhiteView) {
      xPct = fileIndex * 12.5;
      yPct = (8 - rankNum) * 12.5;
    } else {
      xPct = (7 - fileIndex) * 12.5;
      yPct = (rankNum - 1) * 12.5;
    }

    return (
      <img
        src={PIECE_IMG[piece]}
        style={{
          position: "absolute",
          width: "12.5%",
          height: "12.5%",
          left: `${xPct}%`,
          top: `${yPct}%`,
          transition: "all 50ms linear",
          pointerEvents: "none",
          zIndex: 100,
        }}
      />
    );
  };

  // ================================
  // Quân bị ăn (fade out theo view)
  // ================================
  const renderCaptured = () => {
    if (!capturedPiece) return null;
    const { x, y } = squareToXY(capturedPiece.square);

    return (
      <img
        src={PIECE_IMG[capturedPiece.piece]}
        style={{
          position: "absolute",
          width: "12.5%",
          height: "12.5%",
          left: `${x}%`,
          top: `${y}%`,
          animation: "captFadeOut 0.32s ease-out forwards",
          pointerEvents: "none",
        }}
      />
    );
  };

  return (
    <div
      className="relative w-full max-w-[480px] aspect-square mx-auto border rounded-lg overflow-hidden shadow"
      style={{
        backgroundImage: "url('/board.png')",
        backgroundSize: "cover",
        // ❌ KHÔNG rotate container nữa, đã flip bằng logic phía trên
      }}
    >
      <style>
        {`
          @keyframes captFadeOut {
            0% { opacity: 1; transform: scale(1); }
            60% { opacity: 0.4; transform: scale(0.55); }
            100% { opacity: 0; transform: scale(0); }
          }

          @keyframes kingBlink {
            0%   { box-shadow: inset 0 0 0px 0px rgba(255,0,0,0.2); }
            50%  { box-shadow: inset 0 0 20px 9px rgba(255,0,0,0.85); }
            100% { box-shadow: inset 0 0 0px 0px rgba(255,0,0,0.2); }
          }
        `}
      </style>

      {squares}
      {renderMovingPiece()}
      {renderCaptured()}
    </div>
  );
}
