package com.workflow.controller;

import com.workflow.storage.CloudStorageExplorerService;
import com.workflow.storage.LocalStorageExplorerService;
import com.workflow.util.AuthenticationHelper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Storage browser API — matches Python {@code storage_explorer_routes} paths under {@code /api/storage}.
 */
@RestController
@RequestMapping("/api/storage")
@Tag(name = "storage", description = "Storage browser helpers for workflow configuration")
public class StorageExplorerController {

    private final LocalStorageExplorerService localStorageExplorerService;
    private final CloudStorageExplorerService cloudStorageExplorerService;
    private final AuthenticationHelper authenticationHelper;

    public StorageExplorerController(LocalStorageExplorerService localStorageExplorerService,
                                     CloudStorageExplorerService cloudStorageExplorerService,
                                     AuthenticationHelper authenticationHelper) {
        this.localStorageExplorerService = localStorageExplorerService;
        this.cloudStorageExplorerService = cloudStorageExplorerService;
        this.authenticationHelper = authenticationHelper;
    }

    @PostMapping("/local/list-directory")
    @Operation(summary = "List local directory")
    public ResponseEntity<?> localListDirectory(@RequestBody Map<String, Object> body, Authentication authentication) {
        authenticationHelper.extractUserIdRequired(authentication);
        String dir = body.get("directory") != null ? String.valueOf(body.get("directory")) : "";
        try {
            LocalStorageExplorerService.LocalListDirectoryResult r = localStorageExplorerService.listDirectory(dir);
            return ResponseEntity.ok(r.toBody());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("detail", e.getMessage()));
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(Map.of("detail", "Could not list directory: " + e.getMessage()));
        }
    }

    @PostMapping("/gcp/list-objects")
    @Operation(summary = "List GCS objects under a prefix")
    public ResponseEntity<?> gcpListObjects(@RequestBody Map<String, Object> body, Authentication authentication) {
        authenticationHelper.extractUserIdRequired(authentication);
        try {
            return ResponseEntity.ok(cloudStorageExplorerService.gcpListObjects(body));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("detail", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(Map.of("detail", "Could not list bucket objects: " + e.getMessage()));
        }
    }

    @PostMapping("/gcp/default-project")
    @Operation(summary = "Resolve default GCP project for credentials")
    public ResponseEntity<?> gcpDefaultProject(@RequestBody Map<String, Object> body, Authentication authentication) {
        authenticationHelper.extractUserIdRequired(authentication);
        try {
            return ResponseEntity.ok(cloudStorageExplorerService.gcpDefaultProject(body));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("detail", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(Map.of("detail", "Could not resolve default project: " + e.getMessage()));
        }
    }

    @PostMapping("/gcp/list-buckets")
    public ResponseEntity<?> gcpListBuckets(@RequestBody Map<String, Object> body, Authentication authentication) {
        authenticationHelper.extractUserIdRequired(authentication);
        try {
            return ResponseEntity.ok(cloudStorageExplorerService.gcpListBuckets(body));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("detail", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(Map.of("detail", "Could not list buckets: " + e.getMessage()));
        }
    }

    @PostMapping("/gcp/list-projects")
    public ResponseEntity<?> gcpListProjects(@RequestBody Map<String, Object> body, Authentication authentication) {
        authenticationHelper.extractUserIdRequired(authentication);
        try {
            return ResponseEntity.ok(cloudStorageExplorerService.gcpListProjects(body));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("detail", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(Map.of("detail", "Could not list projects: " + e.getMessage()));
        }
    }

    @PostMapping("/gcp/pubsub/list-topics")
    public ResponseEntity<?> gcpPubsubListTopics(@RequestBody Map<String, Object> body, Authentication authentication) {
        authenticationHelper.extractUserIdRequired(authentication);
        try {
            return ResponseEntity.ok(cloudStorageExplorerService.gcpPubsubListTopics(body));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("detail", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(Map.of("detail", "Could not list Pub/Sub topics: " + e.getMessage()));
        }
    }

    @PostMapping("/gcp/pubsub/list-subscriptions")
    public ResponseEntity<?> gcpPubsubListSubscriptions(@RequestBody Map<String, Object> body,
                                                        Authentication authentication) {
        authenticationHelper.extractUserIdRequired(authentication);
        try {
            return ResponseEntity.ok(cloudStorageExplorerService.gcpPubsubListSubscriptions(body));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("detail", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(Map.of("detail", "Could not list Pub/Sub subscriptions: " + e.getMessage()));
        }
    }

    @PostMapping("/aws/list-objects")
    public ResponseEntity<?> awsListObjects(@RequestBody Map<String, Object> body, Authentication authentication) {
        authenticationHelper.extractUserIdRequired(authentication);
        try {
            return ResponseEntity.ok(cloudStorageExplorerService.awsListObjects(body));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("detail", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(Map.of("detail", "Could not list bucket objects: " + e.getMessage()));
        }
    }

    @PostMapping("/aws/list-buckets")
    public ResponseEntity<?> awsListBuckets(@RequestBody Map<String, Object> body, Authentication authentication) {
        authenticationHelper.extractUserIdRequired(authentication);
        try {
            return ResponseEntity.ok(cloudStorageExplorerService.awsListBuckets(body));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("detail", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(Map.of("detail", "Could not list buckets: " + e.getMessage()));
        }
    }

    @PostMapping("/aws/list-regions")
    public ResponseEntity<?> awsListRegions(@RequestBody Map<String, Object> body, Authentication authentication) {
        authenticationHelper.extractUserIdRequired(authentication);
        try {
            return ResponseEntity.ok(cloudStorageExplorerService.awsListRegions(body));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("detail", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(Map.of("detail", "Could not list regions: " + e.getMessage()));
        }
    }
}
