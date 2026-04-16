package com.workflow.constants;

import java.util.Map;

/**
 * Workflow chat constants (Python {@code backend/api/workflow_chat/models.py}).
 */
public final class WorkflowChatModels {

    private WorkflowChatModels() {
    }

    public static final Map<String, String> NODE_CONFIG_KEYS = Map.ofEntries(
            Map.entry("agent", "agent_config"),
            Map.entry("condition", "condition_config"),
            Map.entry("loop", "loop_config"),
            Map.entry("gcp_bucket", "input_config"),
            Map.entry("aws_s3", "input_config"),
            Map.entry("gcp_pubsub", "input_config"),
            Map.entry("local_filesystem", "input_config")
    );
}
