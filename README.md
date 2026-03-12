
# Document Migration Application

A premium full-stack application built with **React.js** and **Spring Boot** to automate the migration of Microsoft Word documents (`.docx`) to **Document360** articles.

---

## ✨ Features
- **Intelligent Parsing**: Extracts headings, paragraphs, bullet/numbered lists, and tables using Apache POI.
- **🖼️ Image Extraction**: Automatically extracts embedded images from Word docs and embeds them as Base64 in the HTML content.
- **📄 Live Preview**: Preview the generated HTML content and formatting before committing the migration.
- **💾 Local Download**: Option to download the clean HTML file locally to your machine.
- **🔄 Multi-Step Workflow**: Interactive 3-step UI (Upload -> Preview -> Confirm) powered by **Framer Motion**.
- **🔗 Hyperlink Support**: Maintains all document hyperlinks during conversion.
- **🔍 Swagger Documentation**: Built-in API documentation and sandbox for testing endpoints.
- **🎨 Premium UI**: Modern glassmorphism design with responsive elements and scanning animations.

---

## 🛠️ Tech Stack

### Frontend
- **React 18** (Vite)
- **Framer Motion** (Smooth transitions and animations)
- **Lucide React** (Vector icons)
- **Axios** (API communication)

### Backend
- **Spring Boot 3.x** (Java 17+)
- **Apache POI 5.2.3** (Word document processing)
- **SpringDoc OpenAPI** (Swagger/OpenAPI documentation)
- **Lombok** (Boilerplate reduction)

---

## 🚀 Getting Started

### 1. Prerequisites
- **Java 17** or higher
- **Node.js 18** or higher
- **Maven 3.6+**
- A **Document360 API Token**

### 2. Configuration
Update the `backend/src/main/resources/application.properties` file:
```properties
document360.api.key=YOUR_API_TOKEN
document360.project.id=YOUR_PROJECT_ID
```

### 3. Run the Backend
```bash
cd backend
./mvnw spring-boot:run
```
- **Base URL**: `http://localhost:8080`
- **Swagger UI**: `http://localhost:8080/swagger-ui.html`

### 4. Run Tests (Optional)
```bash
cd backend
./mvnw test
```

### 5. Run the Frontend
```bash
cd frontend
npm install
npm run dev
```
- **URL**: `http://localhost:5173`

---

## 📂 Project Architecture

### Backend (`/backend`)
- **`DocxParser.java`**: Critical logic for parsing Word elements and handling image-to-Base64 conversion.
- **`Document360Client.java`**: Handles authenticated POST requests to the Document360 Articles API.
- **`MigrationController.java`**: REST Controller providing parsing (preview) and migration (upload) endpoints.

### Frontend (`/frontend`)
- **`FileUpload.jsx`**: The core interactive component managing state transitions, animations, and file management.
- **`App.jsx`**: Main layout container with global styles and header.

---

## 🛡️ Error Handling & Validation
The application includes multi-layered validation to ensure data integrity:
- **File Validation**: Both frontend and backend verify that only `.docx` files are uploaded.
- **Size Limits**: Enforced 10MB file size limit to prevent server overload.
- **Parsing Errors**: Robust handling of corrupt or password-protected documents with user-friendly error messages.
- **API Resilience**: Specific handling for Document360 API failures (e.g., 401 Unauthorized, 403 Forbidden) with actionable feedback for the user.
- **🛡️ Quality Assurance**: Includes a comprehensive suite of **JUnit 5** and **Mockito** backend tests for controllers and document parsing.

---

## 🔄 Workflow
1. **Upload**: Enter an article title and select your `.docx` file.
2. **Preview**: View the parsed HTML content. Use the "Scanning" animation to track processing.
3. **Action**:
    - Click the **Download** icon to save the HTML locally.
    - Click **Confirm Migration** to upload to Document360.
4. **Success**: Receive instant confirmation and article details from the API.

---

## 🛡️ License
Distributed under the MIT License. See `LICENSE` for more information.
