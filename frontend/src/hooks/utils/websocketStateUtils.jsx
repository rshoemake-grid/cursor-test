function getWebSocketStateText(readyState) {
  if (readyState === WebSocket.CONNECTING) return "CONNECTING";
  if (readyState === WebSocket.OPEN) return "OPEN";
  if (readyState === WebSocket.CLOSING) return "CLOSING";
  if (readyState === WebSocket.CLOSED) return "CLOSED";
  return "UNKNOWN";
}
export { getWebSocketStateText };
