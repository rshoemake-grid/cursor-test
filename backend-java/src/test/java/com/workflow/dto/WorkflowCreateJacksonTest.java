package com.workflow.dto;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

/**
 * Ensures workflow JSON from the frontend (all palette node types) deserializes into {@link WorkflowCreate}.
 * Missing {@link NodeType} values cause {@code HttpMessageNotReadableException} and a 400 "Invalid JSON" response.
 */
class WorkflowCreateJacksonTest {

    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        // Match strict HTTP Jackson setups: frontend may send palette-only fields (e.g. tool_config).
        objectMapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, true);
    }

    @Test
    void deserialize_workflowWithDatabaseFirebaseBigqueryNodeTypes_succeeds() throws Exception {
        String json = """
                {
                  "name": "Palette parity",
                  "description": "",
                  "nodes": [
                    {
                      "id": "db-1",
                      "type": "database",
                      "name": "DB",
                      "position": { "x": 0, "y": 0 },
                      "inputs": []
                    },
                    {
                      "id": "fb-1",
                      "type": "firebase",
                      "name": "Firebase",
                      "position": { "x": 100, "y": 0 },
                      "inputs": []
                    },
                    {
                      "id": "bq-1",
                      "type": "bigquery",
                      "name": "BQ",
                      "position": { "x": 200, "y": 0 },
                      "inputs": []
                    }
                  ],
                  "edges": [],
                  "variables": {}
                }
                """;
        WorkflowCreate created = objectMapper.readValue(json, WorkflowCreate.class);
        assertNotNull(created);
        assertEquals(3, created.getNodes().size());
        assertEquals(NodeType.DATABASE, created.getNodes().get(0).getType());
        assertEquals(NodeType.FIREBASE, created.getNodes().get(1).getType());
        assertEquals(NodeType.BIGQUERY, created.getNodes().get(2).getType());
    }

    @Test
    void deserialize_workflowWithToolConfigOnNode_succeeds() throws Exception {
        String json =
                """
                {
                  "name": "Tool parity",
                  "description": "",
                  "nodes": [
                    {
                      "id": "t1",
                      "type": "tool",
                      "name": "Calc",
                      "position": { "x": 0, "y": 0 },
                      "inputs": [],
                      "tool_config": { "toolName": "calculator" }
                    }
                  ],
                  "edges": [],
                  "variables": {}
                }
                """;
        WorkflowCreate created = objectMapper.readValue(json, WorkflowCreate.class);
        assertNotNull(created);
        assertEquals(1, created.getNodes().size());
        assertEquals(NodeType.TOOL, created.getNodes().get(0).getType());
    }
}
