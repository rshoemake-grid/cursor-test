package com.workflow.dto;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Ensures execute payload from the frontend (snake_case + flexible inputs) deserializes.
 */
class ExecutionRequestJacksonTest {

    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
    }

    @Test
    void deserialize_snakeCaseWorkflowId_andObjectInputs() throws Exception {
        String json = """
                {"workflow_id":"972aae0b-de38-40db-ba53-6b301c956867","inputs":{"topic":"hello"}}
                """;
        ExecutionRequest r = objectMapper.readValue(json, ExecutionRequest.class);
        assertEquals("972aae0b-de38-40db-ba53-6b301c956867", r.getWorkflowId());
        assertEquals(Map.of("topic", "hello"), r.getInputs());
    }

    @Test
    void deserialize_camelCaseWorkflowId() throws Exception {
        String json = "{\"workflowId\":\"w1\",\"inputs\":{}}";
        ExecutionRequest r = objectMapper.readValue(json, ExecutionRequest.class);
        assertEquals("w1", r.getWorkflowId());
        assertNotNull(r.getInputs());
        assertTrue(r.getInputs().isEmpty());
    }

    @Test
    void deserialize_inputsAsJsonStringObject() throws Exception {
        String json = "{\"workflow_id\":\"w1\",\"inputs\":\"{\\\"a\\\":1}\"}";
        ExecutionRequest r = objectMapper.readValue(json, ExecutionRequest.class);
        assertEquals(Map.of("a", 1), r.getInputs());
    }

    @Test
    void deserialize_inputsArray_becomesEmptyMap() throws Exception {
        String json = "{\"workflow_id\":\"w1\",\"inputs\":[]}";
        ExecutionRequest r = objectMapper.readValue(json, ExecutionRequest.class);
        assertNotNull(r.getInputs());
        assertTrue(r.getInputs().isEmpty());
    }
}
