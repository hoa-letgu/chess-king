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
  const [mode, setMode] = useState<"bot" | "online" | "botvsbot">("bot");

  const [fen, setFen] = useState(START_FEN);
  const [history, setHistory] = useState([START_FEN]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // BOT đi trước / sau
  const [botPlaysWhite, setBotPlaysWhite] = useState(true);

  // user color (BOT mode)
  const [playerColor, setPlayerColor] = useState<"w" | "b">(botPlaysWhite ? "b" : "w");

  const [onlineColor, setOnlineColor] = useState<"w" | "b" | null>(null);

  const [roomId, setRoomId] = useState("");
  const [connected, setConnected] = useState(false);

  const [lastMove, setLastMove] = useState<any>(null);
  const [capturedPiece, setCapturedPiece] = useState<any>(null);
  const [deadKingSquare, setDeadKingSquare] = useState<string | null>(null);

  const [botDepth, setBotDepth] = useState(6);
  const [botThinking, setBotThinking] = useState(false);

  const [isAnimating, setIsAnimating] = useState(false);

  const [roomList, setRoomList] = useState<any[]>([]);
  const [newRoomName, setNewRoomName] = useState("");

  const [gameFinished, setGameFinished] = useState(false);
  const [showSettings, setShowSettings] = useState(true);

  const isJoiningRef = useRef(false);
  const lastLocalMoveIdRef = useRef<string | null>(null);
  const isUndoingRef = useRef(false);
  const [botInfo, setBotInfo] = useState<any>(null);


  // ✅ START / PAUSE BOT
  const [gameStarted, setGameStarted] = useState(false);
  const [botPausedUser, setBotPausedUser] = useState(true); // mặc định pause
  const botPaused = !gameStarted || botPausedUser;

  const [popup, setPopup] = useState<any>({
    type: null,
    message: "",
    onAccept: null,
    onReject: null,
  });

  const viewColor =
  mode === "bot" ? playerColor :
  mode === "online" ? (onlineColor ?? "w") :
  "w"; // botvsbot


  // ✅ mỗi khi đổi botPlaysWhite => cập nhật playerColor
  useEffect(() => {
    if (mode !== "bot") return;
    setPlayerColor(botPlaysWhite ? "b" : "w");
  }, [botPlaysWhite, mode]);

  // =======================
  // DISPLAY GAME (UI only)
  // =======================
  const displayGame = useMemo(() => {
    const g = new Chess();
    g.load(fen);
    return g;
  }, [fen]);

  // =======================
  // PUSH STATE
  // =======================
  const pushState = (
    newFen: string,
    newHist: string[],
    newIdx: number,
    emit = true,
    lastMoveSend: any = null
  ) => {
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

  // =======================
  // UNDO / REDO
  // =======================
  const handleUndo = () => {
    if (historyIndex === 0) return;

    isUndoingRef.current = true;
    setBotPausedUser(true);

    const idx = historyIndex - 1;
    const newFen = history[idx];

    gameRef.current.load(newFen);
    setFen(newFen);
    setHistoryIndex(idx);

    setTimeout(() => {
      isUndoingRef.current = false;
    }, 50);
  };

  const handleRedo = () => {
    if (historyIndex >= history.length - 1) return;

    isUndoingRef.current = true;
    setBotPausedUser(true);

    const idx = historyIndex + 1;
    const newFen = history[idx];

    gameRef.current.load(newFen);
    setFen(newFen);
    setHistoryIndex(idx);

    setTimeout(() => {
      isUndoingRef.current = false;
    }, 50);
  };

  // =======================
  // PLAYER MOVE HOOK
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

      if (result.reason === "checkmate") {
        const loser = g.turn();
        const board = g.board();
        let dead: string | null = null;

        for (let r = 0; r < 8; r++) {
          for (let c = 0; c < 8; c++) {
            const p = board[r][c];
            if (p && p.type === "k" && p.color === loser) dead = "abcdefgh"[c] + (8 - r);
          }
        }

        setDeadKingSquare(dead);
      }

      const myColor = mode === "online" ? onlineColor : playerColor;

      const message =
        result.winner === myColor
          ? "🎉 Bạn đã thắng!"
          : result.winner === null
          ? "🤝 Hòa!"
          : "😢 Bạn đã thua!";

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

	  // ✅ NEW:
	  botSide:
		mode === "botvsbot"
		  ? "both"
		  : (botPlaysWhite ? "w" : "b"),

	  setBotInfo,
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

    socket.on("rooms:list:response", (list: any) => setRoomList(list));
    socket.on("rooms:update", () => socket.emit("rooms:list"));

    socket.on("game:update", ({ fen, history, historyIndex, lastMove }: any) => {
      const g = new Chess();
      g.load(fen);

      if (g.isCheckmate()) handleCheckmate(g);

      setFen(fen);
      setHistory(history);
      setHistoryIndex(historyIndex);
      setLastMove(lastMove);
    });

    socket.on("room:full", () => showError("Không thể vào phòng", "Phòng đã đủ 2 người!"));

    socket.on("rooms:clear:done", ({ removed }: any) => {
      showSuccess("Dọn phòng thành công", `Đã xoá ${removed} phòng trống.`);
    });

    socket.on("room:created", ({ roomName }: any) => {
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

    socket.on("game:restart", ({ fen, history, historyIndex }: any) => {
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

      // reset start/pause
      setGameStarted(false);
      setBotPausedUser(true);

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

    return () => socket.off();
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

    setPlayerColor(botPlaysWhite ? "b" : "w");

    setLastMove(null);
    setCapturedPiece(null);
    setDeadKingSquare(null);
    setGameFinished(false);
    setBotInfo(null);
    resetAnimation?.();

    setGameStarted(false);
    setBotPausedUser(true);
  };

  const resetFullGame = () => {
    resetBoardState();
    setOnlineColor(null);
  };

  const resetMatchOnly = () => resetBoardState();

  const handleCheckmate = (g: Chess) => {
    const loser = g.turn();
    let dead: string | null = null;
    const board = g.board();

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (p && p.type === "k" && p.color === loser) dead = "abcdefgh"[c] + (8 - r);
      }
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
      <button
        onClick={onExit}
        className="fixed top-4 left-4 px-4 py-2 bg-slate-700 rounded text-white border"
      >
        ⬅ Thoát menu
      </button>

      <button
        onClick={() => setShowSettings(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center text-3xl"
      >
        ⚙
      </button>

      <OnlineActions
        mode={mode}
        roomId={roomId}
        gameFinished={gameFinished}
        history={history}
        socket={socket}
        setPopup={setPopup}
      />

      <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-5xl bg-slate-900/80 border border-slate-700 rounded-md p-4">
          <div className="text-center text-sm mb-2 text-slate-400">
            {mode === "online" && roomId ? `Phòng: ${roomId}` : "Chess BOT / ONLINE"}
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
			
          {/* BOT CONTROLS */}
          {(mode === "bot" || mode === "botvsbot") && (
			  <div className="flex justify-center gap-2 mt-4 flex-wrap">
				<Button onClick={handleUndo}>Undo</Button>
				<Button onClick={handleRedo}>Redo</Button>
				<Button onClick={resetBoardState}>Reset</Button>

				{!gameStarted ? (
				  <Button
					onClick={() => {
					  setGameStarted(true);
					  setBotPausedUser(false);
					}}
				  >
					▶ Bắt đầu
				  </Button>
				) : botPausedUser ? (
				  <Button onClick={() => setBotPausedUser(false)}>
					▶ Tiếp tục
				  </Button>
				) : (
				  <Button onClick={() => setBotPausedUser(true)}>
					⏸ Tạm dừng
				  </Button>
				)}
			  </div>
			)}


          <div className="text-center text-sm mt-2 text-slate-300">
            Lượt hiện tại: {currentTurn === "w" ? "Trắng" : "Đen"}
            {(mode === "bot" || mode === "botvsbot") && botThinking && " • BOT đang tính…"}
			{(mode === "bot" || mode === "botvsbot") && !gameStarted && " • (Chưa bắt đầu)"}

          </div>
		  
		  {/* BOT INFO PANEL */}
{mode === "bot" && (
  <div className="mt-3 rounded-md border border-slate-700 bg-slate-950/40 p-3 text-sm">
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-300">
      <div>
        <span className="text-slate-400">BOT move:</span>{" "}
        <span className="font-mono">{botInfo?.uci ?? "—"}</span>
      </div>

      <div>
        <span className="text-slate-400">Depth:</span>{" "}
        <span className="font-mono">{botInfo?.depth ?? "—"}</span>
      </div>

      <div>
        <span className="text-slate-400">Nodes:</span>{" "}
        <span className="font-mono">
          {typeof botInfo?.nodes === "number" ? botInfo.nodes.toLocaleString() : "—"}
        </span>
      </div>

      <div>
        <span className="text-slate-400">Time:</span>{" "}
        <span className="font-mono">
          {typeof botInfo?.timeMs === "number" ? `${botInfo.timeMs}ms` : "—"}
        </span>
      </div>

      <div>
        <span className="text-slate-400">Score:</span>{" "}
        <span className="font-mono">
          {typeof botInfo?.scoreCp === "number" ? `${botInfo.scoreCp} cp` : "—"}
        </span>
      </div>
    </div>

    {botInfo?.summary ? (
      <div className="mt-2 text-slate-200">
        <span className="text-slate-400">Ý đồ:</span> {botInfo.summary}
      </div>
    ) : null}

    {botInfo?.pv ? (
      <div className="mt-2 text-slate-200">
        <span className="text-slate-400">PV:</span>{" "}
        <span className="font-mono break-all">{botInfo.pv}</span>
      </div>
    ) : null}
  </div>
)}

        </div>
      </div>

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
