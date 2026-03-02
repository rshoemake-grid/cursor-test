package com.workflow.repository;

import com.workflow.entity.WorkflowVersion;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
class WorkflowVersionRepositoryTest {

    @Autowired
    private WorkflowVersionRepository repository;

    @BeforeEach
    void setUp() {
        repository.deleteAll();
    }

    @Test
    void findByWorkflowIdOrderByVersionNumberDesc_returnsVersionsInDescendingOrder() {
        String workflowId = "workflow-1";
        WorkflowVersion v1 = createVersion("v1", workflowId, 1);
        WorkflowVersion v2 = createVersion("v2", workflowId, 2);
        WorkflowVersion v3 = createVersion("v3", workflowId, 3);
        repository.saveAll(List.of(v1, v2, v3));

        List<WorkflowVersion> result = repository.findByWorkflowIdOrderByVersionNumberDesc(workflowId);

        assertEquals(3, result.size());
        assertEquals(3, result.get(0).getVersionNumber());
        assertEquals(2, result.get(1).getVersionNumber());
        assertEquals(1, result.get(2).getVersionNumber());
    }

    @Test
    void findByWorkflowIdOrderByVersionNumberDesc_returnsEmptyWhenNoVersions() {
        List<WorkflowVersion> result = repository.findByWorkflowIdOrderByVersionNumberDesc("nonexistent");
        assertTrue(result.isEmpty());
    }

    @Test
    void findByWorkflowIdOrderByVersionNumberDesc_excludesOtherWorkflows() {
        repository.save(createVersion("v1", "workflow-1", 1));
        repository.save(createVersion("v2", "workflow-2", 1));

        List<WorkflowVersion> result = repository.findByWorkflowIdOrderByVersionNumberDesc("workflow-1");
        assertEquals(1, result.size());
        assertEquals("workflow-1", result.get(0).getWorkflowId());
    }

    private WorkflowVersion createVersion(String id, String workflowId, int versionNumber) {
        WorkflowVersion v = new WorkflowVersion();
        v.setId(id);
        v.setWorkflowId(workflowId);
        v.setVersionNumber(versionNumber);
        v.setDefinition(Map.of("nodes", List.of(), "edges", List.of()));
        v.setChangeNotes("Change " + versionNumber);
        v.setCreatedBy("user-1");
        return v;
    }
}
