// src/games/chess/hooks/usePlayerMove.ts
import { useState } from "react";
import { Chess } from "chess.js";
import { getMovePath, findKingInCheck } from "@/games/chess/utils/chessHelpers";

export function usePlayerMove({
  fen,
  gameRef,
  history,
  historyIndex,
  pushState,
  mode,
  playerColor,
  onlineColor,
  setLastMove,
  onMoveApplied,
  setIsAnimating,   // ⭐ Thêm mới
  isJoiningRef,

}) {
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [legalTargets, setLegalTargets] = useState<string[]>([]);
  const [movingPiece, setMovingPiece] = useState<any>(null);
  const [movingPath, setMovingPath] = useState<any[]>([]);
  const [movingStep, setMovingStep] = useState(0);
  const [hidePiece, setHidePiece] = useState<string | null>(null);

  // ===============================
  // CLICK XỬ LÝ NƯỚC ĐI
  // ===============================
  const resetAnimation = () => {
	  setMovingPiece(null);
	  setMovingPath([]);
	  setMovingStep(0);
	  setHidePiece(null);
	  setIsAnimating(false);
	};
  const handleSquareClick = (square: string) => {
	if (isJoiningRef.current) {
      console.log("⛔ Đang join – bỏ click");
      return;
    }
    const game = gameRef.current;
    game.load(fen);
	

    if (game.isGameOver()) return;

    // BOT mode
    if (mode === "bot" && game.turn() !== playerColor) return;

    // ONLINE mode
    if (mode === "online") {
      if (!onlineColor) return; 
      if (game.turn() !== onlineColor) return;
    }

    // —— chọn quân lần đầu
    if (!selectedSquare) {
      const piece = game.get(square);
      if (!piece || piece.color !== game.turn()) return;

      setSelectedSquare(square);

      const moves = game.moves({ square, verbose: true });
      setLegalTargets(moves.map((m) => m.to));
      return;
    }

    // —— xử lý khi chọn ô đến
    const from = selectedSquare;
    const to = square;

    const moves = game.moves({ square: from, verbose: true });
    const move = moves.find((m) => m.to === to);

    if (!move) {
      setSelectedSquare(null);
      setLegalTargets([]);
      return;
    }

    const piece = game.get(from);
    let promotion: string | undefined = undefined;

    if (piece.type === "p" && (to[1] === "1" || to[1] === "8"))
      promotion = "q";

    // ==========================
    // ⭐ START ANIMATION
    // ==========================
    setIsAnimating(true);     // ⭐ NGĂN FEN SYNC gây giật quân

    // —— Animation path
    const movingPieceKey =
      piece.color === "w" ? piece.type.toUpperCase() : piece.type;

    const path = getMovePath(from, to);
    setMovingPath(path);
    setMovingStep(0);

    setHidePiece(from);
    setMovingPiece({ piece: movingPieceKey, from, to });

    // chạy từng bước animation
    let i = 0;
    const timer = setInterval(() => {
      i++;
      if (i >= path.length) {
        clearInterval(timer);
      } else {
        setMovingStep(i);
      }
    }, 55);

    // —— reset UI click
    setSelectedSquare(null);
    setLegalTargets([]);

    // ==========================
    // ⭐ END ANIMATION → thực hiện nước đi
    // ==========================
    const totalDelay = path.length * 55 + 50;

    setTimeout(() => {
      const newGame = new Chess(fen);
      const made = newGame.move({ from, to, promotion });

      if (!made) {
        setMovingPiece(null);
        setHidePiece(null);
        setIsAnimating(false);     // ⭐ Cho phép sync FEN lại
        return;
      }

      // —— vua bị chiếu?
      const kingSq = findKingInCheck(newGame);
      setLastMove({ from, to, inCheckSquare: kingSq, color: piece.color });

      const newFen = newGame.fen();
      const newHistory = [...history.slice(0, historyIndex + 1), newFen];
		
		// cập nhật luôn gameRef
       gameRef.current = newGame;

      // —— PUSH STATE (đồng bộ online)
      pushState(newFen, newHistory, newHistory.length - 1, true, { from, to });

      // —— callback checkmate/draw
      onMoveApplied?.(newGame);

      // xoá animation
      setMovingPiece(null);
      setHidePiece(null);
      setIsAnimating(false);    // ⭐ Cho phép sync FEN → board cập nhật đúng
    }, totalDelay);
  };

  return {
    selectedSquare,
    legalTargets,
    movingPiece,
    movingPath,
    movingStep,
    hidePiece,
    handleSquareClick,
	resetAnimation
  };
}
