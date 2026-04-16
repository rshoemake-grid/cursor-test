package com.workflow.storage;

import com.google.api.gax.paging.Page;
import com.google.cloud.storage.Blob;
import com.google.cloud.storage.BlobId;
import com.google.cloud.storage.Storage;
import com.google.cloud.storage.StorageException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.ListObjectsV2Request;
import software.amazon.awssdk.services.s3.model.ListObjectsV2Response;
import software.amazon.awssdk.services.s3.model.NoSuchKeyException;
import software.amazon.awssdk.services.s3.model.S3Object;

import java.io.FileNotFoundException;
import java.nio.charset.StandardCharsets;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CloudInputSourceReadSupportTest {

    @Mock
    private Storage storage;

    @Mock
    private S3Client s3;

    @Test
    void readGcpObjectBytes_maps404ToFileNotFound() {
        BlobId id = BlobId.of("b", "k");
        when(storage.readAllBytes(id)).thenThrow(new StorageException(404, "Not Found"));
        assertThrows(
                FileNotFoundException.class,
                () -> CloudInputSourceReadSupport.readGcpObjectBytes(storage, "b", "k"));
    }

    @Test
    void readGcpObjectBytes_returnsBytesWhenPresent() throws Exception {
        BlobId id = BlobId.of("b", "k");
        byte[] raw = "x".getBytes(StandardCharsets.UTF_8);
        when(storage.readAllBytes(id)).thenReturn(raw);
        assertArrayEquals(raw, CloudInputSourceReadSupport.readGcpObjectBytes(storage, "b", "k"));
    }

    @Test
    void listGcpObjectNamesCapped_emptyIterable() {
        @SuppressWarnings("unchecked")
        Page<Blob> page = mock(Page.class);
        when(storage.list("buck")).thenReturn(page);
        when(page.iterateAll()).thenReturn(List.of());
        assertTrue(CloudInputSourceReadSupport.listGcpObjectNamesCapped(storage, "buck", 10).isEmpty());
    }

    @Test
    void readS3ObjectBytes_mapsNoSuchKeyToFileNotFound() {
        when(s3.getObjectAsBytes(any(GetObjectRequest.class))).thenThrow(NoSuchKeyException.builder().build());
        assertThrows(
                FileNotFoundException.class,
                () -> CloudInputSourceReadSupport.readS3ObjectBytes(s3, "b", "k"));
    }

    @Test
    void listS3ObjectKeysCapped_followsContinuationAndCaps() {
        when(s3.listObjectsV2(any(ListObjectsV2Request.class)))
                .thenAnswer(
                        inv -> {
                            ListObjectsV2Request r = inv.getArgument(0);
                            if (r.continuationToken() == null) {
                                return ListObjectsV2Response.builder()
                                        .isTruncated(true)
                                        .nextContinuationToken("t1")
                                        .contents(
                                                S3Object.builder().key("a").build(),
                                                S3Object.builder().key("b").build())
                                        .build();
                            }
                            return ListObjectsV2Response.builder()
                                    .isTruncated(false)
                                    .contents(S3Object.builder().key("c").build())
                                    .build();
                        });
        List<String> keys = CloudInputSourceReadSupport.listS3ObjectKeysCapped(s3, "buck", 2);
        assertEquals(List.of("a", "b"), keys);
        verify(s3).listObjectsV2(any(ListObjectsV2Request.class));
    }
}
