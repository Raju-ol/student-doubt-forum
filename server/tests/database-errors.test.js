import test from 'node:test';
import assert from 'node:assert/strict';
import { connectionErrorCode } from '../src/database.js';

test('deployment diagnostics classify errors without echoing private details', () => {
  const cases = [
    [{ code: 'MONGO_URI_MISSING' }, 'MONGO_URI_MISSING'],
    [{ code: 'JWT_SECRET_INVALID' }, 'JWT_SECRET_INVALID'],
    [{ code: 18, message: 'private-password' }, 'DATABASE_AUTH_FAILED'],
    [{ code: 13 }, 'DATABASE_PERMISSION_DENIED'],
    [{ name: 'MongoParseError', message: 'private-uri' }, 'DATABASE_URI_INVALID'],
    [{ name: 'MongooseServerSelectionError' }, 'DATABASE_NETWORK_UNAVAILABLE'],
    [{ reason: { servers: new Map([['private-host', { error: { code: 18 } }]]) } }, 'DATABASE_AUTH_FAILED'],
    [{ cause: { code: 'ENOTFOUND' } }, 'DATABASE_NETWORK_UNAVAILABLE'],
    [{ message: 'private-error' }, 'DATABASE_CONNECTION_FAILED']
  ];
  for (const [error, expected] of cases) assert.equal(connectionErrorCode(error), expected);
});
