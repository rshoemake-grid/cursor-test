package com.workflow.util;

import com.workflow.dto.ADKAgentConfig;
import com.workflow.dto.AgentConfig;

import java.util.Locale;

/**
 * Whether an AGENT node should run through Google ADK — parity with Python
 * {@code should_use_adk_agent}: explicit {@code agent_type == adk}, or a non-empty ADK bundle
 * ({@code adk_config.name} / {@code yaml_config}) even when {@code agent_type} defaults to {@code workflow}.
 */
public final class AgentAdkRouting {

    private AgentAdkRouting() {
    }

    public static boolean shouldExecuteViaAdk(AgentConfig cfg) {
        if (cfg == null) {
            return false;
        }
        String kind =
                ObjectUtils.toStringOrDefault(cfg.getAgentType(), "workflow")
                        .trim()
                        .toLowerCase(Locale.ROOT);
        if ("adk".equals(kind)) {
            return true;
        }
        ADKAgentConfig adk = cfg.getAdkConfig();
        if (adk == null) {
            return false;
        }
        String name = adk.getName();
        if (name != null && !name.isBlank()) {
            return true;
        }
        String yaml = adk.getYamlConfig();
        return yaml != null && !yaml.isBlank();
    }
}
