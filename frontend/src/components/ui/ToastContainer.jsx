import { useCallback } from "react";
import Toast from "./Toast";
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
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast
            id={toast.id}
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onClose={handleClose}
          />
        </div>
      ))}
    </div>
  );
}
export { ToastContainer as default };
