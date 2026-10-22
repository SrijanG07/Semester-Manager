const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

function handler(owner) {
  const Subject = { findById: async () => ({ userId: owner }) };
  const sandbox = { module: { exports: {} }, require: name => {
    if (name === 'mongoose') return { isValidObjectId: id => id === 'valid' };
    if (name.endsWith('/Subject')) return Subject;
    return { findById: async () => ({ subjectId: 'subject' }) };
  }};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../src/middleware/ownership.js'), 'utf8'), sandbox);
  return sandbox.module.exports.ownsRecord('Topic', 'topicId');
}
function response() { return { status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } }; }
test('another user cannot access a topic', async () => {
  const res = response(); let called = false;
  await handler('alice')({ params: { topicId: 'valid' }, user: { _id: 'bob' }, method: 'GET' }, res, () => { called = true; });
  assert.equal(res.code, 404); assert.equal(called, false);
});
test('owner may update content but cannot reassign ownership', async () => {
  const req = { params: { topicId: 'valid' }, user: { _id: 'alice' }, method: 'PUT', body: { name: 'Updated', userId: 'bob', subjectId: 'other' } };
  let called = false;
  await handler('alice')(req, response(), () => { called = true; });
  assert.equal(called, true); assert.deepEqual(req.body, { name: 'Updated' });
});
test('malformed IDs are rejected before database access', async () => {
  const res = response();
  await handler('alice')({ params: { topicId: 'invalid' }, user: { _id: 'alice' } }, res, () => assert.fail());
  assert.equal(res.code, 400);
});
