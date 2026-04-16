package com.workflow.config;

import io.github.cdimascio.dotenv.Dotenv;
import io.github.cdimascio.dotenv.DotenvEntry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.Ordered;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;
import org.springframework.core.env.MutablePropertySources;
import org.springframework.core.env.StandardEnvironment;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

/**
 * Makes root {@code .env} available to Spring (OS env still wins). Gradle {@code bootRun} uses
 * {@code user.dir} = {@code backend-java/}, so we also try the parent directory (repo root).
 */
public class DotenvEnvironmentPostProcessor implements EnvironmentPostProcessor, Ordered {

    private static final Logger log = LoggerFactory.getLogger(DotenvEnvironmentPostProcessor.class);

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE;
    }

    static final String PROPERTY_SOURCE_NAME = "dotenvFile";
    static final String DOTENV_PATH_PROPERTY = "workflow.dotenv.path";

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        Optional<Path> dotenvPath = resolveDotenvPath(environment);
        if (dotenvPath.isEmpty()) {
            return;
        }
        Path path = dotenvPath.get();
        if (!Files.isRegularFile(path)) {
            return;
        }
        Path directory = path.getParent();
        String filename = path.getFileName().toString();
        Dotenv dotenv = Dotenv.configure()
                .directory(directory.toString())
                .filename(filename)
                .ignoreIfMalformed()
                .load();
        Map<String, Object> map = new LinkedHashMap<>();
        for (DotenvEntry e : dotenv.entries()) {
            map.put(e.getKey(), normalizeDotenvValue(e.getValue()));
        }
        if (map.isEmpty()) {
            return;
        }
        log.info("Loaded {} variable(s) from {}", map.size(), path.toAbsolutePath());
        MutablePropertySources sources = environment.getPropertySources();
        sources.addAfter(
                StandardEnvironment.SYSTEM_ENVIRONMENT_PROPERTY_SOURCE_NAME,
                new MapPropertySource(PROPERTY_SOURCE_NAME, map));
    }

    /**
     * Strip one matching pair of surrounding quotes so {@code 'pass!'} and {@code pass!} behave the same.
     */
    static String normalizeDotenvValue(String raw) {
        if (raw == null) {
            return null;
        }
        String v = raw;
        if (v.length() >= 2) {
            char first = v.charAt(0);
            char last = v.charAt(v.length() - 1);
            if ((first == '\'' && last == '\'') || (first == '"' && last == '"')) {
                return v.substring(1, v.length() - 1);
            }
        }
        return raw;
    }

    static Optional<Path> resolveDotenvPath(ConfigurableEnvironment environment) {
        String explicit = environment.getProperty(DOTENV_PATH_PROPERTY);
        if (explicit != null && !explicit.isBlank()) {
            return Optional.of(Path.of(explicit.trim()));
        }
        Path cwd = Path.of(System.getProperty("user.dir", ".")).toAbsolutePath().normalize();
        Path inCwd = cwd.resolve(".env");
        if (Files.isRegularFile(inCwd)) {
            return Optional.of(inCwd);
        }
        Path parent = cwd.getParent();
        if (parent != null) {
            Path inParent = parent.resolve(".env");
            if (Files.isRegularFile(inParent)) {
                return Optional.of(inParent);
            }
        }
        return Optional.empty();
    }
}
