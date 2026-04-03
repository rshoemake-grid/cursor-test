function WorkflowSettingsTab({
  readOnly = false,
  iterationLimit,
  onIterationLimitChange,
  defaultModel,
  onDefaultModelChange,
  chatAssistantModel,
  onChatAssistantModelChange,
  providers,
}) {
  return (
    <div
      className={`space-y-6 ${readOnly === true ? "opacity-50 pointer-events-none" : ""}`}
    >
      <div className="bg-white rounded-lg border border-gray-200 p-5 flex flex-col gap-3">
        <label
          htmlFor="iteration-limit"
          className="text-sm font-medium text-gray-700"
        >
          Iteration limit
        </label>
        <input
          id="iteration-limit"
          type="number"
          min={1}
          value={iterationLimit}
          disabled={readOnly === true}
          onChange={(e) =>
            onIterationLimitChange(Math.max(1, Number(e.target.value) || 1))
          }
          className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
        />
        <p className="text-xs text-gray-500">
          Number of tool-LLM cycles allowed when using &quot;Chat with LLM&quot;.
        </p>
      </div>
      <div className="bg-white rounded-lg border border-gray-200 p-5 flex flex-col gap-3">
        <label
          htmlFor="default-model"
          className="text-sm font-medium text-gray-700"
        >
          Default Model
        </label>
        <select
          id="default-model"
          value={defaultModel}
          disabled={readOnly === true}
          onChange={(e) => onDefaultModelChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
        >
          <option value="">Select a model...</option>
          {providers
            .filter((p) => p.enabled && p.models && p.models.length > 0)
            .flatMap((provider) =>
              (provider.models || []).map((model) => ({
                value: model,
                label: `${model} (${provider.name})`,
                optionKey: `${provider.id}-${model}`,
              })),
            )
            .map(({ value, label, optionKey }) => (
              <option key={optionKey} value={value}>
                {label}
              </option>
            ))}
        </select>
        <p className="text-xs text-gray-500">
          Default model for workflow execution and agent nodes when no per-node
          model is set. Only models from enabled providers are shown.
        </p>
        {defaultModel && (
          <p className="text-xs text-green-600">✓ Using: {defaultModel}</p>
        )}
      </div>
      <div className="bg-white rounded-lg border border-gray-200 p-5 flex flex-col gap-3">
        <label
          htmlFor="chat-assistant-model"
          className="text-sm font-medium text-gray-700"
        >
          Workflow chat model
        </label>
        <select
          id="chat-assistant-model"
          value={chatAssistantModel}
          disabled={readOnly === true}
          onChange={(e) => onChatAssistantModelChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
        >
          <option value="">Same as default model</option>
          {providers
            .filter((p) => p.enabled && p.models && p.models.length > 0)
            .flatMap((provider) =>
              (provider.models || []).map((model) => ({
                value: model,
                label: `${model} (${provider.name})`,
                optionKey: `chat-${provider.id}-${model}`,
              })),
            )
            .map(({ value, label, optionKey }) => (
              <option key={optionKey} value={value}>
                {label}
              </option>
            ))}
        </select>
        <p className="text-xs text-gray-500">
          Model used by the workflow builder chat assistant (separate from the
          default execution model if you want a cheaper or faster model for
          editing).
        </p>
        {chatAssistantModel && (
          <p className="text-xs text-green-600">
            ✓ Chat using: {chatAssistantModel}
          </p>
        )}
      </div>
    </div>
  );
}
export { WorkflowSettingsTab };
