import React from 'react';
import { Check } from 'lucide-react';

const TILES = [
  ['questions', 'Questions asked'], ['answers', 'Answers given'], ['accepted', 'Accepted answers'],
  ['answerUpvotes', 'Answer upvotes'], ['sameDoubt', 'Same-doubt presses'], ['endorsed', 'Teacher endorsements']
];

// Growth on a profile: what the person has done, and what is next.
export function GrowthPanel({ growth }) {
  if (!growth) return null;
  const earned = growth.milestones.filter(item => item.earned).length;
  return <section className="panel growth" aria-labelledby="growth-heading">
    <h2 id="growth-heading">Growth</h2>
    <dl className="growth__stats">
      {TILES.map(([key, label]) => <div key={key}><dt>{label}</dt><dd>{growth.stats[key]}</dd></div>)}
    </dl>
    <h3 className="growth__sub">Milestones <span className="muted">{earned} of {growth.milestones.length}</span></h3>
    <ul className="growth__milestones">
      {growth.milestones.map(item => <li key={item.key} className={item.earned ? 'is-earned' : ''}>
        <span className="growth__check" aria-hidden="true">{item.earned && <Check size={14} />}</span>
        <span><strong>{item.label}</strong>
          {item.earned ? <span className="visually-hidden"> (earned)</span>
            : <small>{item.hint}{item.target > 1 ? ` · ${item.progress} of ${item.target}` : ''}</small>}
        </span>
      </li>)}
    </ul>
  </section>;
}
