import {
  deriveExecutionCompletionFromWsResult,
  formatWebSocketExecutionErrorPayload,
} from "./wsExecutionCompletion";

describe("deriveExecutionCompletionFromWsResult", () => {
  it("treats missing result as completed", () => {
    expect(deriveExecutionCompletionFromWsResult(null)).toEqual({
      status: "completed",
      errorMessage: undefined,
    });
  });

  it("maps failed status and error string", () => {
    expect(
      deriveExecutionCompletionFromWsResult({
        status: "failed",
        error: "Subscription not found",
      }),
    ).toEqual({
      status: "failed",
      errorMessage: "Subscription not found",
    });
  });

  it("infers failed from non-empty error even when status says completed", () => {
    expect(
      deriveExecutionCompletionFromWsResult({
        status: "completed",
        error: "Inconsistent payload",
      }),
    ).toEqual({
      status: "failed",
      errorMessage: "Inconsistent payload",
    });
  });

  it("infers failed from error when status is missing", () => {
    expect(
      deriveExecutionCompletionFromWsResult({
        error: "Only error field",
      }),
    ).toEqual({
      status: "failed",
      errorMessage: "Only error field",
    });
  });

  it("reads status from enum-like { value } objects", () => {
    expect(
      deriveExecutionCompletionFromWsResult({
        status: { value: "FAILED" },
        error: "x",
      }),
    ).toEqual({
      status: "failed",
      errorMessage: "x",
    });
  });

  it("returns failed without message when status failed and error absent", () => {
    expect(
      deriveExecutionCompletionFromWsResult({
        status: "failed",
      }),
    ).toEqual({
      status: "failed",
      errorMessage: undefined,
    });
  });
});

describe("formatWebSocketExecutionErrorPayload", () => {
  it("uses default for null/undefined", () => {
    expect(formatWebSocketExecutionErrorPayload(null)).toBe("Execution error");
    expect(formatWebSocketExecutionErrorPayload(undefined)).toBe(
      "Execution error",
    );
  });

  it("uses default for blank string", () => {
    expect(formatWebSocketExecutionErrorPayload("  ")).toBe("Execution error");
  });

  it("preserves non-empty string", () => {
    expect(formatWebSocketExecutionErrorPayload("  boom  ")).toBe("  boom  ");
  });

  it("stringifies numbers", () => {
    expect(formatWebSocketExecutionErrorPayload(503)).toBe("503");
  });
});
