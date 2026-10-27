import React, { useEffect, useMemo, useState } from 'react';
import { Check, Plus, Search, Trash2, X } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/expenses';
const categories = ['Food', 'Travel', 'Bills', 'Shopping', 'Other'];
const today = new Date().toISOString().slice(0, 10);
const money = value => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0);
const prettyDate = value => new Date(`${String(value).slice(0, 10)}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

function SignInPage({ onReturn }) {
  const [message, setMessage] = useState('');
  function submit(event) {
    event.preventDefault();
    setMessage('ACCOUNT SIGN-IN IS NOT CONNECTED YET. YOU CAN CONTINUE TO THE EXPENSE LEDGER.');
  }
  return <div className="ledger-app signin-app">
    <header className="ledger-masthead signin-masthead"><a className="ledger-brand" href="/" onClick={onReturn}><span className="brand-dragon"><img src="/images/dragon.png" alt="" /></span><span>RED DRAGON <i>/</i> LEDGER</span></a><a className="signin-return" href="/" onClick={onReturn}>BACK TO THE LEDGER <span>↗</span></a></header>
    <main className="signin-layout">
      <section className="signin-art"><span className="lead-kicker"><i /> PERSONAL FINANCE / A QUIETER VIEW</span><h1>Track it.<br /><em>Understand it.</em></h1><p>Return to your personal ledger and keep the details that matter close at hand.</p><div className="signin-art-image"><img src="/images/ink-landscape.jpg" alt="Quiet ink wash landscape" /></div><img className="signin-dragon" src="/images/dragon.png" alt="" /></section>
      <section className="signin-panel"><div className="article-index">MEMBER ACCESS <span>·</span> PERSONAL LEDGER</div><h2>Welcome back.</h2><p className="signin-intro">Enter your details to continue.</p><form className="signin-form" onSubmit={submit}><label className="ed-field">EMAIL ADDRESS<input type="email" placeholder="you@example.com" autoComplete="email" required /></label><label className="ed-field">PASSWORD<input type="password" placeholder="Enter your password" autoComplete="current-password" required /></label><button className="ed-primary signin-submit" type="submit">SIGN IN <span>↗</span></button></form>{message && <p className="signin-message" role="status">{message}</p>}<div className="signin-note"><span>NEW TO THE LEDGER?</span><a href="/" onClick={onReturn}>CONTINUE TO YOUR EXPENSES</a></div><p className="signin-demo-note">ACCOUNT AUTHENTICATION IS NOT CONFIGURED IN THIS PROJECT.</p></section>
    </main>
  </div>;
}

export default function App() {
  const [page, setPage] = useState(window.location.pathname === '/signin' ? 'signin' : 'ledger');
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
  useEffect(() => { if (page === 'ledger') load(); }, [page]);
  useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(null), 3600); return () => clearTimeout(timer); }, [notice]);
  useEffect(() => {
    const syncPage = () => setPage(window.location.pathname === '/signin' ? 'signin' : 'ledger');
    window.addEventListener('popstate', syncPage);
    return () => window.removeEventListener('popstate', syncPage);
  }, []);

  const total = useMemo(() => expenses.reduce((sum, item) => sum + Number(item.amount), 0), [expenses]);
  const now = new Date();
  const monthExpenses = expenses.filter(item => { const date = new Date(item.date); return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear(); });
  const currentMonth = monthExpenses.reduce((sum, item) => sum + Number(item.amount), 0);
  const visible = useMemo(() => expenses.filter(item => (filter === 'All' || item.category === filter) && item.title.toLowerCase().includes(query.toLowerCase())), [expenses, filter, query]);
  const categoryTotals = categories.map(category => ({ category, amount: expenses.filter(item => item.category === category).reduce((sum, item) => sum + Number(item.amount), 0) }));
  const topCategory = [...categoryTotals].sort((a, b) => b.amount - a.amount)[0];
  const recent = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
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
  function edit(item) {
    setEditing(item._id);
    setForm({ title: item.title, amount: item.amount, category: item.category, date: String(item.date).slice(0, 10) });
    document.getElementById('expense-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  async function remove(item) {
    if (!window.confirm(`Delete “${item.title}”? This cannot be undone.`)) return;
    try {
      const response = await fetch(`${API}/${item._id}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Could not delete expense');
      await load(); setNotice({ type: 'success', text: 'Expense deleted.' });
    } catch (error) { setNotice({ type: 'error', text: error.message }); }
  }

  function navigate(path, nextPage) {
    return event => { event.preventDefault(); window.history.pushState({}, '', path); setPage(nextPage); window.scrollTo(0, 0); };
  }
  if (page === 'signin') return <SignInPage onReturn={navigate('/', 'ledger')} />;

  return <div className="ledger-app" id="top">
    <header className="ledger-masthead">
      <a className="ledger-brand" href="#top"><span className="brand-dragon"><img src="/images/dragon.png" alt="" /></span><span>RED DRAGON <i>/</i> LEDGER</span></a>
      <div className="masthead-account"><span className="account-avatar">JD</span><span><b>Jordan Davis</b><small>Personal account</small></span></div>
      <div className="masthead-actions"><span className="issue-date">PERSONAL FINANCE JOURNAL · 2026</span><button className="ed-primary" onClick={() => document.getElementById('expense-title')?.focus()}><Plus size={16} /> New expense</button></div>
    </header>

    <div className="ledger-layout">
      <main className="ledger-sheet">
        <nav className="sheet-nav"><a href="#overview">SPENDWISE <span>FINANCIAL JOURNAL</span></a><div><a className="selected" href="#overview">Overview</a><a href="#expense-form">Add entry</a><a href="#expenses">Ledger</a><a href="/signin" onClick={navigate('/signin', 'signin')}>Sign in</a></div><small>VOL. 01 — OCT ’26</small></nav>
        {notice && <div className={`notice ${notice.type} editorial-notice`} role="status">{notice.text}<button onClick={() => setNotice(null)} aria-label="Dismiss"><X size={15} /></button></div>}

        <section className="lead-panel" id="overview">
          <span className="lead-kicker"><i /> PERSONAL LEDGER / MONTHLY REVIEW</span>
          <h1>Every expense<br /><em>leaves a trace.</em></h1>
          <p>A thoughtful record of the small things that shape the bigger picture. Add a note, see the pattern, stay in control.</p>
          <div className="lead-bottom"><span>YOUR MONEY, IN CLEAR VIEW</span><span>UPDATED {now.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }).toUpperCase()}</span></div>
          <img className="lead-watermark" src="/images/dragon.png" alt="" aria-hidden="true" />
        </section>

        <figure className="ledger-feature"><img src="/images/ink-landscape.jpg" alt="Ink wash landscape with distant mountains and a quiet lakeside" /><figcaption><span>01 / A CLEARER VIEW</span><strong>Good habits begin with noticing.</strong><span>YOUR PERSONAL MONEY JOURNAL</span></figcaption></figure>

        <section className="ledger-stats" aria-label="Spending summary">
          <article><span>01 — TOTAL SPENT</span><strong>{money(total)}</strong><small>Across {expenses.length} recorded {expenses.length === 1 ? 'expense' : 'expenses'}</small></article>
          <article><span>02 — THIS MONTH</span><strong>{money(currentMonth)}</strong><small>{monthExpenses.length} {monthExpenses.length === 1 ? 'entry' : 'entries'} in {now.toLocaleDateString('en-US', { month: 'long' })}</small></article>
          <article><span>03 — DAILY PACE</span><strong>{money(currentMonth / Math.max(1, now.getDate()))}</strong><small>Average spend per day this month</small></article>
        </section>

        <section className="editorial-workspace">
          <article className="entry-article" id="expense-form">
            <div className="article-index">ENTRY NO. {String(expenses.length + (editing ? 0 : 1)).padStart(2, '0')} <span>·</span> {editing ? 'EDIT RECORD' : 'NEW RECORD'}</div>
            <div className="entry-heading"><div><h2>{editing ? 'Revise this entry.' : 'Make a note of it.'}</h2><p>Every detail helps tell the full story.</p></div>{editing && <button className="ed-cancel" onClick={reset}>Cancel <X size={13} /></button>}</div>
            <form className="ed-form" onSubmit={submit}>
              <label className="ed-field ed-wide">Expense title<input id="expense-title" placeholder="e.g. Saturday market" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} maxLength="100" required /></label>
              <label className="ed-field">Amount<div className="ed-amount"><span>$</span><input aria-label="Amount" type="number" min="0.01" step="0.01" placeholder="0.00" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required /></div></label>
              <label className="ed-field">Category<select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>{categories.map(category => <option key={category}>{category}</option>)}</select></label>
              <label className="ed-field ed-wide">Date<input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required /></label>
              <button className="ed-primary ed-submit ed-wide" disabled={saving}>{saving ? 'Saving record…' : editing ? <><Check size={15} /> Save changes</> : <><Plus size={16} /> Save this expense</>}</button>
            </form>
          </article>

          <aside className="category-article">
            <div className="article-index">A SHORT INDEX <span>·</span> SPENDING BY CATEGORY</div>
            <h2>Where it goes.</h2>
            <p className="aside-intro">Your all-time spending, arranged by subject.</p>
            <div className="category-breakdown">{categoryTotals.map(item => <div className="category-line" key={item.category}><span>{item.category}</span><span className="category-line-track"><i style={{ width: total ? `${Math.max(item.amount ? 3 : 0, item.amount / total * 100)}%` : '0%' }} /></span><b>{money(item.amount)}</b></div>)}</div>
            <div className="category-note"><span>LEADING CATEGORY</span><b>{total ? topCategory.category : 'No entries yet'}</b><small>{total ? `${money(topCategory.amount)} recorded so far` : 'Add an expense to reveal a pattern.'}</small></div>
          </aside>
        </section>

        <section className="ledger-section" id="expenses">
          <header className="ledger-section-head"><div><div className="article-index">THE RECORD <span>·</span> {String(expenses.length).padStart(2, '0')} ENTRIES</div><h2>A ledger of the everyday.</h2><p>Each entry, in its place.</p></div><div className="ledger-tools"><label className="ed-search"><Search size={15} /><input placeholder="Find an expense" value={query} onChange={e => setQuery(e.target.value)} /></label><select className="ed-filter" value={filter} onChange={e => setFilter(e.target.value)}><option>All</option>{categories.map(category => <option key={category}>{category}</option>)}</select></div></header>
          <div className="ed-table-wrap"><table className="ed-table"><thead><tr><th>EXPENSE</th><th>SUBJECT</th><th>DATE</th><th>AMOUNT</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>
            {loading ? <tr><td className="ed-empty" colSpan="5">Opening your ledger…</td></tr> : visible.length ? visible.map(item => <tr key={item._id}><td><b>{item.title}</b></td><td><span className="ed-category"><i />{item.category}</span></td><td>{prettyDate(item.date)}</td><td className="ed-money">{money(item.amount)}</td><td><span className="ed-row-actions"><button onClick={() => edit(item)}>Edit</button><button className="ed-delete" onClick={() => remove(item)} aria-label={`Delete ${item.title}`}><Trash2 size={14} /></button></span></td></tr>) : <tr><td className="ed-empty" colSpan="5">{expenses.length ? 'No entries match this search.' : 'Your ledger is waiting for its first entry.'}</td></tr>}
          </tbody></table></div>
          <footer className="ed-table-foot"><span>Showing {visible.length} of {expenses.length} entries</span><button onClick={load}>Refresh record</button></footer>
        </section>
        <footer className="sheet-footer"><span>RED DRAGON LEDGER <i>·</i> KEEP THE SMALL THINGS IN SIGHT</span><span>PERSONAL EDITION / 2026</span></footer>
      </main>

      <aside className="ledger-rail">
        <section className="rail-card rail-quote"><span className="article-index">A NOTE TO SELF</span><blockquote>“A little attention, given often, changes everything.”</blockquote><img className="rail-dragon" src="/images/dragon.png" alt="" aria-hidden="true" /><small>ON KEEPING A RECORD</small></section>
        <section className="rail-card rail-recent"><span className="article-index">THE LATEST <span>·</span> {recent.length} ENTRIES</span><h2>Recent notes.</h2>{recent.length ? <div className="rail-recent-list">{recent.map(item => <div className="rail-recent-item" key={item._id}><span><b>{item.title}</b><small>{item.category} · {prettyDate(item.date)}</small></span><strong>{money(item.amount)}</strong></div>)}</div> : <p className="rail-empty">Recent entries will appear here once you start recording.</p>}<a href="#expenses">View full ledger <span>↗</span></a></section>
        <section className="rail-card rail-month"><span className="article-index">MONTHLY NOTE</span><strong>{now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</strong><p>So far this month</p><b>{money(currentMonth)}</b><div className="rail-rule" /><small>{monthExpenses.length} recorded {monthExpenses.length === 1 ? 'expense' : 'expenses'}</small></section>
      </aside>
    </div>
  </div>;
}
