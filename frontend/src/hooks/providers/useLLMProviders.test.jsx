import { renderHook, waitFor } from "@testing-library/react";
const waitForWithTimeout = (callback, timeout = 2e3) => {
  return waitFor(callback, { timeout });
};
import { useLLMProviders } from "./useLLMProviders";
import { api } from "../../api/client";
import { logger } from "../../utils/logger";
jest.mock("../../api/client", () => ({
  api: {
    getLLMSettings: jest.fn()
  }
}));
jest.mock("../../utils/logger", () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn()
  }
}));
const mockApi = api;
const mockLogger = logger;
describe("useLLMProviders", () => {
  let mockStorage;
  beforeEach(() => {
    jest.clearAllMocks();
    mockStorage = {
      getItem: jest.fn(),
      setItem: jest.fn()
    };
  });
  it("should initialize with loading state", () => {
    mockApi.getLLMSettings.mockRejectedValue(new Error("Network error"));
    const { result } = renderHook(() => useLLMProviders({ storage: mockStorage }));
    expect(result.current.isLoading).toBe(true);
  });
  it("should load providers from API successfully", async () => {
    const mockProviders = [
      {
        id: "provider1",
        name: "OpenAI",
        type: "openai",
        enabled: true,
        models: ["gpt-4", "gpt-3.5-turbo"]
      },
      {
        id: "provider2",
        name: "Anthropic",
        type: "anthropic",
        enabled: true,
        models: ["claude-3-opus"]
      }
    ];
    mockApi.getLLMSettings.mockResolvedValue({
      providers: mockProviders,
      iteration_limit: 10,
      default_model: "gpt-4"
    });
    const { result } = renderHook(
      () => useLLMProviders({ storage: mockStorage, isAuthenticated: true })
    );
    await waitForWithTimeout(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.providers).toEqual(mockProviders);
    expect(result.current.availableModels).toHaveLength(3);
    expect(result.current.availableModels[0]).toEqual({
      value: "gpt-4",
      label: "gpt-4 (OpenAI)",
      provider: "OpenAI"
    });
    expect(result.current.iterationLimit).toBe(10);
    expect(result.current.defaultModel).toBe("gpt-4");
  });
  it("should save API response to storage", async () => {
    const mockProviders = [
      {
        id: "provider1",
        name: "OpenAI",
        type: "openai",
        enabled: true,
        models: ["gpt-4"]
      }
    ];
    mockApi.getLLMSettings.mockResolvedValue({
      providers: mockProviders,
      iteration_limit: 5,
      default_model: "gpt-4"
    });
    renderHook(() => useLLMProviders({ storage: mockStorage, isAuthenticated: true }));
    await waitForWithTimeout(() => {
      expect(mockStorage.setItem).toHaveBeenCalledWith(
        "llm_settings",
        JSON.stringify({
          providers: mockProviders,
          iteration_limit: 5,
          default_model: "gpt-4"
        })
      );
    });
  });
  it("should fallback to storage when API fails", async () => {
    const storedProviders = [
      {
        id: "provider1",
        name: "OpenAI",
        type: "openai",
        enabled: true,
        models: ["gpt-4"]
      }
    ];
    mockApi.getLLMSettings.mockRejectedValue(new Error("Network error"));
    mockStorage.getItem.mockReturnValue(
      JSON.stringify({
        providers: storedProviders,
        iteration_limit: 8,
        default_model: "gpt-3.5-turbo"
      })
    );
    const { result } = renderHook(
      () => useLLMProviders({ storage: mockStorage, isAuthenticated: true })
    );
    await waitForWithTimeout(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.providers).toEqual(storedProviders);
    expect(result.current.availableModels).toHaveLength(1);
    expect(result.current.iterationLimit).toBe(8);
    expect(result.current.defaultModel).toBe("gpt-3.5-turbo");
  });
  it("should fallback to default models when no providers found", async () => {
    mockApi.getLLMSettings.mockResolvedValue({ providers: [] });
    mockStorage.getItem.mockReturnValue(null);
    const { result } = renderHook(
      () => useLLMProviders({ storage: mockStorage, isAuthenticated: true })
    );
    await waitForWithTimeout(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.availableModels).toHaveLength(4);
    expect(result.current.availableModels[0].value).toBe("gpt-4o-mini");
    expect(result.current.providers).toEqual([]);
  });
  it("should filter out disabled providers", async () => {
    const mockProviders = [
      {
        id: "provider1",
        name: "OpenAI",
        type: "openai",
        enabled: true,
        models: ["gpt-4"]
      },
      {
        id: "provider2",
        name: "Anthropic",
        type: "anthropic",
        enabled: false,
        models: ["claude-3-opus"]
      }
    ];
    mockApi.getLLMSettings.mockResolvedValue({ providers: mockProviders });
    const { result } = renderHook(
      () => useLLMProviders({ storage: mockStorage, isAuthenticated: true })
    );
    await waitForWithTimeout(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.availableModels).toHaveLength(1);
    expect(result.current.availableModels[0].provider).toBe("OpenAI");
  });
  it("should filter out providers with no models", async () => {
    const mockProviders = [
      {
        id: "provider1",
        name: "OpenAI",
        type: "openai",
        enabled: true,
        models: ["gpt-4"]
      },
      {
        id: "provider2",
        name: "Empty Provider",
        type: "openai",
        enabled: true,
        models: []
      }
    ];
    mockApi.getLLMSettings.mockResolvedValue({ providers: mockProviders });
    const { result } = renderHook(
      () => useLLMProviders({ storage: mockStorage, isAuthenticated: true })
    );
    await waitForWithTimeout(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.availableModels).toHaveLength(1);
  });
  it("should call onLoadComplete callback when providers are loaded", async () => {
    const mockProviders = [
      {
        id: "provider1",
        name: "OpenAI",
        type: "openai",
        enabled: true,
        models: ["gpt-4"]
      }
    ];
    mockApi.getLLMSettings.mockResolvedValue({
      providers: mockProviders,
      iteration_limit: 10,
      default_model: "gpt-4"
    });
    const onLoadComplete = jest.fn();
    renderHook(
      () => useLLMProviders({
        storage: mockStorage,
        isAuthenticated: true,
        onLoadComplete
      })
    );
    await waitForWithTimeout(() => {
      expect(onLoadComplete).toHaveBeenCalledWith({
        providers: mockProviders,
        iteration_limit: 10,
        default_model: "gpt-4"
      });
    });
  });
  it("should handle storage errors gracefully", async () => {
    mockApi.getLLMSettings.mockRejectedValue(new Error("Network error"));
    mockStorage.getItem.mockImplementation(() => {
      throw new Error("Storage error");
    });
    const { result } = renderHook(
      () => useLLMProviders({ storage: mockStorage, isAuthenticated: true })
    );
    await waitForWithTimeout(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(mockLogger.error).toHaveBeenCalled();
    expect(result.current.availableModels).toHaveLength(4);
  });
  it("should handle invalid JSON in storage", async () => {
    mockApi.getLLMSettings.mockRejectedValue(new Error("Network error"));
    mockStorage.getItem.mockReturnValue("invalid json");
    const { result } = renderHook(
      () => useLLMProviders({ storage: mockStorage, isAuthenticated: true })
    );
    await waitForWithTimeout(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(mockLogger.error).toHaveBeenCalled();
    expect(result.current.availableModels).toHaveLength(4);
  });
  it("should work without storage", async () => {
    mockApi.getLLMSettings.mockResolvedValue({ providers: [] });
    const { result } = renderHook(
      () => useLLMProviders({ storage: null, isAuthenticated: true })
    );
    await waitForWithTimeout(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.availableModels).toHaveLength(4);
  });
  it("should handle storage save errors gracefully", async () => {
    const mockProviders = [
      {
        id: "provider1",
        name: "OpenAI",
        type: "openai",
        enabled: true,
        models: ["gpt-4"]
      }
    ];
    mockApi.getLLMSettings.mockResolvedValue({ providers: mockProviders });
    mockStorage.setItem.mockImplementation(() => {
      throw new Error("Storage quota exceeded");
    });
    const { result } = renderHook(
      () => useLLMProviders({ storage: mockStorage, isAuthenticated: true })
    );
    await waitForWithTimeout(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(mockLogger.error).toHaveBeenCalled();
    expect(result.current.availableModels).toHaveLength(1);
  });
  it("should fallback to defaults when providers have no valid models", async () => {
    const mockProviders = [
      {
        id: "provider1",
        name: "OpenAI",
        type: "openai",
        enabled: true,
        models: void 0
      }
    ];
    mockApi.getLLMSettings.mockResolvedValue({ providers: mockProviders });
    mockStorage.getItem.mockReturnValue(null);
    const { result } = renderHook(
      () => useLLMProviders({ storage: mockStorage, isAuthenticated: true })
    );
    await waitForWithTimeout(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.availableModels).toHaveLength(4);
    expect(result.current.providers).toEqual([]);
  });
  describe("extractModelsFromProviders edge cases", () => {
    it("should not extract models from disabled providers", async () => {
      const mockProviders = [
        {
          id: "provider1",
          name: "OpenAI",
          type: "openai",
          enabled: false,
          // Disabled
          models: ["gpt-4"]
        }
      ];
      mockApi.getLLMSettings.mockResolvedValue({ providers: mockProviders });
      const { result } = renderHook(
        () => useLLMProviders({ storage: mockStorage, isAuthenticated: true })
      );
      await waitForWithTimeout(() => {
        expect(result.current.isLoading).toBe(false);
      });
      expect(result.current.availableModels).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ value: "gpt-4o-mini" })
        ])
      );
    });
    it("should not extract models when provider.models is undefined", async () => {
      const mockProviders = [
        {
          id: "provider1",
          name: "OpenAI",
          type: "openai",
          enabled: true
          // models is undefined
        }
      ];
      mockApi.getLLMSettings.mockResolvedValue({ providers: mockProviders });
      const { result } = renderHook(
        () => useLLMProviders({ storage: mockStorage, isAuthenticated: true })
      );
      await waitForWithTimeout(() => {
        expect(result.current.isLoading).toBe(false);
      });
      expect(result.current.availableModels.length).toBeGreaterThan(0);
    });
    it("should not extract models when provider.models is empty array", async () => {
      const mockProviders = [
        {
          id: "provider1",
          name: "OpenAI",
          type: "openai",
          enabled: true,
          models: []
          // Empty array
        }
      ];
      mockApi.getLLMSettings.mockResolvedValue({ providers: mockProviders });
      const { result } = renderHook(
        () => useLLMProviders({ storage: mockStorage, isAuthenticated: true })
      );
      await waitForWithTimeout(() => {
        expect(result.current.isLoading).toBe(false);
      });
      expect(result.current.availableModels.length).toBeGreaterThan(0);
    });
    it("should verify provider.enabled && provider.models && provider.models.length > 0 check", async () => {
      const mockProviders = [
        {
          id: "provider1",
          name: "OpenAI",
          type: "openai",
          enabled: true,
          models: ["gpt-4"]
        },
        {
          id: "provider2",
          name: "Disabled",
          type: "openai",
          enabled: false,
          // Disabled - should be skipped
          models: ["gpt-3.5"]
        },
        {
          id: "provider3",
          name: "No Models",
          type: "openai",
          enabled: true,
          models: void 0
          // No models - should be skipped
        },
        {
          id: "provider4",
          name: "Empty Models",
          type: "openai",
          enabled: true,
          models: []
          // Empty - should be skipped
        }
      ];
      mockApi.getLLMSettings.mockResolvedValue({ providers: mockProviders });
      const { result } = renderHook(
        () => useLLMProviders({ storage: mockStorage, isAuthenticated: true })
      );
      await waitForWithTimeout(() => {
        expect(result.current.isLoading).toBe(false);
      });
      expect(result.current.availableModels).toHaveLength(1);
      expect(result.current.availableModels[0].value).toBe("gpt-4");
    });
  });
  describe("loadFromStorage edge cases", () => {
    it("should return null when storage is null", async () => {
      mockApi.getLLMSettings.mockRejectedValue(new Error("Network error"));
      const { result } = renderHook(
        () => useLLMProviders({ storage: null, isAuthenticated: true })
      );
      await waitForWithTimeout(() => {
        expect(result.current.isLoading).toBe(false);
      });
      expect(result.current.availableModels.length).toBeGreaterThan(0);
    });
    it("should return null when storage.getItem returns null", async () => {
      mockStorage.getItem.mockReturnValue(null);
      mockApi.getLLMSettings.mockRejectedValue(new Error("Network error"));
      const { result } = renderHook(
        () => useLLMProviders({ storage: mockStorage, isAuthenticated: true })
      );
      await waitForWithTimeout(() => {
        expect(result.current.isLoading).toBe(false);
      });
      expect(result.current.availableModels.length).toBeGreaterThan(0);
    });
    it("should handle JSON.parse error in loadFromStorage", async () => {
      mockStorage.getItem.mockReturnValue("invalid json");
      mockApi.getLLMSettings.mockRejectedValue(new Error("Network error"));
      const { result } = renderHook(
        () => useLLMProviders({ storage: mockStorage, isAuthenticated: true })
      );
      await waitForWithTimeout(() => {
        expect(result.current.isLoading).toBe(false);
      });
      expect(mockLogger.error).toHaveBeenCalledWith(
        "Failed to parse LLM settings from storage:",
        expect.any(Error)
      );
      expect(result.current.availableModels.length).toBeGreaterThan(0);
    });
    it("should use fallback for parsed.providers when missing", async () => {
      mockStorage.getItem.mockReturnValue(JSON.stringify({
        // No providers field
        iteration_limit: 10
      }));
      mockApi.getLLMSettings.mockRejectedValue(new Error("Network error"));
      const { result } = renderHook(
        () => useLLMProviders({ storage: mockStorage, isAuthenticated: true })
      );
      await waitForWithTimeout(() => {
        expect(result.current.isLoading).toBe(false);
      });
      expect(result.current.availableModels.length).toBeGreaterThan(0);
    });
  });
  describe("API response handling edge cases", () => {
    it("should verify data.providers && data.providers.length > 0 check", async () => {
      mockApi.getLLMSettings.mockResolvedValue({
        // No providers field
        iteration_limit: 10
      });
      const { result } = renderHook(
        () => useLLMProviders({ storage: mockStorage, isAuthenticated: true })
      );
      await waitForWithTimeout(() => {
        expect(result.current.isLoading).toBe(false);
      });
      expect(result.current.availableModels.length).toBeGreaterThan(0);
    });
    it("should verify data.providers.length === 0 path", async () => {
      mockApi.getLLMSettings.mockResolvedValue({
        providers: [],
        // Empty array
        iteration_limit: 10
      });
      const { result } = renderHook(
        () => useLLMProviders({ storage: mockStorage, isAuthenticated: true })
      );
      await waitForWithTimeout(() => {
        expect(result.current.isLoading).toBe(false);
      });
      expect(result.current.availableModels.length).toBeGreaterThan(0);
    });
    it("should verify models.length > 0 check before using API data", async () => {
      const mockProviders = [
        {
          id: "provider1",
          name: "OpenAI",
          type: "openai",
          enabled: false
          // Disabled, so no models extracted
        }
      ];
      mockApi.getLLMSettings.mockResolvedValue({
        providers: mockProviders
      });
      const { result } = renderHook(
        () => useLLMProviders({ storage: mockStorage, isAuthenticated: true })
      );
      await waitForWithTimeout(() => {
        expect(result.current.isLoading).toBe(false);
      });
      expect(result.current.availableModels.length).toBeGreaterThan(0);
    });
    it("should verify typeof data.iteration_limit === number check", async () => {
      const mockProviders = [
        {
          id: "provider1",
          name: "OpenAI",
          type: "openai",
          enabled: true,
          models: ["gpt-4"]
        }
      ];
      mockApi.getLLMSettings.mockResolvedValue({
        providers: mockProviders,
        iteration_limit: "10"
        // String, not number
      });
      const { result } = renderHook(
        () => useLLMProviders({ storage: mockStorage, isAuthenticated: true })
      );
      await waitForWithTimeout(() => {
        expect(result.current.isLoading).toBe(false);
      });
      expect(result.current.iterationLimit).toBeUndefined();
    });
    it("should verify data.default_model check", async () => {
      const mockProviders = [
        {
          id: "provider1",
          name: "OpenAI",
          type: "openai",
          enabled: true,
          models: ["gpt-4"]
        }
      ];
      mockApi.getLLMSettings.mockResolvedValue({
        providers: mockProviders,
        default_model: ""
        // Empty string
      });
      const { result } = renderHook(
        () => useLLMProviders({ storage: mockStorage, isAuthenticated: true })
      );
      await waitForWithTimeout(() => {
        expect(result.current.isLoading).toBe(false);
      });
      expect(result.current.defaultModel).toBeUndefined();
    });
    it('should verify data.default_model || "" fallback in storage save', async () => {
      const mockProviders = [
        {
          id: "provider1",
          name: "OpenAI",
          type: "openai",
          enabled: true,
          models: ["gpt-4"]
        }
      ];
      mockApi.getLLMSettings.mockResolvedValue({
        providers: mockProviders
        // No default_model
      });
      const { result } = renderHook(
        () => useLLMProviders({ storage: mockStorage, isAuthenticated: true })
      );
      await waitForWithTimeout(() => {
        expect(result.current.isLoading).toBe(false);
      });
      expect(mockStorage.setItem).toHaveBeenCalled();
      const savedData = JSON.parse(mockStorage.setItem.mock.calls[0][1]);
      expect(savedData.default_model).toBe("");
    });
    it("should handle storage.setItem error", async () => {
      const mockProviders = [
        {
          id: "provider1",
          name: "OpenAI",
          type: "openai",
          enabled: true,
          models: ["gpt-4"]
        }
      ];
      mockApi.getLLMSettings.mockResolvedValue({
        providers: mockProviders
      });
      mockStorage.setItem.mockImplementation(() => {
        throw new Error("Storage error");
      });
      const { result } = renderHook(
        () => useLLMProviders({ storage: mockStorage, isAuthenticated: true })
      );
      await waitForWithTimeout(() => {
        expect(result.current.isLoading).toBe(false);
      });
      expect(mockLogger.error).toHaveBeenCalledWith(
        "Failed to save LLM settings to storage:",
        expect.any(Error)
      );
      expect(result.current.availableModels.length).toBeGreaterThan(0);
    });
    it("should verify onLoadComplete check before calling", async () => {
      const mockProviders = [
        {
          id: "provider1",
          name: "OpenAI",
          type: "openai",
          enabled: true,
          models: ["gpt-4"]
        }
      ];
      mockApi.getLLMSettings.mockResolvedValue({
        providers: mockProviders
      });
      const { result } = renderHook(
        () => useLLMProviders({
          storage: mockStorage,
          isAuthenticated: true,
          onLoadComplete: void 0
        })
      );
      await waitForWithTimeout(() => {
        expect(result.current.isLoading).toBe(false);
      });
      expect(result.current.availableModels.length).toBeGreaterThan(0);
    });
    it("should verify storedSettings.providers.length > 0 check", async () => {
      mockStorage.getItem.mockReturnValue(JSON.stringify({
        providers: [],
        // Empty array
        iteration_limit: 10
      }));
      mockApi.getLLMSettings.mockRejectedValue(new Error("Network error"));
      const { result } = renderHook(
        () => useLLMProviders({ storage: mockStorage, isAuthenticated: true })
      );
      await waitForWithTimeout(() => {
        expect(result.current.isLoading).toBe(false);
      });
      expect(result.current.availableModels.length).toBeGreaterThan(0);
    });
    it("should verify typeof storedSettings.iteration_limit === number check", async () => {
      mockStorage.getItem.mockReturnValue(JSON.stringify({
        providers: [
          {
            id: "provider1",
            name: "OpenAI",
            type: "openai",
            enabled: true,
            models: ["gpt-4"]
          }
        ],
        iteration_limit: "10"
        // String, not number
      }));
      mockApi.getLLMSettings.mockRejectedValue(new Error("Network error"));
      const { result } = renderHook(
        () => useLLMProviders({ storage: mockStorage, isAuthenticated: true })
      );
      await waitForWithTimeout(() => {
        expect(result.current.isLoading).toBe(false);
      });
      expect(result.current.iterationLimit).toBeUndefined();
    });
    it("should verify storedSettings.default_model check", async () => {
      mockStorage.getItem.mockReturnValue(JSON.stringify({
        providers: [
          {
            id: "provider1",
            name: "OpenAI",
            type: "openai",
            enabled: true,
            models: ["gpt-4"]
          }
        ],
        default_model: ""
        // Empty string
      }));
      mockApi.getLLMSettings.mockRejectedValue(new Error("Network error"));
      const { result } = renderHook(
        () => useLLMProviders({ storage: mockStorage, isAuthenticated: true })
      );
      await waitForWithTimeout(() => {
        expect(result.current.isLoading).toBe(false);
      });
      expect(result.current.defaultModel).toBeUndefined();
    });
    it("should verify onLoadComplete is called with correct data structure", async () => {
      const onLoadComplete = jest.fn();
      const mockProviders = [
        {
          id: "provider1",
          name: "OpenAI",
          type: "openai",
          enabled: true,
          models: ["gpt-4"]
        }
      ];
      mockApi.getLLMSettings.mockResolvedValue({
        providers: mockProviders,
        iteration_limit: 10,
        default_model: "gpt-4"
      });
      renderHook(
        () => useLLMProviders({
          storage: mockStorage,
          isAuthenticated: true,
          onLoadComplete
        })
      );
      await waitForWithTimeout(() => {
        expect(onLoadComplete).toHaveBeenCalled();
      });
      expect(onLoadComplete).toHaveBeenCalledWith({
        providers: mockProviders,
        iteration_limit: 10,
        default_model: "gpt-4"
      });
    });
    it("should verify onLoadComplete is called from storage path", async () => {
      const onLoadComplete = jest.fn();
      mockStorage.getItem.mockReturnValue(JSON.stringify({
        providers: [
          {
            id: "provider1",
            name: "OpenAI",
            type: "openai",
            enabled: true,
            models: ["gpt-4"]
          }
        ],
        iteration_limit: 5,
        default_model: "gpt-3.5-turbo"
      }));
      mockApi.getLLMSettings.mockRejectedValue(new Error("Network error"));
      renderHook(
        () => useLLMProviders({
          storage: mockStorage,
          isAuthenticated: true,
          onLoadComplete
        })
      );
      await waitForWithTimeout(() => {
        expect(onLoadComplete).toHaveBeenCalled();
      });
      expect(onLoadComplete).toHaveBeenCalledWith({
        providers: expect.any(Array),
        iteration_limit: 5,
        default_model: "gpt-3.5-turbo"
      });
    });
    it("should verify provider.enabled && provider.models && provider.models.length > 0 - all true", async () => {
      const mockProviders = [
        {
          id: "provider1",
          name: "OpenAI",
          type: "openai",
          enabled: true,
          models: ["gpt-4", "gpt-3.5-turbo"]
        }
      ];
      mockApi.getLLMSettings.mockResolvedValue({
        providers: mockProviders,
        iteration_limit: 10,
        default_model: "gpt-4"
      });
      const { result } = renderHook(
        () => useLLMProviders({
          storage: mockStorage,
          isAuthenticated: true
        })
      );
      await waitForWithTimeout(() => {
        expect(result.current.availableModels.length).toBeGreaterThan(0);
      });
      expect(result.current.availableModels.length).toBe(2);
    });
    it("should verify provider.enabled && provider.models && provider.models.length > 0 - enabled is false", async () => {
      const mockProviders = [
        {
          id: "provider1",
          name: "OpenAI",
          type: "openai",
          enabled: false,
          // Disabled
          models: ["gpt-4", "gpt-3.5-turbo"]
        }
      ];
      mockApi.getLLMSettings.mockResolvedValue({
        providers: mockProviders,
        iteration_limit: 10,
        default_model: "gpt-4"
      });
      const { result } = renderHook(
        () => useLLMProviders({
          storage: mockStorage,
          isAuthenticated: true
        })
      );
      await waitForWithTimeout(() => {
        expect(result.current.isLoading).toBe(false);
      });
      expect(result.current.availableModels.length).toBeGreaterThan(0);
    });
    it("should verify provider.enabled && provider.models && provider.models.length > 0 - models is undefined", async () => {
      const mockProviders = [
        {
          id: "provider1",
          name: "OpenAI",
          type: "openai",
          enabled: true
          // No models property
        }
      ];
      mockApi.getLLMSettings.mockResolvedValue({
        providers: mockProviders,
        iteration_limit: 10,
        default_model: "gpt-4"
      });
      const { result } = renderHook(
        () => useLLMProviders({
          storage: mockStorage,
          isAuthenticated: true
        })
      );
      await waitForWithTimeout(() => {
        expect(result.current.isLoading).toBe(false);
      });
      expect(result.current.availableModels.length).toBeGreaterThan(0);
    });
    it("should verify provider.enabled && provider.models && provider.models.length > 0 - models.length is 0", async () => {
      const mockProviders = [
        {
          id: "provider1",
          name: "OpenAI",
          type: "openai",
          enabled: true,
          models: []
          // Empty array
        }
      ];
      mockApi.getLLMSettings.mockResolvedValue({
        providers: mockProviders,
        iteration_limit: 10,
        default_model: "gpt-4"
      });
      const { result } = renderHook(
        () => useLLMProviders({
          storage: mockStorage,
          isAuthenticated: true
        })
      );
      await waitForWithTimeout(() => {
        expect(result.current.isLoading).toBe(false);
      });
      expect(result.current.availableModels.length).toBeGreaterThan(0);
    });
    it("should verify forEach on providers array", async () => {
      const mockProviders = [
        {
          id: "provider1",
          name: "OpenAI",
          type: "openai",
          enabled: true,
          models: ["gpt-4"]
        },
        {
          id: "provider2",
          name: "Anthropic",
          type: "anthropic",
          enabled: true,
          models: ["claude-3"]
        }
      ];
      mockApi.getLLMSettings.mockResolvedValue({
        providers: mockProviders,
        iteration_limit: 10,
        default_model: "gpt-4"
      });
      const { result } = renderHook(
        () => useLLMProviders({
          storage: mockStorage,
          isAuthenticated: true
        })
      );
      await waitForWithTimeout(() => {
        expect(result.current.availableModels.length).toBeGreaterThan(0);
      });
      expect(result.current.availableModels.length).toBe(2);
    });
    it("should verify forEach on models array", async () => {
      const mockProviders = [
        {
          id: "provider1",
          name: "OpenAI",
          type: "openai",
          enabled: true,
          models: ["gpt-4", "gpt-3.5-turbo", "gpt-4-turbo"]
        }
      ];
      mockApi.getLLMSettings.mockResolvedValue({
        providers: mockProviders,
        iteration_limit: 10,
        default_model: "gpt-4"
      });
      const { result } = renderHook(
        () => useLLMProviders({
          storage: mockStorage,
          isAuthenticated: true
        })
      );
      await waitForWithTimeout(() => {
        expect(result.current.availableModels.length).toBeGreaterThan(0);
      });
      expect(result.current.availableModels.length).toBe(3);
    });
    it("should verify template literal ${model} (${provider.name}) in label", async () => {
      const mockProviders = [
        {
          id: "provider1",
          name: "OpenAI",
          type: "openai",
          enabled: true,
          models: ["gpt-4"]
        }
      ];
      mockApi.getLLMSettings.mockResolvedValue({
        providers: mockProviders,
        iteration_limit: 10,
        default_model: "gpt-4"
      });
      const { result } = renderHook(
        () => useLLMProviders({
          storage: mockStorage,
          isAuthenticated: true
        })
      );
      await waitForWithTimeout(() => {
        expect(result.current.availableModels.length).toBeGreaterThan(0);
      });
      expect(result.current.availableModels[0].label).toBe("gpt-4 (OpenAI)");
    });
    it("should verify parsed.providers || [] fallback in loadFromStorage", async () => {
      mockStorage.getItem.mockReturnValue(JSON.stringify({
        // No providers field
        iteration_limit: 5,
        default_model: "gpt-3.5-turbo"
      }));
      mockApi.getLLMSettings.mockRejectedValue(new Error("Network error"));
      const { result } = renderHook(
        () => useLLMProviders({
          storage: mockStorage,
          isAuthenticated: true
        })
      );
      await waitForWithTimeout(() => {
        expect(result.current.isLoading).toBe(false);
      });
      expect(result.current.availableModels.length).toBeGreaterThan(0);
    });
    it("should verify data.providers || [] fallback in storage save", async () => {
      const mockProviders = [
        {
          id: "provider1",
          name: "OpenAI",
          type: "openai",
          enabled: true,
          models: ["gpt-4"]
        }
      ];
      mockApi.getLLMSettings.mockResolvedValue({
        providers: mockProviders,
        iteration_limit: 10,
        default_model: "gpt-4"
      });
      const { result } = renderHook(
        () => useLLMProviders({
          storage: mockStorage,
          isAuthenticated: true
        })
      );
      await waitForWithTimeout(() => {
        expect(result.current.isLoading).toBe(false);
      });
      expect(mockStorage.setItem).toHaveBeenCalledWith(
        "llm_settings",
        expect.stringContaining('"providers"')
      );
    });
    it('should verify data.default_model || "" fallback in storage save - default_model is undefined', async () => {
      const mockProviders = [
        {
          id: "provider1",
          name: "OpenAI",
          type: "openai",
          enabled: true,
          models: ["gpt-4"]
        }
      ];
      mockApi.getLLMSettings.mockResolvedValue({
        providers: mockProviders,
        iteration_limit: 10
        // No default_model
      });
      const { result } = renderHook(
        () => useLLMProviders({
          storage: mockStorage,
          isAuthenticated: true
        })
      );
      await waitForWithTimeout(() => {
        expect(result.current.isLoading).toBe(false);
      });
      const savedData = JSON.parse(mockStorage.setItem.mock.calls[0][1]);
      expect(savedData.default_model).toBe("");
    });
    it('should verify data.default_model || "" fallback in storage save - default_model has value', async () => {
      const mockProviders = [
        {
          id: "provider1",
          name: "OpenAI",
          type: "openai",
          enabled: true,
          models: ["gpt-4"]
        }
      ];
      mockApi.getLLMSettings.mockResolvedValue({
        providers: mockProviders,
        iteration_limit: 10,
        default_model: "gpt-4"
      });
      const { result } = renderHook(
        () => useLLMProviders({
          storage: mockStorage,
          isAuthenticated: true
        })
      );
      await waitForWithTimeout(() => {
        expect(result.current.isLoading).toBe(false);
      });
      const savedData = JSON.parse(mockStorage.setItem.mock.calls[0][1]);
      expect(savedData.default_model).toBe("gpt-4");
    });
    it("should verify models.length > 0 check in API path", async () => {
      const mockProviders = [
        {
          id: "provider1",
          name: "OpenAI",
          type: "openai",
          enabled: false,
          // Disabled, so no models extracted
          models: ["gpt-4"]
        }
      ];
      mockApi.getLLMSettings.mockResolvedValue({
        providers: mockProviders,
        iteration_limit: 10,
        default_model: "gpt-4"
      });
      const { result } = renderHook(
        () => useLLMProviders({
          storage: mockStorage,
          isAuthenticated: true
        })
      );
      await waitForWithTimeout(() => {
        expect(result.current.isLoading).toBe(false);
      });
      expect(result.current.availableModels.length).toBeGreaterThan(0);
    });
    it("should verify models.length > 0 check in storage path", async () => {
      mockStorage.getItem.mockReturnValue(JSON.stringify({
        providers: [
          {
            id: "provider1",
            name: "OpenAI",
            type: "openai",
            enabled: false,
            // Disabled
            models: ["gpt-4"]
          }
        ],
        iteration_limit: 5,
        default_model: "gpt-3.5-turbo"
      }));
      mockApi.getLLMSettings.mockRejectedValue(new Error("Network error"));
      const { result } = renderHook(
        () => useLLMProviders({
          storage: mockStorage,
          isAuthenticated: true
        })
      );
      await waitForWithTimeout(() => {
        expect(result.current.isLoading).toBe(false);
      });
      expect(result.current.availableModels.length).toBeGreaterThan(0);
    });
    it("should verify storedSettings && storedSettings.providers.length > 0 check", async () => {
      mockStorage.getItem.mockReturnValue(null);
      mockApi.getLLMSettings.mockRejectedValue(new Error("Network error"));
      const { result } = renderHook(
        () => useLLMProviders({
          storage: mockStorage,
          isAuthenticated: true
        })
      );
      await waitForWithTimeout(() => {
        expect(result.current.isLoading).toBe(false);
      });
      expect(result.current.availableModels.length).toBeGreaterThan(0);
    });
    it("should verify storedSettings && storedSettings.providers.length > 0 - providers.length is 0", async () => {
      mockStorage.getItem.mockReturnValue(JSON.stringify({
        providers: [],
        // Empty array
        iteration_limit: 5,
        default_model: "gpt-3.5-turbo"
      }));
      mockApi.getLLMSettings.mockRejectedValue(new Error("Network error"));
      const { result } = renderHook(
        () => useLLMProviders({
          storage: mockStorage,
          isAuthenticated: true
        })
      );
      await waitForWithTimeout(() => {
        expect(result.current.isLoading).toBe(false);
      });
      expect(result.current.availableModels.length).toBeGreaterThan(0);
    });
    it("should verify template literal ${model} (${provider.name}) exact format", async () => {
      const mockProviders = [
        {
          id: "provider1",
          name: "OpenAI",
          type: "openai",
          enabled: true,
          models: ["gpt-4", "gpt-3.5-turbo"]
        }
      ];
      mockApi.getLLMSettings.mockResolvedValue({
        providers: mockProviders,
        iteration_limit: 10,
        default_model: "gpt-4"
      });
      const { result } = renderHook(
        () => useLLMProviders({
          storage: mockStorage,
          isAuthenticated: true
        })
      );
      await waitForWithTimeout(() => {
        expect(result.current.availableModels.length).toBeGreaterThan(0);
      });
      expect(result.current.availableModels[0].label).toBe("gpt-4 (OpenAI)");
      expect(result.current.availableModels[1].label).toBe("gpt-3.5-turbo (OpenAI)");
    });
    it("should verify string literal provider exact value", async () => {
      const mockProviders = [
        {
          id: "provider1",
          name: "OpenAI",
          type: "openai",
          enabled: true,
          models: ["gpt-4"]
        }
      ];
      mockApi.getLLMSettings.mockResolvedValue({
        providers: mockProviders,
        iteration_limit: 10,
        default_model: "gpt-4"
      });
      const { result } = renderHook(
        () => useLLMProviders({
          storage: mockStorage,
          isAuthenticated: true
        })
      );
      await waitForWithTimeout(() => {
        expect(result.current.availableModels.length).toBeGreaterThan(0);
      });
      expect(result.current.availableModels[0].provider).toBe("OpenAI");
    });
    it("should verify provider.enabled && provider.models && provider.models.length > 0 - all conditions true", async () => {
      const mockProviders = [
        {
          id: "provider1",
          name: "OpenAI",
          type: "openai",
          enabled: true,
          // enabled is true
          models: ["gpt-4"]
          // models exists and length > 0
        }
      ];
      mockApi.getLLMSettings.mockResolvedValue({
        providers: mockProviders,
        iteration_limit: 10,
        default_model: "gpt-4"
      });
      const { result } = renderHook(
        () => useLLMProviders({
          storage: mockStorage,
          isAuthenticated: true
        })
      );
      await waitForWithTimeout(() => {
        expect(result.current.availableModels.length).toBeGreaterThan(0);
      });
      expect(result.current.availableModels.length).toBe(1);
    });
    it("should verify models.length > 0 exact comparison - length is 1", async () => {
      const mockProviders = [
        {
          id: "provider1",
          name: "OpenAI",
          type: "openai",
          enabled: true,
          models: ["gpt-4"]
          // length is 1, so > 0
        }
      ];
      mockApi.getLLMSettings.mockResolvedValue({
        providers: mockProviders,
        iteration_limit: 10,
        default_model: "gpt-4"
      });
      const { result } = renderHook(
        () => useLLMProviders({
          storage: mockStorage,
          isAuthenticated: true
        })
      );
      await waitForWithTimeout(() => {
        expect(result.current.isLoading).toBe(false);
      });
      expect(result.current.availableModels.length).toBe(1);
    });
    it("should verify storedSettings.providers.length > 0 exact comparison - length is 1", async () => {
      mockStorage.getItem.mockReturnValue(JSON.stringify({
        providers: [
          {
            id: "provider1",
            name: "OpenAI",
            type: "openai",
            enabled: true,
            models: ["gpt-4"]
          }
        ],
        // length is 1, so > 0
        iteration_limit: 5,
        default_model: "gpt-3.5-turbo"
      }));
      mockApi.getLLMSettings.mockRejectedValue(new Error("Network error"));
      const { result } = renderHook(
        () => useLLMProviders({
          storage: mockStorage,
          isAuthenticated: true
        })
      );
      await waitForWithTimeout(() => {
        expect(result.current.isLoading).toBe(false);
      });
      expect(result.current.availableModels.length).toBeGreaterThan(0);
    });
    it("should verify exact fallback values parsed.providers || []", async () => {
      mockStorage.getItem.mockReturnValue(JSON.stringify({
        providers: null
      }));
      mockApi.getLLMSettings.mockRejectedValue(new Error("Network error"));
      const { result } = renderHook(() => useLLMProviders({ storage: mockStorage }));
      await waitForWithTimeout(() => {
        expect(result.current.isLoading).toBe(false);
      });
      expect(result.current.providers).toEqual([]);
      expect(Array.isArray(result.current.providers)).toBe(true);
    });
    it("should verify exact fallback value default_model || empty string", async () => {
      mockApi.getLLMSettings.mockResolvedValue({
        providers: [
          { id: "openai", name: "OpenAI", type: "openai", enabled: true, models: ["gpt-4"] }
        ],
        default_model: null
      });
      const { result } = renderHook(() => useLLMProviders({ storage: mockStorage }));
      await waitForWithTimeout(() => {
        expect(result.current.isLoading).toBe(false);
      });
      const setItemCall = mockStorage.setItem.mock.calls.find(
        (call) => call[0] === "llm_settings"
      );
      if (setItemCall) {
        const saved = JSON.parse(setItemCall[1]);
        expect(saved.default_model).toBe("");
        expect(saved.default_model.length).toBe(0);
      }
    });
    it("should verify exact comparison provider.enabled && provider.models && provider.models.length > 0", async () => {
      const { useLLMProviders: useLLMProviders2 } = require("./useLLMProviders");
      mockApi.getLLMSettings.mockResolvedValue({
        providers: [
          { id: "openai", name: "OpenAI", type: "openai", enabled: false, models: ["gpt-4"] }
        ]
      });
      const { result: result1 } = renderHook(() => useLLMProviders2({ storage: mockStorage }));
      await waitForWithTimeout(() => {
        expect(result1.current.isLoading).toBe(false);
      });
      expect(result1.current.availableModels.length).toBeGreaterThan(0);
      mockApi.getLLMSettings.mockResolvedValue({
        providers: [
          { id: "openai", name: "OpenAI", type: "openai", enabled: true, models: void 0 }
        ]
      });
      const { result: result2 } = renderHook(() => useLLMProviders2({ storage: mockStorage }));
      await waitForWithTimeout(() => {
        expect(result2.current.isLoading).toBe(false);
      });
      expect(result2.current.availableModels.length).toBeGreaterThan(0);
      mockApi.getLLMSettings.mockResolvedValue({
        providers: [
          { id: "openai", name: "OpenAI", type: "openai", enabled: true, models: [] }
        ]
      });
      const { result: result3 } = renderHook(() => useLLMProviders2({ storage: mockStorage }));
      await waitForWithTimeout(() => {
        expect(result3.current.isLoading).toBe(false);
      });
      expect(result3.current.availableModels.length).toBeGreaterThan(0);
      mockApi.getLLMSettings.mockResolvedValue({
        providers: [
          { id: "openai", name: "OpenAI", type: "openai", enabled: true, models: ["gpt-4"] }
        ]
      });
      const { result: result4 } = renderHook(() => useLLMProviders2({ storage: mockStorage }));
      await waitForWithTimeout(() => {
        expect(result4.current.isLoading).toBe(false);
      });
      expect(result4.current.availableModels.length).toBeGreaterThan(0);
    });
    it("should verify exact comparison data.providers && data.providers.length > 0", async () => {
      mockApi.getLLMSettings.mockResolvedValue({
        providers: void 0
      });
      const { result: result1 } = renderHook(() => useLLMProviders({ storage: mockStorage }));
      await waitForWithTimeout(() => {
        expect(result1.current.isLoading).toBe(false);
      });
      expect(result1.current.availableModels.length).toBeGreaterThan(0);
      mockApi.getLLMSettings.mockResolvedValue({
        providers: []
      });
      const { result: result2 } = renderHook(() => useLLMProviders({ storage: mockStorage }));
      await waitForWithTimeout(() => {
        expect(result2.current.isLoading).toBe(false);
      });
      expect(result2.current.availableModels.length).toBeGreaterThan(0);
    });
    it("should verify exact comparison storedSettings.providers.length > 0", async () => {
      mockStorage.getItem.mockReturnValue(JSON.stringify({
        providers: []
      }));
      mockApi.getLLMSettings.mockRejectedValue(new Error("Network error"));
      const { result } = renderHook(() => useLLMProviders({ storage: mockStorage }));
      await waitForWithTimeout(() => {
        expect(result.current.isLoading).toBe(false);
      });
      expect(result.current.availableModels.length).toBeGreaterThan(0);
    });
    it("should verify exact comparison typeof data.iteration_limit === number", async () => {
      mockApi.getLLMSettings.mockResolvedValue({
        providers: [
          { id: "openai", name: "OpenAI", type: "openai", enabled: true, models: ["gpt-4"] }
        ],
        iteration_limit: 10
      });
      const { result } = renderHook(() => useLLMProviders({ storage: mockStorage }));
      await waitForWithTimeout(() => {
        expect(result.current.isLoading).toBe(false);
      });
      expect(result.current.iterationLimit).toBe(10);
      mockApi.getLLMSettings.mockResolvedValue({
        providers: [
          { id: "openai", name: "OpenAI", type: "openai", enabled: true, models: ["gpt-4"] }
        ],
        iteration_limit: "10"
      });
      const { result: result2 } = renderHook(() => useLLMProviders({ storage: mockStorage }));
      await waitForWithTimeout(() => {
        expect(result2.current.isLoading).toBe(false);
      });
      expect(result2.current.iterationLimit).toBeUndefined();
    });
  });
  describe("additional coverage for no-coverage mutants", () => {
    describe("extractModelsFromProviders - edge cases", () => {
      it("should handle provider.enabled is false", () => {
        const providers = [
          {
            id: "provider1",
            name: "OpenAI",
            type: "openai",
            enabled: false,
            // Disabled provider
            models: ["gpt-4"]
          }
        ];
        mockApi.getLLMSettings.mockResolvedValue({
          providers
        });
        const { result } = renderHook(
          () => useLLMProviders({ storage: mockStorage, isAuthenticated: true })
        );
        return waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false);
          expect(result.current.availableModels.length).toBeGreaterThan(0);
        });
      });
      it("should handle provider.models is null", () => {
        const providers = [
          {
            id: "provider1",
            name: "OpenAI",
            type: "openai",
            enabled: true,
            models: null
            // Null models
          }
        ];
        mockApi.getLLMSettings.mockResolvedValue({
          providers
        });
        const { result } = renderHook(
          () => useLLMProviders({ storage: mockStorage, isAuthenticated: true })
        );
        return waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false);
          expect(result.current.availableModels.length).toBeGreaterThan(0);
        });
      });
      it("should handle provider.models.length === 0 exact boundary", () => {
        const providers = [
          {
            id: "provider1",
            name: "OpenAI",
            type: "openai",
            enabled: true,
            models: []
            // Empty array - exact boundary
          }
        ];
        mockApi.getLLMSettings.mockResolvedValue({
          providers
        });
        const { result } = renderHook(
          () => useLLMProviders({ storage: mockStorage, isAuthenticated: true })
        );
        return waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false);
          expect(result.current.availableModels.length).toBeGreaterThan(0);
        });
      });
      it("should verify template literal exact construction", () => {
        const providers = [
          {
            id: "provider1",
            name: "OpenAI",
            type: "openai",
            enabled: true,
            models: ["gpt-4"]
          }
        ];
        mockApi.getLLMSettings.mockResolvedValue({
          providers
        });
        const { result } = renderHook(
          () => useLLMProviders({ storage: mockStorage, isAuthenticated: true })
        );
        return waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false);
          expect(result.current.availableModels[0].label).toBe("gpt-4 (OpenAI)");
        });
      });
    });
    describe("loadFromStorage - edge cases", () => {
      it("should handle saved is empty string", () => {
        mockStorage.getItem.mockReturnValue("");
        mockApi.getLLMSettings.mockRejectedValue(new Error("Network error"));
        const { result } = renderHook(
          () => useLLMProviders({ storage: mockStorage })
        );
        return waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false);
          expect(result.current.availableModels.length).toBeGreaterThan(0);
        });
      });
      it("should handle parsed.providers is null", () => {
        mockStorage.getItem.mockReturnValue(JSON.stringify({
          providers: null,
          // Null providers
          iteration_limit: 10
        }));
        mockApi.getLLMSettings.mockRejectedValue(new Error("Network error"));
        const { result } = renderHook(
          () => useLLMProviders({ storage: mockStorage })
        );
        return waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false);
          expect(result.current.providers).toEqual([]);
        });
      });
      it("should handle parsed.providers is undefined", () => {
        mockStorage.getItem.mockReturnValue(JSON.stringify({
          // No providers property
          iteration_limit: 10
        }));
        mockApi.getLLMSettings.mockRejectedValue(new Error("Network error"));
        const { result } = renderHook(
          () => useLLMProviders({ storage: mockStorage })
        );
        return waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false);
          expect(result.current.providers).toEqual([]);
        });
      });
    });
    describe("useLLMProviders - API data edge cases", () => {
      it("should handle data.providers is null", async () => {
        mockApi.getLLMSettings.mockResolvedValue({
          providers: null,
          // Null providers
          iteration_limit: 10
        });
        const { result } = renderHook(
          () => useLLMProviders({ storage: mockStorage, isAuthenticated: true })
        );
        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false);
        });
        expect(result.current.availableModels.length).toBeGreaterThan(0);
      });
      it("should handle data.providers.length === 0 exact boundary", async () => {
        mockApi.getLLMSettings.mockResolvedValue({
          providers: [],
          // Empty array - exact boundary
          iteration_limit: 10
        });
        const { result } = renderHook(
          () => useLLMProviders({ storage: mockStorage, isAuthenticated: true })
        );
        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false);
        });
        expect(result.current.availableModels.length).toBeGreaterThan(0);
      });
      it("should handle models.length === 0 when providers exist but no models extracted", async () => {
        const providers = [
          {
            id: "provider1",
            name: "OpenAI",
            type: "openai",
            enabled: true,
            models: []
            // Empty models array
          }
        ];
        mockApi.getLLMSettings.mockResolvedValue({
          providers,
          iteration_limit: 10
        });
        const { result } = renderHook(
          () => useLLMProviders({ storage: mockStorage, isAuthenticated: true })
        );
        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false);
        });
        expect(result.current.availableModels.length).toBeGreaterThan(0);
      });
      it("should handle data.default_model is null", async () => {
        const providers = [
          {
            id: "provider1",
            name: "OpenAI",
            type: "openai",
            enabled: true,
            models: ["gpt-4"]
          }
        ];
        mockApi.getLLMSettings.mockResolvedValue({
          providers,
          iteration_limit: 10,
          default_model: null
          // Null default_model
        });
        const { result } = renderHook(
          () => useLLMProviders({ storage: mockStorage, isAuthenticated: true })
        );
        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false);
        });
        expect(result.current.defaultModel).toBeUndefined();
      });
      it("should handle data.default_model is empty string", async () => {
        const providers = [
          {
            id: "provider1",
            name: "OpenAI",
            type: "openai",
            enabled: true,
            models: ["gpt-4"]
          }
        ];
        mockApi.getLLMSettings.mockResolvedValue({
          providers,
          iteration_limit: 10,
          default_model: ""
          // Empty string
        });
        const { result } = renderHook(
          () => useLLMProviders({ storage: mockStorage, isAuthenticated: true })
        );
        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false);
        });
        expect(result.current.defaultModel).toBeUndefined();
      });
      it("should handle data.providers || [] in storage save", async () => {
        mockApi.getLLMSettings.mockResolvedValue({
          providers: null,
          // Null providers
          iteration_limit: 10
        });
        const { result } = renderHook(
          () => useLLMProviders({ storage: mockStorage, isAuthenticated: true })
        );
        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false);
        });
        expect(mockStorage.setItem).not.toHaveBeenCalled();
      });
      it("should handle data.default_model || empty string in storage save", async () => {
        mockApi.getLLMSettings.mockResolvedValue({
          providers: [
            {
              id: "provider1",
              name: "OpenAI",
              type: "openai",
              enabled: true,
              models: ["gpt-4"]
            }
          ],
          iteration_limit: 10,
          default_model: null
          // Null default_model
        });
        const { result } = renderHook(
          () => useLLMProviders({ storage: mockStorage, isAuthenticated: true })
        );
        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false);
        });
        expect(mockStorage.setItem).toHaveBeenCalled();
        const savedData = JSON.parse(mockStorage.setItem.mock.calls[0][1]);
        expect(savedData.default_model).toBe("");
      });
      it("should handle onLoadComplete is undefined", async () => {
        const providers = [
          {
            id: "provider1",
            name: "OpenAI",
            type: "openai",
            enabled: true,
            models: ["gpt-4"]
          }
        ];
        mockApi.getLLMSettings.mockResolvedValue({
          providers,
          iteration_limit: 10
        });
        const onLoadComplete = void 0;
        const { result } = renderHook(
          () => useLLMProviders({ storage: mockStorage, isAuthenticated: true, onLoadComplete })
        );
        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false);
        });
        expect(result.current.availableModels.length).toBeGreaterThan(0);
      });
      it("should handle storage is null before saving", async () => {
        const providers = [
          {
            id: "provider1",
            name: "OpenAI",
            type: "openai",
            enabled: true,
            models: ["gpt-4"]
          }
        ];
        mockApi.getLLMSettings.mockResolvedValue({
          providers,
          iteration_limit: 10
        });
        const { result } = renderHook(
          () => useLLMProviders({ storage: null, isAuthenticated: true })
        );
        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false);
        });
        expect(result.current.availableModels.length).toBeGreaterThan(0);
      });
      it("should handle storage.setItem throwing error", async () => {
        const providers = [
          {
            id: "provider1",
            name: "OpenAI",
            type: "openai",
            enabled: true,
            models: ["gpt-4"]
          }
        ];
        mockApi.getLLMSettings.mockResolvedValue({
          providers,
          iteration_limit: 10
        });
        mockStorage.setItem.mockImplementation(() => {
          throw new Error("Storage write failed");
        });
        const { result } = renderHook(
          () => useLLMProviders({ storage: mockStorage, isAuthenticated: true })
        );
        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false);
        });
        expect(result.current.availableModels.length).toBeGreaterThan(0);
        expect(mockLogger.error).toHaveBeenCalledWith(
          "Failed to save LLM settings to storage:",
          expect.any(Error)
        );
      });
    });
    describe("useLLMProviders - storage fallback edge cases", () => {
      it("should handle storedSettings.providers.length === 0 exact boundary", async () => {
        mockStorage.getItem.mockReturnValue(JSON.stringify({
          providers: [],
          // Empty array - exact boundary
          iteration_limit: 10
        }));
        mockApi.getLLMSettings.mockRejectedValue(new Error("Network error"));
        const { result } = renderHook(
          () => useLLMProviders({ storage: mockStorage })
        );
        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false);
        });
        expect(result.current.availableModels.length).toBeGreaterThan(0);
      });
      it("should handle models.length === 0 in storage fallback", async () => {
        const storedProviders = [
          {
            id: "provider1",
            name: "OpenAI",
            type: "openai",
            enabled: true,
            models: []
            // Empty models array
          }
        ];
        mockStorage.getItem.mockReturnValue(JSON.stringify({
          providers: storedProviders,
          iteration_limit: 10
        }));
        mockApi.getLLMSettings.mockRejectedValue(new Error("Network error"));
        const { result } = renderHook(
          () => useLLMProviders({ storage: mockStorage })
        );
        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false);
        });
        expect(result.current.availableModels.length).toBeGreaterThan(0);
      });
      it("should handle typeof storedSettings.iteration_limit === number with string value", async () => {
        mockStorage.getItem.mockReturnValue(JSON.stringify({
          providers: [
            { id: "openai", name: "OpenAI", type: "openai", enabled: true, models: ["gpt-4"] }
          ],
          iteration_limit: "10"
          // String, not number
        }));
        mockApi.getLLMSettings.mockRejectedValue(new Error("Network error"));
        const { result } = renderHook(
          () => useLLMProviders({ storage: mockStorage })
        );
        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false);
        });
        expect(result.current.iterationLimit).toBeUndefined();
      });
      it("should handle storedSettings.default_model is null", async () => {
        mockStorage.getItem.mockReturnValue(JSON.stringify({
          providers: [
            { id: "openai", name: "OpenAI", type: "openai", enabled: true, models: ["gpt-4"] }
          ],
          default_model: null
          // Null default_model
        }));
        mockApi.getLLMSettings.mockRejectedValue(new Error("Network error"));
        const { result } = renderHook(
          () => useLLMProviders({ storage: mockStorage })
        );
        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false);
        });
        expect(result.current.defaultModel).toBeUndefined();
      });
      it("should handle storedSettings.default_model is empty string", async () => {
        mockStorage.getItem.mockReturnValue(JSON.stringify({
          providers: [
            { id: "openai", name: "OpenAI", type: "openai", enabled: true, models: ["gpt-4"] }
          ],
          default_model: ""
          // Empty string
        }));
        mockApi.getLLMSettings.mockRejectedValue(new Error("Network error"));
        const { result } = renderHook(
          () => useLLMProviders({ storage: mockStorage })
        );
        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false);
        });
        expect(result.current.defaultModel).toBeUndefined();
      });
    });
  });
  describe("mutation killers - additional conditional expressions", () => {
    describe("extractModelsFromProviders - complex conditional", () => {
      it("should verify exact conditional: provider.enabled && provider.models && provider.models.length > 0 - all true", async () => {
        mockApi.getLLMSettings.mockResolvedValue({
          providers: [
            {
              id: "openai",
              name: "OpenAI",
              type: "openai",
              enabled: true,
              // First condition true
              models: ["gpt-4"]
              // Second condition true, length > 0
            }
          ]
        });
        const { result } = renderHook(
          () => useLLMProviders({ storage: mockStorage, isAuthenticated: true })
        );
        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false);
        });
        expect(result.current.availableModels.length).toBeGreaterThan(0);
      });
      it("should verify provider.enabled is false", async () => {
        mockApi.getLLMSettings.mockResolvedValue({
          providers: [
            {
              id: "anthropic",
              name: "Anthropic",
              type: "anthropic",
              enabled: false,
              // First condition false
              models: ["claude-3-opus"]
            }
          ]
        });
        const { result } = renderHook(
          () => useLLMProviders({ storage: mockStorage, isAuthenticated: true })
        );
        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false);
        });
        const anthropicModels = result.current.availableModels.filter((m) => m.provider === "Anthropic");
        expect(anthropicModels.length).toBe(0);
        expect(result.current.availableModels.length).toBeGreaterThan(0);
      });
      it("should verify provider.models is null", async () => {
        mockApi.getLLMSettings.mockResolvedValue({
          providers: [
            {
              id: "anthropic",
              name: "Anthropic",
              type: "anthropic",
              enabled: true,
              models: null
              // Second condition false
            }
          ]
        });
        const { result } = renderHook(
          () => useLLMProviders({ storage: mockStorage, isAuthenticated: true })
        );
        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false);
        });
        const anthropicModels = result.current.availableModels.filter((m) => m.provider === "Anthropic");
        expect(anthropicModels.length).toBe(0);
        expect(result.current.availableModels.length).toBeGreaterThan(0);
      });
      it("should verify provider.models.length === 0", async () => {
        mockApi.getLLMSettings.mockResolvedValue({
          providers: [
            {
              id: "anthropic",
              name: "Anthropic",
              type: "anthropic",
              enabled: true,
              models: []
              // Third condition false (length === 0)
            }
          ]
        });
        const { result } = renderHook(
          () => useLLMProviders({ storage: mockStorage, isAuthenticated: true })
        );
        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false);
        });
        const anthropicModels = result.current.availableModels.filter((m) => m.provider === "Anthropic");
        expect(anthropicModels.length).toBe(0);
        expect(result.current.availableModels.length).toBeGreaterThan(0);
      });
    });
    describe("loadProviders - conditional chains", () => {
      it("should verify exact conditional: data.providers && data.providers.length > 0 - both true", async () => {
        mockApi.getLLMSettings.mockResolvedValue({
          providers: [{ id: "openai", name: "OpenAI", type: "openai", enabled: true, models: ["gpt-4"] }]
        });
        const { result } = renderHook(
          () => useLLMProviders({ storage: mockStorage, isAuthenticated: true })
        );
        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false);
        });
        expect(result.current.providers.length).toBeGreaterThan(0);
      });
      it("should verify data.providers is null", async () => {
        mockApi.getLLMSettings.mockResolvedValue({
          providers: null
        });
        const { result } = renderHook(
          () => useLLMProviders({ storage: mockStorage, isAuthenticated: true })
        );
        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false);
        });
        expect(result.current.providers.length).toBe(0);
      });
      it("should verify data.providers.length === 0", async () => {
        mockApi.getLLMSettings.mockResolvedValue({
          providers: []
        });
        const { result } = renderHook(
          () => useLLMProviders({ storage: mockStorage, isAuthenticated: true })
        );
        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false);
        });
        expect(result.current.providers.length).toBe(0);
      });
      it("should verify models.length > 0 exact comparison - length is 0", async () => {
        mockApi.getLLMSettings.mockResolvedValue({
          providers: [
            {
              id: "openai",
              name: "OpenAI",
              type: "openai",
              enabled: true,
              models: []
              // No models extracted
            }
          ]
        });
        const { result } = renderHook(
          () => useLLMProviders({ storage: mockStorage, isAuthenticated: true })
        );
        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false);
        });
        expect(result.current.availableModels.length).toBeGreaterThan(0);
      });
    });
    describe("loadFromStorage - conditional expressions", () => {
      it("should verify exact conditional: storedSettings && storedSettings.providers.length > 0 - both true", async () => {
        mockStorage.getItem.mockReturnValue(JSON.stringify({
          providers: [
            { id: "openai", name: "OpenAI", type: "openai", enabled: true, models: ["gpt-4"] }
          ]
        }));
        mockApi.getLLMSettings.mockRejectedValue(new Error("Network error"));
        const { result } = renderHook(
          () => useLLMProviders({ storage: mockStorage })
        );
        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false);
        });
        expect(result.current.providers.length).toBeGreaterThan(0);
      });
      it("should verify storedSettings is null", async () => {
        mockStorage.getItem.mockReturnValue(null);
        mockApi.getLLMSettings.mockRejectedValue(new Error("Network error"));
        const { result } = renderHook(
          () => useLLMProviders({ storage: mockStorage })
        );
        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false);
        });
        expect(result.current.providers.length).toBe(0);
        expect(result.current.availableModels.length).toBeGreaterThan(0);
      });
      it("should verify storedSettings.providers.length === 0", async () => {
        mockStorage.getItem.mockReturnValue(JSON.stringify({
          providers: []
        }));
        mockApi.getLLMSettings.mockRejectedValue(new Error("Network error"));
        const { result } = renderHook(
          () => useLLMProviders({ storage: mockStorage })
        );
        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false);
        });
        expect(result.current.providers.length).toBe(0);
        expect(result.current.availableModels.length).toBeGreaterThan(0);
      });
    });
    describe("type checks", () => {
      it('should verify exact type check: typeof data.iteration_limit === "number" - is number', async () => {
        mockApi.getLLMSettings.mockResolvedValue({
          providers: [{ id: "openai", name: "OpenAI", type: "openai", enabled: true, models: ["gpt-4"] }],
          iteration_limit: 10
          // Number
        });
        const { result } = renderHook(
          () => useLLMProviders({ storage: mockStorage, isAuthenticated: true })
        );
        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false);
        });
        expect(result.current.iterationLimit).toBe(10);
      });
      it('should verify typeof data.iteration_limit !== "number" - is string', async () => {
        mockApi.getLLMSettings.mockResolvedValue({
          providers: [{ id: "openai", name: "OpenAI", type: "openai", enabled: true, models: ["gpt-4"] }],
          iteration_limit: "10"
          // String, not number
        });
        const { result } = renderHook(
          () => useLLMProviders({ storage: mockStorage, isAuthenticated: true })
        );
        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false);
        });
        expect(result.current.iterationLimit).toBeUndefined();
      });
      it('should verify typeof storedSettings.iteration_limit === "number" - is number', async () => {
        mockStorage.getItem.mockReturnValue(JSON.stringify({
          providers: [{ id: "openai", name: "OpenAI", type: "openai", enabled: true, models: ["gpt-4"] }],
          iteration_limit: 15
          // Number
        }));
        mockApi.getLLMSettings.mockRejectedValue(new Error("Network error"));
        const { result } = renderHook(
          () => useLLMProviders({ storage: mockStorage })
        );
        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false);
        });
        expect(result.current.iterationLimit).toBe(15);
      });
      it('should verify typeof storedSettings.iteration_limit !== "number" - is string', async () => {
        mockStorage.getItem.mockReturnValue(JSON.stringify({
          providers: [{ id: "openai", name: "OpenAI", type: "openai", enabled: true, models: ["gpt-4"] }],
          iteration_limit: "15"
          // String, not number
        }));
        mockApi.getLLMSettings.mockRejectedValue(new Error("Network error"));
        const { result } = renderHook(
          () => useLLMProviders({ storage: mockStorage })
        );
        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false);
        });
        expect(result.current.iterationLimit).toBeUndefined();
      });
    });
    describe("logical OR operators", () => {
      it("should verify exact fallback: parsed.providers || [] - parsed.providers is null", async () => {
        mockStorage.getItem.mockReturnValue(JSON.stringify({
          providers: null
        }));
        mockApi.getLLMSettings.mockRejectedValue(new Error("Network error"));
        const { result } = renderHook(
          () => useLLMProviders({ storage: mockStorage })
        );
        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false);
        });
        expect(result.current.providers).toEqual([]);
      });
      it("should verify parsed.providers || [] - parsed.providers exists", async () => {
        mockStorage.getItem.mockReturnValue(JSON.stringify({
          providers: [{ id: "openai", name: "OpenAI", type: "openai", enabled: true, models: ["gpt-4"] }]
        }));
        mockApi.getLLMSettings.mockRejectedValue(new Error("Network error"));
        const { result } = renderHook(
          () => useLLMProviders({ storage: mockStorage })
        );
        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false);
        });
        expect(result.current.providers.length).toBe(1);
      });
      it('should verify data.default_model || "" - default_model exists', async () => {
        mockApi.getLLMSettings.mockResolvedValue({
          providers: [{ id: "openai", name: "OpenAI", type: "openai", enabled: true, models: ["gpt-4"] }],
          default_model: "gpt-4"
        });
        const { result } = renderHook(
          () => useLLMProviders({ storage: mockStorage, isAuthenticated: true })
        );
        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false);
        });
        expect(result.current.defaultModel).toBe("gpt-4");
      });
      it('should verify data.default_model || "" - default_model is null', async () => {
        mockApi.getLLMSettings.mockResolvedValue({
          providers: [{ id: "openai", name: "OpenAI", type: "openai", enabled: true, models: ["gpt-4"] }],
          default_model: null
        });
        const { result } = renderHook(
          () => useLLMProviders({ storage: mockStorage, isAuthenticated: true })
        );
        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false);
        });
        expect(mockStorage.setItem).toHaveBeenCalled();
        const savedData = JSON.parse(mockStorage.setItem.mock.calls[0][1]);
        expect(savedData.default_model).toBe("");
      });
      it('should verify data.default_model || "" - default_model is undefined', async () => {
        mockApi.getLLMSettings.mockResolvedValue({
          providers: [{ id: "openai", name: "OpenAI", type: "openai", enabled: true, models: ["gpt-4"] }],
          default_model: void 0
        });
        const { result } = renderHook(
          () => useLLMProviders({ storage: mockStorage, isAuthenticated: true })
        );
        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false);
        });
        expect(mockStorage.setItem).toHaveBeenCalled();
        const savedData = JSON.parse(mockStorage.setItem.mock.calls[0][1]);
        expect(savedData.default_model).toBe("");
      });
      it('should verify data.default_model || "" - default_model is empty string', async () => {
        mockApi.getLLMSettings.mockResolvedValue({
          providers: [{ id: "openai", name: "OpenAI", type: "openai", enabled: true, models: ["gpt-4"] }],
          default_model: ""
        });
        const { result } = renderHook(
          () => useLLMProviders({ storage: mockStorage, isAuthenticated: true })
        );
        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false);
        });
        expect(mockStorage.setItem).toHaveBeenCalled();
        const savedData = JSON.parse(mockStorage.setItem.mock.calls[0][1]);
        expect(savedData.default_model).toBe("");
      });
    });
    describe("mutation killers - exact comparisons and operators", () => {
      it("should verify exact comparison data.providers && data.providers.length > 0 - providers is null", async () => {
        mockApi.getLLMSettings.mockResolvedValue({
          providers: null
        });
        const { result } = renderHook(
          () => useLLMProviders({ storage: mockStorage, isAuthenticated: true })
        );
        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false);
        });
        expect(result.current.availableModels.length).toBeGreaterThan(0);
      });
      it("should verify exact comparison data.providers && data.providers.length > 0 - providers.length is exactly 0", async () => {
        mockApi.getLLMSettings.mockResolvedValue({
          providers: []
          // length is 0, so > 0 is false
        });
        const { result } = renderHook(
          () => useLLMProviders({ storage: mockStorage, isAuthenticated: true })
        );
        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false);
        });
        expect(result.current.availableModels.length).toBeGreaterThan(0);
      });
      it("should verify exact comparison data.providers && data.providers.length > 0 - providers.length is exactly 1", async () => {
        mockApi.getLLMSettings.mockResolvedValue({
          providers: [{ id: "openai", name: "OpenAI", type: "openai", enabled: true, models: ["gpt-4"] }]
        });
        const { result } = renderHook(
          () => useLLMProviders({ storage: mockStorage, isAuthenticated: true })
        );
        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false);
        });
        expect(result.current.availableModels.length).toBeGreaterThan(0);
      });
      it("should verify exact comparison models.length > 0 - length is exactly 0", async () => {
        mockApi.getLLMSettings.mockResolvedValue({
          providers: [
            { id: "openai", name: "OpenAI", type: "openai", enabled: false, models: ["gpt-4"] }
          ]
        });
        const { result } = renderHook(
          () => useLLMProviders({ storage: mockStorage, isAuthenticated: true })
        );
        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false);
        });
        expect(result.current.availableModels.length).toBeGreaterThan(0);
      });
      it("should verify exact comparison models.length > 0 - length is exactly 1", async () => {
        mockApi.getLLMSettings.mockResolvedValue({
          providers: [{ id: "openai", name: "OpenAI", type: "openai", enabled: true, models: ["gpt-4"] }]
        });
        const { result } = renderHook(
          () => useLLMProviders({ storage: mockStorage, isAuthenticated: true })
        );
        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false);
        });
        expect(result.current.availableModels.length).toBe(1);
      });
      it("should verify exact comparison storedSettings && storedSettings.providers && storedSettings.providers.length > 0 - storedSettings is null", async () => {
        mockStorage.getItem.mockReturnValue(null);
        mockApi.getLLMSettings.mockRejectedValue(new Error("Network error"));
        const { result } = renderHook(
          () => useLLMProviders({ storage: mockStorage })
        );
        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false);
        });
        expect(result.current.availableModels.length).toBeGreaterThan(0);
      });
      it("should verify exact comparison storedSettings && storedSettings.providers && storedSettings.providers.length > 0 - providers is null", async () => {
        mockStorage.getItem.mockReturnValue(JSON.stringify({
          providers: null
        }));
        mockApi.getLLMSettings.mockRejectedValue(new Error("Network error"));
        const { result } = renderHook(
          () => useLLMProviders({ storage: mockStorage })
        );
        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false);
        });
        expect(result.current.availableModels.length).toBeGreaterThan(0);
      });
      it("should verify exact comparison storedSettings && storedSettings.providers && storedSettings.providers.length > 0 - providers.length is 0", async () => {
        mockStorage.getItem.mockReturnValue(JSON.stringify({
          providers: []
        }));
        mockApi.getLLMSettings.mockRejectedValue(new Error("Network error"));
        const { result } = renderHook(
          () => useLLMProviders({ storage: mockStorage })
        );
        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false);
        });
        expect(result.current.availableModels.length).toBeGreaterThan(0);
      });
      it("should verify exact comparison storedSettings && storedSettings.providers && storedSettings.providers.length > 0 - providers.length is 1", async () => {
        mockStorage.getItem.mockReturnValue(JSON.stringify({
          providers: [{ id: "openai", name: "OpenAI", type: "openai", enabled: true, models: ["gpt-4"] }]
        }));
        mockApi.getLLMSettings.mockRejectedValue(new Error("Network error"));
        const { result } = renderHook(
          () => useLLMProviders({ storage: mockStorage })
        );
        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false);
        });
        expect(result.current.availableModels.length).toBe(1);
      });
      it("should verify exact type check typeof data.iteration_limit === number - is number", async () => {
        mockApi.getLLMSettings.mockResolvedValue({
          providers: [{ id: "openai", name: "OpenAI", type: "openai", enabled: true, models: ["gpt-4"] }],
          iteration_limit: 10
          // Number
        });
        const { result } = renderHook(
          () => useLLMProviders({ storage: mockStorage, isAuthenticated: true })
        );
        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false);
        });
        expect(result.current.iterationLimit).toBe(10);
      });
      it("should verify exact type check typeof data.iteration_limit === number - is string", async () => {
        mockApi.getLLMSettings.mockResolvedValue({
          providers: [{ id: "openai", name: "OpenAI", type: "openai", enabled: true, models: ["gpt-4"] }],
          iteration_limit: "10"
          // String, not number
        });
        const { result } = renderHook(
          () => useLLMProviders({ storage: mockStorage, isAuthenticated: true })
        );
        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false);
        });
        expect(result.current.iterationLimit).toBeUndefined();
      });
      it("should verify exact type check typeof data.iteration_limit === number - is null", async () => {
        mockApi.getLLMSettings.mockResolvedValue({
          providers: [{ id: "openai", name: "OpenAI", type: "openai", enabled: true, models: ["gpt-4"] }],
          iteration_limit: null
        });
        const { result } = renderHook(
          () => useLLMProviders({ storage: mockStorage, isAuthenticated: true })
        );
        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false);
        });
        expect(result.current.iterationLimit).toBeUndefined();
      });
      it("should verify exact type check typeof storedSettings.iteration_limit === number - is number", async () => {
        mockStorage.getItem.mockReturnValue(JSON.stringify({
          providers: [{ id: "openai", name: "OpenAI", type: "openai", enabled: true, models: ["gpt-4"] }],
          iteration_limit: 10
          // Number
        }));
        mockApi.getLLMSettings.mockRejectedValue(new Error("Network error"));
        const { result } = renderHook(
          () => useLLMProviders({ storage: mockStorage })
        );
        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false);
        });
        expect(result.current.iterationLimit).toBe(10);
      });
      it("should verify exact type check typeof storedSettings.iteration_limit === number - is string", async () => {
        mockStorage.getItem.mockReturnValue(JSON.stringify({
          providers: [{ id: "openai", name: "OpenAI", type: "openai", enabled: true, models: ["gpt-4"] }],
          iteration_limit: "10"
          // String, not number
        }));
        mockApi.getLLMSettings.mockRejectedValue(new Error("Network error"));
        const { result } = renderHook(
          () => useLLMProviders({ storage: mockStorage })
        );
        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false);
        });
        expect(result.current.iterationLimit).toBeUndefined();
      });
      it("should verify exact comparison data.default_model - is truthy string", async () => {
        mockApi.getLLMSettings.mockResolvedValue({
          providers: [{ id: "openai", name: "OpenAI", type: "openai", enabled: true, models: ["gpt-4"] }],
          default_model: "gpt-4"
        });
        const { result } = renderHook(
          () => useLLMProviders({ storage: mockStorage, isAuthenticated: true })
        );
        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false);
        });
        expect(result.current.defaultModel).toBe("gpt-4");
      });
      it("should verify exact comparison data.default_model - is empty string", async () => {
        mockApi.getLLMSettings.mockResolvedValue({
          providers: [{ id: "openai", name: "OpenAI", type: "openai", enabled: true, models: ["gpt-4"] }],
          default_model: ""
        });
        const { result } = renderHook(
          () => useLLMProviders({ storage: mockStorage, isAuthenticated: true })
        );
        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false);
        });
        expect(result.current.defaultModel).toBeUndefined();
      });
      it("should verify exact comparison storedSettings.default_model - is truthy string", async () => {
        mockStorage.getItem.mockReturnValue(JSON.stringify({
          providers: [{ id: "openai", name: "OpenAI", type: "openai", enabled: true, models: ["gpt-4"] }],
          default_model: "gpt-4"
        }));
        mockApi.getLLMSettings.mockRejectedValue(new Error("Network error"));
        const { result } = renderHook(
          () => useLLMProviders({ storage: mockStorage })
        );
        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false);
        });
        expect(result.current.defaultModel).toBe("gpt-4");
      });
      it("should verify exact comparison storedSettings.default_model - is empty string", async () => {
        mockStorage.getItem.mockReturnValue(JSON.stringify({
          providers: [{ id: "openai", name: "OpenAI", type: "openai", enabled: true, models: ["gpt-4"] }],
          default_model: ""
        }));
        mockApi.getLLMSettings.mockRejectedValue(new Error("Network error"));
        const { result } = renderHook(
          () => useLLMProviders({ storage: mockStorage })
        );
        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false);
        });
        expect(result.current.defaultModel).toBeUndefined();
      });
      it("should verify logical OR data.providers || [] - providers is null", async () => {
        mockApi.getLLMSettings.mockResolvedValue({
          providers: null
        });
        const { result } = renderHook(
          () => useLLMProviders({ storage: mockStorage, isAuthenticated: true })
        );
        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false);
        });
        expect(result.current.availableModels.length).toBeGreaterThan(0);
      });
      it("should verify logical OR data.providers || [] - providers has value", async () => {
        mockApi.getLLMSettings.mockResolvedValue({
          providers: [{ id: "openai", name: "OpenAI", type: "openai", enabled: true, models: ["gpt-4"] }]
        });
        const { result } = renderHook(
          () => useLLMProviders({ storage: mockStorage, isAuthenticated: true })
        );
        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false);
        });
        expect(mockStorage.setItem).toHaveBeenCalled();
        const savedData = JSON.parse(mockStorage.setItem.mock.calls[0][1]);
        expect(savedData.providers.length).toBe(1);
      });
      it("should verify logical AND provider.enabled && provider.models && provider.models.length > 0 - enabled is false", async () => {
        mockApi.getLLMSettings.mockResolvedValue({
          providers: [
            { id: "openai", name: "OpenAI", type: "openai", enabled: false, models: ["gpt-4"] }
          ]
        });
        const { result } = renderHook(
          () => useLLMProviders({ storage: mockStorage, isAuthenticated: true })
        );
        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false);
        });
        expect(result.current.availableModels.length).toBeGreaterThan(0);
      });
      it("should verify logical AND provider.enabled && provider.models && provider.models.length > 0 - models is null", async () => {
        mockApi.getLLMSettings.mockResolvedValue({
          providers: [
            { id: "openai", name: "OpenAI", type: "openai", enabled: true, models: null }
          ]
        });
        const { result } = renderHook(
          () => useLLMProviders({ storage: mockStorage, isAuthenticated: true })
        );
        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false);
        });
        expect(result.current.availableModels.length).toBeGreaterThan(0);
      });
      it("should verify logical AND provider.enabled && provider.models && provider.models.length > 0 - models.length is 0", async () => {
        mockApi.getLLMSettings.mockResolvedValue({
          providers: [
            { id: "openai", name: "OpenAI", type: "openai", enabled: true, models: [] }
          ]
        });
        const { result } = renderHook(
          () => useLLMProviders({ storage: mockStorage, isAuthenticated: true })
        );
        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false);
        });
        expect(result.current.availableModels.length).toBeGreaterThan(0);
      });
      it("should verify logical AND provider.enabled && provider.models && provider.models.length > 0 - all true", async () => {
        mockApi.getLLMSettings.mockResolvedValue({
          providers: [
            { id: "openai", name: "OpenAI", type: "openai", enabled: true, models: ["gpt-4"] }
          ]
        });
        const { result } = renderHook(
          () => useLLMProviders({ storage: mockStorage, isAuthenticated: true })
        );
        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false);
        });
        expect(result.current.availableModels.length).toBe(1);
        expect(result.current.availableModels[0].value).toBe("gpt-4");
      });
      it("should verify onLoadComplete callback - is undefined", async () => {
        mockApi.getLLMSettings.mockResolvedValue({
          providers: [{ id: "openai", name: "OpenAI", type: "openai", enabled: true, models: ["gpt-4"] }]
        });
        const onLoadComplete = void 0;
        const { result } = renderHook(
          () => useLLMProviders({ storage: mockStorage, isAuthenticated: true, onLoadComplete })
        );
        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false);
        });
        expect(result.current.availableModels.length).toBe(1);
      });
      it("should verify storage check before saving - storage is null", async () => {
        mockApi.getLLMSettings.mockResolvedValue({
          providers: [{ id: "openai", name: "OpenAI", type: "openai", enabled: true, models: ["gpt-4"] }]
        });
        const { result } = renderHook(
          () => useLLMProviders({ storage: null, isAuthenticated: true })
        );
        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false);
        });
        expect(result.current.availableModels.length).toBe(1);
      });
      it("should verify storage.setItem error handling", async () => {
        const errorStorage = {
          getItem: jest.fn(() => null),
          setItem: jest.fn(() => {
            throw new Error("Storage error");
          }),
          removeItem: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn()
        };
        mockApi.getLLMSettings.mockResolvedValue({
          providers: [{ id: "openai", name: "OpenAI", type: "openai", enabled: true, models: ["gpt-4"] }]
        });
        const { result } = renderHook(
          () => useLLMProviders({ storage: errorStorage, isAuthenticated: true })
        );
        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false);
        });
        expect(result.current.availableModels.length).toBe(1);
        expect(logger.error).toHaveBeenCalledWith(
          expect.stringContaining("Failed to save LLM settings to storage"),
          expect.any(Error)
        );
      });
    });
  });
});
