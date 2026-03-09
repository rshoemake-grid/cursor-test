package com.workflow.util;

import java.util.List;
import java.util.Map;
import java.util.function.Function;

/**
 * DRY: Null-coalescing helpers used across services.
 */
public final class ObjectUtils {

    private ObjectUtils() {
    }

    public static <T> T orDefault(T value, T defaultValue) {
        return value != null ? value : defaultValue;
    }

    public static List<String> orEmptyList(List<String> list) {
        return list != null ? list : List.of();
    }

    public static Map<String, Object> orEmptyMap(Map<String, Object> map) {
        return map != null ? map : Map.of();
    }

    public static boolean orFalse(Boolean value) {
        return value != null ? value : false;
    }

    /**
     * Safely get value from nullable source. Returns null if source is null.
     */
    public static <T, R> R safeGet(T source, Function<T, R> getter) {
        return source != null ? getter.apply(source) : null;
    }

    /**
     * Return string representation of object, or default when null.
     */
    public static String toStringOrDefault(Object o, String defaultWhenNull) {
        return o != null ? o.toString() : defaultWhenNull;
    }
}
