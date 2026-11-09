import React, { useRef } from 'react';
import { tabDestination } from './tabs';
export function TabList({ id, label, items, value, onChange }) {
  const refs = useRef({});
  function keyDown(event) {
    const next = tabDestination(items.map(item => item.value), value, event.key);
    if (!next) return;
    event.preventDefault(); onChange(next); refs.current[next]?.focus();
  }
  return <div className="tabs" role="tablist" aria-label={label}>{items.map(item => <button type="button" key={item.value} id={`${id}-${item.value}`} role="tab" aria-selected={value === item.value} aria-controls={`${id}-panel`} tabIndex={value === item.value ? 0 : -1} ref={node => { refs.current[item.value] = node; }} onKeyDown={keyDown} onClick={() => onChange(item.value)}>{item.label}</button>)}</div>;
}
