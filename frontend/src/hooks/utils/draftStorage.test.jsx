import {
  loadDraftsFromStorage,
  saveDraftsToStorage,
  getDraftForTab,
  saveDraftForTab,
  deleteDraftForTab,
  clearAllDrafts,
  draftExists
} from "./draftStorage";
import { getLocalStorageItem, setLocalStorageItem } from "../storage";
jest.mock("../storage", () => ({
  getLocalStorageItem: jest.fn(),
  setLocalStorageItem: jest.fn()
}), { virtual: false });
jest.mock("../../utils/logger", () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    log: jest.fn(),
    warn: jest.fn()
  }
}));
const mockGetLocalStorageItem = getLocalStorageItem;
const mockSetLocalStorageItem = setLocalStorageItem;
describe("draftStorage", () => {
  const mockDraft = {
    nodes: [
      { id: "node-1", type: "agent", position: { x: 0, y: 0 }, data: {} }
    ],
    edges: [
      { id: "edge-1", source: "node-1", target: "node-2" }
    ],
    workflowId: "workflow-1",
    workflowName: "Test Workflow",
    workflowDescription: "Test Description",
    isUnsaved: false
  };
  const mockDrafts = {
    "tab-1": mockDraft,
    "tab-2": {
      ...mockDraft,
      workflowId: "workflow-2",
      workflowName: "Another Workflow"
    }
  };
  beforeEach(() => {
    mockGetLocalStorageItem.mockReset();
    mockGetLocalStorageItem.mockReturnValue({});
    mockSetLocalStorageItem.mockReset();
    mockSetLocalStorageItem.mockReturnValue(void 0);
  });
  describe("loadDraftsFromStorage", () => {
    it("should load drafts from storage", () => {
      mockGetLocalStorageItem.mockReturnValue(mockDrafts);
      const result = loadDraftsFromStorage();
      expect(mockGetLocalStorageItem).toHaveBeenCalledWith("workflowBuilderDrafts", {}, void 0);
      expect(result).toEqual(mockDrafts);
    });
    it("should return empty object when storage returns null", () => {
      mockGetLocalStorageItem.mockReturnValue(null);
      const result = loadDraftsFromStorage();
      expect(result).toEqual({});
    });
    it("should return empty object when storage returns non-object", () => {
      mockGetLocalStorageItem.mockReturnValue("invalid");
      const result = loadDraftsFromStorage();
      expect(result).toEqual({});
    });
    it("should pass options to getLocalStorageItem", () => {
      const mockStorage = { getItem: jest.fn(), setItem: jest.fn() };
      const mockLogger = { debug: jest.fn() };
      mockGetLocalStorageItem.mockReturnValue({});
      loadDraftsFromStorage({ storage: mockStorage, logger: mockLogger });
      expect(mockGetLocalStorageItem).toHaveBeenCalledWith("workflowBuilderDrafts", {}, { storage: mockStorage, logger: mockLogger });
    });
  });
  describe("saveDraftsToStorage", () => {
    it("should save drafts to storage", () => {
      saveDraftsToStorage(mockDrafts);
      expect(mockSetLocalStorageItem).toHaveBeenCalledWith("workflowBuilderDrafts", mockDrafts, void 0);
    });
    it("should pass options to setLocalStorageItem", () => {
      const mockStorage = { getItem: jest.fn(), setItem: jest.fn() };
      const mockLogger = { debug: jest.fn() };
      saveDraftsToStorage(mockDrafts, { storage: mockStorage, logger: mockLogger });
      expect(mockSetLocalStorageItem).toHaveBeenCalledWith("workflowBuilderDrafts", mockDrafts, { storage: mockStorage, logger: mockLogger });
    });
  });
  describe("getDraftForTab", () => {
    it("should get draft for specific tab", () => {
      mockGetLocalStorageItem.mockReturnValue(mockDrafts);
      const result = getDraftForTab("tab-1");
      expect(result).toEqual(mockDraft);
    });
    it("should return undefined when tab does not exist", () => {
      mockGetLocalStorageItem.mockReturnValue(mockDrafts);
      const result = getDraftForTab("non-existent");
      expect(result).toBeUndefined();
    });
    it("should return undefined when no drafts exist", () => {
      mockGetLocalStorageItem.mockReturnValue({});
      const result = getDraftForTab("tab-1");
      expect(result).toBeUndefined();
    });
    it("should pass options to loadDraftsFromStorage", () => {
      const mockStorage = { getItem: jest.fn(), setItem: jest.fn() };
      mockGetLocalStorageItem.mockReturnValue({});
      getDraftForTab("tab-1", { storage: mockStorage });
      expect(mockGetLocalStorageItem).toHaveBeenCalled();
    });
  });
  describe("saveDraftForTab", () => {
    it("should save draft for specific tab", () => {
      mockGetLocalStorageItem.mockReturnValue({});
      const newDraft = {
        ...mockDraft,
        workflowName: "New Workflow"
      };
      saveDraftForTab("tab-1", newDraft);
      expect(mockGetLocalStorageItem).toHaveBeenCalled();
      expect(mockSetLocalStorageItem).toHaveBeenCalledWith("workflowBuilderDrafts", { "tab-1": newDraft }, void 0);
    });
    it("should update existing draft for tab", () => {
      mockGetLocalStorageItem.mockReturnValue(mockDrafts);
      const updatedDraft = {
        ...mockDraft,
        workflowName: "Updated Workflow"
      };
      saveDraftForTab("tab-1", updatedDraft);
      expect(mockSetLocalStorageItem).toHaveBeenCalledWith("workflowBuilderDrafts", {
        "tab-1": updatedDraft,
        "tab-2": mockDrafts["tab-2"]
      }, void 0);
    });
    it("should pass options to storage functions", () => {
      const mockStorage = { getItem: jest.fn(), setItem: jest.fn() };
      mockGetLocalStorageItem.mockReturnValue({});
      saveDraftForTab("tab-1", mockDraft, { storage: mockStorage });
      expect(mockGetLocalStorageItem).toHaveBeenCalled();
      expect(mockSetLocalStorageItem).toHaveBeenCalled();
    });
  });
  describe("deleteDraftForTab", () => {
    it("should delete draft for specific tab", () => {
      mockGetLocalStorageItem.mockReturnValue(mockDrafts);
      deleteDraftForTab("tab-1");
      expect(mockGetLocalStorageItem).toHaveBeenCalled();
      expect(mockSetLocalStorageItem).toHaveBeenCalledWith("workflowBuilderDrafts", {
        "tab-2": mockDrafts["tab-2"]
      }, void 0);
    });
    it("should handle deleting non-existent tab gracefully", () => {
      mockGetLocalStorageItem.mockReturnValue(mockDrafts);
      deleteDraftForTab("non-existent");
      expect(mockSetLocalStorageItem).toHaveBeenCalledWith("workflowBuilderDrafts", mockDrafts, void 0);
    });
    it("should handle deleting from empty drafts", () => {
      mockGetLocalStorageItem.mockReturnValue({});
      deleteDraftForTab("tab-1");
      expect(mockSetLocalStorageItem).toHaveBeenCalledWith("workflowBuilderDrafts", {}, void 0);
    });
    it("should pass options to storage functions", () => {
      const mockStorage = { getItem: jest.fn(), setItem: jest.fn() };
      mockGetLocalStorageItem.mockReturnValue({});
      deleteDraftForTab("tab-1", { storage: mockStorage });
      expect(mockGetLocalStorageItem).toHaveBeenCalled();
      expect(mockSetLocalStorageItem).toHaveBeenCalled();
    });
  });
  describe("clearAllDrafts", () => {
    it("should clear all drafts from storage", () => {
      clearAllDrafts();
      expect(mockSetLocalStorageItem).toHaveBeenCalledWith("workflowBuilderDrafts", {}, void 0);
    });
    it("should pass options to setLocalStorageItem", () => {
      const mockStorage = { getItem: jest.fn(), setItem: jest.fn() };
      const mockLogger = { debug: jest.fn() };
      clearAllDrafts({ storage: mockStorage, logger: mockLogger });
      expect(mockSetLocalStorageItem).toHaveBeenCalledWith("workflowBuilderDrafts", {}, { storage: mockStorage, logger: mockLogger });
    });
  });
  describe("draftExists", () => {
    it.skip("should return true when draft exists", () => {
      mockGetLocalStorageItem.mockReset();
      mockGetLocalStorageItem.mockReturnValue(mockDrafts);
      const result = draftExists("tab-1");
      expect(mockGetLocalStorageItem).toHaveBeenCalled();
      expect(mockGetLocalStorageItem).toHaveBeenCalledWith("workflowBuilderDrafts", {}, void 0);
      expect(result).toBe(true);
    });
    it("should return false when draft does not exist", () => {
      mockGetLocalStorageItem.mockReturnValue(mockDrafts);
      const result = draftExists("non-existent");
      expect(result).toBe(false);
    });
    it("should return false when no drafts exist", () => {
      mockGetLocalStorageItem.mockReturnValue({});
      const result = draftExists("tab-1");
      expect(result).toBe(false);
    });
    it("should pass options to getDraftForTab", () => {
      const mockStorage = { getItem: jest.fn(), setItem: jest.fn() };
      mockGetLocalStorageItem.mockReturnValue({});
      draftExists("tab-1", { storage: mockStorage });
      expect(mockGetLocalStorageItem).toHaveBeenCalled();
    });
  });
});
