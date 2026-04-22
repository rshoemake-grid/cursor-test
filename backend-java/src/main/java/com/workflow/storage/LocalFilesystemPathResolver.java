package com.workflow.storage;

import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Mirrors Python {@code resolve_local_filesystem_write_path} / {@code combine_local_write_path_with_pattern}:
 * when restricted (sandbox), use canonical path resolution; when unrestricted, normalize without
 * following symlinks to avoid hangs on cyclic links.
 */
public final class LocalFilesystemPathResolver {

    private LocalFilesystemPathResolver() {}

    public static Path resolveWritePath(String filePath, boolean pathRestricted) throws IOException {
        if (filePath == null || filePath.isBlank()) {
            throw new IllegalArgumentException("file_path is required");
        }
        String expanded = expandTilde(filePath.trim());
        Path raw = Paths.get(expanded);
        Path abs =
                raw.isAbsolute()
                        ? raw.normalize()
                        : Paths.get(System.getProperty("user.dir")).resolve(raw).normalize();
        if (pathRestricted) {
            return abs.toFile().getCanonicalFile().toPath();
        }
        return abs;
    }

    public static Path combineDirAndPattern(Path directory, String filePattern, boolean pathRestricted)
            throws IOException {
        Path combined = directory.resolve(filePattern).normalize();
        if (pathRestricted) {
            return combined.toFile().getCanonicalFile().toPath();
        }
        return combined;
    }

    private static String expandTilde(String filePath) {
        return filePath.replaceFirst("^~", System.getProperty("user.home"));
    }
}
