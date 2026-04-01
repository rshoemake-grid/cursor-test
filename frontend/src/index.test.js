jest.mock("./index.css", () => ({}));
jest.mock("@xyflow/react/dist/style.css", () => ({}));
jest.mock("./App.jsx", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: () => React.createElement("div", null, "Mocked App"),
  };
});

jest.mock("react-dom/client", () => {
  const mockRender = jest.fn();
  const mockCreateRoot = jest.fn(() => ({
    render: mockRender,
  }));
  return {
    __esModule: true,
    default: {
      createRoot: mockCreateRoot,
    },
    createRoot: mockCreateRoot,
  };
});

const mockRootElement = {
  id: "root",
};

describe("index entry", () => {
  beforeEach(() => {
    document.getElementById = jest.fn(() => mockRootElement);
  });

  it("bootstraps the React root", () => {
    jest.isolateModules(() => {
      require("./index.js");
    });
    expect(document.getElementById).toHaveBeenCalledWith("root");
  });
});
