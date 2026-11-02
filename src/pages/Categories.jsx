import { useCallback, useEffect, useState } from 'react';
import { categoryApi } from '../api';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setCategories(await categoryApi.list());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAdd(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setBusy(true);
    setError('');
    try {
      await categoryApi.create(trimmed);
      setName('');
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(c) {
    if (!window.confirm(`Delete category "${c.name}"?`)) return;
    setError('');
    try {
      await categoryApi.remove(c.id);
      setCategories((prev) => prev.filter((x) => x.id !== c.id));
    } catch {
      setError(`Couldn't delete "${c.name}". It may still be used by existing entries.`);
    }
  }

  return (
    <>
      <div className="page-head">
        <h1>Categories</h1>
      </div>

      <form className="card inline-form" onSubmit={handleAdd}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New category, e.g. Food, Rent, Salary"
          aria-label="Category name"
        />
        <button className="btn btn-primary" disabled={busy || !name.trim()}>Add</button>
      </form>

      {error && <div className="notice error">{error}</div>}

      {loading ? (
        <p className="muted pad">Loading…</p>
      ) : categories.length === 0 ? (
        <div className="card empty"><p>No categories yet. Add one above.</p></div>
      ) : (
        <ul className="card cat-list">
          {categories.map((c) => (
            <li key={c.id}>
              <span>{c.name}</span>
              <button className="btn btn-ghost btn-sm danger" onClick={() => handleDelete(c)}>Delete</button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
