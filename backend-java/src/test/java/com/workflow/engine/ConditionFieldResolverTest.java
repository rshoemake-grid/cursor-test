package com.workflow.engine;

import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class ConditionFieldResolverTest {

    @Test
    void resolvesDirectKey() {
        assertEquals("x", ConditionFieldResolver.resolve(Map.of("f", "x"), "f"));
    }

    @Test
    void resolvesNestedPath() {
        assertEquals(2, ConditionFieldResolver.resolve(
                Map.of("data", Map.of("a", Map.of("b", 2))), "data.a.b"));
    }

    @Test
    void missingFieldThrows() {
        assertThrows(IllegalArgumentException.class,
                () -> ConditionFieldResolver.resolve(Map.of(), "   "));
    }

    @Test
    void resolvesDataTopLevel() {
        assertEquals("v", ConditionFieldResolver.resolve(Map.of("data", "v"), "data"));
    }

    @Test
    void singleValueFallback() {
        assertEquals(99, ConditionFieldResolver.resolve(Map.of("only", 99), "nope"));
    }
}
