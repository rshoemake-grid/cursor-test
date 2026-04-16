/**
 * Deep-clone for API payloads so React Flow / node data cannot break JSON (BigInt,
 * circular refs, functions). Returns null if serialization fails.
 */
function deepCloneJsonSafe(value) {
  try {
    return JSON.parse(
      JSON.stringify(value, (_key, v) => {
        if (typeof v === "bigint") {
          return v.toString();
        }
        if (typeof v === "function" || typeof v === "symbol") {
          return undefined;
        }
        return v;
      }),
    );
  } catch {
    return null;
  }
}

/**
 * FastAPI ChatMessage requires `role` and `content` (strings). `JSON.stringify` omits
 * `undefined`, so { role: "assistant", content: undefined } becomes {"role":"assistant"}
 * and Pydantic returns 422. Always emit explicit string `content`.
 */
function mapMessagesForWorkflowChatApi(messages) {
  if (!Array.isArray(messages)) {
    return [];
  }
  return messages.map((m) => {
    const role =
      m && typeof m.role === "string" && m.role !== "" ? m.role : "user";
    let content = "";
    if (m && typeof m.content === "string") {
      content = m.content;
    } else if (m && m.content != null) {
      content = String(m.content);
    }
    return { role, content };
  });
}

export { mapMessagesForWorkflowChatApi, deepCloneJsonSafe };
