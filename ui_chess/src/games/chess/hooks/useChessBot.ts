// src/games/chess/hooks/useChessBot.ts
import { useEffect, useRef } from "react";
import { Chess } from "chess.js";
import { createEngineCache, findBestMoveTS } from "@/games/chess/utils/tsEngine";

const isInCheck = (g: any) => (g.isCheck?.() ?? g.inCheck?.() ?? false);

type UseChessBotArgs = {
  mode: "bot" | "online" | "botvsbot";
  playerColor: "w" | "b";
  botDepth: number;
  fen: string;
  game: Chess;
  history: string[];
  historyIndex: number;
  setFen: (v: string) => void;
  setHistory: (v: string[]) => void;
  setHistoryIndex: (v: number) => void;
  botThinking: boolean;
  setBotThinking: (v: boolean) => void;
  setLastMove: (v: any) => void;
  isUndoingRef?: React.MutableRefObject<boolean>;
  botPaused: boolean;
  timeLimitMs?: number;

  botSide?: "w" | "b" | "both";   // ✅ NEW
  resetKey?: number;
  setBotInfo?: (info: any) => void;
};


export function useChessBot({
  mode,
  playerColor,
  botDepth,
  fen,
  game,
  history,
  historyIndex,
  setFen,
  setHistory,
  setHistoryIndex,
  setBotThinking,
  setLastMove,
  isUndoingRef,
  botPaused,
  timeLimitMs = 3600,
  botSide = "b",          // ✅ default
  resetKey = 0,
  setBotInfo,
}: UseChessBotArgs) {

  const tRef = useRef<number | null>(null);

  // khóa chống chạy lặp
  const thinkingRef = useRef(false);

  // cache engine: TT/history/killers sống xuyên suốt
  const cacheRef = useRef(createEngineCache());

  // reset ván → clear cache + clear botInfo
  useEffect(() => {
    cacheRef.current = createEngineCache();
    thinkingRef.current = false;
    setBotThinking(false);
    setBotInfo?.(null);
  }, [resetKey, setBotThinking, setBotInfo]);

    // giữ bản mới nhất để tránh stale closure
	const latestRef = useRef({
	  mode,
	  playerColor,
	  botDepth,
	  fen,
	  history,
	  historyIndex,
	  botPaused,
	  timeLimitMs,
	  botSide,
	});

	useEffect(() => {
	  latestRef.current = {
		mode,
		playerColor,
		botDepth,
		fen,
		history,
		historyIndex,
		botPaused,
		timeLimitMs,
		botSide,
	  };
	}, [mode, playerColor, botDepth, fen, history, historyIndex, botPaused, timeLimitMs, botSide]);


  useEffect(() => {
    if (tRef.current) {
      window.clearTimeout(tRef.current);
      tRef.current = null;
    }

    if (mode !== "bot" && mode !== "botvsbot") return;
	if (isUndoingRef?.current) return;
	if (botPaused) return;

	try { game.load(fen); } catch { return; }
	if (game.isGameOver()) return;

	const side = botSide; // "w" | "b" | "both"
	if (side !== "both") {
	  if (game.turn() !== side) return;
	}
	// side === "both" => bot đánh bất kể lượt trắng/đen


    if (thinkingRef.current) return;

    thinkingRef.current = true;
    setBotThinking(true);

    tRef.current = window.setTimeout(() => {
      tRef.current = null;

      const latest = latestRef.current;

      if ((latest.mode !== "bot" && latest.mode !== "botvsbot") || latest.botPaused || isUndoingRef?.current) {

		  thinkingRef.current = false;
		  setBotThinking(false);
		  return;
		}


      // fen đã đổi → bỏ lượt này
      if (latest.fen !== fen) {
        thinkingRef.current = false;
        setBotThinking(false);
        return;
      }

      const clone = new Chess(latest.fen);

       const depth = Math.max(1, Math.min(20, latest.botDepth)); // 20 là đủ, 1000 vô nghĩa

		// đảm bảo đủ thời gian cho depth 6
		const minTimeForDepth = 350 + depth * 180;

		// nếu người dùng set timeLimitMs thấp quá, vẫn nâng lên tối thiểu
		const timeLimitMs = Math.max(latest.timeLimitMs ?? 1200, minTimeForDepth);



		const result = findBestMoveTS(clone, {
			  maxDepth: depth,
			  preferDepth: 6,
			  timeLimitMs,
			  cache: cacheRef.current,
			});



      const best = result.move;
      if (!best) {
        thinkingRef.current = false;
        setBotThinking(false);
        return;
      }

      // ✅ SHOW INFO LÊN UI (đúng format bạn muốn)
      const uci = `${best.from}${best.to}${(best as any).promotion ?? ""}`;
      const pv =
        Array.isArray(result.pvUci) ? result.pvUci.join(" ") :
        Array.isArray(result.pv) ? result.pv.join(" ") :
        ""; // fallback nếu bạn chưa implement PV

      setBotInfo?.({
        uci,
        summary: result.summary ?? "",      // nếu chưa có summary thì để ""
        pv,                                  // PV string
        depth: result.depthReached ?? 0,
        nodes: result.nodes ?? 0,
        timeMs: result.timeMs ?? 0,
        scoreCp: result.scoreCp ?? 0,
      });

      // Apply lên game thật
      const moveResult = game.move({
        from: best.from,
        to: best.to,
        promotion: (best as any).promotion ?? "q",
      });

      if (!moveResult) {
        console.error("BOT tạo nước sai:", best);
        thinkingRef.current = false;
        setBotThinking(false);
        return;
      }

      // vua bị chiếu?
      let kingSq: string | null = null;
      if (isInCheck(game)) {
        const b = game.board();
        for (let r = 0; r < 8; r++) {
          for (let c = 0; c < 8; c++) {
            const p = b[r][c];
            if (p && p.type === "k" && p.color === game.turn()) {
              kingSq = "abcdefgh"[c] + (8 - r);
            }
          }
        }
      }

      setLastMove({
        from: moveResult.from,
        to: moveResult.to,
        inCheckSquare: kingSq,
      });

      const newFen = game.fen();
      const newHistory = [...latest.history.slice(0, latest.historyIndex + 1), newFen];

      setFen(newFen);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);

      thinkingRef.current = false;
      setBotThinking(false);
    }, 150);

    return () => {
      if (tRef.current) {
        window.clearTimeout(tRef.current);
        tRef.current = null;
      }
    };
  }, [
    fen,
    mode,
    botPaused,
    playerColor,
    botDepth,
    timeLimitMs,
    botSide,
    game,
    isUndoingRef,
    setBotThinking,
    setFen,
    setHistory,
    setHistoryIndex,
    setLastMove,
    setBotInfo, // ✅ add dependency
  ]);
}
