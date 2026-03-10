/**
 * Settings Service
 * Single Responsibility: Only handles settings persistence
 * DRY: Centralized settings save logic
 */

import type { StorageAdapter, HttpClient } from '../types/adapters'
import { API_CONFIG, STORAGE_KEYS } from '../config/constants'
import { logger } from '../utils/logger'
import { extractApiErrorMessage } from '../hooks/utils/apiUtils'
// Domain-based imports - Phase 7
import { buildAuthHeaders } from '../hooks/utils/apiUtils'
import type { LLMProvider } from '../hooks/providers'

export interface LLMSettings {
  providers: LLMProvider[]
  iteration_limit: number
  default_model: string
}

export class SettingsService {
  constructor(
    private httpClient: HttpClient,
    private storage: StorageAdapter | null,
    private apiBaseUrl: string
  ) {}

  /**
   * Save settings to both backend and local storage
   * 
   * @param settings - Settings to save
   * @param token - Authentication token (optional)
   */
  async saveSettings(settings: LLMSettings, token?: string | null): Promise<void> {
    // Save to local storage first
    if (this.storage) {
      this.storage.setItem(STORAGE_KEYS.LLM_SETTINGS, JSON.stringify(settings));
    }

    // Save to backend if authenticated
    if (token) {
      try {
        const headers = buildAuthHeaders({ token });
        const response = await this.httpClient.post(
          `${this.apiBaseUrl}${API_CONFIG.ENDPOINTS.SETTINGS}/llm`,
          settings,
          headers
        );
        
        // Check if response is ok
        if (!response.ok) {
          const errBody = await response.json().catch(() => ({}));
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
   */
  async testProvider(provider: LLMProvider): Promise<{ status: 'success' | 'error'; message: string }> {
    try {
      const response = await this.httpClient.post(
        `${this.apiBaseUrl}${API_CONFIG.ENDPOINTS.LLM.TEST}`,
        {
          type: provider.type,
          api_key: provider.apiKey,
          base_url: provider.baseUrl,
          model: provider.defaultModel
        },
        { 'Content-Type': 'application/json' }
      );

      const data = await response.json();
      
      if (data.status === 'success') {
        return { status: 'success', message: data.message };
      } else {
        return { status: 'error', message: data.message || 'Connection failed' };
      }
    } catch (error: any) {
      return {
        status: 'error',
        message: extractApiErrorMessage(error, 'Network error - check if backend is running')
      };
    }
  }
}
