import { renderHook } from "@testing-library/react";
import { useToolsData } from "./useToolsData";
import { getLocalStorageItem } from "../storage";
import { STORAGE_KEYS } from "../../config/constants";
jest.mock("../storage", () => ({
  getLocalStorageItem: jest.fn(),
}));
const mockGetLocalStorageItem = getLocalStorageItem;
describe("useToolsData", () => {
  const mockTool = {
    id: "tool-1",
    name: "Test Tool",
    label: "Test Tool",
    description: "Test Description",
    tool_config: { tool_name: "calculator" },
  };
  const defaultOptions = {
    storage: null,
    category: "",
    searchQuery: "",
    sortBy: "popular",
  };
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetLocalStorageItem.mockReturnValue([]);
  });
  it("should return fetchTools function", () => {
    const { result } = renderHook(() => useToolsData(defaultOptions));
    expect(result.current.fetchTools).toBeDefined();
    expect(typeof result.current.fetchTools).toBe("function");
  });
  it("should fetch tools from localStorage", async () => {
    mockGetLocalStorageItem.mockReturnValue([mockTool]);
    const { result } = renderHook(() => useToolsData(defaultOptions));
    const tools = await result.current.fetchTools();
    expect(mockGetLocalStorageItem).toHaveBeenCalledWith(
      STORAGE_KEYS.PUBLISHED_TOOLS,
      [],
    );
    expect(tools).toEqual([mockTool]);
  });
  it("should apply filters by category", async () => {
    const tools = [
      { ...mockTool, id: "tool-1", category: "automation", name: "Tool A" },
      { ...mockTool, id: "tool-2", category: "data", name: "Tool B" },
    ];
    mockGetLocalStorageItem.mockReturnValue(tools);
    const { result } = renderHook(() =>
      useToolsData({
        ...defaultOptions,
        category: "automation",
      }),
    );
    const filteredTools = await result.current.fetchTools();
    expect(filteredTools).toHaveLength(1);
    expect(filteredTools[0].category).toBe("automation");
  });
  it("should apply filters by search query", async () => {
    mockGetLocalStorageItem.mockReturnValue([mockTool]);
    const { result } = renderHook(() =>
      useToolsData({
        ...defaultOptions,
        searchQuery: "Test",
      }),
    );
    const filteredTools = await result.current.fetchTools();
    expect(filteredTools).toHaveLength(1);
    expect(filteredTools[0].name).toBe("Test Tool");
  });
  it("should return empty array when no tools in storage", async () => {
    mockGetLocalStorageItem.mockReturnValue([]);
    const { result } = renderHook(() => useToolsData(defaultOptions));
    const tools = await result.current.fetchTools();
    expect(tools).toEqual([]);
  });
  it("should sort tools by sortBy parameter", async () => {
    const tools = [
      { ...mockTool, id: "tool-1", name: "Z Tool", published_at: "2024-01-01" },
      { ...mockTool, id: "tool-2", name: "A Tool", published_at: "2024-01-02" },
    ];
    mockGetLocalStorageItem.mockReturnValue(tools);
    const { result } = renderHook(() =>
      useToolsData({
        ...defaultOptions,
        sortBy: "recent",
      }),
    );
    const sortedTools = await result.current.fetchTools();
    expect(sortedTools).toHaveLength(2);
    expect(sortedTools[0].published_at).toBe("2024-01-02");
  });
});
