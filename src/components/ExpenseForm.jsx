import { useState } from 'react';
import Modal from './Modal';
import { todayISO } from '../utils/format';

export default function ExpenseForm({ initial, categories, onSubmit, onClose }) {
  const editing = Boolean(initial);
  const [form, setForm] = useState({
    type: initial?.type || 'expense',
    title: initial?.title || '',
    amount: initial?.amount ?? '',
    date: initial?.date || todayISO(),
    categoryId: initial?.categoryId ?? '',
    description: initial?.description || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.title.trim()) return setError('Please enter a title.');
    if (!(Number(form.amount) > 0)) return setError('Amount must be greater than 0.');
    setSaving(true);
    try {
      await onSubmit({ ...form, title: form.title.trim() });
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <Modal title={editing ? 'Edit entry' : 'New entry'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="form">
        <div className="seg" role="radiogroup" aria-label="Entry type">
          {['expense', 'income'].map((t) => (
            <button
              type="button"
              key={t}
              role="radio"
              aria-checked={form.type === t}
              className={`seg-item ${form.type === t ? `on ${t}` : ''}`}
              onClick={() => setForm((f) => ({ ...f, type: t }))}
            >
              {t === 'expense' ? 'Expense' : 'Income'}
            </button>
          ))}
        </div>

        <label className="field">
          <span>Title</span>
          <input value={form.title} onChange={set('title')} placeholder="e.g. Groceries" autoFocus />
        </label>

        <div className="row2">
          <label className="field">
            <span>Amount (₹)</span>
            <input type="number" inputMode="decimal" min="0" step="0.01" value={form.amount} onChange={set('amount')} placeholder="0.00" />
          </label>
          <label className="field">
            <span>Date</span>
            <input type="date" value={form.date} onChange={set('date')} />
          </label>
        </div>

        <label className="field">
          <span>Category</span>
          <select value={form.categoryId} onChange={set('categoryId')}>
            <option value="">— None —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Note</span>
          <textarea rows="2" value={form.description} onChange={set('description')} placeholder="Optional" />
        </label>

        {error && <p className="error">{error}</p>}

        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : editing ? 'Save changes' : 'Add entry'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
