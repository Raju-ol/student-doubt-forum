import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, BookOpen, Bookmark, CircleHelp, GraduationCap, MessageCircle, ShieldCheck, Trophy, Users } from 'lucide-react';

export const ROLES = [
  ['student', 'Student', GraduationCap],
  ['teacher', 'Teacher', Users],
  ['admin', 'Admin and moderator', ShieldCheck]
];

const GLANCE = [
  [CircleHelp, 'Ask', 'Post a doubt with a clear title, details, code, maths or screenshots.', '/ask', 'Ask a doubt'],
  [MessageCircle, 'Answer', 'Help a classmate. The asker can mark the answer that solved it.', '/', 'Browse questions'],
  [BookOpen, 'Library', 'Notes, previous year papers and cheat sheets shared by students.', '/library', 'Open the library'],
  [Bookmark, 'Save', 'Keep questions you want to revisit, right on your device.', '/?view=saved', 'Saved questions']
];

// Each role: what they can do, where to find it, and the steps for the main jobs.
export const GUIDES = {
  student: {
    intro: 'Anyone can read questions without signing in. Create a free account, or sign in with Google, to ask, answer, vote, comment and share materials.',
    can: [
      ['Ask a question', 'Ask a Doubt button at the top, or the + button on a phone.', '/ask'],
      ['Answer and comment', 'Open any question and use the answer box at the bottom.', '/'],
      ['Vote', 'Use the arrows next to a question or answer. You cannot vote on your own.', '/'],
      ['Accept an answer', 'On your own question, press Accept answer on the one that solved it.', '/'],
      ['Search and filter', 'Search box at the top, subject chips and the Filters button on Explore.', '/'],
      ['Save for later', 'The bookmark on a question card. Saved list: Saved in the menu.', '/?view=saved'],
      ['Get notified', 'The bell shows new answers, accepted answers and comments.', '/notifications'],
      ['Share study material', 'Upload Resource on the Library page: a PDF, Word or PowerPoint file, or a link.', '/library/share'],
      ['Check the leaderboard', 'Top Contributors in Quick Links shows who helps the most.', '/contributors'],
      ['Manage your account', 'Account settings: name, college, Google sign-in, data export and delete account.', '/account']
    ],
    steps: [
      ['Ask a good question', ['Press Ask a Doubt and sign in if asked.', 'Write a specific title (10 to 160 characters) like a headline.', 'Describe what you tried and where you got stuck (at least 20 characters). Use the toolbar for code blocks and maths.', 'Pick the subject, add up to 5 tags and up to 3 screenshots, then post.']],
      ['Get an answer accepted', ['Open your question and read the answers.', 'Press Accept answer on the one that helped. The writer earns reputation and is notified.', 'You can change your mind and remove the acceptance later.']],
      ['Share notes with classmates', ['Open Library and press Upload Resource.', 'Give it a title and category, then upload a file (up to 4 MB) or paste an https link, for example a Google Drive link shared with "anyone with the link".', 'It appears in the Library straight away. You can remove your own resources.']]
    ]
  },
  teacher: {
    intro: 'Teachers use the same pages as students. The difference is a visible "Teacher" badge on their name, so students know an answer comes from a teacher.',
    can: [
      ['Answer questions', 'Open any question and write an answer. Your badge shows next to it.', '/'],
      ['Find unresolved questions', 'Use Filters, then Answer status, then Unresolved.', '/'],
      ['Comment to clarify', 'Add a comment under an answer to correct or extend it.', '/'],
      ['Share teaching material', 'Upload notes, papers or links in the Library.', '/library/share'],
      ['Earn reputation', 'Upvotes and accepted answers raise your score on Top Contributors.', '/contributors']
    ],
    steps: [
      ['Get the Teacher badge', ['Create your account like any student.', 'Ask an administrator to set your role to Teacher. Only an administrator can do this; signing up never grants it.', 'Refresh the page. The badge appears on your name.']],
      ['Answer a doubt well', ['Open Explore and filter to Unresolved, or pick your subject chip.', 'Explain the idea first, then show the worked steps. Use code blocks and maths where helpful.', 'The asker can accept your answer, which adds to your reputation.']]
    ],
    note: 'Teacher-only tools, such as assigned institutions and a review step before publishing materials, are planned but not built yet.'
  },
  admin: {
    intro: 'Moderators keep the forum safe. Administrators also manage accounts, roles and the subject and college lists. Both use the Moderation area, which appears in the account menu (your avatar, top right).',
    can: [
      ['Review reports', 'Moderation lists reported questions and answers. Dismiss a report or remove the content.', '/admin'],
      ['Manage accounts (admin)', 'Moderation shows registered users. Suspend an account, or change its role.', '/admin'],
      ['Set roles (admin)', 'Student, Teacher, Moderator or Admin. You cannot change your own role.', '/admin'],
      ['Edit subjects and colleges (admin)', 'Subject catalogue and Colleges pages control the chips and college lists.', '/admin/catalog'],
      ['Sample questions (admin)', 'On the Subject catalogue page, publish or reset the 200 Worked Q&A sample questions.', '/admin/catalog'],
      ['Remove shared materials', 'Moderators and admins can remove any resource in the Library.', '/library']
    ],
    steps: [
      ['Handle a report', ['Open the account menu, then Moderation.', 'Read the reported content and the reason.', 'Choose Dismiss report to keep it or Remove content to delete it. A report can only be resolved once.']],
      ['Make someone a teacher or moderator', ['Open Moderation as an administrator.', 'Find the person in the user list and choose their new role.', 'They refresh the page to see their new access. Administrator accounts cannot be suspended.']]
    ],
    note: 'Moderators cannot edit other people\'s questions, change roles or suspend accounts. They work through reports.'
  }
};

const FEATURES = [
  ['Explore', 'Browse every question, newest first, with status, answers and views.', 'Explore in the menu', '/'],
  ['Search and filters', 'Search titles, details and tags. Filter by subject, answer status, college and academic level. Filters stay when you search.', 'Search box and Filters button', '/'],
  ['Markdown, code and maths', 'Format with a toolbar, add code blocks with highlighting and maths like $x^2$.', 'Ask and answer boxes', '/ask'],
  ['Screenshots', 'Attach up to 3 images (JPG, PNG or WebP, 3 MB each) to a question.', 'Ask form', '/ask'],
  ['Votes and reputation', 'Up-votes on answers give +10, down-votes -2, and an accepted answer +15.', 'Arrows beside answers', '/contributors'],
  ['Accepted answers', 'The asker marks the answer that solved the doubt. The question turns Resolved.', 'Your own question page', '/'],
  ['Notifications', 'Be told when someone answers, accepts or comments on your content.', 'Bell, top right', '/notifications'],
  ['Saved questions', 'Bookmarks kept in this browser. They are not synced between devices.', 'Saved in the menu', '/?view=saved'],
  ['Library', 'Shared notes, previous year papers, cheat sheets and books as files or links, with download counts.', 'Library in the menu', '/library'],
  ['Worked Q&A', '200 labelled sample questions with AI-written explanations for exam revision.', 'Library, Worked Q&A box', '/?scope=all&tag=study-library'],
  ['Trending Topics', 'The tags students used most in the last 30 days.', 'Explore, right-hand side', '/'],
  ['Top Contributors', 'The ten students with the highest reputation.', 'Quick Links', '/contributors'],
  ['Light and dark themes', 'Light (peach), Dark (purple) or Auto, which follows your device.', 'Switch at the bottom of the menu', '/'],
  ['Google sign-in and recovery', 'Sign in with Google or a password. Forgotten passwords are reset by email.', 'Sign in page', '/login'],
  ['Your data', 'Change your name and college, sign out of every device, export your data or delete your account.', 'Account settings', '/account']
];

const LIMITS = [
  ['Question title', '10 to 160 characters'], ['Question details', '20 to 12,000 characters'], ['Tags', 'Up to 5 per question'],
  ['Screenshots', 'Up to 3 per question, 3 MB each'], ['Answer', '10 to 12,000 characters'], ['Comment', '2 to 1,000 characters'],
  ['Library file', 'PDF, Word or PowerPoint, up to 4 MB, or an https link'], ['Library sharing', 'Up to 10 items per hour']
];

const FAQ = [
  ['Do I need an account to read?', 'No. Questions, answers and the Library can be read and downloaded without signing in. You need an account to ask, answer, vote, comment or share.'],
  ['Why can I not vote on my own question or answer?', 'Votes show what other students found useful, so voting on your own content is blocked.'],
  ['Who can accept an answer?', 'Only the student who asked the question.'],
  ['What does Resolved, Unresolved or Unanswered mean?', 'Resolved: an answer was accepted. Unresolved: it has answers but none accepted. Unanswered: nobody has replied yet.'],
  ['Where are my saved questions kept?', 'In this browser on this device only. If you clear site data or use another device, they will not be there.'],
  ['Why can I not open a Library file?', 'Files are stored by a separate service. If one will not open, tell an administrator. A shared link also fails if its owner has not made it public.'],
  ['How do I become a teacher or moderator?', 'Ask an administrator. Roles are never granted automatically at sign-up.'],
  ['Someone posted something inappropriate. What do I do?', 'Press Report on the question or answer. A moderator reviews it.'],
  ['Are the Worked Q&A answers reliable?', 'They are AI-written study examples and are labelled that way. Check important details against your course material.'],
  ['Can I delete my account?', 'Yes, in Account settings. You can export your data first.']
];

export function AboutPage() {
  const [params, setParams] = useSearchParams();
  const role = ROLES.some(([key]) => key === params.get('role')) ? params.get('role') : 'student';
  const guide = GUIDES[role];
  const choose = key => { const next = new URLSearchParams(params); next.set('role', key); setParams(next, { replace: true }); };

  return <div className="about">
    <section className="dx-hero about__hero" aria-labelledby="about-heading">
      <div className="dx-hero__text">
        <h1 id="about-heading">How Doubt <span className="dx-accent">Forum</span> works</h1>
        <p>A place for students to ask, answer and share, with teachers and moderators keeping it helpful. Pick your role below for a short guide.</p>
      </div>
      <p className="dx-hero__script" aria-hidden="true">Learn · Ask · Grow</p>
      <img className="dx-hero__art" src="/illustrations/hero-explore.png" alt="" width="480" height="320" />
    </section>

    <section className="about__glance" aria-label="The four main things">
      {GLANCE.map(([Glyph, title, text, to, cta]) => <Link key={title} className="about__tile" to={to}>
        <span className="about__tile-icon"><Glyph aria-hidden="true" size={22} /></span>
        <h2>{title}</h2><p>{text}</p>
        <span className="about__tile-link">{cta} <ArrowRight aria-hidden="true" size={15} /></span>
      </Link>)}
    </section>

    <section className="about__section" aria-labelledby="roles-heading">
      <h2 id="roles-heading">A guide for your role</h2>
      <div className="dx-chips" role="group" aria-label="Choose your role">
        {ROLES.map(([key, label, Glyph]) => <button key={key} type="button" className="dx-chip" aria-pressed={role === key} onClick={() => choose(key)}><Glyph aria-hidden="true" size={16} />&nbsp;{label}</button>)}
      </div>
      <p className="about__intro">{guide.intro}</p>
      <h3>What you can do and where to find it</h3>
      <ul className="about__can">
        {guide.can.map(([what, where, to]) => <li key={what}><Link to={to}><strong>{what}</strong><span>{where}</span></Link></li>)}
      </ul>
      <h3>Step by step</h3>
      <div className="about__steps">
        {guide.steps.map(([title, items]) => <article key={title} className="about__card">
          <h4>{title}</h4>
          <ol>{items.map(item => <li key={item}>{item}</li>)}</ol>
        </article>)}
      </div>
      {guide.note && <p className="about__note">{guide.note}</p>}
    </section>

    <section className="about__section" aria-labelledby="features-heading">
      <h2 id="features-heading">Every feature</h2>
      <div className="about__table-wrap">
        <table className="about__table">
          <thead><tr><th scope="col">Feature</th><th scope="col">What it does</th><th scope="col">Where to find it</th></tr></thead>
          <tbody>{FEATURES.map(([name, what, where, to]) => <tr key={name}>
            <th scope="row">{name}</th><td>{what}</td><td><Link to={to}>{where}</Link></td>
          </tr>)}</tbody>
        </table>
      </div>
    </section>

    <section className="about__section" aria-labelledby="limits-heading">
      <h2 id="limits-heading">Limits and house rules</h2>
      <dl className="about__limits">{LIMITS.map(([name, value]) => <div key={name}><dt>{name}</dt><dd>{value}</dd></div>)}</dl>
      <p className="about__note">Be kind, stay on topic and do not post private information. Reported content is reviewed by moderators and can be removed.</p>
    </section>

    <section className="about__section" aria-labelledby="faq-heading">
      <h2 id="faq-heading">Common questions</h2>
      <div className="about__faq">{FAQ.map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div>
    </section>

    <section className="about__cta">
      <Trophy aria-hidden="true" size={28} />
      <div><h2>Ready to start?</h2><p>Ask your first doubt, or help someone with theirs.</p></div>
      <Link className="dx-button" to="/ask">Ask a Doubt <ArrowRight aria-hidden="true" size={15} /></Link>
    </section>
  </div>;
}
