package com.workflow.storage;

import com.google.cloud.storage.Blob;
import com.google.cloud.storage.BlobId;
import com.google.cloud.storage.Storage;
import com.google.cloud.storage.StorageException;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.ListObjectsV2Request;
import software.amazon.awssdk.services.s3.model.NoSuchKeyException;
import software.amazon.awssdk.services.s3.model.S3Object;

import java.io.FileNotFoundException;
import java.util.ArrayList;
import java.util.List;

/**
 * DRY: GCS/S3 read/list edge cases aligned with Python {@code input_sources.py} (existence checks, list caps, S3 pagination).
 */
public final class CloudInputSourceReadSupport {

    /** Python {@code GCPBucketHandler.read} uses {@code max_results=10000} for bucket listing. */
    public static final int MAX_GCS_LIST_KEYS = 10_000;

    /** Cap S3 key listing to match GCS bucket list guardrails. */
    public static final int MAX_S3_LIST_KEYS = 10_000;

    private CloudInputSourceReadSupport() {
    }

    public static byte[] readGcpObjectBytes(Storage storage, String bucket, String objectPath) throws FileNotFoundException {
        BlobId id = BlobId.of(bucket, objectPath);
        try {
            return storage.readAllBytes(id);
        } catch (StorageException e) {
            if (e.getCode() == 404) {
                throw new FileNotFoundException("Object " + objectPath + " not found in bucket " + bucket);
            }
            throw e;
        }
    }

    public static List<String> listGcpObjectNamesCapped(Storage storage, String bucket, int maxKeys) {
        List<String> keys = new ArrayList<>();
        for (Blob blob : storage.list(bucket).iterateAll()) {
            keys.add(blob.getName());
            if (keys.size() >= maxKeys) {
                break;
            }
        }
        return keys;
    }

    public static byte[] readS3ObjectBytes(S3Client s3, String bucket, String key) throws FileNotFoundException {
        try {
            return s3.getObjectAsBytes(GetObjectRequest.builder().bucket(bucket).key(key).build()).asByteArray();
        } catch (NoSuchKeyException e) {
            throw new FileNotFoundException("Object " + key + " not found in bucket " + bucket);
        }
    }

    public static List<String> listS3ObjectKeysCapped(S3Client s3, String bucket, int maxKeys) {
        List<String> keys = new ArrayList<>();
        String token = null;
        do {
            var reqBuilder = ListObjectsV2Request.builder().bucket(bucket).maxKeys(Math.min(1000, maxKeys - keys.size()));
            if (token != null) {
                reqBuilder.continuationToken(token);
            }
            var resp = s3.listObjectsV2(reqBuilder.build());
            List<S3Object> contents = resp.contents();
            if (contents != null) {
                for (S3Object o : contents) {
                    keys.add(o.key());
                    if (keys.size() >= maxKeys) {
                        return keys;
                    }
                }
            }
            token = Boolean.TRUE.equals(resp.isTruncated()) ? resp.nextContinuationToken() : null;
        } while (token != null && keys.size() < maxKeys);
        return keys;
    }
}
