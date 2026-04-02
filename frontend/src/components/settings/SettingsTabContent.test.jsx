import { jsx } from "react/jsx-runtime";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { SettingsTabContent } from "./SettingsTabContent";
import { SETTINGS_TABS } from "../../constants/settingsConstants";
jest.mock("./ProviderForm", () => {
  const { jsx } = require("react/jsx-runtime");
  return {
    ProviderForm: ({
      provider
    }) => /* @__PURE__ */jsx("div", {
      "data-testid": `provider-form-${provider.id}`,
      children: provider.name
    })
  };
});
describe("SettingsTabContent", () => {
  const mockProviders = [{
    id: "provider-1",
    name: "OpenAI",
    type: "openai",
    apiKey: "test-key",
    baseUrl: "https://api.openai.com",
    defaultModel: "gpt-4",
    models: ["gpt-4", "gpt-3.5-turbo"],
    enabled: true
  }];
  const defaultProps = {
    activeTab: SETTINGS_TABS.LLM,
    iterationLimit: 10,
    onIterationLimitChange: jest.fn(),
    defaultModel: "",
    onDefaultModelChange: jest.fn(),
    chatAssistantModel: "",
    onChatAssistantModelChange: jest.fn(),
    providers: mockProviders,
    showAddProvider: false,
    onShowAddProvider: jest.fn(),
    selectedTemplate: "openai",
    onSelectedTemplateChange: jest.fn(),
    onAddProvider: jest.fn(),
    showApiKeys: {},
    expandedProviders: /* @__PURE__ */new Set(),
    expandedModels: {},
    testingProvider: null,
    testResults: {},
    onToggleProviderModels: jest.fn(),
    onToggleApiKeyVisibility: jest.fn(),
    onUpdateProvider: jest.fn(),
    onDeleteProvider: jest.fn(),
    onAddCustomModel: jest.fn(),
    onTestProvider: jest.fn(),
    onToggleModel: jest.fn(),
    isModelExpanded: jest.fn(() => false)
  };
  beforeEach(() => {
    jest.clearAllMocks();
  });
  describe("Workflow Tab", () => {
    it("should render workflow tab content when activeTab is WORKFLOW", () => {
      render(/* @__PURE__ */jsx(SettingsTabContent, {
        ...defaultProps,
        activeTab: SETTINGS_TABS.WORKFLOW
      }));
      expect(screen.getByLabelText("Iteration limit")).toBeInTheDocument();
      expect(screen.getByLabelText("Default Model")).toBeInTheDocument();
      expect(screen.getByLabelText("Workflow chat model")).toBeInTheDocument();
    });
    it("should display current iteration limit", () => {
      render(/* @__PURE__ */jsx(SettingsTabContent, {
        ...defaultProps,
        activeTab: SETTINGS_TABS.WORKFLOW,
        iterationLimit: 15
      }));
      const input = screen.getByLabelText("Iteration limit");
      expect(input.value).toBe("15");
    });
    it("should call onIterationLimitChange when iteration limit changes", () => {
      render(/* @__PURE__ */jsx(SettingsTabContent, {
        ...defaultProps,
        activeTab: SETTINGS_TABS.WORKFLOW
      }));
      const input = screen.getByLabelText("Iteration limit");
      fireEvent.change(input, {
        target: {
          value: "20"
        }
      });
      expect(defaultProps.onIterationLimitChange).toHaveBeenCalledWith(20);
    });
    it("should display current default model", () => {
      render(/* @__PURE__ */jsx(SettingsTabContent, {
        ...defaultProps,
        activeTab: SETTINGS_TABS.WORKFLOW,
        defaultModel: "gpt-4"
      }));
      const select = screen.getByLabelText("Default Model");
      expect(select.value).toBe("gpt-4");
    });
    it("should call onDefaultModelChange when default model changes", () => {
      render(/* @__PURE__ */jsx(SettingsTabContent, {
        ...defaultProps,
        activeTab: SETTINGS_TABS.WORKFLOW
      }));
      const select = screen.getByLabelText("Default Model");
      fireEvent.change(select, {
        target: {
          value: "gpt-4"
        }
      });
      expect(defaultProps.onDefaultModelChange).toHaveBeenCalledWith("gpt-4");
    });
    it("should show model confirmation when defaultModel is set", () => {
      render(/* @__PURE__ */jsx(SettingsTabContent, {
        ...defaultProps,
        activeTab: SETTINGS_TABS.WORKFLOW,
        defaultModel: "gpt-4"
      }));
      expect(screen.getByText(/✓ Using: gpt-4/)).toBeInTheDocument();
    });
    it("should show sign-in notice and disable workflow fields when not authenticated", () => {
      render(/* @__PURE__ */ jsx(MemoryRouter, {
        children: /* @__PURE__ */ jsx(SettingsTabContent, {
          ...defaultProps,
          isAuthenticated: false,
          activeTab: SETTINGS_TABS.WORKFLOW
        })
      }));
      expect(screen.getByText("Sign in required")).toBeInTheDocument();
      expect(screen.getByLabelText("Iteration limit")).toBeDisabled();
      expect(screen.getByLabelText("Default Model")).toBeDisabled();
    });
  });
  describe("LLM Tab", () => {
    it("should render LLM tab content when activeTab is LLM", () => {
      render(/* @__PURE__ */jsx(SettingsTabContent, {
        ...defaultProps,
        activeTab: SETTINGS_TABS.LLM
      }));
      expect(screen.getByText("Add LLM Provider")).toBeInTheDocument();
    });
    it("should show add provider button when showAddProvider is false", () => {
      render(/* @__PURE__ */jsx(SettingsTabContent, {
        ...defaultProps,
        activeTab: SETTINGS_TABS.LLM,
        showAddProvider: false
      }));
      expect(screen.getByText("Add LLM Provider")).toBeInTheDocument();
    });
    it("should call onShowAddProvider when add provider button is clicked", () => {
      render(/* @__PURE__ */jsx(SettingsTabContent, {
        ...defaultProps,
        activeTab: SETTINGS_TABS.LLM,
        showAddProvider: false
      }));
      const button = screen.getByText("Add LLM Provider");
      fireEvent.click(button);
      expect(defaultProps.onShowAddProvider).toHaveBeenCalledWith(true);
    });
    it("should show add provider form when showAddProvider is true", () => {
      render(/* @__PURE__ */jsx(SettingsTabContent, {
        ...defaultProps,
        activeTab: SETTINGS_TABS.LLM,
        showAddProvider: true
      }));
      expect(screen.getByText("Add New Provider")).toBeInTheDocument();
      expect(screen.getByLabelText("Select Provider Type")).toBeInTheDocument();
    });
    it("should call onAddProvider when add button is clicked", () => {
      render(/* @__PURE__ */jsx(SettingsTabContent, {
        ...defaultProps,
        activeTab: SETTINGS_TABS.LLM,
        showAddProvider: true
      }));
      const addButton = screen.getByText("Add Provider");
      fireEvent.click(addButton);
      expect(defaultProps.onAddProvider).toHaveBeenCalledTimes(1);
    });
    it("should call onShowAddProvider(false) when cancel button is clicked", () => {
      render(/* @__PURE__ */jsx(SettingsTabContent, {
        ...defaultProps,
        activeTab: SETTINGS_TABS.LLM,
        showAddProvider: true
      }));
      const cancelButton = screen.getByText("Cancel");
      fireEvent.click(cancelButton);
      expect(defaultProps.onShowAddProvider).toHaveBeenCalledWith(false);
    });
    it("should render provider forms for each provider", () => {
      render(/* @__PURE__ */jsx(SettingsTabContent, {
        ...defaultProps,
        activeTab: SETTINGS_TABS.LLM
      }));
      expect(screen.getByTestId("provider-form-provider-1")).toBeInTheDocument();
      expect(screen.getByText("OpenAI")).toBeInTheDocument();
    });
    it("should display auto-sync message", () => {
      render(/* @__PURE__ */jsx(SettingsTabContent, {
        ...defaultProps,
        activeTab: SETTINGS_TABS.LLM
      }));
      expect(screen.getByText(/Auto-sync enabled/)).toBeInTheDocument();
    });
    it("should show only sign-in notice on LLM tab when not authenticated", () => {
      render(/* @__PURE__ */ jsx(MemoryRouter, {
        children: /* @__PURE__ */ jsx(SettingsTabContent, {
          ...defaultProps,
          isAuthenticated: false,
          activeTab: SETTINGS_TABS.LLM
        })
      }));
      expect(screen.getByText("Sign in required")).toBeInTheDocument();
      expect(screen.queryByText("Add LLM Provider")).not.toBeInTheDocument();
      expect(screen.queryByTestId("provider-form-provider-1")).not.toBeInTheDocument();
    });
  });
  it("should return null for unknown tab", () => {
    const {
      container
    } = render(/* @__PURE__ */jsx(SettingsTabContent, {
      ...defaultProps,
      activeTab: "unknown"
    }));
    expect(container.firstChild).toBeNull();
  });
});
