package com.workflow.storage;

/**
 * Normalizes GCP project references for Pub/Sub (Python {@code _normalize_gcp_pubsub_project_id}).
 */
public final class GcpPubSubIds {

    private GcpPubSubIds() {
    }

    public static String normalizeProjectId(String projectRef) {
        if (projectRef == null) {
            return "";
        }
        String s = projectRef.trim();
        if (s.isEmpty()) {
            return "";
        }
        if (s.startsWith("projects/")) {
            s = s.substring("projects/".length()).replaceFirst("^/+", "");
        }
        int slash = s.indexOf('/');
        if (slash >= 0) {
            s = s.substring(0, slash).trim();
        }
        return s;
    }
}
