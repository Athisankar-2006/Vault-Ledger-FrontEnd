const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const TOKEN_KEY = 'vault.token';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

// The backend's JWT carries the user's email in `sub` and an `exp` claim.
export function decodeJwt(token) {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

export function isExpired(token) {
  const claims = decodeJwt(token);
  return !claims || !claims.exp || claims.exp * 1000 <= Date.now();
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => {
  onUnauthorized = fn;
};

export async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  if (auth) {
    const token = tokenStore.get();
    if (token) {
      // Spring answers an expired/invalid token with 403, so check expiry ourselves.
      if (isExpired(token)) {
        onUnauthorized();
        throw new ApiError('Your session has expired. Please sign in again.', 401);
      }
      headers.Authorization = `Bearer ${token}`;
    }
  }

  let res;
  try {
    res = await fetch(BASE + path, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('Cannot reach the server. Is the Spring Boot backend running?', 0);
  }

  const text = await res.text();
  let data = text;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    /* plain-text response (login token, delete message) – keep as string */
  }

  if (!res.ok) {
    if (res.status === 401 && auth) onUnauthorized();
    const message =
      (typeof data === 'string' && data) ||
      data?.message ||
      data?.error ||
      `Request failed (${res.status})`;
    throw new ApiError(message, res.status);
  }
  return data;
}
