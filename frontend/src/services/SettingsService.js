/**
 * Settings Service
 * Single Responsibility: Only handles settings persistence
 * DRY: Centralized settings save logic
 */ function _define_property(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        obj[key] = value;
    }
    return obj;
}
import { API_CONFIG, STORAGE_KEYS } from '../config/constants';
import { logger } from '../utils/logger';
import { extractApiErrorMessage } from '../hooks/utils/apiUtils';
// Domain-based imports - Phase 7
import { buildAuthHeaders } from '../hooks/utils/apiUtils';
export class SettingsService {
    /**
   * Save settings to both backend and local storage
   * 
   * @param settings - Settings to save
   * @param token - Authentication token (optional)
   */ async saveSettings(settings, token) {
        // Save to local storage first
        if (this.storage) {
            this.storage.setItem(STORAGE_KEYS.LLM_SETTINGS, JSON.stringify(settings));
        }
        // Save to backend if authenticated
        if (token) {
            try {
                const headers = buildAuthHeaders({
                    token
                });
                const response = await this.httpClient.post(`${this.apiBaseUrl}${API_CONFIG.ENDPOINTS.SETTINGS}/llm`, settings, headers);
                // Check if response is ok
                if (!response.ok) {
                    const errBody = await response.json().catch(()=>({}));
                    throw new Error(extractApiErrorMessage(errBody, `Failed to save settings: ${response.status} ${response.statusText}`));
                }
            } catch (error) {
                // Log error and rethrow - caller should handle it
                logger.error('Failed to sync settings to backend:', error);
                throw error;
            }
        }
    }
    /**
   * Test provider connection
   * 
   * @param provider - Provider to test
   * @returns Test result with status and message
   */ async testProvider(provider) {
        try {
            const response = await this.httpClient.post(`${this.apiBaseUrl}${API_CONFIG.ENDPOINTS.LLM.TEST}`, {
                type: provider.type,
                api_key: provider.apiKey,
                base_url: provider.baseUrl,
                model: provider.defaultModel
            }, {
                'Content-Type': 'application/json'
            });
            const data = await response.json();
            if (data.status === 'success') {
                return {
                    status: 'success',
                    message: data.message
                };
            }
            // Apigee-compatible error format: { error: { message } } or legacy { status, message }
            const errorMessage = data.error?.message || data.message || 'Connection failed';
            return {
                status: 'error',
                message: errorMessage
            };
        } catch (error) {
            return {
                status: 'error',
                message: extractApiErrorMessage(error, 'Network error - check if backend is running')
            };
        }
    }
    constructor(httpClient, storage, apiBaseUrl){
        _define_property(this, "httpClient", void 0);
        _define_property(this, "storage", void 0);
        _define_property(this, "apiBaseUrl", void 0);
        this.httpClient = httpClient;
        this.storage = storage;
        this.apiBaseUrl = apiBaseUrl;
    }
}
