jest.mock("../types/adapters", () => ({
  defaultAdapters: {
    createLocalStorageAdapter: jest.fn(() => ({
      getItem: jest.fn(() => null),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    })),
    createSessionStorageAdapter: jest.fn(() => ({
      getItem: jest.fn(() => null),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    })),
  },
}));

jest.mock("../utils/logger", () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  },
}));

import { createApiClient } from "./client";
import { defaultAdapters } from "../types/adapters";
import { STORAGE_KEYS } from "../config/constants";

function jsonResponse(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status < 300 ? "OK" : "ERR",
    headers: {
      get: (name) => (String(name).toLowerCase() === "content-type" ? "application/json" : null),
    },
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(typeof body === "string" ? body : JSON.stringify(body)),
    blob: () => Promise.resolve(new Blob(["x"])),
  };
}

describe("createApiClient (fetch)", () => {
  let fetchMock;
  let mockLocal;
  let mockSession;

  beforeEach(() => {
    jest.clearAllMocks();
    fetchMock = jest.fn();
    mockLocal = {
      getItem: jest.fn(() => null),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    };
    mockSession = {
      getItem: jest.fn(() => null),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    };
    defaultAdapters.createLocalStorageAdapter.mockReturnValue(mockLocal);
    defaultAdapters.createSessionStorageAdapter.mockReturnValue(mockSession);
  });

  it("should get all workflows", async () => {
    const list = [{ id: "1", name: "W1" }];
    fetchMock.mockResolvedValue(jsonResponse(200, list));
    const api = createApiClient({ fetchImpl: fetchMock, localStorage: mockLocal, sessionStorage: mockSession });
    const result = await api.getWorkflows();
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/workflows$/),
      expect.objectContaining({ method: "GET" }),
    );
    expect(result).toEqual(list);
  });

  it("should attach bearer token when remember-me storage has token", async () => {
    mockLocal.getItem.mockImplementation((key) => {
      if (key === STORAGE_KEYS.AUTH_REMEMBER_ME) {
        return "true";
      }
      if (key === STORAGE_KEYS.AUTH_TOKEN) {
        return "tok";
      }
      return null;
    });
    fetchMock.mockResolvedValue(jsonResponse(200, []));
    const api = createApiClient({ fetchImpl: fetchMock, localStorage: mockLocal, sessionStorage: mockSession });
    await api.getWorkflows();
    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers.Authorization).toBe("Bearer tok");
  });

  it("should clear auth and broadcast on 401", async () => {
    const spy = jest.spyOn(window, "dispatchEvent").mockImplementation(() => true);
    fetchMock.mockResolvedValue({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      headers: { get: () => "application/json" },
      json: () => Promise.resolve({ detail: "no" }),
      text: () => Promise.resolve("{}"),
    });
    const api = createApiClient({ fetchImpl: fetchMock, localStorage: mockLocal, sessionStorage: mockSession });
    await expect(api.getWorkflows()).rejects.toThrow();
    expect(mockLocal.removeItem).toHaveBeenCalled();
    expect(mockSession.removeItem).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith(expect.any(CustomEvent));
    spy.mockRestore();
  });

  it("should pass query params to listExecutions", async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, []));
    const api = createApiClient({ fetchImpl: fetchMock, localStorage: mockLocal, sessionStorage: mockSession });
    await api.listExecutions({ limit: 50, status: "completed" });
    const [url] = fetchMock.mock.calls[0];
    expect(url).toContain("limit=50");
    expect(url).toContain("status=completed");
  });

  it("should return blob for downloadExecutionLogs", async () => {
    const b = new Blob(["logs"]);
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      headers: { get: () => null },
      blob: () => Promise.resolve(b),
    });
    const api = createApiClient({ fetchImpl: fetchMock, localStorage: mockLocal, sessionStorage: mockSession });
    const out = await api.downloadExecutionLogs("e1", "text");
    expect(out).toBe(b);
  });

  it("should return empty providers when getLLMSettings receives 401", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      headers: { get: () => "application/json" },
      json: () => Promise.resolve({}),
      text: () => Promise.resolve("{}"),
    });
    const api = createApiClient({ fetchImpl: fetchMock, localStorage: mockLocal, sessionStorage: mockSession });
    const settings = await api.getLLMSettings();
    expect(settings).toEqual({ providers: [] });
  });

  it("should duplicate workflow via get then post", async () => {
    const wf = { id: "1", name: "A" };
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, wf))
      .mockResolvedValueOnce(jsonResponse(200, { id: "2", name: "A-copy" }));
    const api = createApiClient({ fetchImpl: fetchMock, localStorage: mockLocal, sessionStorage: mockSession });
    const dup = await api.duplicateWorkflow("1");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(dup.name).toBe("A-copy");
  });
});
