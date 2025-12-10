export type PieceKey = "P" | "N" | "B" | "R" | "Q" | "K" | "p" | "n" | "b" | "r" | "q" | "k";

export const PIECE_IMG: Record<PieceKey, string> = {
  P: "chess/wp.png",
  N: "chess/wn.png",
  B: "chess/wb.png",
  R: "chess/wr.png",
  Q: "chess/wq.png",
  K: "chess/wk.png",

  p: "chess/bp.png",
  n: "chess/bn.png",
  b: "chess/bb.png",
  r: "chess/br.png",
  q: "chess/bq.png",
  k: "chess/bk.png",
};

export function isPieceKey(x: any): x is PieceKey {
  return typeof x === "string" && x in PIECE_IMG;
}
