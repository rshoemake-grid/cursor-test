package com.workflow.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.workflow.dto.AgentConfig;
import com.workflow.dto.ConditionConfig;
import com.workflow.dto.LoopConfig;
import com.workflow.dto.Node;

import java.util.Map;

/**
 * Resolves node configs from top-level fields or {@code node.data}, matching Python
 * {@code get_node_config} / {@code agent_config_utils.get_node_config}.
 * Empty {@code {}} for {@link AgentConfig} / {@link LoopConfig} becomes model defaults;
 * empty {@code {}} for {@link ConditionConfig} yields {@code null} (same as Python).
 */
public final class NodeConfigUtils {

    private NodeConfigUtils() {
    }

    public static AgentConfig resolveAgentConfig(Node node, ObjectMapper objectMapper) {
        if (node == null) {
            return null;
        }
        if (node.getAgentConfig() != null) {
            return node.getAgentConfig();
        }
        return mapToAgentConfig(getFromData(node, "agent_config"), objectMapper);
    }

    public static LoopConfig resolveLoopConfig(Node node, ObjectMapper objectMapper) {
        if (node == null) {
            return null;
        }
        if (node.getLoopConfig() != null) {
            return node.getLoopConfig();
        }
        return mapToLoopConfig(getFromData(node, "loop_config"), objectMapper);
    }

    public static ConditionConfig resolveConditionConfig(Node node, ObjectMapper objectMapper) {
        if (node == null) {
            return null;
        }
        if (node.getConditionConfig() != null) {
            return node.getConditionConfig();
        }
        return mapToConditionConfig(getFromData(node, "condition_config"), objectMapper);
    }

    private static Object getFromData(Node node, String key) {
        Map<String, Object> data = node.getData();
        if (data == null) {
            return null;
        }
        Object v = data.get(key);
        if (v == null && "agent_config".equals(key)) {
            v = data.get("agentConfig");
        }
        if (v == null && "loop_config".equals(key)) {
            v = data.get("loopConfig");
        }
        if (v == null && "condition_config".equals(key)) {
            v = data.get("conditionConfig");
        }
        return v;
    }

    private static AgentConfig mapToAgentConfig(Object raw, ObjectMapper objectMapper) {
        if (raw == null) {
            return null;
        }
        if (raw instanceof AgentConfig ac) {
            return ac;
        }
        if (raw instanceof Map<?, ?> m) {
            if (m.isEmpty()) {
                return new AgentConfig();
            }
            return objectMapper.convertValue(m, AgentConfig.class);
        }
        return objectMapper.convertValue(raw, AgentConfig.class);
    }

    private static LoopConfig mapToLoopConfig(Object raw, ObjectMapper objectMapper) {
        if (raw == null) {
            return null;
        }
        if (raw instanceof LoopConfig lc) {
            return lc;
        }
        if (raw instanceof Map<?, ?> m) {
            if (m.isEmpty()) {
                return new LoopConfig();
            }
            return objectMapper.convertValue(m, LoopConfig.class);
        }
        return objectMapper.convertValue(raw, LoopConfig.class);
    }

    private static ConditionConfig mapToConditionConfig(Object raw, ObjectMapper objectMapper) {
        if (raw == null) {
            return null;
        }
        if (raw instanceof ConditionConfig cc) {
            return cc;
        }
        if (raw instanceof Map<?, ?> m) {
            if (m.isEmpty()) {
                return null;
            }
            return objectMapper.convertValue(m, ConditionConfig.class);
        }
        return objectMapper.convertValue(raw, ConditionConfig.class);
    }
}
