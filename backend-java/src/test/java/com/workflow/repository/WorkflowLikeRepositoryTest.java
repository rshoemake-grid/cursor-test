package com.workflow.repository;

import com.workflow.entity.WorkflowLike;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
class WorkflowLikeRepositoryTest {

    @Autowired
    private WorkflowLikeRepository repository;

    @BeforeEach
    void setUp() {
        repository.deleteAll();
    }

    @Test
    void findByWorkflowIdAndUserId_returnsLikeWhenExists() {
        WorkflowLike like = createLike("l1", "wf-1", "user-1");
        repository.save(like);

        var result = repository.findByWorkflowIdAndUserId("wf-1", "user-1");
        assertTrue(result.isPresent());
        assertEquals("wf-1", result.get().getWorkflowId());
        assertEquals("user-1", result.get().getUserId());
    }

    @Test
    void findByWorkflowIdAndUserId_returnsEmptyWhenNotExists() {
        var result = repository.findByWorkflowIdAndUserId("wf-1", "user-1");
        assertTrue(result.isEmpty());
    }

    @Test
    void findByUserId_returnsAllLikesByUser() {
        WorkflowLike like1 = createLike("l1", "wf-1", "user-1");
        WorkflowLike like2 = createLike("l2", "wf-2", "user-1");
        WorkflowLike like3 = createLike("l3", "wf-3", "user-2");
        repository.saveAll(List.of(like1, like2, like3));

        List<WorkflowLike> result = repository.findByUserId("user-1");
        assertEquals(2, result.size());
        assertTrue(result.stream().allMatch(l -> "user-1".equals(l.getUserId())));
    }

    @Test
    void findByUserId_returnsEmptyWhenNoLikes() {
        List<WorkflowLike> result = repository.findByUserId("nonexistent");
        assertTrue(result.isEmpty());
    }

    private WorkflowLike createLike(String id, String workflowId, String userId) {
        WorkflowLike like = new WorkflowLike();
        like.setId(id);
        like.setWorkflowId(workflowId);
        like.setUserId(userId);
        return like;
    }
}
