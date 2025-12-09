import { useState } from "react";

export function usePopup() {
  const [popup, setPopup] = useState({
    type: null,
    message: "",
    onAccept: null,
    onReject: null,
  });

  const showInfo = (msg: string) => {
    setPopup({ type: "info", message: msg, onAccept: () => setPopup({ type: null }) });
  };

  return { popup, setPopup, showInfo };
}
