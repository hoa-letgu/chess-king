// src/games/gomoku/GomokuGame.tsx
import React, { useState, useEffect } from "react";
import { GomokuBoard } from "./components/GomokuBoard";
import { RoomSettingsGomoku } from "./components/RoomSettingsGomoku";
import { PopupModal } from "./components/PopupModal";
import { ROWS, COLS } from "./utils/constants";
import { checkWin, type Pos } from "./utils/checkWin";
import { useGomokuBot } from "./hooks/useGomokuBot";
import { useGomokuOnline } from "./hooks/useGomokuOnline";
import { useSocket } from "@/context/SocketProvider";

type Cell = "X" | "O" | null;

/* ================= UTIL ================= */
function createBoard(): Cell[][] {
  return Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => null)
  );
}

/* ================= COMPONENT ================= */
export default function GomokuGame() {
  const socket = useSocket();

  /* ===== GAME STATE ===== */
  const [board, setBoard] = useState<Cell[][]>(createBoard);
  const [turn, setTurn] = useState<Cell>("X");
  const [winner, setWinner] = useState<Cell | null>(null);
  const [winnerLine, setWinnerLine] = useState<Pos[] | null>(null);

  /* ===== ONLINE STATE ===== */
  const [seat, setSeat] = useState<Cell | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [roomReady, setRoomReady] = useState(false);

  /* ===== MODE ===== */
  const [mode, setMode] = useState<"bot" | "online" | null>(null);
  const [showSettings, setShowSettings] = useState(true);

  /* ===== ROOM UI ===== */
  const [newRoomName, setNewRoomName] = useState("");
  const [roomList, setRoomList] = useState<any[]>([]);

  /* ===== POPUP ===== */
  const [popup, setPopup] = useState<any>({ type: null });

  /* ================= MOVE HANDLER ================= */
  const handleMove = (r: number, c: number) => {
    if (winner) return;
    if (board[r][c]) return;

    /* ===== ONLINE MODE ===== */
    if (mode === "online") {
      if (!roomReady) return;           // ⭐ CHƯA ĐỦ 2 NGƯỜI
      if (seat !== turn) return;        // ⭐ KHÔNG PHẢI LƯỢT MÌNH

      socket.emit("gomoku:move", { roomId, r, c });
      return;
    }

    /* ===== LOCAL / BOT ===== */
    const next = board.map(row => [...row]);
    next[r][c] = turn;

    const winLine = checkWin(next, r, c);
    if (winLine) {
      setWinner(turn);
      setWinnerLine(winLine);
    }

    setBoard(next);
    setTurn(turn === "X" ? "O" : "X");
  };

  /* ================= RESET ================= */
  const resetGame = () => {
    setBoard(createBoard());
    setTurn("X");
    setWinner(null);
    setWinnerLine(null);
  };

  /* ================= BOT ================= */
  useGomokuBot({
    enabled: mode === "bot",
    board,
    turn,
    winner,
    onMove: handleMove,
  });

  /* ================= ONLINE ================= */
  useGomokuOnline({
    enabled: mode === "online",
    socket,
    roomId,
    setBoard,
    setTurn,
    setWinner,
    setPopup,
    setSeat,
    setRoomReady, // ⭐ NHẬN READY TỪ SERVER
	resetGame: resetAll,
  });

  /* ================= LOAD ROOM LIST ================= */
  useEffect(() => {
    if (!socket) return;

    const onRooms = (list: any[]) => {
      setRoomList(list);
    };

    socket.on("gomoku:rooms:list:response", onRooms);

    return () => {
      socket.off("gomoku:rooms:list:response", onRooms);
    };
  }, [socket]);
  
  function resetAll() {
  setBoard(createBoard());
  setTurn("X");
  setWinner(null);
  setWinnerLine(null);

  setSeat(null);
  setRoomId(null);
  setRoomReady(false);

  setMode(null);
  setShowSettings(true);
}

  

  /* ================= UI ================= */
  return (
    <div className="min-h-screen bg-slate-900 text-white p-4">
      <h1 className="text-xl font-bold mb-2">
        Cờ Caro –{" "}
        {winner
          ? `🏆 ${winner} thắng`
          : mode === "online" && !roomReady
          ? "⏳ Chờ người chơi thứ 2..."
          : `Lượt: ${turn}`}
      </h1>

      <GomokuBoard
        board={board}
        onMove={handleMove}
        winnerLine={winnerLine}
      />

      {/* ===== RESET ===== */}
      <button
        onClick={resetGame}
        className="mt-4 px-4 py-2 bg-slate-700 rounded"
      >
        🔄 Reset
      </button>
	  {mode === "online" && (
		  <button
			onClick={() => {
			  socket.emit("gomoku:room:leave", { roomId });
			  resetAll();
			}}
			className="mt-2 px-4 py-2 bg-red-600 rounded"
		  >
			🚪 Thoát phòng
		  </button>
		)}


      {/* ===== MODE / ROOM SETTINGS ===== */}
      <RoomSettingsGomoku
        showSettings={showSettings}
        setShowSettings={setShowSettings}
        setMode={setMode}
        setRoomId={setRoomId}
        roomList={roomList}
        loadRooms={() => socket?.emit("gomoku:rooms:list")}
        newRoomName={newRoomName}
        setNewRoomName={setNewRoomName}
      />

      {/* ===== POPUP ===== */}
      <PopupModal popup={popup} setPopup={setPopup} />
    </div>
  );
}
