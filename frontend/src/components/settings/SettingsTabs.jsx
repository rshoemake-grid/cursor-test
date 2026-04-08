import PropTypes from "prop-types";
import { SettingsTabButton } from "./SettingsTabButton";
import { SETTINGS_TABS } from "../../constants/settingsConstants";
import { SettingsTabsColumn } from "../../styles/settings.styled";
function SettingsTabs({ activeTab, onTabChange }) {
  return (
    <SettingsTabsColumn data-testid="settings-tabs-column">
      <SettingsTabButton
        label="LLM Providers"
        isActive={activeTab === SETTINGS_TABS.LLM}
        onClick={() => onTabChange(SETTINGS_TABS.LLM)}
      />
      <SettingsTabButton
        label="Workflow Generation"
        isActive={activeTab === SETTINGS_TABS.WORKFLOW}
        onClick={() => onTabChange(SETTINGS_TABS.WORKFLOW)}
      />
    </SettingsTabsColumn>
  );
}

SettingsTabs.propTypes = {
  activeTab: PropTypes.string.isRequired,
  onTabChange: PropTypes.func.isRequired,
};

export { SettingsTabs };
