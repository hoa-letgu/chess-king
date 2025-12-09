import { useEffect, useState, useRef } from "react";
import { Chess } from "chess.js";
import { randomUUID } from "@/utils/id";

export function useRoomSocket(socket: any) {
  const [mode, setMode] = useState<"bot" | "online">("bot");
  const [showSettings, setShowSettings] = useState(true);

  const [roomId, setRoomId] = useState("");
  const [onlineColor, setOnlineColor] = useState<"w" | "b" | null>(null);
  const [popup, setPopup] = useState<any>({ type: null });

  const isJoiningRef = useRef(false);
  const lastLocalMoveIdRef = useRef<string | null>(null);

  // ===============================
  // GAME STATES
  // ===============================
  const [fen, setFen] = useState(new Chess().fen());
  const [history, setHistory] = useState([new Chess().fen()]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // ===============================
  // RESET GAME
  // ===============================
  const resetFullGame = () => {
    const g = new Chess();
    const f = g.fen();

    setFen(f);
    setHistory([f]);
    setHistoryIndex(0);
    setOnlineColor(null);
  };

  const resetMatchOnly = () => {
    const g = new Chess();
    const f = g.fen();

    setFen(f);
    setHistory([f]);
    setHistoryIndex(0);
  };

  // ===============================
  // PUSH STATE
  // ===============================
  const pushState = (newFen: string, newHistory: string[], newIndex: number, emit = true, lastMove: any = null) => {
    const moveId = randomUUID();
    lastLocalMoveIdRef.current = moveId;

    setFen(newFen);
    setHistory(newHistory);
    setHistoryIndex(newIndex);

    if (mode === "online" && emit && socket && roomId) {
      socket.emit("game:state", {
        roomName: roomId,
        fen: newFen,
        history: newHistory,
        historyIndex: newIndex,
        lastMove,
        moveId,
      });
    }
  };

  // ===============================
  // SOCKET HANDLING
  // ===============================
  useEffect(() => {
    if (!socket) return;

    socket.on("room:created", ({ roomName }) => {
      setPopup({
        type: "info",
        message: `Tạo phòng thành công: ${roomName}`,
        onAccept: () => {
          setPopup({ type: null });
          setRoomId(roomName);
          socket.emit("room:join", { roomName });
          setShowSettings(false);
        },
      });
    });

    socket.on("room:full", () => {
      setPopup({
        type: "info",
        message: "Phòng đã đủ 2 người!",
        onAccept: () => setPopup({ type: null }),
      });
    });

    socket.on("room:joined", (payload) => {
      isJoiningRef.current = true;

      setOnlineColor(payload.color);
      setFen(payload.fen);
      setHistory(payload.history);
      setHistoryIndex(payload.historyIndex);

      setTimeout(() => (isJoiningRef.current = false), 200);
    });

    socket.on("game:update", (payload) => {
      if (payload.moveId === lastLocalMoveIdRef.current) return;

      setFen(payload.fen);
      setHistory(payload.history);
      setHistoryIndex(payload.historyIndex);
    });

    socket.on("room:left", () => {
      resetFullGame();
      setRoomId("");
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
        message: "Đối thủ đã rời phòng!",
        onAccept: () => setPopup({ type: null }),
      });
    });

    socket.on("draw:offer:received", () => {
      setPopup({
        type: "drawConfirm",
        message: "Đối thủ đề nghị hòa. Bạn có đồng ý?",
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
      setPopup({
        type: "info",
        message: "Hòa!",
        onAccept: () => {
          resetMatchOnly();
          setPopup({ type: null });
        },
      });
    });

    socket.on("draw:rejected", () => {
      setPopup({
        type: "info",
        message: "Đối thủ từ chối hòa.",
        onAccept: () => setPopup({ type: null }),
      });
    });

    return () => {
      socket.off("room:created");
      socket.off("room:joined");
      socket.off("room:full");
      socket.off("draw:offer:received");
      socket.off("draw:accepted");
      socket.off("draw:rejected");
      socket.off("game:update");
      socket.off("room:left");
      socket.off("room:opponent-left");
    };
  }, [socket, roomId]);

  return {
    mode,
    setMode,
    roomId,
    setRoomId,
    popup,
    setPopup,
    showSettings,
    setShowSettings,
    onlineColor,

    gameState: {
      fen,
      history,
      historyIndex,
      setFen,
      setHistory,
      setHistoryIndex,
    },

    pushState,
    resetFullGame,
    resetMatchOnly,
  };
}
