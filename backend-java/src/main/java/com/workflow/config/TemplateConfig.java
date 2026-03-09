package com.workflow.config;

import com.workflow.util.ObjectUtils;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * OCP: Template categories and difficulties configurable via application properties.
 */
@Configuration
public class TemplateConfig {

    @Bean
    @ConfigurationProperties(prefix = "workflow.template")
    public TemplateOptions templateOptions() {
        return new TemplateOptions();
    }

    public static class TemplateOptions {
        private List<String> categories = List.of("automation", "data-processing", "content", "analytics", "custom");
        private List<String> difficulties = List.of("beginner", "intermediate", "advanced");

        public List<String> getCategories() {
            return categories;
        }

        public void setCategories(List<String> categories) {
            this.categories = categories;
        }

        public List<String> getDifficulties() {
            return difficulties;
        }

        public void setDifficulties(List<String> difficulties) {
            this.difficulties = difficulties;
        }

        /** Default difficulty when not specified. Returns first in list or "beginner". */
        public String getDefaultDifficulty() {
            return ObjectUtils.firstOrDefault(difficulties, "beginner");
        }

        /** Default category when not specified. Returns last in list ("custom") or "custom". */
        public String getDefaultCategory() {
            return ObjectUtils.lastOrDefault(categories, "custom");
        }
    }
}
