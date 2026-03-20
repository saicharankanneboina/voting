# SmartVote - Online Voting System

SmartVote is a full-stack online voting system built with Node.js, Express, MongoDB, JWT authentication, and a responsive vanilla HTML/CSS/JavaScript frontend.

## Project Structure

```text
smartvote-online-voting-system/
├── backend/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── seed.js
│   └── server.js
├── frontend/
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── App.js
│   ├── App.jsx
│   ├── admin-dashboard.html
│   ├── elections.html
│   ├── index.html
│   └── styles.css
├── .env.example
└── package.json
```

## Features

- JWT authentication with role validation
- Admin and voter login using the same modal
- bcrypt password hashing
- Role-based route protection
- One user can vote only once per election
- Admin dashboard for election, candidate, and voter management
- Candidate profiles with party information
- Ended-election-only results visibility
- Responsive SaaS-style interface

## Environment Variables

Create a `.env` file in the project root:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/smartvote
JWT_SECRET=replace_with_a_long_random_secret
```

## Run Locally

1. Install dependencies:

```bash
npm install
```

2. Ensure MongoDB is running locally.

3. Seed sample data:

```bash
npm run seed
```

4. Start the development server:

```bash
npm run dev
```

5. Open:

- `http://localhost:5000/`
- `http://localhost:5000/elections`
- `http://localhost:5000/admin-dashboard`

## Sample Accounts

- Admin: `admin@smartvote.com` / `Admin@123`
- Verified voter: `voter@smartvote.com` / `Voter@123`
- Pending voter: `pending@smartvote.com` / `Voter@123`

## Main API Endpoints

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`

### Elections

- `GET /api/elections`
- `GET /api/elections/:electionId/candidates`
- `GET /api/elections/:electionId/results`
- `POST /api/elections/vote`

### Admin

- `GET /api/admin/stats`
- `POST /api/admin/elections`
- `PUT /api/admin/elections/:electionId`
- `POST /api/admin/candidates`
- `GET /api/admin/voters`
- `PATCH /api/admin/voters/:userId/verify`
