# FINDORA — Campus Lost and Found Management System

FINDORA is a web-based campus lost-and-found application built with Node.js, Express, MongoDB, and vanilla HTML, CSS, and JavaScript.

Students can report lost or found items, browse reports, and submit claims. Administrators can review claims and manage the claim approval process.

## Features

- Student registration and login
- JWT-based authentication
- Browse and view lost-and-found reports
- Search and filter reports in the frontend
- Report lost or found items
- Upload an item image (maximum 5 MB)
- View a student's own reports
- Submit and view claims
- Admin-only claim review and approval/rejection
- MongoDB persistence
- Static frontend served by Express

## Technology

- Node.js
- Express
- MongoDB and Mongoose
- HTML, CSS, JavaScript
- JSON Web Tokens
- bcryptjs
- Multer
- dotenv
- CORS

## Project structure

```text
FINDORA_complete_frontend/
├── public/
│   ├── css/
│   ├── js/
│   ├── index.html
│   ├── browse.html
│   ├── item.html
│   ├── report.html
│   ├── login.html
│   ├── register.html
│   ├── dashboard.html
│   └── admin.html
├── src/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   └── routes/
├── uploads/
├── server.js
├── package.json
├── package-lock.json
├── .env.example
└── README.md
```

## Requirements

- Node.js and npm
- A MongoDB database, such as MongoDB Atlas
- Internet access for connecting to a hosted MongoDB database

## Installation

1. Clone or download this repository.
2. Open a terminal in the project directory.
3. Install dependencies:

   ```bash
   npm install
   ```

4. Create your local environment file:

   **Windows PowerShell:**

   ```powershell
   Copy-Item .env.example .env
   ```

5. Edit `.env` and provide your own MongoDB connection string and a strong JWT secret.

   Required variables:

   | Variable | Purpose |
   |---|---|
   | `MONGODB_URI` | MongoDB connection string |
   | `JWT_SECRET` | Secret used to sign authentication tokens |
   | `PORT` | Server port; defaults to 5000 |

6. Start the application:

   ```bash
   npm start
   ```

7. Open:

   http://localhost:5000

The Express server serves the frontend from the `public` directory.

## API endpoints

All API endpoints use the `/api` prefix.

### Authentication

| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |
| GET | `/api/auth/me` | Authenticated |

### Items

| Method | Endpoint | Access |
|---|---|---|
| GET | `/api/items` | Public |
| GET | `/api/items/:id` | Public |
| GET | `/api/items/mine` | Authenticated |
| POST | `/api/items` | Authenticated |
| PATCH | `/api/items/:id` | Authenticated |

Item creation accepts multipart form data. The optional image field is named `image`.

### Claims

| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/claims` | Authenticated |
| GET | `/api/claims` | Authenticated |
| PATCH | `/api/claims/:id/review` | Admin only |

Authenticated endpoints require a valid JWT according to the backend authentication middleware.

## Health check

With the server running, visit:

http://localhost:5000/api/health

A successful response confirms that the API process is responding. Database connectivity is established during server startup.

## Uploads

Uploaded item images are stored in the project's `uploads` directory and served under `/uploads`.

The configured maximum image upload size is 5 MB.

Do not commit uploaded user files to Git.

## Security and configuration

- Never commit `.env`.
- Never publish MongoDB credentials or JWT secrets.
- Use your own environment variables.
- The `.env.example` file contains placeholders only.
- Do not use development credentials in a production deployment.
- Ensure the MongoDB database and administrator account are configured securely before use.

## Development

Run the development server with:

```bash
npm run dev
```

The development command watches the server and backend source files.

## Testing

The project has an API testing collection used during development. See the separately maintained testing evidence for its execution results.

## License

See the repository owner or project submission requirements for licensing information.
