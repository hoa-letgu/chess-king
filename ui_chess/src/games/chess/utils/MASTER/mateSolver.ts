import { Chess, Move } from "chess.js";

export function mateIn(game:Chess, depth:number): Move|null {
  if(depth===0) return null;
  const moves = game.moves({verbose:true}) as Move[];

  for(const m of moves){
    game.move(m);
    if(game.isCheckmate()){
      game.undo();
      return m;
    }
    const opp = mateIn(game, depth-1);
    game.undo();
    if(!opp) return m;
  }
  return null;
}
