let capturedLegacyOptions;

jest.mock("http-proxy-middleware", () => ({
  legacyCreateProxyMiddleware: (opts) => {
    capturedLegacyOptions = opts;
    return function legacyStub(req, res, next) {
      next();
    };
  },
  createProxyMiddleware: () =>
    function createStub(req, res, next) {
      next();
    },
}));

const setupProxy = require("./setupProxy");

describe("setupProxy", () => {
  it("registers /api proxy with onError that returns 502 JSON with backend hint", () => {
    capturedLegacyOptions = undefined;
    const app = { use: jest.fn() };
    setupProxy(app);

    expect(capturedLegacyOptions).toBeDefined();
    expect(typeof capturedLegacyOptions.onError).toBe("function");

    const res = {
      headersSent: false,
      writeHead: jest.fn(),
      end: jest.fn(),
    };
    const err = Object.assign(new Error("connect ECONNREFUSED"), {
      code: "ECONNREFUSED",
    });
    capturedLegacyOptions.onError(err, {}, res);

    expect(res.writeHead).toHaveBeenCalledWith(
      502,
      expect.objectContaining({
        "Content-Type": expect.stringContaining("application/json"),
      }),
    );
    const payload = JSON.parse(res.end.mock.calls[0][0]);
    expect(payload.detail).toMatch(/127\.0\.0\.1:8000/);
    expect(payload.detail).toMatch(/uvicorn backend\.main:app/);
  });
});
