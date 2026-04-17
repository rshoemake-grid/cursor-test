package com.workflow.util;

import org.springframework.core.env.Environment;

import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * User-facing hints for Vertex / GCP errors — mirrors Python {@code augment_message_for_vertex_gcp_errors}.
 */
public final class VertexGcpErrorHints {

    private static final Pattern[] PROJECT_FROM_ERROR =
            new Pattern[] {
                Pattern.compile("'consumer':\\s*'projects/([^']+)'", Pattern.CASE_INSENSITIVE),
                Pattern.compile("\"consumer\":\\s*\"projects/([^\"]+)\"", Pattern.CASE_INSENSITIVE),
                Pattern.compile("resource project ([a-z][a-z0-9\\-]*)", Pattern.CASE_INSENSITIVE),
                Pattern.compile("projects/([a-z][a-z0-9\\-]{4,})", Pattern.CASE_INSENSITIVE)
            };

    private VertexGcpErrorHints() {
    }

    public static String augmentMessage(String message, Environment environment) {
        if (message == null || message.isBlank()) {
            return message;
        }
        if (message.contains("CONSUMER_INVALID")) {
            String proj = extractProjectFromErrorBlob(message);
            String appProj = LlmVertexGeminiSupport.resolveProject(environment);
            String appBit =
                    appProj != null
                            ? " This app is using Vertex project \""
                                    + appProj
                                    + "\" (from env/settings/ADC)."
                            : "";
            String projHuman = proj != null ? "`" + proj + "`" : "the project named in the error";
            return message
                    + " "
                    + "[Vertex CONSUMER_INVALID: "
                    + projHuman
                    + " is not accepted as the consumer for aiplatform.googleapis.com. "
                    + "This often happens **even with Vertex AI enabled**: (1) **No billing account** linked to that project "
                    + "(link under Billing; Vertex bills through GCP). (2) **Project ID typo**: env must be the **Project ID** "
                    + "(IAM & Admin → Settings), not the display *name*. (3) **ADC / gcloud login** is a different Google account "
                    + "than the one that owns the project. Check: `gcloud projects describe PROJECT_ID` and "
                    + "`gcloud billing projects describe PROJECT_ID`."
                    + appBit
                    + " Or add a **Gemini API key** (Google AI Studio) in Settings to use the Developer API instead of Vertex.]";
        }
        if (message.contains("403")
                && message.toUpperCase(Locale.ROOT).contains("PERMISSION_DENIED")
                && message.contains("aiplatform.googleapis.com")) {
            return message + buildHttp403Hint(environment);
        }
        return message;
    }

    private static String buildHttp403Hint(Environment environment) {
        String project = ObjectUtils.orDefault(LlmVertexGeminiSupport.resolveProject(environment), "unknown");
        String location = LlmVertexGeminiSupport.resolveLocation(environment);
        return " [Vertex: project=\""
                + project
                + "\", location=\""
                + location
                + "\". "
                + "403 on the project resource usually means the Vertex AI API is not enabled, "
                + "GOOGLE_CLOUD_PROJECT/GCP_PROJECT does not match a project your ADC identity can use, "
                + "or the principal needs IAM role roles/aiplatform.user on that project. "
                + "Update .env if needed, then restart the backend.]";
    }

    static String extractProjectFromErrorBlob(String message) {
        if (message == null) {
            return null;
        }
        for (Pattern pat : PROJECT_FROM_ERROR) {
            Matcher m = pat.matcher(message);
            if (m.find()) {
                return m.group(1);
            }
        }
        return null;
    }
}
