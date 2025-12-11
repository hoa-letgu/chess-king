// src/games/xiangqi/utils/pieces.ts

// QUY ƯỚC:
// - Chữ HOA  = ĐỎ  (red side, thường ở phía dưới màn hình)
// - Chữ thường = ĐEN (black side, phía trên)
//
// G  / g  = General (Tướng)
// A  / a  = Advisor (Sĩ)
// E  / e  = Elephant (Tượng)
// H  / h  = Horse (Mã)
// R  / r  = Chariot (Xe)
// C  / c  = Cannon (Pháo)
// S  / s  = Soldier (Tốt)

export type XiangqiPieceKey =
  | "G" | "A" | "E" | "H" | "R" | "C" | "S"   // RED
  | "g" | "a" | "e" | "h" | "r" | "c" | "s";  // BLACK

export const XIANGQI_PIECE_IMG: Record<XiangqiPieceKey, string> = {
  // RED
  G: "xiangqi/General_red.png",
  A: "xiangqi/Advisor_red.png",
  E: "xiangqi/Elephant_red.png",
  H: "xiangqi/Horse_red.png",
  R: "xiangqi/Chariot_red.png",
  C: "xiangqi/Cannon_red.png",
  S: "xiangqi/Soldier_red.png",

  // BLACK
  g: "xiangqi/General_black.png",
  a: "xiangqi/Advisor_black.png",
  e: "xiangqi/Elephant_black.png",
  h: "xiangqi/Horse_black.png",
  r: "xiangqi/Chariot_black.png",
  c: "xiangqi/Cannon_black.png",
  s: "xiangqi/Soldier_black.png",
};

export function isXiangqiPieceKey(x: any): x is XiangqiPieceKey {
  return typeof x === "string" && x in XIANGQI_PIECE_IMG;
}
