package com.workflow.storage;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;

class LocalStorageExplorerServiceTest {

    @Test
    void listsFilesAndDirs(@TempDir Path tmp) throws Exception {
        Files.createFile(tmp.resolve("a.txt"));
        Files.createDirectories(tmp.resolve("sub"));

        LocalStorageExplorerService svc = new LocalStorageExplorerService(tmp.toString());
        LocalStorageExplorerService.LocalListDirectoryResult r = svc.listDirectory("");

        assertTrue(r.prefixes().stream().anyMatch(p -> p.contains("sub")));
        assertEquals(1, r.objects().size());
        assertEquals(tmp.toAbsolutePath().normalize().toString(), r.basePath());
    }

    @Test
    void rejectsPathOutsideBaseWhenRestricted(@TempDir Path tmp) {
        LocalStorageExplorerService svc = new LocalStorageExplorerService(tmp.toString());
        Path outside = tmp.getParent().resolve("outside-" + System.nanoTime());
        assertThrows(IllegalArgumentException.class, () -> svc.listDirectory(outside.toString()));
    }

    @Test
    void unrestrictedListsAnyDirectoryAndAllowsGoUpWhenParentExists(@TempDir Path tmp) throws Exception {
        Files.createFile(tmp.resolve("x.txt"));
        LocalStorageExplorerService svc = new LocalStorageExplorerService("");
        LocalStorageExplorerService.LocalListDirectoryResult r = svc.listDirectory(tmp.toString());
        assertTrue(r.canGoUp());
        assertEquals(1, r.objects().size());
    }
}
