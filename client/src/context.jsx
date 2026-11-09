import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from './api';
const Context = createContext(null);
export function Provider({ children }) {
  const [token, setToken] = useState(() => sessionStorage.getItem('forum-token') || '');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(token));
  const [notice, setNotice] = useState('');
  useEffect(() => {
    if (!token) { setUser(null); setLoading(false); return; }
    let active = true;
    api('/auth/me', { token }).then(data => { if (active) setUser(data); }).catch(error => { if (active && error.status === 401) { sessionStorage.removeItem('forum-token'); setToken(''); } if (active) setNotice(error.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token]);
  useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(''), 6500); return () => clearTimeout(timer); }, [notice]);
  function login(data) { sessionStorage.setItem('forum-token', data.token); setUser(data.user); setToken(data.token); }
  function logout() { sessionStorage.removeItem('forum-token'); setToken(''); setUser(null); setNotice('You have signed out.'); }
  return <Context.Provider value={{ token, user, loading, login, logout, setUser, notify: setNotice }}>{children}{notice && <div className="toast" role="status">{notice}<button aria-label="Dismiss notification" onClick={() => setNotice('')}>×</button></div>}</Context.Provider>;
}
export const useAuth = () => useContext(Context);
