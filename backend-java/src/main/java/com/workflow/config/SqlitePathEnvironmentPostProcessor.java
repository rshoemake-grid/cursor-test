package com.workflow.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.Ordered;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.nio.file.Path;
import java.util.Map;

/**
 * Resolves relative {@code jdbc:sqlite:...} file paths against the repository root (or an explicit
 * base directory), matching Python {@code backend/config.py} so the DB file is stable regardless of
 * process working directory.
 */
public class SqlitePathEnvironmentPostProcessor implements EnvironmentPostProcessor, Ordered {

    private static final Logger log = LoggerFactory.getLogger(SqlitePathEnvironmentPostProcessor.class);

    static final String PROPERTY_SOURCE_NAME = "sqlitePathResolved";
    static final String SQLITE_BASE_PROPERTY = "workflow.sqlite.base-directory";

    private static final String JDBC_SQLITE_PREFIX = "jdbc:sqlite:";

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE + 1;
    }

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        String url = environment.getProperty("spring.datasource.url");
        if (url == null || url.isBlank()) {
            return;
        }
        String resolved = resolveSqliteUrlIfRelative(url.trim(), environment);
        if (!resolved.equals(url.trim())) {
            log.info("Resolved SQLite JDBC URL (relative path anchored to project base)");
            environment.getPropertySources()
                    .addFirst(new MapPropertySource(PROPERTY_SOURCE_NAME, Map.of("spring.datasource.url", resolved)));
        }
    }

    static String resolveSqliteUrlIfRelative(String url, ConfigurableEnvironment environment) {
        if (!url.regionMatches(true, 0, JDBC_SQLITE_PREFIX, 0, JDBC_SQLITE_PREFIX.length())) {
            return url;
        }
        String pathPart = url.substring(JDBC_SQLITE_PREFIX.length());
        if (pathPart.isEmpty() || pathPart.startsWith(":")) {
            return url;
        }
        Path candidate = Path.of(pathPart);
        if (candidate.isAbsolute()) {
            return url;
        }
        Path base = resolveProjectBase(environment);
        Path absolute = base.resolve(candidate).normalize().toAbsolutePath();
        return JDBC_SQLITE_PREFIX + absolute;
    }

    static Path resolveProjectBase(ConfigurableEnvironment environment) {
        String explicit = environment.getProperty(SQLITE_BASE_PROPERTY);
        if (explicit != null && !explicit.isBlank()) {
            return Path.of(explicit.trim()).toAbsolutePath().normalize();
        }
        Path cwd = Path.of(System.getProperty("user.dir", ".")).toAbsolutePath().normalize();
        if ("backend-java".equals(cwd.getFileName().toString())) {
            Path parent = cwd.getParent();
            if (parent != null) {
                return parent;
            }
        }
        return cwd;
    }
}
