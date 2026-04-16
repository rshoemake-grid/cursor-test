package com.workflow.controller;

import com.workflow.exception.UnauthorizedException;
import com.workflow.repository.UserRepository;
import com.workflow.storage.CloudStorageExplorerService;
import com.workflow.storage.LocalStorageExplorerService;
import com.workflow.util.AuthenticationHelper;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;

/**
 * Unit tests for cloud storage routes on {@link StorageExplorerController} (no full Spring context).
 */
class StorageExplorerControllerCloudTest {

    private static AuthenticationHelper authOk() {
        return new AuthenticationHelper(mock(UserRepository.class)) {
            @Override
            public String extractUserIdRequired(Authentication authentication) {
                return "user-1";
            }
        };
    }

    private static final class FakeCloud extends CloudStorageExplorerService {
        Map<String, Object> gcpListResult = Map.of(
                "prefixes", List.of(),
                "objects", List.of(),
                "bucket_name", "",
                "prefix", "");
        Exception gcpListError;
        boolean gcpListCalled;
        RuntimeException awsBucketsError;

        @Override
        public Map<String, Object> gcpListObjects(Map<String, Object> body) throws Exception {
            gcpListCalled = true;
            if (gcpListError != null) {
                throw gcpListError;
            }
            return gcpListResult;
        }

        @Override
        public Map<String, Object> gcpDefaultProject(Map<String, Object> body) throws Exception {
            return Map.of("project_id", "p");
        }

        @Override
        public Map<String, Object> gcpListBuckets(Map<String, Object> body) throws Exception {
            return Map.of("objects", List.of());
        }

        @Override
        public Map<String, Object> gcpListProjects(Map<String, Object> body) throws Exception {
            return Map.of("objects", List.of());
        }

        @Override
        public Map<String, Object> gcpPubsubListTopics(Map<String, Object> body) throws Exception {
            return Map.of("objects", List.of());
        }

        @Override
        public Map<String, Object> gcpPubsubListSubscriptions(Map<String, Object> body) throws Exception {
            return Map.of("objects", List.of());
        }

        @Override
        public Map<String, Object> awsListObjects(Map<String, Object> body) {
            return Map.of(
                    "prefixes", List.of(),
                    "objects", List.of(),
                    "bucket_name", "b",
                    "prefix", "");
        }

        @Override
        public Map<String, Object> awsListBuckets(Map<String, Object> body) {
            if (awsBucketsError != null) {
                throw awsBucketsError;
            }
            return Map.of("objects", List.of());
        }

        @Override
        public Map<String, Object> awsListRegions(Map<String, Object> body) {
            return Map.of("objects", List.of());
        }
    }

    @Test
    void gcpListObjects_ok_delegatesToService() throws Exception {
        LocalStorageExplorerService local = new LocalStorageExplorerService("");
        FakeCloud cloud = new FakeCloud();
        cloud.gcpListResult = Map.of(
                "prefixes", List.of("a/"),
                "objects", List.of(),
                "bucket_name", "bkt",
                "prefix", "");

        StorageExplorerController c = new StorageExplorerController(local, cloud, authOk());
        ResponseEntity<?> res = c.gcpListObjects(Map.of("bucket_name", "bkt"), null);

        assertEquals(HttpStatus.OK, res.getStatusCode());
        assertTrue(cloud.gcpListCalled);
    }

    @Test
    void gcpListObjects_badRequest_onIllegalArgument() throws Exception {
        LocalStorageExplorerService local = new LocalStorageExplorerService("");
        FakeCloud cloud = new FakeCloud();
        cloud.gcpListError = new IllegalArgumentException("bucket_name is required");

        StorageExplorerController c = new StorageExplorerController(local, cloud, authOk());
        ResponseEntity<?> res = c.gcpListObjects(Map.of(), null);

        assertEquals(HttpStatus.BAD_REQUEST, res.getStatusCode());
    }

    @Test
    void awsListBuckets_badGateway_onUnexpectedError() {
        LocalStorageExplorerService local = new LocalStorageExplorerService("");
        FakeCloud cloud = new FakeCloud();
        cloud.awsBucketsError = new RuntimeException("network");

        StorageExplorerController c = new StorageExplorerController(local, cloud, authOk());
        ResponseEntity<?> res = c.awsListBuckets(Map.of(), null);

        assertEquals(HttpStatus.BAD_GATEWAY, res.getStatusCode());
        @SuppressWarnings("unchecked")
        Map<String, Object> body = (Map<String, Object>) res.getBody();
        assertEquals("Could not list buckets: network", body.get("detail"));
    }

    @Test
    void gcpListObjects_unauthenticated_propagatesUnauthorized() {
        LocalStorageExplorerService local = new LocalStorageExplorerService("");
        FakeCloud cloud = new FakeCloud();
        AuthenticationHelper auth = new AuthenticationHelper(mock(UserRepository.class)) {
            @Override
            public String extractUserIdRequired(Authentication authentication) {
                throw new UnauthorizedException("auth required");
            }
        };

        StorageExplorerController c = new StorageExplorerController(local, cloud, auth);
        assertThrows(UnauthorizedException.class, () -> c.gcpListObjects(Map.of("bucket_name", "b"), null));
        assertTrue(!cloud.gcpListCalled);
    }

    @Test
    void otherCloudEndpoints_returnOk() throws Exception {
        LocalStorageExplorerService local = new LocalStorageExplorerService("");
        FakeCloud cloud = new FakeCloud();
        StorageExplorerController c = new StorageExplorerController(local, cloud, authOk());

        assertEquals(HttpStatus.OK, c.gcpDefaultProject(Map.of(), null).getStatusCode());
        assertEquals(HttpStatus.OK, c.gcpListBuckets(Map.of(), null).getStatusCode());
        assertEquals(HttpStatus.OK, c.gcpListProjects(Map.of(), null).getStatusCode());
        assertEquals(HttpStatus.OK, c.gcpPubsubListTopics(Map.of("project_id", "x"), null).getStatusCode());
        assertEquals(HttpStatus.OK, c.gcpPubsubListSubscriptions(Map.of("project_id", "x"), null).getStatusCode());
        assertEquals(HttpStatus.OK, c.awsListObjects(Map.of("bucket_name", "b"), null).getStatusCode());
        assertEquals(HttpStatus.OK, c.awsListBuckets(Map.of(), null).getStatusCode());
        assertEquals(HttpStatus.OK, c.awsListRegions(Map.of(), null).getStatusCode());
    }
}
