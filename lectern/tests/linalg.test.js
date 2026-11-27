/** Exact linear algebra (core/linalg.js) on textbook (Lay) examples. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { F } from '../src/core/frac.js';
import {
  mat, vec, rref, applyRowOp, isEchelon, eqMat, eqVec, det, inverse, mul, mulVec, identity, solve, nullspace,
  colspace, rowspace, charPoly, rationalEigen, diagonalize, gramSchmidt, leastSquares, dot, addVec, scaleVec, rank,
  independent, inSpan, texMat, texRowOp, cofactor,
} from '../src/core/linalg.js';

const strs = (A) => A.map((row) => row.map(String));
const vstrs = (v) => v.map(String);

// Lay 1.2, Example 3 (an augmented matrix whose last column happens not to be a pivot column).
const LAY_1_2_EX3 = [
  [0, 3, -6, 6, 4, -5],
  [3, -7, 8, -5, 8, 9],
  [3, -9, 12, -9, 6, 15],
];

test('rref: Lay 1.2 Example 3', () => {
  const { R, pivots, rank: r, echelon } = rref(LAY_1_2_EX3);
  assert.deepEqual(strs(R), [
    ['1', '0', '-2', '3', '0', '-24'],
    ['0', '1', '-2', '2', '0', '-7'],
    ['0', '0', '0', '0', '1', '4'],
  ]);
  assert.deepEqual(pivots, [[0, 0], [1, 1], [2, 4]]);
  assert.equal(r, 3);
  assert.ok(isEchelon(echelon));
  assert.ok(isEchelon(R, { reduced: true }));
});

test('rref: Lay 1.2 Example 1 (a zero row)', () => {
  const { R, rank: r } = rref([[1, 2, 3, 4], [4, 5, 6, 7], [6, 7, 8, 9]]);
  assert.deepEqual(strs(R), [['1', '0', '-1', '-2'], ['0', '1', '2', '3'], ['0', '0', '0', '0']]);
  assert.equal(r, 2);
});

test('rref steps replayed with applyRowOp reproduce every intermediate and R', () => {
  for (const A of [LAY_1_2_EX3, [[1, 2, 3, 4], [4, 5, 6, 7], [6, 7, 8, 9]], [[0, 2, 1], [1, 0, 3], [2, 1, 0]]]) {
    for (const opts of [{}, { scaleInForward: true }]) {
      const { R, steps, echelon } = rref(A, opts);
      let M = mat(A);
      for (const step of steps) {
        M = applyRowOp(M, step);
        assert.ok(eqMat(M, step.after), `step ${step.op} ${step.i}`);
        assert.ok(['forward', 'backward'].includes(step.phase));
      }
      assert.ok(eqMat(M, R));
      const lastForward = steps.filter((s) => s.phase === 'forward').at(-1);
      if (lastForward) assert.ok(eqMat(lastForward.after, echelon));
    }
  }
  assert.throws(() => applyRowOp([[1]], { op: 'nope' }));
});

test('rref with augmented columns never pivots on them', () => {
  const { pivots } = rref([[1, 1, 2], [0, 0, 1]], { augmented: 1 });
  assert.deepEqual(pivots, [[0, 0]]);
});

test('isEchelon', () => {
  assert.ok(isEchelon([[2, 1, 3], [0, 0, 5], [0, 0, 0]]));
  assert.ok(!isEchelon([[2, 1, 3], [0, 0, 5], [0, 4, 0]]));
  assert.ok(!isEchelon([[0, 0, 0], [1, 0, 0]]));
  assert.ok(!isEchelon([[1, 2], [3, 4]]));
  assert.ok(!isEchelon([[2, 1], [0, 1]], { reduced: true }));
  assert.ok(!isEchelon([[1, 1], [0, 1]], { reduced: true }));
  assert.ok(isEchelon([[1, 0, 4], [0, 1, 2]], { reduced: true }));
  assert.ok(isEchelon([[0, 0], [0, 0]], { reduced: true }));
});

test('det: plain, with row swaps, singular', () => {
  assert.equal(String(det([[1, 2], [3, 4]])), '-2');
  assert.equal(String(det([[0, 1], [1, 0]])), '-1');
  assert.equal(String(det([[0, 2, 1], [1, 0, 3], [2, 1, 0]])), '13');
  assert.equal(String(det([[1, 5, 0], [2, 4, -1], [0, -2, 0]])), '-2'); // Lay 3.1
  assert.equal(String(det([[1, 2], [2, 4]])), '0');
  assert.equal(String(det([[1, 2, 3], [4, 5, 6], [7, 8, 9]])), '0');
  assert.equal(String(det([['1/2', 0], [0, '2/3']])), '1/3');
  assert.equal(String(det(identity(4))), '1');
  assert.throws(() => det([[1, 2, 3], [4, 5, 6]]), RangeError);
  // Cofactor expansion along row 1 agrees.
  const A = mat([[0, 2, 1], [1, 0, 3], [2, 1, 0]]);
  const expand = A[0].reduce((s, a, j) => s.add(a.mul(cofactor(A, 0, j))), F(0));
  assert.ok(expand.eq(det(A)));
});

test('inverse: Lay examples and round trip', () => {
  assert.deepEqual(strs(inverse([[2, 5], [-3, -7]])), [['-7', '-5'], ['3', '2']]);
  const A = mat([[0, 1, 2], [1, 0, 3], [4, -3, 8]]); // Lay 2.2 Example 7
  const Ai = inverse(A);
  assert.deepEqual(strs(Ai), [['-9/2', '7', '-3/2'], ['-2', '4', '-1'], ['3/2', '-2', '1/2']]);
  assert.ok(eqMat(mul(A, Ai), identity(3)));
  assert.ok(eqMat(mul(Ai, A), identity(3)));
  assert.equal(inverse([[1, 2], [2, 4]]), null);
});

test('solve: unique (Lay 1.1)', () => {
  const r = solve([[1, -2, 1], [0, 2, -8], [-4, 5, 9]], [0, 8, -9]);
  assert.equal(r.kind, 'unique');
  assert.deepEqual(vstrs(r.x), ['29', '16', '3']);
});

test('solve: inconsistent (Lay 1.1 Example 3)', () => {
  assert.equal(solve([[0, 1, -4], [2, -3, 2], [5, -8, 7]], [8, 1, 1]).kind, 'none');
});

test('solve: infinitely many (Lay 1.5), parametric form checks A(p + t b) = b', () => {
  const A = mat([[3, 5, -4], [-3, -2, 4], [6, 1, -8]]);
  const b = vec([7, -1, -4]);
  const r = solve(A, b);
  assert.equal(r.kind, 'infinite');
  assert.deepEqual(vstrs(r.particular), ['-1', '2', '0']);
  assert.deepEqual(r.basis.map(vstrs), [['4/3', '0', '1']]);
  assert.deepEqual(r.free, [2]);
  for (const t of [-2, 0, '1/3', 5]) assert.ok(eqVec(mulVec(A, addVec(r.particular, scaleVec(F(t), r.basis[0]))), b));
});

test('nullspace and colspace (Lay 4.2)', () => {
  const A = mat([[-3, 6, -1, 1, -7], [1, -2, 2, 3, -1], [2, -4, 5, 8, -4]]);
  const N = nullspace(A);
  assert.deepEqual(N.map(vstrs), [['2', '1', '0', '0', '0'], ['1', '0', '-2', '1', '0'], ['-3', '0', '2', '0', '1']]);
  for (const v of N) assert.ok(mulVec(A, v).every((x) => x.zero));
  assert.ok(independent(N));
  assert.deepEqual(colspace(A).map(vstrs), [['-3', '1', '2'], ['-1', '2', '5']]);
  assert.equal(rowspace(A).length, rank(A));
  assert.equal(rank(A) + N.length, 5); // rank theorem
  assert.deepEqual(nullspace([[1, 0], [0, 1]]), []);
  assert.ok(inSpan(vec([1, 3, 7]), colspace(A)) === (solve(A, [1, 3, 7]).kind !== 'none'));
});

test('charPoly, rationalEigen, diagonalize (PDP⁻¹ = A)', () => {
  assert.deepEqual(vstrs(charPoly([[2, 3], [3, -6]])), ['1', '4', '-21']);
  assert.deepEqual(rationalEigen([[2, 3], [3, -6]]).map((e) => [String(e.value), e.mult]), [['3', 1], ['-7', 1]]);
  const A = mat([[1, 3, 3], [-3, -5, -3], [3, 3, 1]]); // Lay 5.3 Example 3
  assert.deepEqual(vstrs(charPoly(A)), ['1', '3', '0', '-4']); // (λ − 1)(λ + 2)²
  assert.deepEqual(rationalEigen(A).map((e) => [String(e.value), e.mult]), [['1', 1], ['-2', 2]]);
  const { P, D, values } = diagonalize(A);
  assert.deepEqual(vstrs(values), ['1', '-2', '-2']);
  assert.ok(eqMat(mul(mul(P, D), inverse(P)), A));
  assert.equal(diagonalize([[2, 4, 3], [-4, -6, -3], [3, 3, 1]]), null); // Lay 5.3 Example 4
  assert.equal(diagonalize([[1, 1], [0, 1]]), null);
  assert.deepEqual(rationalEigen([[0, 1], [0, 0]]).map((e) => [String(e.value), e.mult]), [['0', 2]]);
});

test('gramSchmidt gives an orthogonal basis (Lay 6.4 Example 2)', () => {
  const xs = [[1, 1, 1, 1], [0, 1, 1, 1], [0, 0, 1, 1]];
  const vs = gramSchmidt(xs);
  assert.deepEqual(vs.map(vstrs), [['1', '1', '1', '1'], ['-3/4', '1/4', '1/4', '1/4'], ['0', '-2/3', '1/3', '1/3']]);
  for (let i = 0; i < vs.length; i++) for (let j = i + 1; j < vs.length; j++) assert.ok(dot(vs[i], vs[j]).zero);
  for (const x of xs) assert.ok(inSpan(vec(x), vs));
  assert.equal(gramSchmidt([[1, 2], [2, 4]]).length, 1); // dependent input drops out
});

test('leastSquares (Lay 6.5 Example 1)', () => {
  const r = leastSquares([[4, 0], [0, 2], [1, 1]], [2, 0, 11]);
  assert.equal(r.kind, 'unique');
  assert.deepEqual(vstrs(r.x), ['1', '2']);
});

test('formatting', () => {
  assert.equal(texMat(mat([[1, '1/2'], [0, -1]])), '\\begin{bmatrix}1 & \\frac{1}{2} \\\\ 0 & -1\\end{bmatrix}');
  assert.ok(texMat(mat([[1, 2, 3]]), { augment: 2 }).includes('{cc|c}'));
  assert.equal(texRowOp({ op: 'swap', i: 0, j: 2 }), 'R_1 \\leftrightarrow R_3');
  assert.equal(texRowOp({ op: 'add', i: 1, j: 0, k: F(-3) }), 'R_2 \\to R_2 - 3R_1');
  assert.equal(texRowOp({ op: 'scale', i: 0, k: F('1/3') }), 'R_1 \\to \\tfrac{1}{3}R_1');
});
