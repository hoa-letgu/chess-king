// src/games/chess/components/GameResultPopup.tsx
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type GameResultPopupProps = {
  open: boolean;
  result: "win" | "lose" | "draw";
  onRestart: () => void;
  onClose: () => void;
};

export function GameResultPopup({ open, result, onRestart, onClose }: GameResultPopupProps) {
  const getTitle = () => {
    if (result === "win") return "🎉 Bạn đã thắng!";
    if (result === "lose") return "💀 Bạn đã thua!";
    return "🤝 Hòa!";
  };

  const getColor = () => {
    if (result === "win") return "text-green-400";
    if (result === "lose") return "text-red-400";
    return "text-yellow-300";
  };

  return (
    <Dialog open={open}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-sm">
        <DialogHeader>
          <DialogTitle className={`text-center text-2xl font-bold ${getColor()}`}>
            {getTitle()}
          </DialogTitle>
        </DialogHeader>

        <div className="flex justify-center gap-4 mt-6">
          <Button variant="default" onClick={onRestart}>
            🔄 Chơi lại
          </Button>
          <Button variant="secondary" onClick={onClose}>
            ✖ Đóng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
