import { useCallback, useEffect, useMemo, useState } from 'react';
import { categoryApi, expenseApi } from '../api';
import { useAuth } from '../context/AuthContext';
import ExpenseForm from '../components/ExpenseForm';
import { formatDate, formatINR } from '../utils/format';

export default function Transactions() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [catFilter, setCatFilter] = useState('all');
  const [editor, setEditor] = useState(null); // null | { initial?: item }

  const load = useCallback(async () => {
    setError('');
    try {
      const [list, cats] = await Promise.all([expenseApi.list(), categoryApi.list()]);
      setItems(list);
      setCategories(cats);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter(
      (i) =>
        (typeFilter === 'all' || i.type === typeFilter) &&
        (catFilter === 'all' || String(i.categoryId) === catFilter) &&
        (!q || i.title.toLowerCase().includes(q) || i.description.toLowerCase().includes(q))
    );
  }, [items, query, typeFilter, catFilter]);

  async function handleSave(form) {
    if (editor.initial) await expenseApi.update(editor.initial.id, form);
    else await expenseApi.create(form, user.id);
    setEditor(null);
    await load();
  }

  async function handleDelete(item) {
    if (!window.confirm(`Delete "${item.title}"? This can't be undone.`)) return;
    try {
      await expenseApi.remove(item.id);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <div className="page-head">
        <h1>Transactions</h1>
        <button className="btn btn-primary" onClick={() => setEditor({})}>Add entry</button>
      </div>

      <div className="filters">
        <input
          className="search"
          type="search"
          placeholder="Search title or note…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} aria-label="Filter by type">
          <option value="all">All types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
        <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} aria-label="Filter by category">
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={String(c.id)}>{c.name}</option>
          ))}
        </select>
      </div>

      {error && <div className="notice error">{error}</div>}

      {loading ? (
        <p className="muted pad">Loading…</p>
      ) : visible.length === 0 ? (
        <div className="card empty">
          <p>{items.length === 0 ? 'No entries yet.' : 'No entries match these filters.'}</p>
        </div>
      ) : (
        <div className="card table-card">
          <table className="ledger">
            <thead>
              <tr>
                <th>Date</th>
                <th>Details</th>
                <th>Category</th>
                <th className="r">Amount</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {visible.map((i) => (
                <tr key={i.id}>
                  <td className="nowrap muted">{formatDate(i.date)}</td>
                  <td>
                    <div className="recent-title">{i.title}</div>
                    {i.description && <div className="muted small">{i.description}</div>}
                  </td>
                  <td>{i.categoryName ? <span className="chip">{i.categoryName}</span> : <span className="muted">—</span>}</td>
                  <td className={`r num nowrap ${i.type === 'income' ? 'pos' : 'neg'}`}>
                    {i.type === 'income' ? '+' : '−'}{formatINR(i.amount)}
                  </td>
                  <td className="actions">
                    <button className="btn btn-ghost btn-sm" onClick={() => setEditor({ initial: i })}>Edit</button>
                    <button className="btn btn-ghost btn-sm danger" onClick={() => handleDelete(i)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editor && (
        <ExpenseForm
          initial={editor.initial}
          categories={categories}
          onSubmit={handleSave}
          onClose={() => setEditor(null)}
        />
      )}
    </>
  );
}
