package com.workflow.service;

import com.workflow.config.TemplateConfig;
import com.workflow.dto.WorkflowTemplateCreate;
import com.workflow.dto.WorkflowTemplateResponse;
import com.workflow.entity.Workflow;
import com.workflow.entity.WorkflowTemplate;
import com.workflow.exception.ResourceNotFoundException;
import com.workflow.exception.ForbiddenException;
import com.workflow.repository.UserRepository;
import com.workflow.repository.WorkflowRepository;
import com.workflow.repository.WorkflowTemplateRepository;
import com.workflow.util.PaginationUtils;
import com.workflow.util.RepositoryUtils;
import com.workflow.util.SearchUtils;
import com.workflow.util.TemplateFactory;
import com.workflow.util.UserDisplayNameResolver;
import com.workflow.util.SortStrategy;
import com.workflow.util.WorkflowFactory;
import com.workflow.util.WorkflowMapper;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * Template service - matches Python template_routes
 */
@Service
@Transactional
public class TemplateService {
    private final TemplateConfig.TemplateOptions templateOptions;
    private final WorkflowTemplateRepository templateRepository;
    private final WorkflowRepository workflowRepository;
    private final UserRepository userRepository;
    private final WorkflowMapper workflowMapper;

    private final TemplateOwnershipService templateOwnershipService;
    private final SortStrategy templateSortStrategy;

    public TemplateService(TemplateConfig.TemplateOptions templateOptions,
                           WorkflowTemplateRepository templateRepository,
                           WorkflowRepository workflowRepository,
                           UserRepository userRepository,
                           WorkflowMapper workflowMapper,
                           TemplateOwnershipService templateOwnershipService,
                           @Qualifier("templateSortStrategy") SortStrategy templateSortStrategy) {
        this.templateOptions = templateOptions;
        this.templateRepository = templateRepository;
        this.workflowRepository = workflowRepository;
        this.userRepository = userRepository;
        this.workflowMapper = workflowMapper;
        this.templateOwnershipService = templateOwnershipService;
        this.templateSortStrategy = templateSortStrategy;
    }

    public WorkflowTemplateResponse createTemplate(WorkflowTemplateCreate create, String userId, boolean isAdmin) {
        WorkflowTemplate t = TemplateFactory.fromCreate(create, userId, isAdmin,
                templateOptions.getDefaultCategory(), templateOptions.getDefaultDifficulty());
        t = templateRepository.save(t);
        return toResponse(t, UserDisplayNameResolver.resolveFromOptional(userRepository.findById(userId)));
    }

    public List<WorkflowTemplateResponse> listTemplates(String category, String difficulty, String search,
                                                        String sortBy, int limit, int offset) {
        int safeLimit = PaginationUtils.clampLimit(limit);
        int safeOffset = Math.max(0, offset);
        var pageable = PageRequest.of(safeOffset / safeLimit, safeLimit, templateSortStrategy.getSort(sortBy));
        List<WorkflowTemplate> templates = templateRepository.findWithFilters(category, difficulty, pageable);
        return templates.stream()
                .filter(t -> SearchUtils.matchesSearch(search, t.getName(), t.getDescription()))
                .map(t -> toResponse(t, UserDisplayNameResolver.resolveFromOptional(userRepository.findById(t.getAuthorId()))))
                .collect(Collectors.toList());
    }

    public List<String> getCategories() {
        return templateOptions.getCategories();
    }

    public List<String> getDifficulties() {
        return templateOptions.getDifficulties();
    }

    public WorkflowTemplateResponse getTemplate(String templateId) {
        WorkflowTemplate t = RepositoryUtils.findByIdOrThrow(templateRepository, templateId, "Template not found");
        return toResponse(t, UserDisplayNameResolver.resolveFromOptional(userRepository.findById(t.getAuthorId())));
    }

    @Transactional
    public com.workflow.dto.WorkflowResponse useTemplate(String templateId, String name, String description, String userId) {
        WorkflowTemplate t = RepositoryUtils.findByIdOrThrow(templateRepository, templateId, "Template not found");
        t.setUsesCount(Objects.requireNonNullElse(t.getUsesCount(), 0) + 1);
        templateRepository.save(t);

        Workflow w = WorkflowFactory.create(userId,
                name != null ? name : t.getName() + " (from template)",
                description != null ? description : t.getDescription(),
                t.getDefinition(), "1.0.0", t.getCategory(), t.getTags());
        w = workflowRepository.save(w);
        return workflowMapper.toResponse(w);
    }

    public void deleteTemplate(String templateId, String userId, boolean isAdmin) {
        WorkflowTemplate t = RepositoryUtils.findByIdOrThrow(templateRepository, templateId, "Template not found");
        templateOwnershipService.assertCanDelete(t, userId, isAdmin);
        templateRepository.delete(t);
    }

    private WorkflowTemplateResponse toResponse(WorkflowTemplate t, String authorName) {
        return new WorkflowTemplateResponse(
                t.getId(), t.getName(), t.getDescription(), t.getCategory(), t.getTags(),
                t.getDifficulty(), t.getEstimatedTime(), t.getIsOfficial(),
                t.getUsesCount(), t.getLikesCount(), t.getRating(),
                t.getAuthorId(), authorName, t.getThumbnailUrl(), t.getPreviewImageUrl(),
                t.getCreatedAt(), t.getUpdatedAt());
    }
}
