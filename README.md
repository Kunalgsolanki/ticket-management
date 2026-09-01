# Ticket Management System

A full-stack ticket management application with role-based access, live updates, and a clean dashboard for both admins and users.

## Overview

This project contains:

- A Node.js/Express backend with Prisma ORM and MySQL
- A real-time Socket.IO layer for ticket updates
- A Next.js frontend with separate admin and user dashboards
- JWT-based authentication and role-based flows

## Project Structure

```text
Ticket Management/
├── Backend/
│   ├── app.js
│   ├── .env.example
│   ├── package.json
│   ├── controllers/
│   │   ├── ticketController.js
│   │   └── userController.js
│   ├── middleware/
│   │   └── auth.js
│   ├── prisma/
│   │   ├── client.js
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── routes/
│   │   ├── ticket.js
│   │   └── user.js
│   ├── sockets/
│   │   └── ticketSocket.js
│   └── generated/
│       └── prisma/
├── Frontend/
│   └── ticket-management/
│       ├── app/
│       ├── components/
│       ├── lib/
│       ├── public/
│       ├── package.json
│       └── README.md
└── README.md
```

## Features

### User features
- Sign up and login
- Create tickets with title, description, priority, and assignee
- View tickets created by the user
- View tickets assigned to the user
- Update ticket status when assigned to them

### Admin features
- View all system tickets in one dashboard
- Search and filter tickets by status and priority
- Assign tickets to team members
- Update status and priority
- Delete tickets
- View team member activity and ticket metrics

### Real-time behavior
- All ticket changes are pushed to connected clients using Socket.IO
- Admin and user dashboards refresh automatically when tickets change
- Toast notifications appear for ticket creation, update, and deletion

## Tech Stack

### Backend
- Node.js
- Express.js
- Prisma ORM
- MySQL
- JWT Authentication
- Socket.IO

### Frontend
- Next.js
- React
- TypeScript
- Tailwind CSS-style utility classes
- Socket.IO client

## Environment Setup

### 1) Backend environment
Create a `.env` file inside the `Backend` folder based on the example file:

```bash
cd Backend
copy .env.example .env
```

Example:

```env
DATABASE_URL="mysql://username:password@localhost:3306/ticket_management"
PORT=3000
JWT_SECRET="your_super_secret_key"
```

> The app uses Prisma with MySQL, so a MySQL database must be running before migrations.

### 2) Frontend environment
Create a `.env.local` file in `Frontend/ticket-management` if needed:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Developer Setup After Clone

Follow these steps after cloning the project on a new machine.

### 1) Install dependencies

```bash
git clone <repo-url>
cd "Ticket Management"

cd Backend
npm install

cd ../Frontend/ticket-management
npm install
```

### 2) Set up environment variables

Create the backend environment file:

```bash
cd ../Backend
copy .env.example .env
```

Then update `.env` with your local database settings:

```env
DATABASE_URL="mysql://username:password@localhost:3306/ticket_management"
PORT=3000
JWT_SECRET="your_super_secret_key"
```

Create the frontend environment file:

```bash
cd ../Frontend/ticket-management
copy NUL .env.local
```

Then add:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### 3) Prepare the database

Make sure MySQL is running locally, then create the database if needed.

```bash
cd Backend
npx prisma generate
npx prisma migrate dev --name init
```

If Prisma says the database does not exist, create it in MySQL first, then run the migration again.

### 4) Run the app

Start the backend:

```bash
cd Backend
npm start
```

Start the frontend in a second terminal:

```bash
cd Frontend/ticket-management
npm run dev
```

### 5) Access the app

- Frontend: http://localhost:3000
- Backend API: http://localhost:3000

> The frontend and backend are on the same default port in this setup. If you change backend port, update `NEXT_PUBLIC_API_URL` in the frontend `.env.local` file.

### Common setup issues

- `Prisma Client Error` or missing generated client: run `npx prisma generate`
- `Can't reach database`: verify MySQL is running and `DATABASE_URL` is correct
- CORS issues: ensure the backend has access-control settings enabled and the frontend URL matches the API base
- Socket not updating: confirm both apps are running and the frontend is connected to the backend WebSocket server

## Installation

### Backend
```bash
cd Backend
npm install
npx prisma generate
npx prisma migrate dev --name init
npm start
```

The backend runs on:

```text
http://localhost:3000
```

### Frontend
```bash
cd Frontend/ticket-management
npm install
npm run dev
```

The frontend runs on:

```text
http://localhost:3000
```

> If the backend uses port 3000, ensure the frontend API base URL matches it or adjust `NEXT_PUBLIC_API_URL`.

## Authentication and Roles

The system supports two roles:

- `USER`
- `ADMIN`

User flows:
- Login or sign up through the UI
- Create tickets and manage assigned tasks

Admin flows:
- Manage tickets across the full system
- Assign tickets to users
- Monitor ticket status and urgency

## API Overview

### User routes
- `POST /user/signup`
- `POST /user/login`
- `GET /user`
- `GET /user/:id`
- `PATCH /user/:id`
- `DELETE /user/:id`

### Ticket routes
- `POST /ticket`
- `GET /ticket`
- `GET /ticket/:id`
- `PATCH /ticket/:id`
- `DELETE /ticket/:id`
- `GET /ticket/user/:userId/created`
- `GET /ticket/user/:userId/assigned`

## Database Model

The Prisma schema includes:

- `User`
  - id
  - name
  - email
  - password
  - role
  - createdAt
  - updatedAt

- `Ticket`
  - id
  - title
  - description
  - status
  - priority
  - createdById
  - assignedToId
  - createdAt
  - updatedAt

Enums include:
- `UserRole`: `USER`, `ADMIN`
- `TicketStatus`: `OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`
- `TicketPriority`: `LOW`, `MEDIUM`, `HIGH`, `URGENT`

## Real-time Events

The Socket.IO server exposes ticket-related events:

- `ticket:fetch_all`
- `ticket:fetch_one`
- `ticket:create`
- `ticket:update`
- `ticket:delete`
- `ticket:created`
- `ticket:updated`
- `ticket:deleted`

## Notes

- The backend is configured with CORS for frontend access.
- The app uses a dark dashboard layout and a live ticket monitoring workflow.
- This is a practical ticketing system built for internal team use and supports real-time collaboration.

## Run Checklist

1. Start MySQL database.
2. Configure `Backend/.env`.
3. Run Prisma migration.
4. Start backend.
5. Start frontend.
6. Create admin/user accounts via the UI.
7. Begin creating and managing tickets.

## License

This project is currently unlicensed unless you add a license file for distribution or deployment.
