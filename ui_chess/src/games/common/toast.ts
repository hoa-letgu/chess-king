import { toast } from "sonner";

export const showSuccess = (message: string) => {
  toast.success(message, {
    style: {
      background: "#16a34a",
      color: "white",
    },
  });
};

export const showError = (message: string) => {
  toast.error(message, {
    style: {
      background: "#dc2626",
      color: "white",
    },
  });
};

export const showLoading = (message: string) => {
  return toast.loading(message, {
    style: {
      background: "#2563eb",
      color: "white",
    },
  });
};

export const dismissToast = (toastId: string | number) => {
  toast.dismiss(toastId);
};
