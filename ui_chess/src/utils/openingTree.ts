// ==========================================
// openingTree.ts — FULL VERSION
// Opening Tree for AI BOT (ECO-based)
// ==========================================

export interface OpeningNode {
  move: string;                 // nước đi ví dụ "e4"
  eco?: string;                 // mã ECO: B90, C65, E60...
  name?: string;                // tên khai cuộc
  next?: OpeningNode[];         // các nhánh tiếp theo
}

// ==========================================
// FULL OPENING TREE
// (Tập trung vào các khai cuộc mạnh nhất hiện nay)
// ==========================================

export const openingTree: OpeningNode[] = [

  // =====================================================================
  // 1) OPEN GAMES — e4 e5  (ECO C20–C99)
  // =====================================================================
  {
    move: "e4",
    eco: "C20",
    next: [
      // ----------------------------------------------
      // Italian Game / Two Knights / Evans Gambit
      // ----------------------------------------------
      {
        move: "e5",
        eco: "C20",
        next: [
          {
            move: "Nf3",
            eco: "C40",
            next: [
              // ----- Italian -----
              {
                move: "Nc6",
                next: [
                  {
                    move: "Bc4",
                    eco: "C50",
                    name: "Italian Game",
                    next: [
                      {
                        move: "Bc5",
                        eco: "C53",
                        name: "Giuoco Piano",
                        next: [
                          { move: "c3" },
                          { move: "d3" }
                        ]
                      },
                      {
                        move: "Nf6",
                        eco: "C55",
                        name: "Two Knights Defense",
                        next: [
                          { move: "Ng5", eco: "C57", name: "Fried Liver Attack" },
                          { move: "d4", eco: "C56" }
                        ]
                      },
                      {
                        move: "b4",
                        eco: "C52",
                        name: "Evans Gambit"
                      }
                    ]
                  },

                  // ----- Ruy Lopez -----
                  {
                    move: "Bb5",
                    eco: "C60",
                    name: "Ruy Lopez",
                    next: [
                      {
                        move: "a6",
                        eco: "C60",
                        name: "Morphy Defense",
                        next: [
                          {
                            move: "Ba4",
                            next: [
                              {
                                move: "Nf6",
                                next: [
                                  // Closed Ruy Lopez
                                  {
                                    move: "O-O",
                                    eco: "C84",
                                    next: [
                                      { move: "Be7" },
                                      { move: "b5" }
                                    ]
                                  },
                                  // Open Variation
                                  {
                                    move: "Nxe4",
                                    eco: "C80",
                                    name: "Open Ruy Lopez"
                                  }
                                ]
                              }
                            ]
                          }
                        ]
                      },

                      // Berlin Defense
                      {
                        move: "Nf6",
                        eco: "C65",
                        name: "Berlin Defense"
                      }
                    ]
                  },

                  // ----- Scotch Game -----
                  {
                    move: "d4",
                    eco: "C45",
                    name: "Scotch Game",
                    next: [
                      { move: "exd4" },
                      {
                        move: "Nxd4",
                        next: [
                          { move: "Bc5", eco: "C45" },
                          { move: "Nf6" }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      },

      // =====================================================================
      // 2) SICILIAN DEFENSE (ECO B20–B99)
      // =====================================================================
      {
        move: "c5",
        eco: "B20",
        name: "Sicilian Defense",
        next: [
          {
            move: "Nf3",
            next: [
              {
                move: "d6",
                next: [
                  {
                    move: "d4",
                    next: [
                      { move: "cxd4" },
                      {
                        move: "Nxd4",
                        next: [
                          {
                            move: "Nf6",
                            next: [
                              {
                                move: "Nc3",
                                next: [
                                  // Najdorf
                                  { move: "a6", eco: "B90", name: "Najdorf" },
                                  // Dragon
                                  { move: "g6", eco: "B70", name: "Dragon" },
                                  // Classical
                                  { move: "Nc6", eco: "B56", name: "Classical" },
                                  // Scheveningen
                                  { move: "e6", eco: "B85", name: "Scheveningen" }
                                ]
                              }
                            ]
                          }
                        ]
                      }
                    ]
                  }
                ]
              },

              // Sveshnikov
              {
                move: "Nc6",
                eco: "B33",
                name: "Sveshnikov Sicilian",
                next: [
                  {
                    move: "d4",
                    next: [
                      { move: "cxd4" },
                      { move: "Nxd4" },
                      { move: "e5" }
                    ]
                  }
                ]
              },

              // Kan / Taimanov
              { move: "e6", eco: "B40", name: "Kan Variation" },
              { move: "Nc6", eco: "B46", name: "Taimanov Variation" }
            ]
          }
        ]
      },

      // =====================================================================
      // 3) FRENCH DEFENSE (C00–C19)
      // =====================================================================
      {
        move: "e6",
        eco: "C00",
        name: "French Defense",
        next: [
          {
            move: "d4",
            next: [
              { move: "d5" },
              {
                move: "Nc3",
                next: [
                  { move: "Bb4", eco: "C18", name: "Winawer" },
                  { move: "Nf6", eco: "C11", name: "Classical" }
                ]
              },
              { move: "e5", eco: "C02", name: "Advance Variation" }
            ]
          }
        ]
      },

      // =====================================================================
      // 4) CARO–KANN (B10–B19)
      // =====================================================================
      {
        move: "c6",
        eco: "B10",
        name: "Caro-Kann Defense",
        next: [
          {
            move: "d4",
            next: [
              { move: "d5" },
              { move: "e5", eco: "B12", name: "Advance" },
              {
                move: "Nc3",
                eco: "B15",
                name: "Classical",
                next: [{ move: "dxe4" }]
              }
            ]
          }
        ]
      },

      // =====================================================================
      // 5) SCANDINAVIAN DEFENSE
      // =====================================================================
      {
        move: "d5",
        eco: "B01",
        name: "Scandinavian Defense"
      }
    ]
  },

  // =====================================================================
  // 6) d4 OPENINGS — Queen’s Gambit, Slav, Indian systems
  // =====================================================================

  {
    move: "d4",
    eco: "D00",
    next: [
      {
        move: "d5",
        next: [
          {
            move: "c4",
            eco: "D06",
            name: "Queen's Gambit",
            next: [
              { move: "e6", eco: "D30", name: "QGD" },
              { move: "dxc4", eco: "D20", name: "QGA" },
              { move: "c6", eco: "D10", name: "Slav Defense" }
            ]
          }
        ]
      },

      // King's Indian / Nimzo / QID
      {
        move: "Nf6",
        eco: "E00",
        next: [
          {
            move: "c4",
            next: [
              {
                move: "g6",
                eco: "E60",
                name: "King's Indian Defense"
              },
              {
                move: "e6",
                next: [
                  {
                    move: "Nc3",
                    next: [
                      { move: "Bb4", eco: "E20", name: "Nimzo-Indian" }
                    ]
                  },
                  {
                    move: "Nf3",
                    next: [
                      { move: "b6", eco: "E12", name: "Queen's Indian" }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },

  // =====================================================================
  // 7) ENGLISH OPENING (A10–A39)
  // =====================================================================
  {
    move: "c4",
    eco: "A10",
    name: "English Opening",
    next: [
      { move: "e5", eco: "A20", name: "Reversed Sicilian" },
      { move: "c5", eco: "A30", name: "Symmetrical English" },
      { move: "g6" }
    ]
  }

];
