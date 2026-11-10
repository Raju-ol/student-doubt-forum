import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Provider } from './context';
import { Navbar, MobileTabBar, Protected } from './components';
import { Feed, AuthPage, Ask, Detail, Profile, Admin } from './pages';
import { EmailAction, AccountSettings } from './account-pages';
import { NotificationsPage } from './notifications';
import { CatalogPage } from './catalog-page';
import '@fontsource-variable/inter';
import '@fontsource-variable/space-grotesk';
import '@fontsource-variable/unbounded';
import '@fontsource-variable/bricolage-grotesque';
import './styles.css';
import './p0.css';
import './explore.css';
import './question-detail.css';
import './genz.css';
class ErrorBoundary extends React.Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <main className="container state"><h1>Something went wrong</h1><p>Please reload the page and try again.</p><button className="button" onClick={() => window.location.reload()}>Reload</button></main> : this.props.children; }
}
createRoot(document.getElementById('root')).render(<React.StrictMode><ErrorBoundary><BrowserRouter><Provider><a className="skip-link" href="#main">Skip to content</a><Navbar /><main className="container" id="main"><Routes><Route path="/" element={<Feed />} /><Route path="/login" element={<AuthPage />} /><Route path="/signup" element={<AuthPage signup />} /><Route path="/notifications" element={<Protected><NotificationsPage /></Protected>} /><Route path="/account" element={<Protected><AccountSettings /></Protected>} /><Route path="/forgot-password" element={<EmailAction mode="forgot" />} /><Route path="/reset-password" element={<EmailAction mode="reset" />} /><Route path="/verify-email" element={<EmailAction mode="verify" />} /><Route path="/ask" element={<Protected><Ask /></Protected>} /><Route path="/doubts/:id" element={<Detail />} /><Route path="/doubts/:id/edit" element={<Protected><Ask edit /></Protected>} /><Route path="/users/:id" element={<Profile />} /><Route path="/admin/catalog" element={<Protected admin><CatalogPage /></Protected>} /><Route path="/admin" element={<Protected admin><Admin /></Protected>} /><Route path="*" element={<div className="state state--404"><span className="state__big" aria-hidden="true">404</span><h1>This page took a gap year.</h1><p className="muted">The link may be old or mistyped.</p><Link className="button" to="/">Back to questions</Link></div>} /></Routes></main><footer className="footer"><span>Doubt Forum</span><span>No doubt is too small. Ask it.</span></footer><MobileTabBar /></Provider></BrowserRouter></ErrorBoundary></React.StrictMode>);
