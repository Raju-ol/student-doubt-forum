import test from 'node:test';
import assert from 'node:assert/strict';
import { safeReturn, signInPath } from '../../client/src/navigation.js';

test('sign-in return destinations stay inside the application', () => {
  for (const unsafe of [null, '', 'https://example.com', '//example.com', '/\\example.com', '/\n/evil', '/login', '/signup']) assert.equal(safeReturn(unsafe), '/');
  assert.equal(safeReturn('/doubts/123?from=search#answer'), '/doubts/123?from=search#answer');
  assert.equal(signInPath({ pathname: '/ask', search: '?subject=DBMS', hash: '' }), '/login?returnTo=%2Fask%3Fsubject%3DDBMS');
});
