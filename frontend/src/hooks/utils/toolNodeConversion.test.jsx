import { convertToolToNode, convertToolsToNodes } from "./toolNodeConversion";
import { TOOL_NODE } from "./marketplaceConstants";
describe("toolNodeConversion", () => {
  describe("convertToolToNode", () => {
    it("should convert tool to node with correct structure", () => {
      const tool = {
        name: "Test Tool",
        description: "Test Description",
        tool_config: { tool_name: "web_search" },
      };
      const position = { x: 100, y: 200 };
      const node = convertToolToNode(tool, position, 0);
      expect(node.id).toMatch(/^tool-\d+-0$/);
      expect(node.type).toBe(TOOL_NODE.TYPE);
      expect(node.position).toEqual(position);
      expect(node.draggable).toBe(true);
      expect(node.data.label).toBe("Test Tool");
      expect(node.data.name).toBe("Test Tool");
      expect(node.data.description).toBe("Test Description");
      expect(node.data.tool_config).toEqual({ tool_name: "web_search" });
      expect(node.data.inputs).toEqual([]);
    });
    it("should use label when name is missing", () => {
      const tool = {
        label: "Tool Label",
        tool_config: { tool_name: "calculator" },
      };
      const position = { x: 0, y: 0 };
      const node = convertToolToNode(tool, position, 0);
      expect(node.data.label).toBe("Tool Label");
      expect(node.data.name).toBe("Tool Label");
    });
    it("should use default label when both name and label are missing", () => {
      const tool = {
        tool_config: { tool_name: "calculator" },
      };
      const position = { x: 0, y: 0 };
      const node = convertToolToNode(tool, position, 0);
      expect(node.data.label).toBe(TOOL_NODE.DEFAULT_LABEL);
      expect(node.data.name).toBe(TOOL_NODE.DEFAULT_LABEL);
    });
    it("should use default tool_config when missing", () => {
      const tool = {
        name: "Test",
        tool_config: null,
      };
      const position = { x: 0, y: 0 };
      const node = convertToolToNode(tool, position, 0);
      expect(node.data.tool_config).toEqual({ tool_name: "calculator" });
    });
    it("should use default tool_config when tool_name is not a string", () => {
      const tool = {
        name: "Test",
        tool_config: { tool_name: 123 },
      };
      const position = { x: 0, y: 0 };
      const node = convertToolToNode(tool, position, 0);
      expect(node.data.tool_config).toEqual({ tool_name: "calculator" });
    });
    it("should return empty description when missing", () => {
      const tool = {
        name: "Test",
        tool_config: { tool_name: "calculator" },
      };
      const position = { x: 0, y: 0 };
      const node = convertToolToNode(tool, position, 0);
      expect(node.data.description).toBe("");
    });
  });
  describe("convertToolsToNodes", () => {
    it("should convert multiple tools to nodes", () => {
      const tools = [
        { name: "Tool 1", tool_config: { tool_name: "calculator" } },
        { name: "Tool 2", tool_config: { tool_name: "web_search" } },
        { name: "Tool 3", tool_config: { tool_name: "file_reader" } },
      ];
      const positions = [
        { x: 0, y: 0 },
        { x: 0, y: 150 },
        { x: 0, y: 300 },
      ];
      const nodes = convertToolsToNodes(tools, positions);
      expect(nodes).toHaveLength(3);
      expect(nodes[0].data.name).toBe("Tool 1");
      expect(nodes[1].data.name).toBe("Tool 2");
      expect(nodes[2].data.name).toBe("Tool 3");
      expect(nodes[0].data.tool_config.tool_name).toBe("calculator");
      expect(nodes[1].data.tool_config.tool_name).toBe("web_search");
      expect(nodes[2].data.tool_config.tool_name).toBe("file_reader");
      expect(nodes[0].position).toEqual(positions[0]);
      expect(nodes[1].position).toEqual(positions[1]);
      expect(nodes[2].position).toEqual(positions[2]);
    });
    it("should handle empty tools array", () => {
      const nodes = convertToolsToNodes([], []);
      expect(nodes).toHaveLength(0);
    });
  });
});
