import React, { useState, useEffect } from "react";
import { XiangqiBoard } from "./components/XiangqiBoard";
import { useXiangqiMove } from "./hooks/useXiangqiMove";
import { useXiangqiBot } from "./hooks/useXiangqiBot";
import { initialBoard } from "./utils/initialBoard";
import { squareToCoord, generateAllMoves } from "./utils/rules";
import { isInCheck } from "./utils/isInCheck";
import { boardToKey } from "./utils/xiangqiBotEngine";
import type { XiangqiPieceKey } from "./utils/pieces";

type Side = "red" | "black";

export default function XiangqiGame() {
  const [board, setBoard] = useState(initialBoard);
  const [turn, setTurn] = useState<Side>("red");

  const [mode, setMode] = useState<"human" | "bot">("bot");
  const botSide: Side = "black";

  const [botThinking, setBotThinking] = useState(false);

  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [checkStatus, setCheckStatus] = useState<string>("");
  const [gameResult, setGameResult] = useState<string>("");

  // ============ UNDO / REDO HISTORY ============
  const [history, setHistory] = useState([
    { board: initialBoard, turn: "red", lastMove: null }
  ]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // BOT dừng sau undo
  const [pausedAfterUndo, setPausedAfterUndo] = useState(false);

  // historyKeys để kiểm tra hòa lặp lại
  const [historyKeys, setHistoryKeys] = useState<string[]>([
    boardToKey(initialBoard, "red"),
  ]);

  // Animation state
  const [movingPiece, setMovingPiece] = useState<{
    piece: XiangqiPieceKey;
    from: string;
    to: string;
  } | null>(null);
  const [movingSquare, setMovingSquare] = useState<string | null>(null);
  const [hideSquare, setHideSquare] = useState<string | null>(null);

  // ============================================
  // SAFE SET BOARD
  // ============================================
  function safeSetBoard(b) {
    if (!Array.isArray(b) || b.length !== 10) {
      console.error("Invalid board!", b);
      return;
    }
    for (let r = 0; r < 10; r++) {
      if (!Array.isArray(b[r]) || b[r].length !== 9) {
        console.error("Invalid board row:", r, b[r]);
        return;
      }
    }
    setBoard(b);
  }
 // ============================================
  // UNDO
  // ============================================
const handleUndo = () => {
  setHistoryIndex(prev => {
    const newIndex = prev - 1;
    if (newIndex < 0) return prev;

    const state = history[newIndex];
    if (!state) return prev;

    safeSetBoard(state.board);
    setTurn(state.turn);
    setLastMove(state.lastMove);
    setPausedAfterUndo(true);

    return newIndex;
  });
};



  // ============================================
  // REDO
  // ============================================
const handleRedo = () => {
  setHistoryIndex(prev => {
    const newIndex = prev + 1;
    if (newIndex >= history.length) return prev;

    const state = history[newIndex];
    if (!state) return prev;

    safeSetBoard(state.board);
    setTurn(state.turn);
    setLastMove(state.lastMove);
    setPausedAfterUndo(true);

    return newIndex;
  });
};
  // ============================================
  // APPLY MOVE (ANIMATION + UPDATE STATE)
  // ============================================
const applyMove = ({ from, to, piece, capture, check }) => {
  setMovingPiece({ piece, from, to });
  setMovingSquare(from);
  setHideSquare(from);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      setMovingSquare(to);
    });
  });

  setTimeout(() => {
    let newBoardRef = null;

    setBoard((prevBoard) => {
      const b = prevBoard.map((row) => [...row]);
      const [r1, c1] = squareToCoord(from);
      const [r2, c2] = squareToCoord(to);

      b[r2][c2] = piece;
      b[r1][c1] = null;

      newBoardRef = b;
      return b;
    });

    const nextTurn = turn === "red" ? "black" : "red";

    setLastMove({ from, to });
    setCheckStatus(check ? "Chiếu!" : "");
    setHideSquare(null);
    setMovingPiece(null);
    setMovingSquare(null);

    // ============================
    // FIX: lưu history ĐÚNG CÁCH
    // ============================
    setHistory((prev) => {
      const newState = {
        board: newBoardRef,
        turn: nextTurn,
        lastMove: { from, to }
      };

      const newList = prev.slice(0, historyIndex + 1);
      newList.push(newState);

      // cập nhật index đúng
      setHistoryIndex(newList.length - 1);

      return newList;
    });

    setHistoryKeys(prev => [...prev, boardToKey(newBoardRef, nextTurn)]);
    setTurn(nextTurn);
  }, 220);
};



 



  // ============================================
  // HOOK NGƯỜI CHƠI
  // ============================================
  const { selectedSquare, legalTargets, handleClick } = useXiangqiMove({
    board,
    currentTurn: turn,
    onMoveApplied: applyMove,
  });

  // ============================================
  // HOOK BOT
  // ============================================
  useXiangqiBot({
    mode,
    board,
    turn,
    botSide,
    botThinking,
    setBotThinking,
    onBotMove: applyMove,
    historyKeys,
    depth: 3,
    pausedAfterUndo,
  });

  // ============================================
  // KIỂM TRA CHECK / MATE / HÒA
  // ============================================
  useEffect(() => {
    const inCheck = isInCheck(board, turn);
    const moves = generateAllMoves(board, turn);

    let status = "";
    let result = "";

    if (moves.length === 0) {
      if (inCheck) {
        result = turn === "red"
          ? "ĐỎ bị chiếu bí – ĐEN thắng"
          : "ĐEN bị chiếu bí – ĐỎ thắng";
      } else {
        result = "Hòa: Hết nước đi";
      }
    } else if (inCheck) {
      status = "Chiếu!";
    }

    const lastKey = historyKeys[historyKeys.length - 1];
    const ct = historyKeys.filter(k => k === lastKey).length;
    if (!result && ct >= 3) {
      result = "Hòa: Lặp lại vị trí 3 lần";
    }

    setCheckStatus(status);
    setGameResult(result);
  }, [board, turn, historyKeys]);

  // ============================================
  // RENDER UI
  // ============================================
  return (
    <div className="mx-auto max-w-lg">

      <div className="flex justify-center gap-4 mb-3">
        <button
          className={`px-4 py-2 rounded ${mode === "human" ? "bg-green-700" : "bg-slate-700"}`}
          onClick={() => setMode("human")}
        >
          Người đấu người
        </button>

        <button
          className={`px-4 py-2 rounded ${mode === "bot" ? "bg-blue-700" : "bg-slate-700"}`}
          onClick={() => setMode("bot")}
        >
          Đánh với BOT
        </button>
      </div>

      <XiangqiBoard
        board={board}
        selectedSquare={selectedSquare}
        legalTargets={legalTargets}
        lastMove={lastMove}
        onClick={mode === "human" || turn !== botSide ? handleClick : undefined}
        movingPiece={movingPiece && movingSquare ? { piece: movingPiece.piece, square: movingSquare } : null}
        hideSquare={hideSquare}
      />

      <div className="text-center mt-3 text-white">
        Lượt hiện tại: {turn === "red" ? "ĐỎ" : "ĐEN"}
        {mode === "bot" && turn === botSide && botThinking && " – BOT đang tính…"}
      </div>

      {checkStatus && !gameResult && (
        <div className="text-center mt-2 text-red-400 font-bold">{checkStatus}</div>
      )}

      {gameResult && (
        <div className="text-center mt-2 text-yellow-300 font-bold">{gameResult}</div>
      )}

      <div className="flex justify-center gap-3 my-3">
        <button className="px-3 py-1 bg-gray-700 rounded" onClick={handleUndo}>Undo</button>
        <button className="px-3 py-1 bg-gray-700 rounded" onClick={handleRedo}>Redo</button>
      </div>

      {mode === "bot" && pausedAfterUndo && (
        <div className="text-center mt-3">
          <button
            className="px-4 py-2 bg-yellow-600 rounded"
            onClick={() => setPausedAfterUndo(false)}
          >
            Tiếp tục
          </button>
        </div>
      )}
    </div>
  );
}
