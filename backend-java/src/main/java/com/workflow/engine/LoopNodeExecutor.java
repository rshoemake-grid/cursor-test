package com.workflow.engine;

import com.workflow.dto.LoopConfig;
import com.workflow.dto.Node;
import com.workflow.dto.NodeType;
import com.workflow.util.NodeConfigUtils;
import com.workflow.util.ObjectUtils;

import org.springframework.stereotype.Component;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Executes LOOP nodes — mirrors Python {@code LoopAgent} initialization output for for_each / while / until.
 */
@Component
public class LoopNodeExecutor implements NodeExecutor {

    private final ObjectMapper objectMapper;

    public LoopNodeExecutor(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public Optional<NodeType> getSupportedType() {
        return Optional.of(NodeType.LOOP);
    }

    @Override
    public Object execute(Node node, Map<String, Object> inputs, ExecutionState state,
                          NodeExecutionContext ctx) {
        LoopConfig cfg = NodeConfigUtils.resolveLoopConfig(node, objectMapper);
        if (cfg == null) {
            cfg = new LoopConfig();
        }
        String loopType = cfg.getLoopType() != null ? cfg.getLoopType() : "for_each";

        return switch (loopType) {
            case "while" -> Map.of(
                    "loop_type", "while",
                    "condition", ObjectUtils.orDefault(cfg != null ? cfg.getCondition() : null, "true"),
                    "max_iterations", cfg != null && cfg.getMaxIterations() != null ? cfg.getMaxIterations() : 0,
                    "current_iteration", 0,
                    "status", "initialized"
            );
            case "until" -> Map.of(
                    "loop_type", "until",
                    "condition", ObjectUtils.orDefault(cfg != null ? cfg.getCondition() : null, "false"),
                    "max_iterations", cfg != null && cfg.getMaxIterations() != null ? cfg.getMaxIterations() : 0,
                    "current_iteration", 0,
                    "status", "initialized"
            );
            default -> forEachResult(cfg, inputs);
        };
    }

    private Map<String, Object> forEachResult(LoopConfig cfg, Map<String, Object> inputs) {
        List<?> items = resolveItems(cfg, inputs);
        int max = cfg != null && cfg.getMaxIterations() != null && cfg.getMaxIterations() > 0
                ? Math.min(items.size(), cfg.getMaxIterations())
                : items.size();
        List<?> capped = max < items.size() ? items.subList(0, max) : items;
        return Map.of(
                "loop_type", "for_each",
                "items", new ArrayList<>(capped),
                "total_iterations", capped.size(),
                "current_iteration", 0,
                "status", "initialized"
        );
    }

    @SuppressWarnings("unchecked")
    private List<?> resolveItems(LoopConfig cfg, Map<String, Object> inputs) {
        if (cfg != null && cfg.getItemsSource() != null && !cfg.getItemsSource().isBlank()) {
            Object v = inputs.get(cfg.getItemsSource());
            return normalizeList(v);
        }
        for (String key : List.of("data", "output", "items", "results")) {
            if (inputs.containsKey(key)) {
                return normalizeList(inputs.get(key));
            }
        }
        if (inputs.size() == 1) {
            return normalizeList(inputs.values().iterator().next());
        }
        return Collections.emptyList();
    }

    private List<?> normalizeList(Object itemsObj) {
        if (itemsObj == null) {
            return Collections.emptyList();
        }
        if (itemsObj instanceof List) {
            return (List<?>) itemsObj;
        }
        if (itemsObj instanceof String s) {
            String t = s.trim();
            if (t.startsWith("[") || t.startsWith("{")) {
                try {
                    Object parsed = objectMapper.readValue(t, new TypeReference<Object>() {
                    });
                    if (parsed instanceof List) {
                        return (List<?>) parsed;
                    }
                    return List.of(parsed);
                } catch (Exception ignored) {
                    // fall through
                }
            }
            if (t.contains("\n")) {
                List<Object> lines = new ArrayList<>();
                for (String line : t.split("\n")) {
                    if (!line.isBlank()) {
                        lines.add(line.trim());
                    }
                }
                return lines;
            }
            if (t.contains(",")) {
                List<String> parts = new ArrayList<>();
                for (String p : t.split(",")) {
                    if (!p.isBlank()) {
                        parts.add(p.trim());
                    }
                }
                return parts;
            }
            return List.of(t);
        }
        return List.of(itemsObj);
    }
}
