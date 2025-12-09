// src/components/OnlineActions.tsx
import { Button } from "@/components/ui/button";

export function OnlineActions({
  mode,
  roomId,
  gameFinished,
  history,
  socket,
  setPopup,
}) {
  if (mode !== "online" || !roomId) return null;

  return (
    <>
      {/* Thoát phòng */}
      {!gameFinished && (
        <button
          onClick={() => {
            setPopup({
              type: "info",
              message: "Đã gửi yêu cầu rời phòng…",
              onAccept: () => setPopup({ type: null }),
            });
            socket.emit("room:leave:request", { roomName: roomId });
          }}
          className="fixed bottom-6 right-24 w-14 h-14 rounded-full bg-red-700 hover:bg-red-600 shadow-lg flex items-center justify-center text-white text-xl"
        >
          🚪
        </button>
      )}

      {/* Cầu hòa */}
      {!gameFinished && history.length > 1 && (
        <button
          onClick={() => {
            setPopup({
              type: "info",
              message: "Đã gửi lời mời hòa…",
              onAccept: () => setPopup({ type: null }),
            });
            socket.emit("draw:offer", { roomName: roomId });
          }}
          className="fixed bottom-6 right-44 w-14 h-14 rounded-full bg-yellow-700 hover:bg-yellow-600 shadow-lg flex items-center justify-center text-white text-xl"
        >
          🤝
        </button>
      )}
    </>
  );
}
