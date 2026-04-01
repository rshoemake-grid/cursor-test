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
    const role = m && typeof m.role === "string" && m.role !== "" ? m.role : "user";
    let content = "";
    if (m && typeof m.content === "string") {
      content = m.content;
    } else if (m && m.content != null) {
      content = String(m.content);
    }
    return { role, content };
  });
}

export { mapMessagesForWorkflowChatApi };
