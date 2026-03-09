package com.workflow.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * OCP: LLM provider URLs configurable via application properties.
 * Add new providers without editing LlmTestService.
 */
@Configuration
public class LlmProviderConfig {

    @Bean
    @ConfigurationProperties(prefix = "workflow.llm.provider.urls")
    public LlmProviderUrls providerUrls() {
        return new LlmProviderUrls();
    }

    public static class LlmProviderUrls {
        private String openai = "https://api.openai.com/v1";
        private String anthropic = "https://api.anthropic.com/v1";
        private String gemini = "https://generativelanguage.googleapis.com/v1beta";

        public String getOpenai() {
            return openai;
        }

        public void setOpenai(String openai) {
            this.openai = openai;
        }

        public String getAnthropic() {
            return anthropic;
        }

        public void setAnthropic(String anthropic) {
            this.anthropic = anthropic;
        }

        public String getGemini() {
            return gemini;
        }

        public void setGemini(String gemini) {
            this.gemini = gemini;
        }
    }
}
