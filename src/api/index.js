import { request } from './client';

/* ---------- Auth ---------- */
export const authApi = {
  // POST /api/auth/register  { name, email, password, phoneNumber }
  register: (payload) => request('/api/auth/register', { method: 'POST', body: payload, auth: false }),

  // POST /api/auth/login  { email, password }  ->  plain-text JWT
  login: async ({ email, password }) => {
    const token = await request('/api/auth/login', {
      method: 'POST',
      body: { email, password },
      auth: false,
    });
    return String(token ?? '').replace(/^"|"$/g, '').trim();
  },

  // GET /api/auth/users  ->  [{ id, name, email, phoneNumber }]
  users: () => request('/api/auth/users'),
};

/* ---------- Expenses ---------- */
const normalize = (e) => ({
  id: e.id,
  title: e.title ?? '',
  amount: Number(e.amount) || 0,
  type: (e.type ?? '').toLowerCase(),
  description: e.description ?? '',
  date: e.date ?? '',
  categoryId: e.category?.id ?? null,
  categoryName: e.category?.name ?? e.categoryName ?? '',
});

export const expenseApi = {
  // GET /api/expenses currently returns a toString() blob (not JSON) and has no ids,
  // so we build the full list from the two /type/{type} endpoints, which return real entities.
  list: async () => {
    const [income, expense] = await Promise.all([
      request('/api/expenses/type/income'),
      request('/api/expenses/type/expense'),
    ]);
    return [...(income || []), ...(expense || [])]
      .map(normalize)
      .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
  },

  // POST /api/expenses  (note the snake_case keys: category_id, users_id)
  create: (form, userId) =>
    request('/api/expenses', {
      method: 'POST',
      body: {
        title: form.title,
        amount: Number(form.amount),
        type: form.type,
        description: form.description,
        date: form.date,
        category_id: form.categoryId ? Number(form.categoryId) : null,
        users_id: userId,
      },
    }),

  // PUT /api/expenses/{id}  (here the key is camelCase: categoryId)
  update: (id, form) =>
    request(`/api/expenses/${id}`, {
      method: 'PUT',
      body: {
        title: form.title,
        description: form.description,
        amount: Number(form.amount),
        type: form.type,
        date: form.date,
        categoryId: form.categoryId ? Number(form.categoryId) : null,
      },
    }),

  // DELETE /api/expenses/{id}  ->  plain-text message
  remove: (id) => request(`/api/expenses/${id}`, { method: 'DELETE' }),

  // [income, expense, balance] – any that fail come back as null
  totals: async () => {
    const results = await Promise.allSettled([
      request('/api/expenses/total-income'),
      request('/api/expenses/total-expense'),
      request('/api/expenses/balance'),
    ]);
    return results.map((r) => (r.status === 'fulfilled' && typeof r.value === 'number' ? r.value : null));
  },
};

/* ---------- Categories ---------- */
export const categoryApi = {
  list: () => request('/api/categories'),
  create: (name) => request('/api/categories', { method: 'POST', body: { name } }),
  remove: (id) => request(`/api/categories/${id}`, { method: 'DELETE' }),
};
