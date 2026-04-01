import { mapMessagesForWorkflowChatApi } from "./workflowChatPayload";

describe("mapMessagesForWorkflowChatApi", () => {
  it("preserves valid user and assistant messages", () => {
    const out = mapMessagesForWorkflowChatApi([
      { role: "assistant", content: "Hi" },
      { role: "user", content: "Yo" },
    ]);
    expect(out).toEqual([
      { role: "assistant", content: "Hi" },
      { role: "user", content: "Yo" },
    ]);
  });

  it("coerces missing content to empty string so JSON body includes content", () => {
    const out = mapMessagesForWorkflowChatApi([{ role: "assistant" }]);
    expect(out).toEqual([{ role: "assistant", content: "" }]);
  });

  it("stringifies non-string content", () => {
    const out = mapMessagesForWorkflowChatApi([{ role: "user", content: 42 }]);
    expect(out).toEqual([{ role: "user", content: "42" }]);
  });

  it("defaults bad role to user", () => {
    const out = mapMessagesForWorkflowChatApi([{ role: "", content: "x" }]);
    expect(out[0].role).toBe("user");
  });

  it("returns empty array for non-array input", () => {
    expect(mapMessagesForWorkflowChatApi(null)).toEqual([]);
    expect(mapMessagesForWorkflowChatApi(void 0)).toEqual([]);
  });
});
