import { Chess } from "chess.js";

const RAND = () => Math.floor(Math.random() * 2 ** 32);

export const Z_PIECE: any = {};
export let Z_TURN = RAND();

["p","n","b","r","q","k"].forEach(p=>{
  Z_PIECE[p]={ w:[], b:[] };
  for(let i=0;i<64;i++){
    Z_PIECE[p].w[i]=RAND();
    Z_PIECE[p].b[i]=RAND();
  }
});

export function hash(game: Chess): number {
  let h = 0;
  const b = game.board();
  for (let r=0;r<8;r++)
    for (let c=0;c<8;c++){
      const p = b[r][c];
      if(!p) continue;
      h ^= Z_PIECE[p.type][p.color][r*8+c];
    }
  if(game.turn()==="w") h ^= Z_TURN;
  return h >>> 0;
}
