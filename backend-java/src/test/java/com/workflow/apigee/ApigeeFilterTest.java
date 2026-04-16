package com.workflow.apigee;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.lang.reflect.Field;

import static org.junit.jupiter.api.Assertions.*;

class ApigeeFilterTest {

    @Test
    void oversizedPost_returns413WithPythonShapedErrorBody() throws Exception {
        ObjectMapper objectMapper = new ObjectMapper();
        ApigeeFilter filter = new ApigeeFilter(objectMapper);
        setMaxRequestSize(filter, 100L);

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setMethod("POST");
        request.setRequestURI("/api/workflows");
        request.addHeader("Content-Length", "500");

        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();

        filter.doFilter(request, response, chain);

        assertEquals(413, response.getStatus());
        JsonNode body = objectMapper.readTree(response.getContentAsString());
        assertTrue(body.path("detail").isTextual());
        assertTrue(body.path("detail").asText().contains("Request body too large"));
        assertEquals("413", body.path("error").path("code").asText());
        assertEquals("/api/workflows", body.path("error").path("path").asText());
        assertTrue(body.path("error").path("message").asText().contains("Maximum size"));
    }

    @Test
    void echoesXRequestIdFromInboundHeader() throws Exception {
        ObjectMapper objectMapper = new ObjectMapper();
        ApigeeFilter filter = new ApigeeFilter(objectMapper);
        setMaxRequestSize(filter, 10 * 1024 * 1024L);

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setMethod("GET");
        request.setRequestURI("/health");
        request.addHeader("X-Request-ID", "incoming-req-id");

        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();

        filter.doFilter(request, response, chain);

        assertEquals("incoming-req-id", response.getHeader("X-Request-ID"));
        assertNotNull(response.getHeader("X-Content-Type-Options"));
        assertNotNull(response.getHeader("X-RateLimit-Limit"));
    }

    private static void setMaxRequestSize(ApigeeFilter filter, long size) throws Exception {
        Field f = ApigeeFilter.class.getDeclaredField("maxRequestSize");
        f.setAccessible(true);
        f.set(filter, size);
    }
}
