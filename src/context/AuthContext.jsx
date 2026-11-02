import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api';
import { ApiError, decodeJwt, isExpired, setUnauthorizedHandler, tokenStore } from '../api/client';

const USER_KEY = 'vault.user';
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    const t = tokenStore.get();
    return t && !isExpired(t) ? t : null;
  });
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY));
    } catch {
      return null;
    }
  });

  const logout = useCallback(() => {
    tokenStore.clear();
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(logout);
  }, [logout]);

  const login = useCallback(async (email, password) => {
    const jwt = await authApi.login({ email, password });
    const claims = decodeJwt(jwt);
    if (!claims || isExpired(jwt)) {
      // Backend may answer 200 with a plain message instead of a token
      throw new ApiError(jwt && !claims ? jwt : 'Invalid email or password', 401);
    }
    tokenStore.set(jwt);

    // The login endpoint only returns a token, and POST /expenses needs the user id,
    // so look ourselves up by the email stored in the token.
    const users = await authApi.users();
    const me = users.find((u) => u.email?.toLowerCase() === String(claims.sub).toLowerCase());
    if (!me) {
      tokenStore.clear();
      throw new ApiError('Signed in, but could not load your profile.', 500);
    }
    localStorage.setItem(USER_KEY, JSON.stringify(me));
    setToken(jwt);
    setUser(me);
  }, []);

  const value = useMemo(
    () => ({ token, user, isAuthed: Boolean(token && user), login, logout }),
    [token, user, login, logout]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
