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

class LocalFileReadModesTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void readLines_respectsMaxLinesAndSkipEmpty(@TempDir Path dir) throws Exception {
        Path f = dir.resolve("l.txt");
        Files.writeString(f, "a\n\n{\"x\":1}\n", StandardCharsets.UTF_8);
        Map<String, Object> cfg = Map.of("read_mode", "lines", "max_lines", 2, "skip_empty_lines", true, "parse_json_lines", true);
        Map<String, Object> out = LocalFileReadModes.readLines(f, cfg, StandardCharsets.UTF_8, objectMapper);
        assertEquals("lines", out.get("read_mode"));
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> lines = (List<Map<String, Object>>) out.get("lines");
        assertEquals(2, lines.size());
        assertEquals("a", lines.get(0).get("content"));
        assertEquals(Map.of("x", 1), lines.get(1).get("content"));
    }

    @Test
    void readBatch_groupsByBatchSize(@TempDir Path dir) throws Exception {
        Path f = dir.resolve("b.txt");
        Files.writeString(f, "1\n2\n3\n4\n", StandardCharsets.UTF_8);
        Map<String, Object> cfg = Map.of("read_mode", "batch", "batch_size", 2, "start_line", 0);
        Map<String, Object> out = LocalFileReadModes.readBatch(f, cfg, StandardCharsets.UTF_8, objectMapper);
        assertEquals("batch", out.get("read_mode"));
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> batches = (List<Map<String, Object>>) out.get("batches");
        assertEquals(2, batches.size());
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> b0 = (List<Map<String, Object>>) batches.get(0).get("lines");
        assertEquals(2, b0.size());
    }

    @Test
    void readTail_returnsLastNonEmptyLines(@TempDir Path dir) throws Exception {
        Path f = dir.resolve("t.txt");
        Files.writeString(f, "x\ny\nz\n", StandardCharsets.UTF_8);
        Map<String, Object> cfg = Map.of("read_mode", "tail", "tail_lines", 2, "tail_follow", false, "parse_json_lines", false);
        Map<String, Object> out = LocalFileReadModes.readTail(f, cfg, StandardCharsets.UTF_8, objectMapper);
        assertEquals("tail", out.get("read_mode"));
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> lines = (List<Map<String, Object>>) out.get("lines");
        assertEquals(2, lines.size());
        assertEquals("y", lines.get(0).get("content"));
        assertEquals("z", lines.get(1).get("content"));
    }

    @Test
    void readFull_parsesJsonObject(@TempDir Path dir) throws Exception {
        Path f = dir.resolve("j.json");
        Files.writeString(f, "{\"k\":true}", StandardCharsets.UTF_8);
        Map<String, Object> cfg = Map.of("read_mode", "full");
        Object out = LocalFileReadModes.readFull(f, cfg, StandardCharsets.UTF_8, objectMapper);
        assertTrue(out instanceof Map);
        assertEquals(true, ((Map<?, ?>) out).get("k"));
    }
}
