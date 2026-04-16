package com.workflow.config;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.boot.SpringApplication;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.StandardEnvironment;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class DotenvEnvironmentPostProcessorTest {

    @TempDir
    Path tempDir;

    @Test
    void postProcessEnvironment_loadsExplicitPath() throws Exception {
        Path envFile = tempDir.resolve(".env");
        Files.writeString(envFile, """
                DEV_BOOTSTRAP_USERNAME=alice
                DEV_BOOTSTRAP_PASSWORD=abcd1234!
                """);

        ConfigurableEnvironment env = new StandardEnvironment();
        System.setProperty(DotenvEnvironmentPostProcessor.DOTENV_PATH_PROPERTY, envFile.toString());
        try {
            new DotenvEnvironmentPostProcessor().postProcessEnvironment(env, new SpringApplication());

            assertEquals("alice", env.getProperty("DEV_BOOTSTRAP_USERNAME"));
            assertEquals("abcd1234!", env.getProperty("DEV_BOOTSTRAP_PASSWORD"));
            assertTrue(env.getPropertySources().contains(DotenvEnvironmentPostProcessor.PROPERTY_SOURCE_NAME));
        } finally {
            System.clearProperty(DotenvEnvironmentPostProcessor.DOTENV_PATH_PROPERTY);
        }
    }

    @Test
    void postProcessEnvironment_stripsMatchingQuotes() throws Exception {
        Path envFile = tempDir.resolve(".env");
        Files.writeString(envFile, "DEV_BOOTSTRAP_PASSWORD='abcd1234!'\n");

        ConfigurableEnvironment env = new StandardEnvironment();
        System.setProperty(DotenvEnvironmentPostProcessor.DOTENV_PATH_PROPERTY, envFile.toString());
        try {
            new DotenvEnvironmentPostProcessor().postProcessEnvironment(env, new SpringApplication());
            assertEquals("abcd1234!", env.getProperty("DEV_BOOTSTRAP_PASSWORD"));
        } finally {
            System.clearProperty(DotenvEnvironmentPostProcessor.DOTENV_PATH_PROPERTY);
        }
    }

    @Test
    void normalizeDotenvValue_nullSafe() {
        assertNull(DotenvEnvironmentPostProcessor.normalizeDotenvValue(null));
        assertEquals("x", DotenvEnvironmentPostProcessor.normalizeDotenvValue("x"));
        assertEquals("a b", DotenvEnvironmentPostProcessor.normalizeDotenvValue("\"a b\""));
    }
}
