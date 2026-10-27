require('dotenv').config();
require('dotenv').config({ path: '.env.local', override: true });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const Expense = require('./models/Expense');
const User = require('./models/User');

const app = express();
const COOKIE_NAME = 'expense_session';
const SESSION_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const allowedOrigins = new Set([
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  ...(process.env.CLIENT_URL || '').split(',').map(value => value.trim()).filter(Boolean)
]);

app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    return callback(new Error('Origin is not allowed'));
  },
  credentials: true
}));
app.use(express.json({ limit: '20kb' }));
app.use(cookieParser());

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 12, standardHeaders: 'draft-7', legacyHeaders: false });
const validId = id => mongoose.isValidObjectId(id);
const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge: SESSION_AGE_MS
});

function createSession(user, res) {
  const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.cookie(COOKIE_NAME, token, cookieOptions());
}

function requireAuth(req, res, next) {
  const token = req.cookies[COOKIE_NAME];
  if (!token) return res.status(401).json({ message: 'Please sign in to continue.' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.sub;
    next();
  } catch (_error) {
    res.clearCookie(COOKIE_NAME, cookieOptions());
    return res.status(401).json({ message: 'Your session expired. Please sign in again.' });
  }
}

const validateExpense = body => {
  const { title, amount, category, date } = body;
  if (typeof title !== 'string' || !title.trim()) return 'Title is required';
  if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) return 'Amount must be greater than zero';
  if (!['Food', 'Travel', 'Bills', 'Shopping', 'Other'].includes(category)) return 'Choose a valid category';
  if (!date || Number.isNaN(Date.parse(date))) return 'Choose a valid date';
  return null;
};

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.post('/api/auth/register', authLimiter, async (req, res) => {
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return res.status(400).json({ message: 'Enter a valid email address.' });
  }
  if (password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) {
    return res.status(400).json({ message: 'Use a password between 8 and 72 bytes.' });
  }
  try {
    const existing = await User.findOne({ email }).lean();
    if (existing) return res.status(409).json({ message: 'An account with that email already exists.' });
    const user = await User.create({ email, passwordHash: await bcrypt.hash(password, 12) });
    createSession(user, res);
    return res.status(201).json({ user: { id: user.id, email: user.email } });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'An account with that email already exists.' });
    return res.status(500).json({ message: 'Could not create your account.' });
  }
});

app.post('/api/auth/login', authLimiter, async (req, res) => {
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  try {
    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user || !await bcrypt.compare(password, user.passwordHash)) {
      return res.status(401).json({ message: 'Email or password is incorrect.' });
    }
    createSession(user, res);
    return res.json({ user: { id: user.id, email: user.email } });
  } catch (_error) {
    return res.status(500).json({ message: 'Could not sign in. Try again shortly.' });
  }
});

app.post('/api/auth/logout', (_req, res) => {
  res.clearCookie(COOKIE_NAME, cookieOptions());
  res.json({ message: 'Signed out.' });
});

app.get('/api/auth/me', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('email').lean();
    if (!user) return res.status(401).json({ message: 'Please sign in to continue.' });
    return res.json({ user: { id: req.userId, email: user.email } });
  } catch (_error) {
    return res.status(500).json({ message: 'Could not load your account.' });
  }
});

app.use('/api/expenses', requireAuth);
app.get('/api/expenses', async (req, res) => {
  try { res.json(await Expense.find({ userId: req.userId }).sort({ date: -1, createdAt: -1 })); }
  catch (_error) { res.status(500).json({ message: 'Could not load expenses.' }); }
});
app.post('/api/expenses', async (req, res) => {
  const issue = validateExpense(req.body);
  if (issue) return res.status(400).json({ message: issue });
  try {
    const expense = await Expense.create({ ...req.body, userId: req.userId, title: req.body.title.trim(), amount: Number(req.body.amount) });
    res.status(201).json(expense);
  } catch (_error) { res.status(500).json({ message: 'Could not save expense.' }); }
});
app.put('/api/expenses/:id', async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ message: 'Invalid expense id.' });
  const issue = validateExpense(req.body);
  if (issue) return res.status(400).json({ message: issue });
  try {
    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { ...req.body, title: req.body.title.trim(), amount: Number(req.body.amount) },
      { new: true, runValidators: true }
    );
    if (!expense) return res.status(404).json({ message: 'Expense not found.' });
    res.json(expense);
  } catch (_error) { res.status(500).json({ message: 'Could not update expense.' }); }
});
app.delete('/api/expenses/:id', async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ message: 'Invalid expense id.' });
  try {
    const expense = await Expense.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!expense) return res.status(404).json({ message: 'Expense not found.' });
    res.json({ message: 'Expense deleted.' });
  } catch (_error) { res.status(500).json({ message: 'Could not delete expense.' }); }
});

const port = process.env.PORT || 5000;
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error('JWT_SECRET must be set to a random value of at least 32 characters.');
  process.exit(1);
}
mongoose.connect(process.env.MONGODB_URI)
  .then(() => app.listen(port, () => console.log(`Expense API listening on ${port}`)))
  .catch(error => { console.error('MongoDB connection failed:', error.message); process.exit(1); });
