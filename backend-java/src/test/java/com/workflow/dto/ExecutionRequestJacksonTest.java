package com.workflow.dto;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Ensures execute payload parsing ({@link ExecutionRequest#fromHttpJson}) matches frontend/Python.
 */
class ExecutionRequestJacksonTest {

    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
    }

    @Test
    void fromHttpJson_snakeCaseWorkflowId_andObjectInputs() throws Exception {
        String json = """
                {"workflow_id":"972aae0b-de38-40db-ba53-6b301c956867","inputs":{"topic":"hello"}}
                """;
        ExecutionRequest r = ExecutionRequest.fromHttpJson(objectMapper.readTree(json), objectMapper);
        assertEquals("972aae0b-de38-40db-ba53-6b301c956867", r.getWorkflowId());
        assertEquals(Map.of("topic", "hello"), r.getInputs());
    }

    @Test
    void fromHttpJson_camelCaseWorkflowId() throws Exception {
        String json = "{\"workflowId\":\"w1\",\"inputs\":{}}";
        ExecutionRequest r = ExecutionRequest.fromHttpJson(objectMapper.readTree(json), objectMapper);
        assertEquals("w1", r.getWorkflowId());
        assertNotNull(r.getInputs());
        assertTrue(r.getInputs().isEmpty());
    }

    @Test
    void fromHttpJson_inputsAsJsonStringObject() throws Exception {
        String json = "{\"workflow_id\":\"w1\",\"inputs\":\"{\\\"a\\\":1}\"}";
        ExecutionRequest r = ExecutionRequest.fromHttpJson(objectMapper.readTree(json), objectMapper);
        assertEquals(1, ((Number) r.getInputs().get("a")).intValue());
    }

    @Test
    void fromHttpJson_inputsArray_becomesEmptyMap() throws Exception {
        String json = "{\"workflow_id\":\"w1\",\"inputs\":[]}";
        ExecutionRequest r = ExecutionRequest.fromHttpJson(objectMapper.readTree(json), objectMapper);
        assertNotNull(r.getInputs());
        assertTrue(r.getInputs().isEmpty());
    }

    @Test
    void fromHttpJson_emptyObject() throws Exception {
        ExecutionRequest r = ExecutionRequest.fromHttpJson(objectMapper.readTree("{}"), objectMapper);
        assertEquals(null, r.getWorkflowId());
        assertNotNull(r.getInputs());
        assertTrue(r.getInputs().isEmpty());
    }

    @Test
    void fromHttpJson_nullNode() {
        ExecutionRequest r = ExecutionRequest.fromHttpJson(null, objectMapper);
        assertEquals(null, r.getWorkflowId());
        assertNotNull(r.getInputs());
        assertTrue(r.getInputs().isEmpty());
    }
}
