// ===============================
// App.tsx — CLEAN VERSION
// ===============================

import React, { useRef, useState, useEffect, useMemo } from "react";
import { Chess } from "chess.js";
import { ChessBoard } from "@/components/ChessBoard";

import { useChessBot } from "@/hooks/useChessBot";
import { useOnlineRoom } from "@/hooks/useOnlineRoom";
import { usePlayerMove } from "@/hooks/usePlayerMove";

import { useSocket } from "@/context/SocketProvider";

import { Button } from "@/components/ui/button";

import { RoomSettings } from "@/components/RoomSettings";
import { PopupModal } from "@/components/PopupModal";
import { OnlineActions } from "@/components/OnlineActions";

import { randomUUID } from "@/utils/id";

// -----------------------------
const START_FEN = new Chess().fen();
// -----------------------------


export default function App() {
  const socket = useSocket();
  const gameRef = useRef(new Chess());

  // CORE STATE -----------------
  const [mode, setMode] = useState<"bot" | "online">("bot");
  const [fen, setFen] = useState(START_FEN);
  const [history, setHistory] = useState([START_FEN]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const [playerColor, setPlayerColor] = useState<"w" | "b">("w");
  const [onlineColor, setOnlineColor] = useState<"w" | "b" | null>(null);

  const [roomId, setRoomId] = useState("");
  const [connected, setConnected] = useState(false);

  const [lastMove, setLastMove] = useState<any>(null);
  const [capturedPiece, setCapturedPiece] = useState<any>(null);
  const [deadKingSquare, setDeadKingSquare] = useState<string | null>(null);

  const [botDepth, setBotDepth] = useState(3);
  const [botThinking, setBotThinking] = useState(false);

  const [isAnimating, setIsAnimating] = useState(false);

  const [roomList, setRoomList] = useState([]);
  const [newRoomName, setNewRoomName] = useState("");

  const [gameFinished, setGameFinished] = useState(false);

  const [popup, setPopup] = useState({
    type: null,
    message: "",
    onAccept: null,
    onReject: null,
  });

  const [showSettings, setShowSettings] = useState(true);

  const isJoiningRef = useRef(false);
  const lastLocalMoveIdRef = useRef<string | null>(null);

  const viewColor = mode === "bot" ? playerColor : onlineColor ?? "w";

  // =============================
  // DISPLAY GAME WITH FEN
  // =============================
  const displayGame = useMemo(() => {
    const g = new Chess();
    try {
      g.load(fen);
    } catch (e) {
      console.error("Load FEN error:", fen, e);
    }
    return g;
  }, [fen]);


  // =============================
  // PUSH NEW GAME STATE
  // =============================
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

  // =============================
  // PLAYER MOVE HOOK
  // =============================
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
    onMoveApplied: (g: Chess) => {
      if (g.isCheckmate()) {
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
    },
    setIsAnimating,
    isJoiningRef,
  });


  // =============================
  // BOT HOOK
  // =============================
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
  });


  // =============================
  // ONLINE ROOM HOOK
  // =============================
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


  // =============================
  // LOAD ROOM LIST
  // =============================
  const loadRooms = () => socket?.emit("rooms:list");


  // ======================================
  // SOCKET EVENT HANDLERS (CLIENT SIDE)
  // ======================================
  useEffect(() => {
    if (!socket) return;

    socket.on("rooms:list:response", (list) => setRoomList(list));
    socket.on("rooms:update", () => socket.emit("rooms:list"));

    socket.on("room:full", () =>
      setPopup({
        type: "info",
        message: "Phòng đã đủ 2 người!",
        onAccept: () => setPopup({ type: null }),
      })
    );

    socket.on("rooms:clear:done", ({ removed }) =>
      setPopup({
        type: "info",
        message: `Đã xoá ${removed} phòng trống.`,
        onAccept: () => setPopup({ type: null }),
      })
    );

    socket.on("room:created", ({ roomName }) =>
      setPopup({
        type: "info",
        message: `Tạo phòng: ${roomName}`,
        onAccept: () => {
          setPopup({ type: null });
          setRoomId(roomName);
          socket.emit("room:join", { roomName });
          setShowSettings(false);
        },
      })
    );

    socket.on("room:force-leave", () => {
      resetBoardState();
      setRoomId("");
      setOnlineColor(null);
      setGameFinished(false);

      setPopup({
        type: "info",
        message: "Phòng đã đóng!",
        onAccept: () => setPopup({ type: null }),
      });
    });

    socket.on("room:left", () => {
      resetFullGame();
      setRoomId("");
      setOnlineColor(null);

      setPopup({
        type: "info",
        message: "Bạn đã rời phòng.",
        onAccept: () => setPopup({ type: null }),
      });
    });

    socket.on("room:opponent-left", () => {
      resetMatchOnly();
      setPopup({
        type: "info",
        message: "Đối thủ rời phòng.",
        onAccept: () => setPopup({ type: null }),
      });
    });

    socket.on("room:leave:confirm", () =>
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
      })
    );

    socket.on("draw:offer:received", () =>
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
      })
    );

    socket.on("draw:accepted", () =>
      setPopup({
        type: "info",
        message: "Hòa!",
        onAccept: () => {
          resetMatchOnly();
          setPopup({ type: null });
        },
      })
    );

    socket.on("draw:rejected", () =>
      setPopup({
        type: "info",
        message: "Đối thủ từ chối hòa.",
        onAccept: () => setPopup({ type: null }),
      })
    );

    return () => {
      socket.off();
    };
  }, [socket, roomId]);


  // =============================
  // RESET FUNCTIONS
  // =============================
  const resetBoardState = () => {
    const g = new Chess();
    gameRef.current = g;
    const f = g.fen();

    setFen(f);
    setHistory([f]);
    setHistoryIndex(0);

    setOnlineColor(null);
    setDeadKingSquare(null);
    setLastMove(null);
    setCapturedPiece(null);
    setIsAnimating(false);
    setGameFinished(false);

    resetAnimation?.();
  };

  const resetFullGame = () => {
    const g = new Chess();
    const f = g.fen();

    setFen(f);
    setHistory([f]);
    setHistoryIndex(0);

    setOnlineColor(null);
    setDeadKingSquare(null);
    setLastMove(null);
    setCapturedPiece(null);
    resetAnimation?.();
  };

  const resetMatchOnly = () => {
    const g = new Chess();
    const f = g.fen();
    gameRef.current = g;

    setFen(f);
    setHistory([f]);
    setHistoryIndex(0);

    setDeadKingSquare(null);
    setLastMove(null);
    setCapturedPiece(null);
    resetAnimation?.();
  };
	
   const pushStateLocal = (newFen, newHist, newIdx) => {
	  const g = new Chess();
	  g.load(newFen);

	  gameRef.current = g;       // ⭐ Cập nhật engine nội bộ BOT
	  setFen(newFen);
	  setHistory(newHist);
	  setHistoryIndex(newIdx);

	  setLastMove(null);         // ⭐ Reset nước đi trước đó
	  setCapturedPiece(null);
	  setDeadKingSquare(null);
	  setIsAnimating(false);
	};


  // =============================
  // RENDER UI
  // =============================
  const currentTurn = displayGame.turn();

  return (
    <>
      {/* BUTTON SETTINGS */}
      <button
        onClick={() => setShowSettings(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-slate-800 border border-slate-600 shadow-lg flex items-center justify-center text-3xl"
      >
        ⚙
      </button>

      {/* ONLINE ACTION BUTTONS */}
      <OnlineActions
        mode={mode}
        roomId={roomId}
        gameFinished={gameFinished}
        history={history}
        socket={socket}
        setPopup={setPopup}
      />

      {/* MAIN */}
      <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-5xl bg-slate-900/80 border border-slate-700 rounded-md p-4">
          <div className="text-center mb-2 text-sm text-slate-400">
            {mode === "online" && roomId ? `Phòng: ${roomId}` : "Chess React BOT / ONLINE"}
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

          <div className="flex justify-center gap-2 mt-4">
           <Button
			  onClick={() => {
				if (historyIndex === 0) return;

				const idx = historyIndex - 1;
				const newFen = history[idx];

				if (mode === "bot") {
				  pushStateLocal(newFen, history, idx);  // ⭐ BOT dùng local push
				} else {
				  pushState(newFen, history, idx);       // ⭐ ONLINE dùng pushState cũ
				}
			  }}
			>
			  Undo
			</Button>

			<Button
			  onClick={() => {
				if (historyIndex >= history.length - 1) return;

				const idx = historyIndex + 1;
				const newFen = history[idx];

				if (mode === "bot") {
				  pushStateLocal(newFen, history, idx);
				} else {
				  pushState(newFen, history, idx);
				}
			  }}
			>
			  Redo
			</Button>

            <Button onClick={resetBoardState}>Reset</Button>
          </div>

          <div className="text-center text-sm mt-2 text-slate-300">
            Lượt hiện tại: {currentTurn === "w" ? "Trắng" : "Đen"}
            {mode === "bot" && botThinking && " – BOT đang tính…"}
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
        loadRooms={loadRooms}
        socket={socket}
        setRoomId={setRoomId}
        resetBoardState={resetBoardState}
      />

      <PopupModal popup={popup} setPopup={setPopup} />
    </>
  );
}
