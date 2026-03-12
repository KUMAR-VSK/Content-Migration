package com.migration.content.controller;

import com.migration.content.client.Document360Client;
import com.migration.content.service.DocxParser;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.MultipartFile;
import java.util.Objects;

@RestController
@RequestMapping("/api/migrate")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*") // Allow React to connect
@Tag(name = "Migration API", description = "Endpoints for migrating documents to Document360")
public class MigrationController {

    private final DocxParser docxParser;
    private final Document360Client document360Client;

    @PostMapping(value = "/parse", consumes = "multipart/form-data")
    @Operation(summary = "Parse Word document to HTML", description = "Converts .docx to HTML and returns the content for preview/download")
    public ResponseEntity<String> parseDocument(
            @RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body("Validation Error: Please select a file to upload.");
            }
            
            // Validate File Type
            String filename = file.getOriginalFilename();
            if (filename == null || !filename.toLowerCase().endsWith(".docx")) {
                return ResponseEntity.badRequest().body("Validation Error: Only .docx files are supported.");
            }

            String htmlContent = docxParser.convertToHtml(file.getInputStream());
            return ResponseEntity.ok(htmlContent);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Parsing Error: The document could not be processed. Details: " + e.getMessage());
        }
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<String> handleMaxSizeException(MaxUploadSizeExceededException exc) {
        return ResponseEntity.badRequest().body("Validation Error: File size exceeds the 10MB limit.");
    }

    @GetMapping("/categories")
    @Operation(summary = "Get categories from Document360")
    public ResponseEntity<String> getCategories() {
        return ResponseEntity.ok(document360Client.getCategories());
    }

    @PostMapping
    @Operation(
        summary = "Create article in Document360",
        description = "Takes final HTML content and title to create an article"
    )
    public ResponseEntity<String> migrateDocument(@RequestBody com.migration.content.dto.MigrationRequest request) {
        try {
            if (request.getTitle() == null || request.getTitle().isEmpty()) {
                return ResponseEntity.badRequest().body("Validation Error: Article title is required.");
            }
            if (request.getContent() == null || request.getContent().isEmpty()) {
                return ResponseEntity.badRequest().body("Validation Error: Article content is empty.");
            }

            String result = document360Client.createArticle(request.getTitle(), request.getContent(), request.getCategoryId());
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            log.error("Migration failed: {}", e.getMessage());
            return ResponseEntity.status(500).body(e.getMessage());
        } catch (Exception e) {
            log.error("Unexpected migration error", e);
            return ResponseEntity.status(500).body("Migration failed: An unexpected error occurred.");
        }
    }
}
