import { renderHook } from "@testing-library/react";
import { useTabInitialization } from "./useTabInitialization";
describe("useTabInitialization", () => {
  let mockSetTabs;
  let mockSetActiveTabId;
  let mockTabsRef;
  let mockProcessedKeys;
  const initialTabs = [
    {
      id: "tab-1",
      name: "Workflow 1",
      workflowId: "workflow-1",
      isUnsaved: false,
      executions: [],
      activeExecutionId: null,
    },
  ];
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockSetTabs = jest.fn((updater) => {
      if (typeof updater === "function") {
        return updater(initialTabs);
      }
      return updater;
    });
    mockSetActiveTabId = jest.fn();
    mockTabsRef = { current: initialTabs };
    mockProcessedKeys = { current: new Set() };
  });
  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });
  describe("activeTabId validation", () => {
    it("should switch to first tab when activeTabId does not exist", () => {
      const tabs = [
        {
          id: "tab-1",
          name: "Tab 1",
          workflowId: null,
          isUnsaved: false,
          executions: [],
          activeExecutionId: null,
        },
        {
          id: "tab-2",
          name: "Tab 2",
          workflowId: null,
          isUnsaved: false,
          executions: [],
          activeExecutionId: null,
        },
      ];
      renderHook(() =>
        useTabInitialization({
          tabs,
          activeTabId: "nonexistent",
          setTabs: mockSetTabs,
          setActiveTabId: mockSetActiveTabId,
          tabsRef: mockTabsRef,
          initialWorkflowId: null,
          workflowLoadKey: void 0,
          processedKeys: mockProcessedKeys,
        }),
      );
      expect(mockSetActiveTabId).toHaveBeenCalledWith("tab-1");
    });
    it("should create new tab when activeTabId does not exist and no tabs", () => {
      renderHook(() =>
        useTabInitialization({
          tabs: [],
          activeTabId: "nonexistent",
          setTabs: mockSetTabs,
          setActiveTabId: mockSetActiveTabId,
          tabsRef: mockTabsRef,
          initialWorkflowId: null,
          workflowLoadKey: void 0,
          processedKeys: mockProcessedKeys,
        }),
      );
      expect(mockSetTabs).toHaveBeenCalled();
      const setTabsCall = mockSetTabs.mock.calls[0][0];
      const newTabs = Array.isArray(setTabsCall)
        ? setTabsCall
        : setTabsCall([]);
      expect(newTabs.length).toBe(1);
      expect(newTabs[0].name).toBe("Untitled Workflow");
      expect(mockSetActiveTabId).toHaveBeenCalled();
    });
    it("should not change activeTabId when it exists in tabs", () => {
      renderHook(() =>
        useTabInitialization({
          tabs: initialTabs,
          activeTabId: "tab-1",
          setTabs: mockSetTabs,
          setActiveTabId: mockSetActiveTabId,
          tabsRef: mockTabsRef,
          initialWorkflowId: null,
          workflowLoadKey: void 0,
          processedKeys: mockProcessedKeys,
        }),
      );
      expect(mockSetActiveTabId).not.toHaveBeenCalled();
    });
    it("should not change activeTabId when it is null", () => {
      renderHook(() =>
        useTabInitialization({
          tabs: initialTabs,
          activeTabId: null,
          setTabs: mockSetTabs,
          setActiveTabId: mockSetActiveTabId,
          tabsRef: mockTabsRef,
          initialWorkflowId: null,
          workflowLoadKey: void 0,
          processedKeys: mockProcessedKeys,
        }),
      );
      expect(mockSetActiveTabId).not.toHaveBeenCalled();
    });
  });
  describe("initial workflow loading", () => {
    it("should create new tab for initial workflow", () => {
      renderHook(() =>
        useTabInitialization({
          tabs: [],
          activeTabId: null,
          setTabs: mockSetTabs,
          setActiveTabId: mockSetActiveTabId,
          tabsRef: mockTabsRef,
          initialWorkflowId: "workflow-123",
          workflowLoadKey: 1,
          processedKeys: mockProcessedKeys,
        }),
      );
      expect(mockSetTabs).toHaveBeenCalled();
      const setTabsCall = mockSetTabs.mock.calls[0][0];
      const newTabs =
        typeof setTabsCall === "function" ? setTabsCall([]) : setTabsCall;
      expect(newTabs.length).toBe(1);
      expect(newTabs[0].workflowId).toBe("workflow-123");
      expect(newTabs[0].name).toBe("Loading...");
      expect(newTabs[0].isUnsaved).toBe(false);
      expect(mockSetActiveTabId).toHaveBeenCalled();
    });
    it("should not create duplicate tab for same workflowLoadKey", () => {
      mockProcessedKeys.current.add("workflow-123-1");
      renderHook(() =>
        useTabInitialization({
          tabs: [],
          activeTabId: null,
          setTabs: mockSetTabs,
          setActiveTabId: mockSetActiveTabId,
          tabsRef: mockTabsRef,
          initialWorkflowId: "workflow-123",
          workflowLoadKey: 1,
          processedKeys: mockProcessedKeys,
        }),
      );
      expect(mockSetTabs).not.toHaveBeenCalled();
    });
    it("should create new tab for different workflowLoadKey", () => {
      mockProcessedKeys.current.add("workflow-123-1");
      renderHook(() =>
        useTabInitialization({
          tabs: [],
          activeTabId: null,
          setTabs: mockSetTabs,
          setActiveTabId: mockSetActiveTabId,
          tabsRef: mockTabsRef,
          initialWorkflowId: "workflow-123",
          workflowLoadKey: 2,
          processedKeys: mockProcessedKeys,
        }),
      );
      expect(mockSetTabs).toHaveBeenCalled();
    });
    it("appends a new tab when opening from list and that workflow is already open", () => {
      const tabsWithWf = [
        {
          id: "tab-existing",
          name: "Already open",
          workflowId: "workflow-123",
          isUnsaved: false,
          executions: [],
          activeExecutionId: null,
        },
      ];
      const ref = { current: tabsWithWf };
      mockSetTabs.mockImplementation((updater) => {
        if (typeof updater === "function") {
          const next = updater(tabsWithWf);
          ref.current = next;
          return next;
        }
        return updater;
      });
      renderHook(() =>
        useTabInitialization({
          tabs: tabsWithWf,
          activeTabId: "other-tab",
          setTabs: mockSetTabs,
          setActiveTabId: mockSetActiveTabId,
          tabsRef: ref,
          initialWorkflowId: "workflow-123",
          workflowLoadKey: 1,
          processedKeys: mockProcessedKeys,
        }),
      );
      expect(mockSetTabs).toHaveBeenCalled();
      const next = mockSetTabs.mock.calls[0][0](tabsWithWf);
      expect(next.length).toBe(2);
      expect(next.filter((t) => t.workflowId === "workflow-123").length).toBe(2);
      const appended = next.find((t) => t.id !== "tab-existing");
      expect(appended).toBeDefined();
      // Invalid activeTabId triggers validation effect first; workflow load sets active last.
      expect(mockSetActiveTabId).toHaveBeenLastCalledWith(appended.id);
    });
    it("should not open URL workflow tab when not authenticated", () => {
      renderHook(() =>
        useTabInitialization({
          tabs: [],
          activeTabId: null,
          setTabs: mockSetTabs,
          setActiveTabId: mockSetActiveTabId,
          tabsRef: mockTabsRef,
          initialWorkflowId: "workflow-123",
          workflowLoadKey: 1,
          processedKeys: mockProcessedKeys,
          isAuthenticated: false,
        }),
      );
      expect(mockSetTabs).not.toHaveBeenCalled();
      expect(mockSetActiveTabId).not.toHaveBeenCalled();
    });
    it("should not create tab when initialWorkflowId is null", () => {
      renderHook(() =>
        useTabInitialization({
          tabs: [],
          activeTabId: null,
          setTabs: mockSetTabs,
          setActiveTabId: mockSetActiveTabId,
          tabsRef: mockTabsRef,
          initialWorkflowId: null,
          workflowLoadKey: 1,
          processedKeys: mockProcessedKeys,
        }),
      );
      expect(mockSetTabs).not.toHaveBeenCalled();
    });
    it("should not create tab when workflowLoadKey is undefined", () => {
      renderHook(() =>
        useTabInitialization({
          tabs: [],
          activeTabId: null,
          setTabs: mockSetTabs,
          setActiveTabId: mockSetActiveTabId,
          tabsRef: mockTabsRef,
          initialWorkflowId: "workflow-123",
          workflowLoadKey: void 0,
          processedKeys: mockProcessedKeys,
        }),
      );
      expect(mockSetTabs).not.toHaveBeenCalled();
    });
    it("should update tabsRef when creating new tab", () => {
      renderHook(() =>
        useTabInitialization({
          tabs: [],
          activeTabId: null,
          setTabs: mockSetTabs,
          setActiveTabId: mockSetActiveTabId,
          tabsRef: mockTabsRef,
          initialWorkflowId: "workflow-123",
          workflowLoadKey: 1,
          processedKeys: mockProcessedKeys,
        }),
      );
      expect(mockTabsRef.current.length).toBeGreaterThan(0);
    });
    it("appends from list even when only matching tab is the current one", () => {
      const existingTabs = [
        {
          id: "tab-only",
          name: "Existing",
          workflowId: "workflow-123",
          isUnsaved: false,
          executions: [],
          activeExecutionId: null,
        },
      ];
      const mockSetTabsWithCheck = jest.fn((updater) => {
        if (typeof updater === "function") {
          return updater(existingTabs);
        }
        return updater;
      });
      renderHook(() =>
        useTabInitialization({
          tabs: existingTabs,
          activeTabId: null,
          setTabs: mockSetTabsWithCheck,
          setActiveTabId: mockSetActiveTabId,
          tabsRef: { current: existingTabs },
          initialWorkflowId: "workflow-123",
          workflowLoadKey: 1,
          processedKeys: mockProcessedKeys,
        }),
      );
      expect(mockSetTabsWithCheck).toHaveBeenCalled();
      const next = mockSetTabsWithCheck.mock.calls[0][0](existingTabs);
      expect(next.length).toBe(2);
      expect(mockSetActiveTabId.mock.calls[0][0]).not.toBe("tab-only");
    });
  });
});
