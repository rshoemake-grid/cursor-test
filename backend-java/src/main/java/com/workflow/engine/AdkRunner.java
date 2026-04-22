package com.workflow.engine;

import com.workflow.dto.AgentConfig;
import com.workflow.dto.Node;

import java.util.Map;

/**
 * Abstraction for executing Google ADK agents from workflow AGENT nodes (testable vs {@link AdkAgentRunner}).
 */
public interface AdkRunner {

    String run(
            Node node,
            AgentConfig cfg,
            String userText,
            NodeExecutionContext ctx,
            Map<String, Object> effectiveLlmConfig);
}
