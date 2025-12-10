// src/games/chess/components/ChessPopup.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function ChessPopup({ popup, setPopup }) {
  return (
    <Dialog open={popup.type !== null} onOpenChange={() => {}}>
      <DialogContent
        className="bg-slate-900 border border-slate-700 text-white hide-close"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>
            {popup.type === "info" && "Thông báo"}
            {popup.type === "leaveConfirm" && "Xin rời phòng"}
            {popup.type === "drawConfirm" && "Đề nghị hòa"}
          </DialogTitle>
        </DialogHeader>

        <div className="py-4 text-center">{popup.message}</div>

        <div className="flex justify-center gap-4">
          {popup.type !== "info" && (
            <Button className="bg-red-700" onClick={() => popup.onReject?.()}>
              Từ chối
            </Button>
          )}

          <Button className="bg-green-600" onClick={() => popup.onAccept?.()}>
            Đồng ý
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
