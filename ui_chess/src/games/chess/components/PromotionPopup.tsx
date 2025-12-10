// src/games/chess/components/PromotionPopup.tsx
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PIECE_IMG } from "@/games/chess/utils/pieces";

type PromotionPopupProps = {
  open: boolean;
  color: "w" | "b";
  onSelect: (piece: "q" | "r" | "b" | "n") => void;
};

export function PromotionPopup({ open, color, onSelect }: PromotionPopupProps) {
  const pieces = ["q", "r", "b", "n"] as const;

  return (
    <Dialog open={open}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-semibold">
            ♟️ Chọn quân phong
          </DialogTitle>
        </DialogHeader>

        <div className="flex justify-center gap-4 py-4">
          {pieces.map((p) => {
            const imgKey = color === "w" ? p.toUpperCase() : p;

            return (
              <button
                key={p}
                onClick={() => onSelect(p)}
                className="hover:scale-110 transition-transform"
              >
                <img src={PIECE_IMG[imgKey]} className="w-16 h-16" />
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
