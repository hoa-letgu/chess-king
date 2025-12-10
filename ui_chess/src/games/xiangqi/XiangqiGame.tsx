// ======================================
// src/games/xiangqi/XiangqiGame.tsx
// TEMPLATE TỐI THIỂU — KHÔNG LỖI IMPORT
// ======================================

import React from "react";

export default function XiangqiGame({ onExit }: { onExit: () => void }) {
  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center flex-col gap-4">
      <h1 className="text-3xl font-bold">Cờ Tướng (Xiangqi)</h1>

      <p className="text-slate-400">
        Game đang phát triển... Bạn có thể bấm thoát để quay lại Menu.
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
