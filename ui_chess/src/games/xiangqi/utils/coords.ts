// src/games/xiangqi/utils/coords.ts

export function squareToCoord(square: string): [number, number] {
  const files = "abcdefghi";
  const file = files.indexOf(square[0]);
  const rank = Number(square.slice(1)); // 1..10
  const r = 10 - rank; // hàng 10 là r=0
  const c = file;
  return [r, c];
}

export function coordToSquare(r: number, c: number): string {
  const files = "abcdefghi";
  const file = files[c];
  const rank = 10 - r;
  return `${file}${rank}`;
}
