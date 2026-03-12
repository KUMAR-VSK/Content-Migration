package com.migration.content.dto;

import lombok.Data;

@Data
public class MigrationRequest {
    private String title;
    private String content;
    private String categoryId;
}
