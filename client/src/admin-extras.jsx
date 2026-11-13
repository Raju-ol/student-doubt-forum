import React from 'react';
import { Link } from 'react-router-dom';
import { Empty } from './components';

export const trend = ({ thisWeek, lastWeek }) => {
  const change = thisWeek - lastWeek;
  return change === 0 ? 'same as last week' : `${change > 0 ? '+' : '−'}${Math.abs(change)} vs last week`;
};

// The admin's first screen: this week against last, what is waiting, and the totals.
export function Overview({ data, onOpen }) {
  if (!data) return null;
  const { weeks, waiting, totals } = data;
  const week = (label, value) => <div className="overview__card"><span className="overview__label">{label}</span><strong>{value.thisWeek}</strong><span className={`overview__trend${value.thisWeek > value.lastWeek ? ' is-up' : ''}`}>{trend(value)}</span></div>;
  const wait = (label, count, action) => <div className="overview__card"><span className="overview__label">{label}</span><strong>{count}</strong>{action}</div>;
  return <div className="overview">
    <h2>This week</h2>
    <div className="overview__grid">{week('Questions asked', weeks.questions)}{week('Answers given', weeks.answers)}{week('New sign-ups', weeks.signups)}</div>
    <h2>Waiting for you</h2>
    <div className="overview__grid">
      {wait('Unanswered questions', waiting.unanswered, <Link className="text-button" to="/?scope=all&status=open&sort=unanswered">See them →</Link>)}
      {wait('Reports to review', waiting.reports, <button type="button" className="text-button" onClick={() => onOpen('reports')}>Open reports →</button>)}
      {wait('Teacher requests', waiting.teacherRequests, <button type="button" className="text-button" onClick={() => onOpen('teacher-requests')}>Review requests →</button>)}
    </div>
    <h2>All time</h2>
    <dl className="overview__totals">
      {[['Members', totals.users], ['Questions', totals.questions], ['Answers', totals.answers], ['Library files', totals.resources], ['Library downloads', totals.downloads]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
    </dl>
    <p className="muted">The Worked Q&amp;A samples are not counted anywhere on this page.</p>
  </div>;
}

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
