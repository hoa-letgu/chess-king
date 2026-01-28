export type TTEntry = {
  depth: number;
  score: number;
  flag: "EXACT"|"ALPHA"|"BETA";
};

export const TT = new Map<number, TTEntry>();

export function ttGet(key:number, depth:number, alpha:number, beta:number){
  const e = TT.get(key);
  if(!e || e.depth < depth) return null;
  if(e.flag==="EXACT") return e.score;
  if(e.flag==="ALPHA" && e.score<=alpha) return alpha;
  if(e.flag==="BETA" && e.score>=beta) return beta;
  return null;
}

export function ttPut(
  key:number, depth:number, score:number, alpha:number, beta:number
){
  let flag:"EXACT"|"ALPHA"|"BETA"="EXACT";
  if(score<=alpha) flag="ALPHA";
  else if(score>=beta) flag="BETA";
  TT.set(key,{depth,score,flag});
}
