import assert from 'node:assert/strict';
import test from 'node:test';
import { formatSize, timeAgo } from '../../client/src/format.js';

test('timeAgo gives short relative labels', () => {
  const now = Date.parse('2026-11-13T12:00:00Z');
  const ago = seconds => new Date(now - seconds * 1000).toISOString();
  assert.equal(timeAgo(ago(20), now), 'just now');
  assert.equal(timeAgo(ago(60), now), '1 minute ago');
  assert.equal(timeAgo(ago(2 * 3600), now), '2 hours ago');
  assert.equal(timeAgo(ago(86400), now), '1 day ago');
  assert.equal(timeAgo(ago(3 * 604800), now), '3 weeks ago');
  assert.equal(timeAgo(ago(400 * 86400), now), '1 year ago');
  assert.equal(timeAgo(new Date(now + 5000).toISOString(), now), 'just now');
  assert.equal(timeAgo('not a date', now), '');
});

test('formatSize shows KB below a megabyte and MB above', () => {
  assert.equal(formatSize(0), '');
  assert.equal(formatSize(100), '1 KB');
  assert.equal(formatSize(635 * 1024), '635 KB');
  assert.equal(formatSize(2.4 * 1024 * 1024), '2.4 MB');
});
