import { renderHook, waitFor } from "@testing-library/react";
import { useLLMProviders } from "./useLLMProviders";
import { api } from "../../api/client";
jest.mock("../../api/client", () => ({
  api: {
    getLLMSettings: jest.fn(),
  },
}));
jest.mock("../../utils/logger", () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
  },
}));
const mockApi = api;
const waitForWithTimeout = (callback, timeout = 2e3) => {
  return waitFor(callback, { timeout });
};
describe("useLLMProviders - Enhanced Mutation Killers", () => {
  let mockStorage;
  beforeEach(() => {
    jest.clearAllMocks();
    mockStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    };
  });
  describe("extractModelsFromProviders - Independent Condition Testing", () => {
    describe("provider != null condition", () => {
      it("should handle null provider in array", async () => {
        mockApi.getLLMSettings.mockResolvedValue({
          providers: [
            null,
            {
              id: "provider1",
              name: "OpenAI",
              type: "openai",
              enabled: true,
              models: ["gpt-4"],
            },
          ],
          iteration_limit: 10,
          default_model: "gpt-4",
        });
        const { result } = renderHook(() =>
          useLLMProviders({ storage: mockStorage, isAuthenticated: true }),
        );
        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false);
        });
        expect(result.current.availableModels.length).toBeGreaterThan(0);
        expect(result.current.availableModels[0].value).toBe("gpt-4");
      });
      it("should handle undefined provider in array", async () => {
        mockApi.getLLMSettings.mockResolvedValue({
          providers: [
            void 0,
            {
              id: "provider1",
              name: "OpenAI",
              type: "openai",
              enabled: true,
              models: ["gpt-4"],
            },
          ],
          iteration_limit: 10,
          default_model: "gpt-4",
        });
        const { result } = renderHook(() =>
          useLLMProviders({ storage: mockStorage, isAuthenticated: true }),
        );
        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false);
        });
        expect(result.current.availableModels.length).toBeGreaterThan(0);
      });
    });
    describe("provider.enabled === true condition", () => {
      it("should verify exact equality check - enabled is true", async () => {
        mockApi.getLLMSettings.mockResolvedValue({
          providers: [
            {
              id: "provider1",
              name: "OpenAI",
              type: "openai",
              enabled: true,
              // Exact true
              models: ["gpt-4"],
            },
          ],
          iteration_limit: 10,
          default_model: "gpt-4",
        });
        const { result } = renderHook(() =>
          useLLMProviders({ storage: mockStorage, isAuthenticated: true }),
        );
        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false);
        });
        expect(result.current.availableModels.length).toBeGreaterThan(0);
      });
      it("should verify exact equality check - enabled is false", async () => {
        mockApi.getLLMSettings.mockResolvedValue({
          providers: [
            {
              id: "provider1",
              name: "OpenAI",
              type: "openai",
              enabled: false,
              // Not true
              models: ["gpt-4"],
            },
          ],
          iteration_limit: 10,
          default_model: "gpt-4",
        });
        const { result } = renderHook(() =>
          useLLMProviders({ storage: mockStorage, isAuthenticated: true }),
        );
        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false);
        });
        expect(result.current.providers).toEqual([]);
        expect(result.current.availableModels.length).toBe(4);
      });
      it("should verify exact equality check - enabled is undefined", async () => {
        mockApi.getLLMSettings.mockResolvedValue({
          providers: [
            {
              id: "provider1",
              name: "OpenAI",
              type: "openai",
              // enabled missing (undefined)
              models: ["gpt-4"],
            },
          ],
          iteration_limit: 10,
          default_model: "gpt-4",
        });
        const { result } = renderHook(() =>
          useLLMProviders({ storage: mockStorage, isAuthenticated: true }),
        );
        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false);
        });
        expect(result.current.providers).toEqual([]);
        expect(result.current.availableModels.length).toBe(4);
      });
    });
    describe("provider.models != null condition", () => {
      it("should verify exact null check - models is null", async () => {
        mockApi.getLLMSettings.mockResolvedValue({
          providers: [
            {
              id: "provider1",
              name: "OpenAI",
              type: "openai",
              enabled: true,
              models: null,
              // Null
            },
          ],
          iteration_limit: 10,
          default_model: "gpt-4",
        });
        const { result } = renderHook(() =>
          useLLMProviders({ storage: mockStorage, isAuthenticated: true }),
        );
        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false);
        });
        expect(result.current.providers).toEqual([]);
        expect(result.current.availableModels.length).toBe(4);
      });
      it("should verify exact null check - models is undefined", async () => {
        mockApi.getLLMSettings.mockResolvedValue({
          providers: [
            {
              id: "provider1",
              name: "OpenAI",
              type: "openai",
              enabled: true,
              // models missing (undefined)
            },
          ],
          iteration_limit: 10,
          default_model: "gpt-4",
        });
        const { result } = renderHook(() =>
          useLLMProviders({ storage: mockStorage, isAuthenticated: true }),
        );
        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false);
        });
        expect(result.current.providers).toEqual([]);
        expect(result.current.availableModels.length).toBe(4);
      });
      it("should verify exact null check - models is not null", async () => {
        mockApi.getLLMSettings.mockResolvedValue({
          providers: [
            {
              id: "provider1",
              name: "OpenAI",
              type: "openai",
              enabled: true,
              models: ["gpt-4"],
              // Not null
            },
          ],
          iteration_limit: 10,
          default_model: "gpt-4",
        });
        const { result } = renderHook(() =>
          useLLMProviders({ storage: mockStorage, isAuthenticated: true }),
        );
        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false);
        });
        expect(result.current.availableModels.length).toBeGreaterThan(0);
      });
    });
    describe("Array.isArray(provider.models) condition", () => {
      it("should verify exact array check - models is array", async () => {
        mockApi.getLLMSettings.mockResolvedValue({
          providers: [
            {
              id: "provider1",
              name: "OpenAI",
              type: "openai",
              enabled: true,
              models: ["gpt-4"],
              // Array
            },
          ],
          iteration_limit: 10,
          default_model: "gpt-4",
        });
        const { result } = renderHook(() =>
          useLLMProviders({ storage: mockStorage, isAuthenticated: true }),
        );
        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false);
        });
        expect(result.current.availableModels.length).toBeGreaterThan(0);
      });
      it("should verify exact array check - models is string (not array)", async () => {
        mockApi.getLLMSettings.mockResolvedValue({
          providers: [
            {
              id: "provider1",
              name: "OpenAI",
              type: "openai",
              enabled: true,
              models: "gpt-4",
              // String, not array
            },
          ],
          iteration_limit: 10,
          default_model: "gpt-4",
        });
        const { result } = renderHook(() =>
          useLLMProviders({ storage: mockStorage, isAuthenticated: true }),
        );
        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false);
        });
        expect(result.current.providers).toEqual([]);
        expect(result.current.availableModels.length).toBe(4);
      });
      it("should verify exact array check - models is object (not array)", async () => {
        mockApi.getLLMSettings.mockResolvedValue({
          providers: [
            {
              id: "provider1",
              name: "OpenAI",
              type: "openai",
              enabled: true,
              models: { gpt4: "gpt-4" },
              // Object, not array
            },
          ],
          iteration_limit: 10,
          default_model: "gpt-4",
        });
        const { result } = renderHook(() =>
          useLLMProviders({ storage: mockStorage, isAuthenticated: true }),
        );
        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false);
        });
        expect(result.current.providers).toEqual([]);
        expect(result.current.availableModels.length).toBe(4);
      });
    });
    describe("provider.models.length > 0 condition", () => {
      it("should verify exact length check - length is 0", async () => {
        mockApi.getLLMSettings.mockResolvedValue({
          providers: [
            {
              id: "provider1",
              name: "OpenAI",
              type: "openai",
              enabled: true,
              models: [],
              // Empty array, length === 0
            },
          ],
          iteration_limit: 10,
          default_model: "gpt-4",
        });
        const { result } = renderHook(() =>
          useLLMProviders({ storage: mockStorage, isAuthenticated: true }),
        );
        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false);
        });
        expect(result.current.providers).toEqual([]);
        expect(result.current.availableModels.length).toBe(4);
      });
      it("should verify exact length check - length is 1", async () => {
        mockApi.getLLMSettings.mockResolvedValue({
          providers: [
            {
              id: "provider1",
              name: "OpenAI",
              type: "openai",
              enabled: true,
              models: ["gpt-4"],
              // Length === 1, which is > 0
            },
          ],
          iteration_limit: 10,
          default_model: "gpt-4",
        });
        const { result } = renderHook(() =>
          useLLMProviders({ storage: mockStorage, isAuthenticated: true }),
        );
        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false);
        });
        expect(result.current.availableModels.length).toBe(1);
        expect(result.current.availableModels[0].value).toBe("gpt-4");
      });
      it("should verify exact length check - length is greater than 1", async () => {
        mockApi.getLLMSettings.mockResolvedValue({
          providers: [
            {
              id: "provider1",
              name: "OpenAI",
              type: "openai",
              enabled: true,
              models: ["gpt-4", "gpt-3.5-turbo"],
              // Length === 2, which is > 0
            },
          ],
          iteration_limit: 10,
          default_model: "gpt-4",
        });
        const { result } = renderHook(() =>
          useLLMProviders({ storage: mockStorage, isAuthenticated: true }),
        );
        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false);
        });
        expect(result.current.availableModels.length).toBe(2);
      });
    });
    describe("Combined condition testing - all conditions must be true", () => {
      it("should extract models when all conditions are true", async () => {
        mockApi.getLLMSettings.mockResolvedValue({
          providers: [
            {
              id: "provider1",
              name: "OpenAI",
              type: "openai",
              enabled: true,
              // Condition 1: true
              models: ["gpt-4"],
              // Condition 2: != null, Condition 3: is array, Condition 4: length > 0
            },
          ],
          iteration_limit: 10,
          default_model: "gpt-4",
        });
        const { result } = renderHook(() =>
          useLLMProviders({ storage: mockStorage, isAuthenticated: true }),
        );
        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false);
        });
        expect(result.current.availableModels.length).toBe(1);
        expect(result.current.providers.length).toBe(1);
      });
      it("should not extract when provider is null (first condition false)", async () => {
        mockApi.getLLMSettings.mockResolvedValue({
          providers: [null],
          // Condition 1: false (null)
          iteration_limit: 10,
          default_model: "gpt-4",
        });
        const { result } = renderHook(() =>
          useLLMProviders({ storage: mockStorage, isAuthenticated: true }),
        );
        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false);
        });
        expect(result.current.providers).toEqual([]);
        expect(result.current.availableModels.length).toBe(4);
      });
      it("should not extract when enabled is false (second condition false)", async () => {
        mockApi.getLLMSettings.mockResolvedValue({
          providers: [
            {
              id: "provider1",
              name: "OpenAI",
              type: "openai",
              enabled: false,
              // Condition 2: false
              models: ["gpt-4"],
            },
          ],
          iteration_limit: 10,
          default_model: "gpt-4",
        });
        const { result } = renderHook(() =>
          useLLMProviders({ storage: mockStorage, isAuthenticated: true }),
        );
        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false);
        });
        expect(result.current.providers).toEqual([]);
        expect(result.current.availableModels.length).toBe(4);
      });
      it("should not extract when models is null (third condition false)", async () => {
        mockApi.getLLMSettings.mockResolvedValue({
          providers: [
            {
              id: "provider1",
              name: "OpenAI",
              type: "openai",
              enabled: true,
              models: null,
              // Condition 3: false (null)
            },
          ],
          iteration_limit: 10,
          default_model: "gpt-4",
        });
        const { result } = renderHook(() =>
          useLLMProviders({ storage: mockStorage, isAuthenticated: true }),
        );
        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false);
        });
        expect(result.current.providers).toEqual([]);
        expect(result.current.availableModels.length).toBe(4);
      });
      it("should not extract when models is not array (fourth condition false)", async () => {
        mockApi.getLLMSettings.mockResolvedValue({
          providers: [
            {
              id: "provider1",
              name: "OpenAI",
              type: "openai",
              enabled: true,
              models: "gpt-4",
              // Condition 4: false (not array)
            },
          ],
          iteration_limit: 10,
          default_model: "gpt-4",
        });
        const { result } = renderHook(() =>
          useLLMProviders({ storage: mockStorage, isAuthenticated: true }),
        );
        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false);
        });
        expect(result.current.providers).toEqual([]);
        expect(result.current.availableModels.length).toBe(4);
      });
      it("should not extract when models.length is 0 (fifth condition false)", async () => {
        mockApi.getLLMSettings.mockResolvedValue({
          providers: [
            {
              id: "provider1",
              name: "OpenAI",
              type: "openai",
              enabled: true,
              models: [],
              // Condition 5: false (length === 0)
            },
          ],
          iteration_limit: 10,
          default_model: "gpt-4",
        });
        const { result } = renderHook(() =>
          useLLMProviders({ storage: mockStorage, isAuthenticated: true }),
        );
        await waitForWithTimeout(() => {
          expect(result.current.isLoading).toBe(false);
        });
        expect(result.current.providers).toEqual([]);
        expect(result.current.availableModels.length).toBe(4);
      });
    });
  });
  describe("Array.isArray(providers) check in extractModelsFromProviders", () => {
    it("should handle non-array providers input", async () => {
      mockApi.getLLMSettings.mockResolvedValue({
        providers: null,
        // This will be checked before extractModelsFromProviders
        iteration_limit: 10,
        default_model: "gpt-4",
      });
      const { result } = renderHook(() =>
        useLLMProviders({ storage: mockStorage, isAuthenticated: true }),
      );
      await waitForWithTimeout(() => {
        expect(result.current.isLoading).toBe(false);
      });
      expect(result.current.providers).toEqual([]);
    });
  });
  describe("data != null check in main hook", () => {
    it("should handle null data from API", async () => {
      mockApi.getLLMSettings.mockResolvedValue(null);
      const { result } = renderHook(() =>
        useLLMProviders({ storage: mockStorage, isAuthenticated: true }),
      );
      await waitForWithTimeout(() => {
        expect(result.current.isLoading).toBe(false);
      });
      expect(result.current.providers).toEqual([]);
    });
    it("should handle undefined data from API", async () => {
      mockApi.getLLMSettings.mockResolvedValue(void 0);
      const { result } = renderHook(() =>
        useLLMProviders({ storage: mockStorage, isAuthenticated: true }),
      );
      await waitForWithTimeout(() => {
        expect(result.current.isLoading).toBe(false);
      });
      expect(result.current.providers).toEqual([]);
    });
  });
  describe("data.providers != null check", () => {
    it("should verify exact null check - data.providers is null", async () => {
      mockApi.getLLMSettings.mockResolvedValue({
        providers: null,
        iteration_limit: 10,
        default_model: "gpt-4",
      });
      const { result } = renderHook(() =>
        useLLMProviders({ storage: mockStorage, isAuthenticated: true }),
      );
      await waitForWithTimeout(() => {
        expect(result.current.isLoading).toBe(false);
      });
      expect(result.current.providers).toEqual([]);
    });
    it("should verify exact null check - data.providers is undefined", async () => {
      mockApi.getLLMSettings.mockResolvedValue({
        // providers missing (undefined)
        iteration_limit: 10,
        default_model: "gpt-4",
      });
      const { result } = renderHook(() =>
        useLLMProviders({ storage: mockStorage, isAuthenticated: true }),
      );
      await waitForWithTimeout(() => {
        expect(result.current.isLoading).toBe(false);
      });
      expect(result.current.providers).toEqual([]);
    });
  });
  describe("storedSettings != null check", () => {
    it("should verify exact null check - storedSettings is null", async () => {
      mockApi.getLLMSettings.mockRejectedValue(new Error("Network error"));
      mockStorage.getItem.mockReturnValue(null);
      const { result } = renderHook(() =>
        useLLMProviders({ storage: mockStorage, isAuthenticated: true }),
      );
      await waitForWithTimeout(() => {
        expect(result.current.isLoading).toBe(false);
      });
      expect(result.current.providers).toEqual([]);
      expect(result.current.availableModels.length).toBe(4);
    });
    it("should verify exact null check - storedSettings.providers is null", async () => {
      mockApi.getLLMSettings.mockRejectedValue(new Error("Network error"));
      mockStorage.getItem.mockReturnValue(
        JSON.stringify({ providers: null, iteration_limit: 10 }),
      );
      const { result } = renderHook(() =>
        useLLMProviders({ storage: mockStorage, isAuthenticated: true }),
      );
      await waitForWithTimeout(() => {
        expect(result.current.isLoading).toBe(false);
      });
      expect(result.current.providers).toEqual([]);
      expect(result.current.availableModels.length).toBe(4);
    });
  });
});
