package com.migration.content.controller;

import com.migration.content.client.Document360Client;
import com.migration.content.service.DocxParser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/migrate")
@RequiredArgsConstructor
@CrossOrigin(origins = "*") // Allow React to connect
public class MigrationController {

    private final DocxParser docxParser;
    private final Document360Client document360Client;

    @PostMapping
    public ResponseEntity<String> migrateDocument(
            @RequestParam("file") MultipartFile file,
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
