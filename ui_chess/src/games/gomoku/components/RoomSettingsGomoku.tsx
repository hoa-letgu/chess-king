// src/games/gomoku/components/RoomSettingsGomoku.tsx
import React from "react";

type RoomInfo = {
  roomId: string;
  players: {
    black: boolean;
    white: boolean;
  };
};

export function RoomSettingsGomoku({
  showSettings,
  setShowSettings,
  setMode,
  setRoomId,
  roomList,
  loadRooms,
  newRoomName,
  setNewRoomName,
}: {
  showSettings: boolean;
  setShowSettings: (v: boolean) => void;
  setMode: (m: "bot" | "online") => void;
  setRoomId: (id: string) => void;
  roomList: RoomInfo[];
  loadRooms: () => void;
  newRoomName: string;
  setNewRoomName: (v: string) => void;
}) {
  if (!showSettings) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-slate-800 p-6 rounded-lg w-[420px]">
        <h2 className="text-lg font-bold mb-4">🎮 Chọn chế độ chơi</h2>

        {/* ===== BOT MODE ===== */}
        <button
          className="w-full mb-3 px-4 py-2 bg-green-600 rounded"
          onClick={() => {
            setMode("bot");
            setShowSettings(false);
          }}
        >
          🤖 Chơi với BOT
        </button>

        {/* ===== ONLINE MODE ===== */}
        <div className="mt-4">
          <h3 className="font-semibold mb-2">🌐 Phòng Online</h3>

          <button
            onClick={loadRooms}
            className="mb-2 px-3 py-1 bg-slate-600 rounded text-sm"
          >
            🔄 Tải danh sách phòng
          </button>

          {/* ===== ROOM LIST ===== */}
          <div className="max-h-48 overflow-y-auto border border-slate-600 rounded">
            {roomList.length === 0 && (
              <div className="text-slate-400 p-2 text-sm">
                Chưa có phòng nào
              </div>
            )}

            {roomList.map(room => {
              const full = room.players.black && room.players.white;

              return (
                <div
                  key={room.roomId}
                  className="flex items-center justify-between px-2 py-2 border-b border-slate-700"
                >
                  <div>
                    <div className="font-mono text-sm">
                      {room.roomId}
                    </div>
                    <div className="text-xs text-slate-400">
                      ⚫ {room.players.black ? "✔" : "—"} | ⚪{" "}
                      {room.players.white ? "✔" : "—"}
                    </div>
                  </div>

                  <button
                    disabled={full}
                    onClick={() => {
                      setMode("online");
                      setRoomId(room.roomId);
                      setShowSettings(false);
                    }}
                    className={`px-3 py-1 rounded text-sm ${
                      full
                        ? "bg-slate-600 cursor-not-allowed"
                        : "bg-blue-600"
                    }`}
                  >
                    {full ? "Đầy" : "Vào"}
                  </button>
                </div>
              );
            })}
          </div>

          {/* ===== CREATE ROOM ===== */}
          <div className="mt-3 flex gap-2">
            <input
              value={newRoomName}
              onChange={e => setNewRoomName(e.target.value)}
              placeholder="Tên phòng mới"
              className="flex-1 px-2 py-1 rounded bg-slate-700 text-sm"
            />
            <button
              onClick={() => {
                if (!newRoomName.trim()) return;
                setMode("online");
                setRoomId(newRoomName.trim());
                setShowSettings(false);
              }}
              className="px-3 py-1 bg-indigo-600 rounded text-sm"
            >
              Tạo
            </button>
          </div>
        </div>

        {/* ===== CLOSE ===== */}
        <button
          className="mt-4 w-full px-4 py-2 bg-slate-600 rounded"
          onClick={() => setShowSettings(false)}
        >
          Đóng
        </button>
      </div>
    </div>
  );
}
