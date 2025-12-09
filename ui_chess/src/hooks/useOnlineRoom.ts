// hooks/useOnlineRoom.ts
import { useEffect } from "react";
import { flushSync } from "react-dom";

export function useOnlineRoom({
  mode,
  socket,
  roomId,
  setConnected,
  setOnlineColor,
  setFen,
  setHistory,
  setHistoryIndex,
  setLastMove,
  lastLocalMoveIdRef,
  resetAnimation,
  isJoiningRef,
}) {
  useEffect(() => {
    if (mode !== "online" || !socket) return;

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    // ============================
    // JOIN ROOM
    // ============================
    const onRoomJoined = (payload) => {
      console.log("ROOM JOINED:", payload);

      isJoiningRef.current = true; // chỉ block CLICK, không block update

      flushSync(() => {
        resetAnimation?.();        // xoá animation cũ
        setOnlineColor(payload.color);

        setFen(payload.fen);
        setHistory(payload.history);
        setHistoryIndex(payload.historyIndex);
        setLastMove(payload.lastMove ?? null);
      });

      setTimeout(() => {
        isJoiningRef.current = false;
        console.log("✔ Cho phép click trở lại");
      }, 150);
    };

    // ============================
    // UPDATE TỪ NGƯỜI KHÁC
    // ============================
    const onGameUpdate = (payload) => {
      console.log("GAME UPDATE:", payload);

      // Nếu là nước của mình thì bỏ qua
      if (payload.moveId === lastLocalMoveIdRef.current) return;

      // ⭐ FIX: luôn phải reset animation khi sync nước mới
      resetAnimation?.();

      flushSync(() => {
        setFen(payload.fen);
        setHistory(payload.history);
        setHistoryIndex(payload.historyIndex);
        setLastMove(payload.lastMove ?? null);
      });
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("room:joined", onRoomJoined);
    socket.on("game:update", onGameUpdate);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("room:joined", onRoomJoined);
      socket.off("game:update", onGameUpdate);
    };
  }, [mode, socket, roomId]);
}
