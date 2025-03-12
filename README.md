# Stunning Unemployment

A web application designed to make VC scouting easier, utilizing a React-based frontend and a Node.js/Express backend, with data storage in MongoDB and file storage in Google Cloud Storage.

## Table of Contents

- [Features](#features)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [Contributing](#contributing)
- [License](#license)

## Features

- **Frontend**: Built with React, offering a responsive and intuitive user interface.
- **Backend**: Developed using Node.js and Express, providing robust API endpoints.
- **Database**: MongoDB for efficient and scalable data management.
- **File Storage**: Integrated with Google Cloud Storage for secure and scalable file uploads.

## Project Structure

```
/stunning-unemployment
├── backend
│   ├── .env
│   ├── index.js
│   ├── package.json
│   ├── storage.js
│   └── yarn.lock
├── frontend
│   ├── public
│   ├── src
│   │   ├── assets
│   │   ├── App.css
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── package.json
│   └── yarn.lock
├── .gitignore
└── README.md
```

## Installation

### Prerequisites

- **Node.js**: Ensure you have Node.js installed. You can download it from [nodejs.org](https://nodejs.org/).
- **Yarn**: This project uses Yarn as the package manager. Install it globally using:
  ```bash
  npm install -g yarn
  ```

### Backend Setup

1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   yarn install
   ```

### Frontend Setup

1. **Navigate to the frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   yarn install
   ```

## Environment Variables

Create a `.env` file in the `backend` directory to configure the following environment variables:

```env
MONGO_URI=your_mongodb_connection_string
GOOGLE_APPLICATION_CREDENTIALS=./path_to_your_service_account.json
GOOGLE_CLOUD_BUCKET=your_gcs_bucket_name
PORT=3001
```

**Note**: Replace `your_mongodb_connection_string`, `path_to_your_service_account.json`, and `your_gcs_bucket_name` with your actual configuration details.

## Running the Application

### Backend

1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

2. **Start the server**:
   ```bash
   yarn start
   ```

   The backend server will run on the port specified in the `.env` file (default is `3001`).

### Frontend

1. **Navigate to the frontend directory**:
   ```bash
   cd frontend
   ```

2. **Start the development server**:
   ```bash
   yarn start
   ```

   The frontend will typically run on port `3000`. Access it by visiting `http://localhost:3000` in your browser.

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a new branch (`git checkout -b feature/YourFeature`).
3. Commit your changes (`git commit -m 'Add YourFeature'`).
4. Push to the branch (`git push origin feature/YourFeature`).
5. Open a Pull Request.

## License

This project is licensed under the [MIT License](LICENSE).