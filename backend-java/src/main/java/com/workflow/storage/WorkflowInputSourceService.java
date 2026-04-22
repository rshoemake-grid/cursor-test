package com.workflow.storage;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.api.core.ApiFuture;
import com.google.api.gax.core.FixedCredentialsProvider;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.pubsub.v1.Publisher;
import com.google.cloud.pubsub.v1.stub.GrpcSubscriberStub;
import com.google.cloud.pubsub.v1.stub.SubscriberStub;
import com.google.cloud.pubsub.v1.stub.SubscriberStubSettings;
import com.google.cloud.storage.BlobId;
import com.google.cloud.storage.BlobInfo;
import com.google.cloud.storage.Storage;
import com.google.protobuf.ByteString;
import com.google.pubsub.v1.AcknowledgeRequest;
import com.google.pubsub.v1.ProjectSubscriptionName;
import com.google.pubsub.v1.PullRequest;
import com.google.pubsub.v1.PullResponse;
import com.google.pubsub.v1.PubsubMessage;
import com.google.pubsub.v1.ReceivedMessage;
import com.google.pubsub.v1.TopicName;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.nio.file.FileSystems;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.PathMatcher;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.TimeUnit;
import java.util.stream.Stream;

/**
 * Read/write for workflow storage nodes (Python {@code read_from_input_source} / {@code write_to_input_source}).
 */
@Service
public class WorkflowInputSourceService {

    private static final Logger log = LoggerFactory.getLogger(WorkflowInputSourceService.class);

    private static final String TYPE_GCP = "gcp_bucket";
    private static final String TYPE_AWS = "aws_s3";
    private static final String TYPE_PUBSUB = "gcp_pubsub";
    private static final String TYPE_LOCAL = "local_filesystem";

    private final Optional<Path> restrictedBase;
    private final ObjectMapper objectMapper;

    public WorkflowInputSourceService(
            @Value("${workflow.local-file-base-path:}") String configuredBase,
            ObjectMapper objectMapper) {
        if (configuredBase != null && !configuredBase.isBlank()) {
            Path raw = Paths.get(configuredBase.trim()).toAbsolutePath().normalize();
            Optional<Path> baseOpt;
            try {
                baseOpt = Optional.of(raw.toFile().getCanonicalFile().toPath());
            } catch (IOException e) {
                baseOpt = Optional.of(raw);
            }
            this.restrictedBase = baseOpt;
        } else {
            this.restrictedBase = Optional.empty();
        }
        this.objectMapper = objectMapper;
    }

    public Object read(String nodeType, Map<String, Object> config) throws Exception {
        return switch (nodeType) {
            case TYPE_GCP -> readGcp(config);
            case TYPE_AWS -> readAws(config);
            case TYPE_PUBSUB -> readPubsub(config);
            case TYPE_LOCAL -> readLocal(config);
            default -> throw new IllegalArgumentException("Unknown input source type: " + nodeType);
        };
    }

    public Map<String, Object> write(String nodeType, Map<String, Object> config, Object data) throws Exception {
        return switch (nodeType) {
            case TYPE_GCP -> writeGcp(config, data);
            case TYPE_AWS -> writeAws(config, data);
            case TYPE_PUBSUB -> writePubsub(config, data);
            case TYPE_LOCAL -> writeLocal(config, data);
            default -> throw new IllegalArgumentException("Unknown input source type: " + nodeType);
        };
    }

    private Object readGcp(Map<String, Object> cfg) throws IOException {
        String bucket = required(cfg, "bucket_name");
        String objectPath = stringVal(cfg.get("object_path"));
        Optional<String> creds = optionalString(cfg.get("credentials"));
        Optional<String> projectId = optionalString(cfg.get("project_id"));
        Storage storage = GcpCredentialFactory.storageClient(creds, projectId);
        if (objectPath != null && !objectPath.isBlank()) {
            byte[] bytes = CloudInputSourceReadSupport.readGcpObjectBytes(storage, bucket, objectPath);
            String text = new String(bytes, StandardCharsets.UTF_8);
            try {
                return objectMapper.readValue(text, Object.class);
            } catch (JsonProcessingException e) {
                return text;
            }
        }
        return CloudInputSourceReadSupport.listGcpObjectNamesCapped(
                storage, bucket, CloudInputSourceReadSupport.MAX_GCS_LIST_KEYS);
    }

    private Map<String, Object> writeGcp(Map<String, Object> cfg, Object data) throws IOException {
        String bucket = required(cfg, "bucket_name");
        String objectPath = required(cfg, "object_path");
        Optional<String> creds = optionalString(cfg.get("credentials"));
        Optional<String> projectId = optionalString(cfg.get("project_id"));
        Storage storage = GcpCredentialFactory.storageClient(creds, projectId);
        SerializedPayload p = serialize(data);
        storage.create(
                BlobInfo.newBuilder(BlobId.of(bucket, objectPath)).setContentType(p.contentType()).build(),
                p.bytes());
        return Map.of("status", "success", "bucket", bucket, "object", objectPath);
    }

    private Object readAws(Map<String, Object> cfg) throws IOException {
        String bucket = required(cfg, "bucket_name");
        String key = stringVal(cfg.get("object_key"));
        try (S3Client s3 = awsClient(cfg)) {
            if (key != null && !key.isBlank()) {
                byte[] bytes = CloudInputSourceReadSupport.readS3ObjectBytes(s3, bucket, key);
                String text = new String(bytes, StandardCharsets.UTF_8);
                try {
                    return objectMapper.readValue(text, Object.class);
                } catch (JsonProcessingException e) {
                    return text;
                }
            }
            return CloudInputSourceReadSupport.listS3ObjectKeysCapped(
                    s3, bucket, CloudInputSourceReadSupport.MAX_S3_LIST_KEYS);
        }
    }

    private Map<String, Object> writeAws(Map<String, Object> cfg, Object data) {
        String bucket = required(cfg, "bucket_name");
        String key = required(cfg, "object_key");
        SerializedPayload p = serialize(data);
        try (S3Client s3 = awsClient(cfg)) {
            s3.putObject(
                    PutObjectRequest.builder().bucket(bucket).key(key).contentType(p.contentType()).build(),
                    RequestBody.fromBytes(p.bytes()));
            return Map.of("status", "success", "bucket", bucket, "key", key);
        }
    }

    private Object readPubsub(Map<String, Object> cfg) throws Exception {
        String projectId = GcpPubSubIds.normalizeProjectId(required(cfg, "project_id"));
        String subscription = required(cfg, "subscription_name");
        Optional<String> creds = optionalString(cfg.get("credentials"));
        GoogleCredentials gc = GcpCredentialFactory.credentials(creds);
        SubscriberStubSettings settings =
                SubscriberStubSettings.newBuilder()
                        .setCredentialsProvider(FixedCredentialsProvider.create(gc))
                        .build();
        String subPath = ProjectSubscriptionName.format(projectId, subscription);
        List<Object> messages = new ArrayList<>();
        try (SubscriberStub subscriber = GrpcSubscriberStub.create(settings)) {
            PullResponse response =
                    subscriber.pullCallable()
                            .call(
                                    PullRequest.newBuilder()
                                            .setSubscription(subPath)
                                            .setMaxMessages(10)
                                            .build());
            List<String> ackIds = new ArrayList<>();
            for (ReceivedMessage rm : response.getReceivedMessagesList()) {
                String text = rm.getMessage().getData().toStringUtf8();
                try {
                    messages.add(objectMapper.readValue(text, Object.class));
                } catch (JsonProcessingException e) {
                    messages.add(text);
                }
                ackIds.add(rm.getAckId());
            }
            if (!ackIds.isEmpty()) {
                subscriber.acknowledgeCallable()
                        .call(
                                AcknowledgeRequest.newBuilder()
                                        .setSubscription(subPath)
                                        .addAllAckIds(ackIds)
                                        .build());
            }
        } catch (Exception e) {
            if (e.getMessage() != null && e.getMessage().toLowerCase().contains("not found")) {
                return List.of();
            }
            throw e;
        }
        if (messages.size() > 1) {
            return messages;
        }
        return messages.isEmpty() ? null : messages.get(0);
    }

    private Map<String, Object> writePubsub(Map<String, Object> cfg, Object data) throws Exception {
        String projectId = GcpPubSubIds.normalizeProjectId(required(cfg, "project_id"));
        String topic = required(cfg, "topic_name");
        Optional<String> creds = optionalString(cfg.get("credentials"));
        GoogleCredentials gc = GcpCredentialFactory.credentials(creds);
        TopicName topicName = TopicName.of(projectId, topic);
        SerializedPayload p = serialize(data);
        Publisher publisher = Publisher.newBuilder(topicName)
                .setCredentialsProvider(FixedCredentialsProvider.create(gc))
                .build();
        try {
            ApiFuture<String> future = publisher.publish(
                    PubsubMessage.newBuilder().setData(ByteString.copyFrom(p.bytes())).build());
            String messageId = future.get(60, TimeUnit.SECONDS);
            return Map.of("status", "success", "topic", topic, "message_id", messageId);
        } finally {
            publisher.shutdown();
            publisher.awaitTermination(30, TimeUnit.SECONDS);
        }
    }

    private Object readLocal(Map<String, Object> cfg) throws IOException {
        Charset encoding = LocalFilesystemWriteSupport.charsetFromConfig(cfg);
        String filePath = required(cfg, "file_path");
        Path path = LocalFilesystemPathResolver.resolveWritePath(filePath, restrictedBase.isPresent());
        validateWithinBase(path);
        if (!Files.exists(path)) {
            throw new java.io.FileNotFoundException("File not found: " + path);
        }
        if (Files.isDirectory(path)) {
            return readLocalDirectory(path, cfg, encoding);
        }
        if (!Files.isRegularFile(path)) {
            throw new IllegalArgumentException("Path exists but is neither a file nor a directory: " + path);
        }
        String readMode = stringVal(cfg.get("read_mode"));
        if (readMode == null || readMode.isBlank()) {
            readMode = "full";
        }
        return switch (readMode) {
            case "lines" -> LocalFileReadModes.readLines(path, cfg, encoding, objectMapper);
            case "batch" -> LocalFileReadModes.readBatch(path, cfg, encoding, objectMapper);
            case "tail" -> LocalFileReadModes.readTail(path, cfg, encoding, objectMapper);
            default -> LocalFileReadModes.readFull(path, cfg, encoding, objectMapper);
        };
    }

    private List<Object> readLocalDirectory(Path dir, Map<String, Object> cfg, Charset encoding) throws IOException {
        String pattern = stringVal(cfg.get("file_pattern"));
        Path base = dir.toAbsolutePath().normalize();
        List<Path> files = new ArrayList<>();
        if (pattern == null || pattern.isBlank()) {
            try (Stream<Path> stream = Files.list(base)) {
                stream.filter(Files::isRegularFile).sorted().forEach(files::add);
            }
        } else {
            String glob = "glob:" + base.toString().replace("\\", "/") + "/" + pattern.replace("\\", "/");
            PathMatcher matcher = FileSystems.getDefault().getPathMatcher(glob);
            try (Stream<Path> walk = Files.walk(base)) {
                walk.filter(p -> Files.isRegularFile(p) && matcher.matches(p)).sorted().forEach(files::add);
            }
        }
        if (files.isEmpty()) {
            throw new java.io.FileNotFoundException(
                    "No files found in directory " + base + (pattern != null && !pattern.isBlank() ? " matching pattern" : ""));
        }
        List<Object> results = new ArrayList<>();
        for (Path file : files) {
            Path abs = file.toAbsolutePath().normalize();
            validateWithinBase(abs);
            try {
                String content = Files.readString(abs, encoding);
                try {
                    results.add(objectMapper.readValue(content, Object.class));
                } catch (JsonProcessingException e) {
                    results.add(content);
                }
            } catch (IOException e) {
                throw new IOException("Error reading file " + file + ": " + e.getMessage(), e);
            }
        }
        return results;
    }

    private Map<String, Object> writeLocal(Map<String, Object> cfg, Object data) throws IOException {
        long t0 = System.nanoTime();
        String filePath = required(cfg, "file_path");
        String filePattern = stringVal(cfg.get("file_pattern"));
        if (filePattern == null) {
            filePattern = "";
        }
        Charset encoding = LocalFilesystemWriteSupport.charsetFromConfig(cfg);
        boolean overwrite = LocalFilesystemWriteSupport.parseOverwrite(cfg.get("overwrite"));
        boolean pathRestricted = restrictedBase.isPresent();

        Path path = LocalFilesystemPathResolver.resolveWritePath(filePath, pathRestricted);
        log.info(
                "LocalFileSystemHandler.write: resolved path in {}s -> {}",
                (System.nanoTime() - t0) / 1_000_000_000.0,
                path);
        validateWithinBase(path);

        if (Files.isDirectory(path)) {
            if (!filePattern.isBlank()) {
                path = LocalFilesystemPathResolver.combineDirAndPattern(path, filePattern, pathRestricted);
                validateWithinBase(path);
            } else {
                throw new IllegalArgumentException(
                        "file_path '"
                                + filePath
                                + "' is a directory. Please provide a file_pattern or use a full file path.");
            }
        }

        if (!overwrite && Files.exists(path)) {
            path = LocalFilesystemWriteSupport.incrementFilenameIfExists(path);
        } else if (overwrite && Files.exists(path)) {
            log.debug("Overwrite enabled: will overwrite existing file {}", path);
        }

        long tMk = System.nanoTime();
        Files.createDirectories(path.getParent());
        log.info(
                "LocalFileSystemHandler.write: ensured parent dirs in {}s (parent={})",
                (System.nanoTime() - tMk) / 1_000_000_000.0,
                path.getParent());

        Optional<LocalFilesystemWriteSupport.DecodedImage> decoded =
                LocalFilesystemWriteSupport.tryDecodeImage(data);
        if (decoded.isPresent()) {
            LocalFilesystemWriteSupport.DecodedImage img = decoded.get();
            String mt = LocalFilesystemWriteSupport.imageMimetypeFromPath(path, img.mimetype());
            long tIo = System.nanoTime();
            Files.write(path, img.bytes(), StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);
            log.info(
                    "LocalFileSystemHandler.write: binary write done in {}s ({} bytes)",
                    (System.nanoTime() - tIo) / 1_000_000_000.0,
                    img.bytes().length);
            Map<String, Object> out = new HashMap<>();
            out.put("status", "success");
            out.put("file_path", path.toString());
            out.put("mimetype", mt);
            out.put("type", "image");
            return out;
        }

        String content;
        try {
            content = LocalFilesystemWriteSupport.serializeForWrite(data, objectMapper);
        } catch (JsonProcessingException e) {
            throw new IOException(e);
        }
        String mimetype = LocalFilesystemWriteSupport.guessMimetype(path);
        long tIo = System.nanoTime();
        Files.writeString(path, content, encoding, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);
        log.info(
                "LocalFileSystemHandler.write: text write done in {}s ({} chars, mimetype={})",
                (System.nanoTime() - tIo) / 1_000_000_000.0,
                content.length(),
                mimetype);
        return Map.of("status", "success", "file_path", path.toString(), "mimetype", mimetype);
    }

    private S3Client awsClient(Map<String, Object> cfg) {
        String region = stringVal(cfg.get("region"));
        if (region == null || region.isBlank()) {
            region = "us-east-1";
        }
        String ak = stringVal(cfg.get("access_key_id"));
        String sk = stringVal(cfg.get("secret_access_key"));
        var builder = S3Client.builder().region(Region.of(region));
        if (ak != null && sk != null && !ak.isBlank() && !sk.isBlank()) {
            builder.credentialsProvider(StaticCredentialsProvider.create(AwsBasicCredentials.create(ak, sk)));
        } else {
            builder.credentialsProvider(DefaultCredentialsProvider.create());
        }
        return builder.build();
    }

    private void validateWithinBase(Path path) {
        if (restrictedBase.isEmpty()) {
            return;
        }
        Path base = restrictedBase.get();
        if (!path.toAbsolutePath().normalize().startsWith(base)) {
            throw new IllegalArgumentException("Path '" + path + "' is outside allowed base '" + base + "'.");
        }
    }

    private SerializedPayload serialize(Object data) {
        if (data == null) {
            return new SerializedPayload("text/plain; charset=utf-8", "".getBytes(StandardCharsets.UTF_8));
        }
        if (data instanceof String s) {
            return new SerializedPayload("text/plain; charset=utf-8", s.getBytes(StandardCharsets.UTF_8));
        }
        if (data instanceof byte[] b) {
            return new SerializedPayload("application/octet-stream", b);
        }
        try {
            return new SerializedPayload(
                    "application/json; charset=utf-8",
                    objectMapper.writeValueAsBytes(data));
        } catch (JsonProcessingException e) {
            String s = String.valueOf(data);
            return new SerializedPayload("text/plain; charset=utf-8", s.getBytes(StandardCharsets.UTF_8));
        }
    }

    private static String required(Map<String, Object> cfg, String key) {
        Object v = cfg.get(key);
        if (v == null || String.valueOf(v).isBlank()) {
            throw new IllegalArgumentException(key + " is required");
        }
        return String.valueOf(v).trim();
    }

    private static String stringVal(Object o) {
        return o == null ? null : String.valueOf(o).trim();
    }

    private static Optional<String> optionalString(Object o) {
        String s = stringVal(o);
        return s == null || s.isBlank() ? Optional.empty() : Optional.of(s);
    }

    private record SerializedPayload(String contentType, byte[] bytes) {
    }
}
