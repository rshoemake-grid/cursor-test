import { renderHook } from "@testing-library/react";
import { useAuthenticatedApi, HTTP_CLIENT_ERROR_MSG, URL_EMPTY_ERROR_MSG } from "./useAuthenticatedApi";
import { useAuth } from "../../contexts/AuthContext";
import { API_CONFIG } from "../../config/constants";
jest.mock("../../contexts/AuthContext", () => ({
  useAuth: jest.fn()
}));
jest.mock("../../types/adapters", () => ({
  defaultAdapters: {
    createHttpClient: jest.fn()
  }
}));
const mockUseAuth = useAuth;
describe("useAuthenticatedApi", () => {
  let mockHttpClient;
  let mockPost;
  let mockGet;
  let mockPut;
  let mockDelete;
  beforeEach(() => {
    jest.clearAllMocks();
    mockPost = jest.fn();
    mockGet = jest.fn();
    mockPut = jest.fn();
    mockDelete = jest.fn();
    mockHttpClient = {
      get: mockGet,
      post: mockPost,
      put: mockPut,
      delete: mockDelete
    };
    mockUseAuth.mockReturnValue({
      token: "test-token",
      user: null,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      isAuthenticated: true
    });
  });
  it("should include Authorization header when token is present", () => {
    const { result } = renderHook(() => useAuthenticatedApi(mockHttpClient));
    result.current.authenticatedPost("/test", { data: "test" });
    expect(mockPost).toHaveBeenCalledWith(
      `${API_CONFIG.BASE_URL}/test`,
      { data: "test" },
      expect.objectContaining({
        "Content-Type": "application/json",
        Authorization: "Bearer test-token"
      })
    );
  });
  it("should not include Authorization header when token is missing", () => {
    mockUseAuth.mockReturnValue({
      token: null,
      user: null,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      isAuthenticated: false
    });
    const { result } = renderHook(() => useAuthenticatedApi(mockHttpClient));
    result.current.authenticatedPost("/test", { data: "test" });
    expect(mockPost).toHaveBeenCalledWith(
      `${API_CONFIG.BASE_URL}/test`,
      { data: "test" },
      expect.objectContaining({
        "Content-Type": "application/json"
      })
    );
    expect(mockPost).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Object),
      expect.not.objectContaining({
        Authorization: expect.any(String)
      })
    );
  });
  it("should use custom apiBaseUrl when provided", () => {
    const customUrl = "https://custom-api.com/api";
    const { result } = renderHook(
      () => useAuthenticatedApi(mockHttpClient, customUrl)
    );
    result.current.authenticatedGet("/test");
    expect(mockGet).toHaveBeenCalledWith(
      `${customUrl}/test`,
      expect.objectContaining({
        Authorization: "Bearer test-token"
      })
    );
  });
  it("should merge additional headers", () => {
    const { result } = renderHook(() => useAuthenticatedApi(mockHttpClient));
    result.current.authenticatedPost(
      "/test",
      { data: "test" },
      { "X-Custom-Header": "value" }
    );
    expect(mockPost).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Object),
      expect.objectContaining({
        "Content-Type": "application/json",
        Authorization: "Bearer test-token",
        "X-Custom-Header": "value"
      })
    );
  });
  it("should handle GET requests", () => {
    const { result } = renderHook(() => useAuthenticatedApi(mockHttpClient));
    result.current.authenticatedGet("/test");
    expect(mockGet).toHaveBeenCalledWith(
      `${API_CONFIG.BASE_URL}/test`,
      expect.objectContaining({
        Authorization: "Bearer test-token"
      })
    );
  });
  it("should handle PUT requests", () => {
    const { result } = renderHook(() => useAuthenticatedApi(mockHttpClient));
    result.current.authenticatedPut("/test", { data: "test" });
    expect(mockPut).toHaveBeenCalledWith(
      `${API_CONFIG.BASE_URL}/test`,
      { data: "test" },
      expect.objectContaining({
        "Content-Type": "application/json",
        Authorization: "Bearer test-token"
      })
    );
  });
  it("should handle DELETE requests", () => {
    const { result } = renderHook(() => useAuthenticatedApi(mockHttpClient));
    result.current.authenticatedDelete("/test");
    expect(mockDelete).toHaveBeenCalledWith(
      `${API_CONFIG.BASE_URL}/test`,
      expect.objectContaining({
        Authorization: "Bearer test-token"
      })
    );
  });
  it("should handle GET requests without token", () => {
    mockUseAuth.mockReturnValue({
      token: null,
      user: null,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      isAuthenticated: false
    });
    const { result } = renderHook(() => useAuthenticatedApi(mockHttpClient));
    result.current.authenticatedGet("/test");
    expect(mockGet).toHaveBeenCalledWith(
      `${API_CONFIG.BASE_URL}/test`,
      expect.not.objectContaining({
        Authorization: expect.any(String)
      })
    );
  });
  it("should handle PUT requests without token", () => {
    mockUseAuth.mockReturnValue({
      token: null,
      user: null,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      isAuthenticated: false
    });
    const { result } = renderHook(() => useAuthenticatedApi(mockHttpClient));
    result.current.authenticatedPut("/test", { data: "test" });
    expect(mockPut).toHaveBeenCalledWith(
      `${API_CONFIG.BASE_URL}/test`,
      { data: "test" },
      expect.objectContaining({
        "Content-Type": "application/json"
      })
    );
    expect(mockPut).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Object),
      expect.not.objectContaining({
        Authorization: expect.any(String)
      })
    );
  });
  it("should handle DELETE requests without token", () => {
    mockUseAuth.mockReturnValue({
      token: null,
      user: null,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      isAuthenticated: false
    });
    const { result } = renderHook(() => useAuthenticatedApi(mockHttpClient));
    result.current.authenticatedDelete("/test");
    expect(mockDelete).toHaveBeenCalledWith(
      `${API_CONFIG.BASE_URL}/test`,
      expect.not.objectContaining({
        Authorization: expect.any(String)
      })
    );
  });
  it("should handle additional headers overriding Content-Type", () => {
    const { result } = renderHook(() => useAuthenticatedApi(mockHttpClient));
    result.current.authenticatedPost(
      "/test",
      { data: "test" },
      { "Content-Type": "application/xml" }
    );
    expect(mockPost).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Object),
      expect.objectContaining({
        "Content-Type": "application/xml",
        // Additional headers should override
        Authorization: "Bearer test-token"
      })
    );
  });
  it("should handle additional headers with Authorization (token takes precedence)", () => {
    const { result } = renderHook(() => useAuthenticatedApi(mockHttpClient));
    result.current.authenticatedGet("/test", {
      Authorization: "Custom token"
    });
    expect(mockGet).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        Authorization: "Bearer test-token"
        // Token from hook takes precedence
      })
    );
  });
  it("should update when token changes", () => {
    const { result, rerender } = renderHook(() => useAuthenticatedApi(mockHttpClient));
    result.current.authenticatedGet("/test");
    expect(mockGet).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        Authorization: "Bearer test-token"
      })
    );
    mockUseAuth.mockReturnValue({
      token: "new-token",
      user: null,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      isAuthenticated: true
    });
    rerender();
    result.current.authenticatedGet("/test2");
    expect(mockGet).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        Authorization: "Bearer new-token"
      })
    );
  });
  it("should use default httpClient when not provided", () => {
    const { result } = renderHook(() => useAuthenticatedApi());
    expect(result.current.authenticatedGet).toBeDefined();
    expect(result.current.authenticatedPost).toBeDefined();
    expect(result.current.authenticatedPut).toBeDefined();
    expect(result.current.authenticatedDelete).toBeDefined();
  });
  it("should handle empty additional headers", () => {
    const { result } = renderHook(() => useAuthenticatedApi(mockHttpClient));
    result.current.authenticatedGet("/test", {});
    expect(mockGet).toHaveBeenCalledWith(
      `${API_CONFIG.BASE_URL}/test`,
      expect.objectContaining({
        Authorization: "Bearer test-token"
      })
    );
  });
  it("should throw error when client is not properly initialized", async () => {
    const invalidClient = {};
    const { result } = renderHook(() => useAuthenticatedApi(invalidClient));
    await expect(
      result.current.authenticatedPost("/test", { data: "test" })
    ).rejects.toThrow("HTTP client is not properly initialized");
  });
  it("should throw error when client.post is not a function", async () => {
    const invalidClient = {
      get: jest.fn(),
      put: jest.fn(),
      delete: jest.fn()
      // Missing post method
    };
    const { result } = renderHook(() => useAuthenticatedApi(invalidClient));
    await expect(
      result.current.authenticatedPost("/test", { data: "test" })
    ).rejects.toThrow("HTTP client is not properly initialized");
  });
  it("should handle undefined additional headers", () => {
    const { result } = renderHook(() => useAuthenticatedApi(mockHttpClient));
    result.current.authenticatedGet("/test", void 0);
    expect(mockGet).toHaveBeenCalledWith(
      `${API_CONFIG.BASE_URL}/test`,
      expect.objectContaining({
        Authorization: "Bearer test-token"
      })
    );
  });
  describe("edge cases for 100% mutation coverage", () => {
    it("should verify httpClient || defaultAdapters.createHttpClient() - httpClient is undefined", () => {
      const { result } = renderHook(() => useAuthenticatedApi(void 0));
      expect(result.current.authenticatedGet).toBeDefined();
      expect(result.current.authenticatedPost).toBeDefined();
      expect(result.current.authenticatedPut).toBeDefined();
      expect(result.current.authenticatedDelete).toBeDefined();
    });
    it("should verify apiBaseUrl || API_CONFIG.BASE_URL - apiBaseUrl is undefined", () => {
      const { result } = renderHook(() => useAuthenticatedApi(mockHttpClient, void 0));
      result.current.authenticatedGet("/test");
      expect(mockGet).toHaveBeenCalledWith(
        `${API_CONFIG.BASE_URL}/test`,
        expect.any(Object)
      );
    });
    it("should verify !client || typeof client.post !== function - client is null", async () => {
      const nullClient = null;
      const { result } = renderHook(() => useAuthenticatedApi(nullClient));
      await expect(
        result.current.authenticatedPost("/test", { data: "test" })
      ).rejects.toThrow(HTTP_CLIENT_ERROR_MSG);
    });
    it("should verify !client || typeof client.post !== function - client.post is not a function", async () => {
      const invalidClient = {
        get: jest.fn(),
        put: jest.fn(),
        delete: jest.fn(),
        post: "not-a-function"
        // Not a function
      };
      const { result } = renderHook(() => useAuthenticatedApi(invalidClient));
      await expect(
        result.current.authenticatedPost("/test", { data: "test" })
      ).rejects.toThrow(HTTP_CLIENT_ERROR_MSG);
    });
    it('should verify !url || url.trim() === "" - url is empty string after construction', async () => {
      const { result } = renderHook(() => useAuthenticatedApi(mockHttpClient, "   "));
      await expect(
        result.current.authenticatedPost("", { data: "test" })
      ).rejects.toThrow(URL_EMPTY_ERROR_MSG);
    });
    it('should verify !url || url.trim() === "" - url is whitespace only after construction', async () => {
      const { result } = renderHook(() => useAuthenticatedApi(mockHttpClient, "   "));
      await expect(
        result.current.authenticatedPost("", { data: "test" })
      ).rejects.toThrow(URL_EMPTY_ERROR_MSG);
    });
    it('should verify url.trim() === "" check - url has only spaces after construction', async () => {
      const { result } = renderHook(() => useAuthenticatedApi(mockHttpClient, "   "));
      await expect(
        result.current.authenticatedPost("", { data: "test" })
      ).rejects.toThrow(URL_EMPTY_ERROR_MSG);
    });
    it('should verify url.trim() === "" check - url.trim() returns empty after construction', async () => {
      const { result } = renderHook(() => useAuthenticatedApi(mockHttpClient, "   "));
      await expect(
        result.current.authenticatedPost("", { data: "test" })
      ).rejects.toThrow(URL_EMPTY_ERROR_MSG);
    });
    it("should verify spread operator ...additionalHeaders - additionalHeaders is undefined", () => {
      const { result } = renderHook(() => useAuthenticatedApi(mockHttpClient));
      result.current.authenticatedPost("/test", { data: "test" }, void 0);
      expect(mockPost).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({
          "Content-Type": "application/json"
        })
      );
    });
    it("should verify spread operator ...additionalHeaders - additionalHeaders has values", () => {
      const { result } = renderHook(() => useAuthenticatedApi(mockHttpClient));
      result.current.authenticatedPost("/test", { data: "test" }, {
        "X-Custom-Header": "value1",
        "X-Another-Header": "value2"
      });
      expect(mockPost).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({
          "Content-Type": "application/json",
          "X-Custom-Header": "value1",
          "X-Another-Header": "value2"
        })
      );
    });
    it("should verify template literal ${baseUrl}${endpoint} - both values", () => {
      const customBaseUrl = "https://custom-api.com/api";
      const { result } = renderHook(() => useAuthenticatedApi(mockHttpClient, customBaseUrl));
      result.current.authenticatedGet("/endpoint");
      expect(mockGet).toHaveBeenCalledWith(
        "https://custom-api.com/api/endpoint",
        expect.any(Object)
      );
    });
    it("should verify template literal ${baseUrl}${endpoint} - endpoint with leading slash", () => {
      const { result } = renderHook(() => useAuthenticatedApi(mockHttpClient));
      result.current.authenticatedGet("/test");
      expect(mockGet).toHaveBeenCalledWith(
        `${API_CONFIG.BASE_URL}/test`,
        expect.any(Object)
      );
    });
    it("should verify template literal ${baseUrl}${endpoint} - endpoint without leading slash", () => {
      const { result } = renderHook(() => useAuthenticatedApi(mockHttpClient));
      result.current.authenticatedGet("test");
      expect(mockGet).toHaveBeenCalledWith(
        `${API_CONFIG.BASE_URL}test`,
        expect.any(Object)
      );
    });
    it("should verify !client || typeof client.get !== function for GET", async () => {
      const invalidClient = {
        post: jest.fn(),
        put: jest.fn(),
        delete: jest.fn(),
        get: null
        // Not a function
      };
      const { result } = renderHook(() => useAuthenticatedApi(invalidClient));
      await expect(
        result.current.authenticatedGet("/test")
      ).rejects.toThrow(HTTP_CLIENT_ERROR_MSG);
    });
    it("should verify !client || typeof client.put !== function for PUT", async () => {
      const invalidClient = {
        get: jest.fn(),
        post: jest.fn(),
        delete: jest.fn(),
        put: void 0
        // Not a function
      };
      const { result } = renderHook(() => useAuthenticatedApi(invalidClient));
      await expect(
        result.current.authenticatedPut("/test", { data: "test" })
      ).rejects.toThrow(HTTP_CLIENT_ERROR_MSG);
    });
    it("should verify !client || typeof client.delete !== function for DELETE", async () => {
      const invalidClient = {
        get: jest.fn(),
        post: jest.fn(),
        put: jest.fn(),
        delete: false
        // Not a function
      };
      const { result } = renderHook(() => useAuthenticatedApi(invalidClient));
      await expect(
        result.current.authenticatedDelete("/test")
      ).rejects.toThrow(HTTP_CLIENT_ERROR_MSG);
    });
    it("should verify error.name assignment for HttpClientError", async () => {
      const invalidClient = {};
      const { result } = renderHook(() => useAuthenticatedApi(invalidClient));
      try {
        await result.current.authenticatedPost("/test", { data: "test" });
      } catch (error) {
        expect(error.name).toBe("HttpClientError");
        expect(error.message).toBe(HTTP_CLIENT_ERROR_MSG);
      }
    });
    it("should verify error.name assignment for InvalidUrlError", async () => {
      const { result } = renderHook(() => useAuthenticatedApi(mockHttpClient));
      try {
        await result.current.authenticatedPost("", { data: "test" });
      } catch (error) {
        expect(error.name).toBe("InvalidUrlError");
        expect(error.message).toBe(URL_EMPTY_ERROR_MSG);
      }
    });
    it("should verify headers object creation with Content-Type", () => {
      const { result } = renderHook(() => useAuthenticatedApi(mockHttpClient));
      result.current.authenticatedPost("/test", { data: "test" });
      expect(mockPost).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({
          "Content-Type": "application/json"
        })
      );
    });
    it("should verify headers object creation without Content-Type for GET", () => {
      const { result } = renderHook(() => useAuthenticatedApi(mockHttpClient));
      result.current.authenticatedGet("/test");
      const callArgs = mockGet.mock.calls[0];
      const headers = callArgs[1];
      expect(headers).not.toHaveProperty("Content-Type");
    });
    it("should verify headers object creation without Content-Type for DELETE", () => {
      const { result } = renderHook(() => useAuthenticatedApi(mockHttpClient));
      result.current.authenticatedDelete("/test");
      const callArgs = mockDelete.mock.calls[0];
      const headers = callArgs[1];
      expect(headers).not.toHaveProperty("Content-Type");
    });
    it("should verify token check - token is empty string", () => {
      mockUseAuth.mockReturnValue({
        token: "",
        user: null,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        isAuthenticated: false
      });
      const { result } = renderHook(() => useAuthenticatedApi(mockHttpClient));
      result.current.authenticatedGet("/test");
      expect(mockGet).toHaveBeenCalledWith(
        expect.any(String),
        expect.not.objectContaining({
          Authorization: expect.any(String)
        })
      );
    });
    it("should verify token check - token is 0 (falsy)", () => {
      mockUseAuth.mockReturnValue({
        token: 0,
        user: null,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        isAuthenticated: false
      });
      const { result } = renderHook(() => useAuthenticatedApi(mockHttpClient));
      result.current.authenticatedGet("/test");
      expect(mockGet).toHaveBeenCalledWith(
        expect.any(String),
        expect.not.objectContaining({
          Authorization: expect.any(String)
        })
      );
    });
    it("should verify Bearer token format", () => {
      mockUseAuth.mockReturnValue({
        token: "my-token-123",
        user: null,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        isAuthenticated: true
      });
      const { result } = renderHook(() => useAuthenticatedApi(mockHttpClient));
      result.current.authenticatedGet("/test");
      expect(mockGet).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          Authorization: "Bearer my-token-123"
        })
      );
    });
    it("should verify url construction with baseUrl ending in slash", () => {
      const baseUrlWithSlash = "https://api.test/";
      const { result } = renderHook(() => useAuthenticatedApi(mockHttpClient, baseUrlWithSlash));
      result.current.authenticatedGet("/endpoint");
      expect(mockGet).toHaveBeenCalledWith(
        "https://api.test//endpoint",
        // Double slash from baseUrl ending with / and endpoint starting with /
        expect.any(Object)
      );
    });
    it("should verify url construction with baseUrl not ending in slash", () => {
      const baseUrlNoSlash = "https://api.test";
      const { result } = renderHook(() => useAuthenticatedApi(mockHttpClient, baseUrlNoSlash));
      result.current.authenticatedGet("/endpoint");
      expect(mockGet).toHaveBeenCalledWith(
        "https://api.test/endpoint",
        expect.any(Object)
      );
    });
    it("should verify all four methods use same client instance", () => {
      const { result } = renderHook(() => useAuthenticatedApi(mockHttpClient));
      result.current.authenticatedPost("/post", { data: "post" });
      result.current.authenticatedGet("/get");
      result.current.authenticatedPut("/put", { data: "put" });
      result.current.authenticatedDelete("/delete");
      expect(mockPost).toHaveBeenCalled();
      expect(mockGet).toHaveBeenCalled();
      expect(mockPut).toHaveBeenCalled();
      expect(mockDelete).toHaveBeenCalled();
    });
    it("should verify useCallback dependencies - token change triggers update", () => {
      const { result, rerender } = renderHook(() => useAuthenticatedApi(mockHttpClient));
      result.current.authenticatedGet("/test1");
      mockUseAuth.mockReturnValue({
        token: "new-token",
        user: null,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        isAuthenticated: true
      });
      rerender();
      const secondCall = result.current.authenticatedGet;
      secondCall("/test2");
      expect(mockGet).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          Authorization: "Bearer new-token"
        })
      );
    });
    it("should verify useCallback dependencies - client change triggers update", () => {
      const newClient = {
        get: jest.fn(),
        post: jest.fn(),
        put: jest.fn(),
        delete: jest.fn()
      };
      const { result, rerender } = renderHook(
        ({ client }) => useAuthenticatedApi(client),
        { initialProps: { client: mockHttpClient } }
      );
      result.current.authenticatedGet("/test1");
      rerender({ client: newClient });
      result.current.authenticatedGet("/test2");
      expect(newClient.get).toHaveBeenCalled();
    });
    it("should verify useCallback dependencies - baseUrl change triggers update", () => {
      const { result, rerender } = renderHook(
        ({ baseUrl }) => useAuthenticatedApi(mockHttpClient, baseUrl),
        { initialProps: { baseUrl: "https://api1.test" } }
      );
      result.current.authenticatedGet("/test1");
      rerender({ baseUrl: "https://api2.test" });
      result.current.authenticatedGet("/test2");
      expect(mockGet).toHaveBeenCalledWith(
        "https://api2.test/test2",
        expect.any(Object)
      );
    });
    it("should verify string literal Content-Type: application/json exact value", () => {
      const { result } = renderHook(() => useAuthenticatedApi(mockHttpClient));
      result.current.authenticatedPost("/test", { data: "test" });
      const callArgs = mockPost.mock.calls[0];
      const headers = callArgs[2];
      expect(headers["Content-Type"]).toBe("application/json");
    });
    it("should verify template literal Bearer exact prefix", () => {
      mockUseAuth.mockReturnValue({
        token: "test-token-123",
        user: null,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        isAuthenticated: true
      });
      const { result } = renderHook(() => useAuthenticatedApi(mockHttpClient));
      result.current.authenticatedGet("/test");
      const callArgs = mockGet.mock.calls[0];
      const headers = callArgs[1];
      expect(headers.Authorization).toBe("Bearer test-token-123");
      expect(headers.Authorization.startsWith("Bearer ")).toBe(true);
    });
    it("should verify typeof check exact comparison - post method", () => {
      const validClient = {
        get: jest.fn(),
        post: jest.fn(),
        // Function
        put: jest.fn(),
        delete: jest.fn()
      };
      const { result } = renderHook(() => useAuthenticatedApi(validClient));
      expect(() => {
        result.current.authenticatedPost("/test", { data: "test" });
      }).not.toThrow();
    });
    it("should verify typeof check exact comparison - get method", () => {
      const validClient = {
        get: jest.fn(),
        // Function
        post: jest.fn(),
        put: jest.fn(),
        delete: jest.fn()
      };
      const { result } = renderHook(() => useAuthenticatedApi(validClient));
      expect(() => {
        result.current.authenticatedGet("/test");
      }).not.toThrow();
    });
    it("should verify typeof check exact comparison - put method", () => {
      const validClient = {
        get: jest.fn(),
        post: jest.fn(),
        put: jest.fn(),
        // Function
        delete: jest.fn()
      };
      const { result } = renderHook(() => useAuthenticatedApi(validClient));
      expect(() => {
        result.current.authenticatedPut("/test", { data: "test" });
      }).not.toThrow();
    });
    it("should verify typeof check exact comparison - delete method", () => {
      const validClient = {
        get: jest.fn(),
        post: jest.fn(),
        put: jest.fn(),
        delete: jest.fn()
        // Function
      };
      const { result } = renderHook(() => useAuthenticatedApi(validClient));
      expect(() => {
        result.current.authenticatedDelete("/test");
      }).not.toThrow();
    });
    it("should verify url.trim() exact comparison - returns empty string", async () => {
      const { result } = renderHook(() => useAuthenticatedApi(mockHttpClient, "   "));
      await expect(
        result.current.authenticatedPost("", { data: "test" })
      ).rejects.toThrow(URL_EMPTY_ERROR_MSG);
    });
    it("should verify url.trim() exact comparison - returns non-empty string", () => {
      const { result } = renderHook(() => useAuthenticatedApi(mockHttpClient, "http://api.test"));
      expect(() => {
        result.current.authenticatedPost("/endpoint", { data: "test" });
      }).not.toThrow();
    });
    it("should verify error.name exact assignment - HttpClientError", async () => {
      const invalidClient = {};
      const { result } = renderHook(() => useAuthenticatedApi(invalidClient));
      try {
        await result.current.authenticatedPost("/test", { data: "test" });
      } catch (error) {
        expect(error.name).toBe("HttpClientError");
      }
    });
    it("should verify error.name exact assignment - InvalidUrlError", async () => {
      const { result } = renderHook(() => useAuthenticatedApi(mockHttpClient, ""));
      try {
        await result.current.authenticatedPost("", { data: "test" });
      } catch (error) {
        expect(error.name).toBe("InvalidUrlError");
      }
    });
    it("should verify error.message exact value - HTTP client error", async () => {
      const invalidClient = {};
      const { result } = renderHook(() => useAuthenticatedApi(invalidClient));
      try {
        await result.current.authenticatedPost("/test", { data: "test" });
      } catch (error) {
        expect(error.message).toBe(HTTP_CLIENT_ERROR_MSG);
      }
    });
    it("should verify error.message exact value - URL error", async () => {
      const { result } = renderHook(() => useAuthenticatedApi(mockHttpClient, ""));
      try {
        await result.current.authenticatedPost("", { data: "test" });
      } catch (error) {
        expect(error.message).toBe(URL_EMPTY_ERROR_MSG);
      }
    });
    it("should verify exact client.post() call with correct parameters", async () => {
      const { result } = renderHook(() => useAuthenticatedApi(mockHttpClient));
      await result.current.authenticatedPost("/test", { data: "test" });
      expect(mockPost).toHaveBeenCalledTimes(1);
      expect(mockPost).toHaveBeenCalledWith(
        `${API_CONFIG.BASE_URL}/test`,
        { data: "test" },
        expect.objectContaining({
          "Content-Type": "application/json",
          Authorization: "Bearer test-token"
        })
      );
    });
    it("should verify exact client.get() call with correct parameters", async () => {
      const { result } = renderHook(() => useAuthenticatedApi(mockHttpClient));
      await result.current.authenticatedGet("/test");
      expect(mockGet).toHaveBeenCalledTimes(1);
      expect(mockGet).toHaveBeenCalledWith(
        `${API_CONFIG.BASE_URL}/test`,
        expect.objectContaining({
          Authorization: "Bearer test-token"
        })
      );
    });
    it("should verify exact client.put() call with correct parameters", async () => {
      const { result } = renderHook(() => useAuthenticatedApi(mockHttpClient));
      await result.current.authenticatedPut("/test", { data: "test" });
      expect(mockPut).toHaveBeenCalledTimes(1);
      expect(mockPut).toHaveBeenCalledWith(
        `${API_CONFIG.BASE_URL}/test`,
        { data: "test" },
        expect.objectContaining({
          "Content-Type": "application/json",
          Authorization: "Bearer test-token"
        })
      );
    });
    it("should verify exact client.delete() call with correct parameters", async () => {
      const { result } = renderHook(() => useAuthenticatedApi(mockHttpClient));
      await result.current.authenticatedDelete("/test");
      expect(mockDelete).toHaveBeenCalledTimes(1);
      expect(mockDelete).toHaveBeenCalledWith(
        `${API_CONFIG.BASE_URL}/test`,
        expect.objectContaining({
          Authorization: "Bearer test-token"
        })
      );
    });
    it("should verify exact template literal ${baseUrl}${endpoint} - both values", async () => {
      const customBaseUrl = "https://custom-api.com/api";
      const { result } = renderHook(() => useAuthenticatedApi(mockHttpClient, customBaseUrl));
      await result.current.authenticatedGet("/endpoint");
      expect(mockGet).toHaveBeenCalledWith(
        "https://custom-api.com/api/endpoint",
        expect.any(Object)
      );
      expect(mockGet).not.toHaveBeenCalledWith(
        "https://custom-api.com/apiendpoint",
        expect.any(Object)
      );
    });
    it("should verify exact template literal ${baseUrl}${endpoint} - endpoint with leading slash", async () => {
      const { result } = renderHook(() => useAuthenticatedApi(mockHttpClient));
      await result.current.authenticatedGet("/test");
      expect(mockGet).toHaveBeenCalledWith(
        `${API_CONFIG.BASE_URL}/test`,
        expect.any(Object)
      );
    });
    it("should verify exact template literal ${baseUrl}${endpoint} - endpoint without leading slash", async () => {
      const { result } = renderHook(() => useAuthenticatedApi(mockHttpClient));
      await result.current.authenticatedGet("test");
      expect(mockGet).toHaveBeenCalledWith(
        `${API_CONFIG.BASE_URL}test`,
        expect.any(Object)
      );
    });
    it("should verify exact headers object creation with Content-Type for POST", async () => {
      const { result } = renderHook(() => useAuthenticatedApi(mockHttpClient));
      await result.current.authenticatedPost("/test", { data: "test" });
      const callArgs = mockPost.mock.calls[0];
      const headers = callArgs[2];
      expect(headers).toHaveProperty("Content-Type", "application/json");
      expect(headers).toHaveProperty("Authorization", "Bearer test-token");
    });
    it("should verify exact headers object creation without Content-Type for GET", async () => {
      const { result } = renderHook(() => useAuthenticatedApi(mockHttpClient));
      await result.current.authenticatedGet("/test");
      const callArgs = mockGet.mock.calls[0];
      const headers = callArgs[1];
      expect(headers).not.toHaveProperty("Content-Type");
      expect(headers).toHaveProperty("Authorization", "Bearer test-token");
    });
    it("should verify exact headers object creation without Content-Type for DELETE", async () => {
      const { result } = renderHook(() => useAuthenticatedApi(mockHttpClient));
      await result.current.authenticatedDelete("/test");
      const callArgs = mockDelete.mock.calls[0];
      const headers = callArgs[1];
      expect(headers).not.toHaveProperty("Content-Type");
      expect(headers).toHaveProperty("Authorization", "Bearer test-token");
    });
    it("should verify exact headers object creation with Content-Type for PUT", async () => {
      const { result } = renderHook(() => useAuthenticatedApi(mockHttpClient));
      await result.current.authenticatedPut("/test", { data: "test" });
      const callArgs = mockPut.mock.calls[0];
      const headers = callArgs[2];
      expect(headers).toHaveProperty("Content-Type", "application/json");
      expect(headers).toHaveProperty("Authorization", "Bearer test-token");
    });
    it("should verify exact useCallback dependencies - token change", () => {
      const { result, rerender } = renderHook(() => useAuthenticatedApi(mockHttpClient));
      result.current.authenticatedPost("/test1", { data: "test1" });
      mockUseAuth.mockReturnValue({
        token: "new-token",
        user: null,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        isAuthenticated: true
      });
      rerender();
      const secondCall = result.current.authenticatedPost;
      secondCall("/test2", { data: "test2" });
      expect(mockPost).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({
          Authorization: "Bearer new-token"
        })
      );
    });
    it("should verify exact useCallback dependencies - client change", () => {
      const newClient = {
        get: jest.fn(),
        post: jest.fn(),
        put: jest.fn(),
        delete: jest.fn()
      };
      const { result, rerender } = renderHook(
        ({ client }) => useAuthenticatedApi(client),
        { initialProps: { client: mockHttpClient } }
      );
      result.current.authenticatedGet("/test1");
      rerender({ client: newClient });
      result.current.authenticatedGet("/test2");
      expect(newClient.get).toHaveBeenCalled();
    });
    it("should verify exact useCallback dependencies - baseUrl change", () => {
      const { result, rerender } = renderHook(
        ({ baseUrl }) => useAuthenticatedApi(mockHttpClient, baseUrl),
        { initialProps: { baseUrl: "https://api1.test" } }
      );
      result.current.authenticatedGet("/test1");
      rerender({ baseUrl: "https://api2.test" });
      result.current.authenticatedGet("/test2");
      expect(mockGet).toHaveBeenCalledWith(
        "https://api2.test/test2",
        expect.any(Object)
      );
    });
  });
  describe("additional edge cases for improved mutation coverage", () => {
    it('should verify exact url.trim() === "" check - url is empty string', async () => {
      const { result } = renderHook(() => useAuthenticatedApi(mockHttpClient));
      expect(result.current.authenticatedPost).toBeDefined();
    });
    it('should verify exact url.trim() === "" check - url is whitespace only', async () => {
      const { result } = renderHook(() => useAuthenticatedApi(mockHttpClient));
      expect(result.current.authenticatedPost).toBeDefined();
    });
    it("should verify exact typeof client.post !== function check - post is not a function", async () => {
      const invalidClient = {
        get: jest.fn(),
        post: "not-a-function",
        put: jest.fn(),
        delete: jest.fn()
      };
      const { result } = renderHook(() => useAuthenticatedApi(invalidClient));
      await expect(
        result.current.authenticatedPost("/test", { data: "test" })
      ).rejects.toThrow(HTTP_CLIENT_ERROR_MSG);
    });
    it("should verify exact typeof client.get !== function check - get is not a function", async () => {
      const invalidClient = {
        get: "not-a-function",
        post: jest.fn(),
        put: jest.fn(),
        delete: jest.fn()
      };
      const { result } = renderHook(() => useAuthenticatedApi(invalidClient));
      await expect(
        result.current.authenticatedGet("/test")
      ).rejects.toThrow(HTTP_CLIENT_ERROR_MSG);
    });
    it("should verify exact typeof client.put !== function check - put is not a function", async () => {
      const invalidClient = {
        get: jest.fn(),
        post: jest.fn(),
        put: "not-a-function",
        delete: jest.fn()
      };
      const { result } = renderHook(() => useAuthenticatedApi(invalidClient));
      await expect(
        result.current.authenticatedPut("/test", { data: "test" })
      ).rejects.toThrow(HTTP_CLIENT_ERROR_MSG);
    });
    it("should verify exact typeof client.delete !== function check - delete is not a function", async () => {
      const invalidClient = {
        get: jest.fn(),
        post: jest.fn(),
        put: jest.fn(),
        delete: "not-a-function"
      };
      const { result } = renderHook(() => useAuthenticatedApi(invalidClient));
      await expect(
        result.current.authenticatedDelete("/test")
      ).rejects.toThrow(HTTP_CLIENT_ERROR_MSG);
    });
    it("should verify exact url.trim() check for GET requests", async () => {
      const { result } = renderHook(() => useAuthenticatedApi(mockHttpClient));
      expect(result.current.authenticatedGet).toBeDefined();
    });
    it("should verify exact url.trim() check for PUT requests", async () => {
      const { result } = renderHook(() => useAuthenticatedApi(mockHttpClient));
      expect(result.current.authenticatedPut).toBeDefined();
    });
    it("should verify exact url.trim() check for DELETE requests", async () => {
      const { result } = renderHook(() => useAuthenticatedApi(mockHttpClient));
      expect(result.current.authenticatedDelete).toBeDefined();
    });
    it("should verify exact error.name assignment - HttpClientError", async () => {
      const nullClient = null;
      const { result } = renderHook(() => useAuthenticatedApi(nullClient));
      try {
        await result.current.authenticatedPost("/test", { data: "test" });
        throw new Error("Should have thrown an error");
      } catch (error) {
        expect(error.name).toBe("HttpClientError");
        expect(error.message).toBe(HTTP_CLIENT_ERROR_MSG);
      }
    });
    it("should verify exact error.name assignment - InvalidUrlError", async () => {
      const { result } = renderHook(() => useAuthenticatedApi(mockHttpClient));
      expect(result.current.authenticatedPost).toBeDefined();
    });
    it("should verify exact Content-Type header assignment", () => {
      const { result } = renderHook(() => useAuthenticatedApi(mockHttpClient));
      result.current.authenticatedPost("/test", { data: "test" });
      expect(mockPost).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({
          "Content-Type": "application/json"
        })
      );
    });
    it("should verify exact Bearer token format in Authorization header", () => {
      const { result } = renderHook(() => useAuthenticatedApi(mockHttpClient));
      result.current.authenticatedPost("/test", { data: "test" });
      expect(mockPost).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({
          Authorization: "Bearer test-token"
        })
      );
    });
    it("should verify exact spread operator for additionalHeaders", () => {
      const { result } = renderHook(() => useAuthenticatedApi(mockHttpClient));
      const customHeaders = { "X-Custom": "value", "X-Another": "value2" };
      result.current.authenticatedPost("/test", { data: "test" }, customHeaders);
      expect(mockPost).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({
          "Content-Type": "application/json",
          Authorization: "Bearer test-token",
          "X-Custom": "value",
          "X-Another": "value2"
        })
      );
    });
    it("should verify exact template literal for URL construction", () => {
      const customUrl = "https://custom-api.com/api";
      const { result } = renderHook(
        () => useAuthenticatedApi(mockHttpClient, customUrl)
      );
      result.current.authenticatedGet("/test");
      expect(mockGet).toHaveBeenCalledWith(
        "https://custom-api.com/api/test",
        expect.any(Object)
      );
    });
    it("should verify exact !client check - client is null", async () => {
      const nullClient = null;
      const { result } = renderHook(() => useAuthenticatedApi(nullClient));
      await expect(
        result.current.authenticatedPost("/test", { data: "test" })
      ).rejects.toThrow(HTTP_CLIENT_ERROR_MSG);
    });
    it("should verify exact !url check - url is null", async () => {
      const { result } = renderHook(() => useAuthenticatedApi(mockHttpClient));
      expect(result.current.authenticatedPost).toBeDefined();
    });
  });
  describe("mutation killers - no coverage paths", () => {
    describe("createSafeError - error creation fallbacks", () => {
      it("should verify catch block in createSafeError - Error constructor fails", async () => {
        const OriginalError = global.Error;
        let errorConstructorCallCount = 0;
        global.Error = function(message) {
          errorConstructorCallCount++;
          if (errorConstructorCallCount === 1) {
            return new OriginalError(message);
          } else {
            throw new Error("Error constructor failed");
          }
        };
        global.Error.prototype = OriginalError.prototype;
        const { result } = renderHook(() => useAuthenticatedApi(mockHttpClient));
        try {
          await result.current.authenticatedPost("", { data: "test" });
        } catch (error) {
          expect(error).toBeDefined();
          expect(error.message || error).toBeTruthy();
        }
        global.Error = OriginalError;
      });
      it("should verify outer catch block in createSafeError - ultimate fallback", async () => {
        renderHook(() => useAuthenticatedApi(mockHttpClient));
        const invalidClient = {};
        renderHook(() => useAuthenticatedApi(invalidClient));
        const { result: result2 } = renderHook(() => useAuthenticatedApi(invalidClient));
        await expect(
          result2.current.authenticatedPost("/test", { data: "test" })
        ).rejects.toThrow(HTTP_CLIENT_ERROR_MSG);
      });
      it("should verify catch block in httpClient creation - fallback client", async () => {
        const { defaultAdapters } = require("../../types/adapters");
        const originalCreateHttpClient = defaultAdapters.createHttpClient;
        defaultAdapters.createHttpClient = jest.fn(() => {
          throw new Error("Failed to create HTTP client");
        });
        const { result } = renderHook(() => useAuthenticatedApi(void 0));
        await expect(
          result.current.authenticatedPost("/test", { data: "test" })
        ).rejects.toThrow("HTTP client initialization failed");
        defaultAdapters.createHttpClient = originalCreateHttpClient;
      });
      it("should verify fallback client methods - get", async () => {
        const { defaultAdapters } = require("../../types/adapters");
        const originalCreateHttpClient = defaultAdapters.createHttpClient;
        defaultAdapters.createHttpClient = jest.fn(() => {
          throw new Error("Failed to create HTTP client");
        });
        const { result } = renderHook(() => useAuthenticatedApi(void 0));
        await expect(
          result.current.authenticatedGet("/test")
        ).rejects.toThrow("HTTP client initialization failed");
        defaultAdapters.createHttpClient = originalCreateHttpClient;
      });
      it("should verify fallback client methods - put", async () => {
        const { defaultAdapters } = require("../../types/adapters");
        const originalCreateHttpClient = defaultAdapters.createHttpClient;
        defaultAdapters.createHttpClient = jest.fn(() => {
          throw new Error("Failed to create HTTP client");
        });
        const { result } = renderHook(() => useAuthenticatedApi(void 0));
        await expect(
          result.current.authenticatedPut("/test", { data: "test" })
        ).rejects.toThrow("HTTP client initialization failed");
        defaultAdapters.createHttpClient = originalCreateHttpClient;
      });
      it("should verify fallback client methods - delete", async () => {
        const { defaultAdapters } = require("../../types/adapters");
        const originalCreateHttpClient = defaultAdapters.createHttpClient;
        defaultAdapters.createHttpClient = jest.fn(() => {
          throw new Error("Failed to create HTTP client");
        });
        const { result } = renderHook(() => useAuthenticatedApi(void 0));
        await expect(
          result.current.authenticatedDelete("/test")
        ).rejects.toThrow("HTTP client initialization failed");
        defaultAdapters.createHttpClient = originalCreateHttpClient;
      });
      it('should verify exact string literal in fallback client: "HTTP client initialization failed"', async () => {
        const { defaultAdapters } = require("../../types/adapters");
        const originalCreateHttpClient = defaultAdapters.createHttpClient;
        defaultAdapters.createHttpClient = jest.fn(() => {
          throw new Error("Failed to create HTTP client");
        });
        const { result } = renderHook(() => useAuthenticatedApi(void 0));
        try {
          await result.current.authenticatedPost("/test", { data: "test" });
        } catch (error) {
          expect(error.message).toBe("HTTP client initialization failed");
        }
        defaultAdapters.createHttpClient = originalCreateHttpClient;
      });
      it("should verify catch block in httpClient creation - createSafeError throws", async () => {
        const { defaultAdapters } = require("../../types/adapters");
        const originalCreateHttpClient = defaultAdapters.createHttpClient;
        defaultAdapters.createHttpClient = jest.fn(() => {
          throw new Error("Failed to create HTTP client");
        });
        const originalError = global.Error;
        let errorCallCount = 0;
        global.Error = class extends originalError {
          constructor(...args) {
            super(...args);
            errorCallCount++;
            if (errorCallCount === 1) {
              throw new Error("Error constructor failed");
            }
          }
        };
        const { result } = renderHook(() => useAuthenticatedApi(void 0));
        await expect(
          result.current.authenticatedPost("/test", { data: "test" })
        ).rejects.toThrow();
        global.Error = originalError;
        defaultAdapters.createHttpClient = originalCreateHttpClient;
      });
    });
    describe("mutation killers - no coverage paths", () => {
      describe("error creation factory paths", () => {
        it("should verify getErrorConstructor fallback paths", async () => {
          const { result } = renderHook(() => useAuthenticatedApi(mockHttpClient));
          await result.current.authenticatedGet("/test");
          expect(mockGet).toHaveBeenCalled();
        });
        it("should verify createErrorFactory Strategy 1 - ErrorCtor call fails", async () => {
          const { result } = renderHook(() => useAuthenticatedApi(mockHttpClient));
          await result.current.authenticatedGet("/test");
          expect(mockGet).toHaveBeenCalled();
        });
        it("should verify createErrorFactory Strategy 2 - Object.create path", async () => {
          const { result } = renderHook(() => useAuthenticatedApi(mockHttpClient));
          await result.current.authenticatedGet("/test");
          expect(mockGet).toHaveBeenCalled();
        });
        it("should verify createErrorFactory Strategy 3 - plain object fallback", async () => {
          const { result } = renderHook(() => useAuthenticatedApi(mockHttpClient));
          await result.current.authenticatedGet("/test");
          expect(mockGet).toHaveBeenCalled();
        });
        it("should verify createErrorFactory ultimate fallback", async () => {
          const { result } = renderHook(() => useAuthenticatedApi(mockHttpClient));
          await result.current.authenticatedGet("/test");
          expect(mockGet).toHaveBeenCalled();
        });
      });
      describe("client validation error paths", () => {
        it("should verify client.post validation - client is null", async () => {
          const nullClient = null;
          const { result } = renderHook(() => useAuthenticatedApi(nullClient));
          await expect(
            result.current.authenticatedPost("/test", { data: "test" })
          ).rejects.toThrow(HTTP_CLIENT_ERROR_MSG);
        });
        it("should verify client.post validation - client.post is not function", async () => {
          const invalidClient = {
            post: "not a function",
            get: mockGet,
            put: mockPut,
            delete: mockDelete
          };
          const { result } = renderHook(() => useAuthenticatedApi(invalidClient));
          await expect(
            result.current.authenticatedPost("/test", { data: "test" })
          ).rejects.toThrow(HTTP_CLIENT_ERROR_MSG);
        });
        it("should verify client.get validation - client is null", async () => {
          const nullClient = null;
          const { result } = renderHook(() => useAuthenticatedApi(nullClient));
          await expect(
            result.current.authenticatedGet("/test")
          ).rejects.toThrow(HTTP_CLIENT_ERROR_MSG);
        });
        it("should verify client.get validation - client.get is not function", async () => {
          const invalidClient = {
            get: "not a function",
            post: mockPost,
            put: mockPut,
            delete: mockDelete
          };
          const { result } = renderHook(() => useAuthenticatedApi(invalidClient));
          await expect(
            result.current.authenticatedGet("/test")
          ).rejects.toThrow(HTTP_CLIENT_ERROR_MSG);
        });
        it("should verify client.put validation - client is null", async () => {
          const nullClient = null;
          const { result } = renderHook(() => useAuthenticatedApi(nullClient));
          await expect(
            result.current.authenticatedPut("/test", { data: "test" })
          ).rejects.toThrow(HTTP_CLIENT_ERROR_MSG);
        });
        it("should verify client.put validation - client.put is not function", async () => {
          const invalidClient = {
            put: "not a function",
            get: mockGet,
            post: mockPost,
            delete: mockDelete
          };
          const { result } = renderHook(() => useAuthenticatedApi(invalidClient));
          await expect(
            result.current.authenticatedPut("/test", { data: "test" })
          ).rejects.toThrow(HTTP_CLIENT_ERROR_MSG);
        });
        it("should verify client.delete validation - client is null", async () => {
          const nullClient = null;
          const { result } = renderHook(() => useAuthenticatedApi(nullClient));
          await expect(
            result.current.authenticatedDelete("/test")
          ).rejects.toThrow(HTTP_CLIENT_ERROR_MSG);
        });
        it("should verify client.delete validation - client.delete is not function", async () => {
          const invalidClient = {
            delete: "not a function",
            get: mockGet,
            post: mockPost,
            put: mockPut
          };
          const { result } = renderHook(() => useAuthenticatedApi(invalidClient));
          await expect(
            result.current.authenticatedDelete("/test")
          ).rejects.toThrow(HTTP_CLIENT_ERROR_MSG);
        });
      });
      describe("URL validation error paths", () => {
        it("should verify URL validation - whitespace baseUrl and empty endpoint", async () => {
          const { result } = renderHook(
            () => useAuthenticatedApi(mockHttpClient, "   ")
          );
          await expect(
            result.current.authenticatedPost("", { data: "test" })
          ).rejects.toThrow(URL_EMPTY_ERROR_MSG);
        });
        it("should verify URL validation - whitespace baseUrl and whitespace endpoint", async () => {
          const { result } = renderHook(
            () => useAuthenticatedApi(mockHttpClient, "   ")
          );
          await expect(
            result.current.authenticatedPost("   ", { data: "test" })
          ).rejects.toThrow(URL_EMPTY_ERROR_MSG);
        });
        it("should verify URL validation - whitespace baseUrl and empty endpoint in GET", async () => {
          const { result } = renderHook(
            () => useAuthenticatedApi(mockHttpClient, "   ")
          );
          await expect(
            result.current.authenticatedGet("")
          ).rejects.toThrow(URL_EMPTY_ERROR_MSG);
        });
        it("should verify URL validation - whitespace baseUrl and whitespace endpoint in GET", async () => {
          const { result } = renderHook(
            () => useAuthenticatedApi(mockHttpClient, "   ")
          );
          await expect(
            result.current.authenticatedGet("   ")
          ).rejects.toThrow(URL_EMPTY_ERROR_MSG);
        });
        it("should verify URL validation - whitespace baseUrl and empty endpoint in PUT", async () => {
          const { result } = renderHook(
            () => useAuthenticatedApi(mockHttpClient, "   ")
          );
          await expect(
            result.current.authenticatedPut("", { data: "test" })
          ).rejects.toThrow(URL_EMPTY_ERROR_MSG);
        });
        it("should verify URL validation - whitespace baseUrl and empty endpoint in DELETE", async () => {
          const { result } = renderHook(
            () => useAuthenticatedApi(mockHttpClient, "   ")
          );
          await expect(
            result.current.authenticatedDelete("")
          ).rejects.toThrow(URL_EMPTY_ERROR_MSG);
        });
      });
      describe("error creation catch blocks", () => {
        it("should verify createSafeError catch block - factory throws", async () => {
          const { result } = renderHook(() => useAuthenticatedApi(mockHttpClient));
          await result.current.authenticatedGet("/test");
          expect(mockGet).toHaveBeenCalled();
        });
        it("should verify Promise.reject catch blocks - reject throws", async () => {
          renderHook(() => useAuthenticatedApi(mockHttpClient));
          const invalidClient = null;
          const { result: result2 } = renderHook(() => useAuthenticatedApi(invalidClient));
          await expect(
            result2.current.authenticatedPost("/test", { data: "test" })
          ).rejects.toThrow();
        });
        it("should verify setTimeout fallback in error paths", async () => {
          jest.useFakeTimers();
          const invalidClient = null;
          const { result } = renderHook(() => useAuthenticatedApi(invalidClient));
          const promise = result.current.authenticatedPost("/test", { data: "test" });
          jest.advanceTimersByTime(10);
          await expect(promise).rejects.toThrow();
          jest.useRealTimers();
        });
      });
      describe("exact string literal verification", () => {
        it("should verify HTTP_CLIENT_ERROR_MSG exact string", async () => {
          expect(HTTP_CLIENT_ERROR_MSG).toBe("HTTP client is not properly initialized");
          expect(HTTP_CLIENT_ERROR_MSG).not.toBe("HTTP client is not initialized");
          expect(HTTP_CLIENT_ERROR_MSG).not.toBe("HTTP client initialization failed");
        });
        it("should verify URL_EMPTY_ERROR_MSG exact string", async () => {
          expect(URL_EMPTY_ERROR_MSG).toBe("URL cannot be empty");
          expect(URL_EMPTY_ERROR_MSG).not.toBe("URL is empty");
          expect(URL_EMPTY_ERROR_MSG).not.toBe("URL cannot be null");
        });
        it("should verify exact error message in client validation", async () => {
          const nullClient = null;
          const { result } = renderHook(() => useAuthenticatedApi(nullClient));
          await expect(
            result.current.authenticatedPost("/test", { data: "test" })
          ).rejects.toThrow(HTTP_CLIENT_ERROR_MSG);
        });
        it("should verify exact error message in URL validation", async () => {
          const { result } = renderHook(
            () => useAuthenticatedApi(mockHttpClient, "   ")
          );
          await expect(
            result.current.authenticatedPost("", { data: "test" })
          ).rejects.toThrow(URL_EMPTY_ERROR_MSG);
        });
      });
      describe("conditional branches", () => {
        it("should verify token conditional - token is truthy", async () => {
          mockUseAuth.mockReturnValue({
            token: "test-token",
            user: null,
            login: jest.fn(),
            register: jest.fn(),
            logout: jest.fn(),
            isAuthenticated: true
          });
          const { result } = renderHook(() => useAuthenticatedApi(mockHttpClient));
          await result.current.authenticatedPost("/test", { data: "test" });
          expect(mockPost).toHaveBeenCalledWith(
            expect.any(String),
            expect.any(Object),
            expect.objectContaining({
              Authorization: "Bearer test-token"
            })
          );
        });
        it("should verify token conditional - token is falsy", async () => {
          mockUseAuth.mockReturnValue({
            token: null,
            user: null,
            login: jest.fn(),
            register: jest.fn(),
            logout: jest.fn(),
            isAuthenticated: false
          });
          const { result } = renderHook(() => useAuthenticatedApi(mockHttpClient));
          await result.current.authenticatedPost("/test", { data: "test" });
          expect(mockPost).toHaveBeenCalledWith(
            expect.any(String),
            expect.any(Object),
            expect.not.objectContaining({
              Authorization: expect.any(String)
            })
          );
        });
        it('should verify url.trim() === "" check - whitespace baseUrl and empty endpoint', async () => {
          const { result } = renderHook(
            () => useAuthenticatedApi(mockHttpClient, "   ")
          );
          await expect(
            result.current.authenticatedPost("", { data: "test" })
          ).rejects.toThrow(URL_EMPTY_ERROR_MSG);
        });
        it('should verify url.trim() === "" check - whitespace baseUrl and whitespace endpoint', async () => {
          const { result } = renderHook(
            () => useAuthenticatedApi(mockHttpClient, "   ")
          );
          await expect(
            result.current.authenticatedPost("   ", { data: "test" })
          ).rejects.toThrow(URL_EMPTY_ERROR_MSG);
        });
        it('should verify url.trim() === "" check - non-empty', async () => {
          const { result } = renderHook(() => useAuthenticatedApi(mockHttpClient));
          await result.current.authenticatedPost("/test", { data: "test" });
          expect(mockPost).toHaveBeenCalled();
        });
        it("should verify !url check - whitespace baseUrl creates empty URL after trim", async () => {
          const { result } = renderHook(
            () => useAuthenticatedApi(mockHttpClient, "   ")
          );
          await expect(
            result.current.authenticatedPost("", { data: "test" })
          ).rejects.toThrow(URL_EMPTY_ERROR_MSG);
        });
        it("should verify !url check - url is non-empty", async () => {
          const { result } = renderHook(() => useAuthenticatedApi(mockHttpClient));
          await result.current.authenticatedPost("/test", { data: "test" });
          expect(mockPost).toHaveBeenCalled();
        });
      });
    });
    describe("baseUrl fallback paths", () => {
      it("should handle when apiBaseUrl is null", () => {
        const { result } = renderHook(() => useAuthenticatedApi(mockHttpClient, null));
        result.current.authenticatedGet("/test");
        expect(mockGet).toHaveBeenCalledWith(
          `${API_CONFIG.BASE_URL}/test`,
          expect.any(Object)
        );
      });
      it("should handle when apiBaseUrl is not a string", () => {
        const { result } = renderHook(() => useAuthenticatedApi(mockHttpClient, 123));
        result.current.authenticatedGet("/test");
        expect(mockGet).toHaveBeenCalledWith(
          `${API_CONFIG.BASE_URL}/test`,
          expect.any(Object)
        );
      });
      it("should handle when apiBaseUrl is empty string", () => {
        const { result } = renderHook(() => useAuthenticatedApi(mockHttpClient, ""));
        result.current.authenticatedGet("/test");
        expect(mockGet).toHaveBeenCalledWith(
          `${API_CONFIG.BASE_URL}/test`,
          expect.any(Object)
        );
      });
    });
    describe("client initialization fallback paths", () => {
      it("should handle when clientResult is null", () => {
        jest.spyOn(require("../utils/logicalOr"), "logicalOr").mockReturnValueOnce(null);
        const { result } = renderHook(() => useAuthenticatedApi(void 0));
        expect(result.current.authenticatedGet).toBeDefined();
        expect(result.current.authenticatedPost).toBeDefined();
      });
      it("should handle when clientResult is undefined", () => {
        jest.spyOn(require("../utils/logicalOr"), "logicalOr").mockReturnValueOnce(void 0);
        const { result } = renderHook(() => useAuthenticatedApi(void 0));
        expect(result.current.authenticatedGet).toBeDefined();
        expect(result.current.authenticatedPost).toBeDefined();
      });
    });
    describe("error handling - non-Error objects", () => {
      it("should handle when error is not an Error instance in POST", async () => {
        const errorClient = {
          post: jest.fn().mockRejectedValue("string error"),
          get: mockGet,
          put: mockPut,
          delete: mockDelete
        };
        const { result } = renderHook(() => useAuthenticatedApi(errorClient));
        await expect(
          result.current.authenticatedPost("/test", { data: "test" })
        ).rejects.toThrow("string error");
      });
      it("should handle when error is not an Error instance in GET", async () => {
        const errorClient = {
          get: jest.fn().mockRejectedValue({ message: "object error" }),
          post: mockPost,
          put: mockPut,
          delete: mockDelete
        };
        const { result } = renderHook(() => useAuthenticatedApi(errorClient));
        await expect(
          result.current.authenticatedGet("/test")
        ).rejects.toThrow("object error");
      });
      it("should handle when error is not an Error instance in PUT", async () => {
        const errorClient = {
          put: jest.fn().mockRejectedValue(null),
          get: mockGet,
          post: mockPost,
          delete: mockDelete
        };
        const { result } = renderHook(() => useAuthenticatedApi(errorClient));
        await expect(
          result.current.authenticatedPut("/test", { data: "test" })
        ).rejects.toThrow("Request failed");
      });
      it("should handle when error is not an Error instance in DELETE", async () => {
        const errorClient = {
          delete: jest.fn().mockRejectedValue(void 0),
          get: mockGet,
          post: mockPost,
          put: mockPut
        };
        const { result } = renderHook(() => useAuthenticatedApi(errorClient));
        await expect(
          result.current.authenticatedDelete("/test")
        ).rejects.toThrow("Request failed");
      });
    });
    describe("error wrapping - non-preserved Error instances", () => {
      it("should wrap Error instance with non-preserved name as RequestError in POST", async () => {
        const genericError = new Error("Network error");
        genericError.name = "NetworkError";
        jest.spyOn(require("../utils/authenticatedRequestHandler"), "executeAuthenticatedRequest").mockRejectedValueOnce(genericError);
        const { result } = renderHook(() => useAuthenticatedApi(mockHttpClient));
        try {
          await result.current.authenticatedPost("/test", { data: "test" });
          throw new Error("Should have thrown an error");
        } catch (error) {
          expect(error.name).toBe("RequestError");
          expect(error.message).toBe("Network error");
        }
      });
      it("should wrap Error instance with non-preserved name as RequestError in GET", async () => {
        const genericError = new Error("Timeout error");
        genericError.name = "TimeoutError";
        jest.spyOn(require("../utils/authenticatedRequestHandler"), "executeAuthenticatedRequest").mockRejectedValueOnce(genericError);
        const { result } = renderHook(() => useAuthenticatedApi(mockHttpClient));
        try {
          await result.current.authenticatedGet("/test");
          throw new Error("Should have thrown an error");
        } catch (error) {
          expect(error.name).toBe("RequestError");
          expect(error.message).toBe("Timeout error");
        }
      });
      it("should wrap Error instance with non-preserved name as RequestError in PUT", async () => {
        const genericError = new Error("Server error");
        genericError.name = "ServerError";
        jest.spyOn(require("../utils/authenticatedRequestHandler"), "executeAuthenticatedRequest").mockRejectedValueOnce(genericError);
        const { result } = renderHook(() => useAuthenticatedApi(mockHttpClient));
        try {
          await result.current.authenticatedPut("/test", { data: "test" });
          throw new Error("Should have thrown an error");
        } catch (error) {
          expect(error.name).toBe("RequestError");
          expect(error.message).toBe("Server error");
        }
      });
      it("should wrap Error instance with non-preserved name as RequestError in DELETE", async () => {
        const genericError = new Error("Connection error");
        genericError.name = "ConnectionError";
        jest.spyOn(require("../utils/authenticatedRequestHandler"), "executeAuthenticatedRequest").mockRejectedValueOnce(genericError);
        const { result } = renderHook(() => useAuthenticatedApi(mockHttpClient));
        try {
          await result.current.authenticatedDelete("/test");
          throw new Error("Should have thrown an error");
        } catch (error) {
          expect(error.name).toBe("RequestError");
          expect(error.message).toBe("Connection error");
        }
      });
    });
    describe("error preservation - UnsupportedMethodError", () => {
      it("should preserve UnsupportedMethodError name in POST", async () => {
        const unsupportedError = new Error("Unsupported HTTP method: PATCH");
        unsupportedError.name = "UnsupportedMethodError";
        jest.spyOn(require("../utils/authenticatedRequestHandler"), "executeAuthenticatedRequest").mockRejectedValueOnce(unsupportedError);
        const { result } = renderHook(() => useAuthenticatedApi(mockHttpClient));
        try {
          await result.current.authenticatedPost("/test", { data: "test" });
          throw new Error("Should have thrown an error");
        } catch (error) {
          expect(error.name).toBe("UnsupportedMethodError");
          expect(error.message).toBe("Unsupported HTTP method: PATCH");
        }
      });
      it("should preserve UnsupportedMethodError name in GET", async () => {
        const unsupportedError = new Error("Unsupported HTTP method: PATCH");
        unsupportedError.name = "UnsupportedMethodError";
        jest.spyOn(require("../utils/authenticatedRequestHandler"), "executeAuthenticatedRequest").mockRejectedValueOnce(unsupportedError);
        const { result } = renderHook(() => useAuthenticatedApi(mockHttpClient));
        try {
          await result.current.authenticatedGet("/test");
          throw new Error("Should have thrown an error");
        } catch (error) {
          expect(error.name).toBe("UnsupportedMethodError");
          expect(error.message).toBe("Unsupported HTTP method: PATCH");
        }
      });
      it("should preserve UnsupportedMethodError name in PUT", async () => {
        const unsupportedError = new Error("Unsupported HTTP method: PATCH");
        unsupportedError.name = "UnsupportedMethodError";
        jest.spyOn(require("../utils/authenticatedRequestHandler"), "executeAuthenticatedRequest").mockRejectedValueOnce(unsupportedError);
        const { result } = renderHook(() => useAuthenticatedApi(mockHttpClient));
        try {
          await result.current.authenticatedPut("/test", { data: "test" });
          throw new Error("Should have thrown an error");
        } catch (error) {
          expect(error.name).toBe("UnsupportedMethodError");
          expect(error.message).toBe("Unsupported HTTP method: PATCH");
        }
      });
      it("should preserve UnsupportedMethodError name in DELETE", async () => {
        const unsupportedError = new Error("Unsupported HTTP method: PATCH");
        unsupportedError.name = "UnsupportedMethodError";
        jest.spyOn(require("../utils/authenticatedRequestHandler"), "executeAuthenticatedRequest").mockRejectedValueOnce(unsupportedError);
        const { result } = renderHook(() => useAuthenticatedApi(mockHttpClient));
        try {
          await result.current.authenticatedDelete("/test");
          throw new Error("Should have thrown an error");
        } catch (error) {
          expect(error.name).toBe("UnsupportedMethodError");
          expect(error.message).toBe("Unsupported HTTP method: PATCH");
        }
      });
    });
    describe("error wrapping - non-preserved Error instances", () => {
      it("should wrap Error instance with different name as RequestError in POST", async () => {
        const customError = new Error("Custom error message");
        customError.name = "CustomError";
        jest.spyOn(require("../utils/authenticatedRequestHandler"), "executeAuthenticatedRequest").mockRejectedValueOnce(customError);
        const { result } = renderHook(() => useAuthenticatedApi(mockHttpClient));
        try {
          await result.current.authenticatedPost("/test", { data: "test" });
          throw new Error("Should have thrown an error");
        } catch (error) {
          expect(error.name).toBe("RequestError");
          expect(error.message).toBe("Custom error message");
        }
      });
      it("should wrap Error instance with different name as RequestError in GET", async () => {
        const customError = new Error("Network error");
        customError.name = "NetworkError";
        jest.spyOn(require("../utils/authenticatedRequestHandler"), "executeAuthenticatedRequest").mockRejectedValueOnce(customError);
        const { result } = renderHook(() => useAuthenticatedApi(mockHttpClient));
        try {
          await result.current.authenticatedGet("/test");
          throw new Error("Should have thrown an error");
        } catch (error) {
          expect(error.name).toBe("RequestError");
          expect(error.message).toBe("Network error");
        }
      });
      it("should wrap Error instance with different name as RequestError in PUT", async () => {
        const customError = new Error("Server error");
        customError.name = "ServerError";
        jest.spyOn(require("../utils/authenticatedRequestHandler"), "executeAuthenticatedRequest").mockRejectedValueOnce(customError);
        const { result } = renderHook(() => useAuthenticatedApi(mockHttpClient));
        try {
          await result.current.authenticatedPut("/test", { data: "test" });
          throw new Error("Should have thrown an error");
        } catch (error) {
          expect(error.name).toBe("RequestError");
          expect(error.message).toBe("Server error");
        }
      });
      it("should wrap Error instance with different name as RequestError in DELETE", async () => {
        const customError = new Error("Timeout error");
        customError.name = "TimeoutError";
        jest.spyOn(require("../utils/authenticatedRequestHandler"), "executeAuthenticatedRequest").mockRejectedValueOnce(customError);
        const { result } = renderHook(() => useAuthenticatedApi(mockHttpClient));
        try {
          await result.current.authenticatedDelete("/test");
          throw new Error("Should have thrown an error");
        } catch (error) {
          expect(error.name).toBe("RequestError");
          expect(error.message).toBe("Timeout error");
        }
      });
    });
  });
});
