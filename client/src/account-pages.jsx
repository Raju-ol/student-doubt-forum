import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { api, API_ROOT } from './api';
import { useAuth } from './context';
import { ErrorBox } from './components';
import { GoogleButton } from './google-button';
import { TeacherBadgeSettings } from './teacher-page';

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

function GoogleAccountSettings({ linked, password, onPassword, onLink, disabled }) {
  const [configured, setConfigured] = React.useState(false);
  React.useEffect(() => {
    const controller = new AbortController();
    api('/auth/google/config', { signal: controller.signal }).then(config => {
      if (!controller.signal.aborted) setConfigured(Boolean(config.clientId));
    }).catch(() => {});
    return () => controller.abort();
  }, []);
  if (!linked && !configured) return null;
  return <section aria-label="Google sign-in">
    <h2>Google sign-in</h2>
    {linked ? <p>A Google account is linked to your profile.</p> : <>
      <p>Enter your forum password, then choose the Google account that uses the same email address.</p>
      <label>Current forum password<input type="password" autoComplete="current-password" value={password} onChange={event => onPassword(event.target.value)} /></label>
      <GoogleButton onCredential={onLink} disabled={disabled || password.length < 8} />
    </>}
  </section>;
}

export function AccountSettings() {
  const { user, token, notify, logout, setUser } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [linkPassword, setLinkPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  async function linkGoogle(credential) {
    setBusy(true);
    setError('');
    try {
      const profile = await api('/auth/google/link', { method: 'POST', token, body: { credential, password: linkPassword } });
      setUser(profile);
      setLinkPassword('');
      notify('Google account linked.');
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  async function exportData() {
    setBusy(true); setError('');
    try {
      const response = await fetch(`${API_ROOT}/users/me/export`, { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error((await response.json()).message || 'Export failed.');
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement('a'); link.href = url; link.download = 'doubt-forum-data.ndjson'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      notify('Data export downloaded. Keep this file private.');
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  async function deleteAccount(event) {
    event.preventDefault();
    await removeAccount(Object.fromEntries(new FormData(event.currentTarget)));
  }
  async function removeAccount(body) {
    setError('');
    if (!window.confirm('Permanently delete your account and uploaded images? Discussions remain under Deleted user. This cannot be undone.')) return;
    setBusy(true);
    try { await api('/users/me', { method: 'DELETE', token, body }); logout(); window.location.assign('/'); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  async function resend() {
    setBusy(true);
    try { await api('/auth/verification-email', { method: 'POST', token }); notify('Verification email requested. Check your inbox and spam folder.'); }
    catch (error) { notify(error.message); } finally { setBusy(false); }
  }
  return <section className="panel account-page"><h1>Account settings</h1><ErrorBox message={error} /><h2>Email address</h2><p>{user.email}</p><p>{user.emailVerified ? 'Verified' : user.verificationRequired ? 'Verify your email before posting.' : 'Email verification is not enabled yet.'}</p>{user.verificationRequired && !user.emailVerified && <button className="button" disabled={busy} onClick={resend}>{busy ? 'Sending…' : 'Send verification email'}</button>}<GoogleAccountSettings linked={user.googleLinked} password={linkPassword} onPassword={setLinkPassword} onLink={linkGoogle} disabled={busy} /><TeacherBadgeSettings /><h2>Your data</h2><p>Download your account details and contributions as a newline-delimited JSON file. Keep the download private.</p><button className="button button--secondary" disabled={busy} onClick={exportData}>Export my data</button><h2>Delete account</h2>{user.role === 'admin' ? <p>Transfer administrator ownership through the project owner before deleting your account.</p> : <><p>Your name, email, sign-in access and uploaded images will be removed. Questions, answers, comments and votes remain under Deleted user to preserve discussions. Remove personal details from your post text first. Private moderation records may be retained.</p><form onSubmit={deleteAccount}><label>Current password<input name="password" type="password" autoComplete="current-password" required minLength={8} /></label><label>Type DELETE to confirm<input name="confirmation" pattern="DELETE" autoComplete="off" value={confirmation} onChange={event => setConfirmation(event.target.value)} required /></label><button className="button button--danger" disabled={busy}>Delete my account permanently</button></form>{user.googleLinked && <><p>To confirm with Google, type DELETE above and choose your linked account.</p><GoogleButton disabled={busy || confirmation !== 'DELETE'} onCredential={credential => removeAccount({ confirmation, credential })} /></>}</>}<p><Link to={`/users/${user._id}`}>Your profile</Link></p></section>;
}
