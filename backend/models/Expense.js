const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 100 },
  amount: { type: Number, required: true, min: [0.01, 'Amount must be greater than zero'] },
  category: { type: String, required: true, enum: ['Food', 'Travel', 'Bills', 'Shopping', 'Other'] },
  date: { type: Date, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Expense', expenseSchema);
