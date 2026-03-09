package com.workflow.engine;

import com.workflow.dto.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.*;

/**
 * Main workflow executor - processes nodes in topological order.
 * Uses WorkflowGraphBuilder (SRP), NodeExecutorRegistry (OCP), NodeInputResolver (DRY).
 */
@Component
public class WorkflowExecutor {

    private static final Logger log = LoggerFactory.getLogger(WorkflowExecutor.class);

    private final NodeExecutorRegistry nodeRegistry;

    public WorkflowExecutor(NodeExecutorRegistry nodeRegistry) {
        this.nodeRegistry = nodeRegistry;
    }

    /**
     * Execute workflow and return state map with status, result, logs, node_states, current_node.
     */
    public Map<String, Object> execute(WorkflowResponse workflow, Map<String, Object> inputs,
                                       Map<String, Object> llmConfig, String userId) {
        List<Node> nodes = workflow.getNodesOrEmpty();
        List<Edge> edges = workflow.getEdgesOrEmpty();

        ExecutionState state = new ExecutionState();
        state.setExecutionId("exec-" + UUID.randomUUID());
        state.setWorkflowId(workflow.getId() != null ? workflow.getId() : "unknown");
        state.setStatus("running");
        state.setStartedAt(LocalDateTime.now());

        Map<String, Object> variables = new HashMap<>();
        if (workflow.getVariables() != null) {
            variables.putAll(workflow.getVariables());
        }
        if (inputs != null) {
            variables.putAll(inputs);
        }
        state.getVariables().putAll(variables);

        state.addLog("INFO", null, "Workflow execution started");

        try {
            if (nodes.isEmpty()) {
                state.setStatus("failed");
                state.setError("Workflow contains no nodes");
                state.setCompletedAt(LocalDateTime.now());
                state.addLog("ERROR", null, "Workflow contains no nodes");
                return state.toStateMap();
            }

            WorkflowGraphBuilder.GraphResult graph = WorkflowGraphBuilder.build(workflow);
            Map<String, List<String>> adjacency = graph.adjacency();
            Map<String, Node> nodeMap = graph.nodeMap();
            List<String> startNodes = graph.startNodes();

            Deque<String> queue = new ArrayDeque<>(startNodes);
            Set<String> completed = new HashSet<>();
            NodeExecutionContext ctx = new NodeExecutionContext(llmConfig, userId);

            while (!queue.isEmpty()) {
                String nodeId = queue.poll();
                Node node = nodeMap.get(nodeId);
                if (node == null) continue;

                if (NodeType.isSkip(node)) {
                    state.addLog("INFO", nodeId, "Skipping " + node.getType() + " node: " + nodeId);
                    completed.add(nodeId);
                    state.setCurrentNode(nodeId);
                    addReadyNeighbors(queue, completed, adjacency, nodeId, edges, null, state, nodeMap);
                    continue;
                }

                Map<String, Object> nodeInputs = NodeInputResolver.resolveInputs(node, state, edges);

                NodeState nodeState = NodeState.builder()
                        .nodeId(nodeId)
                        .status("running")
                        .input(nodeInputs)
                        .startedAt(LocalDateTime.now())
                        .build();
                state.getNodeStates().put(nodeId, nodeState);
                state.setCurrentNode(nodeId);

                Object output;
                try {
                    output = nodeRegistry.execute(node, nodeInputs, state, ctx);
                } catch (Exception e) {
                    handleNodeFailure(state, nodeState, nodeId, e);
                    return state.toStateMap();
                }

                nodeState.setStatus("completed");
                nodeState.setOutput(output);
                nodeState.setCompletedAt(LocalDateTime.now());
                completed.add(nodeId);

                if (NodeType.isCondition(node) && output instanceof Map) {
                    Object b = ((Map<?, ?>) output).get("branch");
                    String branch = b != null ? b.toString() : "true";
                    addConditionNeighbors(queue, completed, edges, nodeId, branch);
                } else {
                    addReadyNeighbors(queue, completed, adjacency, nodeId, edges, null, state, nodeMap);
                }
            }

            state.setStatus("completed");
            if (!state.getNodeStates().isEmpty()) {
                List<NodeState> states = new ArrayList<>(state.getNodeStates().values());
                state.setResult(states.get(states.size() - 1).getOutput());
            }
            state.setCompletedAt(LocalDateTime.now());
            state.addLog("INFO", null, "Workflow execution completed");

        } catch (Exception e) {
            handleWorkflowFailure(state, e);
        }

        return state.toStateMap();
    }

    private void handleNodeFailure(ExecutionState state, NodeState nodeState, String nodeId, Exception e) {
        nodeState.setStatus("failed");
        nodeState.setError(e.getMessage());
        nodeState.setCompletedAt(LocalDateTime.now());
        state.setStatus("failed");
        state.setError(e.getMessage());
        state.setCompletedAt(LocalDateTime.now());
        state.addLog("ERROR", nodeId, "Node failed: " + e.getMessage());
    }

    private void handleWorkflowFailure(ExecutionState state, Exception e) {
        state.setStatus("failed");
        state.setError(e.getMessage());
        state.setCompletedAt(LocalDateTime.now());
        state.addLog("ERROR", null, "Workflow execution failed: " + e.getMessage());
    }

    private void addReadyNeighbors(Deque<String> queue, Set<String> completed,
                                   Map<String, List<String>> adjacency, String nodeId,
                                   List<Edge> edges, Node conditionNode, ExecutionState state,
                                   Map<String, Node> nodeMap) {
        for (String targetId : adjacency.getOrDefault(nodeId, List.of())) {
            if (queue.contains(targetId) || completed.contains(targetId)) continue;
            List<String> deps = new ArrayList<>();
            for (Map.Entry<String, List<String>> entry : adjacency.entrySet()) {
                if (entry.getValue().contains(targetId)) {
                    deps.add(entry.getKey());
                }
            }
            if (deps.stream().allMatch(completed::contains)) {
                queue.add(targetId);
            }
        }
    }

    private void addConditionNeighbors(Deque<String> queue, Set<String> completed,
                                       List<Edge> edges, String nodeId, String branch) {
        for (Edge e : edges) {
            if (!nodeId.equals(e.getSource())) continue;
            String handle = e.getSourceHandle();
            if (handle == null) handle = "default";
            if (handle.equals(branch) || "default".equals(handle)) {
                if (!queue.contains(e.getTarget()) && !completed.contains(e.getTarget())) {
                    queue.add(e.getTarget());
                }
            }
        }
    }
}
