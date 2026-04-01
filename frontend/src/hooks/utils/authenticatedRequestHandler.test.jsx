import {
  validateRequest,
  buildRequestHeaders,
  executeAuthenticatedRequest,
  HTTP_CLIENT_ERROR_MSG,
  URL_EMPTY_ERROR_MSG
} from "./authenticatedRequestHandler";
describe("authenticatedRequestHandler", () => {
  describe("validateRequest", () => {
    let mockClient;
    let context;
    beforeEach(() => {
      mockClient = {
        get: jest.fn(),
        post: jest.fn(),
        put: jest.fn(),
        delete: jest.fn()
      };
      context = {
        client: mockClient,
        baseUrl: "https://api.example.com",
        token: "test-token"
      };
    });
    it("should return null when client and URL are valid", () => {
      const config = {
        endpoint: "/test",
        method: "GET"
      };
      const result = validateRequest(config, context);
      expect(result).toBeNull();
    });
    it("should return HttpClientError when client is null", () => {
      const config = {
        endpoint: "/test",
        method: "GET"
      };
      const invalidContext = {
        ...context,
        client: null
      };
      const result = validateRequest(config, invalidContext);
      expect(result).not.toBeNull();
      expect(result?.name).toBe("HttpClientError");
      expect(result?.message).toBe(HTTP_CLIENT_ERROR_MSG);
    });
    it("should return HttpClientError when client is undefined", () => {
      const config = {
        endpoint: "/test",
        method: "GET"
      };
      const invalidContext = {
        ...context,
        client: void 0
      };
      const result = validateRequest(config, invalidContext);
      expect(result).not.toBeNull();
      expect(result?.name).toBe("HttpClientError");
      expect(result?.message).toBe(HTTP_CLIENT_ERROR_MSG);
    });
    it("should return HttpClientError when GET method is not a function", () => {
      const config = {
        endpoint: "/test",
        method: "GET"
      };
      const invalidClient = {
        ...mockClient,
        get: "not-a-function"
      };
      const invalidContext = {
        ...context,
        client: invalidClient
      };
      const result = validateRequest(config, invalidContext);
      expect(result).not.toBeNull();
      expect(result?.name).toBe("HttpClientError");
      expect(result?.message).toBe(HTTP_CLIENT_ERROR_MSG);
    });
    it("should return HttpClientError when POST method is not a function", () => {
      const config = {
        endpoint: "/test",
        method: "POST"
      };
      const invalidClient = {
        ...mockClient,
        post: null
      };
      const invalidContext = {
        ...context,
        client: invalidClient
      };
      const result = validateRequest(config, invalidContext);
      expect(result).not.toBeNull();
      expect(result?.name).toBe("HttpClientError");
      expect(result?.message).toBe(HTTP_CLIENT_ERROR_MSG);
    });
    it("should return HttpClientError when PUT method is not a function", () => {
      const config = {
        endpoint: "/test",
        method: "PUT"
      };
      const invalidClient = {
        ...mockClient,
        put: void 0
      };
      const invalidContext = {
        ...context,
        client: invalidClient
      };
      const result = validateRequest(config, invalidContext);
      expect(result).not.toBeNull();
      expect(result?.name).toBe("HttpClientError");
      expect(result?.message).toBe(HTTP_CLIENT_ERROR_MSG);
    });
    it("should return HttpClientError when DELETE method is not a function", () => {
      const config = {
        endpoint: "/test",
        method: "DELETE"
      };
      const invalidClient = {
        ...mockClient,
        delete: "not-a-function"
      };
      const invalidContext = {
        ...context,
        client: invalidClient
      };
      const result = validateRequest(config, invalidContext);
      expect(result).not.toBeNull();
      expect(result?.name).toBe("HttpClientError");
      expect(result?.message).toBe(HTTP_CLIENT_ERROR_MSG);
    });
    it("should return InvalidUrlError when URL is empty string", () => {
      const config = {
        endpoint: "",
        method: "GET"
      };
      const invalidContext = {
        ...context,
        baseUrl: ""
      };
      const result = validateRequest(config, invalidContext);
      expect(result).not.toBeNull();
      expect(result?.name).toBe("InvalidUrlError");
      expect(result?.message).toBe(URL_EMPTY_ERROR_MSG);
    });
    it("should return InvalidUrlError when URL is whitespace only", () => {
      const config = {
        endpoint: "   ",
        method: "GET"
      };
      const invalidContext = {
        ...context,
        baseUrl: "   "
      };
      const result = validateRequest(config, invalidContext);
      expect(result).not.toBeNull();
      expect(result?.name).toBe("InvalidUrlError");
      expect(result?.message).toBe(URL_EMPTY_ERROR_MSG);
    });
    it("should return InvalidUrlError when baseUrl is empty and endpoint is empty", () => {
      const config = {
        endpoint: "",
        method: "GET"
      };
      const invalidContext = {
        ...context,
        baseUrl: ""
      };
      const result = validateRequest(config, invalidContext);
      expect(result).not.toBeNull();
      expect(result?.name).toBe("InvalidUrlError");
      expect(result?.message).toBe(URL_EMPTY_ERROR_MSG);
    });
    it("should return InvalidUrlError when baseUrl is whitespace and endpoint is empty", () => {
      const config = {
        endpoint: "",
        method: "GET"
      };
      const invalidContext = {
        ...context,
        baseUrl: "   "
      };
      const result = validateRequest(config, invalidContext);
      expect(result).not.toBeNull();
      expect(result?.name).toBe("InvalidUrlError");
      expect(result?.message).toBe(URL_EMPTY_ERROR_MSG);
    });
    it("should return null when URL is valid (non-empty after trim)", () => {
      const config = {
        endpoint: "/test",
        method: "GET"
      };
      const result = validateRequest(config, context);
      expect(result).toBeNull();
    });
    it("should return null when URL has whitespace but is not empty after trim", () => {
      const config = {
        endpoint: "  /test  ",
        method: "GET"
      };
      const result = validateRequest(config, context);
      expect(result).toBeNull();
    });
  });
  describe("buildRequestHeaders", () => {
    it("should build headers with token and Content-Type for POST", () => {
      const headers = buildRequestHeaders("test-token", "POST");
      expect(headers.Authorization).toBe("Bearer test-token");
      expect(headers["Content-Type"]).toBe("application/json");
    });
    it("should build headers with token and Content-Type for PUT", () => {
      const headers = buildRequestHeaders("test-token", "PUT");
      expect(headers.Authorization).toBe("Bearer test-token");
      expect(headers["Content-Type"]).toBe("application/json");
    });
    it("should build headers with token but no Content-Type for GET", () => {
      const headers = buildRequestHeaders("test-token", "GET");
      expect(headers.Authorization).toBe("Bearer test-token");
      expect(headers["Content-Type"]).toBeUndefined();
    });
    it("should build headers with token but no Content-Type for DELETE", () => {
      const headers = buildRequestHeaders("test-token", "DELETE");
      expect(headers.Authorization).toBe("Bearer test-token");
      expect(headers["Content-Type"]).toBeUndefined();
    });
    it("should build headers without token when token is null", () => {
      const headers = buildRequestHeaders(null, "POST");
      expect(headers.Authorization).toBeUndefined();
      expect(headers["Content-Type"]).toBe("application/json");
    });
    it("should build headers without token when token is empty string", () => {
      const headers = buildRequestHeaders("", "POST");
      expect(headers.Authorization).toBeUndefined();
      expect(headers["Content-Type"]).toBe("application/json");
    });
    it("should merge additional headers (Headers object)", () => {
      const additionalHeaders = new Headers();
      additionalHeaders.set("X-Custom-Header", "custom-value");
      additionalHeaders.set("Content-Type", "text/plain");
      const headers = buildRequestHeaders("test-token", "POST", additionalHeaders);
      expect(headers.Authorization).toBe("Bearer test-token");
      expect(headers["Content-Type"]).toBe("application/json");
      expect(headers["x-custom-header"]).toBe("custom-value");
    });
    it("should merge additional headers (array format)", () => {
      const additionalHeaders = [
        ["X-Custom-Header", "custom-value"],
        ["Content-Type", "text/xml"]
      ];
      const headers = buildRequestHeaders("test-token", "POST", additionalHeaders);
      expect(headers.Authorization).toBe("Bearer test-token");
      expect(headers["Content-Type"]).toBe("text/xml");
      expect(headers["X-Custom-Header"]).toBe("custom-value");
    });
    it("should merge additional headers (object format)", () => {
      const additionalHeaders = {
        "X-Custom-Header": "custom-value",
        "Content-Type": "text/html"
      };
      const headers = buildRequestHeaders("test-token", "POST", additionalHeaders);
      expect(headers.Authorization).toBe("Bearer test-token");
      expect(headers["Content-Type"]).toBe("text/html");
      expect(headers["X-Custom-Header"]).toBe("custom-value");
    });
    it("should preserve Authorization from token even when additional headers have it", () => {
      const additionalHeaders = {
        "Authorization": "Bearer wrong-token"
      };
      const headers = buildRequestHeaders("correct-token", "POST", additionalHeaders);
      expect(headers.Authorization).toBe("Bearer correct-token");
    });
    it("should not add Content-Type if already set in additional headers", () => {
      const additionalHeaders = {
        "Content-Type": "application/xml"
      };
      const headers = buildRequestHeaders("test-token", "POST", additionalHeaders);
      expect(headers["Content-Type"]).toBe("application/xml");
    });
    it("should add Content-Type if not set in additional headers for POST", () => {
      const additionalHeaders = {
        "X-Custom-Header": "value"
      };
      const headers = buildRequestHeaders("test-token", "POST", additionalHeaders);
      expect(headers["Content-Type"]).toBe("application/json");
    });
    it("should not add Content-Type for GET even with additional headers", () => {
      const additionalHeaders = {
        "X-Custom-Header": "value"
      };
      const headers = buildRequestHeaders("test-token", "GET", additionalHeaders);
      expect(headers["Content-Type"]).toBeUndefined();
    });
  });
  describe("executeAuthenticatedRequest", () => {
    let mockClient;
    let context;
    beforeEach(() => {
      mockClient = {
        get: jest.fn().mockResolvedValue({ data: "get-response" }),
        post: jest.fn().mockResolvedValue({ data: "post-response" }),
        put: jest.fn().mockResolvedValue({ data: "put-response" }),
        delete: jest.fn().mockResolvedValue({ data: "delete-response" })
      };
      context = {
        client: mockClient,
        baseUrl: "https://api.example.com",
        token: "test-token"
      };
    });
    it("should execute GET request successfully", async () => {
      const config = {
        endpoint: "/test",
        method: "GET"
      };
      const result = await executeAuthenticatedRequest(config, context);
      expect(result).toEqual({ data: "get-response" });
      expect(mockClient.get).toHaveBeenCalledWith(
        "https://api.example.com/test",
        expect.objectContaining({
          Authorization: "Bearer test-token"
        })
      );
    });
    it("should execute POST request successfully", async () => {
      const config = {
        endpoint: "/test",
        method: "POST",
        data: { key: "value" }
      };
      const result = await executeAuthenticatedRequest(config, context);
      expect(result).toEqual({ data: "post-response" });
      expect(mockClient.post).toHaveBeenCalledWith(
        "https://api.example.com/test",
        { key: "value" },
        expect.objectContaining({
          Authorization: "Bearer test-token",
          "Content-Type": "application/json"
        })
      );
    });
    it("should execute PUT request successfully", async () => {
      const config = {
        endpoint: "/test",
        method: "PUT",
        data: { key: "value" }
      };
      const result = await executeAuthenticatedRequest(config, context);
      expect(result).toEqual({ data: "put-response" });
      expect(mockClient.put).toHaveBeenCalledWith(
        "https://api.example.com/test",
        { key: "value" },
        expect.objectContaining({
          Authorization: "Bearer test-token",
          "Content-Type": "application/json"
        })
      );
    });
    it("should execute DELETE request successfully", async () => {
      const config = {
        endpoint: "/test",
        method: "DELETE"
      };
      const result = await executeAuthenticatedRequest(config, context);
      expect(result).toEqual({ data: "delete-response" });
      expect(mockClient.delete).toHaveBeenCalledWith(
        "https://api.example.com/test",
        expect.objectContaining({
          Authorization: "Bearer test-token"
        })
      );
    });
    it("should reject with HttpClientError when client is invalid", async () => {
      const config = {
        endpoint: "/test",
        method: "GET"
      };
      const invalidContext = {
        ...context,
        client: null
      };
      await expect(
        executeAuthenticatedRequest(config, invalidContext)
      ).rejects.toMatchObject({
        name: "HttpClientError",
        message: HTTP_CLIENT_ERROR_MSG
      });
    });
    it("should reject with InvalidUrlError when URL is empty", async () => {
      const config = {
        endpoint: "",
        method: "GET"
      };
      const invalidContext = {
        ...context,
        baseUrl: ""
      };
      await expect(
        executeAuthenticatedRequest(config, invalidContext)
      ).rejects.toMatchObject({
        name: "InvalidUrlError",
        message: URL_EMPTY_ERROR_MSG
      });
    });
    it("should reject with UnsupportedMethodError for unsupported method", async () => {
      const clientWithPatch = {
        ...mockClient,
        patch: jest.fn()
      };
      const contextWithPatch = {
        ...context,
        client: clientWithPatch
      };
      const config = {
        endpoint: "/test",
        method: "PATCH"
      };
      await expect(
        executeAuthenticatedRequest(config, contextWithPatch)
      ).rejects.toMatchObject({
        name: "UnsupportedMethodError",
        message: "Unsupported HTTP method: PATCH"
      });
    });
    it("should handle synchronous errors from request function", async () => {
      const syncError = new Error("Synchronous error");
      mockClient.get = jest.fn().mockImplementation(() => {
        throw syncError;
      });
      const config = {
        endpoint: "/test",
        method: "GET"
      };
      await expect(
        executeAuthenticatedRequest(config, context)
      ).rejects.toBe(syncError);
    });
    it("should handle promise rejection from request function", async () => {
      const asyncError = new Error("Async error");
      mockClient.get = jest.fn().mockRejectedValue(asyncError);
      const config = {
        endpoint: "/test",
        method: "GET"
      };
      await expect(
        executeAuthenticatedRequest(config, context)
      ).rejects.toBe(asyncError);
    });
    it("should pass additional headers to request", async () => {
      const config = {
        endpoint: "/test",
        method: "POST",
        data: { key: "value" },
        additionalHeaders: {
          "X-Custom-Header": "custom-value"
        }
      };
      await executeAuthenticatedRequest(config, context);
      expect(mockClient.post).toHaveBeenCalledWith(
        "https://api.example.com/test",
        { key: "value" },
        expect.objectContaining({
          "X-Custom-Header": "custom-value",
          Authorization: "Bearer test-token",
          "Content-Type": "application/json"
        })
      );
    });
  });
});
