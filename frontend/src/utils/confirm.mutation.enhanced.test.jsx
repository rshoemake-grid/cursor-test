import { showConfirm } from "./confirm";
import { defaultAdapters } from "../types/adapters";
import { waitForWithTimeoutFakeTimers } from "../test/utils/waitForWithTimeout";
const waitForWithTimeout = waitForWithTimeoutFakeTimers;
jest.mock("../types/adapters", () => ({
  defaultAdapters: {
    createDocumentAdapter: jest.fn(),
    createTimerAdapter: jest.fn(),
  },
}));
const mockDefaultAdapters = defaultAdapters;
describe("showConfirm - Enhanced Mutation Killers", () => {
  let mockDocumentAdapter;
  let mockTimerAdapter;
  let stylesMap;
  beforeEach(() => {
    jest.useFakeTimers();
    stylesMap = new Map();
    mockDocumentAdapter = {
      createElement: jest.fn((tag) => {
        const element = {
          tagName: tag.toUpperCase(),
          style: {},
          textContent: "",
          id: "",
          onclick: null,
          onmouseover: null,
          onmouseout: null,
          remove: jest.fn(),
          focus: jest.fn(),
          children: [],
          // Initialize children array
        };
        element.appendChild = jest.fn(function (child) {
          if (!this.children) {
            this.children = [];
          }
          this.children.push(child);
          return child;
        });
        element.style.cssText = "";
        Object.defineProperty(element.style, "cssText", {
          get: () => element.style._cssText || "",
          set: (value) => {
            element.style._cssText = value;
          },
        });
        return element;
      }),
      getElementById: jest.fn((id) => {
        const fromMap = stylesMap.get(id);
        if (fromMap) {
          return fromMap;
        }
        return null;
      }),
      head: {
        appendChild: jest.fn((element) => {
          if (element.id) {
            stylesMap.set(element.id, element);
          }
        }),
      },
      body: {
        appendChild: jest.fn((element) => {
          return element;
        }),
      },
    };
    mockTimerAdapter = {
      setTimeout: jest.fn(),
      clearTimeout: jest.fn(),
    };
    mockDefaultAdapters.createDocumentAdapter.mockReturnValue(
      mockDocumentAdapter,
    );
    mockDefaultAdapters.createTimerAdapter.mockReturnValue(mockTimerAdapter);
  });
  describe("documentAdapter Falsy Check", () => {
    describe("if (!documentAdapter) condition", () => {
      it("should verify exact falsy check - documentAdapter is null", async () => {
        const result = await showConfirm("Test message", {
          documentAdapter: null,
          // Explicitly null
        });
        expect(result).toBe(false);
        expect(mockDocumentAdapter.createElement).not.toHaveBeenCalled();
      });
      it("should verify exact falsy check - documentAdapter is undefined", async () => {
        mockDefaultAdapters.createDocumentAdapter.mockReturnValueOnce(null);
        const result = await showConfirm("Test message", {
          documentAdapter: void 0,
          // Explicitly undefined - should use default
        });
        expect(result).toBe(false);
        expect(mockDocumentAdapter.createElement).not.toHaveBeenCalled();
      });
      it("should verify exact falsy check - documentAdapter is truthy", async () => {
        const promise = showConfirm("Test message", {
          documentAdapter: mockDocumentAdapter,
          // Truthy
        });
        await waitForWithTimeout(
          () => {
            expect(mockDocumentAdapter.createElement).toHaveBeenCalled();
            expect(mockDocumentAdapter.body.appendChild).toHaveBeenCalled();
          },
          { timeout: 2e3 },
        );
        const overlay = mockDocumentAdapter.body.appendChild.mock.calls[0]?.[0];
        expect(overlay).toBeDefined();
        if (overlay?.onclick) {
          overlay.onclick({ target: overlay });
        }
        const result = await promise;
        expect(result).toBe(false);
      });
    });
  });
  describe("getElementById Conditional", () => {
    describe('if (!documentAdapter.getElementById("confirm-dialog-styles")) condition', () => {
      it("should verify exact falsy check - styles element does not exist", async () => {
        mockDocumentAdapter.createElement.mockClear();
        mockDocumentAdapter.head.appendChild.mockClear();
        mockDocumentAdapter.body.appendChild.mockClear();
        mockDocumentAdapter.getElementById.mockClear();
        stylesMap.clear();
        const promise = showConfirm("Test message", {
          documentAdapter: mockDocumentAdapter,
        });
        await waitForWithTimeout(
          () => {
            expect(mockDocumentAdapter.getElementById).toHaveBeenCalledWith(
              "confirm-dialog-styles",
            );
          },
          { timeout: 2e3 },
        );
        const styleCalls = mockDocumentAdapter.createElement.mock.calls.filter(
          (call) => call[0] === "style",
        );
        expect(styleCalls.length).toBeGreaterThan(0);
        expect(mockDocumentAdapter.head.appendChild).toHaveBeenCalled();
        const overlay = mockDocumentAdapter.body.appendChild.mock.calls[0]?.[0];
        expect(overlay).toBeDefined();
        if (overlay?.onclick) {
          overlay.onclick({ target: overlay });
        }
        await promise;
      });
      it("should verify exact falsy check - styles element exists", async () => {
        mockDocumentAdapter.createElement.mockClear();
        mockDocumentAdapter.head.appendChild.mockClear();
        mockDocumentAdapter.body.appendChild.mockClear();
        mockDocumentAdapter.getElementById.mockClear();
        stylesMap.clear();
        const existingStyle = {
          tagName: "STYLE",
          id: "confirm-dialog-styles",
          textContent: "",
          style: {},
        };
        stylesMap.set("confirm-dialog-styles", existingStyle);
        expect(stylesMap.get("confirm-dialog-styles")).toBe(existingStyle);
        expect(
          mockDocumentAdapter.getElementById("confirm-dialog-styles"),
        ).toBe(existingStyle);
        const promise = showConfirm("Test message", {
          documentAdapter: mockDocumentAdapter,
        });
        await waitForWithTimeout(
          () => {
            expect(mockDocumentAdapter.getElementById).toHaveBeenCalledWith(
              "confirm-dialog-styles",
            );
          },
          { timeout: 2e3 },
        );
        const styleCallsAfterShowConfirm =
          mockDocumentAdapter.createElement.mock.calls.filter(
            (call) => call[0] === "style",
          );
        expect(styleCallsAfterShowConfirm.length).toBe(0);
        const overlay = mockDocumentAdapter.body.appendChild.mock.calls[0]?.[0];
        expect(overlay).toBeDefined();
        if (overlay?.onclick) {
          overlay.onclick({ target: overlay });
        }
        await promise;
      });
    });
  });
  describe("Event Target Equality Check", () => {
    describe("if (e.target === overlay) condition", () => {
      it("should verify exact equality - target is overlay", async () => {
        const promise = showConfirm("Test message", {
          documentAdapter: mockDocumentAdapter,
        });
        await waitForWithTimeout(
          () => {
            const appendCalls2 =
              mockDocumentAdapter.body.appendChild.mock.calls;
            expect(appendCalls2.length).toBeGreaterThan(0);
          },
          { timeout: 2e3 },
        );
        const appendCalls = mockDocumentAdapter.body.appendChild.mock.calls;
        const overlay = appendCalls[appendCalls.length - 1]?.[0];
        expect(overlay).toBeDefined();
        expect(overlay.tagName).toBe("DIV");
        if (overlay?.onclick) {
          overlay.onclick({ target: overlay });
        }
        const result = await promise;
        expect(result).toBe(false);
        expect(overlay.remove).toHaveBeenCalled();
      });
      it("should verify exact equality - target is not overlay", async () => {
        mockDocumentAdapter.body.appendChild.mockClear();
        const promise = showConfirm("Test message", {
          documentAdapter: mockDocumentAdapter,
        });
        await waitForWithTimeout(
          () => {
            const overlay2 =
              mockDocumentAdapter.body.appendChild.mock.calls[0]?.[0];
            expect(overlay2).toBeDefined();
            const dialogCall2 = overlay2.appendChild.mock.calls.find(
              (call) => call[0]?.tagName === "DIV" && call[0] !== overlay2,
            );
            const dialog2 = dialogCall2?.[0];
            expect(dialog2).toBeDefined();
          },
          { timeout: 2e3 },
        );
        const overlay = mockDocumentAdapter.body.appendChild.mock.calls[0]?.[0];
        const dialogCall = overlay.appendChild.mock.calls.find(
          (call) => call[0]?.tagName === "DIV" && call[0] !== overlay,
        );
        const dialog = dialogCall?.[0];
        if (overlay?.onclick) {
          overlay.onclick({ target: dialog });
        }
        await waitForWithTimeout(() => {}, { timeout: 100 });
        if (overlay?.onclick) {
          overlay.onclick({ target: overlay });
        }
        const result = await promise;
        expect(result).toBe(false);
      });
      it("should verify exact equality - target is null", async () => {
        mockDocumentAdapter.body.appendChild.mockClear();
        const promise = showConfirm("Test message", {
          documentAdapter: mockDocumentAdapter,
        });
        await waitForWithTimeout(
          () => {
            const overlay2 =
              mockDocumentAdapter.body.appendChild.mock.calls[0]?.[0];
            expect(overlay2).toBeDefined();
          },
          { timeout: 2e3 },
        );
        const overlay = mockDocumentAdapter.body.appendChild.mock.calls[0]?.[0];
        if (overlay?.onclick) {
          overlay.onclick({ target: null });
        }
        await waitForWithTimeout(() => {}, { timeout: 100 });
        if (overlay?.onclick) {
          overlay.onclick({ target: overlay });
        }
        const result = await promise;
        expect(result).toBe(false);
      });
    });
  });
  describe("Button Click Handlers", () => {
    it("should resolve true when confirm button clicked", async () => {
      mockDocumentAdapter.body.appendChild.mockClear();
      const promise = showConfirm("Test message", {
        documentAdapter: mockDocumentAdapter,
      });
      await waitForWithTimeout(
        () => {
          const overlay2 =
            mockDocumentAdapter.body.appendChild.mock.calls[0]?.[0];
          expect(overlay2).toBeDefined();
        },
        { timeout: 2e3 },
      );
      const overlay = mockDocumentAdapter.body.appendChild.mock.calls[0]?.[0];
      const dialogCall = overlay.appendChild.mock.calls.find(
        (call) => call[0]?.tagName === "DIV" && call[0] !== overlay,
      );
      const dialog = dialogCall?.[0];
      expect(dialog).toBeDefined();
      const buttonsContainerCall = dialog.appendChild.mock.calls.find(
        (call) => call[0]?.tagName === "DIV",
      );
      const buttonsContainer = buttonsContainerCall?.[0];
      expect(buttonsContainer).toBeDefined();
      const buttonCalls = buttonsContainer.appendChild.mock.calls;
      const confirmBtn = buttonCalls[buttonCalls.length - 1]?.[0];
      expect(confirmBtn).toBeDefined();
      expect(confirmBtn.tagName).toBe("BUTTON");
      if (confirmBtn?.onclick) {
        confirmBtn.onclick();
      }
      const result = await promise;
      expect(result).toBe(true);
      expect(overlay.remove).toHaveBeenCalled();
    });
    it("should resolve false when cancel button clicked", async () => {
      mockDocumentAdapter.body.appendChild.mockClear();
      const promise = showConfirm("Test message", {
        documentAdapter: mockDocumentAdapter,
      });
      await waitForWithTimeout(
        () => {
          const overlay2 =
            mockDocumentAdapter.body.appendChild.mock.calls[0]?.[0];
          expect(overlay2).toBeDefined();
        },
        { timeout: 2e3 },
      );
      const overlay = mockDocumentAdapter.body.appendChild.mock.calls[0]?.[0];
      const dialogCall = overlay.appendChild.mock.calls.find(
        (call) => call[0]?.tagName === "DIV" && call[0] !== overlay,
      );
      const dialog = dialogCall?.[0];
      expect(dialog).toBeDefined();
      const buttonsContainerCall = dialog.appendChild.mock.calls.find(
        (call) => call[0]?.tagName === "DIV",
      );
      const buttonsContainer = buttonsContainerCall?.[0];
      expect(buttonsContainer).toBeDefined();
      const cancelBtn = buttonsContainer.appendChild.mock.calls[0]?.[0];
      expect(cancelBtn).toBeDefined();
      expect(cancelBtn.tagName).toBe("BUTTON");
      if (cancelBtn?.onclick) {
        cancelBtn.onclick();
      }
      const result = await promise;
      expect(result).toBe(false);
      expect(overlay.remove).toHaveBeenCalled();
    });
  });
  describe("Error Handling", () => {
    it("should handle errors gracefully", async () => {
      mockDocumentAdapter.createElement.mockImplementation(() => {
        throw new Error("DOM error");
      });
      const result = await showConfirm("Test message", {
        documentAdapter: mockDocumentAdapter,
      });
      expect(result).toBe(false);
    });
  });
  describe("Default Options", () => {
    it("should use default title when not provided", async () => {
      mockDocumentAdapter.body.appendChild.mockClear();
      const promise = showConfirm("Test message", {
        documentAdapter: mockDocumentAdapter,
      });
      await waitForWithTimeout(
        () => {
          const overlay2 =
            mockDocumentAdapter.body.appendChild.mock.calls[0]?.[0];
          expect(overlay2).toBeDefined();
          const dialogCall2 = overlay2.appendChild.mock.calls.find(
            (call) => call[0]?.tagName === "DIV" && call[0] !== overlay2,
          );
          const dialog2 = dialogCall2?.[0];
          expect(dialog2).toBeDefined();
          const titleEl2 = dialog2.appendChild.mock.calls.find(
            (call) => call[0]?.tagName === "H3",
          );
          expect(titleEl2).toBeDefined();
        },
        { timeout: 2e3 },
      );
      const overlay = mockDocumentAdapter.body.appendChild.mock.calls[0]?.[0];
      const dialogCall = overlay.appendChild.mock.calls.find(
        (call) => call[0]?.tagName === "DIV" && call[0] !== overlay,
      );
      const dialog = dialogCall?.[0];
      const titleEl = dialog.appendChild.mock.calls.find(
        (call) => call[0]?.tagName === "H3",
      )?.[0];
      expect(titleEl).toBeDefined();
      expect(titleEl.textContent).toBe("Confirm");
      if (overlay?.onclick) {
        overlay.onclick({ target: overlay });
      }
      await promise;
    });
    it("should use default confirmText when not provided", async () => {
      mockDocumentAdapter.body.appendChild.mockClear();
      const promise = showConfirm("Test message", {
        documentAdapter: mockDocumentAdapter,
      });
      await waitForWithTimeout(
        () => {
          const overlay2 =
            mockDocumentAdapter.body.appendChild.mock.calls[0]?.[0];
          expect(overlay2).toBeDefined();
          const dialog2 = overlay2?.appendChild?.mock?.calls?.[0]?.[0];
          expect(dialog2).toBeDefined();
          const buttonsContainer2 = dialog2?.appendChild?.mock?.calls?.find(
            (call) => call[0]?.tagName === "DIV",
          )?.[0];
          expect(buttonsContainer2).toBeDefined();
          const confirmBtn2 =
            buttonsContainer2?.appendChild?.mock?.calls?.slice(-1)?.[0]?.[0];
          expect(confirmBtn2).toBeDefined();
        },
        { timeout: 2e3 },
      );
      const overlay = mockDocumentAdapter.body.appendChild.mock.calls[0]?.[0];
      const dialog = overlay?.appendChild?.mock?.calls?.[0]?.[0];
      const buttonsContainer = dialog?.appendChild?.mock?.calls?.find(
        (call) => call[0]?.tagName === "DIV",
      )?.[0];
      const confirmBtn =
        buttonsContainer?.appendChild?.mock?.calls?.slice(-1)?.[0]?.[0];
      expect(confirmBtn?.textContent).toBe("Confirm");
      if (overlay?.onclick) {
        overlay.onclick({ target: overlay });
      }
      await promise;
    });
  });
  afterEach(() => {
    if (jest.isMockFunction(setTimeout)) {
      try {
        let iterations = 0;
        const maxIterations = 10;
        while (jest.getTimerCount() > 0 && iterations < maxIterations) {
          jest.runOnlyPendingTimers();
          iterations++;
        }
        jest.clearAllTimers();
      } catch (e) {
        jest.clearAllTimers();
      }
    }
    jest.useRealTimers();
  });
});
