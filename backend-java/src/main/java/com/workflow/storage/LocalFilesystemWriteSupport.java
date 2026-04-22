package com.workflow.storage;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Base64;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

/**
 * Shared local write behavior mirroring Python {@code LocalFileSystemHandler.write}:
 * overwrite / filename increment, mimetype by extension, JSON pretty-print, image payloads.
 */
public final class LocalFilesystemWriteSupport {

    public static final int MAX_FILENAME_INCREMENT_ATTEMPTS = 10_000;

    private static final String B64_ALPHABET =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=\n\r";

    private LocalFilesystemWriteSupport() {}

    public static boolean parseOverwrite(Object raw) {
        if (raw == null) {
            return true;
        }
        if (raw instanceof Boolean b) {
            return b;
        }
        String s = String.valueOf(raw).trim().toLowerCase(Locale.ROOT);
        if (s.isEmpty()) {
            return true;
        }
        return "true".equals(s) || "1".equals(s) || "yes".equals(s);
    }

    public static Path incrementFilenameIfExists(Path path) throws IOException {
        Path parent = path.getParent();
        if (parent == null) {
            throw new IOException("Cannot increment filename for path without parent: " + path);
        }
        String name = path.getFileName().toString();
        int dot = name.lastIndexOf('.');
        String stem = dot > 0 ? name.substring(0, dot) : name;
        String suffix = dot > 0 ? name.substring(dot) : "";
        int counter = 1;
        while (counter <= MAX_FILENAME_INCREMENT_ATTEMPTS) {
            Path candidate = parent.resolve(stem + "_" + counter + suffix);
            if (!Files.exists(candidate)) {
                return candidate;
            }
            counter++;
        }
        throw new IllegalStateException(
                "Could not find available filename after " + MAX_FILENAME_INCREMENT_ATTEMPTS + " attempts.");
    }

    public static String guessMimetype(Path path) {
        String n = path.getFileName().toString().toLowerCase(Locale.ROOT);
        if (n.endsWith(".jsonl")) {
            return "application/x-ndjson";
        }
        if (n.endsWith(".json")) {
            return "application/json";
        }
        if (n.endsWith(".txt")) {
            return "text/plain";
        }
        if (n.endsWith(".csv")) {
            return "text/csv";
        }
        return "application/octet-stream";
    }

    public static String serializeForWrite(Object data, ObjectMapper objectMapper) throws JsonProcessingException {
        if (data == null) {
            return "";
        }
        if (data instanceof String s) {
            return s;
        }
        if (data instanceof Map<?, ?> || data instanceof java.util.List<?>) {
            return objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(data);
        }
        if (data.getClass().isArray()) {
            return objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(data);
        }
        return String.valueOf(data);
    }

    public record DecodedImage(byte[] bytes, String mimetype) {}

    public static Optional<DecodedImage> tryDecodeImage(Object data) {
        if (data instanceof String s) {
            Optional<DecodedImage> fromUrl = decodeDataImageUrl(s);
            if (fromUrl.isPresent()) {
                return fromUrl;
            }
            return decodeLongBase64ImageString(s);
        }
        if (data instanceof byte[] b) {
            return decodeBytesMagic(b);
        }
        if (data instanceof Map<?, ?> m) {
            @SuppressWarnings("unchecked")
            Map<String, Object> map = (Map<String, Object>) m;
            if (map.containsKey("image")) {
                Object v = map.get("image");
                if (v instanceof String vs) {
                    Optional<DecodedImage> fromUrl = decodeDataImageUrl(vs);
                    if (fromUrl.isPresent()) {
                        return fromUrl;
                    }
                } else if (v instanceof byte[] vb) {
                    return decodeBytesMagic(vb);
                }
            }
            if (map.containsKey("image_data")) {
                Object v = map.get("image_data");
                if (v instanceof String vs) {
                    try {
                        byte[] decoded = Base64.getMimeDecoder().decode(vs.trim());
                        return decodeBytesMagic(decoded);
                    } catch (IllegalArgumentException ignored) {
                        return Optional.empty();
                    }
                } else if (v instanceof byte[] vb) {
                    return decodeBytesMagic(vb);
                }
            }
        }
        return Optional.empty();
    }

    private static Optional<DecodedImage> decodeDataImageUrl(String s) {
        if (!s.startsWith("data:image/")) {
            return Optional.empty();
        }
        int comma = s.indexOf(',');
        if (comma < 0) {
            return Optional.empty();
        }
        try {
            String header = s.substring(0, comma);
            String payload = s.substring(comma + 1);
            String mimetypePart = header.split(";")[0];
            String mimetype = mimetypePart.substring("data:".length());
            byte[] imageData = Base64.getMimeDecoder().decode(payload);
            return Optional.of(new DecodedImage(imageData, mimetype));
        } catch (RuntimeException e) {
            return Optional.empty();
        }
    }

    private static boolean looksLikeBase64Prefix(String s, int maxChars) {
        int lim = Math.min(maxChars, s.length());
        for (int i = 0; i < lim; i++) {
            if (B64_ALPHABET.indexOf(s.charAt(i)) < 0) {
                return false;
            }
        }
        return true;
    }

    private static Optional<DecodedImage> decodeLongBase64ImageString(String data) {
        if (data.length() <= 1000 || !looksLikeBase64Prefix(data, 1000)) {
            return Optional.empty();
        }
        try {
            byte[] decoded = Base64.getMimeDecoder().decode(data.trim());
            if (decoded.length >= 4 && decoded[0] == (byte) 0x89 && decoded[1] == 'P' && decoded[2] == 'N' && decoded[3] == 'G') {
                return Optional.of(new DecodedImage(decoded, "image/png"));
            }
            if (decoded.length >= 2 && (decoded[0] & 0xFF) == 0xFF && (decoded[1] & 0xFF) == 0xD8) {
                return Optional.of(new DecodedImage(decoded, "image/jpeg"));
            }
        } catch (IllegalArgumentException ignored) {
            return Optional.empty();
        }
        return Optional.empty();
    }

    private static Optional<DecodedImage> decodeBytesMagic(byte[] data) {
        if (data.length >= 4 && data[0] == (byte) 0x89 && data[1] == 'P' && data[2] == 'N' && data[3] == 'G') {
            return Optional.of(new DecodedImage(data, "image/png"));
        }
        if (data.length >= 2 && (data[0] & 0xFF) == 0xFF && (data[1] & 0xFF) == 0xD8) {
            return Optional.of(new DecodedImage(data, "image/jpeg"));
        }
        if (data.length >= 4 && data[0] == 'G' && data[1] == 'I' && data[2] == 'F' && data[3] == '8') {
            return Optional.of(new DecodedImage(data, "image/gif"));
        }
        return Optional.empty();
    }

    public static String imageMimetypeFromPath(Path path, String detected) {
        if (detected != null && !detected.isBlank()) {
            return detected;
        }
        String ext = path.getFileName().toString().toLowerCase(Locale.ROOT);
        if (ext.endsWith(".png")) {
            return "image/png";
        }
        if (ext.endsWith(".jpg") || ext.endsWith(".jpeg")) {
            return "image/jpeg";
        }
        if (ext.endsWith(".gif")) {
            return "image/gif";
        }
        if (ext.endsWith(".webp")) {
            return "image/webp";
        }
        return "image/jpeg";
    }

    public static Charset charsetFromConfig(Map<String, Object> cfg) {
        Object enc = cfg.get("encoding");
        if (enc == null || String.valueOf(enc).isBlank()) {
            return StandardCharsets.UTF_8;
        }
        return Charset.forName(String.valueOf(enc).trim());
    }
}
