import { Move } from "chess.js";

export const killer: Move[][] = Array.from({length:64},()=>[]);
export const history: any = {};

export function order(moves: Move[], ply:number){
  return moves.sort((a,b)=>{
    const ka = killer[ply].some(m=>m.san===a.san)?1000:0;
    const kb = killer[ply].some(m=>m.san===b.san)?1000:0;
    const ha = history[a.san]||0;
    const hb = history[b.san]||0;
    return (kb+hb)-(ka+ha);
  });
}

export function record(move:Move, ply:number){
  killer[ply]=[move,...killer[ply]].slice(0,2);
  history[move.san]=(history[move.san]||0)+1;
}
