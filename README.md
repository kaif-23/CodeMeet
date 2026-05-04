## Key Points

[CodeMeet](#codemeet) is an advanced collaborative platform designed for real-time synchronization and editing of code across multiple users. Built with WebRTC and WebSockets, it combines the power of real-time communication with efficient code collaboration tools. The platform aims to enhance team productivity by providing an interactive environment where participants can code, debug, and execute programs simultaneously while staying in sync.


- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [How To Run](#how-to-run)
- [Use Cases](#use-cases)

## CodeMeet

CodeMeet is an advanced collaborative platform designed for real-time synchronization and editing of code across multiple users. Built with WebRTC and WebSockets, it combines the power of real-time communication with efficient code collaboration tools. The platform aims to enhance team productivity by providing an interactive environment where participants can code, debug, and execute programs simultaneously while staying in sync.

## Key Features

- **Real-Time Code Collaboration:** Seamlessly write, edit, and share code in real-time with full synchronization across users.
- **Integrated Code Execution:** Run your code directly within the platform with real-time feedback for instant debugging.
- **Video Conferencing with Screen Sharing:** Built-in WebRTC-based video calling and screen sharing to enhance team communication.
- **Syntax Highlighting and Language Support:** Optimized editor with support for multiple programming languages and syntax highlighting.
- **User-Friendly Interface:** Intuitive design with tools for effortless navigation and collaboration.

## Technology Stack

- **Frontend:** React.js with CodeMirror for code editing.
- **Backend:** Node.js with Express.js, integrated WebSocket server for real-time communication.
- **WebRTC:** Peer-to-peer connection for video calling and screen sharing.
- **Code Editor:** CodeMirror
- **Compiler:** [JDoodle API](https://www.jdoodle.com/compiler-api)
   - **Backend Proxy:** `/api/execute` (handled by the Express server)
   - **Required Env:** `JDOODLE_CLIENT_ID`, `JDOODLE_CLIENT_SECRET`, `JDOODLE_URL` (defaults to `https://api.jdoodle.com/v1/execute`)

## How To Run

**Note:** You must have Node.js installed on your device.

1. Clone the repository:
   ```bash
   git clone https://github.com/kaif-23/CodeMeet.git
   ```

2. Configure environment variables in `backend/.env`:
   ```bash
   JDOODLE_CLIENT_ID=your_id
   JDOODLE_CLIENT_SECRET=your_secret
   JDOODLE_URL=https://api.jdoodle.com/v1/execute
   ```

3. Navigate to the backend folder and install dependencies:
   ```bash
   cd backend
   npm i
   npm start
   ```

4. Navigate to the client folder and install dependencies:
   ```bash
   cd client
   npm i
   npm run dev
   ```

