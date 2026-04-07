import { useCallback } from "react";
import Toast from "./Toast";
import {
  ToastContainerRoot,
  ToastContainerItem,
} from "../../styles/uiComponents.styled";

function ToastContainer({ toasts, onRemoveToast }) {
  const handleClose = useCallback(
    (id) => {
      onRemoveToast(id);
    },
    [onRemoveToast],
  );
  if (toasts.length === 0) {
    return null;
  }
  return (
    <ToastContainerRoot>
      {toasts.map((toast) => (
        <ToastContainerItem key={toast.id}>
          <Toast
            id={toast.id}
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onClose={handleClose}
          />
        </ToastContainerItem>
      ))}
    </ToastContainerRoot>
  );
}
export { ToastContainer as default };
