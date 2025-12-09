import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";

export function SettingsDialog({
  open,
  onClose,
  mode,
  setMode,
  roomId,
  setRoomId,
  socket,
  roomList,
  loadRooms,
  newRoomName,
  setNewRoomName,
}) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle>Cài đặt</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Toggle BOT / Online */}
          <div className="flex items-center justify-between bg-slate-800 p-3 rounded-md">
            <span className={mode === "bot" ? "text-green-400" : "text-slate-400"}>BOT</span>
            <Switch
              checked={mode === "online"}
              onCheckedChange={(v) => {
                setMode(v ? "online" : "bot");
                if (!v) setRoomId("");
              }}
            />
            <span className={mode === "online" ? "text-green-400" : "text-slate-400"}>ONLINE</span>
          </div>

          {mode === "online" && (
            <>
              <Input
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                placeholder="Tên phòng..."
              />

              <Button
                onClick={() => socket.emit("room:create", { name: newRoomName })}
                className="w-full bg-green-700"
              >
                ➕ Tạo phòng mới
              </Button>

              <Button onClick={loadRooms} className="w-full bg-blue-600">
                🔄 Tải danh sách phòng
              </Button>

              <div className="max-h-72 overflow-y-auto space-y-2">
                {roomList.map((r) => (
                  <div key={r.roomName} className="p-2 border rounded flex justify-between">
                    <span>{r.roomName} – {r.players}/2</span>
                    <Button onClick={() => socket.emit("room:join", { roomName: r.roomName })}>
                      Join
                    </Button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <Button onClick={onClose} className="mt-4 w-full">
          Đóng
        </Button>
      </DialogContent>
    </Dialog>
  );
}
