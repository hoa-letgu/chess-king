// src/App.tsx
import React, { useState } from "react";
import ChessGame from "@/games/chess/ChessGame";
import XiangqiGame from "@/games/xiangqi/XiangqiGame";
import GoGame from "@/games/go/GoGame";
import GomokuGame from "@/games/gomoku/GomokuGame";

export default function App() {
  const [game, setGame] = useState<null | string>(null);

  const renderGame = () => {
    switch (game) {
      case "chess":
        return <ChessGame onExit={() => setGame(null)} />;
      case "xiangqi":
        return <XiangqiGame onExit={() => setGame(null)} />;
      case "go":
        return <GoGame onExit={() => setGame(null)} />;
      case "gomoku":
        return <GomokuGame onExit={() => setGame(null)} />;
      default:
        return null;
    }
  };

  if (game) return renderGame();

  // MENU CHỌN GAME
  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center gap-6">
      <h1 className="text-3xl font-bold mb-4">Chọn trò chơi</h1>

      <button className="px-6 py-3 bg-blue-700 rounded" onClick={() => setGame("chess")}>
        ♟ Cờ vua
      </button>

      <button className="px-6 py-3 bg-red-700 rounded" onClick={() => setGame("xiangqi")}>
        ♜ Cờ tướng
      </button>

      <button className="px-6 py-3 bg-green-700 rounded" onClick={() => setGame("go")}>
        ⚪⚫ Cờ vây
      </button>

      <button className="px-6 py-3 bg-yellow-600 rounded" onClick={() => setGame("gomoku")}>
        ✖ Caro (Gomoku)
      </button>
    </div>
  );
}
