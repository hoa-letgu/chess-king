export function applyXiangqiMove(board, from, to, turn) {
  // from: "a1"
  // to: "a2"
  // turn: "r" | "b"

  // TODO: convert to coordinates
  // TODO: validate move per piece
  // TODO: detect General face-to-face rule
  // TODO: check if move is legal

  return {
    valid: true,
    board: updatedBoard,
    turn: turn === "r" ? "b" : "r",
  };
}
