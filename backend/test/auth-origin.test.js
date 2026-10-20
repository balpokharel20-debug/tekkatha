import assert from 'node:assert/strict';
import test from 'node:test';
import { verifyOrigin } from '../src/auth.js';

function runOriginCheck({ method = 'POST', origin, protocol = 'https', host = 'cms.example.com' }) {
  let nextCalled = false;
  let statusCode;
  let responseBody;
  const req = {
    method,
    protocol,
    get(name) {
      if (name === 'origin') return origin;
      if (name === 'host') return host;
      return undefined;
    },
    is: (type) => type === 'application/json',
  };
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(body) {
      responseBody = body;
      return this;
    },
  };

  verifyOrigin(req, res, () => {
    nextCalled = true;
  });

  return { nextCalled, statusCode, responseBody };
}

test('allows the exact origin serving the API request', () => {
  assert.deepEqual(runOriginCheck({ origin: 'https://cms.example.com' }), {
    nextCalled: true,
    statusCode: undefined,
    responseBody: undefined,
  });
});

test('rejects an unrelated origin', () => {
  const result = runOriginCheck({ origin: 'https://attacker.example' });

  assert.equal(result.nextCalled, false);
  assert.equal(result.statusCode, 403);
  assert.deepEqual(result.responseBody, { error: 'This request origin is not allowed.' });
});

test('rejects an origin value containing a path even if its host matches', () => {
  const result = runOriginCheck({ origin: 'https://cms.example.com/path' });

  assert.equal(result.nextCalled, false);
  assert.equal(result.statusCode, 403);
});

test('does not require an origin for safe read requests', () => {
  assert.equal(runOriginCheck({ method: 'GET' }).nextCalled, true);
});
