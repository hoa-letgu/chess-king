// src/games/go/utils/rules.ts

export type Stone = "black" | "white" | null;
export type Board = Stone[][];

export function opposite(s: Exclude<Stone, null>): Exclude<Stone, null> {
  return s === "black" ? "white" : "black";
}


export function createBoard(size: number): Board {
  return Array.from({ length: size }, () =>
    Array.from({ length: size }, () => null)
  );
}
