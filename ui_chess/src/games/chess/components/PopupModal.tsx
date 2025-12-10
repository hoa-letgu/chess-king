// src/games/chess/components/PopupModal.tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function PopupModal({ popup, setPopup }) {
  const isOpen = popup.type !== null;

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent
        className="bg-slate-900 text-white border border-slate-700 hide-close"
        onInteractOutside={e => e.preventDefault()}
        onEscapeKeyDown={e => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>
            {popup.type === "leaveConfirm" && "Xin rời phòng"}
            {popup.type === "drawConfirm" && "Lời đề nghị hòa"}
            {popup.type === "info" && "Thông báo"}
          </DialogTitle>
        </DialogHeader>

        <div className="py-4 text-center">{popup.message}</div>

        <div className="flex justify-center gap-4 pt-4">
          {popup.type !== "info" && (
            <Button
              className="bg-red-700"
              onClick={() => popup.onReject?.()}
            >
              Từ chối
            </Button>
          )}

          <Button
            className="bg-green-700"
            onClick={() => popup.onAccept?.()}
          >
            Đồng ý
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
