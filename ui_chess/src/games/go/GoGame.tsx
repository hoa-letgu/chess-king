import React, { useEffect, useState } from "react";
import type { Stone } from "./utils/rules";
import {
  createInitialState,
  applyMove,
  type GoState,
} from "./engine/goEngine";
import { thinkBotMove } from "./bot/goBot";

import { GoBoard } from "./components/GoBoard";
import { RoomSettingsGo } from "./components/RoomSettingsGo";
import { PopupModal } from "@/games/go/components/PopupModal";
import { useSocket } from "@/context/SocketProvider";

const SIZE = 19;

export default function GoGame({ onExit }: { onExit: () => void }) {
  const socket = useSocket();

  // ================= MODE =================
  const [mode, setMode] = useState<"bot" | "online" | null>(null);
  const [showSettings, setShowSettings] = useState(true);

  // ================= GAME STATE =================
  const [state, setState] = useState<GoState>(() =>
    createInitialState(SIZE)
  );
  const { board, turn } = state;

  // ================= ONLINE =================
  const [roomId, setRoomId] = useState("");
  const [playerColor, setPlayerColor] =
    useState<Exclude<Stone, null>>("black");
  const [roomList, setRoomList] = useState<any[]>([]);
  const [newRoomName, setNewRoomName] = useState("");

  // ================= UI =================
  const [popup, setPopup] = useState<any>({ type: null });

  // ================= RESET =================
  const resetGame = () => {
    setState(createInitialState(SIZE));
  };

  // ================= LOCAL MOVE (BOT / OFFLINE) =================
  const handleLocalMove = (r: number, c: number) => {
    if (mode !== "bot") return;
    if (turn !== "black") return;

    const res = applyMove(state, r, c);
    if (res.ok) setState(res.state);
  };

  // ================= ONLINE MOVE =================
  const handleOnlineMove = (r: number, c: number) => {
    if (mode !== "online") return;
    if (!socket || !roomId) return;
    if (turn !== playerColor) return;

    socket.emit("go:move", { roomId, r, c });
  };

  // ================= BOT MOVE =================
  useEffect(() => {
    if (mode !== "bot") return;
    if (turn !== "white") return;

    const t = setTimeout(() => {
      const move = thinkBotMove(state);
      if (!move) return;

      const res = applyMove(state, move[0], move[1]);
      if (res.ok) setState(res.state);
    }, 250);

    return () => clearTimeout(t);
  }, [turn, state, mode]);

  // ================= SOCKET =================
  useEffect(() => {
    if (!socket) return;

    socket.on("go:rooms:list:response", setRoomList);

    socket.on("go:room:joined", ({ seat, state }) => {
      setRoomId(state.roomId);
      setPlayerColor(seat);
      setState(state);
      setShowSettings(false);
      setMode("online");
    });

    socket.on("go:state", (state: GoState) => {
      setState(state);
    });

    socket.on("go:player_left", () => {
      setPopup({
        type: "info",
        message: "Đối thủ đã rời phòng. Bạn thắng!",
        onAccept: () => {
          setPopup({ type: null });
          setMode(null);
          setRoomId("");
          resetGame();
          setShowSettings(true);
        },
      });
    });
  socket.on("go:room:closed", ({ message }) => {
    setPopup({
      type: "info",
      message,
      onAccept: () => {
        setPopup({ type: null });
        setMode(null);           // quay về chọn chế độ
        setRoomId("");
        resetGame();
        setShowSettings(true);   // hiện lại chọn phòng
      },
    });
  });

    return () => {
      socket.off("go:rooms:list:response");
      socket.off("go:room:joined");
      socket.off("go:state");
      socket.off("go:player_left");
	  socket.off("go:room:closed");
    };
  }, [socket]);

  // ================= RENDER =================
  return (
    <div className="min-h-screen bg-slate-900 text-white p-4">
      <h1 className="text-xl font-bold mb-2">
        Cờ Vây –{" "}
        {mode === "bot"
          ? "🤖 BOT"
          : mode === "online"
          ? "🌐 ONLINE"
          : "—"}{" "}
        – {turn === "black" ? "⚫ Đen" : "⚪ Trắng"}
      </h1>

      <GoBoard
        board={board}
        onClick={mode === "online" ? handleOnlineMove : handleLocalMove}
      />

      <div className="flex gap-3 mt-4">
        <button
          onClick={resetGame}
          className="px-4 py-2 bg-slate-700 rounded"
        >
          🔄 Reset
        </button>

        <button
          onClick={onExit}
          className="px-4 py-2 bg-slate-700 rounded"
        >
          ◀ Thoát
        </button>
      </div>

      {/* ============ SETTINGS / ROOMS ============ */}
      <RoomSettingsGo
        showSettings={showSettings}
        setShowSettings={setShowSettings}
        mode={mode}
        setMode={setMode}
        newRoomName={newRoomName}
        setNewRoomName={setNewRoomName}
        roomList={roomList}
        loadRooms={() => socket?.emit("go:rooms:list")}
        socket={socket}
        setRoomId={setRoomId}
        resetBoardState={resetGame}
        isPlaying={!!mode}
      />

      {/* ============ POPUP ============ */}
      <PopupModal popup={popup} setPopup={setPopup} />
    </div>
  );
}
