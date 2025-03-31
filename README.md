# Pitch Deck Analyzer

Pitch Deck Analyzer is a web application that enables users to upload startup pitch decks (in PDF format), extract and edit key content using Google's Gemini API via Vertex AI, generate a structured investment memo (also using Gemini 2.0 Flash via Vertex AI with search grounding), and validate selected memo sections using Google Custom Search Engine (CSE).

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture & Directory Structure](#architecture--directory-structure)
- [Setup & Configuration](#setup--configuration)
  - [Backend](#backend)
  - [Frontend](#frontend)
  - [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
- [Development & Testing](#development--testing)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Future Enhancements](#future-enhancements)

---

## Overview

Pitch Deck Analyzer streamlines the process of analyzing startup pitch decks. Users can:
- **Upload Pitch Decks:** PDF files are stored on Google Cloud Storage.
- **Extract & Edit Content:** Text is extracted via Google's Gemini API (Vertex AI) and editable through a rich text Markdown editor.
- **Generate Investment Memos:** Leverages Gemini 2.0 Flash (Vertex AI) with Google Search grounding capabilities to create structured investment memos based on the extracted/edited content.
- **Validate Content:** Users can select text from the generated memo and validate it using Google CSE to find relevant web sources.

---

## Features

- **Pitch Deck Upload:** Supports PDF format. Files are uploaded to Google Cloud Storage.
- **Content Extraction:** Uses Gemini API (Vertex AI) to extract text from PDFs.
- **Rich Text Editing:** Allows users to review and modify extracted content using a Markdown editor.
- **Investment Memo Generation:** Integrates Gemini 2.0 Flash via Vertex AI, using its tool-calling capability for Google Search grounding to attempt verification and citation.
- **Content Validation:** Validates selected memo sections via Google Custom Search Engine API.

---

## Architecture & Directory Structure

/stunning-unemployement
├── backend
│ ├── models
│ │ └── Content.js # Mongoose model for storing content data
│ ├── gemini.js # Integration for Gemini PDF extraction (Vertex AI)
│ ├── geminiMemo.js # Integration for Gemini memo generation (Vertex AI)
│ ├── index.js # Express server, API endpoints, core logic
│ ├── storage.js # Google Cloud Storage integration
│ ├── validation.js # Google CSE validation function
│ ├── package.json
│ └── yarn.lock
├── frontend
│ ├── public
│ │ └── vite.svg
│ ├── src
│ │ ├── assets
│ │ │ └── react.svg
│ │ ├── App.css
│ │ ├── App.jsx # Main application component
│ │ ├── FileUpload.jsx # Handles UI for upload, editing, memo generation, & validation
│ │ ├── index.css
│ │ ├── main.jsx
│ │ ├── TextEditor.jsx # Markdown editor component
│ │ └── ValidationResults.jsx# Component for displaying validation results
│ ├── package.json
│ ├── vite.config.js
│ └── yarn.lock
├── package.json # Root package configuration
├── README.md # This documentation
└── yarn.lock

---

## Setup & Configuration

### Backend

1.  **Install Dependencies:**
    Navigate to the `backend` folder and run:
    ```bash
    yarn install
    # or npm install
    ```

2.  **Environment Configuration:**
    Create a `.env` file in the `backend` root (or update your existing one) with the following variables:
    ```env
    # Server
    PORT=3001

    # MongoDB
    MONGO_URI=your_mongodb_connection_string

    # Google Cloud
    GOOGLE_CLOUD_BUCKET=your_gcs_bucket_name
    GOOGLE_CLOUD_PROJECT_ID=your_google_cloud_project_id
    GOOGLE_CLOUD_LOCATION=us-central1 # Or your preferred Vertex AI region
    # GOOGLE_ACCESS_TOKEN=generated_dynamically (Do not set manually)
    # Ensure the service account key file (e.g., pitch-1739020848146-925095e8b054.json) is present in the backend directory

    # Google Custom Search Engine (for validation)
    GOOGLE_CSE_API_KEY=your_google_cse_api_key
    GOOGLE_CSE_ID=your_google_cse_id

    # Gemini Model (Optional - defaults used in code)
    # GEMINI_MODEL_ID=gemini-2.0-flash-001 # For memo generation (check Vertex AI for exact ID)
    ```
    *   **Important:** The `GOOGLE_ACCESS_TOKEN` is generated dynamically using the service account key file specified in `backend/index.js`. Ensure the key file exists and the path is correct.
    *   Make sure the service account associated with the key file has necessary permissions (Vertex AI User, Storage Object Admin/Creator, etc.).

3.  **Run the Server:**
    Start the backend server:
    ```bash
    yarn start
    # or npm start
    ```
    The server will run on the specified port (default is 3001).

### Frontend

1.  **Install Dependencies:**
    In the `frontend` folder, run:
    ```bash
    yarn install
    # or npm install
    ```

2.  **Run the Frontend:**
    Start the development server:
    ```bash
    yarn dev
    # or npm run dev
    ```
    The frontend will typically be available at `http://localhost:5173` (Vite's default).

---

## API Endpoints

### File Upload & Extraction
-   **POST `/upload`**
    Uploads a pitch deck file (PDF).
    **Response (Success):**
    ```json
    {
      "message": "Upload and processing successful",
      "contentId": "mongodb_object_id",
      "uploadId": "file_name.pdf",
      "extractedText": "Extracted text content from the PDF..."
    }
    ```
    **Response (Error):**
    ```json
    {
      "error": "Error message",
      "details": "Optional error details"
    }
    ```

### Retrieve & Update Content
-   **GET `/content/:uploadId`**
    Retrieves content (original, edited, memo) by the `uploadId` (filename).
-   **PUT `/content/:uploadId`**
    Updates the `editedContent` field for a given `uploadId`.
    **Request Body:**
    ```json
    { "editedContent": "The user's updated text content..." }
    ```
    **Response (Success):**
    ```json
    {
        "message": "Content updated",
        "content": { /* Updated Content document from MongoDB */ }
    }
    ```

### Memo Generation
-   **POST `/generate-memo/:uploadId`**
    Generates an investment memo using Gemini 2.0 Flash (Vertex AI) based on the `editedContent` (or `originalContent` if not edited).
    **Response (Success):**
    ```json
    {
      "message": "Memo generated successfully",
      "memo": "### Investment Memo: ...\n\n**Value Proposition:**..."
    }
    ```
     **Response (Error):**
    ```json
    {
      "error": "Failed to generate memo",
      "details": { /* Optional error details from API call or internal error */ }
    }
    ```

### Validation via Google CSE
-   **POST `/validate-memo-content`**
    Validates a selected snippet of text from the memo using Google CSE.
    **Request Body:**
    ```json
    { "query": "Selected text snippet to validate..." }
    ```
    **Response (Success):**
    ```json
    {
      "results": [
        {
          "title": "Web Search Result Title",
          "snippet": "A snippet from the web page...",
          "link": "https://example.com/source_url"
        }
        // ... more results (up to 10 typically)
      ]
    }
    ```
    **Response (Error):**
    ```json
    {
      "error": "Error message (e.g., Query text is required.)",
      "details": "Optional error details"
    }
    ```

---

## Development & Testing

-   **API Endpoint Testing:** Use tools like Postman, Insomnia, or cURL to manually test backend endpoints.
-   **Frontend Development:** The frontend uses Vite, providing Hot Module Replacement (HMR) for a fast development experience.
-   **Debugging:** Utilize browser developer tools (Console, Network tabs) for frontend debugging and inspect backend terminal output for server-side logs.

---

## Deployment

-   **Backend:** Deploy the Node.js/Express application to platforms like Google Cloud Run, App Engine, Heroku, or AWS EC2/Fargate. Ensure all environment variables are configured securely in the deployment environment. Configure CORS appropriately for your production frontend URL.
-   **Frontend:** Deploy the static build output (after running `yarn build` or `npm run build` in the `frontend` directory) to services like Vercel, Netlify, Google Cloud Storage (with CDN), or Firebase Hosting.
-   **Monitoring & Logging:** Implement more robust, structured logging (e.g., using `pino` or `winston`) in the backend for production. Integrate with log aggregation services (like Google Cloud Logging, Datadog, Sentry) for better monitoring and error tracking.

---

## Troubleshooting

-   **Environment Variables:** Double-check that all required `.env` variables are correctly set in the `backend` directory and accessible by the Node.js process. Verify paths and names.
-   **Google Cloud Permissions:** Ensure the service account key used has the necessary IAM roles (Vertex AI User, Storage Object Admin/Creator) in your Google Cloud project.
-   **API Key Errors:** Confirm that API keys for Google CSE are correct and that the respective APIs (Vertex AI, Custom Search) are enabled in your Google Cloud project.
-   **CORS Errors:** If the frontend cannot reach the backend, check the browser console for CORS errors. Ensure the `cors()` middleware in `backend/index.js` is configured correctly (for development, it's permissive; for production, restrict it to your frontend's domain).
-   **Server Crashes:** Review backend logs for specific error messages, uncaught exceptions, or unhandled promise rejections.

---

## Future Enhancements

-   Implement user authentication (e.g., using JWT, OAuth) to associate content with specific users.
-   Refine the grounding/citation mechanism in the memo generation prompt for better accuracy.
-   Add caching (e.g., using Redis) for frequently accessed data or API responses.
-   Implement structured logging for better production monitoring.
-   Improve error handling and user feedback on the frontend.
-   Add unit and integration tests for backend and potentially frontend components.
-   Automate temporary file cleanup in the `/uploads` directory (or switch to in-memory storage if feasible).

---