import { renderHook, act } from "@testing-library/react";
import {
  useLocalStorage,
  getLocalStorageItem,
  setLocalStorageItem,
  removeLocalStorageItem,
} from "./useLocalStorage";
import { defaultAdapters } from "../../types/adapters";
jest.mock("../../utils/logger", () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));
jest.mock("../../types/adapters", () => ({
  defaultAdapters: {
    createLocalStorageAdapter: jest.fn(),
  },
}));
describe("useLocalStorage - Remaining Branches", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    defaultAdapters.createLocalStorageAdapter.mockReturnValue(null);
  });
  describe("useLocalStorage hook - storage null branches", () => {
    it("should return initialValue when storage is null in useState initializer", () => {
      defaultAdapters.createLocalStorageAdapter.mockReturnValue(null);
      const { result } = renderHook(() =>
        useLocalStorage("test-key", "initial-value"),
      );
      expect(result.current[0]).toBe("initial-value");
    });
    it("should not call storage.getItem when storage is null", () => {
      const mockStorage = {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      };
      defaultAdapters.createLocalStorageAdapter.mockReturnValue(null);
      const { result } = renderHook(() =>
        useLocalStorage("test-key", "initial-value"),
      );
      expect(mockStorage.getItem).not.toHaveBeenCalled();
      expect(result.current[0]).toBe("initial-value");
    });
    it("should not set up storage listener when storage is null", () => {
      const mockStorage = {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      };
      defaultAdapters.createLocalStorageAdapter.mockReturnValue(null);
      renderHook(() => useLocalStorage("test-key", "initial-value"));
      expect(mockStorage.addEventListener).not.toHaveBeenCalled();
    });
    it("should not call storage.setItem when storage is null in setValue", () => {
      const mockStorage = {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      };
      defaultAdapters.createLocalStorageAdapter.mockReturnValue(null);
      const { result } = renderHook(() =>
        useLocalStorage("test-key", "initial-value"),
      );
      act(() => {
        result.current[1]("new-value");
      });
      expect(result.current[0]).toBe("new-value");
      expect(mockStorage.setItem).not.toHaveBeenCalled();
    });
    it("should not call storage.removeItem when storage is null in removeValue", () => {
      const mockStorage = {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      };
      defaultAdapters.createLocalStorageAdapter.mockReturnValue(null);
      const { result } = renderHook(() =>
        useLocalStorage("test-key", "initial-value"),
      );
      act(() => {
        result.current[2]();
      });
      expect(result.current[0]).toBe("initial-value");
      expect(mockStorage.removeItem).not.toHaveBeenCalled();
    });
  });
  describe("getLocalStorageItem - storage null branches", () => {
    it("should return defaultValue when storage is null", () => {
      const result = getLocalStorageItem("test-key", "default-value", {
        storage: null,
      });
      expect(result).toBe("default-value");
    });
    it("should not call storage.getItem when storage is null", () => {
      const mockStorage = {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      };
      getLocalStorageItem("test-key", "default-value", { storage: null });
      expect(mockStorage.getItem).not.toHaveBeenCalled();
    });
  });
  describe("setLocalStorageItem - storage null branches", () => {
    it("should return false when storage is null", () => {
      defaultAdapters.createLocalStorageAdapter.mockReturnValue(null);
      const result = setLocalStorageItem("test-key", "value");
      expect(result).toBe(false);
    });
    it("should not call storage.setItem when storage is null", () => {
      const mockStorage = {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      };
      defaultAdapters.createLocalStorageAdapter.mockReturnValue(null);
      setLocalStorageItem("test-key", "value");
      expect(mockStorage.setItem).not.toHaveBeenCalled();
    });
  });
  describe("removeLocalStorageItem - storage null branches", () => {
    it("should return false when storage is null", () => {
      defaultAdapters.createLocalStorageAdapter.mockReturnValue(null);
      const result = removeLocalStorageItem("test-key");
      expect(result).toBe(false);
    });
    it("should not call storage.removeItem when storage is null", () => {
      const mockStorage = {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      };
      defaultAdapters.createLocalStorageAdapter.mockReturnValue(null);
      removeLocalStorageItem("test-key");
      expect(mockStorage.removeItem).not.toHaveBeenCalled();
    });
  });
});
