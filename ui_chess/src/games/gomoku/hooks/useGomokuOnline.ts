// src/games/gomoku/hooks/useGomokuOnline.ts
import { useEffect } from "react";
import type { Cell } from "../utils/checkWin";

type GomokuRoomState = {
  roomId: string;
  board: Cell[][];
  turn: Cell;
  winner: Cell | null;
  ready: boolean;        // ⭐ ĐỦ 2 NGƯỜI CHƯA
};

export function useGomokuOnline({
  enabled,
  socket,
  roomId,
  setBoard,
  setTurn,
  setWinner,
  setPopup,
  setSeat,
  setRoomReady,          // ⭐ BẮT BUỘC
}: {
  enabled: boolean;
  socket: any;
  roomId: string | null;
  setBoard: (b: Cell[][]) => void;
  setTurn: (t: Cell) => void;
  setWinner: (w: Cell | null) => void;
  setPopup: (p: any) => void;
  setSeat: (s: Cell | null) => void;
  setRoomReady: (r: boolean) => void;
}) {
  useEffect(() => {
    if (!enabled || !socket || !roomId) return;

    /* ================= JOIN SUCCESS ================= */
    const onJoined = ({
      seat,
      state,
    }: {
      seat: Cell;
      state: GomokuRoomState;
    }) => {
      setSeat(seat);
      setBoard(state.board);
      setTurn(state.turn);
      setWinner(state.winner);
      setRoomReady(state.ready);
    };

    /* ================= STATE UPDATE ================= */
    const onState = (state: GomokuRoomState) => {
      setBoard(state.board);
      setTurn(state.turn);
      setWinner(state.winner);
      setRoomReady(state.ready);
    };

    /* ================= ROOM CLOSED ================= */
   const onClosed = ({ message }: { message: string }) => {
	  setPopup({
		type: "info",
		message,
	  });

	  // ⭐ RESET TOÀN BỘ ONLINE STATE
	  setSeat(null);
	  setRoomReady(false);
	  setBoard(createEmptyBoard()); // xem bên dưới
	  setTurn("X");
	  setWinner(null);
	};


    /* ================= REGISTER ================= */
    socket.on("gomoku:room:joined", onJoined);
    socket.on("gomoku:state", onState);
    socket.on("gomoku:room:closed", onClosed);

    /* ================= EMIT JOIN (CHỈ 1 LẦN) ================= */
    socket.emit("gomoku:room:join", { roomId });

    return () => {
      socket.off("gomoku:room:joined", onJoined);
      socket.off("gomoku:state", onState);
      socket.off("gomoku:room:closed", onClosed);
    };
  }, [enabled, socket, roomId]);
}
