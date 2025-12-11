//getMovePath.ts
export function getMovePath(from: string, to: string) {
  const f = coord(from);
  const t = coord(to);

  const path = [];
  const dx = Math.sign(t.c - f.c);
  const dy = Math.sign(t.r - f.r);

  let r = f.r;
  let c = f.c;

  while (r !== t.r || c !== t.c) {
    r += dy;
    c += dx;
    path.push({ r, c });
  }

  return path;
}

function coord(sq: string) {
  const file = "abcdefghi".indexOf(sq[0]);
  const rank = 10 - Number(sq.slice(1));
  return { r: rank, c: file };
}
