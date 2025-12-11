// src/games/xiangqi/XiangqiOnlineLobby.tsx
import React, { useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import XiangqiGame from "./XiangqiGame"; // bản dùng board + turn từ props FEN

type Side = "red" | "black";
type PreferredSide = "red" | "black" | "any";

const socket: Socket = io("http://localhost:3001"); // sửa URL theo server của bạn

export default function XiangqiOnlineLobby() {
  const [rooms, setRooms] = useState<{ roomName: string; players: any }[]>([]);
  const [roomName, setRoomName] = useState("");
  const [inRoom, setInRoom] = useState(false);
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const [playerSide, setPlayerSide] = useState<Side | null>(null);
  const [fen, setFen] = useState<string | null>(null);
  const [turn, setTurn] = useState<Side>("red");
  const [preferredSide, setPreferredSide] = useState<PreferredSide>("any");

  // Lấy list phòng
  useEffect(() => {
    socket.emit("xiangqi:rooms:list");

    socket.on("xiangqi:rooms:list:response", (list) => {
      setRooms(list);
    });

    socket.on("xiangqi:room:joined", ({ roomName, side, fen, turn }) => {
      setCurrentRoom(roomName);
      setPlayerSide(side);
      setFen(fen);
      setTurn(turn);
      setInRoom(true);
    });

    socket.on("xiangqi:state", ({ fen, turn }) => {
      if (fen) setFen(fen);
      if (turn) setTurn(turn);
    });

    socket.on("xiangqi:move", ({ fen, turn }) => {
      if (fen) setFen(fen);
      if (turn) setTurn(turn);
    });

    return () => {
      socket.off("xiangqi:rooms:list:response");
      socket.off("xiangqi:room:joined");
      socket.off("xiangqi:state");
      socket.off("xiangqi:move");
    };
  }, []);

  const handleCreateRoom = () => {
    if (!roomName) return;
    socket.emit("xiangqi:room:create", { roomName });
  };

  const handleJoinRoom = (name: string) => {
    if (!name) return;
    socket.emit("xiangqi:room:join", {
      roomName: name,
      preferredSide,
    });
  };

  if (inRoom && fen) {
    return (
      <div>
        <div className="mb-2 text-center text-sm text-slate-300">
          Phòng: {currentRoom} – Bạn:{" "}
          {playerSide === "red" ? "ĐỎ" : playerSide === "black" ? "ĐEN" : "Khán giả"}
        </div>
        <XiangqiGame
          mode="online"
          socket={socket}
          roomName={currentRoom!}
          playerSide={playerSide}
          initialFen={fen}
          initialTurn={turn}
        />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto text-white">
      <h2 className="text-xl font-semibold mb-3 text-center">
        Cờ tướng online
      </h2>

      <div className="mb-4 flex gap-2 items-center">
        <input
          className="flex-1 px-2 py-1 rounded bg-slate-800 border border-slate-600"
          placeholder="Tên phòng..."
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
        />
        <button
          className="px-3 py-1 rounded bg-emerald-600"
          onClick={handleCreateRoom}
        >
          Tạo phòng
        </button>
      </div>

      <div className="mb-3">
        <span className="mr-2">Chọn màu khi vào:</span>
        <select
          className="px-2 py-1 rounded bg-slate-800 border border-slate-600"
          value={preferredSide}
          onChange={(e) => setPreferredSide(e.target.value as PreferredSide)}
        >
          <option value="any">Auto (bất kỳ)</option>
          <option value="red">Đỏ</option>
          <option value="black">Đen</option>
        </select>
      </div>

      <div>
        <h3 className="font-semibold mb-2">Danh sách phòng:</h3>
        {rooms.length === 0 && (
          <div className="text-sm text-slate-400">Chưa có phòng nào.</div>
        )}
        <ul className="space-y-2">
          {rooms.map((r) => (
            <li
              key={r.roomName}
              className="flex items-center justify-between bg-slate-800 px-3 py-2 rounded"
            >
              <div>
                <div className="font-medium">{r.roomName}</div>
                <div className="text-xs text-slate-400">
                  Đỏ: {r.players.red ? "có người" : "trống"} – Đen:{" "}
                  {r.players.black ? "có người" : "trống"}
                </div>
              </div>
              <button
                className="px-3 py-1 rounded bg-blue-600"
                onClick={() => handleJoinRoom(r.roomName)}
              >
                Vào phòng
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
