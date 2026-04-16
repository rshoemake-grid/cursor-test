package com.workflow.storage;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.io.RandomAccessFile;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Local filesystem read strategies mirroring Python {@code backend/inputs/local_file_read_modes.py}.
 */
public final class LocalFileReadModes {

    private LocalFileReadModes() {
    }

    public static Object readFull(Path path, Map<String, Object> cfg, Charset encoding, ObjectMapper om) throws IOException {
        if (isImageFile(path)) {
            byte[] data = Files.readAllBytes(path);
            String mime = guessImageMime(path, data);
            return "data:" + mime + ";base64," + Base64.getEncoder().encodeToString(data);
        }
        String content = Files.readString(path, encoding);
        try {
            return om.readValue(content, Object.class);
        } catch (JsonProcessingException e) {
            return content;
        }
    }

    public static Map<String, Object> readLines(Path path, Map<String, Object> cfg, Charset encoding, ObjectMapper om)
            throws IOException {
        boolean skipEmpty = boolCfg(cfg, "skip_empty_lines", true);
        boolean parseJson = boolCfg(cfg, "parse_json_lines", true);
        Integer maxLines = intCfgNullable(cfg, "max_lines");

        List<Map<String, Object>> lines = new ArrayList<>();
        int lineCount = 0;
        try (var br = Files.newBufferedReader(path, encoding)) {
            String line;
            while ((line = br.readLine()) != null) {
                line = stripCrLf(line);
                if (skipEmpty && line.isEmpty()) {
                    continue;
                }
                if (maxLines != null && lineCount >= maxLines) {
                    break;
                }
                lines.add(parseJsonLine(om, line, lineCount + 1, parseJson));
                lineCount++;
            }
        }
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("lines", lines);
        out.put("total_lines", lineCount);
        out.put("file_path", path.toString());
        out.put("read_mode", "lines");
        return out;
    }

    public static Map<String, Object> readBatch(Path path, Map<String, Object> cfg, Charset encoding, ObjectMapper om)
            throws IOException {
        int batchSize = intCfg(cfg, "batch_size", 1000);
        boolean skipEmpty = boolCfg(cfg, "skip_empty_lines", true);
        boolean parseJson = boolCfg(cfg, "parse_json_lines", true);
        int startLine = intCfg(cfg, "start_line", 0);

        List<Map<String, Object>> batches = new ArrayList<>();
        List<Map<String, Object>> currentBatch = new ArrayList<>();
        int lineCount = 0;
        int batchNumber = 0;

        try (var br = Files.newBufferedReader(path, encoding)) {
            for (int i = 0; i < startLine; i++) {
                if (br.readLine() == null) {
                    break;
                }
            }
            String line;
            while ((line = br.readLine()) != null) {
                line = stripCrLf(line);
                if (skipEmpty && line.isEmpty()) {
                    continue;
                }
                currentBatch.add(parseJsonLine(om, line, startLine + lineCount + 1, parseJson));
                lineCount++;
                if (currentBatch.size() >= batchSize) {
                    batches.add(batchMap(batchNumber, startLine, batchSize, lineCount, currentBatch));
                    batchNumber++;
                    currentBatch = new ArrayList<>();
                }
            }
        }
        if (!currentBatch.isEmpty()) {
            batches.add(batchMap(batchNumber, startLine, batchSize, lineCount, currentBatch));
        }
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("batches", batches);
        out.put("total_batches", batches.size());
        out.put("total_lines", lineCount);
        out.put("batch_size", batchSize);
        out.put("file_path", path.toString());
        out.put("read_mode", "batch");
        return out;
    }

    public static Map<String, Object> readTail(Path path, Map<String, Object> cfg, Charset encoding, ObjectMapper om)
            throws IOException {
        int numLines = intCfg(cfg, "tail_lines", 10);
        boolean follow = boolCfg(cfg, "tail_follow", false);
        double waitTimeoutSec = doubleCfg(cfg, "tail_wait_timeout", 5.0);
        boolean parseJson = boolCfg(cfg, "parse_json_lines", true);

        long fileSize = Files.size(path);
        if (fileSize == 0) {
            return tailMap(path, List.of(), numLines, follow, 0);
        }

        List<String> rawLines = tailLinesFromEnd(path, encoding, numLines, fileSize);
        List<Map<String, Object>> parsed = new ArrayList<>();
        for (int i = 0; i < rawLines.size(); i++) {
            parsed.add(parseJsonLine(om, rawLines.get(i), i + 1, parseJson));
        }

        if (follow) {
            long initialSize = fileSize;
            long startMs = System.currentTimeMillis();
            while (System.currentTimeMillis() - startMs < waitTimeoutSec * 1000L) {
                try {
                    Thread.sleep(500);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    break;
                }
                long currentSize = Files.size(path);
                if (currentSize > initialSize) {
                    try (RandomAccessFile raf = new RandomAccessFile(path.toFile(), "r")) {
                        raf.seek(initialSize);
                        int toRead = (int) Math.min(Integer.MAX_VALUE, currentSize - initialSize);
                        byte[] buf = new byte[toRead];
                        raf.readFully(buf);
                        String newContent = new String(buf, encoding);
                        for (String newLine : newContent.split("\n", -1)) {
                            if (newLine.isBlank()) {
                                continue;
                            }
                            parsed.add(parseJsonLine(om, stripCrLf(newLine), parsed.size() + 1, parseJson));
                        }
                        initialSize = currentSize;
                        startMs = System.currentTimeMillis();
                    }
                }
            }
        }

        return tailMap(path, parsed, numLines, follow, fileSize);
    }

    private static List<String> tailLinesFromEnd(Path path, Charset encoding, int numLines, long fileSize)
            throws IOException {
        List<String> linesFound = new ArrayList<>();
        int chunkSize = (int) Math.min(8192, fileSize);
        try (RandomAccessFile raf = new RandomAccessFile(path.toFile(), "r")) {
            long position = fileSize;
            String carry = "";
            while (position > 0 && linesFound.size() < numLines) {
                long readSize = Math.min(chunkSize, position);
                position -= readSize;
                raf.seek(position);
                byte[] buf = new byte[(int) readSize];
                raf.readFully(buf);
                String chunk = new String(buf, encoding) + carry;
                String[] chunkLines = chunk.split("\n", -1);
                carry = chunkLines[0];
                for (int i = chunkLines.length - 1; i >= 1; i--) {
                    if (!chunkLines[i].isBlank()) {
                        linesFound.add(0, chunkLines[i]);
                        if (linesFound.size() >= numLines) {
                            break;
                        }
                    }
                }
            }
            if (!carry.isBlank() && linesFound.size() < numLines) {
                linesFound.add(0, carry);
            }
        }
        if (linesFound.size() > numLines) {
            return new ArrayList<>(linesFound.subList(linesFound.size() - numLines, linesFound.size()));
        }
        return linesFound;
    }

    private static Map<String, Object> tailMap(
            Path path, List<Map<String, Object>> lines, int tailLines, boolean follow, long fileSize) {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("lines", lines);
        out.put("total_lines", lines.size());
        out.put("file_path", path.toString());
        out.put("read_mode", "tail");
        out.put("tail_lines", tailLines);
        out.put("follow", follow);
        out.put("file_size", fileSize);
        return out;
    }

    static Map<String, Object> parseJsonLine(ObjectMapper om, String line, int lineNumber, boolean parseJson) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("line_number", lineNumber);
        m.put("raw", line);
        if (parseJson) {
            try {
                m.put("content", om.readValue(line, Object.class));
            } catch (JsonProcessingException e) {
                m.put("content", line);
            }
        } else {
            m.put("content", line);
        }
        return m;
    }

    private static Map<String, Object> batchMap(
            int batchNumber, int startLine, int batchSize, int lineCount, List<Map<String, Object>> currentBatch) {
        Map<String, Object> b = new LinkedHashMap<>();
        b.put("batch_number", batchNumber);
        b.put("start_line", startLine + (batchNumber * batchSize));
        b.put("end_line", startLine + lineCount);
        b.put("lines", new ArrayList<>(currentBatch));
        return b;
    }

    private static String stripCrLf(String line) {
        int len = line.length();
        if (len >= 2 && line.charAt(len - 2) == '\r' && line.charAt(len - 1) == '\n') {
            return line.substring(0, len - 2);
        }
        if (len >= 1 && (line.charAt(len - 1) == '\n' || line.charAt(len - 1) == '\r')) {
            return line.substring(0, len - 1);
        }
        return line;
    }

    private static boolean isImageFile(Path path) throws IOException {
        String name = path.getFileName().toString().toLowerCase(Locale.ROOT);
        if (name.endsWith(".jpg") || name.endsWith(".jpeg") || name.endsWith(".png") || name.endsWith(".gif")
                || name.endsWith(".webp") || name.endsWith(".bmp") || name.endsWith(".svg") || name.endsWith(".ico")) {
            return true;
        }
        if (!Files.isRegularFile(path) || Files.size(path) < 8) {
            return false;
        }
        byte[] magic = Files.readAllBytes(path);
        if (magic.length < 4) {
            return false;
        }
        if (magic[0] == (byte) 0x89 && magic[1] == 'P' && magic[2] == 'N' && magic[3] == 'G') {
            return true;
        }
        if ((magic[0] & 0xFF) == 0xFF && (magic[1] & 0xFF) == 0xD8 && (magic[2] & 0xFF) == 0xFF) {
            return true;
        }
        if (magic[0] == 'G' && magic[1] == 'I' && magic[2] == 'F' && magic[3] == '8') {
            return true;
        }
        return magic.length >= 12 && magic[0] == 'R' && magic[1] == 'I' && magic[2] == 'F' && magic[3] == 'F';
    }

    private static String guessImageMime(Path path, byte[] data) {
        if (data.length >= 4 && data[0] == (byte) 0x89 && data[1] == 'P' && data[2] == 'N' && data[3] == 'G') {
            return "image/png";
        }
        if (data.length >= 3 && (data[0] & 0xFF) == 0xFF && (data[1] & 0xFF) == 0xD8) {
            return "image/jpeg";
        }
        if (data.length >= 4 && data[0] == 'G' && data[1] == 'I' && data[2] == 'F') {
            return "image/gif";
        }
        String n = path.getFileName().toString().toLowerCase(Locale.ROOT);
        if (n.endsWith(".png")) {
            return "image/png";
        }
        if (n.endsWith(".jpg") || n.endsWith(".jpeg")) {
            return "image/jpeg";
        }
        if (n.endsWith(".webp")) {
            return "image/webp";
        }
        return "image/jpeg";
    }

    private static boolean boolCfg(Map<String, Object> cfg, String key, boolean defaultVal) {
        Object o = cfg.get(key);
        if (o == null) {
            return defaultVal;
        }
        if (o instanceof Boolean b) {
            return b;
        }
        String s = String.valueOf(o).trim().toLowerCase(Locale.ROOT);
        return "true".equals(s) || "1".equals(s) || "yes".equals(s);
    }

    private static int intCfg(Map<String, Object> cfg, String key, int defaultVal) {
        Object o = cfg.get(key);
        if (o == null) {
            return defaultVal;
        }
        if (o instanceof Number n) {
            return n.intValue();
        }
        try {
            return Integer.parseInt(String.valueOf(o).trim());
        } catch (NumberFormatException e) {
            return defaultVal;
        }
    }

    private static Integer intCfgNullable(Map<String, Object> cfg, String key) {
        Object o = cfg.get(key);
        if (o == null) {
            return null;
        }
        if (o instanceof Number n) {
            return n.intValue();
        }
        try {
            return Integer.parseInt(String.valueOf(o).trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private static double doubleCfg(Map<String, Object> cfg, String key, double defaultVal) {
        Object o = cfg.get(key);
        if (o == null) {
            return defaultVal;
        }
        if (o instanceof Number n) {
            return n.doubleValue();
        }
        try {
            return Double.parseDouble(String.valueOf(o).trim());
        } catch (NumberFormatException e) {
            return defaultVal;
        }
    }
}
