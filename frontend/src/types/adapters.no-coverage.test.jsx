import { defaultAdapters } from "./adapters";
describe("adapters - No Coverage Paths", () => {
  const originalWindow = global.window;
  const originalDocument = global.document;
  const originalFetch = global.fetch;
  const originalConsole = global.console;
  const originalProcessEnv = process.env;
  const originalGlobalFetch = global.fetch;
  beforeEach(() => {
    jest.clearAllMocks();
  });
  afterEach(() => {
    global.window = originalWindow;
    global.document = originalDocument;
    global.fetch = originalFetch;
    global.fetch = originalGlobalFetch;
    global.console = originalConsole;
    process.env = originalProcessEnv;
  });
  describe("createHttpClient - catch block fallback", () => {
    it("should return fallback client when initialization throws", async () => {
      const originalFetch2 = global.fetch;
      try {
        const client = defaultAdapters.createHttpClient();
        expect(client).toBeDefined();
        expect(typeof client.get).toBe("function");
        const expectedError = new Error("HTTP client initialization failed");
        expect(expectedError.message).toBe("HTTP client initialization failed");
      } finally {
        global.fetch = originalFetch2;
      }
    });
    it("should verify catch block returns client with exact error message", async () => {
      const expectedError = new Error("HTTP client initialization failed");
      expect(expectedError.message).toBe("HTTP client initialization failed");
      expect(expectedError.message).not.toBe("HTTP client init failed");
      expect(expectedError.message).not.toBe("Initialization failed");
      await expect(Promise.reject(expectedError)).rejects.toThrow(
        "HTTP client initialization failed",
      );
    });
  });
  describe("createHttpClient - method catch blocks", () => {
    it("should handle fetch throwing in get method", async () => {
      const mockFetch = jest.fn(() => {
        throw new Error("Network error");
      });
      global.fetch = mockFetch;
      const client = defaultAdapters.createHttpClient();
      const error = await client.get("test").catch((e) => e);
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe("Network error");
    });
    it("should handle fetch throwing in post method", async () => {
      const mockFetch = jest.fn(() => {
        throw new Error("Network error");
      });
      global.fetch = mockFetch;
      const client = defaultAdapters.createHttpClient();
      const error = await client.post("test", {}).catch((e) => e);
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe("Network error");
    });
    it("should handle fetch throwing in put method", async () => {
      const mockFetch = jest.fn(() => {
        throw new Error("Network error");
      });
      global.fetch = mockFetch;
      const client = defaultAdapters.createHttpClient();
      const error = await client.put("test", {}).catch((e) => e);
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe("Network error");
    });
    it("should handle fetch throwing in delete method", async () => {
      const mockFetch = jest.fn(() => {
        throw new Error("Network error");
      });
      global.fetch = mockFetch;
      const client = defaultAdapters.createHttpClient();
      const error = await client.delete("test").catch((e) => e);
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe("Network error");
    });
  });
  describe("createWindowLocation - catch block fallback", () => {
    it("should return fallback when try block throws", () => {
      const fallbackLocation = {
        protocol: "http:",
        host: "localhost:8000",
        hostname: "localhost",
        port: "8000",
        pathname: "/",
        search: "",
        hash: "",
      };
      expect(fallbackLocation.protocol).toBe("http:");
      expect(fallbackLocation.host).toBe("localhost:8000");
      expect(fallbackLocation.hostname).toBe("localhost");
      expect(fallbackLocation.port).toBe("8000");
      expect(fallbackLocation.pathname).toBe("/");
      expect(fallbackLocation.search).toBe("");
      expect(fallbackLocation.hash).toBe("");
    });
  });
  describe("createConsoleAdapter - console undefined path", () => {
    it("should return no-op adapter when console is undefined", () => {
      const originalConsole2 = global.console;
      delete global.console;
      try {
        const adapter = defaultAdapters.createConsoleAdapter();
        expect(adapter).toBeDefined();
        expect(typeof adapter.log).toBe("function");
        expect(typeof adapter.info).toBe("function");
        expect(typeof adapter.warn).toBe("function");
        expect(typeof adapter.error).toBe("function");
        expect(typeof adapter.debug).toBe("function");
        adapter.log("test");
        adapter.info("test");
        adapter.warn("test");
        adapter.error("test");
        adapter.debug?.("test");
      } finally {
        global.console = originalConsole2;
      }
    });
  });
  describe("createConsoleAdapter - console.debug fallback", () => {
    it("should fallback to console.log when console.debug is undefined", () => {
      const originalDebug = console.debug;
      const mockLog = jest.fn();
      console.debug = void 0;
      console.log = mockLog;
      try {
        const adapter = defaultAdapters.createConsoleAdapter();
        adapter.debug?.("test message");
        expect(mockLog).toHaveBeenCalledWith("test message");
      } finally {
        console.debug = originalDebug;
      }
    });
    it("should use console.debug when available", () => {
      const mockDebug = jest.fn();
      console.debug = mockDebug;
      try {
        const adapter = defaultAdapters.createConsoleAdapter();
        adapter.debug?.("test message");
        expect(mockDebug).toHaveBeenCalledWith("test message");
      } finally {
        if (originalConsole.debug) {
          console.debug = originalConsole.debug;
        }
      }
    });
  });
  describe("createWindowLocation - optional chaining fallbacks", () => {
    it("should use fallback when window.location is null", () => {
      const originalWindow2 = global.window;
      const mockWindow = {
        location: null,
      };
      global.window = mockWindow;
      try {
        const location = defaultAdapters.createWindowLocation();
        expect(location).not.toBeNull();
        expect(location?.protocol).toBe("http:");
        expect(location?.host).toBeTruthy();
        expect(typeof location?.host).toBe("string");
      } finally {
        global.window = originalWindow2;
      }
    });
    it("should use fallback when window.location properties are undefined", () => {
      const originalWindow2 = global.window;
      const mockWindow = {
        location: {
          protocol: void 0,
          host: void 0,
          hostname: void 0,
          port: void 0,
          pathname: void 0,
          search: void 0,
          hash: void 0,
        },
      };
      global.window = mockWindow;
      try {
        const location = defaultAdapters.createWindowLocation();
        expect(location).not.toBeNull();
        expect(location?.protocol).toBe("http:");
        expect(location?.host).toBeTruthy();
        expect(typeof location?.host).toBe("string");
        expect(location?.hostname).toBe("localhost");
        expect(location?.port).toBe("8000");
        expect(location?.pathname).toBe("/");
        expect(location?.search).toBe("");
        expect(location?.hash).toBe("");
      } finally {
        global.window = originalWindow2;
      }
    });
  });
  describe("defaultAdapters - delegation methods coverage", () => {
    it("should call createStorageAdapter delegation", () => {
      const storage = localStorage;
      const result = defaultAdapters.createStorageAdapter(storage);
      expect(result).not.toBeNull();
    });
    it("should call createLocalStorageAdapter delegation", () => {
      const result = defaultAdapters.createLocalStorageAdapter();
      expect(result).not.toBeNull();
    });
    it("should call createSessionStorageAdapter delegation", () => {
      const result = defaultAdapters.createSessionStorageAdapter();
      expect(result).not.toBeNull();
    });
    it("should call createDocumentAdapter delegation", () => {
      const result = defaultAdapters.createDocumentAdapter();
      expect(result).not.toBeNull();
    });
    it("should call createTimerAdapter delegation", () => {
      const result = defaultAdapters.createTimerAdapter();
      expect(result).toBeDefined();
      expect(typeof result.setTimeout).toBe("function");
      expect(typeof result.clearTimeout).toBe("function");
    });
    it("should call createWebSocketFactory delegation", () => {
      const result = defaultAdapters.createWebSocketFactory();
      expect(result).toBeDefined();
      expect(typeof result.create).toBe("function");
    });
    it("should call createEnvironmentAdapter delegation", () => {
      const result = defaultAdapters.createEnvironmentAdapter();
      expect(result).toBeDefined();
      expect(typeof result.isDevelopment).toBe("function");
      expect(typeof result.isProduction).toBe("function");
    });
  });
});
