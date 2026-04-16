package com.workflow.storage;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.storage.StorageOptions;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Optional;

/**
 * Builds {@link GoogleCredentials} from inline JSON or Application Default Credentials.
 */
public final class GcpCredentialFactory {

    private GcpCredentialFactory() {
    }

    public static GoogleCredentials credentials(Optional<String> inlineJson) throws IOException {
        if (inlineJson.isPresent() && !inlineJson.get().isBlank()) {
            return GoogleCredentials.fromStream(
                    new ByteArrayInputStream(inlineJson.get().getBytes(StandardCharsets.UTF_8)));
        }
        return GoogleCredentials.getApplicationDefault();
    }

    public static com.google.cloud.storage.Storage storageClient(
            Optional<String> inlineJson,
            Optional<String> projectId) throws IOException {
        StorageOptions.Builder b = StorageOptions.newBuilder().setCredentials(credentials(inlineJson));
        projectId.filter(s -> !s.isBlank()).ifPresent(b::setProjectId);
        return b.build().getService();
    }
}
