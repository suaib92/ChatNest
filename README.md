# Chat Application

## Overview

This chat application allows users to send text messages, upload files, and view message previews. It includes real-time updates via WebSocket, user authentication, and a responsive layout. The application is built with the MERN stack (MongoDB, Express, React, Node.js) and uses WebSockets for real-time communication.

## Features

- Real-time messaging with WebSocket support.
- File uploads including images, videos, documents, and links.
- Responsive design with Tailwind CSS.
- User authentication (login and registration).
- Sidebar for online/offline user status.
- Message preview for various file types (images, videos, documents, and links).

## Installation

### Prerequisites

- Node.js (v14 or higher)
- MongoDB

### Backend Setup

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd <repository-directory>
   ```

2. Install dependencies:

   ```bash
   cd backend
   npm install
   ```

3. Create a `.env` file in the `backend` directory with the following content:

   ```env
   MONGO_URL=<your-mongodb-url>
   JWT_SECRET=<your-jwt-secret>
   ```

4. Start the backend server:

   ```bash
   npm start
   ```

### Frontend Setup

1. Navigate to the frontend directory:

   ```bash
   cd frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the frontend application:

   ```bash
   npm run dev
   ```

## Usage

1. Open the application in your browser at `http://localhost:5173`.
2. Register a new account or log in with an existing account.
3. Select a user from the sidebar to start a chat.
4. Use the input field to send text messages or upload files.
5. The sidebar shows online and offline users with real-time updates.

## API Endpoints

### Authentication

- `POST /login`: Log in with username and password.
- `POST /register`: Register a new user with username and password.
- `POST /logout`: Log out the current user.

### User

- `GET /profile`: Get profile information for the logged-in user.
- `GET /people`: Get a list of all users.

### Messages

- `GET /messages/:userId`: Get messages between the logged-in user and another user.
- `POST /upload`: Upload a file.

## WebSocket

- `ws://localhost:4040`: WebSocket server for real-time messaging and online status updates.

## Contributing

1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Make your changes and ensure they are well-tested.
4. Submit a pull request with a clear description of the changes.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

