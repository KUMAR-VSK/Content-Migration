package com.migration.content.controller;

import com.migration.content.client.Document360Client;
import com.migration.content.service.DocxParser;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/migrate")
@RequiredArgsConstructor
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
            if (file.isEmpty()) return ResponseEntity.badRequest().body("File is empty");
            String htmlContent = docxParser.convertToHtml(file.getInputStream());
            return ResponseEntity.ok(htmlContent);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Parsing failed: " + e.getMessage());
        }
    }

    @PostMapping
    @Operation(
        summary = "Migrate a Word document",
        description = "Parses a .docx file and creates a corresponding article in Document360",
        responses = {
            @ApiResponse(responseCode = "200", description = "Migration successful"),
            @ApiResponse(responseCode = "400", description = "Invalid input or empty file"),
            @ApiResponse(responseCode = "500", description = "Migration failed internally")
        }
    )
    public ResponseEntity<String> migrateDocument(
            @Parameter(description = "The .docx file to upload", required = true)
            @RequestParam("file") MultipartFile file,
            @Parameter(description = "The title of the article to be created", required = true)
            @RequestParam("title") String title) {
        
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body("File is empty");
            }

            // 1. Parse Word Doc to HTML
            String htmlContent = docxParser.convertToHtml(file.getInputStream());

            // 2. Upload to Document360
            String result = document360Client.createArticle(title, htmlContent);

            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Migration failed: " + e.getMessage());
        }
    }
}
