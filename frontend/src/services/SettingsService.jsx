import { API_CONFIG, STORAGE_KEYS } from "../config/constants";
import { logger } from "../utils/logger";
import { extractApiErrorMessage } from "../hooks/utils/apiUtils";
import { buildAuthHeaders } from "../hooks/utils/apiUtils";
class SettingsService {
  constructor(httpClient, storage, apiBaseUrl) {
    this.httpClient = httpClient;
    this.storage = storage;
    this.apiBaseUrl = apiBaseUrl;
  }
  /**
   * Save settings to both backend and local storage
   * 
   * @param settings - Settings to save
   * @param token - Authentication token (optional)
   */
  async saveSettings(settings, token) {
    if (this.storage) {
      this.storage.setItem(STORAGE_KEYS.LLM_SETTINGS, JSON.stringify(settings));
    }
    if (token) {
      try {
        const headers = buildAuthHeaders({ token });
        const response = await this.httpClient.post(
          `${this.apiBaseUrl}${API_CONFIG.ENDPOINTS.SETTINGS}/llm`,
          settings,
          headers
        );
        if (!response.ok) {
          const errBody = await response.json().catch(() => ({}));
          throw new Error(extractApiErrorMessage(errBody, `Failed to save settings: ${response.status} ${response.statusText}`));
        }
      } catch (error) {
        logger.error("Failed to sync settings to backend:", error);
        throw error;
      }
    }
  }
  /**
   * Test provider connection
   * 
   * @param provider - Provider to test
   * @returns Test result with status and message
   */
  async testProvider(provider) {
    try {
      const response = await this.httpClient.post(
        `${this.apiBaseUrl}${API_CONFIG.ENDPOINTS.LLM.TEST}`,
        {
          type: provider.type,
          api_key: provider.apiKey,
          base_url: provider.baseUrl,
          model: provider.defaultModel
        },
        { "Content-Type": "application/json" }
      );
      const data = await response.json();
      if (data.status === "success") {
        return { status: "success", message: data.message };
      }
      const errorMessage = data.error?.message || data.message || "Connection failed";
      return { status: "error", message: errorMessage };
    } catch (error) {
      return {
        status: "error",
        message: extractApiErrorMessage(error, "Network error - check if backend is running")
      };
    }
  }
}
export {
  SettingsService
};
