import test from 'node:test';
import assert from 'node:assert/strict';
import { tabDestination } from '../../client/src/tabs.js';
test('profile/admin tabs support horizontal arrows, wrap, Home and End', () => {
  const values = ['questions', 'answers'];
  assert.equal(tabDestination(values, 'questions', 'ArrowRight'), 'answers');
  assert.equal(tabDestination(values, 'answers', 'ArrowRight'), 'questions');
  assert.equal(tabDestination(values, 'questions', 'ArrowLeft'), 'answers');
  assert.equal(tabDestination(values, 'answers', 'Home'), 'questions');
  assert.equal(tabDestination(values, 'questions', 'End'), 'answers');
  assert.equal(tabDestination(values, 'answers', 'Tab'), null);
});
