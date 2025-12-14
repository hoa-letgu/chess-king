import React from "react";
import type { Board } from "../utils/rules";

const BOARD_IMG = "/go/goboard.jpg";
const BLACK_IMG = "/go/black.png";
const WHITE_IMG = "/go/white.png";

/* ============================== */
const IMAGE_SIZE = 1020;   // hệ tọa độ gốc
const RENDER_SIZE = 600;   // 🔥 size hiển thị
const GRID_SIZE = 19;
const GRID_MARGIN = 37;
const STONE_SCALE = 0.98;
const DEBUG_GRID = true;
/* ============================== */

export function GoBoard({
  board,
  onClick,
}: {
  board: Board;
  onClick: (r: number, c: number) => void;
}) {
  const STEP = (IMAGE_SIZE - GRID_MARGIN * 2) / (GRID_SIZE - 1);
  const STONE = STEP * STONE_SCALE;
  const HIT = STEP * 0.9;

  const SCALE = RENDER_SIZE / IMAGE_SIZE;

  const toPx = (r: number, c: number) => ({
    x: GRID_MARGIN + c * STEP,
    y: GRID_MARGIN + r * STEP,
  });

  return (
    <div
      style={{
        width: RENDER_SIZE,
        height: RENDER_SIZE,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* SCALE WRAPPER */}
      <div
        style={{
          transform: `scale(${SCALE})`,
          transformOrigin: "top left",
          width: IMAGE_SIZE,
          height: IMAGE_SIZE,
          position: "relative",
        }}
      >
        {/* BOARD IMAGE */}
        <img
          src={BOARD_IMG}
          draggable={false}
          className="absolute inset-0 w-full h-full"
        />

       

        {/* STONES */}
        {board.map((row, r) =>
          row.map((cell, c) => {
            if (!cell) return null;
            const { x, y } = toPx(r, c);
            return (
              <img
                key={`s-${r}-${c}`}
                src={cell === "black" ? BLACK_IMG : WHITE_IMG}
                className="absolute pointer-events-none"
                style={{
                  width: STONE,
                  height: STONE,
                  left: x - STONE / 2,
                  top: y - STONE / 2,
                }}
              />
            );
          })
        )}

        {/* HITBOX */}
        {Array.from({ length: GRID_SIZE }).map((_, r) =>
          Array.from({ length: GRID_SIZE }).map((__, c) => {
            const { x, y } = toPx(r, c);
            return (
              <button
                key={`hit-${r}-${c}`}
                className="absolute bg-transparent"
                style={{
                  width: HIT,
                  height: HIT,
                  left: x - HIT / 2,
                  top: y - HIT / 2,
                  cursor: "pointer",
                }}
                onClick={() => onClick(r, c)}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
