# Personal Expense Tracker

MERN application for private expense tracking, with account creation and sign-in.

## Run locally

1. Install Node.js 18+ and make a MongoDB Atlas database.
2. `backend/.env` is included with this project's Atlas connection and JWT configuration. For a different local database, put overrides in `backend/.env.local`; it is ignored by Git and loaded after `.env`.
3. In `backend`, run `npm install` then `npm run dev`.
4. In `frontend`, run `npm install` then `npm run dev`.
5. Open the Vite URL shown in the terminal (normally http://localhost:5173).

The backend stores a bcrypt hash for each password and issues an HTTP-only session cookie. Each account sees only its own expenses. Create an account from the sign-in page, then sign in with that email and password. The tracked `.env` is for this test project; use private local environment overrides for other environments.

## Local Lemon Milk font

The dashboard uses Lemon Milk by Marsnev. The font files are not included in this repository. For local use, download the font from [DaFont](https://www.dafont.com/lemon-milk.font) and place the Light, Regular, Medium, and Bold OTF files in `frontend/public/fonts/` using their original filenames. The project ignores these font files to avoid redistributing them. The author identifies the DaFont version as free for educational use; other uses may require a donation or license.
