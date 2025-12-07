import React, { useRef, useState } from "react";
import { Chess } from "chess.js";
import { ChessBoard } from "@/components/ChessBoard";
import { useChessBot } from "@/hooks/useChessBot";
import { useOnlineRoom } from "@/hooks/useOnlineRoom";
import { useSocket } from "@/context/SocketProvider";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

const START_FEN = new Chess().fen();

export default function App() {
  const socket = useSocket();
  const gameRef = useRef(new Chess());

  const [mode, setMode] = useState<"bot" | "online">("bot");
  const [fen, setFen] = useState(START_FEN);
  const [history, setHistory] = useState([START_FEN]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [legalTargets, setLegalTargets] = useState<string[]>([]);



  const [status, setStatus] = useState("Lượt: Trắng");
  const [botThinking, setBotThinking] = useState(false);
  const [botDepth, setBotDepth] = useState(3);
  const [playerColor, setPlayerColor] = useState<"w" | "b">("w");

  const [roomId, setRoomId] = useState("");
  const [connected, setConnected] = useState(false);
  const [onlineColor, setOnlineColor] = useState<"w" | "b" | null>(null);
  //const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [capturedPiece, setCapturedPiece] = useState<{
	  square: string;
	  piece: string;
	} | null>(null);
  const [lastMove, setLastMove] = useState(null);

const [hidePiece, setHidePiece] = useState<string | null>(null);

  //const [movingPiece, setMovingPiece] = useState(null);
  const [movingPiece, setMovingPiece] = useState<{
	  piece: string;
	  from: string;
	  to: string;
	} | null>(null);


  // ==============================
  // BOT logic
  // ==============================
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

  // ==============================
  // ONLINE logic
  // ==============================
 useOnlineRoom({
  mode,
  socket,
  roomId,
  setConnected,
  setOnlineColor,
  setFen,
  setHistory,
  setHistoryIndex,
  setLastMove,     // ⭐ THÊM NÈ!
  resetBoard: () => {
    setSelectedSquare(null);
    setLegalTargets([]);
  },
});


  const pushState = (newFen, newHistory, newIndex, emit = true, lastMoveSend = null) => {
  setFen(newFen);
  setHistory(newHistory);
  setHistoryIndex(newIndex);

	 if (mode === "online" && emit && socket && roomId) {
	  socket.emit("game:state", {
		roomId,
		fen: newFen,
		history: newHistory,
		historyIndex: newIndex,
		lastMove: lastMoveSend,
	  });
	}


};
// CHUYỂN Ô CỜ → TỌA ĐỘ %
const squareToXY = (sq: string) => {
  const file = sq[0];
  const rank = Number(sq[1]);
  return {
    x: "abcdefgh".indexOf(file) * 12.5,
    y: (8 - rank) * 12.5,
  };
};


  // ==============================
  // User click move
  // ==============================
 const handleSquareClick = (square: string) => {
  const game = gameRef.current;
  game.load(fen);

  if (game.isGameOver()) return;

  if (mode === "bot" && game.turn() !== playerColor) return;
  if (mode === "online" && onlineColor && game.turn() !== onlineColor) return;

  // ============================
  // 1) chọn quân lần đầu
  // ============================
  if (!selectedSquare) {
    const piece = game.get(square);
    if (!piece || piece.color !== game.turn()) return;

    setSelectedSquare(square);
    const moves = game.moves({ square, verbose: true });
    setLegalTargets(moves.map(m => m.to));
    return;
  }

  const from = selectedSquare;
  const to = square;

  const moves = game.moves({ square: from, verbose: true });
  const move = moves.find(m => m.to === to);

  if (!move) {
    setSelectedSquare(null);
    setLegalTargets([]);
    return;
  }

  // ============================
  // 2) Promotion?
  // ============================
  const piece = game.get(from);
  let promotion = undefined;

  if (piece.type === "p" && (to[1] === "1" || to[1] === "8")) {
    promotion = "q"; // tạm thời
  }

  // =============================
  // 3) Animation chuẩn (KHÔNG MOVE)
  // =============================
  const movingPieceKey =
    piece.color === "w" ? piece.type.toUpperCase() : piece.type;

  setHidePiece(from);                 // ẩn quân thật ở ô from
  setMovingPiece({ piece: movingPieceKey, from, to });  // render hình bay

  // reset click UI
  setSelectedSquare(null);
  setLegalTargets([]);

  // =============================
  // 4) Sau animation → mới move
  // =============================
  setTimeout(() => {
    const newGame = new Chess(fen);
    const made = newGame.move({ from, to, promotion });
    if (!made) {
      setMovingPiece(null);
      setHidePiece(null);
      return;
    }

    // ============================
    // 5) Kiểm tra vua bị chiếu
    // ============================
    let kingSq = null;
    if (newGame.inCheck()) {
      const b = newGame.board();
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const p = b[r][c];
          if (p && p.type === "k" && p.color === newGame.turn()) {
            kingSq = "abcdefgh"[c] + (8 - r);
          }
        }
      }
    }

    setLastMove({ from, to, inCheckSquare: kingSq });

    // ============================
    // 6) Cập nhật FEN & history
    // ============================
    const newFen = newGame.fen();
    const newHistory = [...history.slice(0, historyIndex + 1), newFen];

    pushState(newFen, newHistory, newHistory.length - 1, true, { from, to });

    // ============================
    // 7) Cleanup – animation xong
    // ============================
    setMovingPiece(null);
    setHidePiece(null);

  }, 100); // thời gian animation
};


  // ==============================
  // Undo/Redo/Reset
  // ==============================
  const handleUndo = () => {
    if (historyIndex === 0) return;
    const idx = historyIndex - 1;
    gameRef.current.load(history[idx]);
    pushState(history[idx], history, idx);
  };

  const handleRedo = () => {
    if (historyIndex >= history.length - 1) return;
    const idx = historyIndex + 1;
    gameRef.current.load(history[idx]);
    pushState(history[idx], history, idx);
  };

  const handleReset = () => {
    const game = new Chess();
    gameRef.current = game;
    const fen = game.fen();
    pushState(fen, [fen], 0);
  };

  const currentTurn = gameRef.current.turn();
  const youAreColor = mode === "bot" ? playerColor : onlineColor ?? undefined;

  // ==============================
  // Render UI
  // ==============================
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-5xl bg-slate-900/80 border-slate-700">

        <CardHeader>
          <CardTitle className="flex justify-between">
            ♟️ Game Cờ Vua – React + Socket.IO
            <span className="text-sm text-slate-400">
              Chế độ: {mode === "bot" ? "Chơi với BOT" : "Online realtime"}
            </span>
          </CardTitle>
        </CardHeader>

        <CardContent className="grid grid-cols-1 md:grid-cols-[2fr,1fr] gap-6">

          {/* Bàn cờ */}
          <div className="flex flex-col items-center gap-4">
          <ChessBoard
			  board={gameRef.current.board()}
			  selectedSquare={selectedSquare}
			  selectedSquare={selectedSquare}
			  legalTargets={legalTargets}
			  lastMove={lastMove}
			  capturedPiece={capturedPiece}
			  movingPiece={movingPiece}
			  onClick={handleSquareClick}
			/>



            <div className="flex gap-2">
              <Button onClick={handleUndo}>⏪ Undo</Button>
              <Button onClick={handleRedo}>⏩ Redo</Button>
              <Button onClick={handleReset}>🔄 Ván mới</Button>
            </div>

            <div className="text-sm text-slate-300">
              {status}
              {mode === "bot" && botThinking && <span> – BOT đang suy nghĩ…</span>}
            </div>
          </div>

          {/* Control Panel */}
          <div className="flex flex-col gap-4">

            {/* Chọn Mode */}
            <div className="space-y-1">
              <div>Chế độ chơi</div>
              <Select value={mode} onValueChange={(v) => setMode(v as any)}>
                <SelectTrigger className="text-white" >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bot">Chơi với BOT</SelectItem>
                  <SelectItem value="online">Online 2 người</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Mode BOT */}
            {mode === "bot" && (
              <>
                <div className="space-y-1">
                  <div>Màu của bạn</div>
                  <Select
                    value={playerColor}
                    onValueChange={(v) => {
                      setPlayerColor(v as any);
                      handleReset();
                    }}
                  >
                    <SelectTrigger className="text-white" ><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="w">Trắng</SelectItem>
                      <SelectItem value="b">Đen</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <div>Độ mạnh BOT</div>
                  <Select
                    value={String(botDepth)}
                    onValueChange={(v) => setBotDepth(Number(v))}
                  >
                    <SelectTrigger className="text-white" ><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Yếu</SelectItem>
                      <SelectItem value="2">Vừa</SelectItem>
                      <SelectItem value="3">Mạnh</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* Mode Online */}
            {mode === "online" && (
              <>
                <div className="space-y-1">
                  <div>Room ID</div>
                  <div className="flex gap-2">
                    <Input value={roomId} onChange={(e) => setRoomId(e.target.value)} />
                    <Button onClick={() => socket.emit("room:join", { roomId })}>Join</Button>
                  </div>
                  <div className="text-xs">
                    Server: {connected ? "Đã kết nối" : "Mất kết nối"}
                    {onlineColor && <> – Bạn là {onlineColor === "w" ? "Trắng" : "Đen"}</>}
                  </div>
                </div>
              </>
            )}

            <div className="text-xs border-t pt-2">
              Lượt hiện tại: <b>{currentTurn === "w" ? "Trắng" : "Đen"}</b>
              {youAreColor && <> – Bạn là <b>{youAreColor === "w" ? "Trắng" : "Đen"}</b></>}
            </div>

          </div>
        </CardContent>
      </Card>
    </div>
  );
}
