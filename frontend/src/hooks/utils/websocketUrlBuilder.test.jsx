import { buildWebSocketUrl } from "./websocketUrlBuilder";
describe("buildWebSocketUrl", () => {
  it("should build WebSocket URL with http protocol", () => {
    const windowLocation = {
      protocol: "http:",
      host: "localhost:8000",
    };
    const url = buildWebSocketUrl("exec-123", windowLocation);
    expect(url).toBe("ws://localhost:8000/ws/executions/exec-123");
  });
  it("should build WebSocket URL with https protocol", () => {
    const windowLocation = {
      protocol: "https:",
      host: "example.com",
    };
    const url = buildWebSocketUrl("exec-456", windowLocation);
    expect(url).toBe("wss://example.com/ws/executions/exec-456");
  });
  it("should use ws protocol for non-https protocols", () => {
    const windowLocation = {
      protocol: "http:",
      host: "example.com:8080",
    };
    const url = buildWebSocketUrl("exec-789", windowLocation);
    expect(url).toBe("ws://example.com:8080/ws/executions/exec-789");
  });
  it("should use default host when windowLocation is null", () => {
    const url = buildWebSocketUrl("exec-123", null);
    expect(url).toBe("ws://localhost:8000/ws/executions/exec-123");
  });
  it("should use default host when windowLocation is undefined", () => {
    const url = buildWebSocketUrl("exec-123", void 0);
    expect(url).toBe("ws://localhost:8000/ws/executions/exec-123");
  });
  it("should use default host when host is missing", () => {
    const windowLocation = {
      protocol: "https:",
    };
    const url = buildWebSocketUrl("exec-123", windowLocation);
    expect(url).toBe("wss://localhost:8000/ws/executions/exec-123");
  });
  it("should use default host when host is null", () => {
    const windowLocation = {
      protocol: "http:",
      host: null,
    };
    const url = buildWebSocketUrl("exec-123", windowLocation);
    expect(url).toBe("ws://localhost:8000/ws/executions/exec-123");
  });
  it("should use default host when host is empty string", () => {
    const windowLocation = {
      protocol: "https:",
      host: "",
    };
    const url = buildWebSocketUrl("exec-123", windowLocation);
    expect(url).toBe("wss://localhost:8000/ws/executions/exec-123");
  });
  it("should handle execution IDs with special characters", () => {
    const windowLocation = {
      protocol: "https:",
      host: "example.com",
    };
    const url = buildWebSocketUrl("exec-123-abc_xyz", windowLocation);
    expect(url).toBe("wss://example.com/ws/executions/exec-123-abc_xyz");
  });
  it("should use API port for CRA dev host (localhost:3000 → :8000)", () => {
    const windowLocation = {
      protocol: "http:",
      host: "localhost:3000",
    };
    const url = buildWebSocketUrl("exec-123", windowLocation);
    expect(url).toBe("ws://localhost:8000/ws/executions/exec-123");
  });
  it("should use API port for CRA dev host (127.0.0.1:3000 → :8000)", () => {
    const windowLocation = {
      protocol: "http:",
      host: "127.0.0.1:3000",
    };
    const url = buildWebSocketUrl("exec-456", windowLocation);
    expect(url).toBe("ws://127.0.0.1:8000/ws/executions/exec-456");
  });
  it("should honor REACT_APP_WS_HOST when set", () => {
    const prev = process.env.REACT_APP_WS_HOST;
    process.env.REACT_APP_WS_HOST = "api.test:9000";
    try {
      const windowLocation = {
        protocol: "http:",
        host: "localhost:3000",
      };
      const url = buildWebSocketUrl("exec-123", windowLocation);
      expect(url).toBe("ws://api.test:9000/ws/executions/exec-123");
    } finally {
      if (prev === undefined) {
        delete process.env.REACT_APP_WS_HOST;
      } else {
        process.env.REACT_APP_WS_HOST = prev;
      }
    }
  });
  it("should handle custom domains", () => {
    const windowLocation = {
      protocol: "https:",
      host: "api.example.com",
    };
    const url = buildWebSocketUrl("exec-123", windowLocation);
    expect(url).toBe("wss://api.example.com/ws/executions/exec-123");
  });
  it("should append token query param when authToken provided (S-H3)", () => {
    const windowLocation = {
      protocol: "https:",
      host: "api.example.com",
    };
    const url = buildWebSocketUrl("exec-123", windowLocation, "jwt-token-xyz");
    expect(url).toBe(
      "wss://api.example.com/ws/executions/exec-123?token=jwt-token-xyz",
    );
  });
  it("should not append token when authToken is null or empty", () => {
    const windowLocation = {
      protocol: "http:",
      host: "localhost:8000",
    };
    expect(buildWebSocketUrl("exec-1", windowLocation, null)).toBe(
      "ws://localhost:8000/ws/executions/exec-1",
    );
    expect(buildWebSocketUrl("exec-1", windowLocation, "")).toBe(
      "ws://localhost:8000/ws/executions/exec-1",
    );
  });
});
