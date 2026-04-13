import { handleWebSocketMessage } from "./websocketMessageHandler";

describe("handleWebSocketMessage", () => {
  it("invokes onError for type error with empty string using fallback text", () => {
    const onError = jest.fn();
    handleWebSocketMessage(
      { type: "error", error: "   " },
      { onError },
    );
    expect(onError).toHaveBeenCalledWith("Execution error");
  });

  it("invokes onError for type error with null", () => {
    const onError = jest.fn();
    handleWebSocketMessage({ type: "error", error: null }, { onError });
    expect(onError).toHaveBeenCalledWith("Execution error");
  });

  it("passes through non-empty error strings", () => {
    const onError = jest.fn();
    handleWebSocketMessage(
      { type: "error", error: "Pub/Sub denied" },
      { onError },
    );
    expect(onError).toHaveBeenCalledWith("Pub/Sub denied");
  });
});
