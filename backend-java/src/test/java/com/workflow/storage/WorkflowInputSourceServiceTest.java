package com.workflow.storage;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class WorkflowInputSourceServiceTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void localReadWrite_roundTripJson(@TempDir Path base) throws Exception {
        WorkflowInputSourceService svc = new WorkflowInputSourceService(base.toString(), objectMapper);
        Path file = base.resolve("nested").resolve("doc.json");
        Map<String, Object> written =
                svc.write("local_filesystem", Map.of("file_path", file.toString()), Map.of("k", "v"));
        assertEquals("success", written.get("status"));

        Object read = svc.read("local_filesystem", Map.of("file_path", file.toString()));
        @SuppressWarnings("unchecked")
        Map<String, Object> map = (Map<String, Object>) read;
        assertEquals("v", map.get("k"));
    }

    @Test
    void localRead_plainText(@TempDir Path base) throws Exception {
        WorkflowInputSourceService svc = new WorkflowInputSourceService(base.toString(), objectMapper);
        Path file = base.resolve("note.txt");
        Files.writeString(file, "hello");
        Object read = svc.read("local_filesystem", Map.of("file_path", file.toString()));
        assertEquals("hello", read);
    }

    @Test
    void localWrite_stringPayload(@TempDir Path base) throws Exception {
        WorkflowInputSourceService svc = new WorkflowInputSourceService(base.toString(), objectMapper);
        Path file = base.resolve("out.txt");
        svc.write("local_filesystem", Map.of("file_path", file.toString()), "plain");
        assertEquals("plain", Files.readString(file));
    }

    @Test
    void localRead_missingFile_throws(@TempDir Path base) {
        WorkflowInputSourceService svc = new WorkflowInputSourceService(base.toString(), objectMapper);
        Path file = base.resolve("nope.txt");
        assertThrows(Exception.class, () -> svc.read("local_filesystem", Map.of("file_path", file.toString())));
    }

    @Test
    void localPathOutsideBase_throws() {
        WorkflowInputSourceService svc = new WorkflowInputSourceService("/tmp/wf-sandbox-xyz", objectMapper);
        assertThrows(
                IllegalArgumentException.class,
                () -> svc.read("local_filesystem", Map.of("file_path", "/etc/passwd")));
    }

    @Test
    void localRead_directory_listsAndReadsFiles(@TempDir Path base) throws Exception {
        WorkflowInputSourceService svc = new WorkflowInputSourceService(base.toString(), objectMapper);
        Path dir = Files.createDirectories(base.resolve("dir"));
        Files.writeString(dir.resolve("a.json"), "1", StandardCharsets.UTF_8);
        Files.writeString(dir.resolve("b.json"), "2", StandardCharsets.UTF_8);
        @SuppressWarnings("unchecked")
        List<Object> list = (List<Object>) svc.read("local_filesystem", Map.of("file_path", dir.toString()));
        assertEquals(2, list.size());
        assertTrue(list.contains(1) || list.contains(1L));
        assertTrue(list.contains(2) || list.contains(2L));
    }
}
