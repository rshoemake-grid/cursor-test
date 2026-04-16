package com.workflow.storage;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.api.gax.core.FixedCredentialsProvider;
import com.google.api.gax.paging.Page;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.pubsub.v1.SubscriptionAdminClient;
import com.google.cloud.pubsub.v1.SubscriptionAdminSettings;
import com.google.cloud.pubsub.v1.TopicAdminClient;
import com.google.cloud.pubsub.v1.TopicAdminSettings;
import com.google.cloud.storage.Blob;
import com.google.cloud.storage.Storage;
import com.google.cloud.storage.Storage.BlobListOption;
import com.google.pubsub.v1.ProjectName;
import com.google.pubsub.v1.Subscription;
import com.google.pubsub.v1.Topic;
import com.google.pubsub.v1.TopicName;

import org.springframework.stereotype.Service;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.ec2.Ec2Client;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.*;

/**
 * Cloud storage explorer — mirrors Python {@code storage_explorer_routes}.
 */
@Service
public class CloudStorageExplorerService {

    private static final ObjectMapper JSON = new ObjectMapper();

    public Map<String, Object> gcpListObjects(Map<String, Object> body) throws Exception {
        String bucket = requiredString(body.get("bucket_name"), "bucket_name");
        String normPrefix = stringOrEmpty(body.get("prefix"));
        String delimiter = body.get("delimiter") != null ? String.valueOf(body.get("delimiter")) : "/";
        int maxResults = intOrDefault(body.get("max_results"), 2000);
        Optional<String> creds = optionalString(body.get("credentials"));
        Optional<String> projectId = optionalString(body.get("project_id"));

        Storage storage = GcpCredentialFactory.storageClient(creds, projectId);
        List<BlobListOption> opts = new ArrayList<>();
        opts.add(BlobListOption.prefix(normPrefix));
        opts.add(BlobListOption.pageSize(Math.min(1000, maxResults)));
        if (delimiter != null && !delimiter.isBlank()) {
            opts.add(BlobListOption.delimiter(delimiter));
        }

        Set<String> prefixSet = new TreeSet<>();
        List<Map<String, Object>> objects = new ArrayList<>();
        Page<Blob> page = storage.list(bucket, opts.toArray(BlobListOption[]::new));
        int objectCount = 0;
        boolean done = false;

        while (page != null && !done) {
            for (Blob blob : page.getValues()) {
                if (blob.isDirectory() || blob.getName().endsWith("/")) {
                    prefixSet.add(blob.getName());
                    continue;
                }
                if (objectCount >= maxResults) {
                    done = true;
                    break;
                }
                String name = blob.getName();
                if (delimiter != null && !delimiter.isBlank() && name.endsWith("/")) {
                    continue;
                }
                String display = !normPrefix.isEmpty() && name.startsWith(normPrefix)
                        ? name.substring(normPrefix.length()).replaceFirst("^/+", "")
                        : name;
                if (display.isEmpty()) {
                    String trimmed = name.replaceAll("/+$", "");
                    int last = trimmed.lastIndexOf('/');
                    display = last >= 0 ? trimmed.substring(last + 1) : trimmed;
                    if (display.isEmpty()) {
                        display = name;
                    }
                }
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("name", name);
                row.put("display_name", display.isEmpty() ? name : display);
                row.put("size", blob.getSize());
                row.put("updated", blob.getUpdateTimeOffsetDateTime() != null ? blob.getUpdateTimeOffsetDateTime().toString() : null);
                objects.add(row);
                objectCount++;
            }
            if (done || !page.hasNextPage()) {
                break;
            }
            page = page.getNextPage();
        }

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("prefixes", new ArrayList<>(prefixSet));
        out.put("objects", objects);
        out.put("bucket_name", bucket);
        out.put("prefix", normPrefix);
        return out;
    }

    public Map<String, Object> gcpDefaultProject(Map<String, Object> body) throws Exception {
        Optional<String> creds = optionalString(body.get("credentials"));
        GoogleCredentials gc = GcpCredentialFactory.credentials(creds);
        gc = gc.createScoped("https://www.googleapis.com/auth/cloud-platform.read-only");
        gc.refreshIfExpired();
        if (gc instanceof com.google.auth.oauth2.ServiceAccountCredentials sac) {
            String pid = sac.getProjectId();
            return Map.of("project_id", pid != null ? pid : "");
        }
        return Map.of("project_id", "");
    }

    public Map<String, Object> gcpListBuckets(Map<String, Object> body) throws Exception {
        int max = intOrDefault(body.get("max_results"), 1000);
        Optional<String> creds = optionalString(body.get("credentials"));
        Optional<String> projectId = optionalString(body.get("project_id"));
        Storage storage = GcpCredentialFactory.storageClient(creds, projectId);
        List<Map<String, Object>> rows = new ArrayList<>();
        int i = 0;
        for (com.google.cloud.storage.Bucket b : storage.list().iterateAll()) {
            if (i++ >= max) {
                break;
            }
            rows.add(row(b.getName(), b.getName(), null, null));
        }
        return Map.of("objects", rows);
    }

    public Map<String, Object> gcpListProjects(Map<String, Object> body) throws Exception {
        int max = intOrDefault(body.get("max_results"), 500);
        Optional<String> creds = optionalString(body.get("credentials"));
        GoogleCredentials gc = GcpCredentialFactory.credentials(creds);
        gc = gc.createScoped("https://www.googleapis.com/auth/cloudplatformprojects.readonly");
        gc.refreshIfExpired();
        String token = gc.getAccessToken().getTokenValue();
        HttpClient http = HttpClient.newHttpClient();
        List<Map<String, Object>> rows = new ArrayList<>();
        String pageToken = null;
        while (rows.size() < max) {
            String url = "https://cloudresourcemanager.googleapis.com/v1/projects"
                    + (pageToken != null ? "?pageToken=" + pageToken : "");
            HttpRequest req = HttpRequest.newBuilder(URI.create(url))
                    .header("Authorization", "Bearer " + token)
                    .GET()
                    .build();
            HttpResponse<String> resp = http.send(req, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            if (resp.statusCode() >= 400) {
                throw new IllegalArgumentException("Could not list GCP projects: HTTP " + resp.statusCode() + " " + resp.body());
            }
            JsonNode root = JSON.readTree(resp.body());
            for (JsonNode p : root.path("projects")) {
                if (!"ACTIVE".equals(p.path("lifecycleState").asText())) {
                    continue;
                }
                String pid = p.path("projectId").asText("");
                if (pid.isEmpty()) {
                    continue;
                }
                String pname = p.path("name").asText("");
                String display = pname.isEmpty() || pname.equals(pid) ? pid : pid + " — " + pname;
                rows.add(row(pid, display, null, p.path("createTime").asText(null)));
                if (rows.size() >= max) {
                    break;
                }
            }
            pageToken = root.path("nextPageToken").asText(null);
            if (pageToken == null || pageToken.isBlank()) {
                break;
            }
        }
        return Map.of("objects", rows);
    }

    public Map<String, Object> gcpPubsubListTopics(Map<String, Object> body) throws Exception {
        String projectId = GcpPubSubIds.normalizeProjectId(requiredString(body.get("project_id"), "project_id"));
        int max = intOrDefault(body.get("max_results"), 500);
        Optional<String> creds = optionalString(body.get("credentials"));
        GoogleCredentials gc = GcpCredentialFactory.credentials(creds);
        TopicAdminSettings settings = TopicAdminSettings.newBuilder()
                .setCredentialsProvider(FixedCredentialsProvider.create(gc))
                .build();
        List<Map<String, Object>> rows = new ArrayList<>();
        try (TopicAdminClient client = TopicAdminClient.create(settings)) {
            int i = 0;
            for (Topic t : client.listTopics(ProjectName.of(projectId)).iterateAll()) {
                if (i++ >= max) {
                    break;
                }
                TopicName tn = TopicName.parse(t.getName());
                String shortId = tn.getTopic();
                rows.add(row(shortId, shortId, null, null));
            }
        }
        rows.sort(Comparator.comparing(m -> String.valueOf(m.get("name")).toLowerCase(Locale.ROOT)));
        return Map.of("objects", rows);
    }

    public Map<String, Object> gcpPubsubListSubscriptions(Map<String, Object> body) throws Exception {
        String projectId = GcpPubSubIds.normalizeProjectId(requiredString(body.get("project_id"), "project_id"));
        String topicFilter = stringOrEmpty(body.get("topic_name"));
        int max = intOrDefault(body.get("max_results"), 500);
        Optional<String> creds = optionalString(body.get("credentials"));
        GoogleCredentials gc = GcpCredentialFactory.credentials(creds);
        List<Map<String, Object>> rows = new ArrayList<>();

        if (!topicFilter.isBlank()) {
            TopicAdminSettings topicSettings = TopicAdminSettings.newBuilder()
                    .setCredentialsProvider(FixedCredentialsProvider.create(gc))
                    .build();
            try (TopicAdminClient client = TopicAdminClient.create(topicSettings)) {
                int i = 0;
                TopicName topicName = TopicName.of(projectId, topicFilter);
                for (String subPath : client.listTopicSubscriptions(topicName).iterateAll()) {
                    if (i++ >= max) {
                        break;
                    }
                    String shortId = subPath.replaceFirst("^projects/[^/]+/subscriptions/", "");
                    if (shortId.isBlank()) {
                        continue;
                    }
                    rows.add(row(shortId, shortId, null, null));
                }
            }
        } else {
            SubscriptionAdminSettings settings = SubscriptionAdminSettings.newBuilder()
                    .setCredentialsProvider(FixedCredentialsProvider.create(gc))
                    .build();
            try (SubscriptionAdminClient client = SubscriptionAdminClient.create(settings)) {
                int i = 0;
                for (Subscription sub : client.listSubscriptions(ProjectName.of(projectId)).iterateAll()) {
                    if (i++ >= max) {
                        break;
                    }
                    String shortId = sub.getName().replaceFirst("^projects/[^/]+/subscriptions/", "");
                    if (shortId.isBlank()) {
                        continue;
                    }
                    rows.add(row(shortId, shortId, null, null));
                }
            }
        }
        rows.sort(Comparator.comparing(m -> String.valueOf(m.get("name")).toLowerCase(Locale.ROOT)));
        return Map.of("objects", rows);
    }

    public Map<String, Object> awsListObjects(Map<String, Object> body) {
        String bucket = requiredString(body.get("bucket_name"), "bucket_name");
        String normPrefix = stringOrEmpty(body.get("prefix"));
        String delimiter = body.get("delimiter") != null ? String.valueOf(body.get("delimiter")) : "/";
        int max = intOrDefault(body.get("max_results"), 2000);
        try (S3Client s3 = awsS3Client(body)) {
            Set<String> prefixes = new TreeSet<>();
            List<Map<String, Object>> objects = new ArrayList<>();
            String token = null;
            int pageSize = Math.min(1000, max);
            while (objects.size() < max) {
                ListObjectsV2Request.Builder rb = ListObjectsV2Request.builder()
                        .bucket(bucket)
                        .prefix(normPrefix)
                        .maxKeys(pageSize);
                if (delimiter != null && !delimiter.isBlank()) {
                    rb.delimiter(delimiter);
                }
                if (token != null) {
                    rb.continuationToken(token);
                }
                ListObjectsV2Response resp = s3.listObjectsV2(rb.build());
                for (CommonPrefix cp : resp.commonPrefixes()) {
                    if (cp.prefix() != null) {
                        prefixes.add(cp.prefix());
                    }
                }
                for (S3Object o : resp.contents()) {
                    if (objects.size() >= max) {
                        break;
                    }
                    String key = o.key();
                    if (key == null || key.isEmpty()) {
                        continue;
                    }
                    if (delimiter != null && !delimiter.isBlank() && key.endsWith("/")) {
                        continue;
                    }
                    String display = !normPrefix.isEmpty() && key.startsWith(normPrefix)
                            ? key.substring(normPrefix.length()).replaceFirst("^/+", "")
                            : key;
                    if (display.isEmpty()) {
                        String trimmed = key.replaceAll("/+$", "");
                        int last = trimmed.lastIndexOf('/');
                        display = last >= 0 ? trimmed.substring(last + 1) : trimmed;
                        if (display.isEmpty()) {
                            display = key;
                        }
                    }
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("name", key);
                    row.put("display_name", display.isEmpty() ? key : display);
                    row.put("size", o.size());
                    row.put("updated", o.lastModified() != null ? o.lastModified().toString() : null);
                    objects.add(row);
                }
                if (!resp.isTruncated() || resp.nextContinuationToken() == null) {
                    break;
                }
                token = resp.nextContinuationToken();
            }
            Map<String, Object> out = new LinkedHashMap<>();
            out.put("prefixes", new ArrayList<>(prefixes));
            out.put("objects", objects);
            out.put("bucket_name", bucket);
            out.put("prefix", normPrefix);
            return out;
        }
    }

    public Map<String, Object> awsListBuckets(Map<String, Object> body) {
        int max = intOrDefault(body.get("max_results"), 1000);
        try (S3Client s3 = awsS3Client(body)) {
            List<Map<String, Object>> rows = new ArrayList<>();
            int i = 0;
            for (Bucket b : s3.listBuckets().buckets()) {
                if (i++ >= max) {
                    break;
                }
                rows.add(row(b.name(), b.name(), null, null));
            }
            return Map.of("objects", rows);
        }
    }

    public Map<String, Object> awsListRegions(Map<String, Object> body) {
        try (Ec2Client ec2 = Ec2Client.builder()
                .credentialsProvider(awsCredsProvider(body))
                .region(Region.US_EAST_1)
                .build()) {
            List<Map<String, Object>> rows = new ArrayList<>();
            ec2.describeRegions().regions().forEach(r -> rows.add(row(r.regionName(), r.regionName(), null, null)));
            return Map.of("objects", rows);
        }
    }

    private S3Client awsS3Client(Map<String, Object> body) {
        String region = stringOrDefault(body.get("region"), "us-east-1");
        return S3Client.builder()
                .credentialsProvider(awsCredsProvider(body))
                .region(Region.of(region))
                .build();
    }

    private software.amazon.awssdk.auth.credentials.AwsCredentialsProvider awsCredsProvider(Map<String, Object> body) {
        String ak = stringOrNull(body.get("access_key_id"));
        String sk = stringOrNull(body.get("secret_access_key"));
        if (ak != null && sk != null && !ak.isBlank() && !sk.isBlank()) {
            return StaticCredentialsProvider.create(AwsBasicCredentials.create(ak, sk));
        }
        return DefaultCredentialsProvider.create();
    }

    private static Map<String, Object> row(String name, String display, Integer size, String updated) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("name", name);
        m.put("display_name", display);
        m.put("size", size);
        m.put("updated", updated);
        return m;
    }

    private static String requiredString(Object o, String field) {
        String s = stringOrNull(o);
        if (s == null || s.isBlank()) {
            throw new IllegalArgumentException(field + " is required");
        }
        return s.trim();
    }

    private static String stringOrEmpty(Object o) {
        return o == null ? "" : String.valueOf(o).trim();
    }

    private static String stringOrDefault(Object o, String d) {
        String s = stringOrNull(o);
        return s == null || s.isBlank() ? d : s;
    }

    private static String stringOrNull(Object o) {
        return o == null ? null : String.valueOf(o);
    }

    private static Optional<String> optionalString(Object o) {
        String s = stringOrNull(o);
        return s == null || s.isBlank() ? Optional.empty() : Optional.of(s);
    }

    private static int intOrDefault(Object o, int d) {
        if (o == null) {
            return d;
        }
        if (o instanceof Number n) {
            return Math.max(1, n.intValue());
        }
        try {
            return Math.max(1, Integer.parseInt(String.valueOf(o)));
        } catch (NumberFormatException e) {
            return d;
        }
    }
}
