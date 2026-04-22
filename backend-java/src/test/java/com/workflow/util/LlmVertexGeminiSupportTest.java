package com.workflow.util;

import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class LlmVertexGeminiSupportTest {

    @Test
    void readProjectIdFromCredentialsJsonFile_extractsProjectId() throws Exception {
        Path p = Files.createTempFile("creds", ".json");
        Files.writeString(p, "{\n  \"project_id\": \"my-gcp-project\",\n  \"type\": \"service_account\"\n}");
        assertEquals("my-gcp-project", LlmVertexGeminiSupport.readProjectIdFromCredentialsJsonFile(p.toString()));
    }

    @Test
    void resolveProjectIdForVertex_prefersEnvOverJsonFile() throws Exception {
        Path p = Files.createTempFile("creds2", ".json");
        Files.writeString(p, "{\"project_id\": \"from-file\"}");
        MockEnvironment env =
                new MockEnvironment()
                        .withProperty("GOOGLE_CLOUD_PROJECT", "from-env")
                        .withProperty("GOOGLE_APPLICATION_CREDENTIALS", p.toString());
        assertEquals("from-env", LlmVertexGeminiSupport.resolveProjectIdForVertex(env));
    }

    @Test
    void resolveProjectIdForVertex_usesJsonWhenEnvUnset() throws Exception {
        Path p = Files.createTempFile("creds3", ".json");
        Files.writeString(p, "{\"project_id\": \"only-in-json\"}");
        MockEnvironment env = new MockEnvironment().withProperty("GOOGLE_APPLICATION_CREDENTIALS", p.toString());
        assertEquals("only-in-json", LlmVertexGeminiSupport.resolveProjectIdForVertex(env));
    }

    @Test
    void readProjectIdFromCredentialsJsonFile_invalidPath_returnsNull() {
        assertNull(LlmVertexGeminiSupport.readProjectIdFromCredentialsJsonFile("/no/such/file.json"));
    }
}
