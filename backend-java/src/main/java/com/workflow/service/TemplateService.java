package com.workflow.service;

import com.workflow.config.TemplateConfig;
import com.workflow.constants.WorkflowConstants;
import com.workflow.dto.WorkflowTemplateCreate;
import com.workflow.dto.WorkflowTemplateResponse;
import com.workflow.entity.Workflow;
import com.workflow.entity.WorkflowTemplate;
import com.workflow.repository.WorkflowRepository;
import com.workflow.repository.WorkflowTemplateRepository;
import com.workflow.repository.UserRepository;
import com.workflow.util.ObjectUtils;
import com.workflow.util.TemplateFactory;
import com.workflow.util.TemplateMapper;
import com.workflow.util.UserDisplayNameResolver;
import com.workflow.util.WorkflowFactory;
import com.workflow.util.WorkflowMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Objects;

/**
 * Template service - matches Python template_routes. Write operations only; read operations in TemplateQueryService.
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
    private final TemplateQueryService templateQueryService;

    public TemplateService(TemplateConfig.TemplateOptions templateOptions,
                           WorkflowTemplateRepository templateRepository,
                           WorkflowRepository workflowRepository,
                           UserRepository userRepository,
                           WorkflowMapper workflowMapper,
                           TemplateOwnershipService templateOwnershipService,
                           TemplateQueryService templateQueryService) {
        this.templateOptions = templateOptions;
        this.templateRepository = templateRepository;
        this.workflowRepository = workflowRepository;
        this.userRepository = userRepository;
        this.workflowMapper = workflowMapper;
        this.templateOwnershipService = templateOwnershipService;
        this.templateQueryService = templateQueryService;
    }

    public WorkflowTemplateResponse createTemplate(WorkflowTemplateCreate create, String userId, boolean isAdmin) {
        WorkflowTemplate t = TemplateFactory.fromCreate(create, userId, isAdmin,
                templateOptions.getDefaultCategory(), templateOptions.getDefaultDifficulty());
        t = templateRepository.save(t);
        return TemplateMapper.toResponse(t, UserDisplayNameResolver.resolveFromOptional(userRepository.findById(userId)));
    }

    @Transactional
    public com.workflow.dto.WorkflowResponse useTemplate(String templateId, String name, String description, String userId) {
        WorkflowTemplate t = templateQueryService.getTemplateOrThrow(templateId);
        t.setUsesCount(Objects.requireNonNullElse(t.getUsesCount(), 0) + 1);
        templateRepository.save(t);

        Workflow w = WorkflowFactory.create(userId,
                ObjectUtils.orDefault(name, t.getName() + " (from template)"),
                ObjectUtils.orDefault(description, t.getDescription()),
                t.getDefinition(), WorkflowConstants.DEFAULT_VERSION, t.getCategory(), t.getTags());
        w = workflowRepository.save(w);
        return workflowMapper.toResponse(w);
    }

    public void deleteTemplate(String templateId, String userId, boolean isAdmin) {
        WorkflowTemplate t = templateQueryService.getTemplateOrThrow(templateId);
        templateOwnershipService.assertCanDelete(t, userId, isAdmin);
        templateRepository.delete(t);
    }
}
