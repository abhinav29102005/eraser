✍️ Eraser - Frontend (V1)
This document outlines the architecture and functionality of the frontend component for Eraser, a collaborative whiteboard application designed to facilitate creative and collaborative endeavors.

This repository hosts the client-side application for Eraser, developed utilizing contemporary web technologies. This inaugural V1 release establishes a robust foundation encompassing user authentication, comprehensive board management, and persistent drawing capabilities, thereby providing the essential groundwork for the subsequent integration of real-time collaboration features in V2.

✨ Features – Version 1 (Frontend)
The initial version of the Eraser frontend incorporates the following fundamental functionalities:

User Authentication:

Provision of a test token for developmental authentication purposes.

Implementation of secure JSON Web Token (JWT) handling for all authenticated API requests.

Management of user sessions, including login and logout procedures.

Display of authenticated user profile details.

Board Management:

An intuitive dashboard interface for displaying all saved collaborative boards.

Integration of a modal dialog for the creation of new boards, including title specification.

Facilitation of navigation to a dedicated canvas view upon selection of a specific board.

Drawing Canvas (React-Konva):

An interactive drawing surface powered by the React-Konva library.

Inclusion of fundamental drawing instruments, such as a pen and an eraser.

Capabilities for canvas panning and dynamic zooming.

Persistent Strokes: Graphical strokes generated on the canvas are automatically saved to the backend upon the completion of a drawing action (mouse up event).

Explicit Data Persistence: A dedicated "Save" control to explicitly commit all current canvas content, effectively replacing any previously stored strokes associated with the board.

Canvas Reset Functionality: A "Clear" control designed to permanently erase all graphical data from a board, necessitating the deletion of corresponding stroke data from the backend.

Automatic loading of previously saved strokes upon accessing a board.

📦 Technologies Employed

React.js: A declarative, component-based JavaScript library extensively utilized for constructing user interfaces.

Vite: A contemporary build tool distinguished by its rapid development server and optimized build processes.

React-Konva: A JavaScript library enabling the rendering of intricate 2D canvas graphics within a React environment.

Konva.js: The foundational 2D canvas framework upon which React-Konva is constructed.

Axios: A promise-based HTTP client instrumental for executing API requests to the backend.

Lucide React: A comprehensive library providing a consistent and aesthetically pleasing set of icons for React applications.

Tailwind CSS: A utility-first CSS framework employed for the expedited development of custom user interface designs.



🚀 Operational Procedures
To initiate and operate the Eraser frontend locally, the following procedural steps are required:


Prerequisites
Node.js (version 18 or higher) and npm must be installed on the host machine.



The Eraser Backend component is required to be operational locally, typically accessible at http://localhost:5000. Detailed setup instructions are available in the Eraser Backend Repository https://github.com/abhinav29102005/eraser-backend.


Installation
Repository Cloning:

git clone https://github.com/abhinav29102005/eraser-frontend.git
cd eraser-frontend

Dependency Installation:

npm install

Environment Variable Configuration:
A .env file must be created in the root directory of the frontend project (eraser-frontend/.env), containing the backend API URL:

VITE_API_URL=http://localhost:5000

Verification of this URL against the operational backend port is essential.

Application Execution
Development Server Initiation:

npm run dev

The application typically becomes accessible in a web browser at http://localhost:5173/.

📂 Project Structure (Frontend)
eraser-frontend/
├── public/
├── src/
│   ├── api/
│   │   └── axiosInstance.js    # Configured Axios instance with interceptors
│   ├── components/
│   │   ├── BoardCanvas.jsx     # Wrapper component for the drawing board view
│   │   ├── KonvaDrawingBoard.jsx # The core React-Konva drawing component
│   │   ├── HomePage.jsx        # The dashboard/board listing user interface
│   │   └── Modal.jsx           # Generic modal component implementation
│   ├── services/
│   │   ├── authService.js      # Functions dedicated to authentication API interactions
│   │   └── boardService.js     # Functions dedicated to board and stroke API interactions
│   ├── App.jsx                 # Primary application component, responsible for routing and state management
│   ├── main.jsx                # React application entry point
│   └── index.css               # Global Cascading Style Sheets (CSS), including Tailwind directives and foundational resets
├── .env                        # Environment variables for local deployment
├── .env.example                # Illustrative example of the .env file structure
├── package.json                # Project dependencies and operational scripts
├── tailwind.config.js          # Tailwind CSS configuration file
└── postcss.config.js           # PostCSS configuration file



🔮 Prospective Enhancements (V2)
The forthcoming major version (V2) of Eraser is projected to integrate real-time collaborative drawing capabilities. This enhancement will necessitate the incorporation of:
Yjs: A robust framework designed for real-time collaborative editing.
WebSockets: For establishing efficient, bidirectional communication channels between client and server components.



🤝 Collaboration Guidelines
Contributions to this project are encouraged. For suggestions or to report identified issues, please submit an issue through the designated https://github.com/MicrosoftStudentChapter/eraser
