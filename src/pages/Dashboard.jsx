import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { expenseApi } from '../api';
import { formatDate, formatINR } from '../utils/format';

export default function Dashboard() {
  const [items, setItems] = useState([]);
  const [totals, setTotals] = useState([null, null, null]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [list, t] = await Promise.all([expenseApi.list(), expenseApi.totals()]);
      setItems(list);
      setTotals(t);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    const sum = (type) => items.filter((i) => i.type === type).reduce((s, i) => s + i.amount, 0);
    const income = totals[0] ?? sum('income');
    const expense = totals[1] ?? sum('expense');
    const balance = totals[2] ?? income - expense;
    return { income, expense, balance };
  }, [items, totals]);

  const byCategory = useMemo(() => {
    const map = new Map();
    items
      .filter((i) => i.type === 'expense')
      .forEach((i) => {
        const key = i.categoryName || 'Uncategorised';
        map.set(key, (map.get(key) || 0) + i.amount);
      });
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [items]);

  const maxCat = byCategory[0]?.[1] || 1;
  const flowTotal = stats.income + stats.expense || 1;

  if (loading) return <p className="muted pad">Loading your ledger…</p>;
  if (error) return <div className="notice error">{error} <button className="link" onClick={load}>Retry</button></div>;

  return (
    <>
      <div className="page-head">
        <h1>Overview</h1>
        <Link to="/transactions" className="btn btn-primary">Add entry</Link>
      </div>

      <section className="stats">
        <article className="stat balance">
          <span className="stat-label">Balance</span>
          <strong className={`num ${stats.balance < 0 ? 'neg' : ''}`}>{formatINR(stats.balance)}</strong>
        </article>
        <article className="stat">
          <span className="stat-label">Income</span>
          <strong className="num pos">{formatINR(stats.income)}</strong>
        </article>
        <article className="stat">
          <span className="stat-label">Expenses</span>
          <strong className="num neg">{formatINR(stats.expense)}</strong>
        </article>
      </section>

      <section className="card">
        <h2 className="card-title">Money in vs. out</h2>
        <div className="flow" role="img" aria-label={`Income ${formatINR(stats.income)}, expenses ${formatINR(stats.expense)}`}>
          <div className="flow-in" style={{ width: `${(stats.income / flowTotal) * 100}%` }} />
          <div className="flow-out" style={{ width: `${(stats.expense / flowTotal) * 100}%` }} />
        </div>
        <div className="flow-legend">
          <span><i className="dot in" /> Income</span>
          <span><i className="dot out" /> Expenses</span>
        </div>
      </section>

      <div className="grid2">
        <section className="card">
          <h2 className="card-title">Where it goes</h2>
          {byCategory.length === 0 ? (
            <p className="muted">No expenses yet.</p>
          ) : (
            <ul className="bars">
              {byCategory.map(([name, amt]) => (
                <li key={name}>
                  <div className="bar-row">
                    <span>{name}</span>
                    <span className="num">{formatINR(amt)}</span>
                  </div>
                  <div className="bar"><div style={{ width: `${(amt / maxCat) * 100}%` }} /></div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card">
          <div className="card-head">
            <h2 className="card-title">Recent entries</h2>
            <Link to="/transactions" className="link">View all</Link>
          </div>
          {items.length === 0 ? (
            <p className="muted">Nothing recorded yet. Add your first entry.</p>
          ) : (
            <ul className="recent">
              {items.slice(0, 6).map((i) => (
                <li key={i.id}>
                  <div>
                    <div className="recent-title">{i.title}</div>
                    <div className="muted small">{formatDate(i.date)}{i.categoryName ? ` · ${i.categoryName}` : ''}</div>
                  </div>
                  <span className={`num ${i.type === 'income' ? 'pos' : 'neg'}`}>
                    {i.type === 'income' ? '+' : '−'}{formatINR(i.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
