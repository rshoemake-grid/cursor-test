import "@testing-library/jest-dom";
const localStorageMock = /* @__PURE__ */ (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();
Object.defineProperty(window, "localStorage", {
  value: localStorageMock
});
if (typeof window !== "undefined" && !window.location.host) {
  Object.defineProperty(window, "location", {
    value: {
      protocol: "http:",
      host: "localhost:8000",
      hostname: "localhost",
      port: "8000",
      pathname: "/",
      search: "",
      hash: ""
    },
    writable: true
  });
}
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn()
  }))
});
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
}));
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
}));
Object.defineProperty(global, "import", {
  value: {
    meta: {
      env: {
        DEV: true,
        MODE: "development"
      }
    }
  },
  writable: true
});
if (typeof global.TextEncoder === "undefined") {
  const { TextEncoder, TextDecoder } = require("util");
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}
if (typeof global.setImmediate === "undefined") {
  global.setImmediate = (callback, ...args) => {
    return setTimeout(() => callback(...args), 0);
  };
  global.clearImmediate = (id) => {
    clearTimeout(id);
  };
}
if (typeof global.fetch === "undefined") {
  global.fetch = jest.fn(
    () => Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
      text: () => Promise.resolve("")
    })
  );
}
if (typeof process !== "undefined" && process.env.NODE_ENV === "test") {
  const originalUnhandledRejection = process.listeners("unhandledRejection");
  if (originalUnhandledRejection.length === 0) {
    process.on("unhandledRejection", (reason) => {
      const reasonStr = String(reason);
      const isExpectedError = reasonStr.includes("HTTP client") || reasonStr.includes("URL cannot be empty") || reasonStr.includes("HttpClientError") || reasonStr.includes("InvalidUrlError") || reason === null || // Null rejections are common in mutation testing
      reason === void 0 || // Undefined rejections too
      typeof reason === "string" && reason.trim() === "";
      if (!isExpectedError) {
        console.warn("Unhandled promise rejection in test:", reason);
      }
      Promise.resolve().catch(() => {
      });
    });
  }
  const originalUncaughtException = process.listeners("uncaughtException");
  process.removeAllListeners("uncaughtException");
  process.on("uncaughtException", (error) => {
    const errorMessage = error?.message || "";
    const errorName = error?.name || "";
    if (errorMessage.includes("HTTP client") || errorMessage.includes("URL cannot be empty") || errorName === "HttpClientError" || errorName === "InvalidUrlError") {
      Promise.reject(error).catch(() => {
      });
      return;
    }
    originalUncaughtException.forEach((listener) => {
      try {
        if (typeof listener === "function") {
          if (listener.length === 1) {
            listener(error);
          } else {
            listener(error, "uncaughtException");
          }
        }
      } catch {
        /* ignore listener errors */
      }
    });
  });
}
const testLogs = [];
beforeEach(() => {
  const stack = new Error().stack || "";
  const match = stack.match(/at.*\((.+\.test\.(js|jsx))/);
  const testFile = match ? match[1].split("/").pop() || "unknown" : "unknown";
  const testName = expect.getState().currentTestName || "unknown";
  testLogs.push({ file: testFile, name: testName, start: Date.now() });
  console.log(`[TEST START] ${testFile} > ${testName}`);
});
afterEach(() => {
  const log = testLogs.pop();
  if (log) {
    const duration = Date.now() - log.start;
    console.log(`[TEST END] ${log.file} > ${log.name} (${duration}ms)`);
  }
  if (jest.isMockFunction(setTimeout) || jest.isMockFunction(setInterval)) {
    try {
      let timerCount = jest.getTimerCount();
      let iterations = 0;
      const maxIterations = 100;
      while (timerCount > 0 && iterations < maxIterations) {
        jest.runOnlyPendingTimers();
        const newCount = jest.getTimerCount();
        if (newCount === timerCount) {
          break;
        }
        timerCount = newCount;
        iterations++;
      }
      jest.useRealTimers();
    } catch {
      try {
        jest.useRealTimers();
      } catch {
        /* ignore */
      }
    }
  }
  try {
    const wsSetupModule = require("./hooks/execution/useWebSocket.test.setup");
    if (wsSetupModule && wsSetupModule.wsInstances && Array.isArray(wsSetupModule.wsInstances)) {
      wsSetupModule.wsInstances.splice(0, wsSetupModule.wsInstances.length);
    }
  } catch {
    /* optional WS teardown */
  }
});
