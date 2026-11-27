/**
 * Lecture 24 · Orthogonal projections and Gram–Schmidt (Lay 6.3–6.4). Design: matrix/PLAN.md § 24.
 * Every vector, projection, matrix and answer below is computed with core/linalg.js (exact fractions).
 */
import { C } from '../../lectern/src/core/stage.js';
import { F } from '../../lectern/src/core/frac.js';
import { ease } from '../../lectern/src/core/tween.js';
import { vec, dot, norm2, proj, addVec, subVec, scaleVec, gramSchmidt, add, scale, mulVec, fromCols, texMat } from '../../lectern/src/core/linalg.js';

// ---------------------------------------------------------------- data

const t = (x) => F(x).tex({ inline: true });
/** Tuple with display-size fractions (inline \tfrac shrinks below the stage minimum). */
const tupD = (v) => `(${v.map((x) => F(x).tex()).join(', ')})`;
const tup = (v) => `(${v.map(t).join(', ')})`;
const num = (v) => v.map(Number);
const outer = (u) => u.map((a) => u.map((b) => F(a).mul(b)));

/** Beats 1–2, 5, 7: W = Span{u1, u2} (orthogonal) and y. */
const U1 = vec([1, 1, 0]);
const U2 = vec([1, -1, 1]);
const Y = vec([3, 1, 4]);
const YU1 = dot(Y, U1), U1U1 = norm2(U1);
const YU2 = dot(Y, U2), U2U2 = norm2(U2);
const P1 = proj(Y, U1);
const P2 = proj(Y, U2);
const YHAT = addVec(P1, P2);
const Z = subVec(Y, YHAT);
const ZZ = norm2(Z); // ‖z‖² = 6
/** Normal of W (u1 × u2), for the plane patch. */
const NORMAL = [U1[1] * U2[2] - U1[2] * U2[1], U1[2] * U2[0] - U1[0] * U2[2], U1[0] * U2[1] - U1[1] * U2[0]].map(Number);

/** Beat 3: the same plane with a non-orthogonal spanning set {x1, x2}. */
const X1 = U1;
const X2 = vec([0, 2, -1]);
const WP1 = proj(Y, X1);
const WP2 = proj(Y, X2);
const WRONG = addVec(WP1, WP2);
const X1X2 = dot(X1, X2);

/** Beat 7: P = UUᵀ with U the normalized u1, u2: Σ u uᵀ / (u·u). */
const PMAT = add(scale(F(1).div(U1U1), outer(U1)), scale(F(1).div(U2U2), outer(U2)));
const PY = mulVec(PMAT, Y);
const PZ = mulVec(PMAT, Z);

/** Beat 8: Gram–Schmidt on x1, x2 (same plane). */
const GS = gramSchmidt([X1, X2]);
const V1 = GS[0];
const V2 = GS[1];
const GSP = proj(X2, V1);
const GSC = dot(X2, V1).div(norm2(V1));

/** Beat 10: QR of A = [x1 x2]. */
const QA = fromCols([X1, X2]);
const integerSqrt = (n) => {
  const r = Math.round(Math.sqrt(n));
  return r * r === n ? r : null;
};
/** √n simplified: [a, b] with √n = a√b. */
function simpSqrt(n) {
  let a = 1, b = n;
  for (let k = 2; k * k <= b; k++) while (b % (k * k) === 0) {
    b /= k * k;
    a *= k;
  }
  return [a, b];
}
const sqrtTex = (n) => {
  const [a, b] = simpSqrt(n);
  return b === 1 ? `${a}` : `${a === 1 ? '' : a}\\sqrt{${b}}`;
};
/** TeX for k / √n (k a Frac, n a positive integer). */
function overSqrt(k, n) {
  k = F(k);
  if (k.zero) return '0';
  const r = integerSqrt(n);
  if (r) return t(k.div(r));
  const c = k.div(n); // k/√n = (k/n)·√n
  const [a, b] = simpSqrt(n);
  const cc = c.mul(a);
  const coef = cc.eq(1) ? '' : cc.eq(-1) ? '-' : t(cc);
  return `${coef}\\sqrt{${b}}`;
}
/** Q's entry e/√n written Lay's way, 1/√2. */
const qEntry = (e, n) => (F(e).zero ? '0' : `${F(e).sign() < 0 ? '-' : ''}${t(F(e).abs())}/\\sqrt{${n}}`);
/** `\frac{1}{d}\begin{bmatrix}…\end{bmatrix}` with integer entries (d = common denominator). */
function texScaled(M) {
  const lcm = (a, b) => (a * b) / gcd(a, b);
  const d = M.flat().reduce((acc, x) => lcm(acc, Number(F(x).d)), 1);
  return `\\frac{1}{${d}}${texMat(scale(F(d), M))}`;
}
const VN = GS.map((v) => Number(norm2(v)));
const QTEX = [0, 1, 2].map((i) => GS.map((v, k) => qEntry(v[i], VN[k])));
const RTEX = GS.map((v, i) => [X1, X2].map((x, j) => (j < i ? '0' : overSqrt(dot(v, x), VN[i]))));

// ---------------------------------------------------------------- TeX helpers

function paint(tex, name, color) {
  for (const el of tex.part(name)) el.style.color = color;
  return tex;
}
const checked = (s, tex, opts) => paint(s.tex(`${tex}\\ \\part{ck}{\\checkmark}`, opts), 'ck', C.green);

/** A straight segment a → b in a space (an arrow without a head). */
const seg = (sp, a, b, opts = {}) =>
  sp.vector(num(b).map((x, i) => x - Number(a[i])), { tail: num(a), head: 0, width: 3, dash: '8 7', color: C.yellow, ...opts });
/** A right-angle mark at `at` between directions d1 and d2 (model units, `size` long). */
function corner(s, sp, at, d1, d2, { size = 0.4, color = C.ink, visible = false } = {}) {
  const unit = (d) => {
    const v = num(d), L = Math.hypot(...v);
    return v.map((x) => (x * size) / L);
  };
  const a = num(at), e1 = unit(d1), e2 = unit(d2);
  const p = a.map((x, i) => x + e1[i]), q = a.map((x, i) => x + e1[i] + e2[i]), r = a.map((x, i) => x + e2[i]);
  return s.group(seg(sp, p, q, { color, dash: null, width: 2.5, visible }), seg(sp, q, r, { color, dash: null, width: 2.5, visible }));
}
const appear = (mob, opts = {}) => mob.fadeIn({ shift: [0, 0], ...opts });

// ---------------------------------------------------------------- workout data

/** Orthogonal integer pairs in R³ (generate permutes coordinates and flips signs, which keeps them orthogonal). */
const PAIRS = [
  [[1, 1, 0], [1, -1, 1]],
  [[1, 2, 2], [2, 1, -2]],
  [[1, 0, 1], [1, 2, -1]],
  [[2, 1, 0], [-1, 2, 1]],
  [[1, 1, 1], [1, -2, 1]],
];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));

function projectItem(u1, u2, y) {
  [u1, u2, y] = [u1, u2, y].map(vec);
  const a = dot(y, u1), aa = norm2(u1), b = dot(y, u2), bb = norm2(u2);
  const yhat = addVec(proj(y, u1), proj(y, u2));
  const z = subVec(y, yhat);
  const zz = Number(norm2(z));
  return {
    prompt: `Let $\\mathbf{u}_1 = ${tup(u1)}$, $\\mathbf{u}_2 = ${tup(u2)}$, $W = \\operatorname{Span}\\{\\mathbf{u}_1, \\mathbf{u}_2\\}$ and $\\mathbf{y} = ${tup(y)}$. Find $\\operatorname{proj}_W\\mathbf{y}$.`,
    answer: { type: 'vector', value: yhat.map(String) },
    hints: [
      `The basis is orthogonal: $${tup(u1)}\\cdot${tup(u2)} = ${t(dot(u1, u2))}$. So you may project onto each vector and add.`,
      `$\\mathbf{y}\\cdot\\mathbf{u}_1 = ${t(a)}$, $\\mathbf{u}_1\\cdot\\mathbf{u}_1 = ${t(aa)}$, $\\mathbf{y}\\cdot\\mathbf{u}_2 = ${t(b)}$, $\\mathbf{u}_2\\cdot\\mathbf{u}_2 = ${t(bb)}$.`,
    ],
    solution: [
      `Check orthogonality: $\\mathbf{u}_1\\cdot\\mathbf{u}_2 = ${t(dot(u1, u2))}$, so the projection formula applies.`,
      `$\\operatorname{proj}_W\\mathbf{y} = \\frac{${t(a)}}{${t(aa)}}${tup(u1)} + \\frac{${t(b)}}{${t(bb)}}${tup(u2)} = ${tup(yhat)}$.`,
      `Check: $\\mathbf{z} = \\mathbf{y} - \\hat{\\mathbf{y}} = ${tup(z)}$ has $\\mathbf{z}\\cdot\\mathbf{u}_1 = ${t(dot(z, u1))}$ and $\\mathbf{z}\\cdot\\mathbf{u}_2 = ${t(dot(z, u2))}$, so it is orthogonal to $W$.`,
      `The distance from $\\mathbf{y}$ to $W$ is $\\|\\mathbf{z}\\| = ${zz ? sqrtTex(zz) : '0'}$.`,
    ],
  };
}
const WO = projectItem([1, 1, 0], [1, -1, 1], [2, 0, 7]);

/** y = c1·u1 + c2·u2 + k·n (n ⊥ W) with integer weights, so the projection c1·u1 + c2·u2 has integer entries. */
function generateProject(rand) {
  for (;;) {
    const [a0, b0] = rand.pick(PAIRS);
    const perm = rand.shuffle([0, 1, 2]);
    const sg = [0, 1, 2].map(() => (rand() < 0.5 ? -1 : 1));
    const tr = (v) => perm.map((p, i) => sg[i] * v[p]);
    const u1 = tr(a0), u2 = tr(b0);
    const n0 = cross(u1, u2);
    const g = n0.reduce(gcd, 0);
    const n = n0.map((x) => x / g);
    const c1 = rand.nonzero(-3, 3), c2 = rand.nonzero(-2, 2), k = rand.nonzero(-2, 2);
    const y = [0, 1, 2].map((i) => c1 * u1[i] + c2 * u2[i] + k * n[i]);
    if (y.some((x) => Math.abs(x) > 15) || y.every((x) => x === 0)) continue;
    return projectItem(u1, u2, y);
  }
}

/** Beat 11: Gram–Schmidt in R⁴. */
const GX = [[1, 1, 1, 1], [3, 1, 1, -1], [0, 1, 2, 1]].map(vec);
const GV = gramSchmidt(GX);
const GV3 = GV[2];
const GC = [dot(GX[1], GV[0]).div(norm2(GV[0])), dot(GX[2], GV[0]).div(norm2(GV[0])), dot(GX[2], GV[1]).div(norm2(GV[1]))];
const den = (v) => v.reduce((d, x) => (Number(x.d) > d ? Number(x.d) : d), 1);
const GV3S = scaleVec(F(den(GV3)), GV3);
const cf = (k) => (F(k).eq(1) ? '' : F(k).eq(-1) ? '-' : t(k));
/** `- 3(1, 1, 0)` / `+ \tfrac14(…)`: subtracting k·v, written with a clean sign. */
const minusTerm = (k, v) => `${F(k).sign() < 0 ? '+' : '-'} ${cf(F(k).abs())}${tup(v)}`;

// ---------------------------------------------------------------- shared scene builders

/** The 3D shadow picture (beats 1, 2, 5, 7): W, y, ŷ, the drop. `show` lists what starts visible. */
function shadow(s, show = [], { x = 650, y = 330, size = 440, wAt = [3.3, 2.7, 0.3] } = {}) {
  const on = (k) => show.includes(k);
  const sp = s.space({ x, y, size, range: 4.5, yaw: -100, pitch: 22, visible: on('sp') });
  const W = sp.plane({ normal: NORMAL, d: 0 }, { center: [2, 0, 1], extent: 3.4, color: C.teal, visible: on('W') });
  const wLab = sp.label(wAt, 'W', { color: C.teal, size: 40, visible: on('W') });
  const yv = sp.vector(num(Y), { color: C.blue, label: '\\mathbf{y}', visible: on('y') });
  const drop = seg(sp, Y, YHAT, { visible: on('drop') });
  const yh = sp.vector(num(YHAT), { color: C.green, label: '\\hat{\\mathbf{y}}', visible: on('yh') });
  const mark = corner(s, sp, YHAT, Z, U1, { visible: on('mark') });
  return { sp, W, wLab, yv, drop, yh, mark };
}

/** The Gram–Schmidt picture (beat 8 end state and the summary). */
function gsPicture(s, show = [], { x = 700, y = 290, size = 380 } = {}) {
  const on = (k) => show.includes(k);
  const sp = s.space({ x, y, size, range: 2.6, yaw: -125, pitch: 28, names: null, visible: on('sp') });
  const W = sp.plane({ normal: NORMAL, d: 0 }, { center: [0.8, 0, 0.6], extent: 1.7, color: C.teal, visible: on('W') });
  const x1 = sp.vector(num(X1), { color: C.blue, label: '\\mathbf{x}_1 = \\mathbf{v}_1', labelSize: 32, visible: on('x1') });
  const x2 = sp.vector(num(X2), { color: C.red, label: '\\mathbf{x}_2', visible: on('x2') });
  const drop = seg(sp, X2, GSP, { visible: on('drop') });
  const p = sp.vector(num(GSP), { color: C.yellow, width: 7, visible: on('p') });
  const v2 = sp.vector(num(V2), { color: C.green, label: '\\mathbf{v}_2', tail: on('v2home') ? [0, 0, 0] : num(GSP), visible: on('v2') });
  const mark = corner(s, sp, [0, 0, 0], V1, V2, { size: 0.3, visible: on('mark') });
  return { sp, W, x1, x2, drop, p, v2, mark };
}

const PROJ_FORMULA =
  '\\hat{\\mathbf{y}} = \\frac{\\mathbf{y}\\cdot\\mathbf{u}_1}{\\mathbf{u}_1\\cdot\\mathbf{u}_1}\\mathbf{u}_1 + \\frac{\\mathbf{y}\\cdot\\mathbf{u}_2}{\\mathbf{u}_2\\cdot\\mathbf{u}_2}\\mathbf{u}_2';

// ---------------------------------------------------------------- the lecture

export default {
  id: 'projections',
  title: 'Orthogonal projections and Gram–Schmidt',
  goals: [
    'Split y into a piece in W and a piece orthogonal to W, using an orthogonal basis of W',
    'Know the projection is the closest point of W to y, and compute distances to subspaces',
    'With orthonormal columns, project with the matrix UUᵀ',
    'Run Gram–Schmidt to build an orthogonal basis, and factor A = QR',
  ],
  beats: [
    // 1
    {
      id: 'shadow',
      title: 'The shadow on a plane',
      scene(s) {
        const o = shadow(s, [], { x: 690, size: 420 });
        o.dec = s.tex('\\mathbf{y} = \\hat{\\mathbf{y}} + \\mathbf{z}', { x: 210, y: 130, size: 48, visible: false });
        o.inW = s.tex('\\hat{\\mathbf{y}} \\in W', { x: 210, y: 220, size: 38, color: C.green, visible: false });
        o.perp = s.tex('\\mathbf{z} \\perp W', { x: 210, y: 280, size: 38, color: C.yellow, visible: false });
        o.nums = s.tex(`${texMat(Y.map((v) => [v]))} = ${texMat(YHAT.map((v) => [v]))} + ${texMat(Z.map((v) => [v]))}`, { x: 230, y: 440, size: 34, visible: false });
        return o;
      },
      steps: [
        {
          say: 'Here is a plane $W${W} through the origin in $\\mathbb{R}^3${R three}, and a vector $\\mathbf{y}${y} sticking up out of it. Every such $\\mathbf{y}${y} splits into two pieces: one lying in $W${W}, and one perpendicular to $W${W}.',
          do: async (s, o) => {
            await o.sp.draw();
            await s.all(appear(o.W), appear(o.wLab));
            await o.yv.grow();
            await o.dec.write();
          },
        },
        {
          say: 'Shine a light straight down onto the plane. The shadow of $\\mathbf{y}${y} is the piece in $W${W}. We call it $\\hat{\\mathbf{y}}${y hat}, the orthogonal projection of $\\mathbf{y}${y} onto $W${W}.',
          do: async (s, o) => {
            await o.drop.grow({ duration: 1000 });
            await s.all(o.yh.grow(), o.inW.fadeIn({ shift: [-14, 0] }));
          },
        },
        {
          say: 'What\'s left over, $\\mathbf{z} = \\mathbf{y} - \\hat{\\mathbf{y}}${z equals y minus y hat}, is the dashed drop, and it meets the plane at a right angle.',
          do: async (s, o) => {
            await appear(o.mark);
            await s.all(o.perp.fadeIn({ shift: [-14, 0] }), o.drop.indicate({ color: C.yellow }));
          },
        },
        {
          say: 'For this $\\mathbf{y}${y}, the shadow is $(4, 0, 2)${four, zero, two} and the leftover is $(-1, 1, 2)${minus one, one, two}. Turn the picture and you can see the drop stands straight up off the plane.',
          do: async (s, o) => {
            await o.nums.write({ duration: 1200 });
            await o.sp.orbit(35, 4500);
          },
        },
      ],
    },

    // 2
    {
      id: 'decomp-formula',
      title: 'The formula (Theorem 8)',
      scene(s) {
        const o = shadow(s, ['sp', 'W', 'y', 'drop', 'yh'], { x: 715, size: 370, wAt: [-4.36, -4.15, -0.11] });
        o.sp.setCamera(-65, 22);
        o.u1 = o.sp.vector(num(U1), { color: C.red, label: '\\mathbf{u}_1', visible: false });
        o.u2 = o.sp.vector(num(U2), { color: C.orange, label: '\\mathbf{u}_2', visible: false });
        o.l1 = o.sp.vector(num(P1), { color: C.red, width: 7, visible: false });
        o.l2 = o.sp.vector(num(P2), { color: C.orange, width: 7, visible: false });
        o.d1 = seg(o.sp, Y, P1, { color: C.red, width: 2.5, visible: false });
        o.d2 = seg(o.sp, Y, P2, { color: C.orange, width: 2.5, visible: false });
        o.um = corner(s, o.sp, [0, 0, 0], U1, U2, { size: 0.45 });
        o.f = s.tex(PROJ_FORMULA, { x: 252, y: 110, size: 32, visible: false });
        o.n1 = s.tex(`= \\frac{${t(YU1)}}{${t(U1U1)}}\\,\\col{red}{${tup(U1)}} + \\frac{${t(YU2)}}{${t(U2U2)}}\\,\\col{orange}{${tup(U2)}}`, { x: 240, y: 205, size: 32, visible: false });
        o.n2 = s.tex(`= ${tup(P1)} + ${tup(P2)}`, { x: 240, y: 275, size: 32, visible: false });
        o.n3 = s.tex(`= \\col{green}{${tup(YHAT)}}`, { x: 240, y: 330, size: 32, visible: false });
        o.orth = s.tex(`\\mathbf{u}_1\\cdot\\mathbf{u}_2 = ${t(dot(U1, U2))}`, { x: 240, y: 405, size: 34, visible: false });
        o.ck = checked(s, `\\mathbf{z}\\cdot\\mathbf{u}_1 = ${t(dot(Z, U1))},\\quad \\mathbf{z}\\cdot\\mathbf{u}_2 = ${t(dot(Z, U2))}`, { x: 252, y: 485, size: 34, visible: false });
        return o;
      },
      steps: [
        {
          say: 'How do we compute the shadow? Pick a basis $\\mathbf{u}_1${u one}, $\\mathbf{u}_2${u two} of $W${W} whose vectors are orthogonal. Project $\\mathbf{y}${y} onto each one separately, and add.',
          do: async (s, o) => {
            await s.all(o.u1.grow(), o.u2.grow({ delay: 300 }));
            await o.f.write({ duration: 1400 });
          },
        },
        {
          say: 'Onto $\\mathbf{u}_1${u one}: $\\tfrac{4}{2}${four over two} times $\\mathbf{u}_1${u one}. Onto $\\mathbf{u}_2${u two}: $\\tfrac{6}{3}${six over three} times $\\mathbf{u}_2${u two}. Put the two pieces tip to tail, and they land exactly on the shadow, $(4, 0, 2)${four, zero, two}.',
          do: async (s, o) => {
            await s.all(o.n1.write(), o.d1.grow(), o.l1.grow());
            await s.all(o.d2.grow(), o.l2.grow());
            await o.l2.moveTail(num(P1), { duration: 1100 });
            await o.n2.write();
            await s.all(o.n3.write(), o.yh.indicate({ color: C.green }));
          },
        },
        {
          say: 'This is Theorem 8, and it needs an orthogonal basis. Here $\\mathbf{u}_1 \\cdot \\mathbf{u}_2 = 0${u one dot u two equals zero}, so the two pieces don\'t overlap.',
          do: async (s, o) => {
            await s.all(o.orth.write(), appear(o.um));
            await o.um.indicate();
          },
        },
        {
          say: 'Check the leftover: $\\mathbf{z}${z} dotted with $\\mathbf{u}_1${u one} is zero, and dotted with $\\mathbf{u}_2${u two} is zero too. So $\\mathbf{z}${z} really is orthogonal to the whole plane.',
          do: async (s, o) => {
            await o.ck.write();
            await o.drop.indicate({ color: C.yellow });
          },
        },
      ],
    },

    // 3
    {
      id: 'mistake-nonorth',
      title: 'The trap: a basis that isn\'t orthogonal',
      scene(s) {
        const o = shadow(s, ['sp', 'W', 'y', 'drop', 'yh'], { x: 715, size: 370, wAt: [-4.36, -4.15, -0.11] });
        o.sp.setCamera(-65, 22);
        o.x1 = o.sp.vector(num(X1), { color: C.red, label: '\\mathbf{x}_1', visible: false });
        o.x2 = o.sp.vector(num(X2), { color: C.orange, label: '\\mathbf{x}_2', visible: false });
        o.l1 = o.sp.vector(num(WP1), { color: C.red, width: 7, visible: false });
        o.l2 = o.sp.vector(num(WP2), { color: C.orange, width: 7, visible: false });
        o.bad = o.sp.point(num(WRONG), { color: C.yellow, r: 11, visible: false });
        o.span = s.tex(`\\mathbf{x}_1 = ${tup(X1)},\\ \\mathbf{x}_2 = ${tup(X2)}`, { x: 250, y: 100, size: 30, visible: false });
        o.dot = s.tex(`\\mathbf{x}_1\\cdot\\mathbf{x}_2 = ${t(X1X2)} \\neq 0`, { x: 250, y: 170, size: 32, visible: false });
        o.sum = s.tex(`\\begin{aligned} &${tupD(WP1)} + ${tupD(WP2)} \\\\ &= \\col{yellow}{${tupD(WRONG)}} \\end{aligned}`, { x: 250, y: 285, size: 30, visible: false });
        o.neq = s.tex(`\\col{yellow}{${tupD(WRONG)}} \\neq \\col{green}{${tup(YHAT)}} = \\hat{\\mathbf{y}}`, { x: 250, y: 405, size: 30, visible: false });
        o.box = s.surround(o.sum, { visible: false });
        o.fix = s.text('First make the basis orthogonal: **Gram–Schmidt**.', { x: 250, y: 500, size: 30, width: 400, color: C.green, visible: false });
        return o;
      },
      steps: [
        {
          say: 'Here\'s the trap. The same plane $W${W} is also spanned by $(1, 1, 0)${one, one, zero} and $(0, 2, -1)${zero, two, minus one}. But these two are not orthogonal: their dot product is $2${two}.',
          do: async (s, o) => {
            await s.all(o.span.write(), o.x1.grow(), o.x2.grow({ delay: 300 }));
            await o.dot.write();
          },
        },
        {
          say: 'Use the formula anyway. Projecting onto each one gives $(2, 2, 0)${two, two, zero} and $(0, -\\tfrac{4}{5}, \\tfrac{2}{5})${zero, minus four fifths, two fifths}, and the sum is $(2, \\tfrac{6}{5}, \\tfrac{2}{5})${two, six fifths, two fifths}. That point is in the plane, but it is not the shadow.',
          do: async (s, o) => {
            await s.all(o.l1.grow(), o.l2.grow({ delay: 300 }));
            await o.l2.moveTail(num(WP1), { duration: 1100 });
            await s.all(o.bad.draw(), o.sum.write());
            await s.all(o.box.draw(), o.neq.write());
          },
        },
        {
          say: 'When the vectors aren\'t orthogonal, their line projections overlap, and adding them counts the shared part twice. So first make the basis orthogonal. That\'s exactly what Gram–Schmidt does, and it\'s coming up.',
          do: async (s, o) => {
            await s.all(o.l1.indicate({ color: C.yellow }), o.l2.indicate({ color: C.yellow }));
            await o.fix.fadeIn();
          },
        },
      ],
    },

    // 4
    {
      id: 'try-in-w',
      kind: 'try',
      title: 'Your turn',
      say: 'Quick one. Think about the shadow picture.',
      prompt: 'If $\\mathbf{y}$ already lies in $W$, what is $\\operatorname{proj}_W\\mathbf{y}$?',
      answer: { type: 'choice', value: 'a' },
      choices: [
        { id: 'a', label: '$\\mathbf{y}$ itself', why: 'Right: $\\mathbf{y} = \\mathbf{y} + \\mathbf{0}$ is already a decomposition with the first piece in $W$ and $\\mathbf{0} \\in W^\\perp$.' },
        { id: 'b', label: '$\\mathbf{0}$', why: 'That happens for $\\mathbf{y}$ in $W^\\perp$.' },
        { id: 'c', label: 'It depends on the basis of $W$', why: 'The projection is defined by $W$ alone; only the formula uses a basis.' },
      ],
      hint: 'Write $\\mathbf{y} = \\hat{\\mathbf{y}} + \\mathbf{z}$ with $\\hat{\\mathbf{y}} \\in W$ and $\\mathbf{z} \\perp W$. What choice works when $\\mathbf{y} \\in W$?',
      solution: [
        'The decomposition $\\mathbf{y} = \\hat{\\mathbf{y}} + \\mathbf{z}$ with $\\hat{\\mathbf{y}} \\in W$, $\\mathbf{z} \\in W^\\perp$ is unique (Theorem 8).',
        'If $\\mathbf{y} \\in W$, then $\\mathbf{y} = \\mathbf{y} + \\mathbf{0}$ is such a decomposition, so $\\operatorname{proj}_W\\mathbf{y} = \\mathbf{y}$: a vector lying in the plane is its own shadow.',
      ],
    },

    // 5
    {
      id: 'best-approx',
      title: 'The closest point (Theorem 9)',
      scene(s) {
        const o = shadow(s, ['sp', 'W', 'y', 'drop', 'yh', 'mark'], { x: 750, size: 330 });
        o.sp.setCamera(-80, 22);
        o.e1 = num(U1).map((x) => x / Math.sqrt(2));
        o.e2 = num(U2).map((x) => x / Math.sqrt(3));
        o.vAt = (r, th) => num(YHAT).map((c, i) => c + r * (Math.cos(th) * o.e1[i] + Math.sin(th) * o.e2[i]));
        o.th0 = 3.8;
        o.v0 = o.vAt(1.7, o.th0);
        o.v = o.sp.point(o.v0, { color: C.orange, r: 10, label: '\\mathbf{v}', labelColor: C.orange, visible: false });
        o.yv2 = seg(o.sp, Y, o.v0, { color: C.orange, dash: null, width: 3.5, visible: false });
        o.hv = seg(o.sp, YHAT, o.v0, { color: C.green, width: 3, visible: false });
        o.eq = s.tex('\\mathbf{y} - \\mathbf{v} = (\\mathbf{y} - \\hat{\\mathbf{y}}) + (\\hat{\\mathbf{y}} - \\mathbf{v})', { x: 260, y: 100, size: 30, visible: false });
        o.py = s.tex('\\|\\mathbf{y} - \\mathbf{v}\\|^2 = \\|\\mathbf{z}\\|^2 + \\|\\hat{\\mathbf{y}} - \\mathbf{v}\\|^2', { x: 260, y: 175, size: 30, visible: false });
        o.read = s.tex('\\|\\mathbf{y} - \\mathbf{v}\\| \\approx 0.00', { x: 260, y: 290, size: 36, color: C.orange, visible: false });
        o.floor = s.tex(`\\ge \\|\\mathbf{z}\\| = \\sqrt{${t(ZZ)}} \\approx ${Math.sqrt(Number(ZZ)).toFixed(2)}`, { x: 260, y: 360, size: 36, color: C.green, visible: false });
        o.dist = s.tex(`\\text{distance} = \\|\\mathbf{y} - \\hat{\\mathbf{y}}\\| = \\sqrt{${t(ZZ)}}`, { x: 260, y: 470, size: 34, color: C.green, visible: false });
        o.place = (p) => {
          o.v.coords = p;
          o.v.redraw();
          o.yv2.setCoords(p.map((x, i) => x - Number(Y[i])));
          o.hv.setCoords(p.map((x, i) => x - Number(YHAT[i])));
          const d = Math.hypot(...p.map((x, i) => x - Number(Y[i])));
          o.read.setTex(`\\|\\mathbf{y} - \\mathbf{v}\\| \\approx ${d.toFixed(2)}`);
        };
        o.place(o.v0);
        return o;
      },
      steps: [
        {
          say: 'Why call the shadow the best approximation? Take any other point $\\mathbf{v}${v} in $W${W}. The path from $\\mathbf{v}${v} up to $\\mathbf{y}${y} splits into two legs: along the plane to $\\hat{\\mathbf{y}}${y hat}, then straight up to $\\mathbf{y}${y}.',
          do: async (s, o) => {
            await o.v.draw();
            await s.all(o.yv2.grow(), o.hv.grow());
            await o.eq.write({ duration: 1300 });
          },
        },
        {
          say: 'Those two legs are perpendicular, so Pythagoras says the straight path is longer than the vertical leg alone. Move $\\mathbf{v}${v} around the plane: the distance never drops below $\\sqrt{6}${root six}.',
          do: async (s, o) => {
            await s.all(o.py.write(), o.read.fadeIn(), o.floor.fadeIn({ delay: 400 }));
            await s.clock.tween({
              duration: 5000,
              ease: ease.inOut,
              update: (k) => o.place(o.vAt(1.7 - 0.6 * Math.sin(Math.PI * k), o.th0 + 2 * Math.PI * k)),
            });
          },
        },
        {
          say: 'The minimum happens only when $\\mathbf{v}${v} reaches $\\hat{\\mathbf{y}}${y hat}. That\'s Theorem 9: the shadow is the closest point of $W${W} to $\\mathbf{y}${y}, and the distance from $\\mathbf{y}${y} to $W${W} is $\\|\\mathbf{z}\\| = \\sqrt{6}${the length of z, root six}.',
          do: async (s, o) => {
            await s.clock.tween({ duration: 1800, ease: ease.inOut, update: (k) => o.place(o.vAt(1.7 * (1 - k), o.th0)) });
            await s.all(o.v.fadeOut(), o.yv2.fadeOut(), o.hv.fadeOut(), o.read.fadeOut(), o.floor.fadeOut());
            await s.all(o.drop.indicate({ color: C.yellow }), o.dist.write());
          },
        },
      ],
    },

    // 6
    {
      id: 'wo-project',
      kind: 'workout',
      title: 'Work it out',
      say: 'Grab paper. Project $\\mathbf{y}${y} onto the plane $W${W}, and check that your leftover is orthogonal to it.',
      prompt: WO.prompt,
      answer: WO.answer,
      hints: WO.hints,
      solution: WO.solution,
      generate: generateProject,
    },

    // 7
    {
      id: 'orthonormal-proj',
      title: 'With orthonormal columns: UUᵀy',
      scene(s) {
        const o = {};
        o.thm = s.defCard({
          x: 480, y: 28, anchor: [0.5, 0], width: 900, kind: 'theorem', title: 'Theorem 10',
          body: 'If $U = [\\mathbf{q}_1 \\cdots \\mathbf{q}_p]$ has orthonormal columns spanning $W$, then $\\operatorname{proj}_W\\mathbf{y} = UU^T\\mathbf{y}$.',
          visible: false,
        });
        o.U = s.tex(`U = \\begin{bmatrix} ${[0, 1, 2].map((i) => `${qEntry(U1[i], 2)} & ${qEntry(U2[i], 3)}`).join(' \\\\ ')} \\end{bmatrix}`, { x: 255, y: 369, size: 32, visible: false });
        o.form = s.tex('\\mathbf{q}_j = \\frac{\\mathbf{u}_j}{\\|\\mathbf{u}_j\\|}:\\quad (\\mathbf{y}\\cdot\\mathbf{q}_1)\\mathbf{q}_1 + (\\mathbf{y}\\cdot\\mathbf{q}_2)\\mathbf{q}_2 = UU^T\\mathbf{y}', { x: 480, y: 255, size: 30, visible: false });
        o.utu = s.tex('U^TU = \\begin{bmatrix}1 & 0\\\\ 0 & 1\\end{bmatrix} = I_2', { x: 690, y: 375, size: 32, color: C.ink, visible: false });
        o.uut = s.tex(`UU^T = ${texScaled(PMAT)}`, { x: 280, y: 509, size: 30, visible: false });
        o.py = s.tex(`UU^T\\mathbf{y} = \\part{r}{${tup(PY)}}`, { x: 720, y: 470, size: 32, visible: false });
        paint(o.py, 'r', C.green);
        o.pz = s.tex(`UU^T\\mathbf{z} = ${tup(PZ)}`, { x: 720, y: 535, size: 32, visible: false });
        o.not = s.tex('\\neq I_3', { x: 0, y: 0, size: 34, color: C.yellow, visible: false });
        return o;
      },
      steps: [
        {
          say: 'If each basis vector also has length one, the division disappears. Scale $\\mathbf{u}_1${u one} and $\\mathbf{u}_2${u two} to unit vectors $\\mathbf{q}_1${q one} and $\\mathbf{q}_2${q two}, put them in the columns of $U${U}, and the whole formula becomes one matrix product: $UU^T\\mathbf{y}${U U transpose y}.',
          do: async (s, o) => {
            await o.thm.reveal();
            await o.U.write({ duration: 1200 });
            await o.form.write({ duration: 1200 });
          },
        },
        {
          say: 'Careful with the order. $U^TU${U transpose U} is the two by two identity, because the columns are orthonormal.',
          do: async (s, o) => {
            await o.utu.write();
            await o.utu.indicate({ color: C.green });
          },
        },
        {
          say: 'But $UU^T${U U transpose} is three by three, and it is not the identity. It\'s the projection matrix onto $W${W}: it sends $\\mathbf{y}${y} to its shadow $(4, 0, 2)${four, zero, two}, and it flattens the perpendicular $\\mathbf{z}${z} to zero.',
          do: async (s, o) => {
            await s.all(o.form.fadeOut(), o.thm.animate({ opacity: 0.45 }));
            await o.uut.write({ duration: 1200 });
            const b = o.uut.box();
            o.not.set({ x: b.x + b.w + 50, y: b.y + b.h / 2 });
            await o.not.fadeIn({ shift: [0, 0] });
            await o.not.fadeOut({ delay: 600 });
            await o.py.write();
            await o.pz.write();
          },
        },
      ],
    },

    // 8
    {
      id: 'gram-schmidt',
      title: 'Gram–Schmidt',
      scene(s) {
        const o = gsPicture(s);
        o.l1 = s.tex(`\\mathbf{v}_1 = \\mathbf{x}_1 = ${tup(V1)}`, { x: 230, y: 90, size: 32, color: C.blue, visible: false });
        o.l2 = s.tex('\\mathbf{v}_2 = \\mathbf{x}_2 - \\frac{\\mathbf{x}_2\\cdot\\mathbf{v}_1}{\\mathbf{v}_1\\cdot\\mathbf{v}_1}\\mathbf{v}_1', { x: 230, y: 170, size: 32, visible: false });
        o.l3 = s.tex(`= ${tup(X2)} - \\frac{${t(dot(X2, V1))}}{${t(norm2(V1))}}${tup(V1)}`, { x: 230, y: 245, size: 30, visible: false });
        o.l3b = s.tex(`= \\col{green}{${tup(V2)}}`, { x: 230, y: 315, size: 32, visible: false });
        o.ck = checked(s, `\\mathbf{v}_1\\cdot\\mathbf{v}_2 = ${t(dot(V1, V2))}`, { x: 230, y: 385, size: 32, visible: false });
        o.l4 = s.tex('\\mathbf{v}_3 = \\mathbf{x}_3 - \\frac{\\mathbf{x}_3\\cdot\\mathbf{v}_1}{\\mathbf{v}_1\\cdot\\mathbf{v}_1}\\mathbf{v}_1 - \\frac{\\mathbf{x}_3\\cdot\\mathbf{v}_2}{\\mathbf{v}_2\\cdot\\mathbf{v}_2}\\mathbf{v}_2', { x: 480, y: 520, size: 32, visible: false });
        o.box4 = s.surround(o.l4, { visible: false });
        return o;
      },
      steps: [
        {
          say: 'Gram–Schmidt turns any basis into an orthogonal one, with the same span. Start with $\\mathbf{x}_1${x one} and $\\mathbf{x}_2${x two}, the non-orthogonal pair from before. Keep the first vector as it is: $\\mathbf{v}_1 = \\mathbf{x}_1${v one equals x one}.',
          do: async (s, o) => {
            await o.sp.draw();
            await s.all(o.x1.grow(), o.x2.grow({ delay: 300 }));
            await o.l1.write();
          },
        },
        {
          say: 'From the second vector, subtract its projection onto the first. Here that projection is $\\tfrac{2}{2}${two over two} times $\\mathbf{v}_1${v one}. What\'s left is $\\mathbf{v}_2 = (-1, 1, -1)${v two, which is minus one, one, minus one}, and it\'s orthogonal to $\\mathbf{v}_1${v one}.',
          do: async (s, o) => {
            await o.l2.write({ duration: 1200 });
            await o.drop.grow({ duration: 900 });
            await o.p.grow();
            await o.v2.grow({ duration: 900 });
            await o.v2.moveTail([0, 0, 0], { duration: 1200 });
            await s.all(appear(o.mark), o.l3.write());
            await s.all(o.l3b.write(), o.ck.fadeIn({ delay: 400 }));
          },
        },
        {
          say: 'Nothing was lost: $\\mathbf{v}_2${v two} is built from $\\mathbf{x}_1${x one} and $\\mathbf{x}_2${x two}, so it lies in the same plane. Same span, but now an orthogonal basis.',
          do: async (s, o) => {
            await s.all(o.drop.fadeOut(), o.p.fadeOut());
            await o.W.animate({ opacity: 1 }, { duration: 900 });
            await o.sp.orbit(-30, 3500);
          },
        },
        {
          say: 'With more vectors, keep going: from each new $\\mathbf{x}${x}, subtract its projections onto all the $\\mathbf{v}${v}\'s you\'ve already built.',
          do: async (s, o) => {
            await o.l4.write({ duration: 1400 });
            await o.box4.draw();
          },
        },
      ],
    },

    // 9
    {
      id: 'fill-gs',
      kind: 'blanks',
      title: 'Fill in the blanks',
      say: 'Complete the third step of Gram–Schmidt. Which vectors do you project onto?',
      lines: [
        [
          {
            tex: '\\mathbf{v}_3 = \\mathbf{x}_3 - \\frac{\\mathbf{x}_3\\cdot\\blank{a}}{\\mathbf{v}_1\\cdot\\mathbf{v}_1}\\,\\mathbf{v}_1',
            blanks: { a: { chips: ['\\mathbf{v}_1', '\\mathbf{x}_1'], answer: '\\mathbf{v}_1' } },
          },
        ],
        [
          {
            tex: '\\phantom{\\mathbf{v}_3 = \\mathbf{x}_3} - \\frac{\\mathbf{x}_3\\cdot\\blank{b}}{\\mathbf{v}_2\\cdot\\mathbf{v}_2}\\,\\mathbf{v}_2',
            blanks: { b: { chips: ['\\mathbf{v}_2', '\\mathbf{x}_2'], answer: '\\mathbf{v}_2' } },
          },
        ],
      ],
      solution: [
        'Always project onto the *new* orthogonal vectors $\\mathbf{v}_1, \\mathbf{v}_2$, never the original $\\mathbf{x}$\'s: the projection formula only works with an orthogonal set, and $\\mathbf{x}_1, \\mathbf{x}_2$ need not be orthogonal.',
        'So $\\mathbf{v}_3 = \\mathbf{x}_3 - \\dfrac{\\mathbf{x}_3\\cdot\\mathbf{v}_1}{\\mathbf{v}_1\\cdot\\mathbf{v}_1}\\mathbf{v}_1 - \\dfrac{\\mathbf{x}_3\\cdot\\mathbf{v}_2}{\\mathbf{v}_2\\cdot\\mathbf{v}_2}\\mathbf{v}_2$, which is $\\mathbf{x}_3$ minus its projection onto $\\operatorname{Span}\\{\\mathbf{x}_1, \\mathbf{x}_2\\}$.',
      ],
    },

    // 10
    {
      id: 'qr',
      title: 'QR factorization (Theorem 12)',
      scene(s) {
        const o = {};
        o.A = s.tex(`A = [\\,\\mathbf{x}_1\\ \\mathbf{x}_2\\,] = ${texMat(QA)}`, { x: 240, y: 100, size: 32, visible: false });
        o.V = s.tex(`\\begin{aligned}\\mathbf{v}_1 &= ${tup(V1)} \\\\ \\mathbf{v}_2 &= ${tup(V2)}\\end{aligned}`, { x: 720, y: 100, size: 30, color: C.green, visible: false });
        o.Q = s.tex(`Q = \\begin{bmatrix} ${QTEX.map((r) => r.join(' & ')).join(' \\\\ ')} \\end{bmatrix}`, { x: 235, y: 268, size: 32, visible: false });
        o.R = s.matrix(RTEX, { x: 830, y: 268, size: 36, visible: false });
        o.Rl = s.tex('R = Q^TA =', { x: 0, y: 268, size: 32, anchor: [1, 0.5], visible: false });
        o.QR = s.defCard({
          x: 480, y: 464, width: 880, kind: 'theorem', title: 'Theorem 12 (QR factorization)',
          body: 'If the $m\\times n$ matrix $A$ has independent columns, $A = QR$: $Q$ has orthonormal columns spanning $\\operatorname{Col}A$; $R$ is $n\\times n$, upper triangular, invertible, positive diagonal.',
          visible: false,
        });
        return o;
      },
      steps: [
        {
          say: 'Gram–Schmidt gives a factorization. Put $\\mathbf{x}_1${x one} and $\\mathbf{x}_2${x two} in the columns of $A${A}. Run Gram–Schmidt, then divide each $\\mathbf{v}${v} by its length. Those unit vectors are the columns of $Q${Q}, which are orthonormal.',
          do: async (s, o) => {
            await o.A.write();
            await o.V.write();
            await o.Q.write({ duration: 1300 });
          },
        },
        {
          say: 'Since $Q^TQ = I${Q transpose Q is the identity}, we get $R = Q^TA${R equals Q transpose A}. It comes out upper triangular, with positive numbers on the diagonal: $\\sqrt{2}${root two} and $\\sqrt{3}${root three}.',
          do: async (s, o) => {
            const b = o.R.cellBox(0, 0);
            o.Rl.set({ x: b.x - 40 });
            await s.all(o.Rl.write(), o.R.fadeIn({ shift: [0, 0] }));
            await o.R.highlightCell(1, 0, C.yellow);
            await s.all(o.R.highlightCell(0, 0, C.green), o.R.highlightCell(1, 1, C.green));
          },
        },
        {
          say: 'So $A = QR${A equals Q R}: orthonormal columns times an upper triangular matrix. That\'s Theorem 12. Computers use this factorization to solve least-squares problems, which is next.',
          do: (s, o) => o.QR.reveal(),
        },
      ],
    },

    // 11
    {
      id: 'wo-gram-schmidt',
      kind: 'workout',
      title: 'Work it out',
      say: 'Your turn to run the whole process, three vectors in $\\mathbb{R}^4${R four}. Don\'t rescale along the way.',
      prompt: `Apply Gram–Schmidt to $\\mathbf{x}_1 = ${tup(GX[0])}$, $\\mathbf{x}_2 = ${tup(GX[1])}$, $\\mathbf{x}_3 = ${tup(GX[2])}$. Enter $\\mathbf{v}_3$ exactly as the process produces it (no rescaling).`,
      answer: { type: 'vector', value: GV3.map(String) },
      hints: [
        `$\\mathbf{v}_1 = \\mathbf{x}_1$ and $\\mathbf{v}_2 = \\mathbf{x}_2 - \\frac{${t(dot(GX[1], GV[0]))}}{${t(norm2(GV[0]))}}\\mathbf{v}_1 = ${tup(GV[1])}$.`,
        `$\\mathbf{x}_3\\cdot\\mathbf{v}_1 = ${t(dot(GX[2], GV[0]))}$, $\\mathbf{x}_3\\cdot\\mathbf{v}_2 = ${t(dot(GX[2], GV[1]))}$, $\\mathbf{v}_2\\cdot\\mathbf{v}_2 = ${t(norm2(GV[1]))}$.`,
      ],
      solution: [
        `$\\mathbf{v}_1 = \\mathbf{x}_1 = ${tup(GV[0])}$.`,
        `$\\mathbf{v}_2 = \\mathbf{x}_2 - \\frac{\\mathbf{x}_2\\cdot\\mathbf{v}_1}{\\mathbf{v}_1\\cdot\\mathbf{v}_1}\\mathbf{v}_1 = ${tup(GX[1])} ${minusTerm(GC[0], GV[0])} = ${tup(GV[1])}$.`,
        `$\\mathbf{v}_3 = \\mathbf{x}_3 - \\frac{${t(dot(GX[2], GV[0]))}}{${t(norm2(GV[0]))}}\\mathbf{v}_1 - \\frac{${t(dot(GX[2], GV[1]))}}{${t(norm2(GV[1]))}}\\mathbf{v}_2 = ${tup(GX[2])} ${minusTerm(GC[1], GV[0])} ${minusTerm(GC[2], GV[1])} = ${tup(GV3)}$.`,
        `Check: $\\mathbf{v}_3\\cdot\\mathbf{v}_1 = ${t(dot(GV3, GV[0]))}$ and $\\mathbf{v}_3\\cdot\\mathbf{v}_2 = ${t(dot(GV3, GV[1]))}$. (Rescaled, $${tup(GV3S)}$ works just as well as a basis vector.)`,
      ],
    },

    // 12
    {
      id: 'cp-gs',
      kind: 'explain',
      title: 'Explain it back',
      say: 'Before we wrap up, explain in your own words why Gram–Schmidt works.',
      prompt: 'Why does subtracting projections in Gram–Schmidt keep the span the same while making the vectors orthogonal?',
      points: [
        '$\\mathbf{v}_k = \\mathbf{x}_k - (\\text{a combination of } \\mathbf{v}_1, \\dots, \\mathbf{v}_{k-1})$, and each $\\mathbf{v}_i$ lies in $\\operatorname{Span}\\{\\mathbf{x}_1, \\dots, \\mathbf{x}_i\\}$, so the spans match step by step.',
        'Conversely $\\mathbf{x}_k$ is $\\mathbf{v}_k$ plus that combination, so nothing is lost.',
        'What is subtracted is exactly the projection of $\\mathbf{x}_k$ onto the span of the earlier vectors, so what remains lies in its orthogonal complement.',
        '$\\mathbf{v}_k \\neq \\mathbf{0}$ because the $\\mathbf{x}$\'s are linearly independent.',
      ],
    },

    // 13
    {
      id: 'summary-proj',
      title: 'Summary',
      scene(s) {
        const a = shadow(s, [], { x: 250, y: 320, size: 340 });
        a.sp.setCamera(-80, 22);
        const b = gsPicture(s, [], { x: 720, y: 300, size: 320 });
        b.x1.setLabel('\\mathbf{v}_1');
        const ta = s.text('Projection = sum of projections onto an **orthogonal** basis', { x: 250, y: 505, size: 30, width: 440, visible: false });
        const tb = s.text('Gram–Schmidt builds that basis', { x: 720, y: 525, size: 30, width: 420, visible: false });
        const best = s.tex('\\|\\mathbf{y} - \\hat{\\mathbf{y}}\\| = \\text{distance to } W', { x: 250, y: 70, size: 30, color: C.green, visible: false });
        return { a, b, ta, tb, best };
      },
      steps: [
        {
          say: 'To project onto a subspace, get an orthogonal basis, project onto each vector, and add the pieces.',
          do: async (s, o) => {
            await o.a.sp.draw();
            await s.all(appear(o.a.W), o.a.yv.grow());
            await s.all(o.a.drop.grow(), o.a.yh.grow({ delay: 400 }), appear(o.a.mark, { delay: 900 }));
            await o.ta.fadeIn();
          },
        },
        {
          say: 'The projection is the closest point of the subspace, and the leftover $\\mathbf{z}${z} measures the distance.',
          do: async (s, o) => {
            await o.a.drop.indicate({ color: C.yellow });
            await o.best.fadeIn();
          },
        },
        {
          say: 'And when your basis isn\'t orthogonal, Gram–Schmidt builds one: keep the first vector, and subtract projections from the rest.',
          do: async (s, o) => {
            await o.b.sp.draw();
            await s.all(appear(o.b.W), o.b.x1.grow(), o.b.x2.grow());
            await s.all(o.b.drop.grow(), o.b.p.grow({ delay: 300 }));
            await o.b.v2.grow();
            await s.all(o.b.v2.moveTail([0, 0, 0]), o.b.p.fadeOut(), o.b.drop.fadeOut());
            await s.all(appear(o.b.mark), o.tb.fadeIn());
          },
        },
      ],
    },
  ],
};
