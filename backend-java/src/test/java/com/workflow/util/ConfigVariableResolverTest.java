package com.workflow.util;

import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ConfigVariableResolverTest {

    @Test
    void substitutesVariableInString() {
        Map<String, Object> cfg = Map.of("bucket", "my-${env}-bucket");
        Map<String, Object> vars = Map.of("env", "prod");
        Map<String, Object> r = ConfigVariableResolver.resolve(cfg, vars);
        assertEquals("my-prod-bucket", r.get("bucket"));
    }

    @Test
    void fillsEmptyValueFromVariableByKey() {
        Map<String, Object> cfg = new java.util.LinkedHashMap<>(Map.of("prefix", ""));
        cfg.put("empty", null);
        Map<String, Object> vars = Map.of("prefix", "pfx/", "empty", "x");
        Map<String, Object> r = ConfigVariableResolver.resolve(cfg, vars);
        assertEquals("pfx/", r.get("prefix"));
    }
}
