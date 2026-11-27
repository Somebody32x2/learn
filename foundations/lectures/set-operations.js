/**
 * Lecture 10 · Set operations and identities (foundations/PLAN.md § 10). Irani · Sets.
 *
 * Choreography: every operation is shaded on a Venn diagram while its membership condition is written beside it
 * with the connective lit; concrete elements drop into their regions and results are read off; identities are
 * guessed from two Venns side by side and then proved by a chain of iffs or by element chasing in `s.proof`;
 * a four-circle diagram visibly misses a region; indexed families are stacked intervals over a number line.
 * Every set computed on the stage and in the interludes comes from the small set helpers below.
 */
import { C } from '../../lectern/src/core/stage.js';

// ---------------------------------------------------------------- data (computed, no DOM)

const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const sort = (xs) => [...new Set(xs)].sort((p, q) => p - q);
const cup = (A, B) => sort([...A, ...B]);
const cap = (A, B) => A.filter((x) => B.includes(x));
const minus = (A, B) => A.filter((x) => !B.includes(x));
const sym = (A, B) => cup(minus(A, B), minus(B, A));
const setTex = (xs) => (xs.length ? `\\{${xs.join(', ')}\\}` : '\\varnothing');

// beat `compute`
const U6 = range(1, 6);
const A4 = [1, 2, 3, 4];
const B3 = [3, 4, 5];
const RES = [
  { tex: 'A \\cup B', code: 'A|B', val: cup(A4, B3) },
  { tex: 'A \\cap B', code: 'A&B', val: cap(A4, B3) },
  { tex: 'A \\setminus B', code: 'A-B', val: minus(A4, B3) },
  { tex: 'B^c', code: '!B', val: minus(U6, B3) },
  { tex: 'A \\triangle B', code: 'A^B', val: sym(A4, B3) },
];
const regionOf = (x) => (A4.includes(x) ? (B3.includes(x) ? 'A&B' : 'A-B') : B3.includes(x) ? 'B-A' : '!A&!B');

// try `try-compute`
const U8 = range(1, 8);
const TA = [1, 2, 3, 4, 5];
const TB = [2, 4, 6];
const T_DIFF = minus(TA, TB);
const T_COMP = minus(U8, TB);
const T_ANS = cup(T_DIFF, T_COMP);

// beat `venn-not-proof`: A = B = C = {1}
const ONE = [1];
const BC = minus(ONE, ONE);
const LEFT = minus(ONE, BC); // A \ (B \ C)
const AB = minus(ONE, ONE);
const RIGHT = minus(AB, ONE); // (A \ B) \ C
const CIRCLE_REGIONS = (n) => n * n - n + 2; // most regions n circles cut the plane into

// beat `indexed`
const NS = [1, 2, 3, 4, 5];
const X0 = 0.3;
const N0 = Math.floor(1 / X0) + 1; // first n with 1/n < x0

// ---------------------------------------------------------------- local helpers

const recapItem = (s, str, y, color = C.ink) => s.text(str, { x: 80, y, size: 32, anchor: [0, 0.5], width: 820, align: 'left', color, visible: false });

/** Ellipse path (stage coordinates). */
const ellipse = (cx, cy, rx, ry) => `M ${cx - rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx + rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx - rx} ${cy} Z`;

// ---------------------------------------------------------------- lecture

export default {
  id: 'set-operations',
  title: 'Set operations and identities',
  goals: [
    'Compute unions, intersections, differences, complements, symmetric differences and Cartesian products',
    'Prove set identities by element-chasing (two inclusions or a chain of “iff”s)',
    'Use Venn diagrams to find counterexamples, and know why they are not proofs',
    'Work with indexed unions and intersections; recognize a partition',
  ],
  beats: [
    // 1 ------------------------------------------------------------------------------------------------
    {
      id: 'operations',
      title: 'Union, intersection, difference, complement',
      scene(s) {
        const v = s.venn({ x: 265, y: 320, sets: ['A', 'B'], r: 105, visible: false });
        const row = (tex, y) => s.tex(tex, { x: 515, y, size: 32, anchor: [0, 0.5], visible: false });
        const rows = [
          row('A \\cup B{:}\\quad x \\in A \\part{c}{\\lor} x \\in B', 130),
          row('A \\cap B{:}\\quad x \\in A \\part{c}{\\land} x \\in B', 205),
          row('A \\setminus B{:}\\quad x \\in A \\part{c}{\\land} x \\notin B', 280),
          row('A^c{:}\\quad \\part{c}{\\neg}(x \\in A), \\ x \\in U', 355),
          row('A \\triangle B{:}\\quad x \\in A \\part{c}{\\oplus} x \\in B', 430),
        ];
        const moral = s.text('set identities ⟸ logical equivalences', { x: 480, y: 535, size: 32, color: C.green, visible: false });
        return { v, rows, moral };
      },
      steps: [
        {
          say: 'Each set operation is a logical connective applied to membership. The union: $x${x} is in $A${A} or $x${x} is in $B${B}.',
          do: async (s, o) => {
            await o.v.fadeIn({ shift: [0, 0] });
            await o.rows[0].write();
            await s.all(o.rows[0].color('c', C.yellow), o.v.shade('A|B', { color: 'blue' }));
          },
        },
        {
          say: 'The intersection uses “and”: $x${x} is in both. The difference $A \\setminus B${A minus B} is “in $A${A} and not in $B${B}”.',
          do: async (s, o) => {
            await o.v.clearShade();
            await o.rows[1].write();
            await s.all(o.rows[1].color('c', C.yellow), o.v.shade('A&B', { color: 'blue' }));
            await s.wait(500);
            await o.v.clearShade();
            await o.rows[2].write();
            await s.all(o.rows[2].color('c', C.yellow), o.v.shade('A-B', { color: 'blue' }));
          },
        },
        {
          say: 'The complement $A^c${A complement} is “not in $A${A}”. Not in $A${A}, but in what? A complement only makes sense inside a fixed universe $U${U}, the box around the picture.',
          do: async (s, o) => {
            await o.v.clearShade();
            await o.rows[3].write();
            await o.v.outline('U', 'yellow');
            await s.all(o.rows[3].color('c', C.yellow), o.v.shade('!A', { color: 'blue' }));
            await o.v.outline('U', null);
          },
        },
        {
          say: 'The symmetric difference $A \\triangle B${A symmetric difference B} is exclusive or: in exactly one of the two sets.',
          do: async (s, o) => {
            await o.v.clearShade();
            await o.rows[4].write();
            await s.all(o.rows[4].color('c', C.yellow), o.v.shade('A^B', { color: 'blue' }));
          },
        },
        {
          say: 'Since every operation is a connective, every law of logic you know becomes a law about sets. That is where set identities come from.',
          do: async (s, o) => {
            await s.stagger(o.rows.map((r) => () => r.indicate({ color: C.yellow, scale: 1.06 })), 200);
            await o.moral.fadeIn();
          },
        },
      ],
    },

    // 2 ------------------------------------------------------------------------------------------------
    {
      id: 'compute',
      title: 'Computing with small sets',
      scene(s) {
        const given = s.tex(`U = \\{1, \\dots, ${U6.length}\\},\\quad A = ${setTex(A4)},\\quad B = ${setTex(B3)}`, { x: 480, y: 50, size: 34, visible: false });
        const v = s.venn({ x: 270, y: 330, sets: ['A', 'B'], r: 105, visible: false });
        const rows = RES.map((r, i) => s.tex(`${r.tex} = ${setTex(r.val)}`, { x: 540, y: 140 + i * 68, size: 34, anchor: [0, 0.5], visible: false }));
        const same = s.tex(`A \\cap B^c = ${setTex(A4)} \\cap ${setTex(minus(U6, B3))} = ${setTex(cap(A4, minus(U6, B3)))} = A \\setminus B`, { x: 480, y: 535, size: 34, color: C.green, visible: false });
        return { given, v, rows, same };
      },
      steps: [
        {
          say: 'Here are three concrete sets. First, put every element of $U${U} in its region: one and two are only in $A${A}, three and four are in both, five is only in $B${B}, and six is in neither.',
          do: async (s, o) => {
            await o.given.fadeIn();
            await o.v.fadeIn({ shift: [0, 0] });
            o.els = [];
            await s.stagger(U6.map((x) => () => {
              const e = o.v.element(regionOf(x), String(x));
              o.els.push(e);
              return e;
            }), 450);
          },
        },
        {
          say: 'Now read off any combination. The union is everything in either circle, the intersection is the overlap, and $A \\setminus B${A minus B} is the part of $A${A} outside $B${B}.',
          do: async (s, o) => {
            for (const i of [0, 1, 2]) {
              await o.v.clearShade();
              await s.all(o.v.shade(RES[i].code, { color: 'blue' }), o.rows[i].write({ duration: 700 }));
              await s.wait(300);
            }
          },
        },
        {
          say: 'The complement of $B${B} is everything in $U${U} outside $B${B}, and the symmetric difference is everything in exactly one circle.',
          do: async (s, o) => {
            for (const i of [3, 4]) {
              await o.v.clearShade();
              await s.all(o.v.shade(RES[i].code, { color: 'blue' }), o.rows[i].write({ duration: 700 }));
              await s.wait(300);
            }
          },
        },
        {
          say: 'Notice that $A \\setminus B${A minus B} and $A \\cap B^c${A intersect B complement} came out the same. That is no accident: both say “in $A${A} and not in $B${B}”.',
          do: async (s, o) => {
            await o.v.clearShade();
            await o.v.shade('A&!B', { color: 'green' });
            await o.rows[2].indicate({ color: C.green });
            await o.same.write();
          },
        },
      ],
    },

    // 3 ------------------------------------------------------------------------------------------------
    {
      id: 'try-compute',
      kind: 'try',
      title: 'Compute',
      say: 'Your turn. Compute the two pieces separately, then combine them.',
      prompt: `Let $U = \\{1, \\dots, 8\\}$, $A = ${setTex(TA)}$, $B = ${setTex(TB)}$. Find $(A \\setminus B) \\cup B^c$. Enter the elements separated by commas.`,
      answer: { type: 'set', value: T_ANS.map(String) },
      hint: 'Compute $A \\setminus B$ and $B^c$ separately.',
      solution: [
        `$A \\setminus B = ${setTex(T_DIFF)}$ (remove $2$, $4$ from $A$) and $B^c = ${setTex(T_COMP)}$ (everything in $U$ except $2, 4, 6$).`,
        `The union is $${setTex(T_ANS)}$.`,
      ],
    },

    // 4 ------------------------------------------------------------------------------------------------
    {
      id: 'de-morgan-sets',
      title: 'De Morgan for sets',
      scene(s) {
        const vl = s.venn({ x: 250, y: 215, sets: ['A', 'B'], r: 85, visible: false });
        const vr = s.venn({ x: 710, y: 215, sets: ['A', 'B'], r: 85, visible: false });
        const capL = s.tex('(A \\cup B)^c', { x: 250, y: 400, size: 38, visible: false });
        const capR = s.tex('A^c \\cap B^c', { x: 710, y: 400, size: 38, visible: false });
        const eq = s.tex('=', { x: 480, y: 400, size: 48, color: C.green, visible: false });
        const head = s.tex('(A \\cup B)^c = A^c \\cap B^c', { x: 480, y: 56, size: 38, visible: false });
        const p = s.proof({ y: 100, width: 900, height: 460, size: 32, numbered: false, visible: false });
        return { vl, vr, capL, capR, eq, head, p };
      },
      steps: [
        {
          say: 'Shade the complement of $A \\cup B${A union B} on the left: everything outside both circles.',
          do: async (s, o) => {
            await s.all(o.vl.fadeIn({ shift: [0, 0] }), o.vr.fadeIn({ shift: [0, 0], delay: 150 }));
            await o.capL.write();
            await o.vl.shade('A|B', { color: 'yellow' });
            await o.vl.clearShade();
            await o.vl.shade('!(A|B)', { color: 'green' });
          },
        },
        {
          say: 'On the right, shade $A^c${A complement}, then $B^c${B complement}; their intersection is where both shadings overlap. The pictures match, which suggests the identity.',
          do: async (s, o) => {
            await o.capR.write();
            await o.vr.shade('!A', { color: 'blue' });
            await o.vr.shade('!B', { color: 'teal' });
            await o.vr.clearShade();
            await o.vr.shade('!A&!B', { color: 'green' });
            await o.eq.fadeIn({ shift: [0, 0] });
            await o.eq.flash({ color: C.green });
          },
        },
        {
          say: 'Now the proof. Complements live in $U${U}, so take any $x${x} in $U${U}. Each line rewrites membership by a definition or by a law of logic, and each one is an if and only if.',
          do: async (s, o) => {
            await s.all([o.vl, o.vr, o.capL, o.capR, o.eq].map((m, i) => m.fadeOut({ delay: i * 60, shift: [0, -24] })));
            await o.head.write();
            o.p.show();
            await o.p.add('**Proof.** Let $x \\in U$. Then', { kind: 'assume', why: 'arbitrary element' });
            await o.p.add('x \\in (A \\cup B)^c', { tex: true, why: '' });
            await o.p.add('\\iff \\neg(x \\in A \\lor x \\in B)', { tex: true, why: 'def. of complement, $\\cup$' });
            o.dm = o.p.add('\\iff x \\notin A \\land x \\notin B', { tex: true, why: 'De Morgan’s law' });
            await o.dm;
            await o.p.highlight(o.dm, 'yellow');
            await o.p.add('\\iff x \\in A^c \\cap B^c', { tex: true, why: 'def. of complement, $\\cap$' });
          },
        },
        {
          say: 'A chain of iffs proves both inclusions at once: read downwards for one, upwards for the other. But only if every link really is an if and only if. Since $x${x} was arbitrary, the two sets are equal.',
          do: async (s, o) => {
            await o.p.unhighlight(o.dm);
            await o.p.note(-1, 'read ↓ for ⊆, read ↑ for ⊇', { color: 'green' });
            await o.p.add('Therefore $(A \\cup B)^c = A^c \\cap B^c$.', { kind: 'conclude', why: 'both inclusions' });
            await o.p.qed();
            await o.head.indicate({ color: C.green });
          },
        },
      ],
    },

    // 5 ------------------------------------------------------------------------------------------------
    {
      id: 'distributive',
      title: 'Distributing intersection over union',
      scene(s) {
        const vl = s.venn({ x: 250, y: 215, sets: 3, r: 72, visible: false });
        const vr = s.venn({ x: 710, y: 215, sets: 3, r: 72, visible: false });
        const capL = s.tex('A \\cap (B \\cup C)', { x: 250, y: 415, size: 36, visible: false });
        const capR = s.tex('(A \\cap B) \\cup (A \\cap C)', { x: 710, y: 415, size: 36, visible: false });
        const eq = s.tex('=', { x: 480, y: 415, size: 48, color: C.green, visible: false });
        const head = s.tex('A \\cap (B \\cup C) \\subseteq (A \\cap B) \\cup (A \\cap C)', { x: 480, y: 52, size: 34, visible: false });
        const p = s.proof({ y: 92, width: 900, height: 470, size: 31, visible: false });
        return { vl, vr, capL, capR, eq, head, p };
      },
      steps: [
        {
          say: 'First the picture. On the left, shade $B \\cup C${B union C}, then keep only the part inside $A${A}. On the right, shade $A \\cap B${A intersect B} and $A \\cap C${A intersect C}. Same region.',
          do: async (s, o) => {
            await s.all(o.vl.fadeIn({ shift: [0, 0] }), o.vr.fadeIn({ shift: [0, 0], delay: 150 }));
            await o.capL.write();
            await o.vl.shade('B|C', { color: 'teal' });
            await o.vl.clearShade();
            await o.vl.shade('A&(B|C)', { color: 'green' });
            await o.capR.write();
            await o.vr.shade('A&B', { color: 'blue' });
            await o.vr.shade('A&C', { color: 'teal' });
            await o.vr.shade('(A&B)|(A&C)', { color: 'green' });
            await o.eq.fadeIn({ shift: [0, 0] });
          },
        },
        {
          say: 'Now one inclusion, by element chasing. Let $x${x} be in the left side. Unpacking gives $x \\in A${x is in A}, and $x \\in B${x is in B} or $x \\in C${x is in C}. An “or” in what you know means: split into cases.',
          do: async (s, o) => {
            await s.all([o.vl, o.vr, o.capL, o.capR, o.eq].map((m, i) => m.fadeOut({ delay: i * 60, shift: [0, -24] })));
            await o.head.write();
            o.p.show();
            await o.p.add('**Proof.** Let $x \\in A \\cap (B \\cup C)$.', { kind: 'assume', why: 'arbitrary element' });
            o.or = o.p.add('Then $x \\in A$, and $x \\in B$ or $x \\in C$.', { why: 'def. of $\\cap$, $\\cup$' });
            await o.or;
            await o.p.highlight(o.or, 'yellow');
          },
        },
        {
          say: 'Case one: $x \\in B${x is in B}. Together with $x \\in A${x is in A}, $x${x} is in $A \\cap B${A intersect B}. Case two: $x \\in C${x is in C}, so $x${x} is in $A \\cap C${A intersect C}. Either way, $x${x} is in the union.',
          do: async (s, o) => {
            await o.p.unhighlight(o.or);
            await o.p.add('Case 1: $x \\in B$. Then $x \\in A \\cap B$.', { why: 'def. of $\\cap$', indent: 1 });
            await o.p.add('Case 2: $x \\in C$. Then $x \\in A \\cap C$.', { why: 'def. of $\\cap$', indent: 1 });
            await o.p.add('Either way, $x \\in (A \\cap B) \\cup (A \\cap C)$.', { kind: 'conclude', why: 'def. of $\\cup$' });
          },
        },
        {
          say: 'That is one inclusion. The reverse inclusion is your turn, next.',
          do: async (s, o) => {
            await o.p.note(-1, 'the reverse inclusion ⊇: your turn', { color: 'blue' });
          },
        },
      ],
    },

    // 6 ------------------------------------------------------------------------------------------------
    {
      id: 'fill-distrib',
      kind: 'blanks',
      title: 'The other inclusion',
      say: 'Now the reverse inclusion. Fill in each blank with the set the definitions give you.',
      prompt: 'Complete the proof that $(A \\cap B) \\cup (A \\cap C) \\subseteq A \\cap (B \\cup C)$.',
      lines: [
        ['\\text{Let } x \\in (A \\cap B) \\cup (A \\cap C). \\text{ Case 1: } x \\in A \\cap B.'],
        ['\\text{Then } x \\in A \\text{ and } x \\in ', { id: 'b', chips: ['B', 'C', 'B \\cap C'], answer: 'B', hint: 'Unpack $x \\in A \\cap B$.' }, ','],
        ['\\text{so } x \\in ', { id: 'bc', chips: ['B \\cup C', 'B \\cap C', 'A \\cap C'], answer: 'B \\cup C', hint: 'An element of $B$ is in any union containing $B$.' }, ','],
        ['\\text{hence } x \\in ', { id: 'goal', chips: ['A \\cap (B \\cup C)', 'A \\cup (B \\cap C)', '(A \\cap B) \\cup C'], answer: 'A \\cap (B \\cup C)', hint: 'Combine $x \\in A$ with the previous line.' }, '. \\text{ Case 2 is the same with } C.'],
      ],
      solution: [
        'From $x \\in A \\cap B$ we get $x \\in A$ and $x \\in B$, by the definition of intersection.',
        'An element of $B$ is in $B \\cup C$ by the definition of union; so $x \\in A$ and $x \\in B \\cup C$, that is, $x \\in A \\cap (B \\cup C)$.',
        'Case 2 ($x \\in A \\cap C$) is the same with $C$ in place of $B$. With the inclusion from the scene, the two sets are equal.',
      ],
    },

    // 7 ------------------------------------------------------------------------------------------------
    {
      id: 'venn-not-proof',
      title: 'Pictures suggest, proofs decide',
      scene(s) {
        const cx = 480;
        const cy = 255;
        const off = 58;
        const R = 112;
        const spec = [['A', -1, -1], ['B', 1, -1], ['C', 1, 1], ['D', -1, 1]];
        const circles = spec.map(([, dx, dy]) => s.circle(cx + dx * off, cy + dy * off, R, { color: C.ink, width: 3, visible: false }));
        const names = spec.map(([n, dx, dy]) => s.tex(n, { x: cx + dx * (off + R * 0.78 + 22), y: cy + dy * (off + R * 0.78 + 8), size: 36, visible: false }));
        const count = s.text(`four sets need $2^4 = ${2 ** 4}$ regions; four circles make at most $${CIRCLE_REGIONS(4)}$`, { x: 480, y: 480, size: 30, visible: false });
        const miss = s.tex('A \\cap C \\text{ without } B \\text{ or } D{:}\\ \\text{no region}', { x: 480, y: 535, size: 32, color: C.red, visible: false });
        // counterexample hunt
        const q = s.tex('A \\setminus (B \\setminus C) \\overset{?}{=} (A \\setminus B) \\setminus C', { x: 480, y: 60, size: 38, visible: false });
        const vl = s.venn({ x: 250, y: 255, sets: 3, r: 70, visible: false });
        const vr = s.venn({ x: 710, y: 255, sets: 3, r: 70, visible: false });
        const capL = s.tex('A \\setminus (B \\setminus C)', { x: 250, y: 445, size: 34, visible: false });
        const capR = s.tex('(A \\setminus B) \\setminus C', { x: 710, y: 445, size: 34, visible: false });
        const take = s.tex(`A = B = C = ${setTex(ONE)}`, { x: 480, y: 150, size: 40, color: C.blue, visible: false });
        const l = s.tex(`A \\setminus (B \\setminus C) = ${setTex(ONE)} \\setminus ${setTex(BC)} = ${setTex(LEFT)}`, { x: 480, y: 245, size: 38, visible: false });
        const r = s.tex(`(A \\setminus B) \\setminus C = ${setTex(AB)} \\setminus ${setTex(ONE)} = ${setTex(RIGHT)}`, { x: 480, y: 325, size: 38, visible: false });
        const ne = s.tex(`${setTex(LEFT)} \\ne ${setTex(RIGHT)}`, { x: 480, y: 425, size: 42, color: C.red, visible: false });
        const verdict = s.stamp('not an identity', { x: 760, y: 425, color: 'red' });
        return { circles, names, count, miss, q, vl, vr, capL, capR, take, l, r, ne, verdict };
      },
      steps: [
        {
          say: 'Pictures can mislead. Four sets need sixteen regions, one for each in-or-out pattern, but four circles can cut the plane into at most fourteen.',
          do: async (s, o) => {
            await s.stagger(o.circles.map((c, i) => () => s.all(c.draw({ duration: 700 }), o.names[i].fadeIn({ delay: 300 }))), 300);
            await o.count.fadeIn();
          },
        },
        {
          say: 'Look for the points in $A${A} and $C${C} but in neither $B${B} nor $D${D}. Their overlap sits entirely inside the other two circles, so that region is missing, and a proof by this picture would skip a case.',
          do: async (s, o) => {
            await s.all(o.circles[0].recolor(C.red), o.circles[2].recolor(C.red));
            await s.all(o.circles[0].indicate({ color: C.red, scale: 1.03 }), o.circles[2].indicate({ color: C.red, scale: 1.03 }));
            await o.miss.write();
          },
        },
        {
          say: 'Diagrams are still great for intuition, and for hunting counterexamples. Is this an identity? Shade both sides: they differ exactly where an element is in both $A${A} and $C${C}, whether or not it is in $B${B}.',
          do: async (s, o) => {
            await s.all([...o.circles, ...o.names, o.count, o.miss].map((m, i) => m.fadeOut({ delay: i * 30 })));
            await o.q.write();
            await s.all(o.vl.fadeIn({ shift: [0, 0] }), o.vr.fadeIn({ shift: [0, 0], delay: 150 }), o.capL.fadeIn(), o.capR.fadeIn());
            await o.vl.shade('A&!(B&!C)', { color: 'blue' });
            await o.vr.shade('A&!B&!C', { color: 'blue' });
            await o.vl.shade('A&C', { color: 'yellow' });
            o.x1 = o.vl.element('A&B&C', '');
            o.x2 = o.vr.element('A&B&C', '', { color: 'red' });
            await s.all(o.x1, o.x2);
          },
        },
        {
          say: 'So put one element in $A${A} and in $C${C}; the simplest choice is $A = B = C = \\{1\\}${A, B and C all equal the set containing one}. A counterexample is a specific choice of sets, written out and computed.',
          do: async (s, o) => {
            await s.all([o.vl, o.vr, o.capL, o.capR].map((m, i) => m.fadeOut({ delay: i * 60, shift: [0, 20] })));
            await o.take.write();
            await o.l.write({ duration: 1100 });
            await o.r.write({ duration: 1100 });
          },
        },
        {
          say: 'The left side is $\\{1\\}${the set containing one}, the right side is empty. They differ, so this is not an identity.',
          do: async (s, o) => {
            await o.ne.fadeIn();
            await o.verdict.slam();
          },
        },
      ],
    },

    // 8 ------------------------------------------------------------------------------------------------
    {
      id: 'try-not-identity',
      kind: 'try',
      title: 'Which is not an identity?',
      say: 'Three of these are identities and one is not. Find the impostor.',
      prompt: 'Which of these fails for some sets $A, B$?',
      answer: { type: 'choice', value: 'b' },
      choices: [
        { id: 'a', label: '$A \\setminus B = A \\cap B^c$', why: 'Always true: both say “in $A$ and not in $B$”.' },
        { id: 'b', label: '$(A \\cup B) \\setminus B = A$', why: 'Fails when $A$ and $B$ overlap: with $A = B = \\{1\\}$ the left side is $\\varnothing$.' },
        { id: 'c', label: '$A \\cap (A \\cup B) = A$', why: 'Always true (absorption): every element of $A$ is in $A \\cup B$.' },
        { id: 'd', label: '$(A \\cap B)^c = A^c \\cup B^c$', why: 'Always true: De Morgan’s law for sets.' },
      ],
      hint: 'Try $A = B$.',
      solution: [
        '$(A \\cup B) \\setminus B = A \\setminus B$, which equals $A$ only when $A$ and $B$ are disjoint.',
        'Counterexample: $A = B = \\{1\\}$. Then $(A \\cup B) \\setminus B = \\{1\\} \\setminus \\{1\\} = \\varnothing \\ne \\{1\\} = A$.',
      ],
    },

    // 9 ------------------------------------------------------------------------------------------------
    {
      id: 'cartesian',
      title: 'Cartesian products',
      scene(s) {
        const head = s.tex('A \\times B = \\{\\, (x, y) : x \\in A,\\ y \\in B \\,\\}', { x: 330, y: 52, size: 32, visible: false });
        const rowsL = ['1', '2'];
        const colsL = ['a', 'b', 'c'];
        const X = [210, 330, 450];
        const Y = [200, 270];
        const colH = colsL.map((c, j) => s.tex(c, { x: X[j], y: 130, size: 34, color: C.teal, visible: false }));
        const rowH = rowsL.map((r, i) => s.tex(r, { x: 100, y: Y[i], size: 34, color: C.blue, visible: false }));
        const cells = rowsL.map((r, i) => colsL.map((c, j) => s.tex(`(\\col{blue}{${r}}, \\col{teal}{${c}})`, { x: X[j], y: Y[i], size: 34, visible: false })));
        const pl = s.plane({ x: 775, y: 225, width: 220, range: [-0.5, 3.5, -0.5, 3.5], labels: false, visible: false });
        const rr = s.tex('\\mathbb{R} \\times \\mathbb{R}', { x: 775, y: 85, size: 32, visible: false });
        const swap = s.tex('(1, a) \\ne (a, 1)', { x: 775, y: 375, size: 32, color: C.red, visible: false });
        const rule = s.tex('(a, b) = (c, d) \\iff a = c \\text{ and } b = d', { x: 330, y: 375, size: 32, visible: false });
        const size = s.tex(`\\lvert A \\times B \\rvert = \\lvert A \\rvert \\cdot \\lvert B \\rvert = ${rowsL.length} \\cdot ${colsL.length} = ${rowsL.length * colsL.length}`, { x: 480, y: 455, size: 34, color: C.green, visible: false });
        const dist = s.tex('A \\times (B \\cup C) = (A \\times B) \\cup (A \\times C)', { x: 480, y: 525, size: 34, visible: false });
        return { head, colH, rowH, cells, pl, rr, rule, swap, size, dist, rowsL, colsL };
      },
      steps: [
        {
          say: 'The Cartesian product $A \\times B${A cross B} is the set of ordered pairs: first entry from $A${A}, second from $B${B}. Lay $\\{1, 2\\}${the set one, two} down the side and $\\{a, b, c\\}${the set a, b, c} across the top, and each cell is one pair.',
          do: async (s, o) => {
            await o.head.fadeIn();
            await s.all(...o.colH.map((m, i) => m.fadeIn({ delay: i * 120 })), ...o.rowH.map((m, i) => m.fadeIn({ delay: 200 + i * 120 })));
            await s.stagger(o.cells.flat().map((m) => () => m.fadeIn({ shift: [-14, 0] })), 160);
          },
        },
        {
          say: 'In a pair, order matters, unlike in a set: two pairs are equal exactly when their first entries agree and their second entries agree. In the plane, $(2, 1)${the pair two, one} and $(1, 2)${the pair one, two} are different points.',
          do: async (s, o) => {
            await o.rule.write();
            await s.all(o.pl.fadeIn({ shift: [0, 0] }), o.rr.fadeIn());
            o.p21 = o.pl.point([2, 1], { color: C.blue, label: '(2, 1)' });
            o.p12 = o.pl.point([1, 2], { color: C.red, label: '(1, 2)' });
            await o.p21.draw();
            await o.p12.draw();
            await o.swap.fadeIn();
          },
        },
        {
          say: 'Sizes multiply: two rows times three columns gives six pairs.',
          do: async (s, o) => {
            await s.stagger(o.cells.flat().map((m) => () => m.indicate({ color: C.green, scale: 1.08 })), 120);
            await o.size.write();
          },
        },
        {
          say: 'And products distribute over unions: a pair whose second entry is in $B \\cup C${B union C} is a pair in $A \\times B${A cross B} or in $A \\times C${A cross C}.',
          do: (s, o) => o.dist.write({ duration: 1200 }),
        },
      ],
    },

    // 10 -----------------------------------------------------------------------------------------------
    {
      id: 'indexed',
      title: 'Indexed families',
      scene(s) {
        const nl = s.numberLine({ x: 480, y: 420, width: 760, range: [-1.2, 1.2], ticks: 0.2, labels: (v) => (Math.abs(v) < 1e-9 ? '0' : Math.abs(Math.abs(v) - 1) < 1e-9 ? String(Math.round(v)) : null), visible: false });
        const X = (v) => 480 + nl.toX(v);
        const rowY = (n) => 155 + (n - 1) * 50;
        const bars = NS.map((n) => {
          const y = rowY(n);
          const a = X(-1 / n);
          const b = X(1 / n);
          return {
            n,
            line: s.line(a, y, b, y, { color: C.blue, width: 6, visible: false }),
            ends: [a, b].map((x) => s.circle(x, y, 8, { color: C.blue, width: 3, fill: C.bg, visible: false })),
            name: s.tex(`A_{${n}}`, { x: 70, y, size: 32, color: C.blue, visible: false }),
          };
        });
        const defU = s.tex('x \\in \\textstyle\\bigcup_{n \\in \\mathbb{N}} A_n \\iff \\exists n \\in \\mathbb{N},\\ x \\in A_n', { x: 480, y: 48, size: 30, visible: false });
        const defI = s.tex('x \\in \\textstyle\\bigcap_{n \\in \\mathbb{N}} A_n \\iff \\forall n \\in \\mathbb{N},\\ x \\in A_n', { x: 480, y: 100, size: 30, visible: false });
        const family = s.tex('A_n = (-1/n,\\ 1/n)', { x: 605, y: rowY(3), size: 32, anchor: [0, 0.5], visible: false });
        const resU = s.tex('\\textstyle\\bigcup_{n \\in \\mathbb{N}} A_n = (-1, 1)', { x: 250, y: 525, size: 34, color: C.green, visible: false });
        const resI = s.tex('\\textstyle\\bigcap_{n \\in \\mathbb{N}} A_n = \\{0\\}', { x: 710, y: 525, size: 34, color: C.green, visible: false });
        const why = s.tex(`n = ${N0} > 1/${X0}`, { x: 665, y: rowY(4), size: 32, color: C.red, anchor: [0, 0.5], visible: false });
        const arch = s.text('Archimedean property: lecture 25', { x: 120, y: rowY(4) + 10, size: 30, width: 230, align: 'left', anchor: [0, 0.5], color: C.yellow, visible: false });
        const gen = s.tex('x \\ne 0{:}\\ \\text{choose } n > 1/\\lvert x \\rvert;\\ \\text{then } 1/n < \\lvert x \\rvert, \\text{ so } x \\notin A_n', { x: 480, y: 72, size: 32, color: C.red, visible: false });
        return { nl, X, rowY, bars, defU, defI, family, resU, resI, why, arch, gen };
      },
      steps: [
        {
          say: 'An indexed family is one set for each index. Here $A_n${A n} is the open interval from minus one over $n${n} to one over $n${n}, and the intervals shrink as $n${n} grows.',
          do: async (s, o) => {
            await o.nl.fadeIn({ shift: [0, 0] });
            await o.family.fadeIn();
            for (const b of o.bars) await s.all(b.name.fadeIn(), b.line.draw({ duration: 450 }), ...b.ends.map((e) => e.fadeIn({ shift: [0, 0] })));
          },
        },
        {
          say: 'The union collects every point in some $A_n${A n}: there exists an $n${n}. That gives the biggest one, the interval from minus one to one.',
          do: async (s, o) => {
            await o.defU.write();
            await o.bars[0].line.recolor(C.green);
            o.u = o.nl.interval(-1, 1, { openA: true, openB: true, color: 'green' });
            await o.u;
            await o.resU.fadeIn();
          },
        },
        {
          say: 'The intersection keeps points in every $A_n${A n}: for all $n${n}. Zero is in every one. Any other point drops out: one $n${n} is enough to exclude it.',
          do: async (s, o) => {
            await o.defI.write();
            await s.all(o.bars[0].line.recolor(C.blue), o.u.fadeOut());
            o.zero = o.nl.point(0, { color: 'green' });
            await o.zero;
            const x = o.X(X0);
            o.mark = s.line(x, 130, x, 420, { color: C.red, width: 3, dash: true, visible: false });
            await o.mark.draw({ duration: 600 });
            const b = o.bars[N0 - 1];
            await s.all(b.line.recolor(C.red), b.name.recolor(C.red), o.why.fadeIn());
            await o.resI.fadeIn();
          },
        },
        {
          say: 'For $x = 0.3${x equals zero point three}, $n = 4${n equals four} already works, since one fourth is less than $0.3${zero point three}.',
          do: (s, o) => o.why.indicate({ color: C.red }),
        },
        {
          say: 'In general, for any nonzero $x${x}, choose $n${n} bigger than one over the absolute value of $x${x}. Then one over $n${n} is less than the absolute value of $x${x}, so $x${x} is not in $A_n${A n}. That such an $n${n} exists is the Archimedean property, proved in lecture twenty-five.',
          do: async (s, o) => {
            await s.all(o.defU.fadeOut({ shift: [0, -16] }), o.defI.fadeOut({ shift: [0, -16] }));
            await o.gen.write({ duration: 1200 });
            await o.arch.fadeIn();
          },
        },
      ],
    },

    // 11 -----------------------------------------------------------------------------------------------
    {
      id: 'try-indexed',
      kind: 'try',
      title: 'Indexed intersection',
      say: 'Try one yourself. Check zero first, then any positive number.',
      prompt: 'What is $\\bigcap_{n \\in \\mathbb{N}} [0, 1/n)$?',
      answer: { type: 'choice', value: 'b' },
      choices: [
        { id: 'a', label: '$\\varnothing$', why: '$0$ is in every interval $[0, 1/n)$, so the intersection is not empty.' },
        { id: 'b', label: '$\\{0\\}$', why: '$0$ is in every interval, and each $x > 0$ is left out of $[0, 1/n)$ once $n > 1/x$.' },
        { id: 'c', label: '$[0, 1)$', why: 'That is the $n = 1$ interval, the biggest one: it is the union, not the intersection.' },
        { id: 'd', label: '$(0, 1)$', why: 'This leaves out $0$, which is in every interval, and keeps points that drop out.' },
      ],
      hint: 'Is $0$ in every set? Is any positive $x$?',
      solution: [
        '$0 \\in [0, 1/n)$ for every $n \\in \\mathbb{N}$, so $0$ is in the intersection.',
        'For $x > 0$ choose $n > 1/x$; then $1/n < x$, so $x \\notin [0, 1/n)$. Negative numbers are in none of the sets. Hence the intersection is $\\{0\\}$.',
      ],
    },

    // 12 -----------------------------------------------------------------------------------------------
    {
      id: 'partitions',
      title: 'Partitions',
      scene(s) {
        const blob = s.path(ellipse(260, 250, 200, 140), { color: C.ink, width: 3, visible: false });
        const cuts = [
          s.line(260, 110, 260, 390, { color: C.ink, width: 3, visible: false }),
          s.line(60, 250, 260, 250, { color: C.ink, width: 3, visible: false }),
          s.line(260, 210, 452, 210, { color: C.ink, width: 3, visible: false }),
        ];
        const cols = [C.blue, C.red, C.teal, C.orange];
        const blocks = [[165, 185], [165, 320], [355, 160], [355, 300]].map(([x, y], i) => s.tex(`X_{${i + 1}}`, { x, y, size: 34, color: cols[i], visible: false }));
        const dots = [[120, 215], [205, 170], [130, 290], [210, 350], [320, 175], [400, 185], [310, 260], [395, 330]].map(([x, y]) => {
          const inside = [x < 260 && y < 250, x < 260 && y >= 250, x >= 260 && y < 210, x >= 260 && y >= 210].indexOf(true);
          return s.dot(x, y, { color: cols[inside], visible: false });
        });
        const card = s.defCard({ x: 700, y: 250, width: 400, body: 'A **partition** of $X$ is a set of subsets of $X$ (the blocks) that are **nonempty**, **pairwise disjoint**, and whose **union** is $X$.', visible: false });
        const once = s.text('every element lies in exactly one block', { x: 480, y: 460, size: 30, color: C.green, visible: false });
        // examples on number lines
        const evLab = s.tex('\\mathbb{Z} = \\col{blue}{\\{\\text{evens}\\}} \\cup \\col{red}{\\{\\text{odds}\\}}', { x: 480, y: 50, size: 34, visible: false });
        const nl2 = s.numberLine({ x: 480, y: 118, width: 760, range: [-4, 6], visible: false });
        const m3Lab = s.text('$\\mathbb{Z}$ by remainder mod $3$: $\\col{blue}{0}$, $\\col{red}{1}$, $\\col{teal}{2}$', { x: 480, y: 215, size: 32, visible: false });
        const nl3 = s.numberLine({ x: 480, y: 280, width: 760, range: [-4, 6], visible: false });
        const bad = s.tex('\\{1, \\part{a}{2}\\},\\ \\{\\part{b}{2}, 3\\}', { x: 480, y: 395, size: 40, visible: false });
        const badWhy = s.text('not a partition of $\\{1, 2, 3\\}$: $2$ is in two blocks', { x: 480, y: 460, size: 30, color: C.red, visible: false });
        const next = s.text('lecture 14: partitions = equivalence relations', { x: 480, y: 525, size: 30, color: C.blue, visible: false });
        return { blob, cuts, blocks, dots, card, once, evLab, nl2, m3Lab, nl3, bad, badWhy, next };
      },
      steps: [
        {
          say: 'A partition cuts a set into pieces, called blocks. The blocks must be nonempty, must not overlap, and together must cover the whole set.',
          do: async (s, o) => {
            await o.blob.draw({ duration: 800 });
            await s.stagger(o.cuts.map((c) => () => c.draw({ duration: 500 })), 300);
            await s.all(o.blocks.map((b, i) => b.fadeIn({ delay: i * 120 })));
            await o.card.reveal();
          },
        },
        {
          say: 'Equivalently: every element of the set lies in exactly one block. Not zero blocks, and not two.',
          do: async (s, o) => {
            await s.stagger(o.dots.map((d) => () => d.draw()), 120);
            await o.dots[4].flash({ color: C.yellow });
            await o.once.fadeIn();
          },
        },
        {
          say: 'The integers split into evens and odds. They also split into three blocks by remainder when divided by three. Every integer gets exactly one color.',
          do: async (s, o) => {
            await s.all([o.blob, ...o.cuts, ...o.blocks, ...o.dots, o.card, o.once].map((m, i) => m.fadeOut({ delay: i * 25 })));
            await s.all(o.evLab.fadeIn(), o.nl2.fadeIn({ shift: [0, 0] }));
            o.p2 = [];
            for (let v = -4; v <= 6; v++) o.p2.push(o.nl2.point(v, { color: ((v % 2) + 2) % 2 ? 'red' : 'blue' }));
            await s.all(o.p2);
            await s.all(o.m3Lab.fadeIn(), o.nl3.fadeIn({ shift: [0, 0] }));
            const c3 = ['blue', 'red', 'teal'];
            o.p3 = [];
            for (let v = -4; v <= 6; v++) o.p3.push(o.nl3.point(v, { color: c3[((v % 3) + 3) % 3] }));
            await s.all(o.p3);
          },
        },
        {
          say: 'A non-example: the sets one, two and two, three overlap, since two lands in both. In lecture fourteen, partitions turn out to be the same thing as equivalence relations.',
          do: async (s, o) => {
            await o.bad.write();
            await s.all(s.ring([o.bad, 'a'], { color: 'red' }), s.ring([o.bad, 'b'], { color: 'red' }));
            await o.badWhy.fadeIn();
            await o.next.fadeIn();
          },
        },
      ],
    },

    // 13 -----------------------------------------------------------------------------------------------
    {
      id: 'wo-set-identity',
      kind: 'workout',
      title: 'Work it out',
      say: 'Grab paper and prove this identity, with a chain of iffs or with two inclusions.',
      prompt: 'Prove: for all sets $A, B, C$, $A \\setminus (B \\cup C) = (A \\setminus B) \\cap (A \\setminus C)$.',
      answer: { type: 'proof' },
      hints: [
        'Translate membership into logic: $x \\in A \\setminus (B \\cup C)$ means $x \\in A \\land \\neg(x \\in B \\lor x \\in C)$.',
        'Apply De Morgan, then rearrange the “and”s; you need $x \\in A$ twice.',
      ],
      solution: [
        '**Proof.** Let $A, B, C$ be sets and let $x$ be arbitrary. Then',
        '$$\\begin{aligned} x \\in A \\setminus (B \\cup C) &\\iff x \\in A \\land \\neg(x \\in B \\lor x \\in C) \\\\ &\\iff x \\in A \\land x \\notin B \\land x \\notin C \\\\ &\\iff (x \\in A \\land x \\notin B) \\land (x \\in A \\land x \\notin C) \\\\ &\\iff x \\in (A \\setminus B) \\cap (A \\setminus C). \\end{aligned}$$',
        'The first step uses the definitions of difference and union, the second De Morgan’s law, the third idempotence ($p \\equiv p \\land p$), commutativity and associativity of $\\land$, and the last the definitions of difference and intersection.',
        'Since each step is an equivalence, $x$ is in the left side exactly when it is in the right side. Hence the sets are equal. ∎',
      ],
      rubric: [
        'Works with an arbitrary element $x$.',
        'Each step is a genuine equivalence with a named reason (or two separate inclusions are proved).',
        'De Morgan’s law is applied correctly to $\\neg(x \\in B \\lor x \\in C)$.',
        'The duplicated “$x \\in A$” is justified ($p \\equiv p \\land p$).',
        'Concludes that the two sets are equal.',
      ],
    },

    // 14 -----------------------------------------------------------------------------------------------
    {
      id: 'cp-venn',
      kind: 'explain',
      title: 'Explain it back',
      say: 'Before the recap: explain why a Venn diagram is not a proof, and what it is good for.',
      prompt: 'Why isn’t a Venn diagram a proof of a set identity? What is it good for?',
      points: [
        'A drawing shows particular sets in a particular position, not all sets.',
        'Circle diagrams cannot show every region for four or more sets, so cases can go missing.',
        'A proof needs an arbitrary element and logical steps (a chain of iffs or two inclusions).',
        'Diagrams are excellent for guessing identities and for finding concrete counterexamples.',
      ],
    },

    // 15 -----------------------------------------------------------------------------------------------
    {
      id: 'recap',
      title: 'Recap',
      scene(s) {
        const items = [
          recapItem(s, '• Operations are connectives on membership: $\\cup$ or, $\\cap$ and, $\\setminus$ and not, $^c$ not, $\\triangle$ exclusive or.', 120),
          recapItem(s, '• Prove identities by element chasing (iff chains or two inclusions); disprove with small concrete sets.', 245),
          recapItem(s, '• Indexed unions are “there exists $n$”, intersections “for all $n$”; partitions cut a set into disjoint nonempty blocks.', 370),
          recapItem(s, 'Next: functions.', 490, C.blue),
        ];
        return { items };
      },
      steps: [
        {
          say: 'Every set operation is a logical connective applied to membership, so laws of logic become identities of sets.',
          do: (s, o) => o.items[0].fadeIn({ shift: [-16, 0] }),
        },
        {
          say: 'Prove an identity by chasing an arbitrary element, with a chain of iffs or two inclusions. Disprove one with small concrete sets, which a diagram can help you find.',
          do: (s, o) => o.items[1].fadeIn({ shift: [-16, 0] }),
        },
        {
          say: 'Indexed unions mean “there exists”, indexed intersections mean “for all”, and a partition cuts a set into disjoint nonempty blocks. Next time: functions.',
          do: async (s, o) => {
            await o.items[2].fadeIn({ shift: [-16, 0] });
            await o.items[3].fadeIn({ shift: [-16, 0] });
          },
        },
      ],
    },
  ],
};
