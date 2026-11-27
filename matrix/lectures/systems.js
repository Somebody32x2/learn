/**
 * Lecture 1 · Systems of linear equations (Lay 1.1). Design: matrix/PLAN.md § 1.
 * Every matrix, row operation and answer below is computed with core/linalg.js.
 */
import { C } from '../../lectern/src/core/stage.js';
import { F } from '../../lectern/src/core/frac.js';
import { mat, vec, mulVec, rref, applyRowOp, det, isEchelon, texMat, texRowOp } from '../../lectern/src/core/linalg.js';

// ---------------------------------------------------------------- data

const X = ['x_1', 'x_2', 'x_3'];
/** The running example (beats 4, 6, 9, 10, 15): three planes through (1, 2, 3). */
const SYS = mat([[1, 1, 1, 6], [0, 1, 2, 8], [2, 1, -1, 1]]);
const RED = rref(SYS, { augmented: 1 });
const FWD = RED.steps.filter((st) => st.phase === 'forward');
const BWD = RED.steps.filter((st) => st.phase === 'backward');
const SOL = RED.R.map((row) => row[3]);

/** The two-row matrix of the mistake beat, and the illegal "simultaneous" update computed from the old rows. */
const TRAP = mat([[1, 1, 1, 6], [0, 1, 2, 8]]);
const TRAP_BAD = [TRAP[0].map((x, j) => x.sub(TRAP[1][j])), TRAP[1].map((x, j) => x.sub(TRAP[0][j]))];
const STRAY = vec([0, 0, 2]); // satisfies the broken system, not the original

/** An inconsistent system for the existence question at the end of solve-back. */
const INC = mat([[1, 1, 3], [1, 1, 1]]);
const INC_RED = rref(INC, { augmented: 1 });

/** Small demo matrix for the three row operations. */
const DEMO = [[2, 4], [1, 3]];

// ---------------------------------------------------------------- TeX helpers

const t = (x) => F(x).tex({ inline: true });

/** `2x_1 - x_2 + x_3` from coefficients. */
function lin(coefs, names = X) {
  let out = '';
  coefs.forEach((c0, j) => {
    const c = F(c0);
    if (c.zero) return;
    const a = c.abs();
    const coef = a.eq(1) ? '' : t(a);
    out += (c.sign() < 0 ? (out ? ' - ' : '-') : out ? ' + ' : '') + coef + names[j];
  });
  return out || '0';
}
const eqTex = (row, n = row.length - 1) => `${lin(row.slice(0, n))} = ${t(row[n])}`;

/** `2(1) + 2 - 3 = 1`: one equation with the point substituted. */
function substTex(row, x) {
  const n = x.length;
  let out = '';
  row.slice(0, n).forEach((c0, j) => {
    const c = F(c0);
    if (c.zero) return;
    const v = F(x[j]);
    const vt = v.sign() < 0 ? `(${t(v)})` : t(v);
    const a = c.abs();
    const term = a.eq(1) ? (c.sign() < 0 && v.zero ? '(0)' : vt) : `${t(a)}${v.sign() < 0 ? vt : `(${t(v)})`}`;
    out += (c.sign() < 0 ? (out ? ' - ' : '-') : out ? ' + ' : '') + term;
  });
  const lhs = row.slice(0, n).reduce((s, c, j) => s.add(F(c).mul(x[j])), F(0));
  return { tex: `${out || '0'} = ${t(lhs)}`, ok: lhs.eq(row[n]), lhs };
}

/**
 * The system typeset Lay-style (variables in columns, `alignedat`) with every term a named part: t<i><j>
 * (coefficient term, a phantom where the variable is missing) and b<i> (right side), so numbers can fly out of it.
 */
function systemArray(A, n = 3) {
  const rows = A.map((row, i) => {
    const cells = [];
    let started = false;
    for (let j = 0; j < n; j++) {
      const c = F(row[j]);
      const body = `${c.abs().eq(1) ? '' : t(c.abs())}${X[j]}`;
      const lead = !started && c.sign() < 0 ? '-' : '';
      if (j > 0) cells.push(c.zero || !started ? '' : c.sign() < 0 ? '{}-{}' : '{}+{}');
      cells.push(c.zero ? `\\part{t${i}${j}}{\\phantom{${X[j]}}}` : `\\part{t${i}${j}}{${lead}${body}}`);
      if (!c.zero) started = true;
    }
    return [...cells, '{}={}', `\\part{b${i}}{${t(row[n])}}`].join(' & ');
  });
  return `\\begin{alignedat}{${n + 1}}${rows.join(' \\\\ ')}\\end{alignedat}`;
}
const center = (b) => [b.x + b.w / 2, b.y + b.h / 2];

/** The plane n·x = n·p as a square patch of half-width `ext` centered on p. */
const planeAt = (sp, normal, p, ext, opts) =>
  sp.plane({ normal, d: normal.reduce((s0, v, k) => s0 + v * p[k], 0) }, { ...opts, center: p, extent: ext });

/** `tex ✓` with a green check mark. */
const checked = (s, tex, opts) => s.tex(`${tex}\\ \\col{green}{\\checkmark}`, opts);

// ---------------------------------------------------------------- workout data

/**
 * A 3×3 system with solution x: prompt, answer, hints and worked solution, all computed. `ops` (optional) is a
 * hand-friendly sequence of row operations to use instead of rref's; it must end at [I | x].
 */
function solve3Item(A0, x0, ops = null) {
  const A = mat(A0);
  const x = vec(x0);
  const b = mulVec(A, x);
  const aug = A.map((row, i) => [...row, b[i]]);
  let steps = rref(aug, { augmented: 1 }).steps.map(({ op, i, j, k, after }) => ({ op, i, j, k, after }));
  if (ops) {
    let M = aug;
    steps = ops.map((st) => {
      const step = { ...st, k: st.k === undefined ? undefined : F(st.k) };
      M = applyRowOp(M, step);
      return { ...step, after: M };
    });
    if (!M.every((row, r) => row.every((v, c) => v.eq(c === 3 ? x[r] : r === c ? 1 : 0)))) throw new Error('solve3Item: ops do not reach [I | x]');
  }
  const nFwd = steps.findIndex((st) => isEchelon(st.after.map((row) => row.slice(0, 3)))) + 1;
  const fwd = steps.slice(0, nFwd);
  const system = aug.map((row) => eqTex(row)).join(' \\\\ ');
  const checks = aug.map((row) => `$${substTex(row, x).tex}$`).join(', ');
  return {
    prompt: `Solve the system $$\\begin{aligned} ${system.replace(/ = /g, ' &= ')} \\end{aligned}$$ Enter $(x_1, x_2, x_3)$.`,
    answer: { type: 'vector', value: x.map(String) },
    hints: [
      `Write $[A \\mid \\mathbf{b}] = ${texMat(aug, { augment: 3 })}$ and clear column 1 below the top entry.`,
      `The forward phase: ${fwd.map((st) => `$${texRowOp(st)}$`).join(', ')} gives the echelon form $${texMat(fwd.at(-1).after, { augment: 3 })}$.`,
      'The last row now gives $x_3$ directly. Substitute upward (or keep clearing above the pivots).',
    ],
    solution: [
      `Row reduce $[A \\mid \\mathbf{b}] = ${texMat(aug, { augment: 3 })}$, one operation at a time:`,
      steps.map((st) => `- $${texRowOp(st)}$: $${texMat(st.after, { augment: 3 })}$`).join('\n'),
      `Read off the last column: $(x_1, x_2, x_3) = (${x.map(String).join(', ')})$.`,
      `Check in the original equations: ${checks}. All three hold.`,
    ],
  };
}
const WO_A = [[1, 1, 1], [2, -1, 1], [1, 2, -1]];
const WO_X = [2, -1, 1];
/** The plan's route for the fixed numbers: clear column 1, swap rows 2 and 3 to get a pivot of 1, then finish. */
const WO = solve3Item(WO_A, WO_X, [
  { op: 'add', i: 1, j: 0, k: -2 },
  { op: 'add', i: 2, j: 0, k: -1 },
  { op: 'swap', i: 1, j: 2 },
  { op: 'add', i: 2, j: 1, k: 3 },
  { op: 'scale', i: 2, k: '-1/7' },
  { op: 'add', i: 1, j: 2, k: 2 },
  { op: 'add', i: 0, j: 2, k: -1 },
  { op: 'add', i: 0, j: 1, k: -1 },
]);

/**
 * Fresh 3×3 systems with the plan's structure: integer solution in [−3, 3]³, A with entries in [−2, 2] and
 * det ±1 or ±2. Draws are kept hand-friendly: a 1 in the top-left corner, at least two unknowns per equation,
 * and an integer forward phase (fractions only appear, if at all, when scaling pivots at the end).
 */
function generateSolve3(rand) {
  for (;;) {
    const A = [0, 1, 2].map(() => [0, 1, 2].map(() => rand.int(-2, 2)));
    if (A[0][0] !== 1 || A.some((row) => row.filter((v) => v !== 0).length < 2)) continue;
    const d = det(mat(A)).abs();
    if (!(d.eq(1) || d.eq(2))) continue;
    const x = [0, 1, 2].map(() => rand.int(-3, 3));
    const b = mulVec(mat(A), vec(x));
    if (b.some((v) => v.abs().cmp(20) > 0)) continue;
    const red = rref(A.map((row, i) => [...row, b[i]]), { augmented: 1 });
    const nice = (st) => st.after.every((row) => row.every((v) => (st.phase === 'forward' ? v.d === 1n : v.d <= 6n) && v.abs().cmp(20) <= 0));
    if (!red.steps.every(nice)) continue;
    return solve3Item(A, x);
  }
}

// ---------------------------------------------------------------- shared scene builders

/** Beats 1–2: the plane with x1 + x2 = 3. */
function bigPlane(s, visible = false) {
  return s.plane({ x: 640, y: 320, width: 480, range: [-1, 5, -1, 5], names: ['x_1', 'x_2'], visible });
}

/** Beats 3 and 15: the three cases, each on a small plane. */
const CASES = [
  { lines: [{ a: 1, b: 1, c: 3 }, { a: 1, b: -1, c: 1 }], point: [2, 1], label: 'one solution', sub: '' },
  { lines: [{ a: 1, b: 1, c: 3 }, { a: 1, b: 1, c: 1 }], label: 'no solution', sub: '(inconsistent)' },
  { lines: [{ a: 1, b: 1, c: 3 }, { a: 2, b: 2, c: 6 }], label: 'infinitely many', sub: '', same: true },
];
function casePanels(s, { y = 205, equations = true, visible = false } = {}) {
  return CASES.map((cs, k) => {
    const x = 170 + 310 * k;
    const p = s.plane({ x, y, width: 260, range: [-1, 4, -1, 4], labels: false, visible });
    const l1 = p.line(cs.lines[0], { color: C.blue, visible });
    const l2 = p.line(cs.lines[1], { color: C.red, dash: cs.same ? '10 8' : undefined, visible });
    const pt = cs.point ? p.point(cs.point, { color: C.green, visible }) : null;
    const eqs = equations
      ? cs.lines.map((L, i) => s.tex(`${lin([L.a, L.b])} = ${L.c}`, { x, y: y + 168 + 50 * i, size: 30, color: i ? C.red : C.blue, visible }))
      : [];
    const label = s.text(cs.label, { x, y: equations ? y + 290 : y + 160, size: 32, weight: 600, visible });
    const sub = cs.sub ? s.text(cs.sub, { x, y: label.y + 38, size: 30, color: C.muted, visible }) : null;
    return { p, l1, l2, pt, eqs, label, sub };
  });
}

/** Beats 6, 9, 10: the augmented matrix of the running example. */
const bigMatrix = (s, rows, opts = {}) => s.matrix(rows, { x: 400, y: 300, size: 44, augment: 3, ...opts });

// ---------------------------------------------------------------- the lecture

export default {
  id: 'systems',
  title: 'Systems of linear equations',
  goals: [
    'Read a linear equation as a line or a plane, and a solution as a common point',
    'Know why a system has no solution, exactly one, or infinitely many',
    'Write a system as an augmented matrix and solve it with row operations',
    'Explain why row operations never change the solution set',
  ],
  beats: [
    // 1
    {
      id: 'one-equation',
      title: 'One equation is a line',
      scene(s) {
        const eq = s.tex('x_1 + x_2 = 3', { x: 190, y: 120, size: 48, color: C.blue, visible: false });
        const p = bigPlane(s);
        const pts = [[0, 3], [1, 2], [3, 0]];
        const dots = pts.map((q) => p.point(q, { color: C.blue, label: `(${q[0]}, ${q[1]})`, labelColor: C.ink, visible: false }));
        const checks = pts.map((q, i) =>
          checked(s, substTex([1, 1, 3], q).tex, { x: 190, y: 230 + 70 * i, size: 36, visible: false }),
        );
        const line = p.line({ a: 1, b: 1, c: 3 }, { color: C.blue, visible: false });
        const def = s.defCard({
          x: 207, y: 340, width: 340, visible: false,
          body: 'A **linear equation** in $x_1, \\dots, x_n$ has the form $a_1x_1 + \\cdots + a_nx_n = b$.',
        });
        return { eq, p, dots, checks, line, def };
      },
      steps: [
        {
          say: 'Here is a linear equation in two unknowns, $x_1 + x_2 = 3${x one plus x two equals three}. A solution is a pair of numbers that makes it true, and every pair is a point in the plane.',
          do: async (s, o) => {
            await o.eq.write();
            await o.p.draw();
          },
        },
        {
          say: 'Let\'s plot a few. Zero and three works, so does one and two, and so does three and zero.',
          do: (s, o) => s.stagger(o.dots.map((d, i) => () => s.all(d.draw(), o.checks[i].fadeIn({ shift: [-16, 0] }))), 900),
        },
        {
          say: 'Notice they line up: every solution lies on one line, and every point of that line is a solution. That\'s why an equation of the form $a_1x_1 + \\cdots + a_nx_n = b${a one x one, plus and so on, plus a n x n, equals b} is called linear.',
          do: async (s, o) => {
            await o.line.draw({ duration: 1200 });
            await s.all(o.eq.indicate({ color: C.blue }), o.checks.map((c) => c.fadeOut({ shift: [-16, 0] })));
            await o.def.reveal();
          },
        },
      ],
    },

    // 2
    {
      id: 'two-lines',
      title: 'Two equations, one point',
      scene(s) {
        const eq1 = s.tex('x_1 + x_2 = 3', { x: 190, y: 120, size: 48, color: C.blue });
        const eq2 = s.tex('x_1 - x_2 = 1', { x: 190, y: 190, size: 48, color: C.red, visible: false });
        const p = bigPlane(s, true);
        p.line({ a: 1, b: 1, c: 3 }, { color: C.blue });
        const l2 = p.line({ a: 1, b: -1, c: 1 }, { color: C.red, visible: false });
        const pt = p.point([2, 1], { color: C.green, label: '(2, 1)', r: 11, visible: false });
        const sol = s.tex('x_1 = 2,\\ x_2 = 1', { x: 190, y: 310, size: 40, color: C.green, visible: false });
        const checks = [[1, 1, 3], [1, -1, 1]].map((row, i) =>
          checked(s, substTex(row, [2, 1]).tex, { x: 190, y: 400 + 64 * i, size: 36, color: i ? C.red : C.blue, visible: false }),
        );
        return { eq1, eq2, p, l2, pt, sol, checks };
      },
      steps: [
        {
          say: 'Now add a second equation, $x_1 - x_2 = 1${x one minus x two equals one}. Its solutions form a second line.',
          do: async (s, o) => {
            await o.eq2.write();
            await o.l2.draw({ duration: 1100 });
          },
        },
        {
          say: 'A solution of the system has to satisfy both equations at once, so it has to lie on both lines. That\'s exactly where they cross: $x_1 = 2${x one equals two} and $x_2 = 1${x two equals one}.',
          do: async (s, o) => {
            await s.wait(1200);
            await o.pt.draw();
            await s.all(o.pt.flash({ color: C.green }), o.sol.fadeIn());
          },
        },
        {
          say: 'Always check. Two plus one is three, and two minus one is one. Both equations hold.',
          do: (s, o) => s.stagger(o.checks.map((c) => () => c.write()), 1300),
        },
      ],
    },

    // 3
    {
      id: 'three-cases',
      title: 'None, one, or infinitely many',
      scene(s) {
        const def = s.defCard({
          x: 480, y: 412, width: 880, title: false, visible: false,
          body: 'A system is **consistent** if it has at least one solution, and **inconsistent** if it has none.',
        });
        return { panels: casePanels(s), def };
      },
      steps: [
        {
          say: 'Two lines in the plane can do one of three things. They can cross, at exactly one point.',
          do: (s, o) => reveal(s, o.panels[0]),
        },
        {
          say: 'They can be parallel and never meet. Then no pair satisfies both equations, and we call the system inconsistent.',
          do: (s, o) => reveal(s, o.panels[1]),
        },
        {
          say: 'Or the two equations describe the same line, and every point on it is a solution.',
          do: (s, o) => reveal(s, o.panels[2]),
        },
        {
          say: 'Those are the only three options, for any number of equations and unknowns: no solution, exactly one, or infinitely many. Consistent means at least one; inconsistent means none.',
          do: async (s, o) => {
            await s.all(o.panels.flatMap((pn) => pn.eqs.map((e) => e.fadeOut())));
            await s.stagger([1, 0, 2].map((k) => () => o.panels[k].label.indicate()), 700);
            await o.def.reveal();
          },
        },
      ],
    },

    // 4
    {
      id: 'planes',
      title: 'Three unknowns: planes',
      scene(s) {
        const sp = s.space({ x: 640, y: 390, size: 380, range: 3.5, yaw: -30, pitch: 18, visible: false });
        const colors = [C.blue, C.red, C.teal];
        const planes = SYS.map((row, i) => planeAt(sp, row.slice(0, 3).map(Number), SOL.map(Number), 1.9, { color: colors[i], visible: false }));
        const eqs = SYS.map((row, i) => s.tex(eqTex(row), { x: 50, y: 170 + 70 * i, size: 36, color: colors[i], anchor: [0, 0.5], visible: false }));
        const pt = sp.point(SOL.map(Number), { color: C.green, r: 11, label: `(${SOL.join(', ')})`, labelColor: C.green, visible: false });
        return { sp, planes, eqs, pt };
      },
      steps: [
        {
          say: 'With three unknowns, each linear equation is a plane in space.',
          do: async (s, o) => {
            await s.all(o.sp.draw(), o.eqs[0].write());
            await o.planes[0].fadeIn({ shift: [0, 0] });
          },
        },
        {
          say: 'Three planes usually meet in a single point. Here that point is $(1, 2, 3)${one, two, three}, and in a few minutes we\'ll find it with algebra alone.',
          do: async (s, o) => {
            for (const k of [1, 2]) await s.all(o.eqs[k].write({ duration: 700 }), o.planes[k].fadeIn({ shift: [0, 0], duration: 700 }));
            await o.pt.draw();
            await o.pt.flash({ color: C.green });
          },
        },
        {
          say: 'Turn it a little and you can see all three pass through it. But pictures stop working past three unknowns, so we need an algebra that does the same job.',
          do: (s, o) => o.sp.orbit(40, 4500),
        },
      ],
    },

    // 5
    {
      id: 'try-cases',
      kind: 'try',
      title: 'Your turn',
      say: 'Your turn. Before you compute anything, compare the two equations.',
      prompt: 'How many solutions does the system $x_1 + 2x_2 = 4,\\; 2x_1 + 4x_2 = 9$ have?',
      answer: { type: 'choice', value: 'none' },
      choices: [
        { id: 'none', label: 'No solution', why: 'Right: the left side of the second equation is twice the first, but 9 is not twice 4.' },
        { id: 'one', label: 'Exactly one', why: 'Two equations don\'t guarantee a crossing; compare the left sides.' },
        { id: 'inf', label: 'Infinitely many', why: 'That needs the right side to double too: 8, not 9.' },
      ],
      hint: 'Multiply the first equation by 2 and compare.',
      solution: [
        'Twice the first equation is $2x_1 + 4x_2 = 8$.',
        'The second equation says the same left side equals $9$. No pair $(x_1, x_2)$ can make it equal both $8$ and $9$.',
        'Geometrically the two lines are parallel, so the system is **inconsistent**: no solution.',
      ],
    },

    // 6
    {
      id: 'augmented',
      title: 'Keep only the numbers',
      scene(s) {
        const sys = s.tex(systemArray(SYS), { x: 235, y: 300, size: 40, visible: false });
        const start = SYS.map((row) => row.map(String));
        start[1][0] = '\\phantom{0}';
        const m = s.matrix(start, { x: 690, y: 290, size: 40, augment: 3, visible: false });
        const nums = [];
        SYS.forEach((row, i) =>
          row.forEach((v, j) => {
            if (v.zero) return;
            const from = center(sys.partBox(j < 3 ? `t${i}${j}` : `b${i}`));
            const to = center(m.cellBox(i, j));
            nums.push({ mob: s.tex(t(v), { x: from[0], y: from[1], size: 40, visible: false }), to });
          }),
        );
        const gap = sys.partBox('t10');
        const zero = s.tex('0', { x: gap.cx, y: gap.cy, size: 40, color: C.yellow, visible: false });
        const gapBox = s.surround(gap, { pad: 6, visible: false });
        const title = s.tex('[A \\mid \\mathbf{b}]', { x: 690, y: 130, size: 44, visible: false });
        const a = m.colBox(0), c = m.colBox(2), bb = m.colBox(3);
        const yb = a.y + a.h + 14;
        const brace = s.brace(a.x - 6, yb, c.x + c.w + 6, yb, { label: 'A', side: 'below', labelColor: C.blue, color: C.blue, visible: false });
        const bBox = s.surround(bb, { color: C.green, pad: 8, visible: false });
        const bLab = s.tex('\\mathbf{b}', { x: bb.cx, y: yb + 50, size: 36, color: C.green, visible: false });
        return { sys, m, nums, zero, gapBox, title, brace, bBox, bLab };
      },
      steps: [
        {
          say: 'The names $x_1${x one}, $x_2${x two}, $x_3${x three} are just placeholders. Line the variables up in columns, and all the information is in the numbers.',
          do: async (s, o) => {
            await o.sys.write({ duration: 1400 });
            await s.all(
              o.sys.animate({ opacity: 0.35 }, { duration: 600 }),
              o.nums.map(({ mob, to }, k) => {
                mob.show();
                return mob.moveTo(to[0], to[1], { duration: 1000, delay: 300 + k * 70 });
              }),
            );
            await s.all(o.m.fadeIn({ shift: [0, 0], duration: 400 }), o.nums.map(({ mob }) => mob.fadeOut({ duration: 400 })));
          },
        },
        {
          say: 'This is the augmented matrix, $[A \\mid \\mathbf{b}]${A augmented with b}: the coefficient matrix $A${A}, with the column of right-hand sides $\\mathbf{b}${b} attached.',
          do: async (s, o) => {
            await o.title.write();
            await s.all([0, 1, 2].map((j) => o.m.highlightCol(j, C.blue, { delay: j * 120 })), o.brace.draw());
            await s.all(o.bBox.draw(), o.bLab.fadeIn({ delay: 300 }));
          },
        },
        {
          say: 'One thing to watch: the second equation has no $x_1${x one}. A missing variable means a coefficient of zero, and the zero has to be written in.',
          do: async (s, o) => {
            await s.all(o.sys.animate({ opacity: 1 }, { duration: 400 }), o.gapBox.draw());
            await o.zero.fadeIn({ shift: [0, 0] });
            const to = o.m.cellBox(1, 0);
            await o.zero.moveTo(to.cx, to.cy, { duration: 1000 });
            await s.all(o.m.setEntry(1, 0, 0, { duration: 300 }), o.zero.fadeOut({ duration: 300 }), o.m.highlightCell(1, 0, C.yellow));
          },
        },
      ],
    },

    // 7
    {
      id: 'row-ops',
      title: 'Three moves that don\'t change the answer',
      scene(s) {
        const ops = [
          '\\text{Replacement: } R_i \\to R_i + kR_j',
          '\\text{Interchange: } R_i \\leftrightarrow R_j',
          '\\text{Scaling: } R_i \\to kR_i,\\ \\part{nz}{k \\neq 0}',
        ].map((tx, i) => s.tex(tx, { x: 60, y: 80 + 66 * i, size: 36, anchor: [0, 0.5], visible: false }));
        const m = s.matrix(DEMO, { x: 330, y: 420, size: 44, visible: false });
        const eqv = s.tex('\\text{row equivalent} \\;\\Rightarrow\\; \\text{same solution set}', { x: 480, y: 540, size: 36, color: C.green, visible: false });
        return { ops, m, eqv };
      },
      steps: [
        {
          say: 'There are three moves we\'re allowed to make. The first is replacement: add a multiple of one row to another row. Here, $R_1 \\to R_1 - 2R_2${R one becomes R one minus two R two}, and then we undo it.',
          do: async (s, o) => {
            await s.all(o.ops[0].write(), o.m.fadeIn());
            await o.m.rowOp({ op: 'add', i: 0, j: 1, k: -2 });
            await o.m.rowOp({ op: 'add', i: 0, j: 1, k: 2 });
          },
        },
        {
          say: 'The second is interchange: swap two rows. Swapping them back undoes it.',
          do: async (s, o) => {
            await o.ops[1].write();
            await o.m.rowOp({ op: 'swap', i: 0, j: 1 });
            await o.m.rowOp({ op: 'swap', i: 0, j: 1 });
          },
        },
        {
          say: 'The third is scaling: multiply a row by a constant. The constant must not be zero, because multiplying by zero wipes out an equation, and nothing brings it back.',
          do: async (s, o) => {
            await o.ops[2].write();
            await o.m.rowOp({ op: 'scale', i: 0, k: '1/2' });
            await o.m.rowOp({ op: 'scale', i: 0, k: 2 });
            await o.ops[2].color('nz', C.yellow);
          },
        },
        {
          say: 'Each move can be undone by another move of the same kind. So the new system has exactly the same solutions as the old one, and Lay calls the two matrices row equivalent.',
          do: async (s, o) => {
            await s.all(o.m.note(), o.ops.map((op, i) => op.indicate({ color: C.green, delay: i * 250 })));
            await o.eqv.write();
          },
        },
      ],
    },

    // 8
    {
      id: 'fill-ops',
      kind: 'blanks',
      title: 'Fill in the blanks',
      say: 'Fill in the blanks. The matrix is the one we just built.',
      figure(s) {
        const m = s.matrix(SYS, { x: 480, y: 300, size: 60, augment: 3 });
        m.highlightCell(2, 0, C.yellow);
        m.pivot(0, 0);
      },
      lines: [
        ['R_3 \\to R_3 ', { id: 'op', chips: ['- 2R_1', '+ 2R_1', '- 2R_3'], answer: '- 2R_1' }, '\\text{ clears the 2 in row 3}'],
        ['\\text{Scaling by } k \\text{ is allowed only if } k \\neq ', { id: 'k', answer: { type: 'number', value: 0 } }],
      ],
      solution: [
        `To turn the $2$ into $0$ you subtract twice row 1: $${texRowOp(FWD[0])}$ gives row 3 $= (${FWD[0].after[2].join(', ')})$.`,
        'Scaling by $0$ erases an equation, and no row operation can bring it back, so $k$ must be nonzero.',
      ],
    },

    // 9
    {
      id: 'solve-forward',
      title: 'Eliminate, top to bottom',
      scene(s) {
        const m = bigMatrix(s, SYS);
        const last = s.tex(eqTex(FWD.at(-1).after[2]), { x: 400, y: 510, size: 40, color: C.yellow, visible: false });
        return { m, last };
      },
      steps: [
        {
          say: 'Now let\'s solve it. Use the $1${one} in the top left corner to clear the $2${two} below it: $R_3 \\to R_3 - 2R_1${R three becomes R three minus two R one}.',
          do: async (s, o) => {
            await s.all(o.m.pivot(0, 0), o.m.highlightCell(2, 0, C.yellow));
            await o.m.rowOp(FWD[0]);
            await o.m.clearHighlights();
          },
        },
        {
          say: 'Next, use the $1${one} in row two to clear the $-1${minus one} under it. That\'s $R_3 \\to R_3 + R_2${R three becomes R three plus R two}.',
          do: async (s, o) => {
            await s.all(o.m.pivot(1, 1), o.m.highlightCell(2, 1, C.yellow));
            await o.m.rowOp(FWD[1]);
            await o.m.clearHighlights();
          },
        },
        {
          say: 'The matrix is now a staircase, and its last row is a single equation in one unknown: $-x_3 = -3${minus x three equals minus three}.',
          do: async (s, o) => {
            await s.all(o.m.note(), o.m.pivot(2, 2), o.m.highlightRow(2, C.yellow));
            await o.last.write();
          },
        },
      ],
    },

    // 10
    {
      id: 'solve-back',
      title: 'Back-substitute',
      scene(s) {
        const m = bigMatrix(s, FWD.at(-1).after);
        [0, 1, 2].forEach((i) => m.pivot(i, i));
        const sp = s.space({ x: 730, y: 320, size: 360, range: 3.5, yaw: -30, pitch: 18, visible: false });
        const planes = SYS.map((row, i) => planeAt(sp, row.slice(0, 3).map(Number), SOL.map(Number), 1.5, { color: [C.blue, C.red, C.teal][i], visible: false }));
        const pt = sp.point(SOL.map(Number), { color: C.green, r: 10, label: `(${SOL.join(', ')})`, labelColor: C.green, visible: false });
        const ans = s.tex(`(x_1, x_2, x_3) = (${SOL.join(', ')})`, { x: 260, y: 520, size: 40, color: C.green, visible: false });
        const checks = SYS.map((row, i) => {
          const sub = substTex(row, SOL);
          return checked(s, sub.tex, { x: 560, y: 200 + 80 * i, size: 36, anchor: [0, 0.5], visible: false });
        });
        const inc = s.matrix(INC, { x: 330, y: 200, size: 44, augment: 2, visible: false });
        const twoQ = s.defCard({
          kind: 'note', title: 'Two questions about any linear system', x: 480, y: 450, width: 860, visible: false,
          body: '**Existence:** is the system consistent, with at least one solution? **Uniqueness:** if so, is there only one?',
        });
        return { m, sp, planes, pt, ans, checks, inc, twoQ };
      },
      steps: [
        {
          say: 'Scale the last row by $-1${minus one}, and it says $x_3 = 3${x three equals three}.',
          do: (s, o) => o.m.rowOp(BWD[0]),
        },
        {
          say: 'Now clear upward. Use that $1${one} to clear the entries above it, then use the $1${one} in row two to clear the entry above that.',
          do: async (s, o) => {
            for (const st of BWD.slice(1)) await o.m.rowOp(st);
          },
        },
        {
          say: 'Read the answer straight from the last column: $(x_1, x_2, x_3) = (1, 2, 3)${x one, x two, x three equals one, two, three}. It\'s the point where the three planes met.',
          do: async (s, o) => {
            await s.all(o.m.note(), o.m.highlightCol(3, C.green), o.m.shift(-140, 0));
            await s.all(o.ans.write(), o.sp.draw(), o.planes.map((P, k) => P.fadeIn({ shift: [0, 0], delay: 300 + k * 200 })));
            await o.pt.draw();
            await o.pt.flash({ color: C.green });
          },
        },
        {
          say: 'Always check in the original equations. One plus two plus three is six, two plus six is eight, and two plus two minus three is one.',
          do: async (s, o) => {
            await o.sp.fadeOut();
            await s.stagger(o.checks.map((c) => () => c.write()), 1300);
          },
        },
        {
          say: 'Row reduction also tells you when there is no solution. Reduce this system, and its last row says $0 = -2${zero equals minus two}, which is impossible. So for any system, ask two questions: does a solution exist, and is it unique?',
          do: async (s, o) => {
            await s.all([o.m, o.ans, ...o.checks].map((mob) => mob.fadeOut({ shift: [0, -20] })));
            await o.inc.fadeIn();
            await o.inc.rowOp(INC_RED.steps[0]);
            await s.all(o.inc.highlightRow(1, C.yellow), o.inc.note(1, `0 = ${t(INC_RED.R[1][2])}`, { color: C.yellow }));
            await o.twoQ.reveal();
          },
        },
      ],
    },

    // 11
    {
      id: 'mistake-rowop',
      title: 'The trap: changing two rows at once',
      scene(s) {
        const m = s.matrix(TRAP, { x: 300, y: 170, size: 44, augment: 3 });
        const notes = ['R_1 \\to R_1 - R_2', 'R_2 \\to R_2 - R_1'].map((tx, i) =>
          s.tex(tx, { x: 560, y: m.rowBox(i).cy, size: 32, color: C.yellow, anchor: [0, 0.5], visible: false }),
        );
        const both = s.tex('\\text{at the same time}', { x: 560, y: m.rowBox(1).cy + 52, size: 30, color: C.yellow, anchor: [0, 0.5], visible: false });
        const box = s.surround(s.group(...notes, both).box(), { pad: 10, visible: false });
        const [new1, new2, old1] = [TRAP_BAD[0], TRAP_BAD[1], TRAP[0]].map((row) => substTex(row, STRAY));
        const stray = s.tex(`\\mathbf{x} = (${STRAY.join(', ')})`, { x: 480, y: 340, size: 36, visible: false });
        const newOk = checked(s, `\\text{new: } ${new1.tex},\\ ${new2.tex}`, { x: 480, y: 410, size: 34, visible: false });
        const oldNo = s.tex(`\\text{old: } ${old1.tex} \\neq ${t(TRAP[0][3])}`, { x: 480, y: 470, size: 34, color: C.yellow, visible: false });
        return { m, notes, both, box, stray, newOk, oldNo };
      },
      steps: [
        {
          say: 'Here\'s a tempting shortcut. Update both rows at the same time, each from the old rows: $R_1 \\to R_1 - R_2${R one becomes R one minus R two}, and $R_2 \\to R_2 - R_1${R two becomes R two minus R one}.',
          do: async (s, o) => {
            await s.all(o.notes.map((n, i) => n.fadeIn({ shift: [-12, 0], delay: i * 400 })), o.both.fadeIn({ delay: 800 }));
            await o.m.setRows(TRAP_BAD);
            await o.box.draw();
          },
        },
        {
          say: 'Look at the result: the new rows are negatives of each other, so we now have only one equation. The point $(0, 0, 2)${zero, zero, two} solves the new system but not the old one. The solution set changed.',
          do: async (s, o) => {
            await s.all(o.m.highlightRow(0, C.yellow), o.m.highlightRow(1, C.yellow));
            await o.stray.fadeIn();
            await o.newOk.write();
            await o.oldNo.write();
          },
        },
        {
          say: 'The fix is simple. Do one operation per step, and always read the current matrix. Now each step can be undone, and nothing is lost.',
          do: async (s, o) => {
            await s.all(o.notes.map((n) => n.fadeOut()), o.both.fadeOut(), o.box.fadeOut(), o.m.clearHighlights(), o.stray.fadeOut(), o.newOk.fadeOut(), o.oldNo.fadeOut());
            await o.m.setRows(TRAP);
            await o.m.rowOp({ op: 'add', i: 0, j: 1, k: -1 });
            await o.m.rowOp({ op: 'add', i: 1, j: 0, k: -1 });
            await o.m.note(1, `${texRowOp({ op: 'add', i: 1, j: 0, k: F(-1) })}\\ \\checkmark`, { color: C.green });
          },
        },
      ],
    },

    // 12
    {
      id: 'try-solution',
      kind: 'try',
      title: 'Your turn',
      say: 'Is this point a solution of the whole system? Check carefully.',
      prompt: 'Is $(3, -1, 2)$ a solution of $x_1 + x_2 + x_3 = 4,\\; 2x_1 - x_2 + x_3 = 9,\\; x_1 + 2x_2 - x_3 = 0$?',
      answer: { type: 'choice', value: 'no' },
      choices: [
        { id: 'yes', label: 'Yes', why: 'It satisfies the first two, but plug it into the third: $3 - 2 - 2 = -1$, not $0$.' },
        { id: 'no', label: 'No', why: 'Right: the third equation fails.' },
      ],
      hint: 'A solution must satisfy every equation, not just most of them.',
      solution: [
        'Equation 1: $3 + (-1) + 2 = 4$ ✓. Equation 2: $2(3) - (-1) + 2 = 9$ ✓.',
        'Equation 3: $3 + 2(-1) - 2 = -1 \\neq 0$ ✗.',
        'One failure is enough: $(3, -1, 2)$ is **not** a solution of the system.',
      ],
    },

    // 13
    {
      id: 'wo-solve3',
      kind: 'workout',
      title: 'Work it out',
      say: 'Grab some paper. Solve this system with row operations, then check your answer in all three equations.',
      prompt: WO.prompt,
      answer: WO.answer,
      hints: WO.hints,
      solution: WO.solution,
      generate: generateSolve3,
    },

    // 14
    {
      id: 'cp-rowops',
      kind: 'explain',
      title: 'Explain it back',
      say: 'Before we wrap up, explain this in your own words.',
      prompt: 'Why do the three elementary row operations never change the solution set of a system?',
      points: [
        'Applied to the equations, each operation keeps every solution a solution',
        'Each operation can be reversed by another row operation of the same type',
        'So the reverse step brings back the old system, and no new solutions appear either: the solution sets are equal',
        'Scaling must use a nonzero constant, or it could not be reversed',
      ],
    },

    // 15
    {
      id: 'summary-systems',
      title: 'What you have now',
      scene(s) {
        const panels = casePanels(s, { equations: false, visible: true });
        const m = s.matrix(SYS, { x: 200, y: 425, size: 32, augment: 3, visible: false });
        const list = s.tex(
          '\\begin{aligned} &\\text{replacement, interchange, scaling}\\\\ &\\Rightarrow \\text{same solution set} \\end{aligned}',
          { x: 650, y: 425, size: 30, visible: false },
        );
        const next = s.text('Next: row reduction, a recipe that tells you which case you are in.', { x: 480, y: 548, size: 30, color: C.muted, visible: false });
        return { panels, m, list, next };
      },
      steps: [
        {
          say: 'Solutions of a system are intersections, and there are always zero, one, or infinitely many of them.',
          do: (s, o) =>
            s.all(
              o.panels.map((pn) =>
                s.all(pn.p.animate({ y: -70, scale: 0.7 }), pn.label.animate({ y: 260 }), pn.sub?.fadeOut(), pn.label.indicate({ delay: 700 })),
              ),
            ),
        },
        {
          say: 'Row operations simplify the augmented matrix without changing that answer.',
          do: async (s, o) => {
            await o.m.fadeIn();
            await o.list.write();
          },
        },
        {
          say: 'Next time we turn this into a systematic recipe, row reduction, that tells us which of the three cases we\'re in.',
          do: (s, o) => o.next.fadeIn(),
        },
      ],
    },
  ],
};

// ---------------------------------------------------------------- step helpers

/** Draws one case panel: plane, the two lines, the crossing point, equations and label. */
async function reveal(s, pn) {
  await pn.p.draw({ duration: 700 });
  await s.all(pn.l1.draw({ duration: 700 }), pn.eqs[0]?.fadeIn());
  await s.all(pn.l2.draw({ duration: 700 }), pn.eqs[1]?.fadeIn());
  if (pn.pt) await pn.pt.draw();
  await s.all(pn.label.fadeIn(), pn.sub?.fadeIn({ delay: 200 }));
}
