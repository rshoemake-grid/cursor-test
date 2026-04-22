package com.workflow.engine;

import org.junit.jupiter.api.Test;

import java.util.LinkedHashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;

class AdkWorkflowInputConverterTest {

    @Test
    void toUserMessage_nullOrEmpty_returnsEmptyString() {
        assertEquals("", AdkWorkflowInputConverter.toUserMessage(null));
        assertEquals("", AdkWorkflowInputConverter.toUserMessage(Map.of()));
    }

    @Test
    void toUserMessage_singleInput_returnsValueString() {
        assertEquals("hello", AdkWorkflowInputConverter.toUserMessage(Map.of("data", "hello")));
        assertEquals("42", AdkWorkflowInputConverter.toUserMessage(Map.of("x", 42)));
    }

    @Test
    void toUserMessage_multipleInputs_joinsKeyValueLines() {
        Map<String, Object> in = new LinkedHashMap<>();
        in.put("message", "hi");
        in.put("context", "ctx");
        assertEquals("message: hi\ncontext: ctx", AdkWorkflowInputConverter.toUserMessage(in));
    }
}
