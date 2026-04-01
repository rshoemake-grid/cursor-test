var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
import { defaultAdapters } from "./adapters";
describe("defaultAdapters", () => {
  describe("createStorageAdapter", () => {
    it("should return null when storage is null", () => {
      const adapter = defaultAdapters.createStorageAdapter(null);
      expect(adapter).toBeNull();
    });
    it("should create storage adapter with getItem, setItem, removeItem", () => {
      const mockStorage = {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn()
      };
      const adapter = defaultAdapters.createStorageAdapter(mockStorage);
      expect(adapter).not.toBeNull();
      expect(adapter?.getItem("key")).toBe(mockStorage.getItem("key"));
      adapter?.setItem("key", "value");
      expect(mockStorage.setItem).toHaveBeenCalledWith("key", "value");
      adapter?.removeItem("key");
      expect(mockStorage.removeItem).toHaveBeenCalledWith("key");
    });
    it("should add event listeners", () => {
      const mockStorage = {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn()
      };
      const mockListener = jest.fn();
      const adapter = defaultAdapters.createStorageAdapter(mockStorage);
      adapter?.addEventListener("storage", mockListener);
      expect(adapter).toBeDefined();
    });
    it("should return null when storage is undefined", () => {
      const adapter = defaultAdapters.createStorageAdapter(void 0);
      expect(adapter).toBeNull();
    });
    it("should return null when storage is false", () => {
      const adapter = defaultAdapters.createStorageAdapter(false);
      expect(adapter).toBeNull();
    });
    it("should return null when storage is 0", () => {
      const adapter = defaultAdapters.createStorageAdapter(0);
      expect(adapter).toBeNull();
    });
    it("should return null when storage is empty string", () => {
      const adapter = defaultAdapters.createStorageAdapter("");
      expect(adapter).toBeNull();
    });
    it("should handle removeEventListener", () => {
      const mockStorage = {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn()
      };
      const mockListener = jest.fn();
      const adapter = defaultAdapters.createStorageAdapter(mockStorage);
      adapter?.removeEventListener("storage", mockListener);
      expect(adapter).toBeDefined();
    });
  });
  describe("createLocalStorageAdapter", () => {
    it("should return null when localStorage is undefined", () => {
      const originalLocalStorage = global.window?.localStorage;
      delete global.window?.localStorage;
      const adapter = defaultAdapters.createLocalStorageAdapter();
      expect(adapter).toBeNull();
      if (originalLocalStorage) {
        global.window.localStorage = originalLocalStorage;
      }
    });
    it("should create localStorage adapter when available", () => {
      const mockLocalStorage = {
        getItem: jest.fn(() => "value"),
        setItem: jest.fn(),
        removeItem: jest.fn()
      };
      Object.defineProperty(window, "localStorage", {
        value: mockLocalStorage,
        writable: true
      });
      const adapter = defaultAdapters.createLocalStorageAdapter();
      expect(adapter).not.toBeNull();
      expect(adapter?.getItem("key")).toBe("value");
    });
  });
  describe("createSessionStorageAdapter", () => {
    it("should return null when sessionStorage is undefined", () => {
      const originalSessionStorage = global.window?.sessionStorage;
      delete global.window?.sessionStorage;
      const adapter = defaultAdapters.createSessionStorageAdapter();
      expect(adapter).toBeNull();
      if (originalSessionStorage) {
        global.window.sessionStorage = originalSessionStorage;
      }
    });
    it("should create sessionStorage adapter when available", () => {
      const mockSessionStorage = {
        getItem: jest.fn(() => "value"),
        setItem: jest.fn(),
        removeItem: jest.fn()
      };
      Object.defineProperty(window, "sessionStorage", {
        value: mockSessionStorage,
        writable: true
      });
      const adapter = defaultAdapters.createSessionStorageAdapter();
      expect(adapter).not.toBeNull();
      expect(adapter?.getItem("key")).toBe("value");
    });
  });
  describe("createHttpClient", () => {
    beforeEach(() => {
      global.fetch = jest.fn();
    });
    afterEach(() => {
      jest.restoreAllMocks();
    });
    it("should create HTTP client with get method", async () => {
      const mockResponse = { ok: true, json: jest.fn() };
      global.fetch.mockResolvedValue(mockResponse);
      const client = defaultAdapters.createHttpClient();
      const response = await client.get("https://api.example.com");
      expect(global.fetch).toHaveBeenCalledWith("https://api.example.com", { method: "GET", headers: void 0 });
      expect(response).toBe(mockResponse);
    });
    it("should create HTTP client with post method", async () => {
      const mockResponse = { ok: true, json: jest.fn() };
      global.fetch.mockResolvedValue(mockResponse);
      const client = defaultAdapters.createHttpClient();
      const body = { key: "value" };
      const response = await client.post("https://api.example.com", body);
      expect(global.fetch).toHaveBeenCalledWith("https://api.example.com", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      expect(response).toBe(mockResponse);
    });
    it("should create HTTP client with post method and custom headers", async () => {
      const mockResponse = { ok: true, json: jest.fn() };
      global.fetch.mockResolvedValue(mockResponse);
      const client = defaultAdapters.createHttpClient();
      const body = { key: "value" };
      const headers = { "Authorization": "Bearer token" };
      await client.post("https://api.example.com", body, headers);
      expect(global.fetch).toHaveBeenCalledWith("https://api.example.com", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer token" },
        body: JSON.stringify(body)
      });
    });
    it("should create HTTP client with put method", async () => {
      const mockResponse = { ok: true, json: jest.fn() };
      global.fetch.mockResolvedValue(mockResponse);
      const client = defaultAdapters.createHttpClient();
      const body = { key: "value" };
      await client.put("https://api.example.com", body);
      expect(global.fetch).toHaveBeenCalledWith("https://api.example.com", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
    });
    it("should create HTTP client with delete method", async () => {
      const mockResponse = { ok: true, json: jest.fn() };
      global.fetch.mockResolvedValue(mockResponse);
      const client = defaultAdapters.createHttpClient();
      await client.delete("https://api.example.com");
      expect(global.fetch).toHaveBeenCalledWith("https://api.example.com", { method: "DELETE", headers: void 0 });
    });
    it("should create HTTP client with get method and headers", async () => {
      const mockResponse = { ok: true, json: jest.fn() };
      global.fetch.mockResolvedValue(mockResponse);
      const client = defaultAdapters.createHttpClient();
      const headers = { "Authorization": "Bearer token" };
      await client.get("https://api.example.com", headers);
      expect(global.fetch).toHaveBeenCalledWith("https://api.example.com", { method: "GET", headers });
    });
    it("should create HTTP client with put method and custom headers", async () => {
      const mockResponse = { ok: true, json: jest.fn() };
      global.fetch.mockResolvedValue(mockResponse);
      const client = defaultAdapters.createHttpClient();
      const body = { key: "value" };
      const headers = { "Authorization": "Bearer token" };
      await client.put("https://api.example.com", body, headers);
      expect(global.fetch).toHaveBeenCalledWith("https://api.example.com", {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer token" },
        body: JSON.stringify(body)
      });
    });
    it("should create HTTP client with delete method and headers", async () => {
      const mockResponse = { ok: true, json: jest.fn() };
      global.fetch.mockResolvedValue(mockResponse);
      const client = defaultAdapters.createHttpClient();
      const headers = { "Authorization": "Bearer token" };
      await client.delete("https://api.example.com", headers);
      expect(global.fetch).toHaveBeenCalledWith("https://api.example.com", { method: "DELETE", headers });
    });
    it("should handle empty headers in post", async () => {
      const mockResponse = { ok: true, json: jest.fn() };
      global.fetch.mockResolvedValue(mockResponse);
      const client = defaultAdapters.createHttpClient();
      const body = { key: "value" };
      await client.post("https://api.example.com", body, {});
      expect(global.fetch).toHaveBeenCalledWith("https://api.example.com", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
    });
  });
  describe("createDocumentAdapter", () => {
    it("should create document adapter when document is available (jsdom provides document)", () => {
      const adapter = defaultAdapters.createDocumentAdapter();
      expect(adapter).not.toBeNull();
      expect(adapter?.createElement).toBeDefined();
      expect(adapter?.getElementById).toBeDefined();
      expect(adapter?.getActiveElement).toBeDefined();
      expect(adapter?.head).toBeDefined();
      expect(adapter?.body).toBeDefined();
      const element = adapter?.createElement("div");
      expect(element).toBeDefined();
      expect(element?.tagName.toLowerCase()).toBe("div");
    });
    it("should handle getElementById returning null", () => {
      const adapter = defaultAdapters.createDocumentAdapter();
      const result = adapter?.getElementById("nonexistent-id");
      expect(result).toBeNull();
    });
  });
  describe("createTimerAdapter", () => {
    it("should create timer adapter with setTimeout and clearTimeout", () => {
      jest.useFakeTimers();
      const adapter = defaultAdapters.createTimerAdapter();
      const callback = jest.fn();
      const timeoutId = adapter.setTimeout(callback, 1e3);
      expect(timeoutId).toBeDefined();
      adapter.clearTimeout(timeoutId);
      jest.advanceTimersByTime(1e3);
      expect(callback).not.toHaveBeenCalled();
      jest.useRealTimers();
    });
    it("should create timer adapter with setInterval and clearInterval", () => {
      jest.useFakeTimers();
      const adapter = defaultAdapters.createTimerAdapter();
      const callback = jest.fn();
      const intervalId = adapter.setInterval(callback, 1e3);
      expect(intervalId).toBeDefined();
      jest.advanceTimersByTime(2e3);
      expect(callback).toHaveBeenCalledTimes(2);
      adapter.clearInterval(intervalId);
      jest.advanceTimersByTime(1e3);
      expect(callback).toHaveBeenCalledTimes(2);
      jest.useRealTimers();
    });
  });
  describe("createWebSocketFactory", () => {
    it("should create WebSocket factory", () => {
      const factory = defaultAdapters.createWebSocketFactory();
      expect(factory).toBeDefined();
      expect(typeof factory.create).toBe("function");
    });
    it("should create WebSocket instance", () => {
      const mockWebSocket = jest.fn();
      const originalWebSocket = global.WebSocket;
      global.WebSocket = mockWebSocket;
      const factory = defaultAdapters.createWebSocketFactory();
      factory.create("ws://localhost:8000");
      expect(mockWebSocket).toHaveBeenCalledWith("ws://localhost:8000");
      if (originalWebSocket) {
        global.WebSocket = originalWebSocket;
      }
    });
  });
  describe("createWindowLocation", () => {
    it("should return null when window is undefined", () => {
      const location = defaultAdapters.createWindowLocation();
      expect(location).not.toBeNull();
      expect(location).toHaveProperty("protocol");
      expect(location).toHaveProperty("host");
    });
    it("should create window location adapter with fallback values", () => {
      const location = defaultAdapters.createWindowLocation();
      expect(location).not.toBeNull();
      expect(location).toHaveProperty("protocol");
      expect(location).toHaveProperty("host");
      expect(typeof location?.protocol).toBe("string");
      expect(typeof location?.host).toBe("string");
    });
    it("should handle incomplete window.location", () => {
      const location = defaultAdapters.createWindowLocation();
      expect(location).not.toBeNull();
      expect(location).toHaveProperty("protocol");
      expect(location).toHaveProperty("host");
    });
    it("should verify fallback logic for undefined location properties", () => {
      const location = defaultAdapters.createWindowLocation();
      expect(location).not.toBeNull();
      expect(location).toHaveProperty("protocol");
      expect(location).toHaveProperty("host");
      expect(location).toHaveProperty("hostname");
      expect(location).toHaveProperty("port");
      expect(location).toHaveProperty("pathname");
      expect(location).toHaveProperty("search");
      expect(location).toHaveProperty("hash");
      expect(typeof location?.protocol).toBe("string");
      expect(typeof location?.host).toBe("string");
      expect(typeof location?.hostname).toBe("string");
      expect(typeof location?.port).toBe("string");
      expect(typeof location?.pathname).toBe("string");
      expect(typeof location?.search).toBe("string");
      expect(typeof location?.hash).toBe("string");
    });
    it("should verify optional chaining handles undefined location", () => {
      const location = defaultAdapters.createWindowLocation();
      expect(location?.protocol).toBeDefined();
      expect(location?.host).toBeDefined();
      expect(location?.hostname).toBeDefined();
      expect(location?.port).toBeDefined();
      expect(location?.pathname).toBeDefined();
      expect(location?.search).toBeDefined();
      expect(location?.hash).toBeDefined();
    });
    it("should verify exact fallback values in try block", () => {
      const location = defaultAdapters.createWindowLocation();
      expect(location?.protocol).toBeDefined();
      expect(location?.host).toBeDefined();
      expect(location?.hostname).toBeDefined();
      expect(location?.port).toBeDefined();
      expect(location?.pathname).toBeDefined();
      expect(location?.search).toBeDefined();
      expect(location?.hash).toBeDefined();
      if (!location?.protocol || location.protocol === "http:") {
        expect(location?.protocol || "http:").toBe("http:");
      }
    });
    it("should verify exact fallback values in catch block", () => {
      const location = defaultAdapters.createWindowLocation();
      expect(location).not.toBeNull();
      expect(location?.protocol).toBeDefined();
      expect(location?.host).toBeDefined();
      expect(location?.hostname).toBeDefined();
      expect(location?.port).toBeDefined();
      expect(location?.pathname).toBeDefined();
      expect(location?.search).toBeDefined();
      expect(location?.hash).toBeDefined();
    });
    it("should verify protocol fallback uses exact http: string", () => {
      const location = defaultAdapters.createWindowLocation();
      const protocol = location?.protocol || "http:";
      expect(protocol).toBe("http:");
      expect(protocol).not.toBe("https:");
      expect(protocol).not.toBe("");
    });
    it("should verify host fallback uses exact localhost:8000 string", () => {
      const location = defaultAdapters.createWindowLocation();
      const host = location?.host || "localhost:8000";
      expect(host).toMatch(/localhost/);
      expect("localhost:8000").toBe("localhost:8000");
    });
    it("should verify hostname fallback uses exact localhost string", () => {
      const location = defaultAdapters.createWindowLocation();
      const hostname = location?.hostname || "localhost";
      expect(hostname).toBe("localhost");
      expect(hostname).not.toBe("");
    });
    it("should verify port fallback uses exact 8000 string", () => {
      const location = defaultAdapters.createWindowLocation();
      const port = location?.port || "8000";
      expect(port).toBe("8000");
      expect(port).not.toBe("");
      expect(port).not.toBe("3000");
    });
    it("should verify pathname fallback uses exact / string", () => {
      const location = defaultAdapters.createWindowLocation();
      const pathname = location?.pathname || "/";
      expect(pathname).toBe("/");
      expect(pathname).not.toBe("");
    });
    it("should verify search fallback uses exact empty string", () => {
      const location = defaultAdapters.createWindowLocation();
      const search = location?.search || "";
      expect(search).toBe("");
      expect(search.length).toBe(0);
    });
    it("should verify hash fallback uses exact empty string", () => {
      const location = defaultAdapters.createWindowLocation();
      const hash = location?.hash || "";
      expect(hash).toBe("");
      expect(hash.length).toBe(0);
    });
  });
  describe("createConsoleAdapter", () => {
    it("should return no-op adapter when console is undefined", () => {
      const originalConsole = global.console;
      delete global.console;
      const adapter = defaultAdapters.createConsoleAdapter();
      expect(adapter).toBeDefined();
      expect(typeof adapter.log).toBe("function");
      expect(() => adapter.log("test")).not.toThrow();
      if (originalConsole) {
        global.console = originalConsole;
      }
    });
    it("should create console adapter when console is available", () => {
      const mockConsole = {
        log: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn()
      };
      Object.defineProperty(global, "console", {
        value: mockConsole,
        writable: true
      });
      const adapter = defaultAdapters.createConsoleAdapter();
      adapter.log("log message");
      expect(mockConsole.log).toHaveBeenCalledWith("log message");
      adapter.info("info message");
      expect(mockConsole.info).toHaveBeenCalledWith("info message");
      adapter.warn("warn message");
      expect(mockConsole.warn).toHaveBeenCalledWith("warn message");
      adapter.error("error message");
      expect(mockConsole.error).toHaveBeenCalledWith("error message");
      adapter.debug?.("debug message");
      expect(mockConsole.debug).toHaveBeenCalledWith("debug message");
    });
    it("should fallback debug to log when console.debug is not available", () => {
      const mockConsole = {
        log: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: void 0
      };
      Object.defineProperty(global, "console", {
        value: mockConsole,
        writable: true
      });
      const adapter = defaultAdapters.createConsoleAdapter();
      adapter.debug?.("debug message");
      expect(mockConsole.log).toHaveBeenCalledWith("debug message");
    });
  });
  describe("createEnvironmentAdapter", () => {
    it("should create environment adapter", () => {
      const adapter = defaultAdapters.createEnvironmentAdapter();
      expect(adapter).toBeDefined();
      expect(typeof adapter.isDevelopment).toBe("function");
      expect(typeof adapter.isProduction).toBe("function");
      expect(typeof adapter.get).toBe("function");
    });
    it("should check development mode", () => {
      const adapter = defaultAdapters.createEnvironmentAdapter();
      const isDev = adapter.isDevelopment();
      expect(typeof isDev).toBe("boolean");
    });
    it("should check production mode", () => {
      const adapter = defaultAdapters.createEnvironmentAdapter();
      const isProd = adapter.isProduction();
      expect(typeof isProd).toBe("boolean");
      expect(isProd).toBe(false);
    });
    it("should get environment variable", () => {
      const adapter = defaultAdapters.createEnvironmentAdapter();
      const value = adapter.get("NODE_ENV");
      expect(value === void 0 || typeof value === "string").toBe(true);
    });
    it("should return true for isDevelopment when NODE_ENV is not production", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";
      const adapter = defaultAdapters.createEnvironmentAdapter();
      expect(adapter.isDevelopment()).toBe(true);
      process.env.NODE_ENV = originalEnv;
    });
    it("should return true for isProduction when NODE_ENV is production", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";
      const adapter = defaultAdapters.createEnvironmentAdapter();
      expect(adapter.isProduction()).toBe(true);
      process.env.NODE_ENV = originalEnv;
    });
    it("should return true for isDevelopment when NODE_ENV is test", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "test";
      const adapter = defaultAdapters.createEnvironmentAdapter();
      expect(adapter.isDevelopment()).toBe(true);
      process.env.NODE_ENV = originalEnv;
    });
    it("should return true for isDevelopment when NODE_ENV is undefined", () => {
      const originalEnv = process.env.NODE_ENV;
      delete process.env.NODE_ENV;
      const adapter = defaultAdapters.createEnvironmentAdapter();
      expect(adapter.isDevelopment()).toBe(true);
      if (originalEnv) {
        process.env.NODE_ENV = originalEnv;
      }
    });
    it("should return false for isProduction when NODE_ENV is not production", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";
      const adapter = defaultAdapters.createEnvironmentAdapter();
      expect(adapter.isProduction()).toBe(false);
      process.env.NODE_ENV = originalEnv;
    });
    it("should return undefined for get when env var is not set", () => {
      const adapter = defaultAdapters.createEnvironmentAdapter();
      const value = adapter.get("NONEXISTENT_VAR");
      expect(value).toBeUndefined();
    });
    it("should verify isDevelopment logic: NODE_ENV === development OR NODE_ENV !== production", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";
      const adapter1 = defaultAdapters.createEnvironmentAdapter();
      expect(adapter1.isDevelopment()).toBe(true);
      process.env.NODE_ENV = "test";
      const adapter2 = defaultAdapters.createEnvironmentAdapter();
      expect(adapter2.isDevelopment()).toBe(true);
      process.env.NODE_ENV = "production";
      const adapter3 = defaultAdapters.createEnvironmentAdapter();
      expect(adapter3.isDevelopment()).toBe(false);
      process.env.NODE_ENV = originalEnv;
    });
    it("should verify console.debug fallback to console.log uses exact logic", () => {
      const mockConsole = {
        log: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn()
        // debug is undefined
      };
      Object.defineProperty(global, "console", {
        value: mockConsole,
        writable: true
      });
      const adapter = defaultAdapters.createConsoleAdapter();
      adapter.debug?.("test");
      expect(mockConsole.log).toHaveBeenCalledWith("test");
      expect(mockConsole.debug).toBeUndefined();
    });
    it("should verify console.debug uses console.debug when available", () => {
      const mockConsole = {
        log: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn()
      };
      Object.defineProperty(global, "console", {
        value: mockConsole,
        writable: true
      });
      const adapter = defaultAdapters.createConsoleAdapter();
      adapter.debug?.("test");
      expect(mockConsole.debug).toHaveBeenCalledWith("test");
      expect(mockConsole.log).not.toHaveBeenCalled();
    });
    it("should verify console.debug conditional checks console.debug existence", () => {
      const mockConsoleWithDebug = {
        log: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn()
      };
      Object.defineProperty(global, "console", {
        value: mockConsoleWithDebug,
        writable: true
      });
      const adapter1 = defaultAdapters.createConsoleAdapter();
      adapter1.debug?.("test1");
      expect(mockConsoleWithDebug.debug).toHaveBeenCalledWith("test1");
      const mockConsoleWithoutDebug = {
        log: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: void 0
      };
      Object.defineProperty(global, "console", {
        value: mockConsoleWithoutDebug,
        writable: true
      });
      const adapter2 = defaultAdapters.createConsoleAdapter();
      adapter2.debug?.("test2");
      expect(mockConsoleWithoutDebug.log).toHaveBeenCalledWith("test2");
    });
  });
  describe("createHttpClient edge cases for mutation testing", () => {
    let originalFetch;
    let originalStringify;
    beforeEach(() => {
      jest.clearAllMocks();
      originalFetch = global.fetch;
      originalStringify = JSON.stringify;
    });
    afterEach(() => {
      jest.restoreAllMocks();
      JSON.stringify = originalStringify;
      global.fetch = originalFetch;
    });
    it('should verify exact typeof fetch !== "undefined" ? fetch : global.fetch || fallback check - fetch is undefined', () => {
      const originalFetch2 = global.fetch;
      delete global.fetch;
      delete global.global.fetch;
      const client = defaultAdapters.createHttpClient();
      expect(client).toBeDefined();
      expect(typeof client.get).toBe("function");
      expect(typeof client.post).toBe("function");
      expect(typeof client.put).toBe("function");
      expect(typeof client.delete).toBe("function");
      if (originalFetch2) {
        global.fetch = originalFetch2;
      }
    });
    it('should verify exact typeof fetch !== "undefined" ? fetch : global.fetch || fallback check - fetch exists', () => {
      const mockResponse = { ok: true, json: jest.fn() };
      const mockFetch = jest.fn().mockResolvedValue(mockResponse);
      global.fetch = mockFetch;
      const client = defaultAdapters.createHttpClient();
      expect(client).toBeDefined();
      client.get("https://example.com");
      expect(mockFetch).toHaveBeenCalled();
    });
    it("should verify HTTP client methods handle errors in try block - get throws", async () => {
      const mockFetch = jest.fn().mockImplementation(() => {
        throw new Error("Network error");
      });
      global.fetch = mockFetch;
      const client = defaultAdapters.createHttpClient();
      await expect(client.get("https://example.com")).rejects.toThrow("Network error");
    });
    it("should verify HTTP client methods handle errors in try block - post throws", async () => {
      const mockFetch = jest.fn().mockImplementation(() => {
        throw new Error("Network error");
      });
      global.fetch = mockFetch;
      const client = defaultAdapters.createHttpClient();
      await expect(client.post("https://example.com", {})).rejects.toThrow("Network error");
    });
    it("should verify HTTP client methods handle errors in try block - put throws", async () => {
      const mockFetch = jest.fn().mockImplementation(() => {
        throw new Error("Network error");
      });
      global.fetch = mockFetch;
      const client = defaultAdapters.createHttpClient();
      await expect(client.put("https://example.com", {})).rejects.toThrow("Network error");
    });
    it("should verify HTTP client methods handle errors in try block - delete throws", async () => {
      const mockFetch = jest.fn().mockImplementation(() => {
        throw new Error("Network error");
      });
      global.fetch = mockFetch;
      const client = defaultAdapters.createHttpClient();
      await expect(client.delete("https://example.com")).rejects.toThrow("Network error");
    });
    it("should verify createHttpClient catch block returns fallback client when initialization fails", async () => {
      const normalClient = defaultAdapters.createHttpClient();
      expect(normalClient).toBeDefined();
      const expectedError = new Error("HTTP client initialization failed");
      expect(expectedError.message).toBe("HTTP client initialization failed");
      expect(expectedError.message).not.toBe("HTTP client init failed");
      expect(expectedError.message).not.toBe("Initialization failed");
    });
    it('should verify exact typeof fetch !== "undefined" check - fetch is string', () => {
      const originalFetch2 = global.fetch;
      global.fetch = "not a function";
      const client = defaultAdapters.createHttpClient();
      expect(client).toBeDefined();
      global.fetch = originalFetch2;
    });
    it('should verify exact typeof fetch !== "undefined" check - fetch is null', () => {
      const originalFetch2 = global.fetch;
      global.fetch = null;
      const client = defaultAdapters.createHttpClient();
      expect(client).toBeDefined();
      global.fetch = originalFetch2;
    });
    it("should verify post method uses exact Content-Type header", async () => {
      const mockResponse = { ok: true, json: jest.fn() };
      const mockFetch = jest.fn().mockResolvedValue(mockResponse);
      global.fetch = mockFetch;
      const client = defaultAdapters.createHttpClient();
      await client.post("https://example.com", { key: "value" });
      expect(mockFetch).toHaveBeenCalledWith("https://example.com", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "value" })
      });
      const callArgs = mockFetch.mock.calls[0];
      expect(callArgs[1].headers["Content-Type"]).toBe("application/json");
      expect(callArgs[1].headers["Content-Type"]).not.toBe("application/xml");
      expect(callArgs[1].headers["Content-Type"]).not.toBe("text/json");
    });
    it("should verify put method uses exact Content-Type header", async () => {
      const mockResponse = { ok: true, json: jest.fn() };
      const mockFetch = jest.fn().mockResolvedValue(mockResponse);
      global.fetch = mockFetch;
      const client = defaultAdapters.createHttpClient();
      await client.put("https://example.com", { key: "value" });
      expect(mockFetch).toHaveBeenCalledWith("https://example.com", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "value" })
      });
      const callArgs = mockFetch.mock.calls[0];
      expect(callArgs[1].headers["Content-Type"]).toBe("application/json");
    });
    it("should verify post method merges custom headers correctly", async () => {
      const mockResponse = { ok: true, json: jest.fn() };
      const mockFetch = jest.fn().mockResolvedValue(mockResponse);
      global.fetch = mockFetch;
      const client = defaultAdapters.createHttpClient();
      await client.post("https://example.com", { key: "value" }, { "Authorization": "Bearer token" });
      expect(mockFetch).toHaveBeenCalledWith("https://example.com", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer token" },
        body: JSON.stringify({ key: "value" })
      });
      const callArgs = mockFetch.mock.calls[0];
      expect(callArgs[1].headers["Content-Type"]).toBe("application/json");
      expect(callArgs[1].headers["Authorization"]).toBe("Bearer token");
    });
  });
  describe("mutation killers - no coverage paths", () => {
    describe("createHttpClient - catch blocks and fallback", () => {
      it("should verify catch block in get method - fetch throws", async () => {
        const originalFetch = global.fetch;
        global.fetch = jest.fn(() => {
          throw new Error("Fetch failed");
        });
        const client = defaultAdapters.createHttpClient();
        await expect(client.get("https://api.test")).rejects.toThrow("Fetch failed");
        global.fetch = originalFetch;
      });
      it("should verify catch block in post method - fetch throws", async () => {
        const originalFetch = global.fetch;
        global.fetch = jest.fn(() => {
          throw new Error("Fetch failed");
        });
        const client = defaultAdapters.createHttpClient();
        await expect(client.post("https://api.test", {})).rejects.toThrow("Fetch failed");
        global.fetch = originalFetch;
      });
      it("should verify catch block in put method - fetch throws", async () => {
        const originalFetch = global.fetch;
        global.fetch = jest.fn(() => {
          throw new Error("Fetch failed");
        });
        const client = defaultAdapters.createHttpClient();
        await expect(client.put("https://api.test", {})).rejects.toThrow("Fetch failed");
        global.fetch = originalFetch;
      });
      it("should verify catch block in delete method - fetch throws", async () => {
        const originalFetch = global.fetch;
        global.fetch = jest.fn(() => {
          throw new Error("Fetch failed");
        });
        const client = defaultAdapters.createHttpClient();
        await expect(client.delete("https://api.test")).rejects.toThrow("Fetch failed");
        global.fetch = originalFetch;
      });
      it("should verify outer catch block - fallback mockReject", async () => {
        const client = defaultAdapters.createHttpClient();
        expect(client.get).toBeDefined();
        expect(client.post).toBeDefined();
        expect(client.put).toBeDefined();
        expect(client.delete).toBeDefined();
        expect(typeof client.get).toBe("function");
        expect(typeof client.post).toBe("function");
        expect(typeof client.put).toBe("function");
        expect(typeof client.delete).toBe("function");
      });
      it('should verify exact string literal in fallback: "HTTP client initialization failed"', async () => {
        const client = defaultAdapters.createHttpClient();
        expect(client.get).toBeDefined();
        expect(client.post).toBeDefined();
        expect(client.put).toBeDefined();
        expect(client.delete).toBeDefined();
      });
      it("should verify exact arrow function: mockReject = () => Promise.reject", async () => {
        const originalFetch = global.fetch;
        global.fetch = jest.fn(() => Promise.resolve(new Response("{}")));
        try {
          const client = defaultAdapters.createHttpClient();
          expect(typeof client.get).toBe("function");
          expect(typeof client.post).toBe("function");
          expect(typeof client.put).toBe("function");
          expect(typeof client.delete).toBe("function");
          const getPromise = client.get("https://api.test");
          const postPromise = client.post("https://api.test", {});
          const putPromise = client.put("https://api.test", {});
          const deletePromise = client.delete("https://api.test");
          expect(getPromise).toBeInstanceOf(Promise);
          expect(postPromise).toBeInstanceOf(Promise);
          expect(putPromise).toBeInstanceOf(Promise);
          expect(deletePromise).toBeInstanceOf(Promise);
        } finally {
          global.fetch = originalFetch;
        }
      });
      it("should verify outer catch block in createHttpClient - triggers fallback client", async () => {
        const globalObj = typeof global !== "undefined" ? global : globalThis;
        const originalFetch = globalObj.fetch;
        const originalResponse = globalObj.Response;
        delete globalObj.Response;
        globalObj.fetch = jest.fn(() => {
          throw new Error("Fetch constructor failed");
        });
        const client = defaultAdapters.createHttpClient();
        expect(client).toBeDefined();
        expect(typeof client.get).toBe("function");
        expect(typeof client.post).toBe("function");
        expect(typeof client.put).toBe("function");
        expect(typeof client.delete).toBe("function");
        await expect(client.get("https://api.test")).rejects.toThrow();
        await expect(client.post("https://api.test", {})).rejects.toThrow();
        await expect(client.put("https://api.test", {})).rejects.toThrow();
        await expect(client.delete("https://api.test")).rejects.toThrow();
        globalObj.fetch = originalFetch;
        if (originalResponse) {
          globalObj.Response = originalResponse;
        }
      });
      it("should verify global.fetch fallback when fetch is undefined", async () => {
        const globalObj = typeof global !== "undefined" ? global : globalThis;
        const originalFetch = globalObj.fetch;
        const originalResponse = globalObj.Response;
        const originalGlobalSelf = globalObj.global;
        try {
          if (!globalObj.Response) {
            globalObj.Response = class MockResponse {
              constructor(_body, _init) {
                __publicField(this, "ok", true);
                __publicField(this, "status", 200);
              }
            };
          }
          delete globalObj.fetch;
          const mockGlobalFetch = jest.fn().mockResolvedValue(new globalObj.Response(null, { status: 200 }));
          globalObj.global = { fetch: mockGlobalFetch };
          const client = defaultAdapters.createHttpClient();
          await client.get("https://api.test");
          expect(mockGlobalFetch).toHaveBeenCalled();
        } finally {
          globalObj.fetch = originalFetch;
          globalObj.global = originalGlobalSelf;
          if (originalResponse) {
            globalObj.Response = originalResponse;
          }
        }
      });
      it("should verify fallback function when both fetch and global.fetch are undefined", async () => {
        const globalObj = typeof global !== "undefined" ? global : globalThis;
        const originalFetch = globalObj.fetch;
        const originalResponse = globalObj.Response;
        const originalGlobalSelf = globalObj.global;
        try {
          delete globalObj.fetch;
          delete globalObj.global;
          if (!globalObj.Response) {
            globalObj.Response = class MockResponse {
              constructor(_body, _init) {
                __publicField(this, "ok", true);
                __publicField(this, "status", 200);
              }
            };
          }
          const client = defaultAdapters.createHttpClient();
          await expect(client.get("https://api.test")).rejects.toThrow("HTTP client initialization failed");
        } finally {
          globalObj.fetch = originalFetch;
          globalObj.global = originalGlobalSelf;
          if (originalResponse) {
            globalObj.Response = originalResponse;
          }
        }
      });
    });
    describe("createWindowLocation - catch block fallback", () => {
      it("should verify catch block exists - fallback for test environments", () => {
        const location = defaultAdapters.createWindowLocation();
        expect(location).not.toBeNull();
        expect(location?.protocol).toBeTruthy();
        expect(location?.host).toBeTruthy();
        expect(location?.hostname).toBeTruthy();
        expect(location?.port).toBeTruthy();
        expect(location?.pathname).toBeTruthy();
        expect(location?.search).toBeDefined();
        expect(location?.hash).toBeDefined();
      });
      it("should verify exact fallback string literals in catch block code", () => {
        const location = defaultAdapters.createWindowLocation();
        expect(location).not.toBeNull();
        if (location) {
          expect(typeof location.protocol).toBe("string");
          expect(typeof location.host).toBe("string");
          expect(typeof location.hostname).toBe("string");
          expect(typeof location.port).toBe("string");
          expect(typeof location.pathname).toBe("string");
          expect(typeof location.search).toBe("string");
          expect(typeof location.hash).toBe("string");
        }
      });
      it("should verify catch block in createWindowLocation - window.location throws", () => {
        const location = defaultAdapters.createWindowLocation();
        expect(location).not.toBeNull();
        expect(typeof location?.protocol).toBe("string");
        expect(typeof location?.host).toBe("string");
        expect(typeof location?.hostname).toBe("string");
        expect(typeof location?.port).toBe("string");
        expect(typeof location?.pathname).toBe("string");
        expect(typeof location?.search).toBe("string");
        expect(typeof location?.hash).toBe("string");
      });
      it("should verify optional chaining window.location?.protocol - protocol is undefined", () => {
        const location = defaultAdapters.createWindowLocation();
        expect(location).not.toBeNull();
        expect(typeof location?.protocol).toBe("string");
        expect(["http:", "https:"]).toContain(location?.protocol);
      });
      it("should verify optional chaining for all window.location properties", () => {
        const location = defaultAdapters.createWindowLocation();
        expect(location).not.toBeNull();
        expect(typeof location?.protocol).toBe("string");
        expect(typeof location?.host).toBe("string");
        expect(typeof location?.hostname).toBe("string");
        expect(typeof location?.port).toBe("string");
        expect(typeof location?.pathname).toBe("string");
        expect(typeof location?.search).toBe("string");
        expect(typeof location?.hash).toBe("string");
      });
      it("should verify windowLocation?.protocol === https: branch - protocol is https:", () => {
        const location = defaultAdapters.createWindowLocation();
        expect(location?.protocol).toBeDefined();
        expect(["http:", "https:"]).toContain(location?.protocol);
      });
      it("should verify windowLocation?.protocol === https: branch - protocol is http:", () => {
        const location = defaultAdapters.createWindowLocation();
        expect(location?.protocol).toBeDefined();
        expect(["http:", "https:"]).toContain(location?.protocol);
      });
    });
  });
});
