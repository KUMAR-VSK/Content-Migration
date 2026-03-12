
# Document Migration Application

A full-stack application built with React.js and Spring Boot to automate the migration of Microsoft Word documents (.docx) to Document360 articles.

## Features
- **File Upload**: Simple drag-and-drop or file selection for .docx files.
- **Automated Parsing**: Extracts headings, paragraphs, lists, and tables using Apache POI.
- **HTML Conversion**: Converts Word structure into clean, semantic HTML.
- **API Integration**: Direct upload to Document360 via their Article Creation API.
- **CORS Enabled**: Backend configured to allow frontend communication.

---

## Tech Stack
- **Frontend**: React.js (Vite), Axios, CSS3
- **Backend**: Spring Boot (Java 17+), Maven
- **Library**: Apache POI (5.2.3)
- **Integration**: Document360 REST API

---

## Prerequisites
- Java 17 or higher
- Node.js 18 or higher
- Maven 3.6+
- Document360 API Token

---

## Getting Started

### 1. Document360 Setup
Get your API Token from Document360 and update `backend/src/main/resources/application.properties`:
```properties
document360.api.key=YOUR_API_TOKEN
document360.project.id=YOUR_PROJECT_ID
```

### 2. Run Backend
```bash
cd backend
./mvnw spring-boot:run
```
The backend will run on `http://localhost:8080`.

### 3. Run Frontend
```bash
cd frontend
npm install
npm run dev
```
The frontend will run on `http://localhost:5173` (or similar).

---

## Project Structure

### Backend (`/backend`)
- `DocxParser.java`: Core logic for parsing .docx and converting to HTML.
- `Document360Client.java`: Service to interact with the Document360 API.
- `MigrationController.java`: REST endpoint for file uploading.

### Frontend (`/frontend`)
- `FileUpload.jsx`: React component managing the file selection and API call.
- `App.jsx`: Main entry point with UI layout.

---

## Usage
1. Open the React application in your browser.
2. Enter the desired **Title** for your article.
3. Select the **.docx** file you want to migrate.
4. Click **Migrate to Document360**.
5. Wait for the success message and view the API response.
