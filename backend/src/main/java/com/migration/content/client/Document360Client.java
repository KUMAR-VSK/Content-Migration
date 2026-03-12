package com.migration.content.client;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
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

    public String createArticle(String title, String htmlContent) {
        String url = "https://apihub.document360.io/v1/Articles";
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("api_token", apiKey);

        Map<String, Object> body = new HashMap<>();
        body.put("title", title);
        body.put("content", htmlContent);
        // Add other required fields if necessary (e.g. category_id)
        // body.put("category_id", "some-category-id");

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);
            log.info("Document360 API Response: {}", response.getBody());
            return response.getBody();
        } catch (Exception e) {
            log.error("Error calling Document360 API: {}", e.getMessage());
            return "Error: " + e.getMessage();
        }
    }
}
