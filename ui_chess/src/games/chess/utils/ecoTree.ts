// ==========================================
// src/games/chess/utils/ecoTree.ts
// ECO Opening Database (Main Lines)
// ==========================================

export type EcoFamily = "A" | "B" | "C" | "D" | "E";

export interface EcoOpening {
  eco: string;        // ví dụ: "B90"
  name: string;       // ví dụ: "Sicilian Defense, Najdorf"
  family: EcoFamily;  // A / B / C / D / E
  moves: string[];    // main line tiêu biểu
  tags?: string[];    // optional: ["e4", "sicilian", "aggressive"]
}

/**
 * Gợi ý dùng:
 * - Hiển thị tên khai cuộc theo FEN / history:
 *   -> so sánh prefix moves với lịch sử ván cờ.
 * - Làm nguồn dữ liệu cho embedding: eco + name + moves.
 */
export const ecoOpenings: EcoOpening[] = [
  // ======================================================
  // A–CODES: Flank Openings, English, Reti, Dutch, etc.
  // ======================================================

  {
    eco: "A00",
    name: "Uncommon Opening (Irregular)",
    family: "A",
    moves: ["b3"],
    tags: ["irregular", "flank"]
  },
  {
    eco: "A01",
    name: "Nimzowitsch-Larsen Attack",
    family: "A",
    moves: ["b3", "e4", "Bb2"],
    tags: ["flank", "hypermodern"]
  },
  {
    eco: "A02",
    name: "Bird Opening",
    family: "A",
    moves: ["f4"],
    tags: ["flank", "gambit-ideas"]
  },
  {
    eco: "A04",
    name: "Reti Opening",
    family: "A",
    moves: ["Nf3", "d5", "c4"],
    tags: ["flank", "reti"]
  },

  // ---- English Opening ----
  {
    eco: "A20",
    name: "English Opening",
    family: "A",
    moves: ["c4", "e5"],
    tags: ["english", "flank"]
  },
  {
    eco: "A26",
    name: "English, Closed System",
    family: "A",
    moves: ["c4", "e5", "Nc3", "Nc6", "g3"],
    tags: ["english", "closed"]
  },
  {
    eco: "A28",
    name: "English, Four Knights",
    family: "A",
    moves: ["c4", "e5", "Nc3", "Nf6", "Nf3", "Nc6"],
    tags: ["english", "four-knights"]
  },
  {
    eco: "A30",
    name: "English, Symmetrical",
    family: "A",
    moves: ["c4", "c5"],
    tags: ["english", "symmetrical"]
  },

  // ---- Dutch Defense vs 1.d4 / 1.c4 ----
  {
    eco: "A80",
    name: "Dutch Defense",
    family: "A",
    moves: ["d4", "f5"],
    tags: ["dutch", "d4", "aggressive"]
  },
  {
    eco: "A82",
    name: "Dutch, Classical",
    family: "A",
    moves: ["d4", "f5", "c4", "Nf6", "Nc3", "e6", "Nf3", "Be7"],
    tags: ["dutch", "classical"]
  },

  // ======================================================
  // B–CODES: Semi-Open Games: Pirc, Caro-Kann, Alekhine, Sicilian,...
  // ======================================================

  // ---- Scandinavian / Center Counter ----
  {
    eco: "B01",
    name: "Scandinavian Defense",
    family: "B",
    moves: ["e4", "d5", "exd5", "Qxd5", "Nc3"],
    tags: ["e4", "scandinavian"]
  },

  // ---- Alekhine ----
  {
    eco: "B02",
    name: "Alekhine Defense",
    family: "B",
    moves: ["e4", "Nf6"],
    tags: ["e4", "hypermodern"]
  },

  // ---- Pirc / Modern ----
  {
    eco: "B07",
    name: "Pirc Defense",
    family: "B",
    moves: ["e4", "d6", "d4", "Nf6", "Nc3", "g6"],
    tags: ["e4", "pirc", "hypermodern"]
  },
  {
    eco: "B06",
    name: "Modern Defense",
    family: "B",
    moves: ["e4", "g6", "d4", "Bg7"],
    tags: ["modern", "hypermodern"]
  },

  // ---- Caro-Kann ----
  {
    eco: "B10",
    name: "Caro-Kann Defense",
    family: "B",
    moves: ["e4", "c6"],
    tags: ["e4", "solid"]
  },
  {
    eco: "B12",
    name: "Caro-Kann, Advance Variation",
    family: "B",
    moves: ["e4", "c6", "d4", "d5", "e5"],
    tags: ["e4", "caro-kann", "advance"]
  },
  {
    eco: "B18",
    name: "Caro-Kann, Classical",
    family: "B",
    moves: ["e4", "c6", "d4", "d5", "Nc3", "dxe4", "Nxe4", "Bf5"],
    tags: ["e4", "caro-kann", "classical"]
  },

  // ---- Sicilian family ----
  {
    eco: "B20",
    name: "Sicilian Defense",
    family: "B",
    moves: ["e4", "c5"],
    tags: ["e4", "sicilian"]
  },
  {
    eco: "B22",
    name: "Sicilian, Alapin",
    family: "B",
    moves: ["e4", "c5", "c3"],
    tags: ["sicilian", "anti-sicilian"]
  },
  {
    eco: "B23",
    name: "Sicilian, Closed",
    family: "B",
    moves: ["e4", "c5", "Nc3"],
    tags: ["sicilian", "closed"]
  },
  {
    eco: "B30",
    name: "Sicilian Defense, Rossolimo / Sveshnikov start",
    family: "B",
    moves: ["e4", "c5", "Nf3", "Nc6"],
    tags: ["sicilian"]
  },
  {
    eco: "B33",
    name: "Sicilian Defense, Sveshnikov",
    family: "B",
    moves: ["e4", "c5", "Nf3", "Nc6", "d4", "cxd4", "Nxd4", "e5"],
    tags: ["sicilian", "sveshnikov", "sharp"]
  },
  {
    eco: "B40",
    name: "Sicilian Defense, Kan",
    family: "B",
    moves: ["e4", "c5", "Nf3", "e6", "d4", "cxd4", "Nxd4", "a6"],
    tags: ["sicilian", "kan"]
  },
  {
    eco: "B50",
    name: "Sicilian Defense, Scheveningen",
    family: "B",
    moves: ["e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "e6"],
    tags: ["sicilian", "scheveningen"]
  },
  {
    eco: "B70",
    name: "Sicilian Defense, Dragon",
    family: "B",
    moves: ["e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "g6"],
    tags: ["sicilian", "dragon", "aggressive"]
  },
  {
    eco: "B90",
    name: "Sicilian Defense, Najdorf",
    family: "B",
    moves: ["e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "a6"],
    tags: ["sicilian", "najdorf", "sharp"]
  },

  // ======================================================
  // C–CODES: Open Games (e4 e5), Ruy Lopez, French, etc.
  // ======================================================

  // ---- French Defense ----
  {
    eco: "C00",
    name: "French Defense",
    family: "C",
    moves: ["e4", "e6"],
    tags: ["e4", "french"]
  },
  {
    eco: "C02",
    name: "French, Advance Variation",
    family: "C",
    moves: ["e4", "e6", "d4", "d5", "e5"],
    tags: ["french", "advance"]
  },
  {
    eco: "C05",
    name: "French, Tarrasch",
    family: "C",
    moves: ["e4", "e6", "d4", "d5", "Nd2"],
    tags: ["french", "tarrasch"]
  },
  {
    eco: "C11",
    name: "French, Classical",
    family: "C",
    moves: ["e4", "e6", "d4", "d5", "Nc3", "Nf6"],
    tags: ["french", "classical"]
  },
  {
    eco: "C18",
    name: "French, Winawer",
    family: "C",
    moves: ["e4", "e6", "d4", "d5", "Nc3", "Bb4"],
    tags: ["french", "winawer", "sharp"]
  },

  // ---- Open Games (e4 e5), Italian, Scotch, Ruy Lopez ----
  {
    eco: "C20",
    name: "King's Pawn Game",
    family: "C",
    moves: ["e4", "e5"],
    tags: ["open-game"]
  },
  {
    eco: "C44",
    name: "Scotch Game",
    family: "C",
    moves: ["e4", "e5", "Nf3", "Nc6", "d4"],
    tags: ["open-game", "scotch"]
  },
  {
    eco: "C50",
    name: "Italian Game",
    family: "C",
    moves: ["e4", "e5", "Nf3", "Nc6", "Bc4"],
    tags: ["open-game", "italian"]
  },
  {
    eco: "C55",
    name: "Two Knights Defense",
    family: "C",
    moves: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Nf6"],
    tags: ["open-game", "two-knights"]
  },
  {
    eco: "C60",
    name: "Ruy Lopez",
    family: "C",
    moves: ["e4", "e5", "Nf3", "Nc6", "Bb5"],
    tags: ["open-game", "ruy-lopez"]
  },
  {
    eco: "C65",
    name: "Ruy Lopez, Berlin Defense",
    family: "C",
    moves: ["e4", "e5", "Nf3", "Nc6", "Bb5", "Nf6"],
    tags: ["ruy-lopez", "berlin", "solid"]
  },
  {
    eco: "C88",
    name: "Ruy Lopez, Closed",
    family: "C",
    moves: ["e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "Ba4", "Nf6", "O-O", "Be7"],
    tags: ["ruy-lopez", "closed"]
  },
  {
    eco: "C95",
    name: "Ruy Lopez, Breyer",
    family: "C",
    moves: ["e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "Ba4", "Nf6", "O-O", "Be7", "Re1", "b5", "Bb3", "d6", "c3", "O-O", "h3", "Nb8"],
    tags: ["ruy-lopez", "breyer"]
  },

  // ======================================================
  // D–CODES: Closed Games, Queen’s Gambit, Slav, Grünfeld
  // ======================================================

  // ---- QGD / QGA / Slav ----
  {
    eco: "D06",
    name: "Queen's Gambit",
    family: "D",
    moves: ["d4", "d5", "c4"],
    tags: ["d4", "queens-gambit"]
  },
  {
    eco: "D10",
    name: "Slav Defense",
    family: "D",
    moves: ["d4", "d5", "c4", "c6"],
    tags: ["d4", "slav"]
  },
  {
    eco: "D15",
    name: "Slav Defense, Main Line",
    family: "D",
    moves: ["d4", "d5", "c4", "c6", "Nf3", "Nf6", "Nc3", "dxc4"],
    tags: ["d4", "slav"]
  },
  {
    eco: "D20",
    name: "Queen's Gambit Accepted",
    family: "D",
    moves: ["d4", "d5", "c4", "dxc4"],
    tags: ["d4", "qga"]
  },
  {
    eco: "D30",
    name: "Queen's Gambit Declined",
    family: "D",
    moves: ["d4", "d5", "c4", "e6"],
    tags: ["d4", "qgd"]
  },
  {
    eco: "D35",
    name: "QGD, Exchange Variation",
    family: "D",
    moves: ["d4", "d5", "c4", "e6", "Nc3", "Nf6", "cxd5", "exd5"],
    tags: ["d4", "qgd", "exchange"]
  },
  {
    eco: "D43",
    name: "Semi-Slav Defense",
    family: "D",
    moves: ["d4", "d5", "c4", "e6", "Nc3", "c6"],
    tags: ["d4", "semi-slav"]
  },

  // ---- Grünfeld ----
  {
    eco: "D70",
    name: "Grünfeld Defense",
    family: "D",
    moves: ["d4", "Nf6", "c4", "g6", "Nc3", "d5"],
    tags: ["d4", "grunfeld", "hypermodern"]
  },

  // ======================================================
  // E–CODES: Indian Defenses: KID, Nimzo, QID, Bogo, etc.
  // ======================================================

  {
    eco: "E04",
    name: "Catalan Opening",
    family: "E",
    moves: ["d4", "Nf3", "c4", "g3"],
    tags: ["d4", "catalan"]
  },

  // ---- Nimzo / Queen’s Indian ----
  {
    eco: "E20",
    name: "Nimzo-Indian Defense",
    family: "E",
    moves: ["d4", "Nf6", "c4", "e6", "Nc3", "Bb4"],
    tags: ["d4", "nimzo-indian"]
  },
  {
    eco: "E12",
    name: "Queen's Indian Defense",
    family: "E",
    moves: ["d4", "Nf6", "c4", "e6", "Nf3", "b6"],
    tags: ["d4", "queens-indian"]
  },

  // ---- King's Indian ----
  {
    eco: "E60",
    name: "King's Indian Defense",
    family: "E",
    moves: ["d4", "Nf6", "c4", "g6"],
    tags: ["d4", "kings-indian"]
  },
  {
    eco: "E94",
    name: "King's Indian, Classical (Mar del Plata)",
    family: "E",
    moves: ["d4", "Nf6", "c4", "g6", "Nc3", "Bg6", "e4", "d6", "Nf3", "O-O", "Be2", "e5", "O-O", "Nc6", "d5", "Ne7"],
    tags: ["d4", "kings-indian", "mar-del-plata"]
  }
];
