import React, { useState, useEffect } from "react";
import type { Stone, Board } from "./utils/rules";
import { createBoard } from "./utils/rules";
import { scoreBoard } from "./utils/score";
import { boardToKey } from "./utils/boardKey";

import { GoBoard } from "./components/GoBoard";
import { useGoMove } from "./hooks/useGoMove";
import { useGoBot } from "./hooks/useGoBot"; // ⭐ THÊM

const SIZE = 19;

// ======================
// 🔥 CẤU HÌNH BOT
// ======================
const PLAYER_COLOR: Exclude<Stone, null> = "black";
const BOT_COLOR: Exclude<Stone, null> = "white";
// ======================

export default function GoGame({ onExit }: { onExit: () => void }) {
  const [board, setBoard] = useState<Board>(() => createBoard(SIZE));
  const [turn, setTurn] = useState<Exclude<Stone, null>>(PLAYER_COLOR);

  // KO history
  const [history, setHistory] = useState<string[]>([
    boardToKey(createBoard(SIZE)),
  ]);

  // pass + end game
  const [passCount, setPassCount] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  // ======================
  // 👤 NGƯỜI CHƠI
  // ======================
  const { handleClick } = useGoMove({
    board,
    turn,
    playerColor: PLAYER_COLOR, // ⭐ RẤT QUAN TRỌNG
    setBoard,
    setTurn,
    history,
    setHistory,
  });

  // ======================
  // 🤖 BOT
  // ======================
  useGoBot({
    enabled: !gameOver,
    board,
    turn,
    botColor: BOT_COLOR,
    setBoard,
    setTurn,
  });

  // 2 PASS → kết thúc ván
  useEffect(() => {
    if (passCount >= 2) setGameOver(true);
  }, [passCount]);

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center gap-4 p-4">
      <h1 className="text-xl font-bold">
        Cờ Vây – Lượt:{" "}
        {turn === "black" ? "⚫ Đen" : "⚪ Trắng"}
        {turn === BOT_COLOR && " (BOT đang suy nghĩ...)"}
      </h1>

      {/* BÀN CỜ */}
      <GoBoard board={board} onClick={handleClick} />

      {/* PASS */}
      {!gameOver && turn === PLAYER_COLOR && (
        <button
          onClick={() => {
            setPassCount(p => p + 1);
            setTurn(BOT_COLOR);
          }}
          className="px-4 py-2 bg-slate-700 rounded"
        >
          ⏭ PASS
        </button>
      )}

      {/* KẾT QUẢ */}
      {gameOver && (() => {
        const s = scoreBoard(board);
        return (
          <div className="bg-slate-800 p-4 rounded mt-4 w-full max-w-md">
            <h2 className="font-bold mb-2">🏁 KẾT QUẢ</h2>
            <p>⚫ Đen: {s.territoryBlack + s.stonesBlack}</p>
            <p>⚪ Trắng: {s.territoryWhite + s.stonesWhite}</p>
            <p className="mt-2 text-slate-400 text-sm">
              (Luật Trung Quốc – area scoring)
            </p>
          </div>
        );
      })()}

      <button
        onClick={onExit}
        className="px-4 py-2 bg-slate-700 rounded mt-4"
      >
        ◀ Thoát
      </button>
    </div>
  );
}
