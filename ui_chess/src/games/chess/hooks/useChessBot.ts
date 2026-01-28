// src/games/chess/hooks/useChessBot.ts
import { useEffect, useRef } from "react";
import { Chess } from "chess.js";
import { createEngineCache, findBestMoveTS } from "@/games/chess/utils/tsEngine";

const isInCheck = (g: any) => (g.isCheck?.() ?? g.inCheck?.() ?? false);

type UseChessBotArgs = {
  mode: "bot" | "online";
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
  botPlaysWhite?: boolean;
  resetKey?: number; // đổi khi reset để clear cache
  setBotInfo?: (info: any) => void; // ✅ show info lên UI
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
  timeLimitMs = 300,
  botPlaysWhite = true,
  resetKey = 0,
  setBotInfo, // ✅ IMPORTANT: destructure
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
    botPlaysWhite,
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
      botPlaysWhite,
    };
  }, [mode, playerColor, botDepth, fen, history, historyIndex, botPaused, timeLimitMs, botPlaysWhite]);

  useEffect(() => {
    if (tRef.current) {
      window.clearTimeout(tRef.current);
      tRef.current = null;
    }

    if (mode !== "bot") return;
    if (isUndoingRef?.current) return;
    if (botPaused) return;

    try {
      game.load(fen);
    } catch {
      return;
    }
    if (game.isGameOver()) return;

    const botColor: "w" | "b" = botPlaysWhite ? "w" : "b";
    if (game.turn() !== botColor) return;

    if (thinkingRef.current) return;

    thinkingRef.current = true;
    setBotThinking(true);

    tRef.current = window.setTimeout(() => {
      tRef.current = null;

      const latest = latestRef.current;

      if (latest.mode !== "bot" || latest.botPaused || isUndoingRef?.current) {
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

        const depth = Math.max(1, Math.min(1000, latest.botDepth));

		// ví dụ: depth 6 ~ 900ms–1400ms tuỳ máy
		const timeLimitMs = Math.min(
		  latest.timeLimitMs ?? 1200,
		  350 + depth * 180
		);


		const result = findBestMoveTS(clone, {
		  maxDepth: depth,
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
    botPlaysWhite,
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
