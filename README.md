# Personal Expense Tracker

MERN application for private expense tracking, with account creation and sign-in.

## Run locally

1. Install Node.js 18+ and make a MongoDB Atlas database.
2. Copy `backend/.env.example` to `backend/.env` and set `MONGODB_URI` to your test database URI. Keep `.env` private; it is ignored by Git.
3. In `backend`, run `npm install` then `npm run dev`.
4. In `frontend`, run `npm install` then `npm run dev`.
5. Open the Vite URL shown in the terminal (normally http://localhost:5173).

The backend stores a bcrypt hash for each password and issues an HTTP-only session cookie. Each account sees only its own expenses. Create an account from the sign-in page, then sign in with that email and password. Never commit real credentials or `JWT_SECRET`; copy `.env.example` for each local environment and generate a fresh random secret.

## Local Lemon Milk font

The dashboard uses Lemon Milk by Marsnev. The font files are not included in this repository. For local use, download the font from [DaFont](https://www.dafont.com/lemon-milk.font) and place the Light, Regular, Medium, and Bold OTF files in `frontend/public/fonts/` using their original filenames. The project ignores these font files to avoid redistributing them. The author identifies the DaFont version as free for educational use; other uses may require a donation or license.
