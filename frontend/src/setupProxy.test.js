const legacyProxyOptionsCalls = [];

jest.mock("http-proxy-middleware", () => ({
  legacyCreateProxyMiddleware: (opts) => {
    legacyProxyOptionsCalls.push(opts);
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
  beforeEach(() => {
    legacyProxyOptionsCalls.length = 0;
  });

  it("registers /api proxy with onError that returns 502 JSON with backend hint", () => {
    const app = { use: jest.fn() };
    setupProxy(app);

    const apiProxyOptions = legacyProxyOptionsCalls[0];
    expect(apiProxyOptions).toBeDefined();
    expect(typeof apiProxyOptions.onError).toBe("function");

    const res = {
      headersSent: false,
      writeHead: jest.fn(),
      end: jest.fn(),
    };
    const err = Object.assign(new Error("connect ECONNREFUSED"), {
      code: "ECONNREFUSED",
    });
    apiProxyOptions.onError(err, {}, res);

    expect(res.writeHead).toHaveBeenCalledWith(
      502,
      expect.objectContaining({
        "Content-Type": expect.stringContaining("application/json"),
      }),
    );
    const payload = JSON.parse(res.end.mock.calls[0][0]);
    expect(payload.detail).toMatch(/127\.0\.0\.1:8000/);
    expect(payload.detail).toMatch(/uvicorn/);
  });

  it("registers /ws proxy toward API origin only (avoids /ws/ws path doubling on upgrade)", () => {
    const app = { use: jest.fn() };
    setupProxy(app);

    const wsProxyOptions = legacyProxyOptionsCalls.find((o) => o.ws === true);
    expect(wsProxyOptions).toBeDefined();
    expect(wsProxyOptions.target).toMatch(/^https?:\/\/[^/]+$/);
    expect(String(wsProxyOptions.target)).not.toMatch(/\/ws\/?$/);
  });
});
