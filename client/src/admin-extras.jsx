import React from 'react';
import { Empty } from './components';

const stamp = value => new Date(value).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

// "Who did what, when" for administrators. Rows arrive newest first.
export function AuditList({ items }) {
  if (!items?.length) return <Empty title="Nothing recorded yet">Role changes, suspensions, removals and other admin actions will be listed here.</Empty>;
  return <ol className="audit">{items.map(entry => <li key={entry._id} className="audit__row">
    <span className="audit__when">{stamp(entry.createdAt)}</span>
    <span className="audit__what"><strong>{entry.actor?.name || 'Deleted user'}</strong> <span className="muted">({entry.actor?.role || 'unknown'})</span> · {entry.summary}</span>
    <span className="badge audit__action">{entry.action}</span>
  </li>)}</ol>;
}
