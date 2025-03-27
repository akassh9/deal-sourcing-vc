# Pitch Deck Analyzer

Pitch Deck Analyzer is a web application that enables users to upload startup pitch decks (in PDF or PPT formats), extract and edit key content using Google’s Gemini API, and generate an investment memo via a reasoning LLM on Groq Cloud. In addition, users can validate selected memo sections using Google Custom Search Engine (CSE).

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
- **Upload Pitch Decks:** Files are stored on Google Cloud Storage.
- **Extract & Edit Content:** Extracted via Google’s Gemini API and editable through a rich text editor.
- **Generate Investment Memos:** Leverages Groq Cloud’s reasoning LLM to create structured memos.
- **Validate Content:** Users can validate selected text from the memo using Google CSE to verify critical details.

---

## Features

- **User Authentication** (planned for future development)
- **Pitch Deck Upload:** Supports PDF, PPT, and PPTX formats.
- **Content Extraction:** Uses Gemini API to extract text and key details.
- **Rich Text Editing:** Allows users to review and edit extracted content.
- **Investment Memo Generation:** Integrates Groq Cloud's LLM.
- **Content Validation:** Validates memo sections via Google CSE.
- **Automated Verification:** (Future task) Tool-calling for financial details.

---

## Architecture & Directory Structure

```
/stunning-unemployement
├── backend
│   ├── models
│   │   └── Content.js           # Mongoose model for content
│   ├── gemini.js                # Integration with Google's Gemini API
│   ├── groq.js                  # Integration with Groq Cloud’s LLM
│   ├── index.js                 # Express server & API endpoints
│   ├── storage.js               # Google Cloud Storage integration
│   ├── validation.js            # Google CSE validation function
│   ├── package.json
│   └── yarn.lock
├── frontend
│   ├── public
│   │   └── vite.svg
│   ├── src
│   │   ├── assets
│   │   │   └── react.svg
│   │   ├── App.css
│   │   ├── App.jsx              # Main app component
│   │   ├── FileUpload.jsx       # Handles file upload, editing, memo generation, & validation UI
│   │   ├── index.css
│   │   ├── main.jsx
│   │   ├── TextEditor.jsx       # Markdown editor for editing extracted text
│   │   └── ValidationResults.jsx# Component for displaying validation results
│   ├── package.json
│   ├── vite.config.js
│   └── yarn.lock
├── package.json                 # Root package configuration
├── README.md                    # This documentation
└── yarn.lock
```

---

## Setup & Configuration

### Backend

1. **Install Dependencies:**  
   Navigate to the `backend` folder and run:
   ```bash
   yarn install
   # or npm install
   ```

2. **Environment Configuration:**  
   Create a `.env` file in the backend root (or update your existing one) with the following variables:
   ```env
   PORT=3001
   MONGO_URI=your_mongodb_connection_string
   GOOGLE_CLOUD_BUCKET=your_bucket_name
   GOOGLE_CLOUD_PROJECT_ID=your_google_cloud_project_id
   GOOGLE_ACCESS_TOKEN=generated_dynamically
   GOOGLE_CSE_API_KEY=your_google_cse_api_key
   GOOGLE_CSE_ID=your_google_cse_id
   GROQ_API_KEY=your_groq_api_key
   ```
   *Note:* The `GOOGLE_ACCESS_TOKEN` is set dynamically in the code using the GoogleAuth library.

3. **Run the Server:**  
   Start the backend server:
   ```bash
   yarn start
   # or npm start
   ```
   The server will be running on the specified port (default is 3001).

### Frontend

1. **Install Dependencies:**  
   In the `frontend` folder, run:
   ```bash
   yarn install
   # or npm install
   ```

2. **Run the Frontend:**  
   Start the development server:
   ```bash
   yarn dev
   # or npm run dev
   ```

---

## API Endpoints

### File Upload & Extraction
- **POST `/upload`**  
  Uploads a pitch deck file.  
  **Response:**  
  ```json
  {
    "message": "Upload and processing successful",
    "contentId": "mongodb_object_id",
    "uploadId": "file_name",
    "extractedData": { /* Gemini API response */ }
  }
  ```

### Retrieve & Update Content
- **GET `/content/:uploadId`**  
  Retrieves content by upload ID.
- **PUT `/content/:uploadId`**  
  Updates edited content.  
  **Request Body:**  
  ```json
  { "editedContent": "updated text" }
  ```

### Memo Generation
- **POST `/generate-memo/:uploadId`**  
  Generates an investment memo using Groq Cloud’s LLM.  
  **Response:**  
  ```json
  {
    "message": "Memo generated successfully",
    "memo": "generated memo text",
    "reasoning": "reasoning steps"
  }
  ```

### Validation via Google CSE
- **POST `/validate-memo-content`**  
  Validates selected memo content.  
  **Request Body:**  
  ```json
  { "query": "selected text" }
  ```
  **Response:**  
  ```json
  {
    "results": [
      {
        "title": "Result title",
        "snippet": "Result snippet",
        "link": "Result URL"
      }
      // more results
    ]
  }
  ```

---

## Development & Testing

- **Testing API Endpoints:**  
  Use tools like Postman or cURL to test each endpoint.
  
- **Unit Testing (Optional):**  
  Consider using frameworks like Mocha, Chai, and Supertest to write unit tests for your backend endpoints.

- **Hot Module Reloading (HMR):**  
  The frontend uses Vite for fast development with HMR.

---

## Deployment

- **Backend:**  
  Deploy on platforms like Google Cloud, Heroku, or AWS. Ensure environment variables are set on the deployment platform.
  
- **Frontend:**  
  Deploy using Vercel, Netlify, or your preferred hosting service.

- **Monitoring & Logging:**  
  Set up logging for error tracking and monitoring, especially for API interactions with external services.

---

## Troubleshooting

- **Environment Variables:**  
  Verify that all required variables are set and correctly referenced.
  
- **API Key Errors:**  
  Double-check API keys for Google CSE, Groq Cloud, and Google Cloud Storage if encountering authentication errors.
  
- **Server Crashes:**  
  Review logs for uncaught exceptions or unhandled promise rejections.

---

## Future Enhancements

- Implement JWT-based user authentication.
- Add caching (e.g., using Redis) to optimize performance.
- Enhance automated financial verification with tool-calling features.
- Expand unit and integration tests for a more robust CI/CD pipeline.

---

Feel free to modify this documentation as your project evolves. This README serves as a comprehensive guide for both new and existing developers working on Pitch Deck Analyzer.

---

Let me know if you'd like any further adjustments or additions to this README!