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

    @SuppressWarnings("unchecked")
    public static <T> List<T> orEmptyList(List<T> list) {
        return list != null ? list : (List<T>) List.of();
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

    /**
     * Return int value or default when null.
     */
    public static int orDefaultInt(Integer value, int defaultValue) {
        return value != null ? value : defaultValue;
    }

    /**
     * Return string or default when null or blank.
     */
    public static String orDefaultIfBlank(String value, String defaultWhenBlank) {
        return value != null && !value.isBlank() ? value : defaultWhenBlank;
    }

    /**
     * Return first element or default when list is null or empty.
     */
    public static <T> T firstOrDefault(List<T> list, T defaultVal) {
        return list != null && !list.isEmpty() ? list.get(0) : defaultVal;
    }

    /**
     * Return last element or default when list is null or empty.
     */
    public static <T> T lastOrDefault(List<T> list, T defaultVal) {
        return list != null && !list.isEmpty() ? list.get(list.size() - 1) : defaultVal;
    }
}
