import { jsx, jsxs } from "react/jsx-runtime";
function WorkflowSettingsTab({
  readOnly = false,
  iterationLimit,
  onIterationLimitChange,
  defaultModel,
  onDefaultModelChange,
  chatAssistantModel,
  onChatAssistantModelChange,
  providers
}) {
  return /* @__PURE__ */ jsxs("div", { className: `space-y-6 ${readOnly === true ? "opacity-50 pointer-events-none" : ""}`, children: [
    /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-lg border border-gray-200 p-5 flex flex-col gap-3", children: [
      /* @__PURE__ */ jsx("label", { htmlFor: "iteration-limit", className: "text-sm font-medium text-gray-700", children: "Iteration limit" }),
      /* @__PURE__ */ jsx(
        "input",
        {
          id: "iteration-limit",
          type: "number",
          min: 1,
          value: iterationLimit,
          disabled: readOnly === true,
          onChange: (e) => onIterationLimitChange(Math.max(1, Number(e.target.value) || 1)),
          className: "w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
        }
      ),
      /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-500", children: 'Number of tool-LLM cycles allowed when using "Chat with LLM".' })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-lg border border-gray-200 p-5 flex flex-col gap-3", children: [
      /* @__PURE__ */ jsx("label", { htmlFor: "default-model", className: "text-sm font-medium text-gray-700", children: "Default Model" }),
      /* @__PURE__ */ jsxs(
        "select",
        {
          id: "default-model",
          value: defaultModel,
          disabled: readOnly === true,
          onChange: (e) => onDefaultModelChange(e.target.value),
          className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100",
          children: [
            /* @__PURE__ */ jsx("option", { value: "", children: "Select a model..." }),
            providers.filter((p) => p.enabled && p.models && p.models.length > 0).flatMap(
              (provider) => (provider.models || []).map((model) => ({
                value: model,
                label: `${model} (${provider.name})`
              }))
            ).map(({ value, label }) => /* @__PURE__ */ jsx("option", { value, children: label }, value))
          ]
        }
      ),
      /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-500", children: "Default model for workflow execution and agent nodes when no per-node model is set. Only models from enabled providers are shown." }),
      defaultModel && /* @__PURE__ */ jsxs("p", { className: "text-xs text-green-600", children: [
        "\u2713 Using: ",
        defaultModel
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-lg border border-gray-200 p-5 flex flex-col gap-3", children: [
      /* @__PURE__ */ jsx("label", { htmlFor: "chat-assistant-model", className: "text-sm font-medium text-gray-700", children: "Workflow chat model" }),
      /* @__PURE__ */ jsxs(
        "select",
        {
          id: "chat-assistant-model",
          value: chatAssistantModel,
          disabled: readOnly === true,
          onChange: (e) => onChatAssistantModelChange(e.target.value),
          className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100",
          children: [
            /* @__PURE__ */ jsx("option", { value: "", children: "Same as default model" }),
            providers.filter((p) => p.enabled && p.models && p.models.length > 0).flatMap(
              (provider) => (provider.models || []).map((model) => ({
                value: model,
                label: `${model} (${provider.name})`
              }))
            ).map(({ value, label }) => /* @__PURE__ */ jsx("option", { value, children: label }, `chat-${value}`))
          ]
        }
      ),
      /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-500", children: "Model used by the workflow builder chat assistant (separate from the default execution model if you want a cheaper or faster model for editing)." }),
      chatAssistantModel && /* @__PURE__ */ jsxs("p", { className: "text-xs text-green-600", children: [
        "\u2713 Chat using: ",
        chatAssistantModel
      ] })
    ] })
  ] });
}
export {
  WorkflowSettingsTab
};
