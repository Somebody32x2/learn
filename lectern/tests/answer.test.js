/** Answer checking (core/answer.js) for every spec type, plus clip hashing and the seeded RNG (core/hash.js). */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { check, parseNumber, parseVector, normalizeText, answerTex } from '../src/core/answer.js';
import { fnv64, clipKey, rng } from '../src/core/hash.js';

const ok = (spec, response) => assert.equal(check(spec, response).ok, true, JSON.stringify(response));
const no = (spec, response, why) => {
  const r = check(spec, response);
  assert.equal(r.ok, false, JSON.stringify(response));
  if (why) assert.match(r.why ?? '', why);
};

test('parsing helpers', () => {
  assert.equal(String(parseNumber(' \u22123/4 ')), '-3/4');
  assert.equal(parseNumber(null), null);
  assert.deepEqual(parseVector('(1, -2, 3)').map(String), ['1', '-2', '3']);
  assert.deepEqual(parseVector('[1 -2 1/2]').map(String), ['1', '-2', '1/2']);
  assert.equal(parseVector('(1, x)'), null);
  assert.equal(parseVector(''), null);
  assert.equal(normalizeText('  One_to   One.'), 'one to one');
  assert.equal(normalizeText('Bijéctive!'), 'bijective');
});

test('number', () => {
  const spec = { type: 'number', value: '3/4' };
  ok(spec, '3/4');
  ok(spec, '0.75');
  ok(spec, '6/8');
  ok(spec, ' 3 / 4 ');
  no(spec, '-3/4', /Check the sign/);
  no(spec, '\u22120.75', /Check the sign/);
  no(spec, 'three quarters', /Enter a number/);
  no(spec, '1/2');
  no({ type: 'number', value: 0 }, '1');
  ok({ type: 'number', value: '1.414', tol: 0.001 }, '1.4142');
  no({ type: 'number', value: '1.414', tol: 0.001 }, '1.42');
});

test('vector', () => {
  const spec = { type: 'vector', value: ['1', '-2', '0'] };
  ok(spec, ['1', '-2', '0']);
  ok(spec, ['2/2', '-4/2', '0.0']);
  ok(spec, '(1, -2, 0)');
  no(spec, ['1', '-2', '5'], /One entry/);
  no(spec, ['1', '-2'], /3 entries/);
  no(spec, ['1', '', '0'], /Fill every entry/);
  const r = check(spec, ['1', '2', '1']);
  assert.deepEqual(r.wrongAt, [false, true, true]);
});

test('matrix', () => {
  const spec = { type: 'matrix', value: [[1, 0, 2], [0, 1, -1]] };
  ok(spec, [['1', '0', '2'], ['0', '1', '-1']]);
  no(spec, [['1', '0', '2'], ['0', '1', '1']], /One entry/);
  no(spec, [['1', '0', '3'], ['0', '1', '1']], /Two entries/);
  no(spec, [['1', '0'], ['0', '1']], /2×3/);
  no(spec, [['1', '0', 'x'], ['0', '1', '-1']], /Fill every entry/);
  assert.deepEqual(check(spec, [['1', '0', '2'], ['0', '1', '1']]).wrongAt, [[false, false, false], [false, false, true]]);
});

test('basis: any basis of the same subspace, order free; dependent lists rejected', () => {
  const spec = { type: 'basis', value: [[1, 0, 2], [0, 1, 1]] };
  ok(spec, [['1', '0', '2'], ['0', '1', '1']]);
  ok(spec, [['0', '1', '1'], ['1', '0', '2']]); // order
  ok(spec, [['1', '1', '3'], ['1', '-1', '1']]); // a different basis of the same plane
  ok(spec, ['(2, 0, 4)', '(0, 1, 1)']); // typed vectors
  no(spec, [['1', '0', '2'], ['0', '1', '1'], ['1', '1', '3']], /linearly dependent/);
  no(spec, [['1', '0', '2']], /do not span/);
  no(spec, [['1', '0', '0'], ['0', '1', '1']], /not in the subspace/);
  no(spec, [['1', '0'], ['0', '1']], /number of entries/);
  no(spec, [['1', '', '2'], ['0', '1', '1']], /Fill every entry/);
  ok({ type: 'basis', value: [] }, []);
});

test('span: dependent lists pass', () => {
  const spec = { type: 'span', value: [[1, 0, 2], [0, 1, 1]] };
  ok(spec, [['1', '0', '2'], ['0', '1', '1'], ['1', '1', '3']]);
  no(spec, [['1', '0', '2'], ['2', '0', '4']], /do not span/);
});

test('solution sets: a different particular solution and basis are accepted', () => {
  // Lay 1.5: x = (-1, 2, 0) + t (4/3, 0, 1)
  const spec = { type: 'solution', particular: [-1, 2, 0], basis: [['4/3', 0, 1]] };
  ok(spec, { particular: ['-1', '2', '0'], basis: [['4/3', '0', '1']] });
  ok(spec, { particular: ['3', '2', '3'], basis: [['4', '0', '3']] }); // p + 3b, basis scaled by 3
  no(spec, { particular: ['0', '2', '0'], basis: [['4', '0', '3']] }, /particular solution/);
  no(spec, { particular: ['-1', '2', '0'], basis: [] }, /do not span/);
  no(spec, { particular: ['-1', '', '0'], basis: [['4', '0', '3']] }, /Fill every entry/);
  const unique = { type: 'solution', particular: [29, 16, 3], basis: [] };
  ok(unique, { particular: ['29', '16', '3'], basis: [] });
  no(unique, { particular: ['29', '16', '4'], basis: [] });
});

test('text, choice, multi, set, proof', () => {
  const text = { type: 'text', accept: ['injective', 'one-to-one'] };
  ok(text, 'Injective.');
  ok(text, 'one-to-one');
  no(text, 'surjective');
  no(text, '   ', /Type an answer/);

  ok({ type: 'choice', value: 'b' }, 'b');
  no({ type: 'choice', value: 'b' }, 'a');

  const multi = { type: 'multi', value: ['a', 'c'] };
  ok(multi, ['c', 'a']);
  no(multi, ['a', 'b', 'c'], /one too many/);
  no(multi, ['a'], /one more/);
  no(multi, ['a', 'b']);

  const set = { type: 'set', value: ['1', '2', '3'] };
  ok(set, '{3, 1, 2}');
  ok(set, '1,2,3');
  ok(set, '{2/2, 4/2, 3}');
  no(set, '{1, 2}', /3 elements/);
  no(set, '{1, 2, 4}');
  ok({ type: 'set', value: ['apple', 'Pear'] }, 'pear, Apple');

  assert.equal(check({ type: 'proof' }, 'anything').ok, null);
  assert.throws(() => check({ type: 'nope' }, ''));
});

test('answerTex', () => {
  assert.equal(answerTex({ type: 'number', value: '-3/4' }), '-\\frac{3}{4}');
  assert.equal(answerTex({ type: 'vector', value: [1, 2] }), '\\begin{bmatrix}1\\\\2\\end{bmatrix}');
  assert.equal(answerTex({ type: 'basis', value: [] }), '\\{\\,\\}');
  assert.equal(answerTex({ type: 'text', accept: ['onto'] }), '\\text{onto}');
  assert.equal(answerTex({ type: 'proof' }), '');
});

test('fnv64 known vectors and clipKey', () => {
  assert.equal(fnv64(''), 'cbf29ce484222325');
  assert.equal(fnv64('a'), 'af63dc4c8601ec8c');
  assert.equal(fnv64('foobar'), '85944171f73967e8');
  assert.match(clipKey('am_michael', 'Hello.'), /^[0-9a-f]{16}$/);
  assert.equal(clipKey('am_michael', 'Hello.'), clipKey('am_michael', 'Hello.'));
  assert.notEqual(clipKey('am_michael', 'Hello.'), clipKey('af_heart', 'Hello.'));
  assert.notEqual(clipKey('am_michael', 'Hello.'), clipKey('am_michael', 'Hello!'));
});

test('rng is deterministic and in range', () => {
  const a = rng(42);
  const b = rng(42);
  const xs = Array.from({ length: 20 }, () => a());
  assert.deepEqual(Array.from({ length: 20 }, () => b()), xs);
  assert.ok(xs.every((x) => x >= 0 && x < 1));
  assert.notDeepEqual(Array.from({ length: 20 }, rng(43)), xs);
  assert.deepEqual(Array.from({ length: 5 }, rng('seed')), Array.from({ length: 5 }, rng('seed')));
  const r = rng(7);
  for (let i = 0; i < 200; i++) {
    const n = r.int(-3, 3);
    assert.ok(Number.isInteger(n) && n >= -3 && n <= 3);
    assert.notEqual(r.nonzero(-2, 2), 0);
    assert.ok(['x', 'y'].includes(r.pick(['x', 'y'])));
  }
  assert.deepEqual(r.shuffle([1, 2, 3, 4, 5]).sort(), [1, 2, 3, 4, 5]);
});
