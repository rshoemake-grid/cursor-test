package com.workflow.service;

import com.workflow.config.TemplateConfig;
import com.workflow.dto.WorkflowTemplateResponse;
import com.workflow.entity.WorkflowTemplate;
import com.workflow.repository.UserRepository;
import com.workflow.repository.WorkflowTemplateRepository;
import com.workflow.util.PaginationUtils;
import com.workflow.util.ErrorMessages;
import com.workflow.util.RepositoryUtils;
import com.workflow.util.SearchUtils;
import com.workflow.util.TemplateMapper;
import com.workflow.util.UserDisplayNameResolver;
import com.workflow.util.SortStrategy;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.function.Supplier;
import java.util.stream.Collectors;

/**
 * Query-only operations for templates. SRP: Separates read logic from TemplateService.
 */
@Service
@Transactional(readOnly = true)
public class TemplateQueryService {
    private final TemplateConfig.TemplateOptions templateOptions;
    private final WorkflowTemplateRepository templateRepository;
    private final UserRepository userRepository;
    private final SortStrategy templateSortStrategy;

    public TemplateQueryService(TemplateConfig.TemplateOptions templateOptions,
                                WorkflowTemplateRepository templateRepository,
                                UserRepository userRepository,
                                @Qualifier("templateSortStrategy") SortStrategy templateSortStrategy) {
        this.templateOptions = templateOptions;
        this.templateRepository = templateRepository;
        this.userRepository = userRepository;
        this.templateSortStrategy = templateSortStrategy;
    }

    public List<WorkflowTemplateResponse> listTemplates(String category, String difficulty, String search,
                                                        String sortBy, int limit, int offset) {
        int safeLimit = PaginationUtils.clampLimit(limit);
        int safeOffset = Math.max(0, offset);
        var pageable = PageRequest.of(safeOffset / safeLimit, safeLimit, templateSortStrategy.getSort(sortBy));
        List<WorkflowTemplate> templates = templateRepository.findWithFilters(category, difficulty, pageable);
        return templates.stream()
                .filter(t -> SearchUtils.matchesSearch(search, t.getName(), t.getDescription()))
                .map(t -> TemplateMapper.toResponse(t, UserDisplayNameResolver.resolveFromOptional(userRepository.findById(t.getAuthorId()))))
                .collect(Collectors.toList());
    }

    public WorkflowTemplateResponse getTemplate(String templateId) {
        WorkflowTemplate t = getTemplateOrThrow(templateId);
        return TemplateMapper.toResponse(t, UserDisplayNameResolver.resolveFromOptional(userRepository.findById(t.getAuthorId())));
    }

    public WorkflowTemplate getTemplateOrThrow(String templateId) {
        return RepositoryUtils.findByIdOrThrow(templateRepository, templateId, ErrorMessages.TEMPLATE_NOT_FOUND);
    }

    public List<String> getCategories() {
        return templateOptions.getCategories();
    }

    public List<String> getDifficulties() {
        return templateOptions.getDifficulties();
    }
}
