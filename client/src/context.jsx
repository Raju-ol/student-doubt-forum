import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { api } from './api';
import { readSessionToken, saveSessionToken } from './session';
const Context = createContext(null);
export function Provider({ children }) {
  const [token, setToken] = useState(() => readSessionToken());
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(token));
  const [notice, setNotice] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const initialCatalog = useRef(null);
  const refreshInstitutions = () => api('/institutions').then(setInstitutions).catch(() => setNotice('College catalogue could not load. Refresh the page to try again.'));
  const refreshSubjects = () => api('/subjects').then(setSubjects).catch(() => setNotice('Subject catalogue could not load. Refresh the page to try again.'));
  useEffect(() => {
    let active = true;
    initialCatalog.current ??= api('/catalog');
    initialCatalog.current.then(data => {
      if (active) {
        setSubjects(data.subjects);
        setInstitutions(data.institutions);
      }
    }).catch(() => {
      if (active) setNotice('Subject and college options could not load. Refresh the page to try again.');
    });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (!token) { setUser(null); setLoading(false); return; }
    let active = true;
    api('/auth/me', { token }).then(data => { if (active) setUser(data); }).catch(error => { if (active && error.status === 401) { saveSessionToken(''); setToken(''); } if (active) setNotice(error.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token]);
  useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(''), 6500); return () => clearTimeout(timer); }, [notice]);
  function login(data) { saveSessionToken(data.token); setUser(data.user); setToken(data.token); }
  function logout() { saveSessionToken(''); setToken(''); setUser(null); setNotice('You have signed out.'); }
  return <Context.Provider value={{ token, user, loading, login, logout, setUser, subjects, refreshSubjects, institutions, refreshInstitutions, notify: setNotice }}>{children}{notice && <div className="toast" role="status">{notice}<button aria-label="Dismiss notification" onClick={() => setNotice('')}>×</button></div>}</Context.Provider>;
}
export const useAuth = () => useContext(Context);
