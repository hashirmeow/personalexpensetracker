require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const Expense = require('./models/Expense');

const app = express();
app.use(cors());
app.use(express.json());

const validId = id => mongoose.isValidObjectId(id);
const validate = body => {
  const { title, amount, category, date } = body;
  if (typeof title !== 'string' || !title.trim()) return 'Title is required';
  if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) return 'Amount must be greater than zero';
  if (!['Food', 'Travel', 'Bills', 'Shopping', 'Other'].includes(category)) return 'Choose a valid category';
  if (!date || Number.isNaN(Date.parse(date))) return 'Choose a valid date';
  return null;
};

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.get('/api/expenses', async (_req, res) => {
  try { res.json(await Expense.find().sort({ date: -1, createdAt: -1 })); }
  catch (err) { res.status(500).json({ message: 'Could not load expenses' }); }
});
app.post('/api/expenses', async (req, res) => {
  const issue = validate(req.body);
  if (issue) return res.status(400).json({ message: issue });
  try {
    const expense = await Expense.create({ ...req.body, title: req.body.title.trim(), amount: Number(req.body.amount) });
    res.status(201).json(expense);
  } catch (err) { res.status(500).json({ message: 'Could not save expense' }); }
});
app.put('/api/expenses/:id', async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ message: 'Invalid expense id' });
  const issue = validate(req.body);
  if (issue) return res.status(400).json({ message: issue });
  try {
    const expense = await Expense.findByIdAndUpdate(req.params.id, { ...req.body, title: req.body.title.trim(), amount: Number(req.body.amount) }, { new: true, runValidators: true });
    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    res.json(expense);
  } catch (err) { res.status(500).json({ message: 'Could not update expense' }); }
});
app.delete('/api/expenses/:id', async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ message: 'Invalid expense id' });
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);
    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    res.json({ message: 'Expense deleted' });
  } catch (err) { res.status(500).json({ message: 'Could not delete expense' }); }
});

const port = process.env.PORT || 5000;
mongoose.connect(process.env.MONGODB_URI)
  .then(() => app.listen(port, () => console.log(`Expense API listening on ${port}`)))
  .catch(err => { console.error('MongoDB connection failed:', err.message); process.exit(1); });
