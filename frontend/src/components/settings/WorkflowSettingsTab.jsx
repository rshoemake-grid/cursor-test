import { jsx, jsxs } from "react/jsx-runtime";
function WorkflowSettingsTab({
  iterationLimit,
  onIterationLimitChange,
  defaultModel,
  onDefaultModelChange,
  providers
}) {
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-lg border border-gray-200 p-5 flex flex-col gap-3", children: [
      /* @__PURE__ */ jsx("label", { htmlFor: "iteration-limit", className: "text-sm font-medium text-gray-700", children: "Iteration limit" }),
      /* @__PURE__ */ jsx(
        "input",
        {
          id: "iteration-limit",
          type: "number",
          min: 1,
          value: iterationLimit,
          onChange: (e) => onIterationLimitChange(Math.max(1, Number(e.target.value) || 1)),
          className: "w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
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
          onChange: (e) => onDefaultModelChange(e.target.value),
          className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent",
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
      /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-500", children: "Select the default model to use for workflow generation. Only models from enabled providers are shown." }),
      defaultModel && /* @__PURE__ */ jsxs("p", { className: "text-xs text-green-600", children: [
        "\u2713 Using: ",
        defaultModel
      ] })
    ] })
  ] });
}
export {
  WorkflowSettingsTab
};
