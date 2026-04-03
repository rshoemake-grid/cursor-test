function safeFetch(fetchFn, url, options) {
  try {
    return fetchFn(url, options);
  } catch (error) {
    return Promise.reject(error);
  }
}
const HttpClientFactory = {
  /**
   * Create default HTTP client using fetch
   * Made mutation-resistant: always returns a valid client even if fetch is mutated
   */
  createHttpClient() {
    try {
      const fetchFn =
        typeof fetch !== "undefined"
          ? fetch
          : global.fetch || (() => Promise.resolve(new Response()));
      return {
        get: (url, headers) => {
          return safeFetch(fetchFn, url, { method: "GET", headers });
        },
        post: (url, body, headers) => {
          return safeFetch(fetchFn, url, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...headers },
            body: JSON.stringify(body),
          });
        },
        put: (url, body, headers) => {
          return safeFetch(fetchFn, url, {
            method: "PUT",
            headers: { "Content-Type": "application/json", ...headers },
            body: JSON.stringify(body),
          });
        },
        delete: (url, headers) => {
          return safeFetch(fetchFn, url, { method: "DELETE", headers });
        },
      };
    } catch (error) {
      const mockReject = () =>
        Promise.reject(new Error("HTTP client initialization failed"));
      return {
        get: mockReject,
        post: mockReject,
        put: mockReject,
        delete: mockReject,
      };
    }
  },
};
export { HttpClientFactory };
