import { buildPastedGraph, normalizeCopyPayload } from "./canvasClipboard";

describe("canvasClipboard", () => {
  describe("buildPastedGraph", () => {
    it("returns empty arrays when clipboard has no nodes", () => {
      expect(buildPastedGraph({ nodes: [], edges: [] }, null)).toEqual({
        newNodes: [],
        newEdges: [],
      });
    });

    it("remaps one node and offsets when flowPosition is null", () => {
      const node = {
        id: "a1",
        type: "agent",
        position: { x: 10, y: 20 },
        data: { name: "A" },
      };
      const { newNodes, newEdges } = buildPastedGraph(
        { nodes: [node], edges: [] },
        null,
      );
      expect(newEdges).toEqual([]);
      expect(newNodes).toHaveLength(1);
      expect(newNodes[0].id).not.toBe("a1");
      expect(newNodes[0].id).toMatch(/^agent_\d+_0$/);
      expect(newNodes[0].position).toEqual({ x: 60, y: 70 });
      expect(newNodes[0].data).toEqual({ name: "A" });
    });

    it("positions group so bbox min aligns to flowPosition", () => {
      const n1 = {
        id: "a",
        type: "tool",
        position: { x: 100, y: 100 },
        data: {},
      };
      const n2 = {
        id: "b",
        type: "tool",
        position: { x: 200, y: 250 },
        data: {},
      };
      const { newNodes } = buildPastedGraph(
        { nodes: [n1, n2], edges: [] },
        { x: 500, y: 600 },
      );
      expect(newNodes[0].position).toEqual({ x: 500, y: 600 });
      expect(newNodes[1].position).toEqual({ x: 600, y: 750 });
    });

    it("remaps edge endpoints to new node ids", () => {
      const n1 = {
        id: "a",
        type: "agent",
        position: { x: 0, y: 0 },
        data: {},
      };
      const n2 = {
        id: "b",
        type: "agent",
        position: { x: 100, y: 0 },
        data: {},
      };
      const e1 = { id: "e-old", source: "a", target: "b" };
      const { newNodes, newEdges } = buildPastedGraph(
        { nodes: [n1, n2], edges: [e1] },
        { x: 0, y: 0 },
      );
      expect(newEdges).toHaveLength(1);
      expect(newEdges[0].id).toMatch(/^edge_\d+_0$/);
      expect(newEdges[0].source).toBe(newNodes[0].id);
      expect(newEdges[0].target).toBe(newNodes[1].id);
    });
  });

  describe("normalizeCopyPayload", () => {
    it("passes through nodes and edges arrays", () => {
      const n = { id: "1" };
      expect(normalizeCopyPayload({ nodes: [n], edges: [] })).toEqual({
        nodes: [n],
        edges: [],
      });
    });

    it("wraps a single node", () => {
      const n = { id: "1" };
      expect(normalizeCopyPayload(n)).toEqual({
        nodes: [n],
        edges: [],
      });
    });

    it("returns empty nodes for nullish payload", () => {
      expect(normalizeCopyPayload(null)).toEqual({ nodes: [], edges: [] });
    });
  });
});
