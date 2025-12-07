// hooks/useOnlineRoom.ts
import { useEffect } from "react";

export function useOnlineRoom({
  mode,
  socket,
  roomId,
  setConnected,
  setOnlineColor,
  setFen,
  setHistory,
  setHistoryIndex,
  setLastMove,      // ⭐ THÊM VÀO ĐÂY
  resetBoard,
}) {
  useEffect(() => {
    if (mode !== "online") return;
    if (!socket) return;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    socket.on("room:joined", (payload) => {
      setOnlineColor(payload.color);
      if (payload.fen) {
        setFen(payload.fen);
        setHistory(payload.history);
        setHistoryIndex(payload.historyIndex);
      }
    });

    socket.on("game:update", (payload) => {
      setFen(payload.fen);
      setHistory(payload.history);
      setHistoryIndex(payload.historyIndex);

      // ⭐⭐ NHẬN lastMove TỪ SERVER – HIGHLIGHT NƯỚC CỦA ĐỐI THỦ
      if (payload.lastMove) {
        setLastMove(payload.lastMove);
      }

      resetBoard();
    });

    // ⭐ Cleanup tránh listener bị lặp khi re-render
    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("room:joined");
      socket.off("game:update");
    };

  }, [mode, socket, roomId]);
}
