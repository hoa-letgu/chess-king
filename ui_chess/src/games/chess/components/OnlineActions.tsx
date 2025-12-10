// src/games/chess/components/OnlineActions.tsx
import { Button } from "@/components/ui/button";
import { showSuccess, showError } from "@/games/common/toast";


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
             showSuccess(
				"Đã gửi yêu cầu rời phòng",
				"Vui lòng chờ đối thủ phản hồi."
			  );
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
              showSuccess(
					"Đã gửi lời mời hòa",
					"Đang chờ đối thủ trả lời."
				  );
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
