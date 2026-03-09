package com.workflow.service;

import com.workflow.dto.WorkflowShareCreate;
import com.workflow.dto.WorkflowVersionCreate;
import com.workflow.entity.User;
import com.workflow.entity.Workflow;
import com.workflow.entity.WorkflowShare;
import com.workflow.entity.WorkflowVersion;
import com.workflow.exception.ForbiddenException;
import com.workflow.exception.ResourceNotFoundException;
import com.workflow.repository.UserRepository;
import com.workflow.repository.WorkflowRepository;
import com.workflow.repository.WorkflowShareRepository;
import com.workflow.repository.WorkflowVersionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * T-5: Unit tests for WorkflowShareService and WorkflowVersionService - share, revoke, versions.
 */
@ExtendWith(MockitoExtension.class)
class SharingServiceTest {

    @Mock
    private WorkflowShareRepository shareRepository;

    @Mock
    private WorkflowVersionRepository versionRepository;

    @Mock
    private WorkflowRepository workflowRepository;

    @Mock
    private UserRepository userRepository;

    private WorkflowOwnershipService ownershipService;
    private WorkflowShareService workflowShareService;
    private WorkflowVersionService workflowVersionService;

    private static final String OWNER_ID = "owner-id";
    private static final String OTHER_USER_ID = "other-user-id";
    private static final String WORKFLOW_ID = "wf-123";
    private static final String SHARE_ID = "share-456";
    private static final String VERSION_ID = "ver-789";

    private Workflow workflow;
    private User sharedWithUser;
    private WorkflowShare share;
    private WorkflowVersion version;

    @BeforeEach
    void setUp() {
        workflow = new Workflow();
        workflow.setId(WORKFLOW_ID);
        workflow.setOwnerId(OWNER_ID);
        workflow.setDefinition(Map.of("nodes", List.of(), "edges", List.of()));

        sharedWithUser = new User();
        sharedWithUser.setId(OTHER_USER_ID);
        sharedWithUser.setUsername("shareduser");

        share = new WorkflowShare();
        share.setId(SHARE_ID);
        share.setWorkflowId(WORKFLOW_ID);
        share.setSharedWithUserId(OTHER_USER_ID);
        share.setPermission("view");
        share.setSharedBy(OWNER_ID);
        share.setCreatedAt(LocalDateTime.now());

        version = new WorkflowVersion();
        version.setId(VERSION_ID);
        version.setWorkflowId(WORKFLOW_ID);
        version.setVersionNumber(1);
        version.setDefinition(Map.of("nodes", List.of(), "edges", List.of()));
        version.setCreatedBy(OWNER_ID);
        version.setCreatedAt(LocalDateTime.now());

        ownershipService = new WorkflowOwnershipService(workflowRepository, shareRepository);
        workflowShareService = new WorkflowShareService(shareRepository, userRepository, ownershipService);
        workflowVersionService = new WorkflowVersionService(versionRepository, workflowRepository, ownershipService);
    }

    @Test
    void shareWorkflow_success() {
        WorkflowShareCreate create = new WorkflowShareCreate(WORKFLOW_ID, "shareduser", "edit");
        when(workflowRepository.findById(WORKFLOW_ID)).thenReturn(Optional.of(workflow));
        when(userRepository.findByUsername("shareduser")).thenReturn(Optional.of(sharedWithUser));
        when(shareRepository.findBySharedWithUserId(OTHER_USER_ID)).thenReturn(List.of());
        when(shareRepository.save(any(WorkflowShare.class))).thenAnswer(inv -> inv.getArgument(0));

        var result = workflowShareService.shareWorkflow(create, OWNER_ID);

        assertNotNull(result);
        assertEquals(WORKFLOW_ID, result.getWorkflowId());
        assertEquals(OTHER_USER_ID, result.getSharedWithUserId());
        assertEquals("edit", result.getPermission());
        verify(shareRepository).save(any(WorkflowShare.class));
    }

    @Test
    void shareWorkflow_existingShare_updatesPermission() {
        WorkflowShareCreate create = new WorkflowShareCreate(WORKFLOW_ID, "shareduser", "execute");
        when(workflowRepository.findById(WORKFLOW_ID)).thenReturn(Optional.of(workflow));
        when(userRepository.findByUsername("shareduser")).thenReturn(Optional.of(sharedWithUser));
        when(shareRepository.findBySharedWithUserId(OTHER_USER_ID)).thenReturn(List.of(share));
        when(shareRepository.save(share)).thenReturn(share);

        var result = workflowShareService.shareWorkflow(create, OWNER_ID);

        assertNotNull(result);
        assertEquals("execute", result.getPermission());
        verify(shareRepository).save(share);
    }

    @Test
    void shareWorkflow_notOwner_throwsForbiddenException() {
        WorkflowShareCreate create = new WorkflowShareCreate(WORKFLOW_ID, "shareduser", "view");
        when(workflowRepository.findById(WORKFLOW_ID)).thenReturn(Optional.of(workflow));

        assertThrows(ForbiddenException.class, () ->
                workflowShareService.shareWorkflow(create, OTHER_USER_ID));
        verify(shareRepository, never()).save(any());
    }

    @Test
    void shareWorkflow_workflowNotFound_throwsResourceNotFoundException() {
        WorkflowShareCreate create = new WorkflowShareCreate(WORKFLOW_ID, "shareduser", "view");
        when(workflowRepository.findById(WORKFLOW_ID)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () ->
                workflowShareService.shareWorkflow(create, OWNER_ID));
        verify(shareRepository, never()).save(any());
    }

    @Test
    void shareWorkflow_userNotFound_throwsResourceNotFoundException() {
        WorkflowShareCreate create = new WorkflowShareCreate(WORKFLOW_ID, "nonexistent", "view");
        when(workflowRepository.findById(WORKFLOW_ID)).thenReturn(Optional.of(workflow));
        when(userRepository.findByUsername("nonexistent")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () ->
                workflowShareService.shareWorkflow(create, OWNER_ID));
        verify(shareRepository, never()).save(any());
    }

    @Test
    void getSharedWithMe_returnsList() {
        when(shareRepository.findBySharedWithUserId(OWNER_ID)).thenReturn(List.of(share));

        var result = workflowShareService.getSharedWithMe(OWNER_ID);

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(WORKFLOW_ID, result.get(0).getWorkflowId());
    }

    @Test
    void getSharedByMe_returnsList() {
        when(shareRepository.findBySharedBy(OWNER_ID)).thenReturn(List.of(share));

        var result = workflowShareService.getSharedByMe(OWNER_ID);

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(WORKFLOW_ID, result.get(0).getWorkflowId());
    }

    @Test
    void revokeShare_success() {
        when(shareRepository.findById(SHARE_ID)).thenReturn(Optional.of(share));
        when(workflowRepository.findById(WORKFLOW_ID)).thenReturn(Optional.of(workflow));

        workflowShareService.revokeShare(SHARE_ID, OWNER_ID);

        verify(shareRepository).delete(share);
    }

    @Test
    void revokeShare_notOwner_throwsForbiddenException() {
        when(shareRepository.findById(SHARE_ID)).thenReturn(Optional.of(share));
        when(workflowRepository.findById(WORKFLOW_ID)).thenReturn(Optional.of(workflow));

        assertThrows(ForbiddenException.class, () ->
                workflowShareService.revokeShare(SHARE_ID, OTHER_USER_ID));
        verify(shareRepository, never()).delete(any());
    }

    @Test
    void revokeShare_shareNotFound_throwsResourceNotFoundException() {
        when(shareRepository.findById(SHARE_ID)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () ->
                workflowShareService.revokeShare(SHARE_ID, OWNER_ID));
        verify(shareRepository, never()).delete(any());
    }

    @Test
    void createVersion_success() {
        WorkflowVersionCreate create = new WorkflowVersionCreate(WORKFLOW_ID, "Initial version");
        when(workflowRepository.findById(WORKFLOW_ID)).thenReturn(Optional.of(workflow));
        when(versionRepository.findByWorkflowIdOrderByVersionNumberDesc(WORKFLOW_ID)).thenReturn(List.of());
        when(versionRepository.save(any(WorkflowVersion.class))).thenAnswer(inv -> {
            WorkflowVersion v = inv.getArgument(0);
            v.setId(VERSION_ID);
            return v;
        });

        var result = workflowVersionService.createVersion(create, OWNER_ID);

        assertNotNull(result);
        assertEquals(WORKFLOW_ID, result.getWorkflowId());
        assertEquals(1, result.getVersionNumber());
        assertEquals("Initial version", result.getChangeNotes());
        verify(versionRepository).save(any(WorkflowVersion.class));
    }

    @Test
    void createVersion_notOwner_throwsForbiddenException() {
        WorkflowVersionCreate create = new WorkflowVersionCreate(WORKFLOW_ID, "Notes");
        when(workflowRepository.findById(WORKFLOW_ID)).thenReturn(Optional.of(workflow));

        assertThrows(ForbiddenException.class, () ->
                workflowVersionService.createVersion(create, OTHER_USER_ID));
        verify(versionRepository, never()).save(any());
    }

    @Test
    void getVersions_owner_returnsList() {
        when(workflowRepository.findById(WORKFLOW_ID)).thenReturn(Optional.of(workflow));
        when(versionRepository.findByWorkflowIdOrderByVersionNumberDesc(WORKFLOW_ID)).thenReturn(List.of(version));

        var result = workflowVersionService.getVersions(WORKFLOW_ID, OWNER_ID);

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(1, result.get(0).getVersionNumber());
    }

    @Test
    void getVersions_sharedUser_returnsList() {
        when(workflowRepository.findById(WORKFLOW_ID)).thenReturn(Optional.of(workflow));
        when(shareRepository.findBySharedWithUserId(OTHER_USER_ID)).thenReturn(List.of(share));
        when(versionRepository.findByWorkflowIdOrderByVersionNumberDesc(WORKFLOW_ID)).thenReturn(List.of(version));

        var result = workflowVersionService.getVersions(WORKFLOW_ID, OTHER_USER_ID);

        assertNotNull(result);
        assertEquals(1, result.size());
    }

    @Test
    void getVersions_notOwnerNoShare_throwsForbiddenException() {
        when(workflowRepository.findById(WORKFLOW_ID)).thenReturn(Optional.of(workflow));
        when(shareRepository.findBySharedWithUserId(OTHER_USER_ID)).thenReturn(List.of());

        assertThrows(ForbiddenException.class, () ->
                workflowVersionService.getVersions(WORKFLOW_ID, OTHER_USER_ID));
    }

    @Test
    void restoreVersion_success() {
        when(versionRepository.findById(VERSION_ID)).thenReturn(Optional.of(version));
        when(workflowRepository.findById(WORKFLOW_ID)).thenReturn(Optional.of(workflow));
        when(workflowRepository.save(workflow)).thenReturn(workflow);

        var result = workflowVersionService.restoreVersion(VERSION_ID, OWNER_ID);

        assertNotNull(result);
        assertTrue(result.containsKey("message"));
        assertTrue(result.get("message").contains("Restored"));
        verify(workflowRepository).save(workflow);
    }

    @Test
    void restoreVersion_notOwner_throwsForbiddenException() {
        when(versionRepository.findById(VERSION_ID)).thenReturn(Optional.of(version));
        when(workflowRepository.findById(WORKFLOW_ID)).thenReturn(Optional.of(workflow));

        assertThrows(ForbiddenException.class, () ->
                workflowVersionService.restoreVersion(VERSION_ID, OTHER_USER_ID));
        verify(workflowRepository, never()).save(any());
    }
}
