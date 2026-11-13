import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from './api';

const TITLE_MIN = 12;
const DEBOUNCE_MS = 500;
const asList = value => Array.isArray(value) ? value : [];

function SimilarList({ items, newTab = false }) {
  return <ul className="similar__list">{items.map(item => <li key={item._id}>
    <Link to={`/doubts/${item._id}`} {...(newTab ? { target: '_blank', rel: 'noreferrer' } : {})}>{item.title}</Link>
    <span className="muted">{item.subject} · {item.answerCount} {item.answerCount === 1 ? 'answer' : 'answers'}{item.status === 'solved' ? ' · Resolved ✓' : ''}</span>
  </li>)}</ul>;
}

// "Similar doubts" at the end of a question page. Renders nothing when there are none.
export function RelatedQuestions({ id }) {
  const [items, setItems] = useState([]);
  useEffect(() => {
    const controller = new AbortController();
    setItems([]);
    api(`/doubts/${id}/related`, { signal: controller.signal }).then(value => { if (!controller.signal.aborted) setItems(asList(value)); }).catch(() => {});
    return () => controller.abort();
  }, [id]);
  if (!items.length) return null;
  return <section className="qd__related" aria-labelledby="related-heading">
    <h2 id="related-heading">Similar doubts</h2>
    <SimilarList items={items} />
  </section>;
}

// Shown under the title while asking. Links open in a new tab so the draft is not lost.
export function SimilarWhileAsking({ title }) {
  const [items, setItems] = useState([]);
  const query = title.trim();
  useEffect(() => {
    if (query.length < TITLE_MIN) { setItems([]); return undefined; }
    const controller = new AbortController();
    const timer = setTimeout(() => {
      api(`/doubts/similar?title=${encodeURIComponent(query)}`, { signal: controller.signal }).then(value => { if (!controller.signal.aborted) setItems(asList(value)); }).catch(() => {});
    }, DEBOUNCE_MS);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query]);
  if (!items.length) return null;
  return <div className="similar" role="status">
    <strong>These look similar. Is yours already answered?</strong>
    <SimilarList items={items} newTab />
    <small>Links open in a new tab, so your draft stays here.</small>
  </div>;
}
