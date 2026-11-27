/**
 * Lecture 5 · Linear independence (Lay 1.7). Design: matrix/PLAN.md § 5.
 * Every vector, reduction, relation and answer below is computed with core/linalg.js.
 */
import { C } from '../../lectern/src/core/stage.js';
import { F } from '../../lectern/src/core/frac.js';
import { vec, fromCols, scaleVec, rref, solve, nullspace, independent, inSpan, texMat, texVec, texRowOp } from '../../lectern/src/core/linalg.js';

// ---------------------------------------------------------------- data

/** The running triple (beats 1–3, 8, 9, 13): v3 lies in the plane of v1, v2. */
const V1 = vec([1, 1, 0]);
const V2 = vec([0, 1, 1]);
const V3 = vec([1, 3, 2]);
const W12 = solve(fromCols([V1, V2]), V3).x; // v3 = w1 v1 + w2 v2
const IND = fromCols([V1, V2, V3]);
const IND_RED = rref(IND);
const REL = scaleVec(-1, nullspace(IND)[0]); // v1 + 2v2 − v3 = 0 (last weight −1)
if (REL.at(-1).cmp(-1) !== 0 || !REL.slice(0, 2).every((w, i) => w.eq(W12[i]))) throw new Error('independence: relation drifted');
const PAIRS = [[0, 1], [0, 2], [1, 2]];
const TRIPLE = [V1, V2, V3];
if (!PAIRS.every(([i, j]) => independent([TRIPLE[i], TRIPLE[j]])) || independent(TRIPLE)) throw new Error('independence: pairs example drifted');

/** Beat 5. */
const TWO_DEP = [vec([2, 1]), vec([4, 2])];
const TWO_IND = [vec([2, 1]), vec([-1, 1])];
const TWO_K = TWO_DEP[1][0].div(TWO_DEP[0][0]);

/** Beat 6: three vectors in R². */
const MANY = [vec([1, 2]), vec([3, 4]), vec([5, 7])];
const MANY_M = fromCols(MANY);
const MANY_FWD = rref(MANY_M).steps.filter((st) => st.phase === 'forward');
/** Beat 6: fewer vectors than entries, still dependent (the converse of Theorem 8 fails). */
const FEW = [vec([1, 1, 0]), vec([2, 2, 0])];
if (independent(FEW)) throw new Error('independence: converse example drifted');

/** Beat 7: which sets are dependent (computed). */
const SETS = {
  a: [[1, 2], [3, 4], [5, 7]],
  b: [[1, 0, 0], [1, 1, 0], [1, 1, 1]],
  c: [[1, -2, 3], [0, 0, 0]],
  d: [[2, -4, 6], [-1, 2, -3]],
};
const DEPENDENT = Object.keys(SETS).filter((k) => !independent(SETS[k]));

/** Beat 8: dependent, yet one vector is not a combination of the others. */
const T7 = [vec([1, 0]), vec([2, 0]), vec([0, 1])];
if (independent(T7) || inSpan(T7[2], T7.slice(0, 2))) throw new Error('independence: theorem 7 example drifted');

/** Beat 10: for which h are (1,−1,2), (2,1,1), (0,3,h) dependent? Row operations never touch h's coefficient. */
const H_COLS = [[1, -1, 2], [2, 1, 1], [0, 3, 0]];
const H_M = fromCols(H_COLS.map(vec));
const H_RED = rref(H_M);
const H_FWD = H_RED.steps.filter((st) => st.phase === 'forward');
const H_ECH = H_RED.echelon;
const H_ANS = H_ECH[2][2].neg();
{
  const hSet = (h) => [H_COLS[0], H_COLS[1], [0, 3, h]];
  if (H_FWD.some((st) => st.op !== 'add' || st.j === 2) || independent(hSet(H_ANS)) || !independent(hSet(H_ANS.add(1)))) {
    throw new Error('independence: wo-h drifted');
  }
}
const H_V3 = vec([0, 3, H_ANS]);
const H_REL = solve(fromCols([vec(H_COLS[0]), vec(H_COLS[1])]), H_V3).x;

const COLORS = [C.blue, C.red, C.teal];
const N = (v) => v.map(Number);

// ---------------------------------------------------------------- TeX helpers

const t = (x) => F(x).tex({ inline: true });
const tup = (v) => `(${v.map(t).join(', ')})`;
const VN = ['\\mathbf{v}_1', '\\mathbf{v}_2', '\\mathbf{v}_3'];

/** `v1 + 2v2 − v3` from weights. */
function lin(coefs, names = VN) {
  let out = '';
  coefs.forEach((c0, j) => {
    const c = F(c0);
    if (c.zero) return;
    const a = c.abs();
    out += (c.sign() < 0 ? (out ? ' - ' : '-') : out ? ' + ' : '') + (a.eq(1) ? '' : t(a)) + names[j];
  });
  return out || '0';
}
/** `h`, `h + 3`, `h - 2`. */
const hTex = (c) => (F(c).zero ? 'h' : `h ${F(c).sign() < 0 ? '-' : '+'} ${t(F(c).abs())}`);
/** A matrix in TeX whose (2, 2) entry carries h. */
const hMat = (A) => `\\begin{bmatrix}${A.map((row, i) => row.map((x, j) => (i === 2 && j === 2 ? hTex(x) : t(x))).join(' & ')).join(' \\\\ ')}\\end{bmatrix}`;
const relTex = lin(REL);

/** Colors a named \part of a Tex immediately. */
function paint(tex, name, color) {
  for (const el of tex.part(name)) el.style.color = color;
  return tex;
}

// ---------------------------------------------------------------- shared scene builders

/** Beats 1, 9, 13: the triple in space with the plane of v1, v2 (camera yaw −60 puts that plane edge-on). */
function tripleSpace(s, { x = 670, y = 310, size = 420, visible = false, labels = true } = {}) {
  const sp = s.space({ x, y, size, range: 3.5, yaw: 0, pitch: 20, visible });
  const plane = sp.plane(N(V1), N(V2), { color: C.muted, extent: 1.6, visible: false });
  const vs = TRIPLE.map((v, k) => sp.vector(N(v), { color: COLORS[k], label: labels ? VN[k] : undefined, visible: false }));
  return { sp, plane, vs };
}
const EDGE_ON = [-52, 20];

// ---------------------------------------------------------------- the lecture

export default {
  id: 'independence',
  title: 'Linear independence',
  goals: [
    'State the definition of linear independence and find a linear dependence relation',
    'Test the columns of a matrix for independence by solving Ax = 0',
    'Use the shortcuts: two vectors, too many vectors (Theorem 8), a zero vector (Theorem 9)',
    'Know that a dependent set has at least one vector that is a combination of the others (Theorem 7)',
  ],
  beats: [
    // 1
    {
      id: 'redundant',
      title: 'A redundant arrow',
      scene(s) {
        const o = tripleSpace(s);
        o.path = o.sp.vector(N(scaleVec(W12[1], V2)), { color: C.green, tail: N(V1), width: 4, visible: false });
        o.spanL = s.tex('\\operatorname{Span}\\{\\col{blue}{\\mathbf{v}_1}, \\col{red}{\\mathbf{v}_2}\\}: \\text{a plane}', { x: 230, y: 140, size: 36, visible: false });
        o.eq = s.tex(`\\col{teal}{\\mathbf{v}_3} = ${lin(W12, ['\\col{blue}{\\mathbf{v}_1}', '\\col{red}{\\mathbf{v}_2}'])}`, { x: 230, y: 300, size: 44, visible: false });
        o.red = s.text('**redundant**: the set is **dependent**', { x: 230, y: 400, size: 32, width: 380, color: C.yellow, visible: false });
        return o;
      },
      steps: [
        {
          say: 'Two vectors that point in different directions span a plane.',
          do: async (s, o) => {
            await o.sp.draw();
            await s.all(o.vs[0].grow(), o.vs[1].grow({ delay: 250 }));
            await s.all(o.plane.fadeIn({ shift: [0, 0] }), o.spanL.write());
          },
        },
        {
          say: 'Now add a third vector. If it already lies in that plane, it adds nothing new: the span is still the same plane.',
          do: async (s, o) => {
            await o.vs[2].grow({ duration: 1100 });
            await o.sp.orbit(-30, 2200);
          },
        },
        {
          say: 'Here $\\mathbf{v}_3 = \\mathbf{v}_1 + 2\\mathbf{v}_2${v three equals v one plus two v two}: go along $\\mathbf{v}_1${v one}, then twice $\\mathbf{v}_2${v two}, and you land on its tip. It\'s redundant, and that\'s what dependence means.',
          do: async (s, o) => {
            await o.path.grow({ duration: 1000 });
            await o.eq.write();
            await s.all(o.sp.rotate(...EDGE_ON, { duration: 1600 }), o.vs[1].label.fadeOut(), o.red.fadeIn({ delay: 400 }));
          },
        },
      ],
    },

    // 2
    {
      id: 'definition',
      title: 'The definition',
      scene(s) {
        const def = s.defCard({
          x: 480, y: 30, anchor: [0.5, 0], width: 860,
          body: 'A set $\\{\\mathbf{v}_1, \\dots, \\mathbf{v}_p\\}$ in $\\mathbb{R}^n$ is **linearly independent** if $x_1\\mathbf{v}_1 + \\cdots + x_p\\mathbf{v}_p = \\mathbf{0}$ has only the trivial solution. It is **linearly dependent** if there are weights $c_1, \\dots, c_p$, not all zero, with $c_1\\mathbf{v}_1 + \\cdots + c_p\\mathbf{v}_p = \\mathbf{0}$.',
          visible: false,
        });
        const left = s.tex('\\text{only } \\mathbf{x} = \\mathbf{0} \\;\\Rightarrow\\; \\text{independent}', { x: 240, y: 360, size: 28, visible: false });
        const right = s.tex('\\text{a nontrivial } \\mathbf{x} \\;\\Rightarrow\\; \\text{dependent}', { x: 720, y: 360, size: 28, visible: false });
        const rel = s.tex(`${relTex} = \\mathbf{0}`, { x: 720, y: 440, size: 40, color: C.green, visible: false });
        const relL = s.text('a **linear dependence relation**', { x: 720, y: 505, size: 30, color: C.green, visible: false });
        return { def, left, right, rel, relL };
      },
      steps: [
        {
          say: 'Lay\'s definition is about the zero vector. Ask: which weights combine the vectors to give $\\mathbf{0}${zero}?',
          do: (s, o) => o.def.reveal(),
        },
        {
          say: 'All weights zero always works. If that\'s the only way to reach zero, the set is linearly independent.',
          do: (s, o) => o.left.write(),
        },
        {
          say: 'Otherwise the set is dependent, and any nontrivial combination equal to zero is a linear dependence relation, like $\\mathbf{v}_1 + 2\\mathbf{v}_2 - \\mathbf{v}_3 = \\mathbf{0}${v one plus two v two minus v three equals zero}.',
          do: async (s, o) => {
            await o.right.write();
            await o.rel.write();
            await o.relL.fadeIn();
          },
        },
      ],
    },

    // 3
    {
      id: 'columns-test',
      title: 'Test with one row reduction',
      scene(s) {
        const m = s.matrix(IND, { x: 250, y: 310, size: 44, visible: false });
        const head = s.tex('A = [\\,\\col{blue}{\\mathbf{v}_1}\\ \\ \\col{red}{\\mathbf{v}_2}\\ \\ \\col{teal}{\\mathbf{v}_3}\\,]', { x: 250, y: 115, size: 38, visible: false });
        const rule = s.text('columns independent $\\iff$ $A\\mathbf{x} = \\mathbf{0}$ has only the trivial solution', { x: 700, y: 115, size: 30, width: 400, visible: false });
        const free = s.tex('x_3 \\text{ free} \\Rightarrow \\text{a nontrivial solution}', { x: 700, y: 310, size: 30, color: C.yellow, visible: false });
        const pick = s.tex(`x_3 = ${t(REL[2])}:\\ \\ x_1 = ${t(REL[0])},\\ x_2 = ${t(REL[1])}`, { x: 700, y: 400, size: 32, visible: false });
        const rel = s.tex(`${relTex} = \\mathbf{0}`, { x: 700, y: 475, size: 36, color: C.green, visible: false });
        return { m, head, rule, free, pick, rel };
      },
      steps: [
        {
          say: 'Put the vectors in as the columns of a matrix $A${A}. Then the columns are independent exactly when $A\\mathbf{x} = \\mathbf{0}${A x equals zero} has only the trivial solution.',
          do: async (s, o) => {
            await s.all(o.head.write(), o.m.fadeIn());
            await s.all([0, 1, 2].map((j) => o.m.highlightCol(j, COLORS[j], { delay: j * 200 })));
            await o.rule.fadeIn();
          },
        },
        {
          say: 'Row reduce. A free variable means a nontrivial solution, and column three ends up with no pivot.',
          do: async (s, o) => {
            await o.m.clearHighlights();
            for (const st of IND_RED.steps) await o.m.rowOp(st);
            await s.all(o.m.note(), o.m.pivot(0, 0), o.m.pivot(1, 1), o.m.highlightCol(2, C.yellow));
            await o.free.write();
          },
        },
        {
          say: 'So $x_3${x three} is free. Take $x_3 = -1${x three equals minus one} and read off $x_1 = 1${x one equals one} and $x_2 = 2${x two equals two}: the relation we saw in the picture.',
          do: async (s, o) => {
            await o.pick.write();
            await o.rel.write();
            await o.rel.indicate({ color: C.green, keep: true });
          },
        },
      ],
    },

    // 4
    {
      id: 'try-pivot-indep',
      kind: 'try',
      title: 'Your turn',
      say: 'Your turn. Think about free variables.',
      prompt: 'The columns of a $4 \\times 3$ matrix $A$ give an echelon form with pivots in columns 1, 2 and 3. Are the columns of $A$ linearly independent?',
      answer: { type: 'choice', value: 'yes' },
      choices: [
        { id: 'yes', label: 'Yes', why: 'Right: a pivot in every column means no free variable, so $A\\mathbf{x} = \\mathbf{0}$ has only the trivial solution.' },
        { id: 'no', label: 'No', why: 'Four rows and three columns is fine; what matters is a pivot in every *column*.' },
        { id: 'unknown', label: 'Not enough information', why: 'The pivot columns are all you need: they tell you whether there is a free variable.' },
      ],
      hint: 'Is there a free variable?',
      solution: [
        'Independence of the columns means $A\\mathbf{x} = \\mathbf{0}$ has only the trivial solution.',
        'Every one of the 3 columns has a pivot, so there are no free variables, and the only solution is $\\mathbf{x} = \\mathbf{0}$. The columns are **independent**.',
      ],
    },

    // 5
    {
      id: 'two-vectors',
      title: 'Two vectors: just look',
      scene(s) {
        const make = (x, pair, line) => {
          const p = s.plane({ x, y: 255, width: 380, range: [-2, 5, -2, 3], labels: false, visible: false });
          const fill = line ? null : p.parallelogram(N(pair[0]), N(pair[1]), { color: C.green, visible: false });
          const span = line ? p.span(N(pair[0]), { color: C.yellow, width: 3, visible: false }) : null;
          const order = line ? [1, 0] : [0, 1];
          const vs = [];
          for (const k of order) vs[k] = p.vector(N(pair[k]), { color: COLORS[k], visible: false });
          return { p, vs, span, fill };
        };
        const L = make(250, TWO_DEP, true);
        const R = make(710, TWO_IND, false);
        const lt = s.tex(`${tup(TWO_DEP[1])} = ${t(TWO_K)}${tup(TWO_DEP[0])}`, { x: 250, y: 455, size: 36, color: C.yellow, visible: false });
        const ll = s.text('one line: **dependent**', { x: 250, y: 515, size: 30, visible: false });
        const rt = s.text('not multiples: **independent**', { x: 710, y: 455, size: 30, visible: false });
        const R2 = R.fill;
        return { L, R, lt, ll, rt, R2 };
      },
      steps: [
        {
          say: 'With just two vectors there\'s nothing to compute. They are dependent exactly when one is a multiple of the other. Here $(4, 2)${four, two} is twice $(2, 1)${two, one}.',
          do: async (s, o) => {
            await s.all(o.L.p.draw({ duration: 700 }), o.R.p.draw({ duration: 700 }));
            await s.all(o.L.vs.map((v, k) => v.grow({ delay: k * 300 })), o.R.vs.map((v, k) => v.grow({ delay: k * 300 })));
            await s.all(o.lt.write(), o.rt.fadeIn({ delay: 300 }));
          },
        },
        {
          say: 'Geometrically: dependent means both arrows lie on one line through the origin. Independent ones point in two different directions.',
          do: async (s, o) => {
            await s.all(o.L.span.draw({ duration: 900 }), o.ll.fadeIn());
            await o.R2.draw();
          },
        },
      ],
    },

    // 6
    {
      id: 'too-many',
      title: 'Too many vectors',
      scene(s) {
        const thm8 = s.defCard({ kind: 'theorem', title: 'Theorem 8', x: 480, y: 30, anchor: [0.5, 0], width: 880, body: 'If a set contains more vectors than each vector has entries, $p > n$, then it is linearly dependent.', visible: false });
        const m = s.matrix(MANY_M, { x: 295, y: 300, size: 44, visible: false });
        const thm9 = s.defCard({ kind: 'theorem', title: 'Theorem 9', x: 295, y: 570, anchor: [0.5, 1], width: 510, body: 'A set containing the zero vector is linearly dependent.', visible: false });
        const p = s.plane({ x: 770, y: 385, width: 250, range: [-1, 6, -1, 8], labelStep: 2, visible: false });
        const vs = MANY.map((v, k) => p.vector(N(v), { color: COLORS[k], visible: false }));
        const few = s.tex(`\\begin{gathered}\\{${FEW.map(tup).join(',\\ ')}\\} \\\\ p = ${FEW.length} \\le n = ${FEW[0].length}\\end{gathered}`, { x: 735, y: 275, size: 30, visible: false });
        const fewDep = s.tex(`${tup(FEW[1])} = ${t(FEW[1][0].div(FEW[0][0]))}${tup(FEW[0])}`, { x: 735, y: 370, size: 30, color: C.yellow, visible: false });
        const stamp = s.stamp('still dependent', { x: 735, y: 455, color: 'yellow' });
        return { thm8, m, thm9, p, vs, few, fewDep, stamp };
      },
      steps: [
        {
          say: 'Here are three vectors in $\\mathbb{R}^2${R two}. Theorem 8 says that whenever you have more vectors than entries, they must be dependent.',
          do: async (s, o) => {
            await o.p.draw({ duration: 800 });
            await s.stagger(o.vs.map((v) => () => v.grow({ duration: 700 })), 350);
            await o.thm8.reveal();
          },
        },
        {
          say: 'The reason: as columns they make a $2 \\times 3${two by three} matrix. It has at most two pivots, one per row, so some column is free.',
          do: async (s, o) => {
            await s.all(o.m.fadeIn(), [0, 1, 2].map((j) => o.m.highlightCol(j, COLORS[j], { delay: j * 150 })));
            await o.m.clearHighlights();
            for (const st of MANY_FWD) await o.m.rowOp(st, { note: false });
            await s.all(o.m.pivot(0, 0), o.m.pivot(1, 1), o.m.highlightCol(2, C.yellow));
          },
        },
        {
          say: 'Careful, it doesn\'t run backwards. Fewer vectors than entries proves nothing: $(1, 1, 0)${one, one, zero} and $(2, 2, 0)${two, two, zero} are only two vectors in $\\mathbb{R}^3${R three}, and they\'re still dependent.',
          do: async (s, o) => {
            await o.p.fadeOut();
            await o.few.write();
            await o.fewDep.write();
            await o.stamp.slam();
          },
        },
        {
          say: 'And Theorem 9: any set containing the zero vector is dependent too. Put weight one on $\\mathbf{0}${zero} and zero on everything else. So a single vector is independent exactly when it isn\'t zero.',
          do: (s, o) => o.thm9.reveal(),
        },
      ],
    },

    // 7
    {
      id: 'try-which-dependent',
      kind: 'try',
      title: 'Your turn',
      say: 'Select every dependent set. Run the shortcuts before you compute anything.',
      prompt: 'Select **every** set that is linearly dependent.',
      answer: { type: 'multi', value: DEPENDENT },
      choices: [
        { id: 'a', label: `$\\{${SETS.a.map((v) => tup(v)).join(', ')}\\}$ in $\\mathbb{R}^2$`, why: 'Dependent: three vectors in $\\mathbb{R}^2$ (Theorem 8).' },
        { id: 'b', label: `$\\{${SETS.b.map((v) => tup(v)).join(', ')}\\}$`, why: 'Independent: as columns they form a triangular matrix with three pivots.' },
        { id: 'c', label: `$\\{${SETS.c.map((v) => tup(v)).join(', ')}\\}$`, why: 'Dependent: it contains the zero vector (Theorem 9).' },
        { id: 'd', label: `$\\{${SETS.d.map((v) => tup(v)).join(', ')}\\}$`, why: `Dependent: the first vector is $${t(F(SETS.d[0][0]).div(SETS.d[1][0]))}$ times the second.` },
      ],
      hint: 'Check: too many vectors? a zero vector? two vectors that are multiples?',
      solution: [
        '(a) Three vectors with two entries each: Theorem 8 says dependent.',
        `(b) As columns, $${texMat(fromCols(SETS.b.map(vec)))}$ is triangular with a pivot in every column, so the only solution of $A\\mathbf{x} = \\mathbf{0}$ is trivial: independent.`,
        '(c) Contains the zero vector: dependent (Theorem 9).',
        `(d) $${tup(SETS.d[0])} = ${t(F(SETS.d[0][0]).div(SETS.d[1][0]))}${tup(SETS.d[1])}$: two vectors, one a multiple of the other, so dependent.`,
      ],
    },

    // 8
    {
      id: 'theorem-7',
      title: 'Dependent means someone is redundant',
      scene(s) {
        const thm = s.defCard({
          kind: 'theorem', title: 'Theorem 7 (Characterization of linearly dependent sets)', x: 480, y: 30, anchor: [0.5, 0], width: 880,
          body: 'A set $\\{\\mathbf{v}_1, \\dots, \\mathbf{v}_p\\}$ of two or more vectors is linearly dependent if and only if **at least one** of the vectors is a linear combination of the others. In fact, if the set is dependent and $\\mathbf{v}_1 \\neq \\mathbf{0}$, some $\\mathbf{v}_j$ with $j > 1$ is a combination of the preceding vectors $\\mathbf{v}_1, \\dots, \\mathbf{v}_{j-1}$.',
          visible: false,
        });
        const rel = s.tex(`${relTex} = \\mathbf{0}`, { x: 480, y: 420, size: 40, color: C.green, visible: false });
        const set = s.tex(`\\{${T7.map((v, k) => `\\col{${['blue', 'red', 'teal'][k]}}{${tup(v)}}`).join(', ')}\\}`, { x: 250, y: 170, size: 36, visible: false });
        const yes = s.tex(`${tup(T7[1])} = ${t(T7[1][0].div(T7[0][0]))}${tup(T7[0])}\\ \\part{ck}{\\checkmark}`, { x: 250, y: 250, size: 32, visible: false });
        paint(yes, 'ck', C.green);
        const no = s.text(`$${tup(T7[2])}$ is not a combination of the others`, { x: 250, y: 345, size: 30, width: 420, color: C.yellow, visible: false });
        const p = s.plane({ x: 720, y: 260, width: 340, range: [-1, 3, -1, 1.8], labels: false, visible: false });
        const vs = [1, 0, 2].map((k) => p.vector(N(T7[k]), { color: COLORS[k], width: k === 1 ? 8 : 5, visible: false }));
        return { thm, rel, set, yes, no, p, vs };
      },
      steps: [
        {
          say: 'Theorem 7 says a set of two or more vectors is dependent exactly when at least one of them is a combination of the others. Solve our relation for $\\mathbf{v}_3${v three} and you see it.',
          do: async (s, o) => {
            await o.thm.reveal();
            await o.rel.write();
            await o.rel.swap(`\\mathbf{v}_3 = ${lin(W12)}`, { duration: 700 });
          },
        },
        {
          say: 'Careful: at least one, not each. In this set, $(2, 0)${two, zero} is twice $(1, 0)${one, zero}, so the set is dependent. But $(0, 1)${zero, one} is not a combination of the others.',
          do: async (s, o) => {
            await s.all(o.thm.fadeOut(), o.rel.fadeOut());
            await s.all(o.set.write(), o.p.draw({ duration: 700 }));
            await s.stagger(o.vs.map((v) => () => v.grow({ duration: 600 })), 300);
            await o.yes.fadeIn();
            await o.no.fadeIn();
          },
        },
      ],
    },

    // 9
    {
      id: 'mistake-pairs',
      title: 'The trap: checking pairs',
      scene(s) {
        const o = tripleSpace(s, { x: 675 });
        o.vs.forEach((v) => v.show());
        o.sp.show();
        o.ticks = PAIRS.map(([i, j], k) => {
          const tx = s.tex(`${VN[i]}, ${VN[j]}:\\ \\text{not parallel}\\ \\part{ck}{\\checkmark}`, { x: 250, y: 100 + 62 * k, size: 32, visible: false });
          return paint(tx, 'ck', C.green);
        });
        o.still = s.text('but together: **dependent**', { x: 250, y: 320, size: 32, color: C.yellow, visible: false });
        o.ech = s.matrix(IND_RED.R, { x: 250, y: 465, size: 34, visible: false });
        return o;
      },
      steps: [
        {
          say: 'Here\'s the trap. Check the pairs: no two of these three vectors are parallel.',
          do: (s, o) => s.stagger(o.ticks.map((tx) => () => tx.fadeIn({ shift: [-12, 0] })), 700),
        },
        {
          say: 'But together they\'re dependent: $\\mathbf{v}_3${v three} lies in the plane of the other two. Turn it edge-on and all three collapse onto one flat sheet.',
          do: async (s, o) => {
            await s.ring(s.group(...o.ticks).box(), { color: C.yellow, shape: 'box', pad: 10 });
            await o.still.fadeIn();
            await o.plane.fadeIn({ shift: [0, 0] });
            await s.all(o.sp.rotate(...EDGE_ON, { duration: 1600 }), o.vs[1].label.fadeOut());
          },
        },
        {
          say: 'For three or more vectors, pairs are not enough. Row reduce: here column three has no pivot.',
          do: async (s, o) => {
            await o.ech.fadeIn();
            await s.all(o.ech.pivot(0, 0), o.ech.pivot(1, 1), o.ech.highlightCol(2, C.yellow));
          },
        },
      ],
    },

    // 10
    {
      id: 'wo-h',
      kind: 'workout',
      title: 'Work it out',
      say: 'Grab some paper. Keep $h${h} as a letter while you row reduce, and see where it ends up.',
      prompt: `For which value of $h$ is $\\left\\{${H_COLS.slice(0, 2).map((v) => texVec(vec(v))).join(', ')}, \\begin{bmatrix}0 \\\\ 3 \\\\ h\\end{bmatrix}\\right\\}$ linearly dependent?`,
      answer: { type: 'number', value: String(H_ANS) },
      hints: [
        'Put the vectors in a matrix as columns and row reduce, keeping $h$ as a letter.',
        `After the forward phase the last row is $[0\\ \\ 0\\ \\ ${hTex(H_ECH[2][2])}]$.`,
      ],
      solution: [
        `Row reduce $${hMat(H_M)}$.`,
        `The forward phase, one operation at a time: ${H_FWD.map((st) => `$${texRowOp(st)}$: $${hMat(st.after)}$`).join(', then ')}. Row operations only add multiples of rows 1 and 2 to row 3, so the $h$ is carried along unchanged.`,
        `The set is dependent exactly when column 3 has no pivot, i.e. when $${hTex(H_ECH[2][2])} = 0$: $h = ${t(H_ANS)}$.`,
        `Check: $${lin(H_REL)} = ${tup(H_V3)} = \\mathbf{v}_3$ when $h = ${t(H_ANS)}$.`,
      ],
    },

    // 11
    {
      id: 'fill-indep',
      kind: 'blanks',
      title: 'Fill in the blanks',
      say: 'Fill in the blanks: the test, and two shortcuts.',
      lines: [
        [
          '\\text{columns of } A \\text{ independent} \\iff A\\mathbf{x} = \\mathbf{0} \\text{ has }',
          { id: 'test', chips: ['\\text{only the trivial solution}', '\\text{a solution}', '\\text{a free variable}'], answer: '\\text{only the trivial solution}' },
        ],
        [
          '\\text{Six vectors in } \\mathbb{R}^4 \\text{ are always }',
          { id: 'six', chips: ['\\text{dependent}', '\\text{independent}', '\\text{spanning}'], answer: '\\text{dependent}' },
        ],
        [
          '\\{\\mathbf{v}\\} \\text{ is independent exactly when }',
          { id: 'one', chips: ['\\mathbf{v} \\neq \\mathbf{0}', '\\mathbf{v} = \\mathbf{0}', '\\text{always}'], answer: '\\mathbf{v} \\neq \\mathbf{0}' },
        ],
      ],
      solution: [
        'Independence means the only combination of the columns equal to $\\mathbf{0}$ is the trivial one; every homogeneous system has *a* solution, and a free variable means dependence.',
        'Six vectors with four entries each: $p = 6 > n = 4$, so Theorem 8 says they are dependent. (Six vectors in $\\mathbb{R}^4$ may or may not span.)',
        'One vector: $c\\mathbf{v} = \\mathbf{0}$ forces $c = 0$ exactly when $\\mathbf{v} \\neq \\mathbf{0}$; and $\\{\\mathbf{0}\\}$ is dependent because $1 \\cdot \\mathbf{0} = \\mathbf{0}$.',
      ],
    },

    // 12
    {
      id: 'cp-indep',
      kind: 'explain',
      title: 'Explain it back',
      say: 'Before we wrap up, explain Theorem 8 in your own words.',
      prompt: 'Explain why more than $n$ vectors in $\\mathbb{R}^n$ must be linearly dependent.',
      points: [
        'Put the $p$ vectors in as the columns of an $n \\times p$ matrix $A$, with $p > n$',
        'A matrix has at most one pivot per row, so at most $n$ pivots',
        'So at least $p - n$ columns have no pivot: there is a free variable',
        'A free variable gives a nontrivial solution of $A\\mathbf{x} = \\mathbf{0}$, which is a linear dependence relation',
      ],
    },

    // 13
    {
      id: 'summary-indep',
      title: 'Summary',
      scene(s) {
        const p = s.plane({ x: 250, y: 250, width: 320, range: [-2, 3, -1, 3], labels: false, visible: false });
        const pv = TWO_IND.map((v, k) => p.vector(N(v), { color: COLORS[k], visible: false }));
        const o = tripleSpace(s, { x: 710, y: 250, size: 330, labels: false });
        o.p = p;
        o.pv = pv;
        o.lt = s.text('**independent**: only the trivial combination gives $\\mathbf{0}$', { x: 250, y: 450, size: 30, width: 400, visible: false });
        o.rt = s.text(`**dependent**: $\\mathbf{v}_3 = ${lin(W12)}$`, { x: 710, y: 450, size: 30, width: 420, visible: false });
        o.test = s.text('Test: a pivot in every column of $A$ $\\iff$ independent columns', { x: 480, y: 545, size: 30, color: C.green, visible: false });
        return o;
      },
      steps: [
        {
          say: 'Independent vectors have no redundancy: the only combination that gives $\\mathbf{0}${zero} is the trivial one. Dependent ones have a nontrivial relation.',
          do: async (s, o) => {
            await s.all(o.p.draw({ duration: 700 }), o.sp.draw());
            await s.all(o.pv.map((v) => v.grow()), o.vs.map((v) => v.grow()), o.plane.fadeIn({ shift: [0, 0], delay: 500 }));
            await s.all(o.lt.fadeIn(), o.rt.fadeIn({ delay: 300 }));
          },
        },
        {
          say: 'To test, put the vectors in as columns and row reduce: a pivot in every column means independent.',
          do: (s, o) => o.test.fadeIn(),
        },
        {
          say: 'Next lecture, we stop just combining vectors and let a matrix act on them, as a transformation.',
          do: (s, o) => o.sp.orbit(40, 3000),
        },
      ],
    },
  ],
};
