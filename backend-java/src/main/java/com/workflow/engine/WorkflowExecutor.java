package com.workflow.engine;

import com.workflow.constants.ExecutionLogConstants;
import com.workflow.constants.WorkflowConstants;
import com.workflow.dto.*;
import com.workflow.util.ErrorMessages;
import com.workflow.util.JsonStateUtils;
import com.workflow.util.ObjectUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.env.Environment;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.*;

/**
 * Workflow executor — topological wavefront with parallel batches (Python executor_v3-style).
 */
@Component
public class WorkflowExecutor {

    private static final Logger log = LoggerFactory.getLogger(WorkflowExecutor.class);

    private final NodeExecutorRegistry nodeRegistry;
    private final ThreadPoolTaskExecutor parallelExecutor;
    private final ExecutionStreamBroadcaster streamBroadcaster;
    /** Per-node wall clock limit (Python {@code NODE_EXECUTION_TIMEOUT_SEC}); empty disables. */
    private final Optional<Duration> nodeExecutionTimeout;

    /** Per-execution live state for DB heartbeat snapshots (supports concurrent runs). */
    private final ConcurrentHashMap<String, ExecutionState> activeExecutions = new ConcurrentHashMap<>();

    public WorkflowExecutor(NodeExecutorRegistry nodeRegistry,
                            @Qualifier("workflowParallelExecutor") ThreadPoolTaskExecutor parallelExecutor,
                            @Autowired(required = false) ExecutionStreamBroadcaster streamBroadcaster) {
        this(nodeRegistry, parallelExecutor, streamBroadcaster, null);
    }

    @Autowired
    public WorkflowExecutor(NodeExecutorRegistry nodeRegistry,
                            @Qualifier("workflowParallelExecutor") ThreadPoolTaskExecutor parallelExecutor,
                            @Autowired(required = false) ExecutionStreamBroadcaster streamBroadcaster,
                            @Autowired(required = false) Environment environment) {
        this.nodeRegistry = nodeRegistry;
        this.parallelExecutor = parallelExecutor;
        this.streamBroadcaster = streamBroadcaster;
        this.nodeExecutionTimeout = NodeExecutionTimeout.resolve(environment);
    }

    /**
     * Test / legacy entrypoint: random execution id, streaming off.
     */
    public Map<String, Object> execute(WorkflowResponse workflow, Map<String, Object> inputs,
                                       Map<String, Object> llmConfig, String userId) {
        return execute(UUID.randomUUID().toString(), workflow, inputs, llmConfig, userId, false);
    }

    /**
     * @param executionId  Stable id (e.g. DB row); used for WebSocket routing when streaming is on.
     * @param streamUpdates When true, mirrors Python {@code stream_updates=True} (WebSocket broadcasts).
     */
    public Map<String, Object> execute(String executionId, WorkflowResponse workflow, Map<String, Object> inputs,
                                       Map<String, Object> llmConfig, String userId, boolean streamUpdates) {
        List<Node> nodes = workflow.getNodesOrEmpty();

        ExecutionState state = new ExecutionState();
        state.setExecutionId(executionId);
        state.setWorkflowId(ObjectUtils.orDefault(workflow.getId(), ErrorMessages.UNKNOWN_WORKFLOW_ID));
        state.setStatus(ExecutionStatus.RUNNING.getValue());
        state.setStartedAt(LocalDateTime.now());

        Map<String, Object> variables = new HashMap<>();
        variables.putAll(ObjectUtils.orEmptyMap(workflow.getVariables()));
        variables.putAll(ObjectUtils.orEmptyMap(inputs));
        state.getVariables().putAll(variables);

        appendLog(state, streamUpdates, ExecutionLogConstants.LOG_LEVEL_INFO, null,
                ExecutionLogConstants.WORKFLOW_EXECUTION_STARTED);

        activeExecutions.put(executionId, state);
        try {
            if (nodes.isEmpty()) {
                markFailed(state, null, ExecutionLogConstants.WORKFLOW_CONTAINS_NO_NODES, streamUpdates);
                if (streamUpdates && streamBroadcaster != null) {
                    streamBroadcaster.broadcastError(executionId, ExecutionLogConstants.WORKFLOW_CONTAINS_NO_NODES);
                }
                return state.toStateMap();
            }

            if (streamUpdates && streamBroadcaster != null) {
                Map<String, Object> statusData = new LinkedHashMap<>();
                statusData.put("workflow_id", state.getWorkflowId());
                statusData.put("started_at", state.getStartedAt() != null ? state.getStartedAt().toString() : "");
                streamBroadcaster.broadcastStatus(executionId, "running", statusData);
            }

            try {
                WorkflowGraphBuilder.GraphResult graph = WorkflowGraphBuilder.build(workflow);
                Map<String, List<String>> adjacency = graph.adjacency();
                Map<String, Node> nodeMap = graph.nodeMap();
                List<Edge> edgeList = graph.edges();

                boolean ok = runGraphParallel(state, nodeMap, adjacency, edgeList, graph.startNodes(), llmConfig, userId,
                        streamUpdates);
                if (ok) {
                    synchronized (state) {
                        state.setStatus(ExecutionStatus.COMPLETED.getValue());
                        state.setCompletedAt(LocalDateTime.now());
                    }
                    appendLog(state, streamUpdates, ExecutionLogConstants.LOG_LEVEL_INFO, null,
                            ExecutionLogConstants.WORKFLOW_EXECUTION_COMPLETED);
                } else {
                    appendLog(state, streamUpdates, ExecutionLogConstants.LOG_LEVEL_INFO, null,
                            "Workflow execution " + state.getStatus());
                }
            } catch (Exception e) {
                handleWorkflowFailure(state, e, streamUpdates);
                if (streamUpdates && streamBroadcaster != null) {
                    streamBroadcaster.broadcastError(executionId,
                            ObjectUtils.orDefault(e.getMessage(), ErrorMessages.EXECUTION_FAILED));
                }
                return state.toStateMap();
            }

            if (streamUpdates && streamBroadcaster != null) {
                broadcastCompletionSnapshot(state);
            }
            return state.toStateMap();
        } finally {
            activeExecutions.remove(executionId);
        }
    }

    /**
     * Live snapshot for periodic DB persistence while status is RUNNING (Python orchestrator heartbeat).
     */
    public Map<String, Object> peekRunningStateSnapshot(String executionId) {
        ExecutionState s = activeExecutions.get(executionId);
        if (s == null) {
            return null;
        }
        synchronized (s) {
            if (!ExecutionStatus.RUNNING.getValue().equals(s.getStatus())) {
                return null;
            }
            return new LinkedHashMap<>(s.toStateMap());
        }
    }

    private void appendLog(ExecutionState state, boolean stream, String level, String nodeId, String message) {
        ExecutionLogEntry entry = new ExecutionLogEntry(LocalDateTime.now(), level, nodeId, message);
        synchronized (state) {
            state.addLog(entry);
        }
        if (stream && streamBroadcaster != null) {
            streamBroadcaster.broadcastLog(state.getExecutionId(), JsonStateUtils.logEntryFromDto(entry));
        }
    }

    private void broadcastCompletionSnapshot(ExecutionState state) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("status", state.getStatus());
        payload.put("result", state.getResult());
        payload.put("completed_at", state.getCompletedAt() != null ? state.getCompletedAt().toString() : null);
        String err = state.getError();
        if (err != null && !err.isBlank()) {
            payload.put("error", err);
        } else if (ExecutionStatus.FAILED.getValue().equals(state.getStatus())) {
            payload.put("error", "Execution failed (no error message was recorded).");
        }
        streamBroadcaster.broadcastCompletion(state.getExecutionId(), payload);
    }

    private boolean runGraphParallel(ExecutionState state,
                                     Map<String, Node> nodeMap,
                                     Map<String, List<String>> adjacency,
                                     List<Edge> edges,
                                     List<String> startNodeIds,
                                     Map<String, Object> llmConfig,
                                     String userId,
                                     boolean streamUpdates) {
        Set<String> completed = new HashSet<>();
        Set<String> inProgress = new HashSet<>();
        LinkedList<String> queue = new LinkedList<>(startNodeIds);

        int maxIterations = Math.max(50_000, nodeMap.size() * 2_000);
        int iter = 0;
        NodeExecutionContext ctx = new NodeExecutionContext(llmConfig, userId, edges, nodeMap);

        while (!queue.isEmpty() || !inProgress.isEmpty()) {
            if (++iter > maxIterations) {
                markFailed(state, null, "Workflow executor exceeded maximum scheduling iterations", streamUpdates);
                return false;
            }

            List<Node> parallelBatch = new ArrayList<>();
            List<String> skipNodes = new ArrayList<>();

            Iterator<String> it = queue.iterator();
            while (it.hasNext()) {
                String nodeId = it.next();
                Node node = nodeMap.get(nodeId);
                if (node == null) {
                    it.remove();
                    continue;
                }

                if (NodeType.isSkip(node)) {
                    skipNodes.add(nodeId);
                    it.remove();
                    continue;
                }

                List<String> deps = dependenciesOf(nodeId, adjacency);
                if (!deps.stream().allMatch(completed::contains)) {
                    continue;
                }

                parallelBatch.add(node);
                it.remove();
                inProgress.add(nodeId);
            }

            for (String nodeId : skipNodes) {
                Node node = nodeMap.get(nodeId);
                appendLog(state, streamUpdates, ExecutionLogConstants.LOG_LEVEL_INFO, nodeId,
                        ExecutionLogConstants.skippingNode(node != null ? node.getType() : null, nodeId));
                completed.add(nodeId);
                synchronized (state) {
                    state.setCurrentNode(nodeId);
                }
                enqueueReadyNeighbors(queue, completed, inProgress, adjacency, nodeId, null, edges, nodeMap, false);
            }

            if (parallelBatch.isEmpty() && inProgress.isEmpty() && queue.isEmpty()) {
                break;
            }

            // Deadlock: runnable nodes exist but none are skippable and none entered the parallel batch
            // (skipNodes non-empty means we advanced via START/END this iteration — try again).
            if (parallelBatch.isEmpty() && !queue.isEmpty() && inProgress.isEmpty() && skipNodes.isEmpty()) {
                markFailed(state, null, "Workflow cannot proceed: queued nodes have unmet dependencies (cycle or broken branches)",
                        streamUpdates);
                return false;
            }

            if (parallelBatch.isEmpty()) {
                continue;
            }

            ExecutionState readSnapshot = shallowCopyForReads(state);
            ExecutorService pool = parallelExecutor.getThreadPoolExecutor();
            List<Future<SingleNodeOutcome>> futures = new ArrayList<>();
            for (Node node : parallelBatch) {
                futures.add(pool.submit(() -> executeSingleNode(node, readSnapshot, edges, state, ctx, streamUpdates)));
            }

            List<SingleNodeOutcome> batchOutcomes = new ArrayList<>(parallelBatch.size());
            for (int i = 0; i < futures.size(); i++) {
                Future<SingleNodeOutcome> f = futures.get(i);
                Node node = parallelBatch.get(i);
                try {
                    if (nodeExecutionTimeout.isPresent()) {
                        batchOutcomes.add(f.get(nodeExecutionTimeout.get().toMillis(), TimeUnit.MILLISECONDS));
                    } else {
                        batchOutcomes.add(f.get());
                    }
                } catch (TimeoutException te) {
                    f.cancel(true);
                    batchOutcomes.add(timeoutOutcome(node, nodeExecutionTimeout.orElse(Duration.ofSeconds(900))));
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    for (Future<SingleNodeOutcome> fx : futures) {
                        fx.cancel(true);
                    }
                    markFailed(state, node.getId(), ErrorMessages.EXECUTION_FAILED, streamUpdates);
                    return false;
                } catch (ExecutionException ee) {
                    Throwable cause = ee.getCause() == null ? ee : ee.getCause();
                    batchOutcomes.add(executionFailedOutcome(node, cause));
                }
            }

            for (int i = 0; i < parallelBatch.size(); i++) {
                Node node = parallelBatch.get(i);
                SingleNodeOutcome outcome = batchOutcomes.get(i);
                synchronized (state) {
                    state.getNodeStates().put(node.getId(), outcome.nodeState);
                    state.setCurrentNode(node.getId());
                    if (outcome.failed) {
                        String detail = ObjectUtils.orDefault(outcome.errorMessage, ErrorMessages.EXECUTION_FAILED);
                        appendLog(state, streamUpdates, ExecutionLogConstants.LOG_LEVEL_ERROR, node.getId(),
                                "Node failed: " + detail);
                        if (streamUpdates && streamBroadcaster != null) {
                            streamBroadcaster.broadcastNodeUpdate(
                                    state.getExecutionId(), node.getId(), outcome.nodeState.toMap());
                        }
                        markFailed(state, node.getId(), detail, streamUpdates);
                        return false;
                    }
                    inProgress.remove(node.getId());
                    completed.add(node.getId());
                    if (!NodeType.isSkip(node)) {
                        state.setResult(outcome.output);
                    }

                    boolean isCondition = NodeType.isCondition(node);
                    String branch = null;
                    if (isCondition && outcome.output instanceof Map) {
                        Object b = ((Map<?, ?>) outcome.output).get("branch");
                        branch = ObjectUtils.toStringOrDefault(b, WorkflowConstants.BRANCH_TRUE);
                    }
                    enqueueReadyNeighbors(queue, completed, inProgress, adjacency, node.getId(), branch, edges, nodeMap, isCondition);
                }
            }
        }
        return true;
    }

    private static SingleNodeOutcome timeoutOutcome(Node node, Duration limit) {
        long ceilSec = Math.max(1L, (long) Math.ceil(limit.toMillis() / 1000.0));
        String msg =
                "Node '"
                        + node.getId()
                        + "' exceeded NODE_EXECUTION_TIMEOUT_SEC ("
                        + ceilSec
                        + "s). Increase the limit or set NODE_EXECUTION_TIMEOUT_SEC=0 to disable.";
        NodeState nodeState =
                NodeState.builder()
                        .nodeId(node.getId())
                        .status(ExecutionStatus.FAILED.getValue())
                        .error(msg)
                        .startedAt(LocalDateTime.now())
                        .completedAt(LocalDateTime.now())
                        .build();
        return new SingleNodeOutcome(nodeState, null, true, msg);
    }

    private static SingleNodeOutcome executionFailedOutcome(Node node, Throwable cause) {
        String msg;
        if (cause != null && cause.getMessage() != null && !cause.getMessage().isBlank()) {
            msg = cause.getMessage();
        } else if (cause != null) {
            msg = cause.getClass().getSimpleName();
        } else {
            msg = ErrorMessages.EXECUTION_FAILED;
        }
        NodeState nodeState =
                NodeState.builder()
                        .nodeId(node.getId())
                        .status(ExecutionStatus.FAILED.getValue())
                        .error(msg)
                        .startedAt(LocalDateTime.now())
                        .completedAt(LocalDateTime.now())
                        .build();
        return new SingleNodeOutcome(nodeState, null, true, msg);
    }

    private record SingleNodeOutcome(NodeState nodeState, Object output, boolean failed, String errorMessage) {
    }

    private SingleNodeOutcome executeSingleNode(Node node, ExecutionState readSnapshot, List<Edge> edges,
                                                ExecutionState canonicalState, NodeExecutionContext ctx,
                                                boolean streamUpdates) {
        Map<String, Object> nodeInputs = NodeInputResolver.resolveInputs(node, readSnapshot, edges);

        NodeState nodeState = NodeState.builder()
                .nodeId(node.getId())
                .status(ExecutionStatus.RUNNING.getValue())
                .input(nodeInputs)
                .startedAt(LocalDateTime.now())
                .build();

        String nodeLabel = ObjectUtils.orDefault(node.getName(), node.getId());
        String typeLabel = node.getType() != null ? node.getType().getValue() : "?";
        appendLog(canonicalState, streamUpdates, ExecutionLogConstants.LOG_LEVEL_INFO, node.getId(),
                "Executing node: " + nodeLabel + " (type: " + typeLabel + ")");
        if (streamUpdates && streamBroadcaster != null) {
            streamBroadcaster.broadcastNodeUpdate(canonicalState.getExecutionId(), node.getId(), nodeState.toMap());
        }

        Object output;
        try {
            output = nodeRegistry.execute(node, nodeInputs, readSnapshot, ctx);
        } catch (Exception e) {
            log.warn("Node {} failed: {}", node.getId(), e.getMessage());
            String detail = ErrorMessages.executionFailureDetail(e);
            nodeState.setStatus(ExecutionStatus.FAILED.getValue());
            nodeState.setError(detail);
            nodeState.setCompletedAt(LocalDateTime.now());
            appendLog(canonicalState, streamUpdates, ExecutionLogConstants.LOG_LEVEL_ERROR, node.getId(),
                    "Node failed: " + detail);
            if (streamUpdates && streamBroadcaster != null) {
                streamBroadcaster.broadcastNodeUpdate(canonicalState.getExecutionId(), node.getId(), nodeState.toMap());
            }
            return new SingleNodeOutcome(nodeState, null, true, detail);
        }

        nodeState.setStatus(ExecutionStatus.COMPLETED.getValue());
        nodeState.setOutput(output);
        nodeState.setCompletedAt(LocalDateTime.now());
        String outStr = String.valueOf(output);
        if (outStr.length() > 100) {
            outStr = outStr.substring(0, 100) + "...";
        }
        appendLog(canonicalState, streamUpdates, ExecutionLogConstants.LOG_LEVEL_INFO, node.getId(),
                "Node completed with output: " + outStr);
        if (streamUpdates && streamBroadcaster != null) {
            streamBroadcaster.broadcastNodeUpdate(canonicalState.getExecutionId(), node.getId(), nodeState.toMap());
        }
        return new SingleNodeOutcome(nodeState, output, false, null);
    }

    private static ExecutionState shallowCopyForReads(ExecutionState src) {
        ExecutionState c = new ExecutionState();
        c.getVariables().putAll(src.getVariables());
        c.getNodeStates().putAll(src.getNodeStates());
        return c;
    }

    private static List<String> dependenciesOf(String nodeId, Map<String, List<String>> adjacency) {
        List<String> deps = new ArrayList<>();
        for (Map.Entry<String, List<String>> e : adjacency.entrySet()) {
            if (e.getValue().contains(nodeId)) {
                deps.add(e.getKey());
            }
        }
        return deps;
    }

    private void enqueueReadyNeighbors(LinkedList<String> queue, Set<String> completed, Set<String> inProgress,
                                       Map<String, List<String>> adjacency, String nodeId, String conditionBranch,
                                       List<Edge> edges, Map<String, Node> nodeMap, boolean fromCondition) {
        if (fromCondition && conditionBranch != null) {
            for (Edge e : edges) {
                if (!nodeId.equals(e.getSource())) {
                    continue;
                }
                if (!edgeAllowsBranch(e, conditionBranch)) {
                    continue;
                }
                String target = e.getTarget();
                if (queue.contains(target) || inProgress.contains(target) || completed.contains(target)) {
                    continue;
                }
                if (depsSatisfied(target, adjacency, completed)) {
                    queue.add(target);
                }
            }
            return;
        }

        for (String neighborId : adjacency.getOrDefault(nodeId, List.of())) {
            if (queue.contains(neighborId) || inProgress.contains(neighborId) || completed.contains(neighborId)) {
                continue;
            }
            if (depsSatisfied(neighborId, adjacency, completed)) {
                queue.add(neighborId);
            }
        }
    }

    private static boolean depsSatisfied(String nodeId, Map<String, List<String>> adjacency, Set<String> completed) {
        return dependenciesOf(nodeId, adjacency).stream().allMatch(completed::contains);
    }

    private static boolean edgeAllowsBranch(Edge e, String branch) {
        String cond = e.getCondition();
        if (cond != null && !cond.isBlank()) {
            return cond.equals(branch) || "default".equals(cond);
        }
        String handle = ObjectUtils.orDefault(e.getSourceHandle(), WorkflowConstants.DEFAULT_SOURCE_HANDLE);
        return handle.equals(branch) || WorkflowConstants.DEFAULT_SOURCE_HANDLE.equals(handle);
    }

    private void handleWorkflowFailure(ExecutionState state, Exception e, boolean streamUpdates) {
        log.warn("Workflow execution failed: {}", e.getMessage());
        markFailed(state, null, ErrorMessages.EXECUTION_FAILED, streamUpdates);
    }

    private void markFailed(ExecutionState state, String nodeId, String message, boolean streamUpdates) {
        synchronized (state) {
            state.setStatus(ExecutionStatus.FAILED.getValue());
            state.setError(message);
            state.setCompletedAt(LocalDateTime.now());
        }
        appendLog(state, streamUpdates, ExecutionLogConstants.LOG_LEVEL_ERROR, nodeId, message);
    }
}
