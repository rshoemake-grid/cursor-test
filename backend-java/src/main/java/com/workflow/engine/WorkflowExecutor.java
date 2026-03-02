package com.workflow.engine;

import com.workflow.dto.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.LocalDateTime;
import java.util.*;

/**
 * Main workflow executor - processes nodes in topological order.
 * Mirrors Python executor_v3 graph execution logic (synchronous).
 */
@Component
public class WorkflowExecutor {

    private static final Logger log = LoggerFactory.getLogger(WorkflowExecutor.class);

    private final LlmApiClient llmClient;

    public WorkflowExecutor(LlmApiClient llmClient) {
        this.llmClient = llmClient;
    }


    /**
     * Execute workflow and return state map with status, result, logs, node_states, current_node.
     */
    public Map<String, Object> execute(WorkflowResponse workflow, Map<String, Object> inputs,
                                       Map<String, Object> llmConfig, String userId) {
        List<Node> nodes = workflow.getNodes() != null ? workflow.getNodes() : List.of();
        List<Edge> edges = workflow.getEdges() != null ? workflow.getEdges() : List.of();

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

            Map<String, List<String>> adjacency = new HashMap<>();
            Map<String, Integer> inDegree = new HashMap<>();
            Map<String, Node> nodeMap = new HashMap<>();

            for (Node n : nodes) {
                nodeMap.put(n.getId(), n);
                adjacency.put(n.getId(), new ArrayList<>());
                inDegree.put(n.getId(), 0);
            }

            Set<String> validIds = new HashSet<>(nodeMap.keySet());
            for (Edge e : edges) {
                if (!validIds.contains(e.getSource()) || !validIds.contains(e.getTarget())) {
                    continue;
                }
                adjacency.get(e.getSource()).add(e.getTarget());
                inDegree.merge(e.getTarget(), 1, Integer::sum);
            }

            List<String> startNodes = inDegree.entrySet().stream()
                    .filter(entry -> entry.getValue() == 0)
                    .map(Map.Entry::getKey)
                    .toList();
            if (startNodes.isEmpty()) {
                Optional<Node> start = nodes.stream()
                        .filter(n -> NodeType.START.equals(n.getType()))
                        .findFirst();
                startNodes = start.map(n -> List.of(n.getId()))
                        .orElse(List.of(nodes.get(0).getId()));
            }

            Deque<String> queue = new ArrayDeque<>(startNodes);
            Set<String> completed = new HashSet<>();

            while (!queue.isEmpty()) {
                String nodeId = queue.poll();
                Node node = nodeMap.get(nodeId);
                if (node == null) continue;

                if (NodeType.START.equals(node.getType()) || NodeType.END.equals(node.getType())) {
                    state.addLog("INFO", nodeId, "Skipping " + node.getType() + " node: " + nodeId);
                    completed.add(nodeId);
                    state.setCurrentNode(nodeId);
                    addReadyNeighbors(queue, completed, adjacency, nodeId, edges, node, state, nodeMap);
                    continue;
                }

                Map<String, Object> nodeInputs = prepareNodeInputs(node, state);
                if (nodeInputs.isEmpty() && (NodeType.LOOP.equals(node.getType())
                        || NodeType.CONDITION.equals(node.getType()) || NodeType.AGENT.equals(node.getType()))) {
                    Object prev = getPreviousNodeOutput(node, state, edges);
                    if (prev != null) {
                        if (prev instanceof Map) {
                            nodeInputs = (Map<String, Object>) prev;
                        } else {
                            nodeInputs = Map.of("data", prev, "output", prev);
                        }
                    } else {
                        nodeInputs = new HashMap<>(state.getVariables());
                    }
                }

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
                    output = executeNode(node, nodeInputs, state, llmConfig, userId);
                } catch (Exception e) {
                    nodeState.setStatus("failed");
                    nodeState.setError(e.getMessage());
                    nodeState.setCompletedAt(LocalDateTime.now());
                    state.setStatus("failed");
                    state.setError(e.getMessage());
                    state.setCompletedAt(LocalDateTime.now());
                    state.addLog("ERROR", nodeId, "Node failed: " + e.getMessage());
                    return state.toStateMap();
                }

                nodeState.setStatus("completed");
                nodeState.setOutput(output);
                nodeState.setCompletedAt(LocalDateTime.now());
                completed.add(nodeId);

                if (NodeType.CONDITION.equals(node.getType()) && output instanceof Map) {
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
            state.setStatus("failed");
            state.setError(e.getMessage());
            state.setCompletedAt(LocalDateTime.now());
            state.addLog("ERROR", null, "Workflow execution failed: " + e.getMessage());
        }

        return state.toStateMap();
    }

    private Object executeNode(Node node, Map<String, Object> inputs, ExecutionState state,
                               Map<String, Object> llmConfig, String userId) {
        NodeType type = node.getType();
        if (type == null) {
            type = parseNodeType(node);
        }

        if (NodeType.AGENT.equals(type)) {
            return executeAgentNode(node, inputs, llmConfig);
        }
        if (NodeType.CONDITION.equals(type)) {
            return executeConditionNode(node, inputs);
        }
        if (NodeType.LOOP.equals(type)) {
            return executeLoopNode(node, inputs);
        }
        if (NodeType.TOOL.equals(type)) {
            return inputs;
        }
        return inputs;
    }

    private Object executeAgentNode(Node node, Map<String, Object> inputs, Map<String, Object> llmConfig) {
        if (llmConfig == null || llmConfig.isEmpty()) {
            throw new IllegalStateException("LLM config required for agent nodes");
        }
        String baseUrl = (String) llmConfig.get("base_url");
        if (baseUrl == null) baseUrl = (String) llmConfig.get("baseUrl");
        String apiKey = (String) llmConfig.getOrDefault("api_key", llmConfig.get("apiKey"));
        String model = (String) llmConfig.getOrDefault("model", llmConfig.get("defaultModel"));

        AgentConfig cfg = node.getAgentConfig();
        if (cfg != null) {
            if (cfg.getModel() != null) model = cfg.getModel();
        }
        if (baseUrl == null) baseUrl = "https://api.openai.com/v1";
        if (apiKey == null) apiKey = System.getenv("OPENAI_API_KEY");
        if (apiKey == null) apiKey = System.getenv("GEMINI_API_KEY");
        if (apiKey == null) apiKey = System.getenv("GOOGLE_API_KEY");

        String systemPrompt = "";
        if (cfg != null && cfg.getSystemPrompt() != null) {
            systemPrompt = cfg.getSystemPrompt();
        }

        List<Map<String, Object>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", systemPrompt));
        Object userContent = inputs.get("message");
        if (userContent == null) userContent = inputs.get("data");
        if (userContent == null) userContent = inputs.get("output");
        if (userContent == null) userContent = inputs.values().stream().findFirst().orElse("");
        messages.add(Map.of("role", "user", "content", String.valueOf(userContent)));

        String url = baseUrl.endsWith("/") ? baseUrl + "chat/completions" : baseUrl + "/chat/completions";
        return llmClient.chatCompletions(url, apiKey, model, messages);
    }

    private Object executeConditionNode(Node node, Map<String, Object> inputs) {
        ConditionConfig cfg = node.getConditionConfig();
        String field = cfg != null ? cfg.getField() : null;
        String expectValue = cfg != null ? cfg.getValue() : null;

        if (field == null || field.isEmpty()) {
            return Map.of("branch", "true");
        }

        Object actual = inputs.get(field);
        if (actual == null) {
            actual = inputs.get("data");
        }
        String actualStr = actual != null ? String.valueOf(actual) : "";
        String expectStr = expectValue != null ? expectValue : "";
        boolean match = actualStr.equals(expectStr);
        return Map.of("branch", match ? "true" : "false");
    }

    private Object executeLoopNode(Node node, Map<String, Object> inputs) {
        Object itemsObj = inputs.get("items");
        if (itemsObj == null) itemsObj = inputs.get("data");
        if (itemsObj == null) itemsObj = inputs.get("lines");
        if (itemsObj == null) itemsObj = inputs.get("output");

        List<?> items = Collections.emptyList();
        if (itemsObj instanceof List) {
            items = (List<?>) itemsObj;
        } else if (itemsObj != null) {
            items = List.of(itemsObj);
        }

        if (items.isEmpty()) {
            return null;
        }
        return items.get(items.size() - 1);
    }

    private NodeType parseNodeType(Node node) {
        if (node.getData() instanceof Map) {
            Object t = ((Map<?, ?>) node.getData()).get("type");
            if (t != null) {
                return NodeType.valueOf(String.valueOf(t).toUpperCase().replace("-", "_"));
            }
        }
        return NodeType.TOOL;
    }

    private Map<String, Object> prepareNodeInputs(Node node, ExecutionState state) {
        Map<String, Object> inputs = new HashMap<>();
        List<InputMapping> mappings = node.getInputs();
        if (mappings == null) return inputs;

        for (InputMapping m : mappings) {
            if (m.getSourceNode() != null && !m.getSourceNode().isEmpty()) {
                NodeState src = state.getNodeStates().get(m.getSourceNode());
                if (src != null && src.getOutput() != null) {
                    if (src.getOutput() instanceof Map) {
                        Object val = ((Map<?, ?>) src.getOutput()).get(m.getSourceField());
                        inputs.put(m.getName(), val != null ? val : src.getOutput());
                    } else {
                        inputs.put(m.getName(), src.getOutput());
                    }
                }
            } else if (m.getSourceField() != null && state.getVariables().containsKey(m.getSourceField())) {
                inputs.put(m.getName(), state.getVariables().get(m.getSourceField()));
            }
        }
        return inputs;
    }

    private Object getPreviousNodeOutput(Node node, ExecutionState state, List<Edge> edges) {
        for (Edge e : edges) {
            if (node.getId().equals(e.getTarget())) {
                NodeState src = state.getNodeStates().get(e.getSource());
                if (src != null && src.getOutput() != null) {
                    return src.getOutput();
                }
                break;
            }
        }
        return null;
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
