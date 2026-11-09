import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { api } from './api';
import { useAuth } from './context';
import { ErrorBox } from './components';

export function EmailAction({ mode }) {
  const location = useLocation();
  const [token] = useState(() => location.hash.slice(1));
  const [error, setError] = useState(''), [message, setMessage] = useState(''), [busy, setBusy] = useState(false);
  const { token: session, setUser } = useAuth();
  const verify = mode === 'verify';
  const forgot = mode === 'forgot';
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError('');
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    try {
      await api(`/auth/${verify ? 'verify-email' : forgot ? 'forgot-password' : 'reset-password'}`, { method: 'POST', body: forgot ? fields : { ...fields, token } });
      setMessage(verify ? 'Email verified. You can now post.' : forgot ? 'If the account is available, a reset link has been sent. Check your inbox and spam folder.' : 'Password changed. Sign in with your new password.');
      if (verify && session) setUser(await api('/auth/me', { token: session }));
      // Remove the one-time token from browser history after successful use.
      if (!forgot) window.history.replaceState(null, '', location.pathname);
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  return <section className="auth-form panel account-page"><h1>{verify ? 'Verify your email' : forgot ? 'Forgot password?' : 'Choose a new password'}</h1><ErrorBox message={error} />{message ? <p role="status">{message}</p> : <form onSubmit={submit}>{forgot ? <label>Email address<input type="email" name="email" autoComplete="email" required maxLength={254} /></label> : !verify && <label>New password<input type="password" name="password" autoComplete="new-password" required minLength={8} maxLength={72} /></label>}{!forgot && !token ? <p>This link is missing its token. Request a new link.</p> : <button className="button" disabled={busy}>{busy ? 'Please wait…' : verify ? 'Verify email' : forgot ? 'Send reset link' : 'Change password'}</button>}</form>}<p><Link to="/login">Sign in</Link> · <Link to="/account">Account settings</Link></p></section>;
}

export function AccountSettings() {
  const { user, token, notify } = useAuth();
  const [busy, setBusy] = useState(false);
  async function resend() {
    setBusy(true);
    try { await api('/auth/verification-email', { method: 'POST', token }); notify('Verification email requested. Check your inbox and spam folder.'); }
    catch (error) { notify(error.message); } finally { setBusy(false); }
  }
  return <section className="panel account-page"><h1>Account settings</h1><h2>Email address</h2><p>{user.email}</p><p>{user.emailVerified ? 'Verified' : user.verificationRequired ? 'Verify your email before posting.' : 'Email verification is not enabled yet.'}</p>{user.verificationRequired && !user.emailVerified && <button className="button" disabled={busy} onClick={resend}>{busy ? 'Sending…' : 'Send verification email'}</button>}<p><Link to={`/users/${user._id}`}>Your profile</Link></p></section>;
}
