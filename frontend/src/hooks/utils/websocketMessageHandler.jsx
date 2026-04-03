import { logicalOr } from "./logicalOr";
function handleWebSocketMessage(message, options) {
  const { onLog, onStatus, onNodeUpdate, onCompletion, onError } = options;
  switch (message.type) {
    case "log":
      if (message.log && onLog) {
        onLog(message.log);
      }
      break;
    case "status":
      if (message.status && onStatus) {
        onStatus(message.status);
      }
      break;
    case "node_update":
      if (message.node_state && onNodeUpdate) {
        const nodeId = logicalOr(message.node_id, message.node_state.node_id);
        if (nodeId) {
          onNodeUpdate(nodeId, message.node_state);
        }
      }
      break;
    case "completion":
      if (onCompletion) {
        onCompletion(message.result);
      }
      break;
    case "error":
      if (message.error && onError) {
        onError(message.error);
      }
      break;
  }
}
export { handleWebSocketMessage };
