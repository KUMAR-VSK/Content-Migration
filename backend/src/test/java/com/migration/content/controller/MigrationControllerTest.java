package com.migration.content.controller;

import com.migration.content.client.Document360Client;
import com.migration.content.service.DocxParser;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

public class MigrationControllerTest {

    private MockMvc mockMvc;

    @Mock
    private DocxParser docxParser;

    @Mock
    private Document360Client document360Client;

    @InjectMocks
    private MigrationController migrationController;

    @BeforeEach
    public void setup() {
        MockitoAnnotations.openMocks(this);
        mockMvc = MockMvcBuilders.standaloneSetup(migrationController).build();
    }

    @Test
    public void testParseDocument() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file", "test.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "content".getBytes());

        when(docxParser.convertToHtml(any())).thenReturn("<h1>Test</h1>");

        mockMvc.perform(multipart("/api/migrate/parse").file(file))
                .andExpect(status().isOk())
                .andExpect(content().string("<h1>Test</h1>"));
    }

    @Test
    public void testParseDocument_InvalidType() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file", "test.txt", "text/plain", "content".getBytes());

        mockMvc.perform(multipart("/api/migrate/parse").file(file))
                .andExpect(status().isBadRequest())
                .andExpect(content().string("Validation Error: Only .docx files are supported."));
    }

    @Test
    public void testGetCategories() throws Exception {
        when(document360Client.getCategories()).thenReturn("[{\"id\":\"1\", \"name\":\"General\"}]");

        mockMvc.perform(get("/api/migrate/categories"))
                .andExpect(status().isOk())
                .andExpect(content().json("[{\"id\":\"1\", \"name\":\"General\"}]"));
    }
}
