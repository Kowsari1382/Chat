# 🚀 Real-Time Chat Server

A robust, secure, and highly scalable real-time chat server built with **Node.js** and **Express**. It leverages **Socket.io** for bi-directional, real-time communication and utilizes **MS SQL Server** for reliable and persistent data storage.

## ✨ Features
- 💬 **Real-Time Communication:** Fast, bi-directional messaging powered by Socket.io.
- 🔐 **Secure Authentication:** JWT (JSON Web Tokens) integration for both REST API and WebSocket connections.
- 🛡️ **Enhanced Security:** Protected with `Helmet`, password hashing via `bcrypt`, and strict CORS policies.
- 🚦 **Advanced Rate Limiting:** Protection against brute-force and spam attacks for both HTTP requests and Socket.io events using `rate-limiter-flexible`.
- 🗄️ **Robust Database:** Seamless integration with MS SQL Server for reliable data management.
- 📁 **File Sharing:** Support for file uploads and transfers within the chat using `Multer`.
- 🏗️ **Clean & Modular Architecture:** Standard MVC pattern (controllers, models, routes, middlewares).
- ✅ **Data Validation:** Strict input validation and sanitization using `Joi`.
- 🔑 **Organized Event Handling:** Separated Socket.io event logic (`events.js`) for better maintainability and clean code.

## 🛠️ Tech Stack
| Category | Technology / Library |
| :--- | :--- |
| **Runtime** | Node.js |
| **Framework** | Express.js (v5) |
| **Real-Time** | Socket.io |
| **Database** | MS SQL Server (mssql) |
| **Security** | Helmet, bcrypt, jsonwebtoken, express-rate-limit |
| **Validation** | Joi |
| **File Upload** | Multer |
| **Utilities** | dotenv, lodash, uuid, cors |

## 📂 Project Structure
```text
├── controllers/      # Core business logic and route controllers
├── middlewares/      # Custom middlewares (Auth, Error handling, etc.)
├── models/           # Database models and SQL queries
├── routes/           # REST API route definitions
├── utilities/        # Helper functions and utility tools
├── app.js            # Main entry point and server initialization
├── events.js         # Socket.io event handlers
├── encryption.js     # Encryption and hashing modules
└── .env              # Environment variables (Keep this secret!)
```

## 📋 Prerequisites
Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v14 or higher)
- [MS SQL Server](https://www.microsoft.com/en-us/sql-server/sql-server-downloads)
- `npm` or `yarn`

## ⚙️ Installation & Setup

**1. Clone the repository:**
```bash
git clone https://github.com/Kowsari1382/Chat.git
cd Chat
```

**2. Install dependencies:**
```bash
npm install
```

**3. Configure Environment Variables:**
Create a `.env` file in the root directory and add your configuration:
```env
PORT=3000
SECRET_KEY=your_super_secret_jwt_key

# MS SQL Server Database Configuration
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_SERVER=localhost
DB_DATABASE=ChatDB
```

**4. Start the server:**
```bash
npm start
# or
node app.js
```
The server will start on port `3000` (or the port specified in your `.env` file).

## 🔌 Client Connection (Socket.io)
To connect to the server via Socket.io, you must pass the JWT token (obtained from the REST API) as a query parameter during the connection handshake for authentication:

```javascript
const io = require('socket.io-client');

const socket = io('http://localhost:3000', {
    query: {
        token: 'YOUR_JWT_TOKEN_HERE'
    }
});

socket.on('connect', () => {
    console.log('Successfully connected to the chat server!');
});

socket.on('disconnect', () => {
    console.log('Disconnected from the server.');
});
```

## 🤝 Contributing
Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Contact
**Sajjad Kowsari**
- GitHub: [@Kowsari1382](https://github.com/Kowsari1382)

---
If you found this project helpful, please consider giving it a ⭐️ to show your support!
