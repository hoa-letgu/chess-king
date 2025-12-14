// ======================================
// src/games/chess/ChessGame.tsx
// ======================================

import React, { useRef, useState, useEffect, useMemo } from "react";
import { Chess } from "chess.js";

import { ChessBoard } from "@/games/chess/components/ChessBoard";

import { useChessBot } from "@/games/chess/hooks/useChessBot";
import { useOnlineRoom } from "@/games/chess/hooks/useOnlineRoom";
import { usePlayerMove } from "@/games/chess/hooks/usePlayerMove";

import { useSocket } from "@/context/SocketProvider";

import { Button } from "@/components/ui/button";
import { RoomSettings } from "@/games/chess/components/RoomSettings";
import { PopupModal } from "@/games/chess/components/PopupModal";
import { OnlineActions } from "@/games/chess/components/OnlineActions";

import { randomUUID } from "@/games/chess/utils/randomUUID";
import { detectGameEnd } from "@/games/chess/utils/detectGameEnd";
import { showSuccess, showError } from "@/games/common/toast";


const START_FEN = new Chess().fen();


export default function ChessGame({ onExit }: { onExit: () => void }) {
  const socket = useSocket();
  const gameRef = useRef(new Chess());

  // =======================
  // STATES
  // =======================
  const [mode, setMode] = useState<"bot" | "online">("bot");
  const [fen, setFen] = useState(START_FEN);
  const [history, setHistory] = useState([START_FEN]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const [playerColor, setPlayerColor] = useState<"w" | "b">("w");
  const [onlineColor, setOnlineColor] = useState<"w" | "b" | null>(null);

  const [roomId, setRoomId] = useState("");
  const [connected, setConnected] = useState(false);

  const [lastMove, setLastMove] = useState(null);
  const [capturedPiece, setCapturedPiece] = useState(null);
  const [deadKingSquare, setDeadKingSquare] = useState<string | null>(null);

  const [botDepth, setBotDepth] = useState(3);
  const [botThinking, setBotThinking] = useState(false);

  const [isAnimating, setIsAnimating] = useState(false);

  const [roomList, setRoomList] = useState([]);
  const [newRoomName, setNewRoomName] = useState("");

  const [gameFinished, setGameFinished] = useState(false);
  const [showSettings, setShowSettings] = useState(true);

  const isJoiningRef = useRef(false);
  const lastLocalMoveIdRef = useRef<string | null>(null);
  const isUndoingRef = useRef(false);   // ⭐ THÊM DÒNG NÀY
  const [botPaused, setBotPaused] = useState(false);


    const [popup, setPopup] = useState({
    type: null,
    message: "",
    onAccept: null,
    onReject: null,
  });
  const viewColor = mode === "bot" ? playerColor : onlineColor ?? "w";

  // =======================
  // DISPLAY GAME
  // =======================
  const displayGame = useMemo(() => {
    const g = new Chess();
    g.load(fen);
    return g;
  }, [fen]);


  // =======================
  // PUSH STATE
  // =======================
  const pushState = (newFen, newHist, newIdx, emit = true, lastMoveSend = null) => {
    const moveId = randomUUID();
    lastLocalMoveIdRef.current = moveId;

    setFen(newFen);
    setHistory(newHist);
    setHistoryIndex(newIdx);

    if (mode === "online" && emit && socket && roomId) {
      socket.emit("game:state", {
        roomName: roomId,
        fen: newFen,
        history: newHist,
        historyIndex: newIdx,
        lastMove: lastMoveSend,
        moveId,
      });
    }
  };

   const handleUndo = () => {
  if (historyIndex === 0) return;

  // STOP bot
  isUndoingRef.current = true;
  setBotPaused(true);

  const idx = historyIndex - 1;
  const newFen = history[idx];

  // Load FEN về Chess engine
  gameRef.current.load(newFen);

  // Update state UI
  setFen(newFen);
  setHistoryIndex(idx);

  // cho effect ổn định rồi cho phép BOT chạy tiếp
  setTimeout(() => {
    isUndoingRef.current = false;
  }, 50);
};
const handleRedo = () => {
  if (historyIndex >= history.length - 1) return;

  // STOP bot
  isUndoingRef.current = true;
  setBotPaused(true);

  const idx = historyIndex + 1;
  const newFen = history[idx];

  // Load lại FEN
  gameRef.current.load(newFen);

  setFen(newFen);
  setHistoryIndex(idx);

  setTimeout(() => {
    isUndoingRef.current = false;
  }, 50);
};

  // =======================
  // HANDLE PLAYER MOVE
  // =======================
  const {
    selectedSquare,
    legalTargets,
    movingPiece,
    movingPath,
    movingStep,
    hidePiece,
    handleSquareClick,
    resetAnimation,
  } = usePlayerMove({
    fen,
    gameRef,
    history,
    historyIndex,
    pushState,
    mode,
    playerColor,
    onlineColor,
    setLastMove,

    setIsAnimating,
    isJoiningRef,

    onMoveApplied: (g: Chess) => {
      const result = detectGameEnd(g);
      setDeadKingSquare(null);

      if (!result.ended) {
        setGameFinished(false);
        return;
      }

      setGameFinished(true);

      // CHECKMATE ? xoay vua
      if (result.reason === "checkmate") {
        const loser = g.turn();
        const board = g.board();
        let dead = null;

        for (let r = 0; r < 8; r++)
          for (let c = 0; c < 8; c++) {
            const p = board[r][c];
            if (p && p.type === "k" && p.color === loser)
              dead = "abcdefgh"[c] + (8 - r);
          }

        setDeadKingSquare(dead);
      }

      const myColor = mode === "online" ? onlineColor : playerColor;

      const message =
        result.winner === myColor
          ? "?? B?n d� th?ng!"
          : result.winner === null
          ? "?? H�a!"
          : "?? B?n d� thua!";

      if (mode === "online") {
        setPopup({
          type: "gameEnd",
          message,
          onAccept: () => {
            socket.emit("game:restart", { roomName: roomId });
            setPopup({ type: null });
          },
          onReject: () => {
            socket.emit("room:leave:request", { roomName: roomId });
            setPopup({ type: null });
          },
        });
      } else {
        setPopup({
          type: "gameEnd",
          message,
          onAccept: () => {
            resetMatchOnly();
            setGameFinished(false);
            setPopup({ type: null });
          },
          onReject: () => setPopup({ type: null }),
        });
      }
    },
  });


  // =======================
  // BOT HOOK
  // =======================
  useChessBot({
    mode,
    playerColor,
    botDepth,
    fen,
    game: gameRef.current,
    history,
    historyIndex,
    setFen,
    setHistory,
    setHistoryIndex,
    botThinking,
    setBotThinking,
    setLastMove,
	isUndoingRef, 
	botPaused, 
  });


  // =======================
  // ONLINE ROOM HOOK
  // =======================
  useOnlineRoom({
    mode,
    socket,
    roomId,
    setConnected,
    setOnlineColor,
    setFen,
    setHistory,
    setHistoryIndex,
    setLastMove,
    lastLocalMoveIdRef,
    resetAnimation,
    isJoiningRef,
  });


  // =======================
  // SOCKET EVENTS
  // =======================
 useEffect(() => {
  if (!socket) return;

  socket.on("rooms:list:response", (list) => setRoomList(list));
  socket.on("rooms:update", () => socket.emit("rooms:list"));
  socket.on("game:update", ({ fen, history, historyIndex, lastMove }) => {
	  const g = new Chess();
	  g.load(fen);

	  // ================================
	  // ⭐ KIỂM TRA CHIẾU BÍ TỪ ĐỐI PHƯƠNG
	  // ================================
	  if (g.isCheckmate()) {
		handleCheckmate(g);   // 🟢 Xử lý xoay vua + popup + setGameFinished
	  }

	  // ================================
	  // ⭐ CẬP NHẬT GAME STATE UI
	  // ================================
	  setFen(fen);
	  setHistory(history);
	  setHistoryIndex(historyIndex);
	  setLastMove(lastMove);
	});


  socket.on("room:full", () => {
    showError("Không thể vào phòng", "Phòng đã đủ 2 người!");
  });

  socket.on("rooms:clear:done", ({ removed }) => {
    showSuccess("Dọn phòng thành công", `Đã xoá ${removed} phòng trống.`);
  });

  socket.on("room:created", ({ roomName }) => {
    showSuccess("Tạo phòng thành công", `Phòng: ${roomName}`);

    setRoomId(roomName);
    socket.emit("room:join", { roomName });
    setShowSettings(false);
  });

  socket.on("room:force-leave", () => {
    resetBoardState();
    setRoomId("");
    setOnlineColor(null);
    setGameFinished(false);

    showError("Phòng đã đóng", "Bạn đã bị rời khỏi phòng");
  });

  socket.on("room:left", () => {
    resetFullGame();
    setRoomId("");
    setOnlineColor(null);

    showSuccess("Đã rời phòng");
  });

  socket.on("room:opponent-left", () => {
    resetMatchOnly();

    showSuccess("Đối thủ đã rời phòng");
  });

  // ✅ Chỉ 2 case này dùng popup
  socket.on("room:leave:confirm", () => {
    setPopup({
      type: "leaveConfirm",
      message: "Đối thủ xin rời phòng. Đồng ý?",
      onAccept: () => {
        socket.emit("room:leave:approved", { roomName: roomId });
        setPopup({ type: null });
      },
      onReject: () => {
        socket.emit("room:leave:denied", { roomName: roomId });
        setPopup({ type: null });
      },
    });
  });
  socket.on("game:restart", ({ fen, history, historyIndex }) => {
	  const g = new Chess();
	  g.load(fen);

	  gameRef.current = g;
	  setFen(fen);
	  setHistory(history);
	  setHistoryIndex(historyIndex);

	  setDeadKingSquare(null);
	  setLastMove(null);
	  setCapturedPiece(null);
	  setGameFinished(false);
	  resetAnimation?.();
	});

	
  socket.on("draw:offer:received", () => {
    setPopup({
      type: "drawConfirm",
      message: "Đối thủ đề nghị hòa. Đồng ý?",
      onAccept: () => {
        socket.emit("draw:accept", { roomName: roomId });
        resetMatchOnly();
        setPopup({ type: null });
      },
      onReject: () => {
        socket.emit("draw:reject", { roomName: roomId });
        setPopup({ type: null });
      },
    });
  });

  socket.on("draw:accepted", () => {
    resetMatchOnly();

     showSuccess("Hòa", "Ván đấu kết thúc với kết quả hòa");
  });

  socket.on("draw:rejected", () => {
     showError("Hoà bị từ chối", "Đối thủ không đồng ý hòa");
  });

  return () => {
    socket.off();
  };
}, [socket, roomId]);
  // =======================
  // RESET FUNCTIONS
  // =======================
  const resetBoardState = () => {
    const g = new Chess();
    const f = g.fen();

    gameRef.current = g;

    setFen(f);
    setHistory([f]);
    setHistoryIndex(0);

    setLastMove(null);
    setCapturedPiece(null);
    setDeadKingSquare(null);
    setGameFinished(false);
    resetAnimation?.();
  };

  const resetFullGame = () => {
    resetBoardState();
    setOnlineColor(null);
  };

  const resetMatchOnly = () => {
    resetBoardState();
  };


  const handleCheckmate = (g: Chess) => {
    const loser = g.turn();
    let dead = null;
    const board = g.board();

    for (let r = 0; r < 8; r++)
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (p && p.type === "k" && p.color === loser)
          dead = "abcdefgh"[c] + (8 - r);
      }

    setDeadKingSquare(dead);
    setGameFinished(true);
  };


  // =======================
  // UI RENDER
  // =======================
  const currentTurn = displayGame.turn();

  return (
    <>
      {/* EXIT BUTTON */}
      <button
        onClick={onExit}
        className="fixed top-4 left-4 px-4 py-2 bg-slate-700 rounded text-white border"
      >
        ? Thoát menu
      </button>

      {/* SETTINGS BUTTON */}
      <button
        onClick={() => setShowSettings(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center text-3xl"
      >
        ?
      </button>

      {/* ACTION BUTTONS */}
      <OnlineActions
        mode={mode}
        roomId={roomId}
        gameFinished={gameFinished}
        history={history}
        socket={socket}
        setPopup={setPopup}
      />

      {/* MAIN CONTENT */}
      <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-5xl bg-slate-900/80 border border-slate-700 rounded-md p-4">
          <div className="text-center text-sm mb-2 text-slate-400">
            {mode === "online" && roomId ? `Ph�ng: ${roomId}` : "Chess BOT / ONLINE"}
          </div>

          <ChessBoard
            board={displayGame.board()}
            selectedSquare={selectedSquare}
            legalTargets={legalTargets}
            lastMove={lastMove}
            capturedPiece={capturedPiece}
            movingPiece={movingPiece}
            movingPath={movingPath}
            movingStep={movingStep}
            hidePiece={hidePiece}
            deadKingSquare={deadKingSquare}
            viewColor={viewColor}
            onClick={handleSquareClick}
          />

          {/* ======================== */}
			{/* ẨN NÚT KHI ONLINE MODE   */}
			{/* ======================== */}
			{mode === "bot" && (
			  <div className="flex justify-center gap-2 mt-4">

				<Button onClick={handleUndo}>Undo</Button>

				<Button onClick={handleRedo}>Redo</Button>

				<Button onClick={resetBoardState}>Reset</Button>

				{botPaused && (
				  <Button onClick={() => setBotPaused(false)}>
					▶ Tiếp tục BOT
				  </Button>
				)}

			  </div>
			)}


          <div className="text-center text-sm mt-2 text-slate-300">
            Lượt hiện tại: {currentTurn === "w" ? "Trắng" : "Đen"}
            {mode === "bot" && botThinking && " � BOT dang t�nh�"}
          </div>
        </div>
      </div>

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
