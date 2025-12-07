// hooks/useChessBot.ts
import { useEffect } from "react";
import { Chess } from "chess.js";
import { findBestMove } from "@/utils/chessEngine";

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
}) {
  useEffect(() => {
    if (mode !== "bot") return;

    game.load(fen);

    if (game.isGameOver()) return;

    const botColor = playerColor === "w" ? "b" : "w";
    if (game.turn() !== botColor) return;
    if (botThinking) return;

    setBotThinking(true);

    const clone = new Chess(fen);

    setTimeout(() => {
      const best = findBestMove(clone, Math.min(botDepth, 2));
      console.log("BOT MOVE = ", best);

      if (!best) {
        setBotThinking(false);
        return;
      }

      // Thực hiện nước đi
      game.move(best);

      // ================================
      // ⭐ Xác định ô vua bị chiếu
      // ================================
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

      // ================================
      // ⭐ Gửi thông tin lastMove cho UI
      // ================================
      setLastMove({
        from: best.from,
        to: best.to,
        inCheckSquare: kingSq ?? null,
        checkBy: kingSq
          ? {
              square: best.to,
              piece:
                clone.get(best.from).color === "w"
                  ? clone.get(best.from).type.toUpperCase()
                  : clone.get(best.from).type,
            }
          : null,
      });

      // cập nhật fen
      const newFen = game.fen();
      const newHistory = [...history.slice(0, historyIndex + 1), newFen];

      setFen(newFen);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);

      setBotThinking(false);
    }, 200);
  }, [fen]);
}
