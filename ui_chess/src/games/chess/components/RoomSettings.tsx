// src/games/chess/components/RoomSettings.tsx
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

export function RoomSettings({
  showSettings,
  setShowSettings,
  mode,
  setMode,
  newRoomName,
  setNewRoomName,
  roomList,
  loadRooms,
  socket,
  setRoomId,
  resetBoardState,
}) {
  return (
    <Dialog open={showSettings} onOpenChange={setShowSettings}>
      <DialogContent className="bg-slate-900 text-white border border-slate-700 max-w-sm">
        <DialogHeader>
          <DialogTitle>⚙ Cài đặt</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* MODE SWITCH */}
     
			<div className="flex bg-slate-800 p-1 rounded-lg gap-1">
			  <button
				className={`flex-1 py-2 rounded ${
				  mode === "bot" ? "bg-slate-600 text-white" : "text-slate-400"
				}`}
				onClick={() => {
				  setMode("bot");
				  resetBoardState();
				  setRoomId("");
				}}
			  >
				🤖 BOT
			  </button>

			  <button
				className={`flex-1 py-2 rounded ${
				  mode === "botvsbot" ? "bg-slate-600 text-white" : "text-slate-400"
				}`}
				onClick={() => {
				  setMode("botvsbot");
				  resetBoardState();
				  setRoomId("");
				}}
			  >
				🤖🤖 BOT vs BOT
			  </button>

			  <button
				className={`flex-1 py-2 rounded ${
				  mode === "online" ? "bg-slate-600 text-white" : "text-slate-400"
				}`}
				onClick={() => setMode("online")}
			  >
				🌍 ONLINE
			  </button>
			</div>



          {mode === "online" && (
            <>
              <div>
                <div className="mb-1">Tên phòng</div>
                <Input
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  className="bg-slate-800 text-white"
                />
              </div>

              <Button
                className="w-full bg-green-700 hover:bg-green-600"
                onClick={() => {
                  if (!newRoomName.trim()) return alert("Nhập tên phòng!");
                  socket.emit("room:create", { name: newRoomName.trim() });
                }}
              >
                ➕ Tạo phòng
              </Button>

              <Button
                className="w-full bg-red-700 hover:bg-red-600"
                onClick={() => {
                  if (confirm("Xóa phòng trống?"))
                    socket.emit("rooms:clear");
                }}
              >
                🗑 Xóa phòng trống
              </Button>

              <Button
                className="w-full bg-blue-700 hover:bg-blue-600"
                onClick={loadRooms}
              >
                🔄 Tải danh sách
              </Button>

              <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                {roomList.length === 0 && (
                  <div className="text-center text-slate-400">Không có phòng</div>
                )}

                {roomList.map((room) => (
                  <div
                    key={room.roomName}
                    className="p-3 border border-slate-700 rounded flex justify-between"
                  >
                    <div>
                      <div className="text-sm font-semibold">{room.roomName}</div>
                      <div className="text-xs text-slate-400">Người chơi: {room.players}/2</div>
                    </div>

                    <Button
                      disabled={room.players >= 2}
                      onClick={() => {
                        setRoomId(room.roomName);
                        socket.emit("room:join", { roomName: room.roomName });
                        setShowSettings(false);
                      }}
                    >
                      Vào
                    </Button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
