package com.workflow.engine;

import com.workflow.dto.Edge;
import com.workflow.dto.Node;
import com.workflow.dto.NodeType;
import com.workflow.storage.WorkflowInputSourceService;
import com.workflow.util.ConfigVariableResolver;
import com.workflow.util.NodeInputConfigUtils;
import com.workflow.util.ObjectUtils;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Executes storage nodes (GCP bucket, S3, Pub/Sub, local filesystem) — mirrors Python {@code execute_storage}.
 */
@Component
public class StorageNodeExecutor implements NodeExecutor {

    private final WorkflowInputSourceService inputSourceService;

    public StorageNodeExecutor(WorkflowInputSourceService inputSourceService) {
        this.inputSourceService = inputSourceService;
    }

    @Override
    public List<NodeType> getSupportedTypes() {
        return List.of(
                NodeType.GCP_BUCKET,
                NodeType.AWS_S3,
                NodeType.GCP_PUBSUB,
                NodeType.LOCAL_FILESYSTEM);
    }

    @Override
    public Optional<NodeType> getSupportedType() {
        return Optional.empty();
    }

    @Override
    public Object execute(Node node, Map<String, Object> inputs, ExecutionState state, NodeExecutionContext ctx) {
        Map<String, Object> inputConfig = ConfigVariableResolver.resolve(
                new LinkedHashMap<>(NodeInputConfigUtils.getMergedInputConfig(node)),
                state.getVariables());
        String mode = ObjectUtils.toStringOrDefault(inputConfig.get("mode"), "read");
        boolean nodeHasInputs = node.getInputs() != null && !node.getInputs().isEmpty();
        boolean hasDataProducing = hasDataProducingIncomingEdges(node, ctx);

        Map<String, Object> nodeInputs = new LinkedHashMap<>(ObjectUtils.orEmptyMap(inputs));
        if ("write".equalsIgnoreCase(mode) || nodeHasInputs || hasDataProducing) {
            if (nodeInputs.isEmpty()) {
                Object prev = NodeInputResolver.getPreviousNodeOutput(node, state, ctx.edges());
                if (prev != null) {
                    nodeInputs = wrapPrevious(prev);
                }
            }
            Object dataToWrite = StorageWriteDataExtractor.extract(nodeInputs);
            if (isEmptyWritePayload(dataToWrite)) {
                throw new IllegalArgumentException(
                        "Write node has no data to write. Please ensure the previous node produces output data.");
            }
            String type = node.getType().getValue();
            try {
                return inputSourceService.write(type, inputConfig, dataToWrite);
            } catch (Exception e) {
                throw new IllegalStateException(e.getMessage(), e);
            }
        }

        try {
            Object raw = inputSourceService.read(node.getType().getValue(), inputConfig);
            return wrapReadOutput(raw, node.getType().getValue());
        } catch (Exception e) {
            throw new IllegalStateException(e.getMessage(), e);
        }
    }

    private static boolean hasDataProducingIncomingEdges(Node node, NodeExecutionContext ctx) {
        for (Edge e : ctx.edges()) {
            if (!node.getId().equals(e.getTarget())) {
                continue;
            }
            Node src = ctx.nodesById().get(e.getSource());
            if (src == null || src.getType() == null) {
                continue;
            }
            if (NodeType.START.equals(src.getType()) || NodeType.END.equals(src.getType())) {
                continue;
            }
            return true;
        }
        return false;
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> wrapPrevious(Object previousNodeOutput) {
        if (previousNodeOutput == null) {
            return new LinkedHashMap<>();
        }
        if (previousNodeOutput instanceof Map<?, ?> m) {
            return new LinkedHashMap<>((Map<String, Object>) m);
        }
        if (previousNodeOutput instanceof String s && s.startsWith("data:image/")) {
            return new LinkedHashMap<>(Map.of("data", s, "output", s, "image", s));
        }
        return new LinkedHashMap<>(Map.of("data", previousNodeOutput, "output", previousNodeOutput));
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> wrapReadOutput(Object raw, String nodeType) {
        if (raw instanceof Map<?, ?> m) {
            if (m.isEmpty()) {
                return Map.of("data", "", "source", nodeType);
            }
            if (m.containsKey("read_mode")) {
                Map<String, Object> mm = new LinkedHashMap<>((Map<String, Object>) m);
                Object rm = mm.get("read_mode");
                if ("lines".equals(String.valueOf(rm)) || "batch".equals(String.valueOf(rm))) {
                    return buildReadModeOutput(mm, String.valueOf(rm), nodeType);
                }
                return Map.of("data", mm, "source", nodeType);
            }
            return Map.of("data", raw, "source", nodeType);
        }
        if (raw == null) {
            return Map.of("data", null, "source", nodeType);
        }
        if (raw instanceof List<?>) {
            return Map.of("data", raw, "source", nodeType);
        }
        return Map.of("data", raw, "source", nodeType);
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> buildReadModeOutput(Map<String, Object> raw, String readMode, String nodeType) {
        List<?> items;
        int total;
        Integer totalLines = null;
        if ("lines".equals(readMode)) {
            items = castToList(raw.get("lines"));
            total = intFrom(raw.get("total_lines"), items.size());
        } else {
            items = castToList(raw.get("batches"));
            total = intFrom(raw.get("total_batches"), items.size());
            totalLines = intFromNullable(raw.get("total_lines"));
        }
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("data", items);
        result.put("items", items);
        result.put("file_path", raw.get("file_path"));
        result.put("read_mode", readMode);
        result.put("source", nodeType);
        if ("lines".equals(readMode)) {
            result.put("lines", items);
            result.put("total_lines", total);
        } else {
            result.put("batches", items);
            result.put("total_batches", total);
            result.put("total_lines", totalLines != null ? totalLines : 0);
            if (raw.get("batch_size") != null) {
                result.put("batch_size", raw.get("batch_size"));
            }
        }
        return result;
    }

    private static List<?> castToList(Object o) {
        if (o instanceof List<?> l) {
            return l;
        }
        return new ArrayList<>();
    }

    private static int intFrom(Object o, int defaultVal) {
        if (o instanceof Number n) {
            return n.intValue();
        }
        if (o != null) {
            try {
                return Integer.parseInt(String.valueOf(o).trim());
            } catch (NumberFormatException ignored) {
            }
        }
        return defaultVal;
    }

    private static Integer intFromNullable(Object o) {
        if (o instanceof Number n) {
            return n.intValue();
        }
        if (o != null) {
            try {
                return Integer.parseInt(String.valueOf(o).trim());
            } catch (NumberFormatException ignored) {
            }
        }
        return null;
    }

    private static boolean isEmptyWritePayload(Object d) {
        return d == null || "".equals(d) || (d instanceof Map<?, ?> mm && mm.isEmpty());
    }
}
