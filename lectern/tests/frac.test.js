/** Exact rationals (core/frac.js): parsing, arithmetic, normalization, sign, TeX. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { F, Frac, parseFrac, ZERO, ONE } from '../src/core/frac.js';

const s = (x) => x.toString();

test('parses integers, fractions, decimals and unicode minus', () => {
  assert.equal(s(F(3)), '3');
  assert.equal(s(F(-7n)), '-7');
  assert.equal(s(F('-3/4')), '-3/4');
  assert.equal(s(F('6/8')), '3/4');
  assert.equal(s(F('2/-4')), '-1/2');
  assert.equal(s(F('0.25')), '1/4');
  assert.equal(s(F('-.5')), '-1/2');
  assert.equal(s(F(' 1 / 3 ')), '1/3');
  assert.equal(s(F('\u22122')), '-2');
  assert.equal(s(F(0.1)), '1/10');
  assert.equal(s(F(1, 3)), '1/3');
  assert.equal(s(F('1/2', '3/4')), '2/3');
  const half = F('1/2');
  assert.equal(F(half), half);
});

test('rejects what is not a number', () => {
  assert.equal(parseFrac('abc'), null);
  assert.equal(parseFrac('1/0'), null);
  assert.equal(parseFrac(''), null);
  assert.equal(parseFrac('.'), null);
  assert.equal(parseFrac('1e3'), null);
  assert.throws(() => F('x'), SyntaxError);
  assert.throws(() => F(Infinity), RangeError);
  assert.throws(() => new Frac(1n, 0n), RangeError);
});

test('arithmetic is exact', () => {
  assert.equal(s(F('1/3').add('1/6')), '1/2');
  assert.equal(s(F('1/3').sub('1/2')), '-1/6');
  assert.equal(s(F('2/3').mul('9/4')), '3/2');
  assert.equal(s(F('2/3').div('4/9')), '3/2');
  assert.equal(s(F('-2/3').neg()), '2/3');
  assert.equal(s(F('-2/3').inv()), '-3/2');
  assert.equal(s(F('-2/3').abs()), '2/3');
  assert.throws(() => F(1).div(0), RangeError);
  // 0.1 + 0.2 is exactly 3/10
  assert.ok(F(0.1).add(F(0.2)).eq('3/10'));
  // Large values stay exact
  assert.equal(s(F('1/3').mul(F(10n ** 30n))), `${10n ** 30n}/3`);
});

test('normalization: lowest terms, positive denominator, frozen', () => {
  const x = new Frac(-6n, -8n);
  assert.equal(x.n, 3n);
  assert.equal(x.d, 4n);
  const y = new Frac(6n, -8n);
  assert.equal(y.n, -3n);
  assert.equal(y.d, 4n);
  assert.equal(s(new Frac(0n, -5n)), '0');
  assert.equal(new Frac(0n, 7n).d, 1n);
  assert.ok(Object.isFrozen(x));
  assert.ok(F('4/2').isInt);
  assert.ok(ZERO.zero);
  assert.ok(ONE.eq(F('3/3')));
});

test('sign, comparison and valueOf', () => {
  assert.equal(F('-1/2').sign(), -1);
  assert.equal(ZERO.sign(), 0);
  assert.equal(F('1/2').sign(), 1);
  assert.equal(F('1/3').cmp('1/2'), -1);
  assert.equal(F('1/2').cmp('2/4'), 0);
  assert.equal(F('-1/2').cmp('-2/3'), 1);
  assert.equal(F('3/4').valueOf(), 0.75);
  assert.equal(JSON.stringify({ x: F('-3/4') }), '{"x":"-3/4"}');
});

test('tex', () => {
  assert.equal(F(5).tex(), '5');
  assert.equal(F(-5).tex(), '-5');
  assert.equal(F('3/4').tex(), '\\frac{3}{4}');
  assert.equal(F('-3/4').tex(), '-\\frac{3}{4}');
  assert.equal(F('-3/4').tex({ inline: true }), '-\\tfrac{3}{4}');
});
