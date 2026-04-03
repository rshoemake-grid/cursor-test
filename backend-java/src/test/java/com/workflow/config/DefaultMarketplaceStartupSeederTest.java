package com.workflow.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.workflow.entity.Workflow;
import com.workflow.entity.WorkflowTemplate;
import com.workflow.repository.WorkflowRepository;
import com.workflow.repository.WorkflowTemplateRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DefaultMarketplaceStartupSeederTest {

    @Mock
    private WorkflowTemplateRepository templateRepository;

    @Mock
    private WorkflowRepository workflowRepository;

    private DefaultMarketplaceStartupSeeder seeder;

    @BeforeEach
    void setUp() {
        seeder = new DefaultMarketplaceStartupSeeder(
                templateRepository, workflowRepository, new ObjectMapper());
    }

    @Test
    void skipsAllSavesWhenNothingToSeed() {
        when(templateRepository.count()).thenReturn(1L);
        when(workflowRepository.countDiscoverableMarketplaceWorkflows()).thenReturn(1L);

        seeder.run(null);

        verify(templateRepository, never()).save(any());
        verify(workflowRepository, never()).save(any());
    }

    @Test
    void seedsTemplatesAndWorkflowsWhenBothEmpty() {
        when(templateRepository.count()).thenReturn(0L);
        when(workflowRepository.countDiscoverableMarketplaceWorkflows()).thenReturn(0L);

        seeder.run(null);

        verify(templateRepository, times(5)).save(any(WorkflowTemplate.class));
        verify(workflowRepository, times(5)).save(any(Workflow.class));

        ArgumentCaptor<WorkflowTemplate> tc = ArgumentCaptor.forClass(WorkflowTemplate.class);
        verify(templateRepository, times(5)).save(tc.capture());
        assertThat(tc.getAllValues()).allMatch(t -> Boolean.TRUE.equals(t.getIsOfficial()));
        assertThat(tc.getAllValues()).allMatch(t -> t.getAuthorId() == null);

        ArgumentCaptor<Workflow> wc = ArgumentCaptor.forClass(Workflow.class);
        verify(workflowRepository, times(5)).save(wc.capture());
        assertThat(wc.getAllValues()).allMatch(w -> Boolean.TRUE.equals(w.getIsPublic()));
        assertThat(wc.getAllValues()).allMatch(w -> Boolean.FALSE.equals(w.getIsTemplate()));
        assertThat(wc.getAllValues()).allMatch(w -> w.getOwnerId() == null);
    }

    @Test
    void skipsWorkflowSeedWhenDiscoverableWorkflowsExist() {
        when(templateRepository.count()).thenReturn(0L);
        when(workflowRepository.countDiscoverableMarketplaceWorkflows()).thenReturn(3L);

        seeder.run(null);

        verify(templateRepository, times(5)).save(any(WorkflowTemplate.class));
        verify(workflowRepository, never()).save(any());
    }
}
