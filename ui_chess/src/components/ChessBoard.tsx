// src/components/ChessBoard.tsx
import React, { CSSProperties } from "react";
import { PIECE_IMG } from "@/utils/pieces";

type LastMove = {
  from: string;
  to: string;
  inCheckSquare?: string | null;
  checkBy?: { square: string; piece: string } | null;
} | null;

type MovingPiece = {
  piece: string;   // "P","p","R","r",...
  from: string;    // "e2"
  to: string;      // "e4"
};

type CapturedPiece = {
  square: string;  // ô bị ăn
  piece: string;   // key hình: "P","p","Q","q",...
};

type Props = {
  board: any[][];
  selectedSquare: string | null;
  legalTargets: string[];
  lastMove: LastMove;
  capturedPiece: CapturedPiece | null;
  movingPiece: MovingPiece | null;
  onClick: (square: string) => void;
};

export function ChessBoard({
  board,
  selectedSquare,
  legalTargets,
  lastMove,
  capturedPiece,
  movingPiece,
  hidePiece,
  onClick,
}: Props) {
  const squares: JSX.Element[] = [];

  // Chuyển "e4" -> % toạ độ
  const squareToXY = (sq: string) => {
    const file = sq[0];
    const rank = Number(sq[1]);
    return {
      x: "abcdefgh".indexOf(file) * 12.5,
      y: (8 - rank) * 12.5,
    };
  };

  const kingInCheckSquare = lastMove?.inCheckSquare ?? null;
  const checkBy = lastMove?.checkBy ?? null;

  // --------------------------
  // Render từng ô + quân
  // --------------------------
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
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
      const isCheckingPiece = !!(checkBy && checkBy.square === square);

      const style: CSSProperties = {};

      // highlight nước vừa đi
      if (isLastFrom) style.background = "rgba(255,215,0,0.35)";
      if (isLastTo) style.background = "rgba(255,200,0,0.55)";

      // ô đang chọn
      if (isSelected) style.outline = "3px solid #53a6ff";

      // ô hợp lệ → chỉ viền, không chấm tròn
      if (isLegal) {
        style.boxShadow = "inset 0 0 0 3px rgba(50,150,255,0.65)";
      }

      // vua đang bị chiếu
      if (isKingCheck) {
        style.animation = "kingBlink 0.45s ease-in-out 0s 3";
        style.boxShadow = "inset 0 0 12px 4px rgba(255,0,0,0.7)";
      }

      const mustHidePiece =
        movingPiece &&
        (movingPiece.from === square || movingPiece.to === square);

      squares.push(
        <button
          key={square}
          onClick={() => onClick(square)}
          style={{
            position: "absolute",
            width: "12.5%",
            height: "12.5%",
            left: `${c * 12.5}%`,
            top: `${r * 12.5}%`,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            ...style,
          }}
        >
          {/* Quân cờ tĩnh (ẩn nếu đang có movingPiece ở from/to) */}
          {pieceKey && hidePiece !== square && !(movingPiece && movingPiece.from === square) && (
    <img src={PIECE_IMG[pieceKey]} style={{ width:"80%", height:"80%" }} />
)}

        </button>
      );
    }
  }

  // --------------------------
  // Quân đang di chuyển (animation)
  // --------------------------
  const renderMovingPiece = () => {
    if (!movingPiece) return null;

    const { piece, from, to } = movingPiece;
    const start = squareToXY(from);
    const end = squareToXY(to);

    return (
      <img
        src={PIECE_IMG[piece]}
        
      />
    );
  };

  // --------------------------
  // Quân bị ăn (fade out)
  // --------------------------
  const renderCaptured = () => {
    if (!capturedPiece) return null;
    const { x, y } = squareToXY(capturedPiece.square);

    return (
      <img
        src={PIECE_IMG[capturedPiece.piece]}
       
      />
    );
  };

  return (
    <div
      className="relative w-full max-w-[480px] aspect-square mx-auto border rounded-lg overflow-hidden shadow"
      style={{
        backgroundImage: "url('/board.png')",
        backgroundSize: "cover",
      }}
    >
     

      {squares}
      {renderMovingPiece()}
      {renderCaptured()}
    </div>
  );
}
