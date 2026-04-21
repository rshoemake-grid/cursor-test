package com.workflow.config;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.env.MapPropertySource;
import org.springframework.core.env.StandardEnvironment;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Relative {@code jdbc:sqlite:...} URLs are anchored to the repo root (or an explicit base dir),
 * matching Python {@code backend/config.py} behavior.
 */
class SqlitePathEnvironmentPostProcessorTest {

    private final EnvironmentPostProcessor processor = new SqlitePathEnvironmentPostProcessor();

    private String previousUserDir;

    @AfterEach
    void restoreUserDir() {
        if (previousUserDir != null) {
            System.setProperty("user.dir", previousUserDir);
        } else {
            System.clearProperty("user.dir");
        }
    }

    @Test
    void postProcessEnvironment_whenRunningFromBackendJava_resolvesRelativeSqliteToRepoRoot() throws Exception {
        Path repo = Files.createTempDirectory("repo");
        Path backendJava = repo.resolve("backend-java");
        Files.createDirectories(backendJava);
        previousUserDir = System.setProperty("user.dir", backendJava.toString());

        StandardEnvironment env = new StandardEnvironment();
        Map<String, Object> map = new HashMap<>();
        map.put("spring.datasource.url", "jdbc:sqlite:./workflows.db");
        env.getPropertySources().addFirst(new MapPropertySource("test", map));

        processor.postProcessEnvironment(env, new SpringApplication());

        String url = env.getProperty("spring.datasource.url");
        assertNotNull(url);
        assertTrue(url.startsWith("jdbc:sqlite:"), url);
        String filePart = url.substring("jdbc:sqlite:".length());
        Path resolved = Path.of(filePart).toAbsolutePath().normalize();
        assertEquals(repo.resolve("workflows.db").normalize(), resolved);
    }

    @Test
    void postProcessEnvironment_absoluteSqlitePath_unchanged() {
        Path abs = Path.of("/tmp", "abs-workflows.db").toAbsolutePath();
        previousUserDir = System.setProperty("user.dir", System.getProperty("java.io.tmpdir"));

        StandardEnvironment env = new StandardEnvironment();
        String original = "jdbc:sqlite:" + abs;
        env.getPropertySources().addFirst(new MapPropertySource("test", Map.of("spring.datasource.url", original)));

        processor.postProcessEnvironment(env, new SpringApplication());

        assertEquals(original, env.getProperty("spring.datasource.url"));
    }

    @Test
    void postProcessEnvironment_sqliteMemory_unchanged() {
        previousUserDir = System.setProperty("user.dir", System.getProperty("java.io.tmpdir"));

        StandardEnvironment env = new StandardEnvironment();
        env.getPropertySources().addFirst(
                new MapPropertySource("test", Map.of("spring.datasource.url", "jdbc:sqlite::memory:")));

        processor.postProcessEnvironment(env, new SpringApplication());

        assertEquals("jdbc:sqlite::memory:", env.getProperty("spring.datasource.url"));
    }

    @Test
    void postProcessEnvironment_nonSqliteUrl_unchanged() {
        previousUserDir = System.setProperty("user.dir", System.getProperty("java.io.tmpdir"));

        StandardEnvironment env = new StandardEnvironment();
        env.getPropertySources().addFirst(
                new MapPropertySource("test", Map.of("spring.datasource.url", "jdbc:h2:mem:testdb")));

        processor.postProcessEnvironment(env, new SpringApplication());

        assertEquals("jdbc:h2:mem:testdb", env.getProperty("spring.datasource.url"));
    }

    @Test
    void postProcessEnvironment_explicitBaseDirectory_overridesInference() throws Exception {
        Path customBase = Files.createTempDirectory("custom-base");
        Path nested = customBase.resolve("nested");
        Files.createDirectories(nested);
        previousUserDir = System.setProperty("user.dir", nested.toString());

        StandardEnvironment env = new StandardEnvironment();
        Map<String, Object> map = new HashMap<>();
        map.put("workflow.sqlite.base-directory", customBase.toString());
        map.put("spring.datasource.url", "jdbc:sqlite:./workflows.db");
        env.getPropertySources().addFirst(new MapPropertySource("test", map));

        processor.postProcessEnvironment(env, new SpringApplication());

        String url = env.getProperty("spring.datasource.url");
        assertNotNull(url);
        String filePart = url.substring("jdbc:sqlite:".length());
        Path resolved = Path.of(filePart).toAbsolutePath().normalize();
        assertEquals(customBase.resolve("workflows.db").normalize(), resolved);
    }
}
