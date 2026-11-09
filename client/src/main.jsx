import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Provider } from './context';
import { Navbar, Protected } from './components';
import { Feed, AuthPage, Ask, Detail, Profile, Admin } from './pages';
import './styles.css';
import './p0.css';
class ErrorBoundary extends React.Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <main className="container state"><h1>Something went wrong</h1><p>Please reload the page and try again.</p><button className="button" onClick={() => window.location.reload()}>Reload</button></main> : this.props.children; }
}
createRoot(document.getElementById('root')).render(<React.StrictMode><ErrorBoundary><BrowserRouter><Provider><a className="skip-link" href="#main">Skip to content</a><Navbar /><main className="container" id="main"><Routes><Route path="/" element={<Feed />} /><Route path="/login" element={<AuthPage />} /><Route path="/signup" element={<AuthPage signup />} /><Route path="/ask" element={<Protected><Ask /></Protected>} /><Route path="/doubts/:id" element={<Detail />} /><Route path="/doubts/:id/edit" element={<Protected><Ask edit /></Protected>} /><Route path="/users/:id" element={<Profile />} /><Route path="/admin" element={<Protected admin><Admin /></Protected>} /><Route path="*" element={<div className="state"><h1>Page not found</h1><Link className="button" to="/">Back to questions</Link></div>} /></Routes></main><footer className="footer"><span>DoubtForum</span><span>A little curiosity. A lot of learning.</span></footer></Provider></BrowserRouter></ErrorBoundary></React.StrictMode>);
