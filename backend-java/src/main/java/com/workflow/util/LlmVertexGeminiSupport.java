package com.workflow.util;

import com.google.auth.oauth2.GoogleCredentials;
import org.springframework.core.env.Environment;
import org.springframework.web.util.UriUtils;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Collections;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Vertex AI Gemini via Application Default Credentials (OAuth). Used when Gemini {@code api_key} is absent
 * and {@code GOOGLE_CLOUD_PROJECT} or {@code GCP_PROJECT} is set.
 */
public final class LlmVertexGeminiSupport {

    private static final String CLOUD_SCOPE = "https://www.googleapis.com/auth/cloud-platform";
    private static final Pattern PROJECT_ID_IN_JSON =
            Pattern.compile("\"project_id\"\\s*:\\s*\"([^\"]+)\"");

    private LlmVertexGeminiSupport() {
    }

    public static String resolveProject(Environment env) {
        if (env == null) {
            return null;
        }
        String p = firstNonBlank(env.getProperty("GOOGLE_CLOUD_PROJECT"), env.getProperty("GCP_PROJECT"));
        return p != null && !p.isBlank() ? p.trim() : null;
    }

    /**
     * Path from {@code GOOGLE_APPLICATION_CREDENTIALS} when it points to a regular file (service-account JSON or ADC).
     */
    public static String resolveApplicationDefaultCredentialsPath(Environment env) {
        String p =
                firstNonBlank(
                        env != null ? env.getProperty("GOOGLE_APPLICATION_CREDENTIALS") : null,
                        System.getenv("GOOGLE_APPLICATION_CREDENTIALS"));
        if (p == null || p.isBlank()) {
            return null;
        }
        Path path = Path.of(p.trim());
        return Files.isRegularFile(path) ? path.toString() : null;
    }

    public static boolean applicationDefaultCredentialsFilePresent(Environment env) {
        return resolveApplicationDefaultCredentialsPath(env) != null;
    }

    /**
     * Reads {@code project_id} from a service-account JSON when not set via {@link #resolveProject(Environment)}.
     */
    static String readProjectIdFromCredentialsJsonFile(String credentialsPath) {
        if (credentialsPath == null || credentialsPath.isBlank()) {
            return null;
        }
        try {
            String text = Files.readString(Path.of(credentialsPath));
            Matcher m = PROJECT_ID_IN_JSON.matcher(text);
            return m.find() ? m.group(1).trim() : null;
        } catch (IOException e) {
            return null;
        }
    }

    /**
     * GCP project for Vertex: env ({@code GOOGLE_CLOUD_PROJECT} / {@code GCP_PROJECT}) or {@code project_id} in the
     * ADC JSON file.
     */
    public static String resolveProjectIdForVertex(Environment env) {
        String p = resolveProject(env);
        if (p != null) {
            return p;
        }
        String credPath = resolveApplicationDefaultCredentialsPath(env);
        if (credPath == null) {
            return null;
        }
        return readProjectIdFromCredentialsJsonFile(credPath);
    }

    /**
     * True when an ADC credentials file is present and a Vertex project id can be resolved (env or JSON).
     */
    public static boolean geminiAuthViaAdcServiceAccountJson(Environment env) {
        return applicationDefaultCredentialsFilePresent(env) && resolveProjectIdForVertex(env) != null;
    }

    public static String resolveLocation(Environment env) {
        if (env == null) {
            return "us-central1";
        }
        String loc = firstNonBlank(env.getProperty("VERTEX_LOCATION"), env.getProperty("GOOGLE_CLOUD_REGION"));
        return loc != null && !loc.isBlank() ? loc.trim() : "us-central1";
    }

    /**
     * Gemini 3.x preview models are only available on the Vertex <em>global</em> endpoint, not regional.
     */
    public static boolean vertexModelRequiresGlobalLocation(String model) {
        String m = ObjectUtils.orDefault(model, "").trim().toLowerCase(Locale.ROOT);
        if (m.startsWith("google/")) {
            m = m.substring("google/".length());
        }
        return m.startsWith("gemini-3") && m.contains("preview");
    }

    /**
     * Use native {@code :generateContent} instead of Vertex OpenAI-compatible {@code chat/completions}.
     * Matches Python {@code GeminiProviderStrategy._gemini_model_requires_generate_content_api}:
     * flash-lite lines stall on the chat endpoint; image-output models need {@code responseModalities}.
     */
    public static boolean geminiModelRequiresVertexGenerateContent(String model) {
        String m = ObjectUtils.orDefault(model, "").trim().toLowerCase(Locale.ROOT);
        if (m.startsWith("google/")) {
            m = m.substring("google/".length());
        }
        if (m.contains("flash-lite")) {
            return true;
        }
        return m.contains("flash-image")
                || m.contains("pro-image")
                || m.contains("nano-banana")
                || m.contains("banana");
    }

    /** True when {@code generationConfig} should request image output modalities (Gemini image models). */
    public static boolean geminiModelRequestsImageModalities(String model) {
        String m = ObjectUtils.orDefault(model, "").trim().toLowerCase(Locale.ROOT);
        if (m.startsWith("google/")) {
            m = m.substring("google/".length());
        }
        return m.contains("flash-image")
                || m.contains("pro-image")
                || m.contains("nano-banana")
                || m.contains("banana");
    }

    public static String resolveLocationForModel(Environment env, String model) {
        if (vertexModelRequiresGlobalLocation(model)) {
            return "global";
        }
        return resolveLocation(env);
    }

    public static boolean isGeminiType(Map<String, Object> config) {
        String type =
                ObjectUtils.toStringOrDefault(config != null ? config.get("type") : null, "openai")
                        .trim()
                        .toLowerCase(Locale.ROOT);
        return "gemini".equals(type);
    }

    /** True when Gemini is selected, GCP project is set, and no API key is available from config or env. */
    public static boolean geminiUsesVertexAdc(Map<String, Object> config, Environment env) {
        if (env == null || resolveProject(env) == null) {
            return false;
        }
        if (!isGeminiType(config)) {
            return false;
        }
        String key = LlmConfigUtils.getApiKeyWithEnvFallback(ObjectUtils.orEmptyMap(config), env);
        return key == null || key.isBlank();
    }

    public static String vertexOpenAiCompatBase(Environment env) {
        return vertexOpenAiCompatBase(env, null);
    }

    public static String vertexOpenAiCompatBase(Environment env, String model) {
        String project = resolveProject(env);
        String location = resolveLocationForModel(env, model);
        if ("global".equals(location)) {
            return String.format(
                    "https://aiplatform.googleapis.com/v1/projects/%s/locations/global/endpoints/openapi", project);
        }
        return String.format(
                "https://%s-aiplatform.googleapis.com/v1/projects/%s/locations/%s/endpoints/openapi",
                location, project, location);
    }

    public static String vertexGenerateContentUrl(Environment env, String model) {
        String project = resolveProject(env);
        String location = resolveLocationForModel(env, model);
        String mid =
                UriUtils.encodePathSegment(vertexGenerateContentModelId(model), StandardCharsets.UTF_8);
        if ("global".equals(location)) {
            return String.format(
                    "https://aiplatform.googleapis.com/v1/projects/%s/locations/global/publishers/google/models/%s:generateContent",
                    project, mid);
        }
        return String.format(
                "https://%s-aiplatform.googleapis.com/v1/projects/%s/locations/%s/publishers/google/models/%s:generateContent",
                location, project, location, mid);
    }

    public static String vertexOpenAiModelId(String model) {
        String m = ObjectUtils.orDefault(model, "").trim();
        if (m.isEmpty()) {
            return "google/gemini-2.5-flash";
        }
        if (m.startsWith("google/")) {
            return m;
        }
        return "google/" + m;
    }

    public static String vertexGenerateContentModelId(String model) {
        String m = ObjectUtils.orDefault(model, "").trim();
        if (m.startsWith("google/")) {
            return m.substring("google/".length());
        }
        return m;
    }

    public static String getAccessToken() throws IOException {
        GoogleCredentials credentials =
                GoogleCredentials.getApplicationDefault().createScoped(Collections.singletonList(CLOUD_SCOPE));
        credentials.refreshIfExpired();
        if (credentials.getAccessToken() == null) {
            credentials.refresh();
        }
        if (credentials.getAccessToken() == null) {
            throw new IOException("Application Default Credentials returned no access token.");
        }
        return credentials.getAccessToken().getTokenValue();
    }

    private static String firstNonBlank(String... candidates) {
        if (candidates == null) {
            return null;
        }
        for (String c : candidates) {
            if (c != null && !c.isBlank()) {
                return c;
            }
        }
        return null;
    }
}
