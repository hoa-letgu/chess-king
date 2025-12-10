// ======================================
// src/games/gomoku/GomokuGame.tsx
// TEMPLATE — KHỞI TẠO CHƠI CARO
// ======================================

import React from "react";

export default function GomokuGame({ onExit }: { onExit: () => void }) {
  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center flex-col gap-4">
      <h1 className="text-3xl font-bold">Caro (Gomoku)</h1>

      <p className="text-slate-400">
        Game đang phát triển... Bấm thoát để quay lại Menu.
      </p>

      <button
        onClick={onExit}
        className="px-4 py-2 bg-slate-700 rounded border border-slate-500"
      >
        ◀ Thoát ra menu
      </button>
    </div>
  );
}
