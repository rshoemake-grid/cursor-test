import { useMemo, useCallback } from "react";
import { showError, showSuccess } from "../../utils/notifications";
import { useAutoSave } from "../storage";
function useSettingsSync(options) {
  const {
    isAuthenticated,
    token,
    providers,
    iterationLimit,
    defaultModel,
    settingsService,
    settingsLoaded,
    consoleAdapter
  } = options;
  const autoSaveSettings = useMemo(() => async () => {
    if (!isAuthenticated || !token || !settingsLoaded) return;
    try {
      await settingsService.saveSettings({
        providers,
        iteration_limit: iterationLimit,
        default_model: defaultModel
      }, token);
      consoleAdapter.log("Settings auto-saved to backend");
    } catch (error) {
      consoleAdapter.error("Failed to auto-save settings:", error);
    }
  }, [settingsService, providers, iterationLimit, defaultModel, isAuthenticated, token, settingsLoaded, consoleAdapter]);
  useAutoSave(
    { providers, iterationLimit, defaultModel },
    autoSaveSettings,
    500,
    !!(isAuthenticated && token && settingsLoaded)
  );
  const handleManualSync = useCallback(async () => {
    if (!isAuthenticated) {
      showError("Sign in to sync your LLM settings with the server.");
      return;
    }
    try {
      await settingsService.saveSettings({
        providers,
        iteration_limit: iterationLimit,
        default_model: defaultModel
      }, token);
      showSuccess("Settings synced to backend successfully!");
    } catch (error) {
      showError("Error syncing settings: " + error);
    }
  }, [isAuthenticated, token, providers, iterationLimit, defaultModel, settingsService]);
  return {
    handleManualSync
  };
}
export {
  useSettingsSync
};
