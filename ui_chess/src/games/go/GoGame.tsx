// ======================================
// src/games/go/GoGame.tsx
// TEMPLATE — KHỞI TẠO ĐỂ KHÔNG LỖI APP
// ======================================

import React from "react";

export default function GoGame({ onExit }: { onExit: () => void }) {
  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center flex-col gap-4">
      <h1 className="text-3xl font-bold">Cờ Vây (Go)</h1>

      <p className="text-slate-400">
        Game đang phát triển... Vui lòng quay lại Menu.
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
