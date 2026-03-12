package com.migration.content.service;

import org.apache.poi.xwpf.usermodel.*;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.util.List;

@Service
public class DocxParser {

    public String convertToHtml(InputStream inputStream) throws Exception {
        XWPFDocument document = new XWPFDocument(inputStream);
        StringBuilder html = new StringBuilder();

        for (IBodyElement element : document.getBodyElements()) {
            if (element instanceof XWPFParagraph) {
                processParagraph((XWPFParagraph) element, html);
            } else if (element instanceof XWPFTable) {
                processTable((XWPFTable) element, html);
            }
        }
        return html.toString();
    }

    private void processParagraph(XWPFParagraph paragraph, StringBuilder html) {
        String style = paragraph.getStyleID();
        
        if (paragraph.getText() == null || paragraph.getText().trim().isEmpty()) {
            return;
        }

        String tag = "p";
        if (style != null) {
            if (style.toLowerCase().contains("heading1")) tag = "h1";
            else if (style.toLowerCase().contains("heading2")) tag = "h2";
            else if (style.toLowerCase().contains("heading3")) tag = "h3";
        }

        if (paragraph.getNumID() != null) {
            tag = "li";
        }

        html.append("<").append(tag).append(">");
        
        // Process Runs for Formatting/Hyperlinks
        for (IRunElement run : paragraph.getRuns()) {
            if (run instanceof XWPFRun) {
                XWPFRun xRun = (XWPFRun) run;
                String text = xRun.getText(0);
                if (text != null) {
                    if (xRun.isBold()) html.append("<strong>");
                    if (xRun.isItalic()) html.append("<em>");
                    html.append(text);
                    if (xRun.isItalic()) html.append("</em>");
                    if (xRun.isBold()) html.append("</strong>");
                }
            } else if (run instanceof XWPFHyperlinkRun) {
                XWPFHyperlinkRun linkRun = (XWPFHyperlinkRun) run;
                html.append("<a href='").append(linkRun.getHyperlink().getURL()).append("'>")
                    .append(linkRun.getText())
                    .append("</a>");
            }
        }
        
        html.append("</").append(tag).append(">");
    }

    private void processTable(XWPFTable table, StringBuilder html) {
        html.append("<table border='1'>");
        for (XWPFTableRow row : table.getRows()) {
            html.append("<tr>");
            for (XWPFTableCell cell : row.getTableCells()) {
                html.append("<td>").append(cell.getText()).append("</td>");
            }
            html.append("</tr>");
        }
        html.append("</table>");
    }
}
