import { renderHook } from "@testing-library/react";
import { useSettingsSync } from "./useSettingsSync";
jest.mock("../../utils/notifications", () => ({
  showError: jest.fn(),
  showSuccess: jest.fn(),
}));
jest.mock("../storage", () => ({
  useAutoSave: jest.fn(),
}));
describe("useSettingsSync", () => {
  const mockSettingsService = {
    saveSettings: jest.fn(),
  };
  const mockConsoleAdapter = {
    log: jest.fn(),
    error: jest.fn(),
  };
  const mockProviders = [
    {
      id: "provider-1",
      name: "Test Provider",
      type: "openai",
      apiKey: "test-key",
      baseUrl: "https://api.test.com",
      defaultModel: "gpt-4",
      models: ["gpt-4", "gpt-3.5"],
      enabled: true,
    },
  ];
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it("should return handleManualSync function", () => {
    const { result } = renderHook(() =>
      useSettingsSync({
        isAuthenticated: true,
        token: "test-token",
        providers: mockProviders,
        iterationLimit: 10,
        defaultModel: "gpt-4",
        chatAssistantModel: "",
        settingsService: mockSettingsService,
        settingsLoaded: true,
        consoleAdapter: mockConsoleAdapter,
      }),
    );
    expect(result.current.handleManualSync).toBeDefined();
    expect(typeof result.current.handleManualSync).toBe("function");
  });
  it("should call useAutoSave hook", () => {
    const { useAutoSave } = require("../storage");
    renderHook(() =>
      useSettingsSync({
        isAuthenticated: true,
        token: "test-token",
        providers: mockProviders,
        iterationLimit: 10,
        defaultModel: "gpt-4",
        chatAssistantModel: "",
        settingsService: mockSettingsService,
        settingsLoaded: true,
        consoleAdapter: mockConsoleAdapter,
      }),
    );
    expect(useAutoSave).toHaveBeenCalled();
  });
  it("should enable auto-save when authenticated and settings loaded", () => {
    const { useAutoSave } = require("../storage");
    renderHook(() =>
      useSettingsSync({
        isAuthenticated: true,
        token: "test-token",
        providers: mockProviders,
        iterationLimit: 10,
        defaultModel: "gpt-4",
        chatAssistantModel: "",
        settingsService: mockSettingsService,
        settingsLoaded: true,
        consoleAdapter: mockConsoleAdapter,
      }),
    );
    const autoSaveCall = useAutoSave.mock.calls[0];
    expect(autoSaveCall[2]).toBe(500);
    expect(autoSaveCall[3]).toBe(true);
  });
  it("should disable auto-save when not authenticated", () => {
    const { useAutoSave } = require("../storage");
    renderHook(() =>
      useSettingsSync({
        isAuthenticated: false,
        token: null,
        providers: mockProviders,
        iterationLimit: 10,
        defaultModel: "gpt-4",
        chatAssistantModel: "",
        settingsService: mockSettingsService,
        settingsLoaded: true,
        consoleAdapter: mockConsoleAdapter,
      }),
    );
    const autoSaveCall = useAutoSave.mock.calls[0];
    expect(autoSaveCall[3]).toBe(false);
  });
  it("should disable auto-save when settings not loaded", () => {
    const { useAutoSave } = require("../storage");
    renderHook(() =>
      useSettingsSync({
        isAuthenticated: true,
        token: "test-token",
        providers: mockProviders,
        iterationLimit: 10,
        defaultModel: "gpt-4",
        chatAssistantModel: "",
        settingsService: mockSettingsService,
        settingsLoaded: false,
        consoleAdapter: mockConsoleAdapter,
      }),
    );
    const autoSaveCall = useAutoSave.mock.calls[0];
    expect(autoSaveCall[3]).toBe(false);
  });
});
