package com.workflow.storage;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.util.*;

/**
 * Local directory listing for {@code POST /api/storage/local/list-directory} — mirrors Python {@code LocalFileSystemHandler.list_directory}.
 */
@Service
public class LocalStorageExplorerService {

    private final Optional<Path> restrictedBase;

    public LocalStorageExplorerService(@Value("${workflow.local-file-base-path:}") String configuredBase) {
        if (configuredBase != null && !configuredBase.isBlank()) {
            this.restrictedBase = Optional.of(Paths.get(configuredBase.trim()).toAbsolutePath().normalize());
        } else {
            this.restrictedBase = Optional.empty();
        }
    }

    public LocalListDirectoryResult listDirectory(String directory) throws IOException {
        Path base = restrictedBase.orElseGet(() -> Paths.get("").toAbsolutePath().normalize());
        String raw = directory == null ? "" : directory.trim();
        Path current = raw.isEmpty() ? base : Paths.get(raw).toAbsolutePath().normalize();
        validateWithinBase(current, base);
        if (!Files.isDirectory(current)) {
            throw new IllegalArgumentException("Not a directory: " + current);
        }
        boolean canGoUp = !current.normalize().equals(base.normalize());

        List<String> prefixes = new ArrayList<>();
        List<Map<String, Object>> objects = new ArrayList<>();

        List<Path> children = new ArrayList<>();
        try (var stream = Files.list(current)) {
            stream.forEach(children::add);
        }
        children.sort(Comparator.comparing((Path p) -> !Files.isDirectory(p)).thenComparing(p -> p.getFileName().toString().toLowerCase(Locale.ROOT)));

        for (Path child : children) {
            try {
                if (Files.isDirectory(child)) {
                    prefixes.add(child.toAbsolutePath().normalize() + "/");
                } else if (Files.isRegularFile(child)) {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("name", child.toAbsolutePath().normalize().toString());
                    row.put("display_name", child.getFileName().toString());
                    try {
                        row.put("size", Files.size(child));
                    } catch (IOException e) {
                        row.put("size", null);
                    }
                    try {
                        row.put("updated", Instant.ofEpochMilli(Files.getLastModifiedTime(child).toMillis()).toString());
                    } catch (IOException e) {
                        row.put("updated", null);
                    }
                    objects.add(row);
                }
            } catch (SecurityException ignored) {
                // skip
            }
        }

        return new LocalListDirectoryResult(
                current.toAbsolutePath().normalize().toString(),
                prefixes,
                objects,
                canGoUp,
                base.toAbsolutePath().normalize().toString()
        );
    }

    private void validateWithinBase(Path path, Path base) {
        if (restrictedBase.isEmpty()) {
            return;
        }
        Path p = path.toAbsolutePath().normalize();
        Path b = base.toAbsolutePath().normalize();
        if (!p.startsWith(b)) {
            throw new IllegalArgumentException(
                    "Path '" + p + "' is outside allowed base directory '" + b + "'.");
        }
    }

    public record LocalListDirectoryResult(
            String directory,
            List<String> prefixes,
            List<Map<String, Object>> objects,
            boolean canGoUp,
            String basePath
    ) {
        public Map<String, Object> toBody() {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("directory", directory);
            m.put("prefixes", prefixes);
            m.put("objects", objects);
            m.put("can_go_up", canGoUp);
            m.put("base_path", basePath);
            return m;
        }
    }
}
