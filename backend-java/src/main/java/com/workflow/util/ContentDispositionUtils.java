package com.workflow.util;

/**
 * DRY: Centralizes Content-Disposition header building for file downloads.
 */
public final class ContentDispositionUtils {

    private ContentDispositionUtils() {
    }

    /**
     * Build Content-Disposition header value for attachment download.
     * Escapes backslash and quote; strips CRLF to prevent header injection.
     */
    public static String attachmentFilename(String filename) {
        String safe = filename != null && !filename.isBlank() ? filename : "download";
        safe = safe.replace("\r", "").replace("\n", "");
        String escaped = safe.replace("\\", "\\\\").replace("\"", "\\\"");
        return "attachment; filename=\"" + escaped + "\"";
    }
}
