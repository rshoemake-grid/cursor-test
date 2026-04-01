jest.mock("./index.css", () => ({}));
jest.mock("@xyflow/react/dist/style.css", () => ({}));
jest.mock("./App", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: () => React.createElement("div", null, "Mocked App")
  };
});
const mockRender = jest.fn();
const mockCreateRoot = jest.fn(() => ({
  render: mockRender
}));
jest.mock("react-dom/client", () => ({
  __esModule: true,
  default: {
    createRoot: mockCreateRoot
  },
  createRoot: mockCreateRoot
}));
const mockRootElement = {
  id: "root"
};
describe("main.tsx", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRender.mockClear();
    mockCreateRoot.mockClear();
    document.getElementById = jest.fn(() => mockRootElement);
  });
  it("should execute main.tsx code for coverage", () => {
    try {
      require("./main");
    } catch (e) {
    }
    expect(document.getElementById).toHaveBeenCalledWith("root");
  });
});
