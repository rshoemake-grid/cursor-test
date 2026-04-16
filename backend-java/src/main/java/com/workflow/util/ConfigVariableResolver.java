package com.workflow.util;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Resolves {@code ${variable}} placeholders in string config values (Python {@code resolve_config_variables}).
 */
public final class ConfigVariableResolver {

    private static final Pattern VAR = Pattern.compile("\\$\\{([^}]+)}");

    private ConfigVariableResolver() {
    }

    public static Map<String, Object> resolve(Map<String, Object> config, Map<String, Object> variables) {
        Map<String, Object> resolved = new LinkedHashMap<>();
        Map<String, Object> vars = ObjectUtils.orEmptyMap(variables);
        for (Map.Entry<String, Object> e : ObjectUtils.orEmptyMap(config).entrySet()) {
            String key = e.getKey();
            Object value = e.getValue();
            if (value == null || (value instanceof String s && s.isBlank())) {
                if (vars.containsKey(key)) {
                    Object rv = vars.get(key);
                    resolved.put(key, rv == null ? "" : (rv instanceof String ? rv : String.valueOf(rv)));
                } else {
                    resolved.put(key, value != null ? value : "");
                }
            } else if (value instanceof String str) {
                Matcher m = VAR.matcher(str);
                if (m.find()) {
                    String out = str;
                    m.reset();
                    while (m.find()) {
                        String varName = m.group(1);
                        if (vars.containsKey(varName)) {
                            out = out.replace("${" + varName + "}", String.valueOf(vars.get(varName)));
                        }
                    }
                    resolved.put(key, out);
                } else {
                    resolved.put(key, value);
                }
            } else {
                resolved.put(key, value);
            }
        }
        return resolved;
    }
}
