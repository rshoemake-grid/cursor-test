package com.workflow.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.workflow.dto.AgentConfig;
import com.workflow.dto.ConditionConfig;
import com.workflow.dto.LoopConfig;
import com.workflow.dto.Node;
import com.workflow.dto.NodeType;
import org.junit.jupiter.api.Test;

import java.util.LinkedHashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class NodeConfigUtilsTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void emptyAgentConfigInDataYieldsDefaults() {
        Node n = new Node();
        n.setId("a1");
        n.setType(NodeType.AGENT);
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("agent_config", Map.of());
        n.setData(data);
        AgentConfig cfg = NodeConfigUtils.resolveAgentConfig(n, objectMapper);
        assertNotNull(cfg);
        assertEquals("gpt-4o-mini", cfg.getModel());
        assertEquals("workflow", cfg.getAgentType());
    }

    @Test
    void topLevelAgentConfigWinsOverData() {
        Node n = new Node();
        n.setId("a2");
        n.setType(NodeType.AGENT);
        AgentConfig top = new AgentConfig();
        top.setModel("custom-model");
        n.setAgentConfig(top);
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("agent_config", Map.of("model", "ignored"));
        n.setData(data);
        assertEquals("custom-model", NodeConfigUtils.resolveAgentConfig(n, objectMapper).getModel());
    }

    @Test
    void emptyLoopConfigInDataYieldsDefaults() {
        Node n = new Node();
        n.setId("l1");
        n.setType(NodeType.LOOP);
        n.setData(Map.of("loop_config", Map.of()));
        LoopConfig cfg = NodeConfigUtils.resolveLoopConfig(n, objectMapper);
        assertNotNull(cfg);
        assertEquals("for_each", cfg.getLoopType());
    }

    @Test
    void emptyConditionConfigInDataIsNull() {
        Node n = new Node();
        n.setId("c1");
        n.setType(NodeType.CONDITION);
        n.setData(Map.of("condition_config", Map.of()));
        assertNull(NodeConfigUtils.resolveConditionConfig(n, objectMapper));
    }

    @Test
    void nodeJsonWithSnakeCaseAgentConfigDeserializes() throws Exception {
        String json = """
                {
                  "id": "n1",
                  "type": "agent",
                  "agent_config": { "model": "gpt-4o", "system_prompt": "hi" }
                }
                """;
        Node n = objectMapper.readValue(json, Node.class);
        assertNotNull(n.getAgentConfig());
        assertEquals("gpt-4o", n.getAgentConfig().getModel());
        assertEquals("hi", n.getAgentConfig().getSystemPrompt());
    }
}
