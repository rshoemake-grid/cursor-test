import { jsx, jsxs } from "react/jsx-runtime";
import { SettingsTabButton } from "./SettingsTabButton";
import { SETTINGS_TABS } from "../../constants/settingsConstants";
function SettingsTabs({
  activeTab,
  onTabChange
}) {
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-2 min-w-[170px]", children: [
    /* @__PURE__ */ jsx(
      SettingsTabButton,
      {
        label: "LLM Providers",
        isActive: activeTab === SETTINGS_TABS.LLM,
        onClick: () => onTabChange(SETTINGS_TABS.LLM)
      }
    ),
    /* @__PURE__ */ jsx(
      SettingsTabButton,
      {
        label: "Workflow Generation",
        isActive: activeTab === SETTINGS_TABS.WORKFLOW,
        onClick: () => onTabChange(SETTINGS_TABS.WORKFLOW)
      }
    )
  ] });
}
export {
  SettingsTabs
};
