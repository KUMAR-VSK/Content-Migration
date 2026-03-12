package com.migration.content.client;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
@Slf4j
public class Document360Client {

    @Value("${document360.api.key}")
    private String apiKey;

    @Value("${document360.project.id}")
    private String userId; // Repurposing project.id property as user.id based on user feedback

    private String projectVersionId;
    private final RestTemplate restTemplate = new RestTemplate();

    private void ensureProjectVersionId() {
        if (projectVersionId != null) return;
        
        String url = "https://apihub.document360.io/v2/ProjectVersions";
        HttpHeaders headers = new HttpHeaders();
        headers.set("api_token", apiKey);
        headers.set("Authorization", "Bearer " + apiKey);
        
        HttpEntity<Void> request = new HttpEntity<>(headers);
        
        try {
            log.info("Fetching Project Version ID...");
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, request, Map.class);
            Map<String, Object> body = response.getBody();
            
            if (body != null && Boolean.TRUE.equals(body.get("success"))) {
                List<Map<String, Object>> versions = (List<Map<String, Object>>) body.get("data");
                if (versions != null && !versions.isEmpty()) {
                    // Find main version or take the first one
                    for (Map<String, Object> version : versions) {
                        if (Boolean.TRUE.equals(version.get("is_main_version"))) {
                            projectVersionId = (String) version.get("id");
                            break;
                        }
                    }
                    if (projectVersionId == null) {
                        projectVersionId = (String) versions.get(0).get("id");
                    }
                    log.info("Found Project Version ID: {}", projectVersionId);
                }
            } else {
                String errorMsg = body != null ? body.toString() : "No response body";
                log.error("API Error fetching project versions: {}", errorMsg);
                throw new RuntimeException("API Error: " + errorMsg);
            }
        } catch (Exception e) {
            log.error("Failed to fetch Project Version ID: {}", e.getMessage());
            throw new RuntimeException("Configuration Error: Could not determine Project Version. Details: " + e.getMessage());
        }
    }

    public String createArticle(String title, String htmlContent, String categoryId) {
        ensureProjectVersionId();
        String url = "https://apihub.document360.io/v2/Articles";
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("api_token", apiKey);
        headers.set("Authorization", "Bearer " + apiKey);

        Map<String, Object> body = new HashMap<>();
        body.put("title", title);
        body.put("content", htmlContent);
        body.put("project_version_id", projectVersionId);
        body.put("user_id", userId);
        
        if (categoryId != null && !categoryId.isEmpty()) {
            body.put("category_id", categoryId);
        }

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);
            log.info("Document360 API Response [HTTP {}]: {}", response.getStatusCode(), response.getBody());
            return response.getBody();
        } catch (HttpClientErrorException e) {
            log.error("Document360 API Client Error: {} - {}", e.getStatusCode(), e.getResponseBodyAsString());
            String message = "API Error: " + (e.getResponseBodyAsString().contains("description") ? e.getResponseBodyAsString() : e.getStatusText());
            throw new RuntimeException(message);
        } catch (Exception e) {
            log.error("Error calling Document360 API: {}", e.getMessage());
            throw new RuntimeException("Integration Error: Could not connect to Document360.");
        }
    }

    public String getCategories() {
        ensureProjectVersionId();
        String url = String.format("https://apihub.document360.io/v2/ProjectVersions/%s/categories", projectVersionId);
        
        HttpHeaders headers = new HttpHeaders();
        headers.set("api_token", apiKey);
        headers.set("Authorization", "Bearer " + apiKey);
        
        HttpEntity<Void> request = new HttpEntity<>(headers);

        try {
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, request, String.class);
            return response.getBody();
        } catch (Exception e) {
            log.warn("Category fetch failed: {}", e.getMessage());
            return "[]";
        }
    }
}
