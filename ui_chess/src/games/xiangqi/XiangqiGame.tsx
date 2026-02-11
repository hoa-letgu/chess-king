import React, { useState, useEffect } from "react";
import { XiangqiBoard } from "./components/XiangqiBoard";
import { useXiangqiMove } from "./hooks/useXiangqiMove";
import { useXiangqiBot } from "./hooks/useXiangqiBot";
import { useSocket } from "@/context/SocketProvider";
import { initialBoard } from "./utils/initialBoard";
import { squareToCoord, generateAllMoves } from "./utils/rules";
import { isInCheck } from "./utils/isInCheck";
import { boardToKey } from "./utils/xiangqiBotEngine";
//src/games/xiangqi/XiangqiGame.tsx
import type { XiangqiPieceKey } from "./utils/pieces";
import { RoomSettings } from "@/games/xiangqi/components/RoomSettings";

import { PopupModal } from "@/games/chess/components/PopupModal";
import { boardToFen, fenToBoard } from "./utils/xfengenerator";
import { showSuccess, showError,showLoading,dismissToast } from "@/games/common/toast";
type Side = "red" | "black";

export default function XiangqiGame() {
  const socket = useSocket();
  const [board, setBoard] = useState(initialBoard);
  const [turn, setTurn] = useState<Side>("red");

  const [mode, setMode] = useState<GameMode>("bot");
  const botSide: Side = "black";
  
  type Seat = "red" | "black" | "spectator" | null;

const [onlineSeat, setOnlineSeat] = useState<Seat>(null);
const [fen, setFen] = useState<string>(() => boardToFen(initialBoard, "red"));

  const [botThinking, setBotThinking] = useState(false);
const [drawToastId, setDrawToastId] = useState<string | number | null>(null);

  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [checkStatus, setCheckStatus] = useState<string>("");
  const [gameResult, setGameResult] = useState<string>("");
  const [showSettings, setShowSettings] = useState(true);
  const [roomList, setRoomList] = useState([]);
  const [newRoomName, setNewRoomName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [connected, setConnected] = useState(false);
  const gameEndedRef = React.useRef(false);
  const [gameOver, setGameOver] = useState(false);


  // ============ UNDO / REDO HISTORY ============
  const [history, setHistory] = useState([
    { board: initialBoard, turn: "red", lastMove: null }
  ]);
  
  type Side = "red" | "black";

const [viewSide, setViewSide] = useState<Side>("red");

  
    const [popup, setPopup] = useState({
    type: null,
    message: "",
    onAccept: null,
    onReject: null,
  });
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
  
  function isValidBoard(b: any): b is (XiangqiPieceKey | null | "")[][] {
  if (!Array.isArray(b) || b.length !== 10) return false;
  for (let r = 0; r < 10; r++) {
    if (!Array.isArray(b[r]) || b[r].length !== 9) return false;
  }
  return true;
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
 const resetBoardState = () => {
  const board = initialBoard;

  setBoard(board);
  setTurn("red");

  setViewSide("red"); // ⭐ CHỈ RESET KHI THỰC SỰ CHƠI BOT

  setHistory([{ board, turn: "red", lastMove: null }]);
  setHistoryIndex(0);
  setHistoryKeys([boardToKey(board, "red")]);

  setLastMove(null);
  setCheckStatus("");
  setGameResult("");
  setPausedAfterUndo(false);
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
const applyMove = ({ from, to, piece, check }) => {
  // ===== ANIMATION =====
  setMovingPiece({ piece, from, to });
  setMovingSquare(from);
  setHideSquare(from);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      setMovingSquare(to);
    });
  });

  setTimeout(() => {
    const [r1, c1] = squareToCoord(from);
    const [r2, c2] = squareToCoord(to);

    // ✅ 1. TẠO BOARD MỚI TRƯỚC
    const newBoard = board.map(row => [...row]);
    newBoard[r2][c2] = piece;
    newBoard[r1][c1] = null;

    const nextTurn: Side = turn === "red" ? "black" : "red";

    // ✅ 2. UPDATE LOCAL STATE
    setBoard(newBoard);
    setTurn(nextTurn);
    setLastMove({ from, to });
    setCheckStatus(check ? "Chiếu!" : "");

    setHideSquare(null);
    setMovingPiece(null);
    setMovingSquare(null);

    // ✅ 3. EMIT ONLINE (DÙNG newBoard, KHÔNG DÙNG STATE)
    if (mode === "online" && roomId && socket) {
      const fen = boardToFen(newBoard, nextTurn);

      socket.emit("xiangqi:move", {
        roomId,
        fen,
        turn: nextTurn,
        lastMove: { from, to },
      });
    }
  }, 220);
};



useEffect(() => {
  if (!socket) return;

  const onRooms = (list: any[]) => setRoomList(list);
const onRoomClosed = () => {
  clearDrawToast();
  alert("Phòng đã bị hủy");
  resetAllState();
};

  const onJoined = ({ roomId, seat, state }: any) => {
    setRoomId(roomId);
    setOnlineSeat(seat);

    // SET VIEW
    setViewSide(seat === "black" ? "black" : "red");

    if (state?.fen) {
      const parsed = fenToBoard(state.fen);
      const boardParsed = parsed?.board ?? parsed;

      if (isValidBoard(boardParsed)) {
        safeSetBoard(boardParsed);
      }

      setTurn(state.turn || "red");
      setLastMove(state.lastMove || null);
    }
  };
  const onDrawRequested = ({ from }) => {
    dismissToast();

    setPopup({
      type: "drawConfirm",
      message:
        "Đối phương xin cầu hòa.\nBạn có đồng ý không?",
      onAccept: () => {
		  clearDrawToast();
        socket.emit("xiangqi:draw:accept", { roomId });
        setPopup({ type: null, message: "" });
      },
      onReject: () => {
        socket.emit("xiangqi:draw:reject", { roomId });
        setPopup({ type: null, message: "" });
      },
    });
  };
const onDrawResult = ({ result }) => {
  if (result === "draw") {
    clearDrawToast();
    showSuccess("Ván đấu kết thúc: HÒA");
    resetAllState();
  }
};




  const onState = (st: any) => {
  if (gameEndedRef.current) return; // ⭐ CHẶN TẠI ĐÂY

  if (!st?.fen) return;

  const parsed = fenToBoard(st.fen);
  const boardParsed = parsed?.board ?? parsed;

  if (!isValidBoard(boardParsed)) return;

  safeSetBoard(boardParsed);
  setTurn(st.turn || "red");
  setLastMove(st.lastMove || null);
};

  
const onDrawRejected = () => {
  clearDrawToast();
  showError("Đối phương từ chối hòa");
};


  socket.on("xiangqi:draw:rejected", onDrawRejected);
  socket.on("xiangqi:room_closed", onRoomClosed);
  socket.on("rooms:list:response", onRooms);
  socket.on("room:joined", onJoined);
  socket.on("xiangqi:state", onState);
  socket.on("xiangqi:draw:requested", onDrawRequested);
  socket.on("xiangqi:draw:result", onDrawResult);

  return () => {
    socket.off("rooms:list:response", onRooms);
    socket.off("room:joined", onJoined);
    socket.off("xiangqi:state", onState);
	socket.off("xiangqi:room_closed", onRoomClosed);
	socket.off("xiangqi:draw:requested", onDrawRequested);
	 socket.off("xiangqi:draw:result", onDrawResult);
	  socket.off("xiangqi:draw:rejected", onDrawRejected);
  };
}, [socket]);

useEffect(() => {
  if (
    !socket ||
    !roomId ||
    mode !== "online" ||
    gameEndedRef.current
  )
    return;

  socket.emit("xiangqi:sync", { roomId });
}, [socket, roomId, mode]);



const resetAllState = () => {
  gameEndedRef.current = false;
   clearDrawToast();

  setBoard(initialBoard);
  setTurn("red");
  setFen(boardToFen(initialBoard, "red"));

  setHistory([{ board: initialBoard, turn: "red", lastMove: null }]);
  setHistoryIndex(0);
  setHistoryKeys([boardToKey(initialBoard, "red")]);

  setLastMove(null);
  setCheckStatus("");
  setGameResult("");

  setOnlineSeat(null);
  setRoomId("");
  setViewSide("red");

  setMode("bot");
  setShowSettings(true);
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
  gameOver,     // ⭐ THÊM
  depth: 4,
  pausedAfterUndo,
});



  useEffect(() => {
  if (gameOver) return; // ⛔ đã kết thúc thì không xét nữa

  const inCheck = isInCheck(board, turn);
  const moves = generateAllMoves(board, turn);

  let status = "";
  let result = "";

  // ======================
  // CHIẾU BÍ / HÒA HẾT NƯỚC
  // ======================
  if (moves.length === 0) {
    if (inCheck) {
      result =
        turn === "red"
          ? "ĐỎ bị chiếu bí – ĐEN thắng"
          : "ĐEN bị chiếu bí – ĐỎ thắng";
    } else {
      result = "Hòa: Hết nước đi";
    }

    setGameOver(true); // ⭐ QUAN TRỌNG
  }
  // ======================
  // ĐANG BỊ CHIẾU
  // ======================
  else if (inCheck) {
    status = "Chiếu!";
  }

  // ======================
  // HÒA LẶP 3 LẦN
  // ======================
  const lastKey = historyKeys[historyKeys.length - 1];
  const ct = historyKeys.filter(k => k === lastKey).length;

  if (!result && ct >= 3) {
    result = "Hòa: Lặp lại vị trí 3 lần";
    setGameOver(true); // ⭐
  }

  setCheckStatus(status);
  setGameResult(result);

  // ======================
  // POPUP KẾT THÚC VÁN
  // ======================
  if (result) {
    setPopup({
      type: "info",
      message: result + "\n\nBạn muốn làm gì tiếp?",
      onAccept: () => {
        // 🔁 Ván mới
        resetAllState();
        setGameOver(false);
        setPopup({ type: null, message: "" });
      },
      onReject: () => {
        // 🚪 Thoát ván
        if (mode === "online" && roomId) {
          socket?.emit("xiangqi:leave", { roomId });
        }
        resetAllState();
        setGameOver(false);
        setPopup({ type: null, message: "" });
      },
    });
  }
}, [board, turn, historyKeys, gameOver]);

  
  
  
  const canPlayOnline =
  mode === "online" &&
  onlineSeat !== "spectator" &&
  onlineSeat === turn;

  
const clearDrawToast = () => {
  if (drawToastId) {
    dismissToast(drawToastId);
    setDrawToastId(null);
  }
};


  // ============================================
  // RENDER UI
  // ============================================
  return (
   <>
    <div className="mx-auto w-full max-w-2xl">
<div className="text-center text-slate-400 text-sm mb-1">
  Chế độ: {mode === "bot" ? "🤖 Đánh với BOT" : "🌍 Online"}
</div>

      

    <XiangqiBoard
	  board={board}
	  viewSide={viewSide}
	  selectedSquare={selectedSquare}
	  legalTargets={legalTargets}
	  lastMove={lastMove}
	  onClick={
		gameOver
		  ? undefined                       // ⛔ khóa bàn cờ khi kết thúc
		  : mode === "bot"
			? turn !== botSide
			  ? handleClick
			  : undefined
			: canPlayOnline
			  ? handleClick
			  : undefined
	  }
	  movingPiece={
		movingPiece && movingSquare
		  ? { piece: movingPiece.piece, square: movingSquare }
		  : null
	  }
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

     {mode === "bot" && (
	  <div className="flex justify-center gap-3 my-3">
		<button className="px-3 py-1 bg-gray-700 rounded" onClick={handleUndo}>
		  Undo
		</button>
		<button className="px-3 py-1 bg-gray-700 rounded" onClick={handleRedo}>
		  Redo
		</button>
	  </div>
	)}


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
	
	{mode === "online" && roomId && (
		  <div className="flex justify-center mt-3">
			<button
			  className="px-4 py-2 bg-red-600 rounded"
			  onClick={() => {
				setPopup({
				  type: "leaveConfirm",
				  message:
					"Bạn có chắc muốn thoát phòng?\nPhòng sẽ bị hủy và ván đấu kết thúc.",
				  onAccept: () => {
					socket.emit("xiangqi:leave", { roomId });
					setPopup({ type: null, message: "" });
				  },
				  onReject: () => {
					setPopup({ type: null, message: "" });
				  },
				});
			  }}
			>
			  🚪 Thoát phòng
			</button>
		  </div>
		)}
		
		
		{mode === "online" && roomId && canPlayOnline && (
			  <div className="flex justify-center mt-2">
				<button
				  className="px-4 py-2 bg-blue-600 rounded"
				  onClick={() => {
					  socket.emit("xiangqi:draw:request", { roomId });
					  const id = showLoading("Đang gửi yêu cầu xin hòa...");
					  setDrawToastId(id);
					}}

				>
				  🤝 Xin hòa
				</button>
			  </div>
			)}


	 {/* POPUPS */}
      <RoomSettings
        showSettings={showSettings}
        setShowSettings={setShowSettings}
        mode={mode}
        setMode={setMode}
        newRoomName={newRoomName}
        setNewRoomName={setNewRoomName}
        roomList={roomList}
        loadRooms={() => socket?.emit("rooms:list")}
        socket={socket}
        setRoomId={setRoomId}
        resetBoardState={resetBoardState}
      />

      <PopupModal popup={popup} setPopup={setPopup} />
	 </>
  );
}
