describe("API_BASE_URL normalization (dynamic import)", () => {
  let savedReact;
  let savedVite;

  beforeEach(() => {
    savedReact = process.env.REACT_APP_API_BASE_URL;
    savedVite = process.env.VITE_API_BASE_URL;
    jest.resetModules();
  });

  afterEach(() => {
    if (savedReact === undefined) {
      delete process.env.REACT_APP_API_BASE_URL;
    } else {
      process.env.REACT_APP_API_BASE_URL = savedReact;
    }
    if (savedVite === undefined) {
      delete process.env.VITE_API_BASE_URL;
    } else {
      process.env.VITE_API_BASE_URL = savedVite;
    }
    jest.resetModules();
  });

  it("uses /api when REACT_APP_API_BASE_URL is /", async () => {
    process.env.REACT_APP_API_BASE_URL = "/";
    delete process.env.VITE_API_BASE_URL;
    const { API_CONFIG } = await import("./constants");
    expect(API_CONFIG.BASE_URL).toBe("/api");
  });

  it("uses /api when REACT_APP_API_BASE_URL is whitespace only", async () => {
    process.env.REACT_APP_API_BASE_URL = "   ";
    delete process.env.VITE_API_BASE_URL;
    const { API_CONFIG } = await import("./constants");
    expect(API_CONFIG.BASE_URL).toBe("/api");
  });

  it("appends /api when env is absolute origin only", async () => {
    process.env.REACT_APP_API_BASE_URL = "http://localhost:8000";
    delete process.env.VITE_API_BASE_URL;
    const { API_CONFIG } = await import("./constants");
    expect(API_CONFIG.BASE_URL).toBe("http://localhost:8000/api");
  });

  it("appends /api for origin with trailing slash", async () => {
    process.env.REACT_APP_API_BASE_URL = "http://127.0.0.1:8000/";
    delete process.env.VITE_API_BASE_URL;
    const { API_CONFIG } = await import("./constants");
    expect(API_CONFIG.BASE_URL).toBe("http://127.0.0.1:8000/api");
  });

  it("preserves absolute URL when path already includes /api", async () => {
    process.env.REACT_APP_API_BASE_URL = "http://localhost:8000/api";
    delete process.env.VITE_API_BASE_URL;
    const { API_CONFIG } = await import("./constants");
    expect(API_CONFIG.BASE_URL).toBe("http://localhost:8000/api");
  });
});
