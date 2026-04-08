import PropTypes from "prop-types";
import {
  SettingsMutedStack,
  SettingsCard,
  SettingsFieldLabel,
  SettingsIterationInput,
  SettingsSelect,
  SettingsHelpText,
  SettingsSuccessText,
} from "../../styles/settings.styled";
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
    <SettingsMutedStack $readOnly={readOnly === true}>
      <SettingsCard>
        <SettingsFieldLabel htmlFor="iteration-limit">
          Iteration limit
        </SettingsFieldLabel>
        <SettingsIterationInput
          id="iteration-limit"
          type="number"
          min={1}
          value={iterationLimit}
          disabled={readOnly === true}
          onChange={(e) =>
            onIterationLimitChange(Math.max(1, Number(e.target.value) || 1))
          }
        />
        <SettingsHelpText>
          Number of tool-LLM cycles allowed when using &quot;Chat with LLM&quot;.
        </SettingsHelpText>
      </SettingsCard>
      <SettingsCard>
        <SettingsFieldLabel htmlFor="default-model">
          Default Model
        </SettingsFieldLabel>
        <SettingsSelect
          id="default-model"
          value={defaultModel}
          disabled={readOnly === true}
          onChange={(e) => onDefaultModelChange(e.target.value)}
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
        </SettingsSelect>
        <SettingsHelpText>
          Default model for workflow execution and agent nodes when no per-node
          model is set. Only models from enabled providers are shown.
        </SettingsHelpText>
        {defaultModel && (
          <SettingsSuccessText>✓ Using: {defaultModel}</SettingsSuccessText>
        )}
      </SettingsCard>
      <SettingsCard>
        <SettingsFieldLabel htmlFor="chat-assistant-model">
          Workflow chat model
        </SettingsFieldLabel>
        <SettingsSelect
          id="chat-assistant-model"
          value={chatAssistantModel}
          disabled={readOnly === true}
          onChange={(e) => onChatAssistantModelChange(e.target.value)}
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
        </SettingsSelect>
        <SettingsHelpText>
          Model used by the workflow builder chat assistant (separate from the
          default execution model if you want a cheaper or faster model for
          editing).
        </SettingsHelpText>
        {chatAssistantModel && (
          <SettingsSuccessText>
            ✓ Chat using: {chatAssistantModel}
          </SettingsSuccessText>
        )}
      </SettingsCard>
    </SettingsMutedStack>
  );
}

WorkflowSettingsTab.propTypes = {
  readOnly: PropTypes.bool,
  iterationLimit: PropTypes.number.isRequired,
  onIterationLimitChange: PropTypes.func.isRequired,
  defaultModel: PropTypes.string,
  onDefaultModelChange: PropTypes.func.isRequired,
  chatAssistantModel: PropTypes.string,
  onChatAssistantModelChange: PropTypes.func.isRequired,
  providers: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export { WorkflowSettingsTab };
