export type TTFlag = "EXACT" | "LOWER" | "UPPER";

export interface TTEntry {
  depth: number;
  score: number;
  flag: TTFlag;
}

export const TT = new Map<string, TTEntry>();
