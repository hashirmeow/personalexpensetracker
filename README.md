# Personal Expense Tracker

MERN application for recording, editing, and deleting personal expenses.

## Run locally

1. Install Node.js 18+ and make a MongoDB Atlas database.
2. Replace `backend/.env`'s `MONGODB_URI` with your test database URI.
3. In `backend`, run `npm install` then `npm run dev`.
4. In `frontend`, run `npm install` then `npm run dev`.
5. Open the Vite URL shown in the terminal (normally http://localhost:5173).

The frontend calls the Express API at `http://localhost:5000/api/expenses`.
Never commit real credentials. The committed `.env` contains a placeholder only.
