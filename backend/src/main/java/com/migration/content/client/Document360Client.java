package com.migration.content.client;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Component
@Slf4j
public class Document360Client {

    @Value("${document360.api.key}")
    private String apiKey;

    @Value("${document360.project.id}")
    private String projectId;

    private final RestTemplate restTemplate = new RestTemplate();

    public String createArticle(String title, String htmlContent, String categoryId) {
        String url = "https://apihub.document360.io/v1/Articles";
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("api_token", apiKey);
        // Add Authorization header for newer tokens
        headers.set("Authorization", "Bearer " + apiKey);

        Map<String, Object> body = new HashMap<>();
        body.put("title", title);
        body.put("content", htmlContent);
        if (categoryId != null && !categoryId.isEmpty()) {
            body.put("category_id", categoryId);
        }

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);
            log.info("Document360 API Response: {}", response.getBody());
            return response.getBody();
        } catch (HttpClientErrorException e) {
            String message = "API Error: ";
            if (e.getStatusCode() == HttpStatus.UNAUTHORIZED) message += "Invalid API Token. Please check your configuration.";
            else if (e.getStatusCode() == HttpStatus.FORBIDDEN) message += "Permission denied. Check your Document360 plan/settings.";
            else if (e.getStatusCode() == HttpStatus.NOT_FOUND) message += "Endpoint not found. Check your Project ID.";
            else message += e.getResponseBodyAsString();
            log.error("Document360 API Client Error: {} - {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new RuntimeException(message);
        } catch (Exception e) {
            log.error("Error calling Document360 API: {}", e.getMessage());
            throw new RuntimeException("Integration Error: Could not connect to Document360.");
        }
    }

    public String getCategories() {
        // Primary Attempt: V2 ProjectVersions endpoint (Recommended for newer projects)
        String urlV2 = String.format("https://apihub.document360.io/v2/ProjectVersions/%s/categories", projectId);
        
        HttpHeaders headers = new HttpHeaders();
        headers.set("api_token", apiKey);
        headers.set("Authorization", "Bearer " + apiKey);
        
        HttpEntity<Void> request = new HttpEntity<>(headers);

        try {
            log.info("Attempting to fetch categories via V2 API...");
            ResponseEntity<String> response = restTemplate.exchange(urlV2, HttpMethod.GET, request, String.class);
            return response.getBody();
        } catch (Exception e) {
            log.warn("V2 category fetch failed, trying V1 Projects endpoint: {}", e.getMessage());
            // Fallback Attempt: V1 Projects endpoint
            try {
                String urlV1 = String.format("https://apihub.document360.io/v1/Projects/%s/Categories", projectId);
                ResponseEntity<String> fallbackResponse = restTemplate.exchange(urlV1, HttpMethod.GET, request, String.class);
                return fallbackResponse.getBody();
            } catch (Exception ex) {
                log.error("All category fetch attempts failed: {}", ex.getMessage());
                return "[]";
            }
        }
    }
}
