package com.workflow.util;

import org.springframework.core.env.Environment;

/**
 * DRY: Centralizes environment checks used across security, exception handling, and services.
 */
public final class EnvironmentUtils {

    private EnvironmentUtils() {
    }

    /**
     * Check if the "production" profile is active.
     */
    public static boolean isProduction(Environment environment) {
        if (environment == null) return false;
        for (String profile : environment.getActiveProfiles()) {
            if ("production".equalsIgnoreCase(profile)) {
                return true;
            }
        }
        return false;
    }
}
