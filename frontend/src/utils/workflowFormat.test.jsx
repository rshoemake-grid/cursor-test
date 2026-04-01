import {
  convertEdgesToWorkflowFormat,
  convertNodesToWorkflowFormat,
  createWorkflowDefinition,
  initializeReactFlowNodes,
  formatEdgesForReactFlow,
  normalizeNodeForStorage,
  workflowNodeToReactFlowNode
} from "./workflowFormat";
describe("workflowFormat utilities", () => {
  describe("convertEdgesToWorkflowFormat", () => {
    it("should convert React Flow edges to WorkflowEdge format", () => {
      const edges = [
        {
          id: "e1",
          source: "node1",
          target: "node2",
          label: "Connection"
        },
        {
          id: "e2",
          source: "node2",
          target: "node3"
        }
      ];
      const result = convertEdgesToWorkflowFormat(edges);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: "e1",
        source: "node1",
        target: "node2",
        label: "Connection"
      });
      expect(result[1]).toEqual({
        id: "e2",
        source: "node2",
        target: "node3",
        label: void 0
      });
    });
    it("should handle edges with ReactNode labels", () => {
      const ReactNodeLabel = { type: "span", props: {}, children: "React Node" };
      const edges = [
        {
          id: "e1",
          source: "node1",
          target: "node2",
          label: ReactNodeLabel
        }
      ];
      const result = convertEdgesToWorkflowFormat(edges);
      expect(result[0].label).toBeUndefined();
    });
    it("should handle empty edges array", () => {
      const result = convertEdgesToWorkflowFormat([]);
      expect(result).toEqual([]);
    });
  });
  describe("convertNodesToWorkflowFormat", () => {
    it("should convert React Flow nodes to WorkflowNode format", () => {
      const nodes = [
        {
          id: "node1",
          type: "agent",
          position: { x: 100, y: 200 },
          data: {
            name: "Test Agent",
            description: "Test description",
            agent_config: { model: "gpt-4" },
            inputs: []
          }
        }
      ];
      const result = convertNodesToWorkflowFormat(nodes);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: "node1",
        type: "agent",
        name: "Test Agent",
        description: "Test description",
        agent_config: { model: "gpt-4" },
        condition_config: void 0,
        loop_config: void 0,
        input_config: void 0,
        inputs: [],
        position: { x: 100, y: 200 }
      });
    });
    it("should use label if name is not available", () => {
      const nodes = [
        {
          id: "node1",
          type: "agent",
          position: { x: 0, y: 0 },
          data: {
            label: "Agent Label",
            description: "Test"
          }
        }
      ];
      const result = convertNodesToWorkflowFormat(nodes);
      expect(result[0].name).toBe("Agent Label");
    });
    it("should use node id if neither name nor label is available", () => {
      const nodes = [
        {
          id: "node1",
          type: "agent",
          position: { x: 0, y: 0 },
          data: {}
        }
      ];
      const result = convertNodesToWorkflowFormat(nodes);
      expect(result[0].name).toBe("node1");
    });
    it("should handle nodes with all config types", () => {
      const nodes = [
        {
          id: "node1",
          type: "agent",
          position: { x: 0, y: 0 },
          data: {
            name: "Test",
            agent_config: { model: "gpt-4" },
            condition_config: { condition_type: "equals" },
            loop_config: { loop_type: "for_each" },
            input_config: { mode: "read" },
            inputs: [{ name: "input1" }]
          }
        }
      ];
      const result = convertNodesToWorkflowFormat(nodes);
      expect(result[0].agent_config).toEqual({ model: "gpt-4" });
      expect(result[0].condition_config).toEqual({ condition_type: "equals" });
      expect(result[0].loop_config).toEqual({ loop_type: "for_each" });
      expect(result[0].input_config).toEqual({ mode: "read" });
      expect(result[0].inputs).toEqual([{ name: "input1" }]);
    });
    it("should handle empty inputs array", () => {
      const nodes = [
        {
          id: "node1",
          type: "agent",
          position: { x: 0, y: 0 },
          data: {
            name: "Test",
            inputs: null
          }
        }
      ];
      const result = convertNodesToWorkflowFormat(nodes);
      expect(result[0].inputs).toEqual([]);
    });
  });
  describe("createWorkflowDefinition", () => {
    it("should create workflow definition from component state", () => {
      const nodes = [
        {
          id: "node1",
          type: "agent",
          position: { x: 0, y: 0 },
          data: { name: "Agent 1" }
        }
      ];
      const edges = [
        {
          id: "e1",
          source: "node1",
          target: "node2"
        }
      ];
      const result = createWorkflowDefinition({
        name: "Test Workflow",
        description: "Test Description",
        nodes,
        edges,
        variables: { var1: "value1" }
      });
      expect(result.name).toBe("Test Workflow");
      expect(result.description).toBe("Test Description");
      expect(result.nodes).toHaveLength(1);
      expect(result.edges).toHaveLength(1);
      expect(result.variables).toEqual({ var1: "value1" });
    });
    it("should handle empty nodes and edges", () => {
      const result = createWorkflowDefinition({
        name: "Empty Workflow",
        description: "",
        nodes: [],
        edges: [],
        variables: {}
      });
      expect(result.nodes).toEqual([]);
      expect(result.edges).toEqual([]);
      expect(result.variables).toEqual({});
    });
  });
  describe("initializeReactFlowNodes", () => {
    it("should initialize nodes with default configs", () => {
      const nodes = [
        {
          id: "node1",
          type: "agent",
          position: { x: 0, y: 0 },
          data: {
            name: "Test"
          }
        }
      ];
      const result = initializeReactFlowNodes(nodes);
      expect(result[0].draggable).toBe(true);
      expect(result[0].selected).toBe(false);
      expect(result[0].data.agent_config).toEqual({});
      expect(result[0].data.condition_config).toEqual({});
      expect(result[0].data.loop_config).toEqual({});
      expect(result[0].data.input_config).toEqual({});
      expect(result[0].data.inputs).toEqual([]);
    });
    it("should preserve existing configs", () => {
      const nodes = [
        {
          id: "node1",
          type: "agent",
          position: { x: 0, y: 0 },
          data: {
            name: "Test",
            agent_config: { model: "gpt-4" },
            inputs: [{ name: "input1" }]
          }
        }
      ];
      const result = initializeReactFlowNodes(nodes);
      expect(result[0].data.agent_config).toEqual({ model: "gpt-4" });
      expect(result[0].data.inputs).toEqual([{ name: "input1" }]);
    });
    it("should convert null/undefined configs to empty objects", () => {
      const nodes = [
        {
          id: "node1",
          type: "agent",
          position: { x: 0, y: 0 },
          data: {
            name: "Test",
            agent_config: null,
            condition_config: void 0
          }
        }
      ];
      const result = initializeReactFlowNodes(nodes);
      expect(result[0].data.agent_config).toEqual({});
      expect(result[0].data.condition_config).toEqual({});
    });
  });
  describe("formatEdgesForReactFlow", () => {
    it("should format edges with sourceHandle and targetHandle", () => {
      const edges = [
        {
          id: "e1",
          source: "node1",
          target: "node2",
          sourceHandle: "true",
          targetHandle: "false"
        }
      ];
      const result = formatEdgesForReactFlow(edges);
      expect(result[0].sourceHandle).toBe("true");
      expect(result[0].targetHandle).toBe("false");
    });
    it("should handle snake_case source_handle", () => {
      const edges = [
        {
          id: "e1",
          source: "node1",
          target: "node2",
          source_handle: "output"
        }
      ];
      const result = formatEdgesForReactFlow(edges);
      expect(result[0].sourceHandle).toBe("output");
    });
    it("should convert boolean handles to strings", () => {
      const edges = [
        {
          id: "e1",
          source: "node1",
          target: "node2",
          sourceHandle: true,
          targetHandle: false
        }
      ];
      const result = formatEdgesForReactFlow(edges);
      expect(result[0].sourceHandle).toBe("true");
      expect(result[0].targetHandle).toBeUndefined();
    });
    it("should generate edge ID if not provided", () => {
      const edges = [
        {
          source: "node1",
          target: "node2",
          sourceHandle: "output"
        }
      ];
      const result = formatEdgesForReactFlow(edges);
      expect(result[0].id).toBe("node1-output-node2");
    });
    it("should preserve other edge properties", () => {
      const edges = [
        {
          id: "e1",
          source: "node1",
          target: "node2",
          label: "Custom Label",
          animated: true
        }
      ];
      const result = formatEdgesForReactFlow(edges);
      expect(result[0].label).toBe("Custom Label");
      expect(result[0].animated).toBe(true);
    });
  });
  describe("normalizeNodeForStorage", () => {
    it("should normalize node configs for storage", () => {
      const node = {
        id: "node1",
        type: "agent",
        position: { x: 0, y: 0 },
        data: {
          name: "Test"
        }
      };
      const result = normalizeNodeForStorage(node);
      expect(result.data.agent_config).toEqual({});
      expect(result.data.condition_config).toEqual({});
      expect(result.data.loop_config).toEqual({});
      expect(result.data.input_config).toEqual({});
    });
    it("should preserve existing configs", () => {
      const node = {
        id: "node1",
        type: "agent",
        position: { x: 0, y: 0 },
        data: {
          name: "Test",
          agent_config: { model: "gpt-4" }
        }
      };
      const result = normalizeNodeForStorage(node);
      expect(result.data.agent_config).toEqual({ model: "gpt-4" });
    });
    it("should handle nodes with configs at top level", () => {
      const node = {
        id: "node1",
        type: "agent",
        position: { x: 0, y: 0 },
        agent_config: { model: "gpt-4" },
        data: {}
      };
      const result = normalizeNodeForStorage(node);
      expect(result.data.agent_config).toEqual({ model: "gpt-4" });
    });
  });
  describe("workflowNodeToReactFlowNode", () => {
    it("should convert WorkflowNode to React Flow Node", () => {
      const wfNode = {
        id: "node1",
        type: "agent",
        name: "Test Agent",
        description: "Test Description",
        position: { x: 100, y: 200 },
        agent_config: { model: "gpt-4" },
        inputs: []
      };
      const result = workflowNodeToReactFlowNode(wfNode);
      expect(result.id).toBe("node1");
      expect(result.type).toBe("agent");
      expect(result.position).toEqual({ x: 100, y: 200 });
      expect(result.draggable).toBe(true);
      expect(result.selected).toBe(false);
      expect(result.data.name).toBe("Test Agent");
      expect(result.data.description).toBe("Test Description");
      expect(result.data.agent_config).toEqual({ model: "gpt-4" });
    });
    it("should handle nested data object", () => {
      const wfNode = {
        id: "node1",
        type: "agent",
        name: "Top Level Name",
        data: {
          name: "Nested Name",
          label: "Nested Label",
          agent_config: { model: "gpt-4" }
        },
        position: { x: 0, y: 0 }
      };
      const result = workflowNodeToReactFlowNode(wfNode);
      expect(result.data.name).toBe("Nested Name");
      expect(result.data.label).toBe("Nested Label");
      expect(result.data.agent_config).toEqual({ model: "gpt-4" });
    });
    it("should add execution state if provided", () => {
      const wfNode = {
        id: "node1",
        type: "agent",
        name: "Test",
        position: { x: 0, y: 0 }
      };
      const nodeExecutionStates = {
        node1: { status: "running", error: void 0 }
      };
      const result = workflowNodeToReactFlowNode(wfNode, nodeExecutionStates);
      expect(result.data.executionStatus).toBe("running");
      expect(result.data.executionError).toBeUndefined();
    });
    it("should handle missing position", () => {
      const wfNode = {
        id: "node1",
        type: "agent",
        name: "Test"
      };
      const result = workflowNodeToReactFlowNode(wfNode);
      expect(result.position).toEqual({ x: 0, y: 0 });
    });
    it("should use fallback for name if not provided", () => {
      const wfNode = {
        id: "node1",
        type: "agent",
        position: { x: 0, y: 0 }
      };
      const result = workflowNodeToReactFlowNode(wfNode);
      expect(result.data.name).toBe("agent");
      expect(result.data.label).toBe("agent");
    });
    it("should verify exact fallback values for all logical OR operators", () => {
      const wfNode = {
        id: "node1",
        type: "agent",
        position: { x: 0, y: 0 }
      };
      const result = workflowNodeToReactFlowNode(wfNode);
      expect(result.position).toEqual({ x: 0, y: 0 });
      expect(result.data.label).toBe("agent");
      expect(result.data.name).toBe("agent");
      expect(result.data.description).toBe("");
      expect(result.data.agent_config).toEqual({});
      expect(result.data.condition_config).toEqual({});
      expect(result.data.loop_config).toEqual({});
      expect(result.data.input_config).toEqual({});
      expect(result.data.inputs).toEqual([]);
    });
    it("should verify nodeName fallback chain uses exact empty string", () => {
      const nodes = [
        {
          id: "node1",
          type: "agent",
          position: { x: 0, y: 0 },
          data: {
            name: null,
            label: null
          }
        }
      ];
      const result = convertNodesToWorkflowFormat(nodes);
      expect(result[0].name).toBe("node1");
      expect(result[0].name).not.toBe("");
    });
    it("should verify sourceHandle || source_handle || null fallback chain", () => {
      const edge1 = {
        id: "e1",
        source: "node1",
        target: "node2"
      };
      const result1 = formatEdgesForReactFlow([edge1]);
      expect(result1[0].sourceHandle).toBeUndefined();
      const edge2 = {
        id: "e2",
        source: "node1",
        target: "node2",
        sourceHandle: "output"
      };
      const result2 = formatEdgesForReactFlow([edge2]);
      expect(result2[0].sourceHandle).toBe("output");
      const edge3 = {
        id: "e3",
        source: "node1",
        target: "node2",
        source_handle: "input"
      };
      const result3 = formatEdgesForReactFlow([edge3]);
      expect(result3[0].sourceHandle).toBe("input");
    });
    it("should verify boolean to string conversion uses exact true/false strings", () => {
      const edge1 = {
        id: "e1",
        source: "node1",
        target: "node2",
        sourceHandle: true
      };
      const result1 = formatEdgesForReactFlow([edge1]);
      expect(result1[0].sourceHandle).toBe("true");
      expect(result1[0].sourceHandle).not.toBe(true);
      expect(result1[0].sourceHandle).not.toBe("True");
      const edge2 = {
        source: "node1",
        target: "node2",
        sourceHandle: false
      };
      const result2 = formatEdgesForReactFlow([edge2]);
      expect(result2[0].sourceHandle).toBeUndefined();
      expect(result2[0].id).toBe("node1-node2");
      const edge3 = {
        id: "e3",
        source: "node1",
        target: "node2",
        targetHandle: true
      };
      const result3 = formatEdgesForReactFlow([edge3]);
      expect(result3[0].targetHandle).toBe("true");
      expect(result3[0].targetHandle).not.toBe(true);
    });
    it("should verify edge.id || generated fallback uses exact template", () => {
      const edge1 = {
        source: "node1",
        target: "node2",
        sourceHandle: "output"
      };
      const result1 = formatEdgesForReactFlow([edge1]);
      expect(result1[0].id).toBe("node1-output-node2");
      const edge2 = {
        source: "node1",
        target: "node2"
      };
      const result2 = formatEdgesForReactFlow([edge2]);
      expect(result2[0].id).toBe("node1-node2");
    });
    it("should verify initializeReactFlowNodes uses exact empty object/array fallbacks", () => {
      const nodes = [
        {
          id: "node1",
          type: "agent",
          position: { x: 0, y: 0 },
          data: {
            agent_config: null,
            condition_config: void 0,
            loop_config: null,
            input_config: void 0,
            inputs: null
          }
        }
      ];
      const result = initializeReactFlowNodes(nodes);
      expect(result[0].data.agent_config).toEqual({});
      expect(result[0].data.condition_config).toEqual({});
      expect(result[0].data.loop_config).toEqual({});
      expect(result[0].data.input_config).toEqual({});
      expect(result[0].data.inputs).toEqual([]);
      expect(Object.keys(result[0].data.agent_config)).toHaveLength(0);
      expect(result[0].data.inputs.length).toBe(0);
    });
    it("should verify wfNode.data || {} uses exact empty object fallback", () => {
      const wfNode = {
        id: "node1",
        type: "agent",
        position: { x: 0, y: 0 },
        data: null
      };
      const result = workflowNodeToReactFlowNode(wfNode);
      expect(result.data).toBeDefined();
      expect(typeof result.data).toBe("object");
    });
    it("should verify position || { x: 0, y: 0 } uses exact fallback values", () => {
      const wfNode = {
        id: "node1",
        type: "agent"
      };
      const result = workflowNodeToReactFlowNode(wfNode);
      expect(result.position).toEqual({ x: 0, y: 0 });
      expect(result.position.x).toBe(0);
      expect(result.position.y).toBe(0);
      expect(result.position.x).not.toBe(1);
      expect(result.position.y).not.toBe(1);
    });
    it("should verify description ?? empty string uses exact empty string", () => {
      const wfNode = {
        id: "node1",
        type: "agent",
        position: { x: 0, y: 0 },
        description: null,
        data: { description: null }
      };
      const result = workflowNodeToReactFlowNode(wfNode);
      expect(result.data.description).toBe("");
      expect(result.data.description.length).toBe(0);
    });
    it("should verify label fallback chain uses exact values", () => {
      const wfNode1 = {
        id: "node1",
        type: "agent",
        position: { x: 0, y: 0 },
        data: { label: "Label" }
      };
      const result1 = workflowNodeToReactFlowNode(wfNode1);
      expect(result1.data.label).toBe("Label");
      const wfNode2 = {
        id: "node1",
        type: "agent",
        position: { x: 0, y: 0 },
        name: "Name"
      };
      const result2 = workflowNodeToReactFlowNode(wfNode2);
      expect(result2.data.label).toBe("Name");
      const wfNode3 = {
        id: "node1",
        type: "agent",
        position: { x: 0, y: 0 }
      };
      const result3 = workflowNodeToReactFlowNode(wfNode3);
      expect(result3.data.label).toBe("agent");
    });
    it("should verify config fallback chains use exact empty object", () => {
      const wfNode = {
        id: "node1",
        type: "agent",
        position: { x: 0, y: 0 }
      };
      const result = workflowNodeToReactFlowNode(wfNode);
      expect(result.data.agent_config).toEqual({});
      expect(result.data.condition_config).toEqual({});
      expect(result.data.loop_config).toEqual({});
      expect(result.data.input_config).toEqual({});
      expect(result.data.inputs).toEqual([]);
    });
  });
  describe("additional coverage for no-coverage mutants", () => {
    describe("exact type checks", () => {
      it("should verify exact typeof edge.label === string comparison", () => {
        const edge1 = {
          id: "e1",
          source: "node1",
          target: "node2",
          label: "String Label"
          // string
        };
        const result1 = convertEdgesToWorkflowFormat([edge1]);
        expect(result1[0].label).toBe("String Label");
        const edge2 = {
          id: "e2",
          source: "node1",
          target: "node2",
          label: { type: "span" }
          // not string
        };
        const result2 = convertEdgesToWorkflowFormat([edge2]);
        expect(result2[0].label).toBeUndefined();
        const edge3 = {
          id: "e3",
          source: "node1",
          target: "node2",
          label: 123
          // not string
        };
        const result3 = convertEdgesToWorkflowFormat([edge3]);
        expect(result3[0].label).toBeUndefined();
      });
      it("should verify exact typeof node.data.name === string comparison", () => {
        const node1 = {
          id: "node1",
          type: "agent",
          position: { x: 0, y: 0 },
          data: {
            name: "String Name"
            // string
          }
        };
        const result1 = convertNodesToWorkflowFormat([node1]);
        expect(result1[0].name).toBe("String Name");
        const node2 = {
          id: "node2",
          type: "agent",
          position: { x: 0, y: 0 },
          data: {
            name: 123
            // not string
          }
        };
        const result2 = convertNodesToWorkflowFormat([node2]);
        expect(result2[0].name).toBe("node2");
      });
      it("should verify exact typeof node.data.description === string comparison", () => {
        const node1 = {
          id: "node1",
          type: "agent",
          position: { x: 0, y: 0 },
          data: {
            description: "String Description"
            // string
          }
        };
        const result1 = convertNodesToWorkflowFormat([node1]);
        expect(result1[0].description).toBe("String Description");
        const node2 = {
          id: "node2",
          type: "agent",
          position: { x: 0, y: 0 },
          data: {
            description: 123
            // not string
          }
        };
        const result2 = convertNodesToWorkflowFormat([node2]);
        expect(result2[0].description).toBeUndefined();
      });
      it("should verify exact Array.isArray(node.data.inputs) comparison", () => {
        const node1 = {
          id: "node1",
          type: "agent",
          position: { x: 0, y: 0 },
          data: {
            inputs: [{ name: "input1" }]
            // array
          }
        };
        const result1 = convertNodesToWorkflowFormat([node1]);
        expect(result1[0].inputs).toEqual([{ name: "input1" }]);
        const node2 = {
          id: "node2",
          type: "agent",
          position: { x: 0, y: 0 },
          data: {
            inputs: "not an array"
            // not array
          }
        };
        const result2 = convertNodesToWorkflowFormat([node2]);
        expect(result2[0].inputs).toEqual([]);
      });
    });
    describe("exact ternary operators", () => {
      it("should verify exact ternary typeof edge.label === string ? edge.label : undefined", () => {
        const edge1 = {
          id: "e1",
          source: "node1",
          target: "node2",
          label: "Test Label"
        };
        const result1 = convertEdgesToWorkflowFormat([edge1]);
        expect(result1[0].label).toBe("Test Label");
        const edge2 = {
          id: "e2",
          source: "node1",
          target: "node2",
          label: null
        };
        const result2 = convertEdgesToWorkflowFormat([edge2]);
        expect(result2[0].label).toBeUndefined();
      });
      it("should verify exact ternary edge.id || (sourceHandle ? ... : ...)", () => {
        const edge1 = {
          id: "existing-id",
          source: "node1",
          target: "node2",
          sourceHandle: "output"
        };
        const result1 = formatEdgesForReactFlow([edge1]);
        expect(result1[0].id).toBe("existing-id");
        const edge2 = {
          source: "node1",
          target: "node2",
          sourceHandle: "output"
        };
        const result2 = formatEdgesForReactFlow([edge2]);
        expect(result2[0].id).toBe("node1-output-node2");
        const edge3 = {
          source: "node1",
          target: "node2"
        };
        const result3 = formatEdgesForReactFlow([edge3]);
        expect(result3[0].id).toBe("node1-node2");
      });
    });
    describe("exact logical OR operators", () => {
      it("should verify exact logical OR node.data.name || node.data.label || node.id", () => {
        const node1 = {
          id: "node1",
          type: "agent",
          position: { x: 0, y: 0 },
          data: {
            name: "Name Value"
          }
        };
        const result1 = convertNodesToWorkflowFormat([node1]);
        expect(result1[0].name).toBe("Name Value");
        const node2 = {
          id: "node2",
          type: "agent",
          position: { x: 0, y: 0 },
          data: {
            label: "Label Value"
          }
        };
        const result2 = convertNodesToWorkflowFormat([node2]);
        expect(result2[0].name).toBe("Label Value");
        const node3 = {
          id: "node3",
          type: "agent",
          position: { x: 0, y: 0 },
          data: {}
        };
        const result3 = convertNodesToWorkflowFormat([node3]);
        expect(result3[0].name).toBe("node3");
      });
      it("should verify exact logical OR edge.sourceHandle || edge.source_handle || null", () => {
        const edge1 = {
          id: "e1",
          source: "node1",
          target: "node2",
          sourceHandle: "camelCase"
        };
        const result1 = formatEdgesForReactFlow([edge1]);
        expect(result1[0].sourceHandle).toBe("camelCase");
        const edge2 = {
          id: "e2",
          source: "node1",
          target: "node2",
          source_handle: "snake_case"
        };
        const result2 = formatEdgesForReactFlow([edge2]);
        expect(result2[0].sourceHandle).toBe("snake_case");
        const edge3 = {
          id: "e3",
          source: "node1",
          target: "node2"
        };
        const result3 = formatEdgesForReactFlow([edge3]);
        expect(result3[0].sourceHandle).toBeUndefined();
      });
      it("should verify exact logical OR data.label || data.name || wfNode.name || wfNode.type", () => {
        const wfNode1 = {
          id: "node1",
          type: "agent",
          position: { x: 0, y: 0 },
          data: { label: "Data Label" }
        };
        const result1 = workflowNodeToReactFlowNode(wfNode1);
        expect(result1.data.label).toBe("Data Label");
        const wfNode2 = {
          id: "node2",
          type: "agent",
          position: { x: 0, y: 0 },
          data: { name: "Data Name" }
        };
        const result2 = workflowNodeToReactFlowNode(wfNode2);
        expect(result2.data.label).toBe("Data Name");
        const wfNode3 = {
          id: "node3",
          type: "agent",
          position: { x: 0, y: 0 },
          name: "Top Level Name"
        };
        const result3 = workflowNodeToReactFlowNode(wfNode3);
        expect(result3.data.label).toBe("Top Level Name");
        const wfNode4 = {
          id: "node4",
          type: "condition",
          position: { x: 0, y: 0 }
        };
        const result4 = workflowNodeToReactFlowNode(wfNode4);
        expect(result4.data.label).toBe("condition");
      });
      it("should verify exact logical OR node.data.agent_config || {}", () => {
        const node1 = {
          id: "node1",
          type: "agent",
          position: { x: 0, y: 0 },
          data: {
            agent_config: { model: "gpt-4" }
          }
        };
        const result1 = initializeReactFlowNodes([node1]);
        expect(result1[0].data.agent_config).toEqual({ model: "gpt-4" });
        const node2 = {
          id: "node2",
          type: "agent",
          position: { x: 0, y: 0 },
          data: {
            agent_config: null
          }
        };
        const result2 = initializeReactFlowNodes([node2]);
        expect(result2[0].data.agent_config).toEqual({});
      });
    });
    describe("exact nullish coalescing operators", () => {
      it("should verify exact nullish coalescing data.description ?? wfNode.description ?? empty string", () => {
        const wfNode1 = {
          id: "node1",
          type: "agent",
          position: { x: 0, y: 0 },
          data: { description: "Data Description" }
        };
        const result1 = workflowNodeToReactFlowNode(wfNode1);
        expect(result1.data.description).toBe("Data Description");
        const wfNode2 = {
          id: "node2",
          type: "agent",
          position: { x: 0, y: 0 },
          data: { description: null },
          description: "Top Level Description"
        };
        const result2 = workflowNodeToReactFlowNode(wfNode2);
        expect(result2.data.description).toBe("Top Level Description");
        const wfNode3 = {
          id: "node3",
          type: "agent",
          position: { x: 0, y: 0 },
          data: { description: null },
          description: null
        };
        const result3 = workflowNodeToReactFlowNode(wfNode3);
        expect(result3.data.description).toBe("");
        const wfNode4 = {
          id: "node4",
          type: "agent",
          position: { x: 0, y: 0 },
          data: { description: void 0 },
          description: void 0
        };
        const result4 = workflowNodeToReactFlowNode(wfNode4);
        expect(result4.data.description).toBe("");
      });
      it("should verify exact nullish coalescing (node.data as any)?.agent_config ?? (node as any).agent_config ?? {}", () => {
        const node1 = {
          id: "node1",
          type: "agent",
          position: { x: 0, y: 0 },
          data: {
            agent_config: { model: "gpt-4" }
          }
        };
        const result1 = normalizeNodeForStorage(node1);
        expect(result1.data.agent_config).toEqual({ model: "gpt-4" });
        const node2 = {
          id: "node2",
          type: "agent",
          position: { x: 0, y: 0 },
          data: {
            agent_config: null
          },
          agent_config: { model: "gpt-3.5" }
        };
        const result2 = normalizeNodeForStorage(node2);
        expect(result2.data.agent_config).toEqual({ model: "gpt-3.5" });
        const node3 = {
          id: "node3",
          type: "agent",
          position: { x: 0, y: 0 },
          data: {
            agent_config: null
          },
          agent_config: null
        };
        const result3 = normalizeNodeForStorage(node3);
        expect(result3.data.agent_config).toEqual({});
      });
    });
    describe("exact optional chaining", () => {
      it("should verify exact optional chaining nodeExecutionStates?.[wfNode.id]", () => {
        const wfNode1 = {
          id: "node1",
          type: "agent",
          position: { x: 0, y: 0 }
        };
        const nodeExecutionStates1 = {
          node1: { status: "running", error: "Test error" }
        };
        const result1 = workflowNodeToReactFlowNode(wfNode1, nodeExecutionStates1);
        expect(result1.data.executionStatus).toBe("running");
        expect(result1.data.executionError).toBe("Test error");
        const wfNode2 = {
          id: "node2",
          type: "agent",
          position: { x: 0, y: 0 }
        };
        const nodeExecutionStates2 = {
          node1: { status: "running" }
        };
        const result2 = workflowNodeToReactFlowNode(wfNode2, nodeExecutionStates2);
        expect(result2.data.executionStatus).toBeUndefined();
        expect(result2.data.executionError).toBeUndefined();
        const wfNode3 = {
          id: "node3",
          type: "agent",
          position: { x: 0, y: 0 }
        };
        const result3 = workflowNodeToReactFlowNode(wfNode3, void 0);
        expect(result3.data.executionStatus).toBeUndefined();
        expect(result3.data.executionError).toBeUndefined();
      });
      it("should verify exact optional chaining nodeExecutionState?.status", () => {
        const wfNode1 = {
          id: "node1",
          type: "agent",
          position: { x: 0, y: 0 }
        };
        const nodeExecutionStates1 = {
          node1: { status: "completed", error: void 0 }
        };
        const result1 = workflowNodeToReactFlowNode(wfNode1, nodeExecutionStates1);
        expect(result1.data.executionStatus).toBe("completed");
        const wfNode2 = {
          id: "node2",
          type: "agent",
          position: { x: 0, y: 0 }
        };
        const nodeExecutionStates2 = {
          node2: { error: "Error" }
        };
        const result2 = workflowNodeToReactFlowNode(wfNode2, nodeExecutionStates2);
        expect(result2.data.executionStatus).toBeUndefined();
      });
      it("should verify exact optional chaining (node.data as any)?.agent_config", () => {
        const node1 = {
          id: "node1",
          type: "agent",
          position: { x: 0, y: 0 },
          data: {
            agent_config: { model: "gpt-4" }
          }
        };
        const result1 = normalizeNodeForStorage(node1);
        expect(result1.data.agent_config).toEqual({ model: "gpt-4" });
        const node2 = {
          id: "node2",
          type: "agent",
          position: { x: 0, y: 0 },
          data: void 0
        };
        const result2 = normalizeNodeForStorage(node2);
        expect(result2.data.agent_config).toBeDefined();
      });
    });
    describe("exact boolean comparisons", () => {
      it("should verify exact comparison sourceHandle === true", () => {
        const edge1 = {
          id: "e1",
          source: "node1",
          target: "node2",
          sourceHandle: true
        };
        const result1 = formatEdgesForReactFlow([edge1]);
        expect(result1[0].sourceHandle).toBe("true");
        const edge2 = {
          id: "e2",
          source: "node1",
          target: "node2",
          sourceHandle: false
        };
        const result2 = formatEdgesForReactFlow([edge2]);
        expect(result2[0].sourceHandle).toBeUndefined();
        const edge3 = {
          id: "e3",
          source: "node1",
          target: "node2",
          sourceHandle: "output"
        };
        const result3 = formatEdgesForReactFlow([edge3]);
        expect(result3[0].sourceHandle).toBe("output");
      });
      it("should verify exact comparison targetHandle === true", () => {
        const edge1 = {
          id: "e1",
          source: "node1",
          target: "node2",
          targetHandle: true
        };
        const result1 = formatEdgesForReactFlow([edge1]);
        expect(result1[0].targetHandle).toBe("true");
        const edge2 = {
          id: "e2",
          source: "node1",
          target: "node2",
          targetHandle: false
        };
        const result2 = formatEdgesForReactFlow([edge2]);
        expect(result2[0].targetHandle).toBeUndefined();
      });
      it("should verify exact truthy check if (sourceHandle)", () => {
        const edge1 = {
          id: "e1",
          source: "node1",
          target: "node2",
          sourceHandle: "output"
        };
        const result1 = formatEdgesForReactFlow([edge1]);
        expect(result1[0].sourceHandle).toBe("output");
        const edge2 = {
          id: "e2",
          source: "node1",
          target: "node2"
        };
        const result2 = formatEdgesForReactFlow([edge2]);
        expect(result2[0].sourceHandle).toBeUndefined();
      });
    });
    describe("exact string comparisons", () => {
      it("should verify exact string comparison key !== sourceHandle", () => {
        const edge = {
          id: "e1",
          source: "node1",
          target: "node2",
          label: "Test Label",
          sourceHandle: "output",
          source_handle: "output",
          targetHandle: "input",
          target_handle: "input"
        };
        const result = formatEdgesForReactFlow([edge]);
        expect(result[0].label).toBe("Test Label");
        expect(result[0].sourceHandle).toBe("output");
        expect(result[0].targetHandle).toBe("input");
        expect(result[0]).not.toHaveProperty("source_handle");
        expect(result[0]).not.toHaveProperty("target_handle");
      });
    });
    describe("exact string literals", () => {
      it('should verify exact string literal "true"', () => {
        const edge = {
          id: "e1",
          source: "node1",
          target: "node2",
          sourceHandle: true
        };
        const result = formatEdgesForReactFlow([edge]);
        expect(result[0].sourceHandle).toBe("true");
        expect(result[0].sourceHandle).not.toBe(true);
        expect(result[0].sourceHandle).not.toBe("True");
        expect(result[0].sourceHandle).not.toBe("TRUE");
      });
      it('should verify exact string literal "false"', () => {
        const edge = {
          id: "e1",
          source: "node1",
          target: "node2",
          sourceHandle: false,
          source_handle: false
          // This will make sourceHandle = false || false || null = null
        };
        formatEdgesForReactFlow([edge]);
        const edge2 = {
          id: "e2",
          source: "node1",
          target: "node2",
          targetHandle: false
        };
        const result2 = formatEdgesForReactFlow([edge2]);
        expect(result2[0].targetHandle).toBeUndefined();
      });
      it("should verify exact object literal { x: 0, y: 0 }", () => {
        const wfNode = {
          id: "node1",
          type: "agent"
        };
        const result = workflowNodeToReactFlowNode(wfNode);
        expect(result.position).toEqual({ x: 0, y: 0 });
        expect(result.position.x).toBe(0);
        expect(result.position.y).toBe(0);
        expect(result.position.x).not.toBe(1);
        expect(result.position.y).not.toBe(1);
      });
    });
    describe("exact method calls", () => {
      it("should verify exact method call String(sourceHandle)", () => {
        const edge = {
          id: "e1",
          source: "node1",
          target: "node2",
          sourceHandle: 123
          // number - will be converted to string
        };
        const result = formatEdgesForReactFlow([edge]);
        expect(result[0].sourceHandle).toBe("123");
        expect(typeof result[0].sourceHandle).toBe("string");
      });
      it("should verify exact method call String(targetHandle)", () => {
        const edge = {
          id: "e1",
          source: "node1",
          target: "node2",
          targetHandle: 456
          // number - will be converted to string
        };
        const result = formatEdgesForReactFlow([edge]);
        expect(result[0].targetHandle).toBe("456");
        expect(typeof result[0].targetHandle).toBe("string");
      });
    });
  });
});
