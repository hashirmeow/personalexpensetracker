import React, { useEffect, useMemo, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, CalendarDays, Check, ChevronDown, CircleHelp, Coffee, CreditCard, Ellipsis, LayoutDashboard, Plus, Search, ShoppingBag, TrainFront, Trash2, Wallet, X } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/expenses';
const categories = ['Food', 'Travel', 'Bills', 'Shopping', 'Other'];
const icons = { Food: Coffee, Travel: TrainFront, Bills: CreditCard, Shopping: ShoppingBag, Other: Wallet };
const colors = { Food: 'orange', Travel: 'blue', Bills: 'purple', Shopping: 'green', Other: 'gray' };
const today = new Date().toISOString().slice(0, 10);
const money = value => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0);
const prettyDate = value => new Date(`${String(value).slice(0, 10)}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export default function App() {
  const [expenses, setExpenses] = useState([]);
  const [form, setForm] = useState({ title: '', amount: '', category: 'Food', date: today });
  const [editing, setEditing] = useState(null);
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const response = await fetch(API);
      if (!response.ok) throw new Error('Could not connect to the expense service. Check the backend and database.');
      setExpenses(await response.json());
    } catch (error) { setNotice({ type: 'error', text: error.message }); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(null), 3600); return () => clearTimeout(timer); }, [notice]);

  const total = useMemo(() => expenses.reduce((sum, item) => sum + Number(item.amount), 0), [expenses]);
  const visible = useMemo(() => expenses.filter(item => (filter === 'All' || item.category === filter) && item.title.toLowerCase().includes(query.toLowerCase())), [expenses, filter, query]);
  const currentMonth = useMemo(() => expenses.filter(item => { const d = new Date(item.date); const now = new Date(); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); }).reduce((sum, item) => sum + Number(item.amount), 0), [expenses]);
  const reset = () => { setEditing(null); setForm({ title: '', amount: '', category: 'Food', date: today }); };

  async function submit(event) {
    event.preventDefault();
    const amount = Number(form.amount);
    if (!form.title.trim() || !form.date || !Number.isFinite(amount) || amount <= 0) { setNotice({ type: 'error', text: 'Enter a title, a valid date, and an amount greater than zero.' }); return; }
    setSaving(true);
    try {
      const response = await fetch(editing ? `${API}/${editing}` : API, { method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, title: form.title.trim(), amount }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Could not save expense');
      await load(); reset(); setNotice({ type: 'success', text: editing ? 'Expense updated successfully.' : 'Expense added successfully.' });
    } catch (error) { setNotice({ type: 'error', text: error.message }); }
    finally { setSaving(false); }
  }
  function edit(item) { setEditing(item._id); setForm({ title: item.title, amount: item.amount, category: item.category, date: String(item.date).slice(0, 10) }); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  async function remove(item) {
    if (!window.confirm(`Delete “${item.title}”? This cannot be undone.`)) return;
    try { const response = await fetch(`${API}/${item._id}`, { method: 'DELETE' }); const data = await response.json(); if (!response.ok) throw new Error(data.message || 'Could not delete expense'); await load(); setNotice({ type: 'success', text: 'Expense deleted.' }); }
    catch (error) { setNotice({ type: 'error', text: error.message }); }
  }
  const recent = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 4);

  return <div className="app-shell">
    <aside className="sidebar">
      <a className="brand" href="#top"><span className="brand-mark"><Wallet size={20} strokeWidth={2.4} /></span><span>spendwise<span className="brand-dot">.</span></span></a>
      <div className="workspace"><span className="workspace-avatar">JD</span><span><b>Jordan Davis</b><small>Personal workspace</small></span><ChevronDown size={15} /></div>
      <p className="nav-label">MENU</p>
      <a className="nav-item active" href="#overview"><LayoutDashboard size={18} />Overview</a>
      <a className="nav-item" href="#expenses"><Wallet size={18} />Transactions<span className="nav-count">{expenses.length}</span></a>
      <p className="nav-label category-nav-label">CATEGORIES</p>
      {categories.map(category => { const Icon = icons[category]; return <button className="nav-item category-nav" key={category} onClick={() => { setFilter(category); document.getElementById('expenses').scrollIntoView({ behavior: 'smooth' }); }}><span className={`mini-category ${colors[category]}`}><Icon size={15} /></span>{category}</button>; })}
      <div className="sidebar-bottom"><div className="help-card"><div className="help-icon"><CircleHelp size={17} /></div><b>Need a hand?</b><p>Visit our help center for tips on managing your finances.</p><button onClick={() => setNotice({ type: 'success', text: 'Your finances are looking organized. Keep tracking every day!' })}>Visit help center <ArrowUpRight size={13} /></button></div><div className="profile"><span className="profile-avatar">JD</span><span><b>Jordan Davis</b><small>Free plan</small></span><Ellipsis size={20} /></div></div>
    </aside>

    <main className="main-content" id="top">
      <header className="topbar"><div><span className="crumb">Workspace <span>/</span> <b>Overview</b></span><h1>Good morning, Jordan <span className="wave">✳</span></h1><p>Here’s what’s happening with your money today.</p></div><button className="top-add" onClick={() => document.getElementById('expense-title').focus()}><Plus size={17} /> Add expense</button></header>
      {notice && <div className={`notice ${notice.type}`} role="status">{notice.type === 'success' ? <Check size={17} /> : <CircleHelp size={17} />}{notice.text}<button onClick={() => setNotice(null)} aria-label="Dismiss"><X size={16} /></button></div>}

      <section id="overview" className="summary-grid">
        <article className="summary-card total-card"><div className="summary-head"><span>Total balance spent</span><span className="summary-icon wallet-icon"><Wallet size={18} /></span></div><strong>{money(total)}</strong><div className="summary-foot"><span className="trend"><ArrowUpRight size={14} /> Tracking all time</span><span className="muted">Across {expenses.length} {expenses.length === 1 ? 'expense' : 'expenses'}</span></div><div className="sparkline" aria-hidden="true"><svg viewBox="0 0 400 45" preserveAspectRatio="none"><path d="M0 35 C25 34 34 25 55 28 S83 39 104 27 S137 24 151 29 S177 31 198 18 S229 23 246 19 S275 9 292 15 S326 5 344 13 S372 16 400 4" fill="none" stroke="currentColor" strokeWidth="2.5" /></svg></div></article>
        <article className="summary-card"><div className="summary-head"><span>This month</span><span className="summary-icon purple-icon"><CalendarDays size={18} /></span></div><strong>{money(currentMonth)}</strong><div className="summary-foot"><span className="muted">Your spending this month</span></div><div className="progress-track"><span style={{ width: total ? `${Math.max(5, Math.min(100, currentMonth / total * 100))}%` : '0%' }} /></div><small className="progress-label">Current month <b>{expenses.filter(item => new Date(item.date).getMonth() === new Date().getMonth()).length} transactions</b></small></article>
        <article className="summary-card"><div className="summary-head"><span>Daily average</span><span className="summary-icon green-icon"><ArrowDownLeft size={18} /></span></div><strong>{money(currentMonth / Math.max(1, new Date().getDate()))}</strong><div className="summary-foot"><span className="muted">Based on this month’s spend</span></div><div className="average-note"><span className="average-dots"><i /><i /><i /><i /><i /><i /><i /></span><span>Daily pace</span></div></article>
      </section>

      <section className="middle-grid"><article className="panel form-panel"><div className="panel-heading"><div><h2>{editing ? 'Edit expense' : 'Add an expense'}</h2><p>{editing ? 'Update the details below.' : 'Keep track of where your money goes.'}</p></div>{editing && <button className="cancel-edit" onClick={reset}>Cancel</button>}</div>
        <form onSubmit={submit} className="expense-form"><label className="field full-field">Expense name<input id="expense-title" placeholder="e.g. Weekly groceries" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} maxLength="100" required /></label>
          <label className="field">Amount<div className="amount-input"><span>$</span><input aria-label="Amount" type="number" min="0.01" step="0.01" placeholder="0.00" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required /></div></label>
          <label className="field">Category<select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>{categories.map(c => <option key={c}>{c}</option>)}</select></label>
          <label className="field full-field">Date<input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required /></label>
          <button className="submit-button full-field" disabled={saving}>{saving ? 'Saving…' : editing ? <><Check size={16} /> Save changes</> : <><Plus size={17} /> Add expense</>}</button>
        </form></article>
        <article className="panel recent-panel"><div className="panel-heading"><div><h2>Recent activity</h2><p>Your latest transactions at a glance.</p></div><button className="text-link" onClick={() => { setFilter('All'); document.getElementById('expenses').scrollIntoView({ behavior: 'smooth' }); }}>View all <ArrowUpRight size={14} /></button></div>
          {recent.length ? <div className="recent-list">{recent.map(item => { const Icon = icons[item.category] || Wallet; return <div className="recent-item" key={item._id}><span className={`category-icon ${colors[item.category]}`}><Icon size={17} /></span><span className="recent-info"><b>{item.title}</b><small>{item.category} <i>·</i> {prettyDate(item.date)}</small></span><strong>{money(item.amount)}</strong></div>; })}</div> : <div className="recent-empty"><span className="empty-icon"><Wallet size={19} /></span><b>No activity yet</b><span>Your latest expenses will show up here.</span></div>}
        </article></section>

      <section id="expenses" className="panel transactions-panel"><div className="transactions-head"><div><h2>All expenses <span>{expenses.length}</span></h2><p>A complete overview of your spending.</p></div><div className="table-actions"><label className="search-box"><Search size={16} /><input placeholder="Search expenses..." value={query} onChange={e => setQuery(e.target.value)} /></label><select className="filter-select" value={filter} onChange={e => setFilter(e.target.value)}><option>All</option>{categories.map(c => <option key={c}>{c}</option>)}</select></div></div>
        <div className="table-wrap"><table><thead><tr><th>EXPENSE</th><th>CATEGORY</th><th>DATE</th><th>AMOUNT</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{loading ? <tr><td className="table-empty" colSpan="5">Loading your expenses…</td></tr> : visible.length ? visible.map(item => { const Icon = icons[item.category] || Wallet; return <tr key={item._id}><td><span className="expense-cell"><span className={`category-icon small ${colors[item.category]}`}><Icon size={15} /></span><b>{item.title}</b></span></td><td><span className={`category-pill ${colors[item.category]}`}><i />{item.category}</span></td><td className="date-cell">{prettyDate(item.date)}</td><td className="amount-cell">{money(item.amount)}</td><td><span className="row-actions"><button onClick={() => edit(item)} aria-label={`Edit ${item.title}`}>Edit</button><button className="delete-action" onClick={() => remove(item)} aria-label={`Delete ${item.title}`}><Trash2 size={15} /></button></span></td></tr>; }) : <tr><td className="table-empty" colSpan="5">{expenses.length ? 'No expenses match your search.' : 'No expenses yet. Add your first one above.'}</td></tr>}</tbody></table></div>
        <div className="table-footer"><span>Showing <b>{visible.length}</b> of <b>{expenses.length}</b> expenses</span><button onClick={load}>Refresh list</button></div>
      </section><footer className="page-footer"><span>Made for mindful spending <span>♥</span></span><span>Spendwise <i>·</i> 2025</span></footer>
    </main>
  </div>;
}
