package com.workflow.repository;

import com.workflow.entity.WorkflowShare;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
class WorkflowShareRepositoryTest {

    @Autowired
    private WorkflowShareRepository repository;

    @BeforeEach
    void setUp() {
        repository.deleteAll();
    }

    @Test
    void findBySharedWithUserId_returnsSharesForUser() {
        WorkflowShare share1 = createShare("s1", "wf-1", "user-B", "read", "user-A");
        WorkflowShare share2 = createShare("s2", "wf-2", "user-B", "write", "user-A");
        WorkflowShare share3 = createShare("s3", "wf-3", "user-C", "read", "user-A");
        repository.saveAll(List.of(share1, share2, share3));

        List<WorkflowShare> result = repository.findBySharedWithUserId("user-B");
        assertEquals(2, result.size());
        assertTrue(result.stream().allMatch(s -> "user-B".equals(s.getSharedWithUserId())));
    }

    @Test
    void findBySharedBy_returnsSharesCreatedByUser() {
        WorkflowShare share1 = createShare("s1", "wf-1", "user-B", "read", "user-A");
        WorkflowShare share2 = createShare("s2", "wf-2", "user-C", "write", "user-A");
        WorkflowShare share3 = createShare("s3", "wf-3", "user-B", "read", "user-X");
        repository.saveAll(List.of(share1, share2, share3));

        List<WorkflowShare> result = repository.findBySharedBy("user-A");
        assertEquals(2, result.size());
        assertTrue(result.stream().allMatch(s -> "user-A".equals(s.getSharedBy())));
    }

    @Test
    void findBySharedWithUserId_returnsEmptyWhenNoShares() {
        List<WorkflowShare> result = repository.findBySharedWithUserId("nonexistent");
        assertTrue(result.isEmpty());
    }

    private WorkflowShare createShare(String id, String workflowId, String sharedWith, String permission, String sharedBy) {
        WorkflowShare s = new WorkflowShare();
        s.setId(id);
        s.setWorkflowId(workflowId);
        s.setSharedWithUserId(sharedWith);
        s.setPermission(permission);
        s.setSharedBy(sharedBy);
        return s;
    }
}
