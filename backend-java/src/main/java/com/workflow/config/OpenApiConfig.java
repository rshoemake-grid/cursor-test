package com.workflow.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * OpenAPI configuration for Apigee API catalog compatibility.
 * Matches Python backend Apigee-friendly metadata.
 */
@Configuration
public class OpenApiConfig {

    @Value("${apigee.api-title:Agentic Workflow Builder API}")
    private String apiTitle;

    @Value("${apigee.api-description:API for the Agentic Workflow Builder application}")
    private String apiDescription;

    @Value("${apigee.api-version:1.0.0}")
    private String apiVersion;

    @Value("${apigee.production-url:https://api.yourdomain.com/api/v1}")
    private String productionUrl;

    @Value("${apigee.development-url:http://localhost:8000/api/v1}")
    private String developmentUrl;

    @Value("${apigee.docs-url:https://docs.yourdomain.com/api}")
    private String docsUrl;

    @Bean
    public OpenAPI apigeeOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title(apiTitle)
                        .description(apiDescription)
                        .version(apiVersion)
                        .contact(new Contact()
                                .name("API Support")
                                .email("api-support@yourdomain.com"))
                        .license(new License()
                                .name("Proprietary")
                                .url("https://yourdomain.com/license")))
                .servers(List.of(
                        new Server().url(productionUrl).description("Production"),
                        new Server().url(developmentUrl).description("Development")
                ))
                .externalDocs(new io.swagger.v3.oas.models.ExternalDocumentation()
                        .description("Full API Documentation and Developer Guide")
                        .url(docsUrl));
    }
}
