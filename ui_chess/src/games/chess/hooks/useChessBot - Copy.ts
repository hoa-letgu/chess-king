// src/games/chess/hooks/useChessBot.ts
import { useEffect } from "react";
import { Chess } from "chess.js";
import { findBestMove } from "@/games/chess/utils/chessEngine";

export function useChessBot({
  mode,
  playerColor,
  botDepth,
  fen,
  game,
  history,
  historyIndex,
  setFen,
  setHistory,
  setHistoryIndex,
  botThinking,
  setBotThinking,
  setLastMove,
  isUndoingRef,   // ⭐ chống BOT đánh khi undo
  botPaused,      // ⭐ chống BOT đánh khi user pause
}) {
  useEffect(() => {
    // Không chạy nếu không phải chế độ BOT
    if (mode !== "bot") return;

    // ❌ Nếu vừa Undo/Redo → KHÔNG CHO BOT ĐÁNH
    if (isUndoingRef?.current) return;

    // ❌ Nếu user đang Pause BOT → DỪNG
    if (botPaused) return;

    // Load trạng thái mới nhất vào game
    game.load(fen);

    // Game kết thúc → không đánh nữa
    if (game.isGameOver()) return;

    const botColor = playerColor === "w" ? "b" : "w";

    // Không phải lượt BOT → không đánh
    if (game.turn() !== botColor) return;

    // BOT đang nghĩ → không cho chạy lần nữa
    if (botThinking) return;

    setBotThinking(true);

    const clone = new Chess(fen);

    setTimeout(() => {
      const depth = Math.min(botDepth, 2);
      const best = findBestMove(clone, depth);

      if (!best) {
        setBotThinking(false);
        return;
      }

      // ⚠ MUST: Chỉ move bằng {from,to}, không move nguyên object
      const moveResult = game.move({
        from: best.from,
        to: best.to,
      });

      if (!moveResult) {
        console.error("BOT tạo nước sai:", best);
        setBotThinking(false);
        return;
      }

      // ===== Tìm ô vua bị chiếu =====
      let kingSq = null;
      if (game.inCheck()) {
        const b = game.board();
        for (let r = 0; r < 8; r++) {
          for (let c = 0; c < 8; c++) {
            const p = b[r][c];
            if (p && p.type === "k" && p.color === game.turn()) {
              kingSq = "abcdefgh"[c] + (8 - r);
            }
          }
        }
      }

      setLastMove({
        from: moveResult.from,
        to: moveResult.to,
        inCheckSquare: kingSq,
        checkBy: kingSq
          ? {
              square: moveResult.to,
              piece:
                moveResult.color === "w"
                  ? moveResult.piece.toUpperCase()
                  : moveResult.piece,
            }
          : null,
      });

      // ====== THÊM FEN VÀO LỊCH SỬ ======
      const newFen = game.fen();
      const newHistory = [...history.slice(0, historyIndex + 1), newFen];

      setFen(newFen);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);

      setBotThinking(false);
    }, 150);
  }, [fen, botPaused]);
}
