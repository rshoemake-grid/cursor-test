import { logicalOr } from "./logicalOr";
function buildWebSocketUrl(executionId, windowLocation, authToken) {
  const protocol = windowLocation?.protocol === "https:" ? "wss:" : "ws:";
  const host = logicalOr(windowLocation?.host, "localhost:8000");
  const base = `${protocol}//${host}/ws/executions/${executionId}`;
  if (authToken != null && authToken !== "") {
    return `${base}?token=${encodeURIComponent(authToken)}`;
  }
  return base;
}
export {
  buildWebSocketUrl
};
