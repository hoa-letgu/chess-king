//src\games\gomoku\components\GomokuBoard.tsx
import React from "react";
import type { Pos } from "../utils/checkWin";

type Cell = "X" | "O" | null;

type Props = {
  board: Cell[][];
  onMove: (r: number, c: number) => void;
  winnerLine: Pos[] | null;
};

const CELL_SIZE = 40; // 👈 dễ chỉnh

export function GomokuBoard({ board, onMove, winnerLine }: Props) {
  const rows = board.length;
  const cols = board[0].length;

  return (
    <div
      className="relative select-none"
      style={{
        width: cols * CELL_SIZE,
        height: rows * CELL_SIZE,
        background: "#caa472",
      }}
    >
      {/* GRID */}
      <div
        className="absolute inset-0 grid"
        style={{
          gridTemplateRows: `repeat(${rows}, ${CELL_SIZE}px)`,
          gridTemplateColumns: `repeat(${cols}, ${CELL_SIZE}px)`,
        }}
      >
        {board.map((row, r) =>
          row.map((cell, c) => (
            <div
              key={`${r}-${c}`}
              onClick={() => onMove(r, c)}
              className="flex items-center justify-center cursor-pointer"
              style={{
                border: "1px solid rgba(0,0,0,0.4)", // 👈 HIỆN ĐƯỜNG KẺ
                fontSize: 26,
                fontWeight: "bold",
                color: cell === "X" ? "#111" : "#e11d48",
              }}
            >
              {cell}
            </div>
          ))
        )}
      </div>

     {/* WIN LINE */}
		{winnerLine && (() => {
		  const winnerCell = board[winnerLine[0].r][winnerLine[0].c];
		  if (!winnerCell) return null;

		  const strokeColor =
			winnerCell === "X" ? "#111" : "#e11d48";

		  return (
			<svg
			  className="absolute inset-0 pointer-events-none"
			  width={cols * CELL_SIZE}
			  height={rows * CELL_SIZE}
			>
			  <line
				x1={winnerLine[0].c * CELL_SIZE + CELL_SIZE / 2}
				y1={winnerLine[0].r * CELL_SIZE + CELL_SIZE / 2}
				x2={
				  winnerLine[winnerLine.length - 1].c * CELL_SIZE +
				  CELL_SIZE / 2
				}
				y2={
				  winnerLine[winnerLine.length - 1].r * CELL_SIZE +
				  CELL_SIZE / 2
				}
				stroke={strokeColor}
				strokeWidth={5}
				strokeLinecap="round"
			  />
			</svg>
		  );
		})()}

    </div>
  );
}
