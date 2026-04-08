import PropTypes from "prop-types";
import { X, CheckCircle, XCircle, AlertCircle, Info } from "lucide-react";
import { useEffect } from "react";
import {
  ToastRoot,
  ToastIconWrap,
  ToastBody,
  ToastMessage,
  ToastDismiss,
} from "../../styles/uiComponents.styled";

const TOAST_ICONS = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
};

function Toast({ id, message, type = "info", duration = 5e3, onClose }) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);
  const Icon = TOAST_ICONS[type] || TOAST_ICONS.info;
  const skinType =
    type === "success" || type === "error" || type === "warning" || type === "info"
      ? type
      : "info";
  return (
    <ToastRoot $type={skinType} role="alert">
      <ToastIconWrap $type={skinType} aria-hidden>
        <Icon />
      </ToastIconWrap>
      <ToastBody>
        <ToastMessage>{message}</ToastMessage>
      </ToastBody>
      <ToastDismiss
        type="button"
        onClick={() => onClose(id)}
        aria-label="Close notification"
      >
        <X aria-hidden />
      </ToastDismiss>
    </ToastRoot>
  );
}

Toast.propTypes = {
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  message: PropTypes.node.isRequired,
  type: PropTypes.oneOf(["success", "error", "warning", "info"]),
  duration: PropTypes.number,
  onClose: PropTypes.func.isRequired,
};

export { Toast as default };
