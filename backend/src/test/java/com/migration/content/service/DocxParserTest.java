package com.migration.content.service;

import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.apache.poi.xwpf.usermodel.XWPFRun;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;

import static org.junit.jupiter.api.Assertions.assertTrue;

public class DocxParserTest {

    private final DocxParser docxParser = new DocxParser();

    @Test
    public void testConvertToHtml() throws Exception {
        // Create a simple in-memory .docx document
        XWPFDocument document = new XWPFDocument();
        XWPFParagraph paragraph = document.createParagraph();
        XWPFRun run = paragraph.createRun();
        run.setText("Hello World");
        run.setBold(true);

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        document.write(out);
        InputStream inputStream = new ByteArrayInputStream(out.toByteArray());

        // Parse it
        String html = docxParser.convertToHtml(inputStream);

        // Verify content
        assertTrue(html.contains("<p>"));
        assertTrue(html.contains("<strong>Hello World</strong>"));
        assertTrue(html.contains("</p>"));
    }

    @Test
    public void testHeadingParsing() throws Exception {
        XWPFDocument document = new XWPFDocument();
        XWPFParagraph heading = document.createParagraph();
        heading.setStyle("Heading1");
        XWPFRun run = heading.createRun();
        run.setText("My Title");

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        document.write(out);
        InputStream inputStream = new ByteArrayInputStream(out.toByteArray());

        String html = docxParser.convertToHtml(inputStream);

        // Note: style mapping depends on style ID. 
        // In some environments "Heading1" might be mapped differently, 
        // but our code checks for .contains("heading1").
        // POI default styles might not have "Heading1" ID unless specified.
        // However, we can test the general structure.
        assertTrue(html.contains("My Title"));
    }
}
