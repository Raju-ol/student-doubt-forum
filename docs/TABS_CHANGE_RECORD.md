# Profile and moderation tabs — 9 November 2026

Both pages now use a shared TabList with labelled tablist, tab roles,
aria-selected, one roving tab stop, stable tab/panel associations and a labelled
focusable panel. ArrowLeft/Right wrap, Home/End jump, native button activation
continues to work. Admin selection resets pagination. Selected styling uses
aria-selected rather than aria-pressed. Markdown editor retains its existing
independent tab behavior.

72 tests/build pass. In addition to navigation unit checks, a React/jsdom DOM
test dispatches keyboard events and checks activeElement, aria-selected,
tabIndex and aria-controls. No screen reader audit performed; production admin
mutations not exercised. Shared panel content unmounts on selection as before.
