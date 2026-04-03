package com.workflow.config;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.workflow.entity.Workflow;
import com.workflow.entity.WorkflowTemplate;
import com.workflow.repository.WorkflowRepository;
import com.workflow.repository.WorkflowTemplateRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;
import java.util.List;
import java.util.UUID;

/**
 * Idempotent marketplace seeding on startup (parity with Python
 * {@code ensure_default_marketplace_templates} / {@code ensure_default_marketplace_workflows}).
 * <p>
 * Resource {@code default-marketplace-templates.json} is exported from
 * {@code backend.services.default_marketplace_templates.BUNDLED_MARKETPLACE_TEMPLATES}
 * so Java stays aligned with Python; re-export after changing the Python list.
 */
@Component
@Order(Integer.MAX_VALUE / 4)
public class DefaultMarketplaceStartupSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DefaultMarketplaceStartupSeeder.class);
    private static final String RESOURCE = "default-marketplace-templates.json";

    private final WorkflowTemplateRepository templateRepository;
    private final WorkflowRepository workflowRepository;
    private final ObjectMapper objectMapper;

    public DefaultMarketplaceStartupSeeder(
            WorkflowTemplateRepository templateRepository,
            WorkflowRepository workflowRepository,
            ObjectMapper objectMapper) {
        this.templateRepository = templateRepository;
        this.workflowRepository = workflowRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        try {
            List<BundledMarketplaceTemplate> bundled = loadBundled();
            int templates = seedTemplatesIfEmpty(bundled);
            int workflows = seedWorkflowsIfEmpty(bundled);
            if (templates > 0) {
                log.info("Seeded {} default marketplace workflow template(s)", templates);
            }
            if (workflows > 0) {
                log.info("Seeded {} default public marketplace workflow(s)", workflows);
            }
        } catch (Exception e) {
            log.warn("Could not ensure default marketplace templates/workflows: {}", e.getMessage(), e);
        }
    }

    private List<BundledMarketplaceTemplate> loadBundled() throws Exception {
        ClassPathResource res = new ClassPathResource(RESOURCE);
        if (!res.exists()) {
            log.warn("Classpath resource {} not found; skipping marketplace seed", RESOURCE);
            return List.of();
        }
        try (InputStream in = res.getInputStream()) {
            return objectMapper.readValue(in, new TypeReference<>() {});
        }
    }

    private int seedTemplatesIfEmpty(List<BundledMarketplaceTemplate> bundled) {
        if (bundled.isEmpty() || templateRepository.count() > 0) {
            return 0;
        }
        for (BundledMarketplaceTemplate row : bundled) {
            WorkflowTemplate t = new WorkflowTemplate();
            t.setId(UUID.randomUUID().toString());
            t.setName(row.name());
            t.setDescription(row.description());
            t.setCategory(row.category());
            t.setTags(row.tags());
            t.setDefinition(row.definition());
            t.setDifficulty(row.difficulty());
            t.setEstimatedTime(row.estimatedTime());
            t.setIsOfficial(row.official());
            t.setAuthorId(null);
            templateRepository.save(t);
        }
        return bundled.size();
    }

    private int seedWorkflowsIfEmpty(List<BundledMarketplaceTemplate> bundled) {
        if (bundled.isEmpty() || workflowRepository.countDiscoverableMarketplaceWorkflows() > 0) {
            return 0;
        }
        for (BundledMarketplaceTemplate row : bundled) {
            Workflow w = new Workflow();
            w.setId(UUID.randomUUID().toString());
            w.setName(row.name());
            w.setDescription(row.description());
            w.setVersion("1.0.0");
            w.setDefinition(row.definition());
            w.setOwnerId(null);
            w.setIsPublic(true);
            w.setIsTemplate(false);
            w.setCategory(row.category());
            w.setTags(row.tags());
            workflowRepository.save(w);
        }
        return bundled.size();
    }
}
