import { logicalOr } from "./logicalOr";

/**
 * CRA dev server (e.g. :3000) proxies HTTP /api reliably but WebSocket upgrades
 * through setupProxy often fail in the browser ("WebSocket connection failed").
 * Point WebSockets at the API origin instead (same default as setupProxy PROXY_TARGET).
 */
function resolveWebSocketHost(windowLocation) {
  const envHost =
    typeof process !== "undefined" && process.env.REACT_APP_WS_HOST
      ? String(process.env.REACT_APP_WS_HOST).trim()
      : "";
  if (envHost !== "") {
    return envHost.replace(/^\/+|\/+$/g, "");
  }
  const host = windowLocation?.host;
  if (host === "localhost:3000" || host === "127.0.0.1:3000") {
    return host.startsWith("127.0.0.1") ? "127.0.0.1:8000" : "localhost:8000";
  }
  return logicalOr(host, "localhost:8000");
}

function buildWebSocketUrl(executionId, windowLocation, authToken) {
  const protocol = windowLocation?.protocol === "https:" ? "wss:" : "ws:";
  const host = resolveWebSocketHost(windowLocation);
  const base = `${protocol}//${host}/ws/executions/${executionId}`;
  if (authToken != null && authToken !== "") {
    return `${base}?token=${encodeURIComponent(authToken)}`;
  }
  return base;
}
export { buildWebSocketUrl };
