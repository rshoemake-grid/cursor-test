import { useCallback } from "react";
import PropTypes from "prop-types";
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

ToastContainer.propTypes = {
  toasts: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      message: PropTypes.node.isRequired,
      type: PropTypes.string,
      duration: PropTypes.number,
    }),
  ).isRequired,
  onRemoveToast: PropTypes.func.isRequired,
};

export { ToastContainer as default };
