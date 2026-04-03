import { defaultAdapters } from "../types/adapters";
function showNotification(message, options = {}) {
  const {
    duration = 5e3,
    type = "info",
    documentAdapter = defaultAdapters.createDocumentAdapter(),
    timerAdapter = defaultAdapters.createTimerAdapter(),
  } = options;
  if (documentAdapter === null || documentAdapter === void 0) {
    return null;
  }
  const colors = {
    success: { bg: "#10b981", text: "white" },
    error: { bg: "#ef4444", text: "white" },
    info: { bg: "#3b82f6", text: "white" },
    warning: { bg: "#f59e0b", text: "white" },
  };
  const color = colors[type];
  try {
    const notification = documentAdapter.createElement("div");
    notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${color.bg};
    color: ${color.text};
    padding: 16px 24px;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    z-index: 10000;
    max-width: 400px;
    white-space: pre-line;
    font-family: system-ui, -apple-system, sans-serif;
    animation: slideIn 0.3s ease-out;
  `;
    if (documentAdapter.getElementById("notification-styles") === null) {
      const style = documentAdapter.createElement("style");
      style.id = "notification-styles";
      style.textContent = `
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `;
      documentAdapter.head.appendChild(style);
    }
    notification.textContent = message;
    documentAdapter.body.appendChild(notification);
    timerAdapter.setTimeout(() => {
      notification.style.transition = "opacity 0.3s, transform 0.3s";
      notification.style.opacity = "0";
      notification.style.transform = "translateX(100%)";
      timerAdapter.setTimeout(() => notification.remove(), 300);
    }, duration);
    return notification;
  } catch (error) {
    return null;
  }
}
function showSuccess(message, duration) {
  return showNotification(message, { type: "success", duration });
}
function showError(message, duration) {
  return showNotification(message, { type: "error", duration });
}
function showInfo(message, duration) {
  return showNotification(message, { type: "info", duration });
}
function showWarning(message, duration) {
  return showNotification(message, { type: "warning", duration });
}
export { showError, showInfo, showNotification, showSuccess, showWarning };
