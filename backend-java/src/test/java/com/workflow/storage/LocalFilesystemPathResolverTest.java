package com.workflow.storage;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.api.parallel.Execution;
import org.junit.jupiter.api.parallel.ExecutionMode;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;

@Execution(ExecutionMode.SAME_THREAD)
class LocalFilesystemPathResolverTest {

    @Test
    void resolve_requiresNonBlank() {
        assertThrows(IllegalArgumentException.class, () -> LocalFilesystemPathResolver.resolveWritePath("", false));
        assertThrows(IllegalArgumentException.class, () -> LocalFilesystemPathResolver.resolveWritePath("   ", false));
    }

    @Test
    void resolve_unrestricted_absoluteNormalizesDotSegments(@TempDir Path tmp) throws IOException {
        Files.createDirectories(tmp.resolve("a"));
        Path input = tmp.resolve("a").resolve("..").resolve("x.txt");
        Path p = LocalFilesystemPathResolver.resolveWritePath(input.toString(), false);
        assertTrue(p.isAbsolute());
        assertEquals(tmp.resolve("x.txt").normalize(), p);
    }

    @Test
    void resolve_unrestricted_relativeUsesUserDir(@TempDir Path tmp) throws IOException {
        String prev = System.getProperty("user.dir");
        try {
            System.setProperty("user.dir", tmp.toString());
            Path p = LocalFilesystemPathResolver.resolveWritePath("out/nested/file.txt", false);
            assertEquals(tmp.resolve("out").resolve("nested").resolve("file.txt"), p);
        } finally {
            System.setProperty("user.dir", prev);
        }
    }

    @Test
    void resolve_restricted_usesCanonicalPath(@TempDir Path base) throws IOException {
        Path sub = Files.createDirectories(base.resolve("sub"));
        Path target = sub.resolve("out.txt");
        Path p = LocalFilesystemPathResolver.resolveWritePath(target.toString(), true);
        assertEquals(sub.toRealPath().resolve("out.txt"), p);
    }

    @Test
    void combinePattern_unrestricted(@TempDir Path tmp) throws IOException {
        Path dir = Files.createDirectories(tmp.resolve("d"));
        Path p = LocalFilesystemPathResolver.combineDirAndPattern(dir, "w.json", false);
        assertEquals(dir.resolve("w.json").normalize(), p);
    }

    @Test
    void combinePattern_restricted(@TempDir Path base) throws IOException {
        Path dir = Files.createDirectories(base.resolve("sub"));
        Path p = LocalFilesystemPathResolver.combineDirAndPattern(dir, "out.json", true);
        assertEquals(dir.resolve("out.json").toFile().getCanonicalFile().toPath(), p);
    }
}
