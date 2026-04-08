import PropTypes from "prop-types";
import { Plus } from "lucide-react";
import {
  AddProviderRevealButton,
  SettingsPanelElevated,
  AddProviderTitle,
  AddProviderStack,
  SettingsLabelBlock,
  SettingsSelect,
  AddProviderButtonRow,
  SettingsButtonPrimary,
  SettingsButtonSecondary,
} from "../../styles/settings.styled";
function AddProviderForm({
  showAddProvider,
  onShowAddProvider,
  selectedTemplate,
  onSelectedTemplateChange,
  onAddProvider,
}) {
  if (!showAddProvider) {
    return (
      <AddProviderRevealButton
        type="button"
        data-testid="add-provider-reveal"
        onClick={() => onShowAddProvider(true)}
      >
        <Plus size={20} aria-hidden />
        Add LLM Provider
      </AddProviderRevealButton>
    );
  }
  return (
    <SettingsPanelElevated data-testid="add-provider-panel">
      <AddProviderTitle>Add New Provider</AddProviderTitle>
      <AddProviderStack>
        <div>
          <SettingsLabelBlock htmlFor="provider-type-select">
            Select Provider Type
          </SettingsLabelBlock>
          <SettingsSelect
            id="provider-type-select"
            value={selectedTemplate}
            onChange={(e) => onSelectedTemplateChange(e.target.value)}
          >
            <option value="openai">OpenAI (GPT-4, GPT-3.5, etc.)</option>
            <option value="anthropic">Anthropic (Claude)</option>
            <option value="gemini">Google Gemini</option>
            <option value="custom">Custom Provider</option>
          </SettingsSelect>
        </div>
        <AddProviderButtonRow>
          <SettingsButtonPrimary type="button" onClick={onAddProvider}>
            Add Provider
          </SettingsButtonPrimary>
          <SettingsButtonSecondary
            type="button"
            onClick={() => onShowAddProvider(false)}
          >
            Cancel
          </SettingsButtonSecondary>
        </AddProviderButtonRow>
      </AddProviderStack>
    </SettingsPanelElevated>
  );
}

AddProviderForm.propTypes = {
  showAddProvider: PropTypes.bool.isRequired,
  onShowAddProvider: PropTypes.func.isRequired,
  selectedTemplate: PropTypes.string.isRequired,
  onSelectedTemplateChange: PropTypes.func.isRequired,
  onAddProvider: PropTypes.func.isRequired,
};

export { AddProviderForm };
