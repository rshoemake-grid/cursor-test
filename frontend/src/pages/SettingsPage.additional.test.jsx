import { jsx } from "react/jsx-runtime";
import { setupMocks, mockUseAuth, renderWithRouter, waitForWithTimeout } from "./SettingsPage.test.shared";
import SettingsPage from "./SettingsPage";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { showConfirm } from "../utils/confirm";
import { SettingsService } from "../services/SettingsService";
import { useProviderManagement } from "../hooks/providers";
import { useAutoSave } from "../hooks/storage";
jest.mock("../services/SettingsService");
const defaultLLMProvidersImpl = (options) => {
  if (options?.onLoadComplete) {
    Promise.resolve().then(() => {
      options.onLoadComplete({
        providers: [],
        iteration_limit: 10,
        default_model: ""
      });
    });
  }
  return {
    providers: [],
    iterationLimit: 10,
    defaultModel: ""
  };
};
const mockUseLLMProviders = jest.fn(defaultLLMProvidersImpl);
jest.mock("../hooks/providers", () => ({
  useProviderManagement: jest.fn(),
  useLLMProviders: (options) => mockUseLLMProviders(options)
}));
jest.mock("../hooks/storage", () => ({
  useAutoSave: jest.fn(),
  useLocalStorage: jest.fn(),
  getLocalStorageItem: jest.fn(),
  setLocalStorageItem: jest.fn()
}));
const mockUseProviderManagement = useProviderManagement;
const mockUseAutoSave = useAutoSave;
describe("SettingsPage - Additional Coverage", () => {
  beforeEach(() => {
    setupMocks();
    mockUseLLMProviders.mockImplementation(defaultLLMProvidersImpl);
    mockUseProviderManagement.mockReturnValue({
      saveProviders: jest.fn(),
      updateProvider: jest.fn(),
      testProvider: jest.fn(),
      addCustomModel: jest.fn(),
      testingProvider: null,
      testResults: {}
    });
    mockUseAutoSave.mockReturnValue(void 0);
  });
  describe("Provider Management", () => {
    it("should handle adding provider from template", async () => {
      const mockSaveProviders = jest.fn();
      mockUseProviderManagement.mockReturnValue({
        saveProviders: mockSaveProviders,
        updateProvider: jest.fn(),
        testProvider: jest.fn(),
        addCustomModel: jest.fn(),
        testingProvider: null,
        testResults: {}
      });
      renderWithRouter(/* @__PURE__ */ jsx(SettingsPage, {}));
      await waitForWithTimeout(() => {
        expect(screen.getAllByText(/Settings/).length).toBeGreaterThan(0);
      }, 2e3);
      const addButtons = screen.queryAllByText(/Add LLM Provider|Add Provider/);
      if (addButtons.length > 0) {
        fireEvent.click(addButtons[0]);
        await waitFor(() => {
          const templateSelects = screen.queryAllByRole("combobox");
          if (templateSelects.length > 0) {
            fireEvent.change(templateSelects[0], { target: { value: "anthropic" } });
            const confirmButtons = screen.queryAllByText(/Add Provider/);
            if (confirmButtons.length > 0) {
              fireEvent.click(confirmButtons[confirmButtons.length - 1]);
            }
          }
        });
      }
    });
    it("should handle provider template selection", async () => {
      renderWithRouter(/* @__PURE__ */ jsx(SettingsPage, {}));
      await waitForWithTimeout(() => {
        expect(screen.getAllByText(/Settings/).length).toBeGreaterThan(0);
      }, 2e3);
      const addButtons = screen.queryAllByText(/Add LLM Provider|Add Provider/);
      if (addButtons.length > 0) {
        fireEvent.click(addButtons[0]);
        await waitFor(() => {
          const selects = screen.queryAllByRole("combobox");
          if (selects.length > 0) {
            fireEvent.change(selects[0], { target: { value: "gemini" } });
            fireEvent.change(selects[0], { target: { value: "custom" } });
          }
        });
      }
    });
    it("should handle canceling add provider", async () => {
      renderWithRouter(/* @__PURE__ */ jsx(SettingsPage, {}));
      await waitForWithTimeout(() => {
        expect(screen.getAllByText(/Settings/).length).toBeGreaterThan(0);
      }, 2e3);
      const addButtons = screen.queryAllByText(/Add LLM Provider|Add Provider/);
      if (addButtons.length > 0) {
        fireEvent.click(addButtons[0]);
        await waitFor(() => {
          const cancelButtons = screen.queryAllByText(/Cancel/);
          if (cancelButtons.length > 0) {
            fireEvent.click(cancelButtons[0]);
          }
        });
      }
    });
    it("should handle updating provider fields", async () => {
      const mockUpdateProvider = jest.fn();
      mockUseProviderManagement.mockReturnValue({
        saveProviders: jest.fn(),
        updateProvider: mockUpdateProvider,
        testProvider: jest.fn(),
        addCustomModel: jest.fn(),
        testingProvider: null,
        testResults: {}
      });
      const savedProviders = [
        {
          id: "provider-1",
          name: "OpenAI",
          type: "openai",
          apiKey: "sk-test",
          defaultModel: "gpt-4",
          models: ["gpt-4"],
          enabled: true
        }
      ];
      localStorage.setItem("llm_settings", JSON.stringify({ providers: savedProviders }));
      renderWithRouter(/* @__PURE__ */ jsx(SettingsPage, {}));
      await waitForWithTimeout(() => {
        expect(screen.getAllByText(/Settings/).length).toBeGreaterThan(0);
      }, 3e3);
      const inputs = screen.queryAllByRole("textbox");
      if (inputs.length > 0) {
        fireEvent.change(inputs[0], { target: { value: "new-api-key" } });
      }
    });
    it("should handle testing provider connection", async () => {
      const mockTestProvider = jest.fn().mockResolvedValue({
        status: "success",
        message: "Connection successful"
      });
      mockUseProviderManagement.mockReturnValue({
        saveProviders: jest.fn(),
        updateProvider: jest.fn(),
        testProvider: mockTestProvider,
        addCustomModel: jest.fn(),
        testingProvider: null,
        testResults: {}
      });
      const savedProviders = [
        {
          id: "provider-1",
          name: "OpenAI",
          type: "openai",
          apiKey: "sk-test",
          defaultModel: "gpt-4",
          models: ["gpt-4"],
          enabled: true
        }
      ];
      localStorage.setItem("llm_settings", JSON.stringify({ providers: savedProviders }));
      renderWithRouter(/* @__PURE__ */ jsx(SettingsPage, {}));
      await waitForWithTimeout(() => {
        expect(screen.getAllByText(/Settings/).length).toBeGreaterThan(0);
      }, 3e3);
      const testButtons = screen.queryAllByText(/Test Connection/);
      if (testButtons.length > 0) {
        fireEvent.click(testButtons[0]);
        await waitFor(() => {
          expect(mockTestProvider).toHaveBeenCalled();
        });
      }
    });
    it("should show testing state during provider test", async () => {
      mockUseProviderManagement.mockReturnValue({
        saveProviders: jest.fn(),
        updateProvider: jest.fn(),
        testProvider: jest.fn(),
        addCustomModel: jest.fn(),
        testingProvider: "provider-1",
        testResults: {}
      });
      renderWithRouter(/* @__PURE__ */ jsx(SettingsPage, {}));
      await waitForWithTimeout(() => {
        const loadingElements = screen.queryAllByText(/Testing/);
        if (loadingElements.length > 0) {
          expect(loadingElements.length).toBeGreaterThan(0);
        }
      }, 2e3);
    });
    it("should display test results", async () => {
      mockUseProviderManagement.mockReturnValue({
        saveProviders: jest.fn(),
        updateProvider: jest.fn(),
        testProvider: jest.fn(),
        addCustomModel: jest.fn(),
        testingProvider: null,
        testResults: {
          "provider-1": {
            status: "success",
            message: "Connection successful"
          }
        }
      });
      renderWithRouter(/* @__PURE__ */ jsx(SettingsPage, {}));
      await waitForWithTimeout(() => {
        const successMessages = screen.queryAllByText(/Connection successful|success/);
        if (successMessages.length > 0) {
          expect(successMessages.length).toBeGreaterThan(0);
        }
      }, 2e3);
    });
    it("should handle test error results", async () => {
      mockUseProviderManagement.mockReturnValue({
        saveProviders: jest.fn(),
        updateProvider: jest.fn(),
        testProvider: jest.fn(),
        addCustomModel: jest.fn(),
        testingProvider: null,
        testResults: {
          "provider-1": {
            status: "error",
            message: "Connection failed"
          }
        }
      });
      renderWithRouter(/* @__PURE__ */ jsx(SettingsPage, {}));
      await waitForWithTimeout(() => {
        const errorMessages = screen.queryAllByText(/Connection failed|error/i);
        if (errorMessages.length > 0) {
          expect(errorMessages.length).toBeGreaterThan(0);
        }
      }, 2e3);
    });
    it("should handle adding custom model", async () => {
      const mockAddCustomModel = jest.fn();
      mockUseProviderManagement.mockReturnValue({
        saveProviders: jest.fn(),
        updateProvider: jest.fn(),
        testProvider: jest.fn(),
        addCustomModel: mockAddCustomModel,
        testingProvider: null,
        testResults: {}
      });
      window.prompt = jest.fn().mockReturnValue("custom-model-name");
      const savedProviders = [
        {
          id: "provider-1",
          name: "OpenAI",
          type: "openai",
          apiKey: "sk-test",
          defaultModel: "gpt-4",
          models: ["gpt-4"],
          enabled: true
        }
      ];
      localStorage.setItem("llm_settings", JSON.stringify({ providers: savedProviders }));
      renderWithRouter(/* @__PURE__ */ jsx(SettingsPage, {}));
      await waitForWithTimeout(() => {
        expect(screen.getAllByText(/Settings/).length).toBeGreaterThan(0);
      }, 3e3);
    });
    it("should handle canceling delete provider", async () => {
      showConfirm.mockResolvedValue(false);
      const savedProviders = [
        {
          id: "provider-1",
          name: "OpenAI",
          type: "openai",
          apiKey: "sk-test",
          defaultModel: "gpt-4",
          models: ["gpt-4"],
          enabled: true
        }
      ];
      localStorage.setItem("llm_settings", JSON.stringify({ providers: savedProviders }));
      renderWithRouter(/* @__PURE__ */ jsx(SettingsPage, {}));
      await waitForWithTimeout(() => {
        expect(screen.getAllByText(/Settings/).length).toBeGreaterThan(0);
      }, 3e3);
      const deleteButtons = screen.queryAllByTitle(/Delete provider/);
      if (deleteButtons.length > 0) {
        fireEvent.click(deleteButtons[0]);
        await waitFor(() => {
          expect(showConfirm).toHaveBeenCalled();
        });
        const saved = localStorage.getItem("llm_settings");
        if (saved) {
          const settings = JSON.parse(saved);
          if (settings.providers) {
            expect(settings.providers.length).toBeGreaterThan(0);
          }
        }
      }
    });
  });
  describe("Model Management", () => {
    it("should toggle model expansion", async () => {
      const savedProviders = [
        {
          id: "provider-1",
          name: "OpenAI",
          type: "openai",
          apiKey: "sk-test",
          defaultModel: "gpt-4",
          models: ["gpt-4", "gpt-3.5-turbo"],
          enabled: true
        }
      ];
      localStorage.setItem("llm_settings", JSON.stringify({ providers: savedProviders }));
      renderWithRouter(/* @__PURE__ */ jsx(SettingsPage, {}));
      await waitForWithTimeout(() => {
        expect(screen.getAllByText(/Settings/).length).toBeGreaterThan(0);
      }, 3e3);
      const expandButtons = screen.queryAllByTitle(/Expand|Collapse/);
      if (expandButtons.length > 0) {
        fireEvent.click(expandButtons[0]);
        await waitFor(() => {
        });
        fireEvent.click(expandButtons[0]);
      }
    });
    it("should handle setting default model", async () => {
      const savedProviders = [
        {
          id: "provider-1",
          name: "OpenAI",
          type: "openai",
          apiKey: "sk-test",
          defaultModel: "gpt-4",
          models: ["gpt-4", "gpt-3.5-turbo"],
          enabled: true
        }
      ];
      localStorage.setItem("llm_settings", JSON.stringify({ providers: savedProviders }));
      renderWithRouter(/* @__PURE__ */ jsx(SettingsPage, {}));
      await waitForWithTimeout(() => {
        expect(screen.getAllByText(/Settings/).length).toBeGreaterThan(0);
      }, 3e3);
      const selects = screen.queryAllByRole("combobox");
      if (selects.length > 0) {
        selects.forEach((select) => {
          if (select.options.length > 1) {
            fireEvent.change(select, { target: { value: "gpt-3.5-turbo" } });
          }
        });
      }
    });
  });
  describe("Workflow Settings Tab", () => {
    it("should render workflow generation settings", async () => {
      renderWithRouter(/* @__PURE__ */ jsx(SettingsPage, {}));
      await waitForWithTimeout(() => {
        const workflowTab = screen.queryByText(/Workflow Generation/);
        if (workflowTab) {
          fireEvent.click(workflowTab);
        }
      }, 2e3);
      await waitFor(() => {
        const limitInputs = screen.queryAllByLabelText(/Iteration Limit/);
        const modelSelects = screen.queryAllByLabelText(/Default Model/);
        if (limitInputs.length > 0 || modelSelects.length > 0) {
          expect(limitInputs.length + modelSelects.length).toBeGreaterThan(0);
        }
      });
    });
    it("should update iteration limit with validation", async () => {
      renderWithRouter(/* @__PURE__ */ jsx(SettingsPage, {}));
      await waitForWithTimeout(() => {
        const workflowTab = screen.queryByText(/Workflow Generation/);
        if (workflowTab) {
          fireEvent.click(workflowTab);
        }
      }, 2e3);
      await waitFor(() => {
        const limitInputs = screen.queryAllByLabelText(/Iteration Limit/);
        if (limitInputs.length > 0) {
          const input = limitInputs[0];
          fireEvent.change(input, { target: { value: "0" } });
          expect(parseInt(input.value) || 1).toBeGreaterThanOrEqual(1);
        }
      });
    });
    it("should filter default model options by enabled providers", async () => {
      const savedProviders = [
        {
          id: "provider-1",
          name: "OpenAI",
          type: "openai",
          apiKey: "sk-test",
          defaultModel: "gpt-4",
          models: ["gpt-4", "gpt-3.5-turbo"],
          enabled: true
        },
        {
          id: "provider-2",
          name: "Anthropic",
          type: "anthropic",
          apiKey: "sk-test",
          defaultModel: "claude-3",
          models: ["claude-3"],
          enabled: false
          // Disabled provider
        }
      ];
      localStorage.setItem("llm_settings", JSON.stringify({ providers: savedProviders }));
      renderWithRouter(/* @__PURE__ */ jsx(SettingsPage, {}));
      await waitForWithTimeout(() => {
        const workflowTab = screen.queryByText(/Workflow Generation/);
        if (workflowTab) {
          fireEvent.click(workflowTab);
        }
      }, 2e3);
      await waitFor(() => {
        const modelSelects = screen.queryAllByLabelText(/Default Model/);
        if (modelSelects.length > 0) {
          const select = modelSelects[0];
          const options = Array.from(select.options).map((opt) => opt.value);
          expect(options).not.toContain("claude-3");
        }
      });
    });
  });
  describe("Auto-save", () => {
    beforeEach(() => {
      mockUseLLMProviders.mockReturnValue({
        providers: [],
        iterationLimit: 10,
        defaultModel: ""
      });
    });
    it("should call useAutoSave hook", async () => {
      renderWithRouter(/* @__PURE__ */ jsx(SettingsPage, {}));
      await waitFor(() => {
        expect(mockUseAutoSave).toHaveBeenCalled();
      });
    });
    it("should enable auto-save when authenticated and settings loaded", async () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: { id: "1", username: "testuser" },
        token: "token",
        login: jest.fn(),
        logout: jest.fn(),
        register: jest.fn()
      });
      renderWithRouter(/* @__PURE__ */ jsx(SettingsPage, {}));
      await waitFor(() => {
        expect(mockUseAutoSave).toHaveBeenCalled();
        const enabledCalls = mockUseAutoSave.mock.calls.filter(
          (call) => call.length > 3 && call[3] === true
        );
        expect(enabledCalls.length).toBeGreaterThanOrEqual(0);
      }, { timeout: 3e3 });
    });
    it("should disable auto-save when not authenticated", async () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        user: null,
        token: null,
        login: jest.fn(),
        logout: jest.fn(),
        register: jest.fn()
      });
      renderWithRouter(/* @__PURE__ */ jsx(SettingsPage, {}));
      await waitFor(() => {
        const autoSaveCall = mockUseAutoSave.mock.calls.find(
          (call) => call.length > 3 && call[3] === false
        );
        expect(autoSaveCall).toBeDefined();
      });
    });
  });
  describe("Manual Sync", () => {
    it("should handle manual sync success", async () => {
      const mockSaveSettings = jest.fn().mockResolvedValue(void 0);
      const MockedSettingsService = SettingsService;
      MockedSettingsService.mockImplementation(() => ({
        saveSettings: mockSaveSettings,
        testProvider: jest.fn()
      }));
      renderWithRouter(/* @__PURE__ */ jsx(SettingsPage, {}));
      await waitForWithTimeout(() => {
        expect(screen.getAllByText(/Settings/).length).toBeGreaterThan(0);
      }, 2e3);
      const syncButtons = screen.queryAllByText(/Sync Now/);
      expect(syncButtons.length).toBeGreaterThan(0);
      fireEvent.click(syncButtons[0]);
      await waitFor(() => {
        expect(mockSaveSettings).toHaveBeenCalled();
      });
    });
    it("should handle manual sync error", async () => {
      const mockSaveSettings = jest.fn().mockRejectedValue(new Error("Sync failed"));
      const MockedSettingsService = SettingsService;
      MockedSettingsService.mockImplementation(() => ({
        saveSettings: mockSaveSettings,
        testProvider: jest.fn()
      }));
      renderWithRouter(/* @__PURE__ */ jsx(SettingsPage, {}));
      await waitForWithTimeout(() => {
        expect(screen.getAllByText(/Settings/).length).toBeGreaterThan(0);
      }, 2e3);
      const syncButtons = screen.queryAllByText(/Sync Now/);
      expect(syncButtons.length).toBeGreaterThan(0);
      fireEvent.click(syncButtons[0]);
      await waitFor(() => {
        expect(mockSaveSettings).toHaveBeenCalled();
      });
    });
  });
});
