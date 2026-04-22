package com.workflow.util;

import com.workflow.dto.ADKAgentConfig;
import com.workflow.dto.AgentConfig;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AgentAdkRoutingTest {

    @Test
    void nullConfig_returnsFalse() {
        assertFalse(AgentAdkRouting.shouldExecuteViaAdk(null));
    }

    @Test
    void workflowType_noAdk_returnsFalse() {
        AgentConfig cfg = new AgentConfig();
        cfg.setAgentType("workflow");
        assertFalse(AgentAdkRouting.shouldExecuteViaAdk(cfg));
    }

    @Test
    void explicitAdkType_returnsTrue() {
        AgentConfig cfg = new AgentConfig();
        cfg.setAgentType("adk");
        assertTrue(AgentAdkRouting.shouldExecuteViaAdk(cfg));
    }

    @Test
    void adkTypeCaseInsensitive_returnsTrue() {
        AgentConfig cfg = new AgentConfig();
        cfg.setAgentType("ADK");
        assertTrue(AgentAdkRouting.shouldExecuteViaAdk(cfg));
    }

    @Test
    void workflowType_withAdkName_returnsTrue() {
        AgentConfig cfg = new AgentConfig();
        cfg.setAgentType("workflow");
        ADKAgentConfig adk = new ADKAgentConfig();
        adk.setName("bundle-one");
        cfg.setAdkConfig(adk);
        assertTrue(AgentAdkRouting.shouldExecuteViaAdk(cfg));
    }

    @Test
    void workflowType_withYamlOnly_returnsTrue() {
        AgentConfig cfg = new AgentConfig();
        cfg.setAgentType("workflow");
        ADKAgentConfig adk = new ADKAgentConfig();
        adk.setYamlConfig("root_agent: foo");
        cfg.setAdkConfig(adk);
        assertTrue(AgentAdkRouting.shouldExecuteViaAdk(cfg));
    }

    @Test
    void workflowType_adkPresentButEmpty_returnsFalse() {
        AgentConfig cfg = new AgentConfig();
        cfg.setAgentType("workflow");
        cfg.setAdkConfig(new ADKAgentConfig());
        assertFalse(AgentAdkRouting.shouldExecuteViaAdk(cfg));
    }

    @Test
    void workflowType_blankNameAndYaml_returnsFalse() {
        AgentConfig cfg = new AgentConfig();
        cfg.setAgentType("workflow");
        ADKAgentConfig adk = new ADKAgentConfig();
        adk.setName("   ");
        adk.setYamlConfig("");
        cfg.setAdkConfig(adk);
        assertFalse(AgentAdkRouting.shouldExecuteViaAdk(cfg));
    }
}
