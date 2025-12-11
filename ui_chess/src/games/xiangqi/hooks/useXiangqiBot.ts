// src/games/xiangqi/hooks/useXiangqiBot.ts
import { useEffect } from "react";
import { findBestBotMove } from "../utils/xiangqiBotEngine";
import type { XiangqiPieceKey } from "../utils/pieces";

type Side = "red" | "black";
type Board = (XiangqiPieceKey | null | "")[][];

export function useXiangqiBot({
  mode,
  board,
  turn,
  botSide,
  onBotMove,
  botThinking,
  setBotThinking,
  historyKeys,
  pausedAfterUndo,      // ⭐ BOT sẽ dừng sau undo / redo
  depth = 3,
}: {
  mode: "human" | "bot";
  board: Board;
  turn: Side;
  botSide: Side;

  onBotMove: (move: {
    from: string;
    to: string;
    piece: XiangqiPieceKey;
    capture: XiangqiPieceKey | null;
    check?: boolean;
  }) => void;

  botThinking: boolean;
  setBotThinking: (v: boolean) => void;

  historyKeys: string[];
  pausedAfterUndo: boolean;
  depth?: number;
}) {

  useEffect(() => {
    // ================================
    // 1) Không phải chế độ BOT → thoát
    // ================================
    if (mode !== "bot") return;

    // ================================
    // 2) Không tới lượt BOT → thoát
    // ================================
    if (turn !== botSide) return;

    // ================================
    // 3) Sau Undo / Redo → BOT PHẢI DỪNG LẠI
    //    Chỉ khi bấm "Tiếp tục" thì bật pausedAfterUndo = false
    // ================================
    if (pausedAfterUndo) return;

    // ================================
    // 4) BOT đang nghĩ rồi → thoát
    // ================================
    if (botThinking) return;

    // ================================
    // 5) Bắt đầu suy nghĩ
    // ================================
    setBotThinking(true);

    setTimeout(() => {
      const best = findBestBotMove(board, botSide, historyKeys, depth);

      if (!best) {
        console.log("BOT không có nước đi.");
        setBotThinking(false);
        return;
      }

      // BOT đánh
      onBotMove(best);

      setBotThinking(false);

    }, 150); // delay nhẹ cho tự nhiên
  }, [
    board,
    turn,
    mode,
    botSide,
    botThinking,
    pausedAfterUndo,  // ⭐ thêm vào dependency list
    historyKeys,
    depth
  ]);
}
