import { SettingsTabButton } from "./SettingsTabButton";
import { SETTINGS_TABS } from "../../constants/settingsConstants";
function SettingsTabs({ activeTab, onTabChange }) {
  return (
    <div className="flex flex-col gap-2 min-w-[170px]">
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
    </div>
  );
}
export { SettingsTabs };
