/**
 * Lecture 9 · Sets, subsets and power sets (foundations/PLAN.md § 9). Irani · Sets.
 *
 * Choreography: a set is shown equal to a reshuffled copy of itself; ∈ and ⊆ are told apart with nested circles
 * and a dot that travels inside the inner set and is then seen inside the outer one; subset proofs are written with
 * `s.proof` beside the same picture; the power set of {a, b, c} grows level by level as a cube, then every subset
 * is built by flipping three in/out switches. Every set, subset list and count is computed below.
 */
import { C } from '../../lectern/src/core/stage.js';

// ---------------------------------------------------------------- data (computed, no DOM)

/** All subsets of a list, as arrays, ordered by size then by position (the power set). */
function powerSet(xs) {
  const out = [];
  for (let mask = 0; mask < 2 ** xs.length; mask++) out.push(xs.filter((_, i) => mask & (1 << i)));
  return out.sort((p, q) => p.length - q.length || xs.indexOf(p[0]) - xs.indexOf(q[0]) || xs.indexOf(p[1]) - xs.indexOf(q[1]));
}
/** Roster TeX of a finite set (∅ for the empty one). */
const setTex = (xs) => (xs.length ? `\\{${xs.join(', ')}\\}` : '\\varnothing');

const ABC = ['a', 'b', 'c'];
const PABC = powerSet(ABC); // 8 subsets, by level
const P12 = powerSet(['1', '2']); // ∅, {1}, {2}, {1, 2}
const P12_TEX = `\\{${P12.map(setTex).join(', ')}\\}`;
const PP12_SIZE = 2 ** P12.length; // |P(P({1,2}))| = 16

// ---------------------------------------------------------------- local helpers

/** Two nested circles (inner ⊆ outer) with TeX names; everything hidden until show(). */
function nested(s, { x, y, R, r, dx = -30, dy = 25, outer = 'B', inner = 'A' }) {
  const big = s.circle(x, y, R, { color: C.ink, width: 3, visible: false });
  const small = s.circle(x + dx, y + dy, r, { color: C.ink, width: 3, visible: false });
  const bigName = s.tex(outer, { x: x + R * 0.72 + 18, y: y - R * 0.72 - 12, size: 38, visible: false });
  const smallName = s.tex(inner, { x: x + dx + r * 0.8 + 16, y: y + dy + r * 0.8, size: 36, visible: false });
  return {
    big, small, bigName, smallName,
    cx: x + dx, cy: y + dy,
    show: () => s.all(big.draw({ duration: 800 }), bigName.fadeIn({ delay: 300 }), small.draw({ duration: 700, delay: 300 }), smallName.fadeIn({ delay: 600 })),
  };
}

/** A dot with a TeX label just above-right of it; both move together. */
function labeledDot(s, x, y, tex, color) {
  const dot = s.dot(x, y, { color, visible: false });
  const label = s.tex(tex, { x: x + 22, y: y - 22, size: 32, color, visible: false });
  return {
    dot, label,
    show: () => s.all(dot.draw(), label.fadeIn({ shift: [0, 0], delay: 150 })),
    moveTo: (nx, ny, opts) => s.all(dot.moveTo(nx, ny, opts), label.moveTo(nx + 22, ny - 22, opts)),
    recolor: (c) => s.all(dot.recolor(c), label.recolor(c)),
  };
}

const recapItem = (s, str, y, color = C.ink) => s.text(str, { x: 80, y, size: 32, anchor: [0, 0.5], width: 820, align: 'left', color, visible: false });

// ---------------------------------------------------------------- lecture

export default {
  id: 'sets',
  title: 'Sets, subsets and power sets',
  goals: [
    'Read and write sets in roster and set-builder notation',
    'Distinguish $\\in$ from $\\subseteq$, including for sets of sets',
    'Prove $A \\subseteq B$ by element-chasing, $A \\not\\subseteq B$ by an element, and $A = B$ by double inclusion',
    'Compute power sets and know $\\lvert \\mathcal{P}(A) \\rvert = 2^n$',
  ],
  beats: [
    // 1 ------------------------------------------------------------------------------------------------
    {
      id: 'what-set',
      title: 'What a set is',
      scene(s) {
        const left = s.tex('\\{1, 2, 3\\}', { x: 330, y: 70, size: 44, visible: false });
        const eq = s.tex('=', { x: 480, y: 70, size: 48, color: C.green, visible: false });
        const right = s.tex('\\{3, 2, 1, \\part{d}{1}\\}', { x: 640, y: 70, size: 44, visible: false });
        const builder = s.tex('\\{\\, n \\in \\mathbb{Z} \\part{st}{\\ :\\ } n \\text{ is even} \\,\\} = \\{\\dots, -4, -2, 0, 2, 4, \\dots\\}', { x: 480, y: 165, size: 36, visible: false });
        const nat = s.tex('\\mathbb{N} = \\{1, 2, 3, \\dots\\}', { x: 270, y: 260, size: 38, visible: false });
        const others = s.text('$\\mathbb{Z}$ integers, $\\mathbb{Q}$ rationals, $\\mathbb{R}$ reals', { x: 680, y: 260, size: 30, visible: false });
        const zero = s.text('our convention: $0 \\notin \\mathbb{N}$', { x: 270, y: 318, size: 30, color: C.yellow, visible: false });
        const intv = s.tex('[1, 3) = \\{\\, x \\in \\mathbb{R} : 1 \\le x < 3 \\,\\}', { x: 480, y: 395, size: 36, visible: false });
        const nl = s.numberLine({ x: 480, y: 490, width: 720, range: [-1, 5], ticks: 1, visible: false });
        return { left, eq, right, builder, nat, others, zero, intv, nl };
      },
      steps: [
        {
          say: 'A set is a collection of objects, its elements, and it is determined by its elements and nothing else. So $\\{1, 2, 3\\}${the set one, two, three} and $\\{3, 2, 1, 1\\}${the set three, two, one, one} are the same set: order and repetition don’t matter.',
          do: async (s, o) => {
            await o.left.write();
            await o.right.write();
            await o.right.color('d', C.yellow);
            await o.right.indicate({ color: C.yellow });
            await o.eq.fadeIn({ shift: [0, 0] });
            await o.eq.flash({ color: C.green });
          },
        },
        {
          say: 'Set-builder notation describes a set by a property. Read the colon as “such that”: the set of $n${n} in $\\mathbb{Z}${the integers} such that $n${n} is even.',
          do: async (s, o) => {
            await o.builder.write({ duration: 1300 });
            await o.builder.color('st', C.yellow);
            await s.ring([o.builder, 'st'], { color: 'yellow', pad: 2, shape: 'box' });
          },
        },
        {
          say: 'The standard sets get blackboard letters. In this course $\\mathbb{N}${N} starts at one: zero is not a natural number here. Some books disagree, so check the convention whenever you read one.',
          do: async (s, o) => {
            await o.nat.write();
            const r = s.surround(o.nat, { color: C.yellow, pad: 10, radius: 12, visible: false });
            await s.all(r.draw({ duration: 600 }), o.zero.fadeIn());
            await o.others.fadeIn({ shift: [-16, 0] });
          },
        },
        {
          say: 'Intervals are sets of real numbers. In $[1, 3)${the interval from one to three, closed at one and open at three} the square bracket includes the endpoint one, and the round bracket leaves out three.',
          do: async (s, o) => {
            await o.intv.write();
            await o.nl.fadeIn({ shift: [0, 0] });
            await o.nl.interval(1, 3, { openB: true, color: 'blue', duration: 900 });
          },
        },
      ],
    },

    // 2 ------------------------------------------------------------------------------------------------
    {
      id: 'member-subset',
      title: 'Element versus subset',
      scene(s) {
        const card = s.defCard({ y: 72, size: 34, title: false, tex: 'A \\subseteq B \\iff \\forall x\\,(\\part{h}{x \\in A} \\to \\part{c}{x \\in B})', visible: false });
        const pic = nested(s, { x: 250, y: 345, R: 165, r: 78, dx: -35, dy: 30 });
        const x = labeledDot(s, pic.cx - 20, pic.cy + 15, 'x', C.blue);
        const xa = s.tex('1 \\in \\{1, 2\\}', { x: 700, y: 175, size: 38, visible: false });
        const xs = s.tex('\\{1\\} \\subseteq \\{1, 2\\}', { x: 700, y: 255, size: 38, visible: false });
        const bad = s.tex('\\{1\\} \\in \\{1, 2\\}', { x: 700, y: 335, size: 38, visible: false });
        const badWhy = s.text('$\\{1\\}$ is not an element of $\\{1, 2\\}$', { x: 690, y: 390, size: 30, color: C.red, visible: false });
        const proper = s.tex('A \\subsetneq B:\\ A \\subseteq B,\\ A \\ne B', { x: 690, y: 480, size: 32, visible: false });
        const properEx = s.tex('\\{1\\} \\subsetneq \\{1, 2\\}', { x: 700, y: 535, size: 32, color: C.green, visible: false });
        return { card, pic, x, xa, xs, bad, badWhy, proper, properEx };
      },
      steps: [
        {
          say: 'Two different relations. $\\in${is an element of} relates an object to a set: one is an element of $\\{1, 2\\}${the set one, two}. $\\subseteq${is a subset of} relates two sets: $\\{1\\}${the set containing one} is a subset of $\\{1, 2\\}${the set one, two}.',
          do: async (s, o) => {
            await o.xa.write();
            await o.xs.write();
          },
        },
        {
          say: 'Mixing them up is a real error: $\\{1\\}${the set containing one} is not an element of $\\{1, 2\\}${the set one, two}, because its elements are the numbers one and two, not sets.',
          do: async (s, o) => {
            await o.bad.write();
            await o.badWhy.fadeIn();
            await s.strike(o.bad);
          },
        },
        {
          say: 'A subset is defined by a conditional: every $x${x} in $A${A} is also in $B${B}. Picture one element of $A${A}, wherever it sits.',
          do: async (s, o) => {
            await o.card.reveal();
            await o.pic.show();
            await o.x.show();
            await o.x.moveTo(o.pic.cx + 25, o.pic.cy - 25, { duration: 700 });
            await o.x.moveTo(o.pic.cx - 10, o.pic.cy + 30, { duration: 700 });
          },
        },
        {
          say: 'That element is then inside $B${B} too. Because the definition is an if-then, a subset proof is a direct proof: take any $x${x} in $A${A}, and show it is in $B${B}.',
          do: async (s, o) => {
            await s.all(o.card.color('h', C.blue), o.pic.small.recolor(C.blue));
            await s.all(o.card.color('c', C.green), o.pic.big.recolor(C.green), o.x.recolor(C.green));
            await o.pic.big.indicate({ color: C.green, scale: 1.04 });
          },
        },
        {
          say: 'Finally, $\\subsetneq${is a proper subset of} means a subset that is not the whole set: $\\{1\\}${the set containing one} is a proper subset of $\\{1, 2\\}${the set one, two}.',
          do: async (s, o) => {
            await o.proper.write();
            await o.properEx.fadeIn();
          },
        },
      ],
    },

    // 3 ------------------------------------------------------------------------------------------------
    {
      id: 'try-in-subset',
      kind: 'try',
      title: 'In or subset?',
      say: 'Your turn. List the elements of this set first, then decide which statements are true.',
      prompt: 'Let $A = \\{1, \\{1\\}, \\{2, 3\\}\\}$. Which statements are true? Select all.',
      answer: { type: 'multi', value: ['a', 'b', 'c', 'e'] },
      choices: [
        { id: 'a', label: '$1 \\in A$', why: 'True: $1$ is listed as an element.' },
        { id: 'b', label: '$\\{1\\} \\in A$', why: 'True: $\\{1\\}$ is listed as an element of $A$.' },
        { id: 'c', label: '$\\{1\\} \\subseteq A$', why: 'True: its only element, $1$, is in $A$.' },
        { id: 'd', label: '$\\{2, 3\\} \\subseteq A$', why: 'False: $2 \\notin A$. The set $\\{2, 3\\}$ is an element of $A$, but its members are not.' },
        { id: 'e', label: '$\\varnothing \\subseteq A$', why: 'True, vacuously: $\\varnothing$ has no element that could fail to be in $A$.' },
        { id: 'f', label: '$2 \\in A$', why: 'False: $2$ sits inside the element $\\{2, 3\\}$, but is not itself an element of $A$.' },
      ],
      hint: 'List the three elements of $A$.',
      solution: [
        'The elements of $A$ are exactly three objects: $1$, $\\{1\\}$ and $\\{2, 3\\}$.',
        'So $1 \\in A$ and $\\{1\\} \\in A$. Also $\\{1\\} \\subseteq A$, since its only element $1$ is in $A$, and $\\varnothing \\subseteq A$ vacuously.',
        'But $2 \\notin A$ (it is not one of the three), so $2 \\in A$ is false and $\\{2, 3\\} \\not\\subseteq A$.',
      ],
    },

    // 4 ------------------------------------------------------------------------------------------------
    {
      id: 'empty-set',
      title: 'The empty set',
      scene(s) {
        const claim = s.tex('\\varnothing \\subseteq A \\quad \\text{for every set } A', { y: 60, size: 40, visible: false });
        const unpack = s.tex('\\forall x\\,(\\part{h}{x \\in \\varnothing} \\to x \\in A)', { y: 150, size: 40, visible: false });
        const never = s.text('always false', { x: 0, y: 215, size: 30, color: C.yellow, visible: false });
        const vac = s.text('so the conditional is (vacuously) true', { y: 270, size: 30, color: C.green, visible: false });
        const uniq = s.tex('\\varnothing_1 \\subseteq \\varnothing_2 \\text{ and } \\varnothing_2 \\subseteq \\varnothing_1 \\implies \\varnothing_1 = \\varnothing_2', { y: 370, size: 36, visible: false });
        const uniqNote = s.text('(two empty sets are subsets of each other, so they are equal)', { y: 430, size: 30, color: C.muted, visible: false });
        // the boxes: ∅ (an empty box) and {∅} (a box holding an empty box)
        const box1 = s.rect(180, 180, 200, 170, { color: C.blue, width: 4, radius: 10, visible: false });
        const box2 = s.rect(560, 180, 220, 170, { color: C.teal, width: 4, radius: 10, visible: false });
        const inner = s.rect(180, 180, 200, 170, { color: C.blue, width: 4, radius: 10, visible: false });
        const n1 = s.tex('\\varnothing', { x: 280, y: 130, size: 40, color: C.blue, visible: false });
        const n2 = s.tex('\\{\\varnothing\\}', { x: 670, y: 130, size: 40, color: C.teal, visible: false });
        const c1 = s.tex('\\lvert \\varnothing \\rvert = 0', { x: 280, y: 430, size: 38, visible: false });
        const c2 = s.tex('\\lvert \\{\\varnothing\\} \\rvert = 1', { x: 670, y: 430, size: 38, visible: false });
        const neq = s.tex('\\varnothing \\ne \\{\\varnothing\\}', { x: 480, y: 520, size: 38, color: C.red, visible: false });
        return { claim, unpack, never, vac, uniq, uniqNote, box1, box2, inner, n1, n2, c1, c2, neq };
      },
      steps: [
        {
          say: 'The empty set $\\varnothing${the empty set} has no elements, and it is a subset of every set. Unpack the definition: for all $x${x}, if $x${x} is in the empty set, then $x${x} is in $A${A}.',
          do: async (s, o) => {
            await o.claim.write();
            await o.unpack.write({ duration: 1100 });
          },
        },
        {
          say: 'The hypothesis, $x \\in \\varnothing${x is in the empty set}, is always false, so the conditional is true for every $x${x}. That is vacuous truth, and it proves the claim.',
          do: async (s, o) => {
            await o.unpack.color('h', C.yellow);
            const b = o.unpack.partBox('h');
            o.never.set({ x: b.cx });
            o.ringH = s.ring([o.unpack, 'h'], { color: 'yellow', pad: 4, shape: 'box' });
            await s.all(o.ringH, o.never.fadeIn());
            await o.vac.fadeIn();
          },
        },
        {
          say: 'There is only one empty set. If two sets are both empty, each is a subset of the other by what we just proved, so they are equal.',
          do: async (s, o) => {
            await o.uniq.write({ duration: 1200 });
            await o.uniqNote.fadeIn();
          },
        },
        {
          say: 'Careful: $\\{\\varnothing\\}${the set containing the empty set} is not empty. Think of an empty box, and a box with an empty box inside it: the second has one element.',
          do: async (s, o) => {
            const old = [o.claim, o.unpack, o.never, o.vac, o.uniq, o.uniqNote];
            await s.all(old.map((m, i) => m.fadeOut({ delay: i * 50, shift: [0, -20] })), o.ringH.fadeOut());
            await s.all(o.box1.draw({ duration: 700 }), o.n1.fadeIn({ delay: 200 }));
            await s.all(o.box2.draw({ duration: 700 }), o.n2.fadeIn({ delay: 200 }));
            o.inner.show();
            await o.inner.resize(620, 230, 100, 80, { duration: 1000 });
          },
        },
        {
          say: 'So the size of $\\varnothing${the empty set} is zero, and the size of $\\{\\varnothing\\}${the set containing the empty set} is one. They are different sets.',
          do: async (s, o) => {
            await o.c1.write();
            await o.c2.write();
            await o.neq.fadeIn();
          },
        },
      ],
    },

    // 5 ------------------------------------------------------------------------------------------------
    {
      id: 'subset-proof',
      title: 'Element chasing',
      scene(s) {
        const defA = s.tex('A = \\{\\, n \\in \\mathbb{Z} : 6 \\mid n \\,\\}', { x: 60, y: 55, size: 34, anchor: [0, 0.5], visible: false });
        const defB = s.tex('B = \\{\\, n \\in \\mathbb{Z} : 2 \\mid n \\,\\}', { x: 60, y: 110, size: 34, anchor: [0, 0.5], visible: false });
        const claim = s.tex('\\textbf{Claim. } A \\subseteq B', { x: 60, y: 168, size: 34, anchor: [0, 0.5], visible: false });
        const pic = nested(s, { x: 760, y: 126, R: 80, r: 36, dx: -20, dy: 16 });
        const x = labeledDot(s, pic.cx - 6, pic.cy + 4, 'x', C.blue);
        const p = s.proof({ y: 215, width: 900, height: 360, size: 31 });
        return { defA, defB, claim, pic, x, p };
      },
      steps: [
        {
          say: 'Claim: every multiple of six is even. As sets, $A${A}, the multiples of six, is a subset of $B${B}, the even integers. A subset proof starts the same way every time: let $x${x} be an element of $A${A}.',
          do: async (s, o) => {
            await s.all(o.defA.fadeIn(), o.defB.fadeIn({ delay: 200 }), o.claim.fadeIn({ delay: 400 }), o.pic.show());
            await o.p.add('**Proof.** Let $x \\in A$.', { kind: 'assume', why: 'arbitrary element' });
            await s.all(o.x.show(), o.pic.small.recolor(C.blue));
          },
        },
        {
          say: 'Unpack membership in $A${A}: $x${x} is divisible by six, so $x = 6k${x equals six k} for some integer $k${k}.',
          do: async (s, o) => {
            o.un = o.p.add('Then $6 \\mid x$, so $x = 6k$ for some $k \\in \\mathbb{Z}$.', { why: 'def. of $A$, divides' });
            await o.un;
            await o.defA.indicate({ color: C.purple });
          },
        },
        {
          say: 'Now repack as membership in $B${B}: $x = 2(3k)${x equals two times three k}, and $3k${three k} is an integer, so two divides $x${x}.',
          do: async (s, o) => {
            o.re = o.p.add('So $x = 2(3k)$, and $3k \\in \\mathbb{Z}$.', { why: 'closure of $\\mathbb{Z}$' });
            await o.re;
            await o.p.highlight(o.re, 'yellow');
            await o.p.add('Hence $2 \\mid x$, that is, $x \\in B$.', { why: 'def. of divides, $B$' });
            await s.all(o.pic.big.recolor(C.green), o.x.recolor(C.green));
          },
        },
        {
          say: 'Since $x${x} was an arbitrary element of $A${A}, every element of $A${A} is in $B${B}. That is exactly the definition of subset.',
          do: async (s, o) => {
            await o.p.unhighlight(o.re);
            await o.p.add('Therefore $A \\subseteq B$.', { kind: 'conclude', why: 'def. of $\\subseteq$' });
            await o.p.qed();
          },
        },
      ],
    },

    // 6 ------------------------------------------------------------------------------------------------
    {
      id: 'double-inclusion',
      title: 'Proving two sets are equal',
      scene(s) {
        const sets = s.tex('A = \\{\\, 2k + 1 : k \\in \\mathbb{Z} \\,\\} \\qquad B = \\{\\, 2j - 1 : j \\in \\mathbb{Z} \\,\\}', { y: 54, size: 34, visible: false });
        const reads = s.tex('x \\in \\{\\, 2k + 1 : k \\in \\mathbb{Z} \\,\\} \\iff \\exists k \\in \\mathbb{Z},\\ x = 2k + 1', { y: 100, size: 30, color: C.purple, visible: false });
        const card = s.defCard({ y: 172, size: 32, title: false, tex: 'A = B \\iff \\part{l}{A \\subseteq B} \\text{ and } \\part{r}{B \\subseteq A}', visible: false });
        const divider = s.line(480, 225, 480, 500, { color: C.line, width: 2, visible: false });
        const col = (x, head, lines) => ({
          head: s.tex(head, { x, y: 245, size: 32, color: C.blue, visible: false }),
          lines: lines.map((t, i) => s.tex(t, { x: x - 205, y: 291 + i * 45, size: 30, anchor: [0, 0.5], visible: false })),
        });
        const L = col(250, '\\textbf{Proof.}\\ (\\subseteq)', [
          '\\text{Let } x \\in A. \\text{ Then}',
          'x = 2k + 1 \\text{ for some } k \\in \\mathbb{Z}.',
          '\\text{Let } \\part{w}{j = k + 1} \\in \\mathbb{Z}.',
          '\\text{Then } 2j - 1 = 2k + 1 = x,',
          '\\text{so } x \\in B. \\text{ Hence } A \\subseteq B.',
        ]);
        const R = col(710, '(\\supseteq)', [
          '\\text{Let } x \\in B. \\text{ Then}',
          'x = 2j - 1 \\text{ for some } j \\in \\mathbb{Z}.',
          '\\text{Let } \\part{w}{k = j - 1} \\in \\mathbb{Z}.',
          '\\text{Then } 2k + 1 = 2j - 1 = x,',
          '\\text{so } x \\in A. \\text{ Hence } B \\subseteq A.',
        ]);
        const qed = s.tex('\\text{Therefore } A = B. \\ \\blacksquare', { x: 480, y: 535, size: 34, color: C.green, visible: false });
        return { sets, reads, card, divider, L, R, qed };
      },
      steps: [
        {
          say: 'Two descriptions of the odd integers. Read $\\{2k + 1 : k \\in \\mathbb{Z}\\}${the set of two k plus one, for k in Z} as: $x${x} belongs exactly when $x = 2k + 1${x equals two k plus one} for some integer $k${k}. To prove two sets are equal, prove two inclusions: $A${A} is a subset of $B${B}, and $B${B} is a subset of $A${A}.',
          do: async (s, o) => {
            await o.sets.fadeIn();
            await o.reads.write({ duration: 1100 });
            await o.card.reveal();
            await s.all(o.card.color('l', C.blue), o.card.color('r', C.teal, { delay: 300 }));
          },
        },
        {
          say: 'First direction: take $x${x} in $A${A}, so $x = 2k + 1${x equals two k plus one}. To land in $B${B} we need a $j${j} with $2j - 1 = x${two j minus one equals x}; the choice $j = k + 1${j equals k plus one} works, and it is an integer.',
          do: async (s, o) => {
            await s.all(o.divider.draw({ duration: 600 }), o.L.head.fadeIn(), o.R.head.fadeIn({ delay: 200 }));
            for (const l of o.L.lines) await l.write({ duration: 650 });
            await o.L.lines[2].color('w', C.yellow);
          },
        },
        {
          say: 'The other direction mirrors it: take $x${x} in $B${B}, so $x = 2j - 1${x equals two j minus one}, and choose $k = j - 1${k equals j minus one}. Then $2k + 1 = x${two k plus one equals x}, so $x${x} is in $A${A}.',
          do: async (s, o) => {
            await o.R.head.recolor(C.teal);
            for (const l of o.R.lines) await l.write({ duration: 650 });
            await o.R.lines[2].color('w', C.yellow);
          },
        },
        {
          say: 'Label each direction so the reader knows which inclusion each half proves. Both inclusions hold, so the sets are equal.',
          do: async (s, o) => {
            await o.L.head.swap('\\textbf{Proof.}\\ (\\subseteq)\\ \\checkmark');
            await o.L.head.recolor(C.green);
            await o.R.head.swap('(\\supseteq)\\ \\checkmark');
            await o.R.head.recolor(C.green);
            await o.qed.write();
            await o.qed.indicate({ color: C.green, scale: 1.08 });
          },
        },
      ],
    },

    // 7 ------------------------------------------------------------------------------------------------
    {
      id: 'fill-double',
      kind: 'blanks',
      title: 'Fill in the other inclusion',
      say: 'A new pair of sets, the same method. Fill in the inclusion $B \\subseteq A${B is a subset of A}, choosing the witness yourself.',
      prompt: 'Let $A = \\{3k + 2 : k \\in \\mathbb{Z}\\}$ and $B = \\{3j - 1 : j \\in \\mathbb{Z}\\}$. Complete the proof that $B \\subseteq A$.',
      lines: [
        ['\\text{Let } x \\in B. \\text{ Then } x = 3j - 1 \\text{ for some } j \\in \\mathbb{Z}.'],
        ['\\text{Let } k = ', { id: 'k', chips: ['j - 1', 'j + 1', 'j'], answer: 'j - 1', hint: 'Solve $3k + 2 = 3j - 1$ for $k$.' }, '{} \\in \\mathbb{Z}.'],
        ['\\text{Then } 3k + 2 = ', { id: 'v', chips: ['3j - 1', '3j + 5', '3j + 2'], answer: '3j - 1', hint: 'Substitute $k = j - 1$: $3(j - 1) + 2$.' }, '{} = x,'],
        ['\\text{so } x \\in ', { id: 'set', chips: ['A', 'B', '\\mathbb{Z}'], answer: 'A', hint: 'We are proving $B \\subseteq A$: the element must land in $A$.' }, '.'],
      ],
      solution: [
        'Choose the witness $k$ so that $3k + 2$ equals the given element: $3k + 2 = 3j - 1$ gives $k = j - 1$, an integer because $j$ is.',
        'Then $3k + 2 = 3(j - 1) + 2 = 3j - 1 = x$, so $x$ has the form required for membership in $A$: $x \\in A$. (The other inclusion uses $j = k + 1$, so in fact $A = B$.)',
      ],
    },

    // 8 ------------------------------------------------------------------------------------------------
    {
      id: 'not-subset',
      title: 'Showing A is not a subset of B',
      scene(s) {
        const claim = s.tex('\\{\\, n \\in \\mathbb{Z} : 2 \\mid n \\,\\} \\not\\subseteq \\{\\, n \\in \\mathbb{Z} : 4 \\mid n \\,\\}', { y: 54, size: 36, visible: false });
        const pic = nested(s, { x: 245, y: 340, R: 170, r: 85, dx: 30, dy: 35, outer: 'A', inner: 'B' });
        const names = s.text('$A$: evens  ·  $B$: multiples of $4$', { x: 245, y: 540, size: 30, color: C.muted, visible: false });
        const inB = [
          s.tex('4', { x: pic.cx - 30, y: pic.cy - 20, size: 32, color: C.muted, visible: false }),
          s.tex('8', { x: pic.cx + 30, y: pic.cy + 30, size: 32, color: C.muted, visible: false }),
        ];
        const two = labeledDot(s, 150, 260, '2', C.red);
        const neg1 = s.tex('\\neg\\, \\forall x\\,(x \\in A \\to x \\in B)', { x: 690, y: 150, size: 34, visible: false });
        const neg2 = s.tex('\\equiv \\part{ex}{\\exists x}\\,(\\part{a}{x \\in A} \\land \\part{b}{x \\notin B})', { x: 690, y: 215, size: 34, visible: false });
        const v1 = s.tex('2 = 2 \\cdot 1 \\implies 2 \\in A', { x: 690, y: 315, size: 34, visible: false });
        const v2 = s.tex('2 = 4k \\implies k = \\tfrac{1}{2} \\notin \\mathbb{Z}', { x: 690, y: 380, size: 34, visible: false });
        const v3 = s.tex('\\implies 2 \\notin B', { x: 690, y: 445, size: 34, color: C.red, visible: false });
        const done = s.tex('2 \\in A,\\ 2 \\notin B{:}\\ \\ A \\not\\subseteq B. \\ \\blacksquare', { x: 690, y: 530, size: 32, color: C.green, visible: false });
        return { claim, pic, names, inB, two, neg1, neg2, v1, v2, v3, done };
      },
      steps: [
        {
          say: 'To show a set is not a subset, negate the definition. Not every $x${x} in $A${A} is in $B${B} means: there exists an $x${x} in $A${A} that is not in $B${B}.',
          do: async (s, o) => {
            await o.claim.fadeIn();
            await o.neg1.write();
            await o.neg2.write();
            await s.all(o.neg2.color('a', C.blue), o.neg2.color('b', C.red), o.neg2.color('ex', C.yellow));
          },
        },
        {
          say: 'So one element is enough. In the picture, the evens contain the multiples of four, and we need an even number outside the inner circle. Two will do.',
          do: async (s, o) => {
            await o.pic.show();
            await s.all(o.names.fadeIn(), ...o.inB.map((m, i) => m.fadeIn({ delay: 200 + i * 150 })));
            await o.two.show();
            await o.two.dot.flash({ color: C.red });
          },
        },
        {
          say: 'Now verify both memberships in writing. Two is even, since $2 = 2 \\cdot 1${two equals two times one}. And two is not a multiple of four: $2 = 4k${two equals four k} would force $k = \\tfrac{1}{2}${k equals one half}, which is not an integer.',
          do: async (s, o) => {
            await o.v1.write();
            await s.all(o.pic.big.recolor(C.blue));
            await o.v2.write();
            await o.v3.fadeIn();
            await o.pic.small.indicate({ color: C.red, scale: 1.05 });
          },
        },
        {
          say: 'So two is in $A${A} and not in $B${B}. One such element is all it takes: $A${A} is not a subset of $B${B}.',
          do: async (s, o) => {
            await o.done.write();
            await o.done.indicate({ color: C.green, scale: 1.06 });
          },
        },
      ],
    },

    // 9 ------------------------------------------------------------------------------------------------
    {
      id: 'power-set',
      title: 'The power set',
      scene(s) {
        const def = s.tex('\\mathcal{P}(A) = \\{\\, X : X \\subseteq A \\,\\}', { x: 720, y: 60, size: 36, visible: false });
        const aDef = s.tex('A = \\{a, b, c\\}', { x: 720, y: 125, size: 36, visible: false });
        // the cube: one node per subset, level = size
        const levelY = [520, 395, 265, 140];
        const xs = { 1: [150, 290, 430], 2: [150, 290, 430] };
        const count = [0, 0, 0, 0];
        const nodes = PABC.map((X) => {
          const lv = X.length;
          const x = lv === 0 || lv === 3 ? 290 : xs[lv][count[lv]++];
          return { X, lv, mob: s.tex(setTex(X), { x, y: levelY[lv], size: 34, visible: false }), x, y: levelY[lv] };
        });
        const edges = [];
        for (const a of nodes)
          for (const b of nodes)
            if (b.lv === a.lv + 1 && a.X.every((e) => b.X.includes(e)))
              edges.push(s.line(a.x, a.y - 24, b.x, b.y + 24, { color: C.muted, width: 2, visible: false }));
        // in / out switches
        const sw = ABC.map((e, i) => {
          const y = 225 + i * 65;
          return {
            name: s.tex(e, { x: 620, y, size: 36, visible: false }),
            on: s.text('in', { x: 710, y, size: 30, visible: false }),
            off: s.text('out', { x: 800, y, size: 30, visible: false }),
          };
        });
        const prod = s.tex('2 \\times 2 \\times 2 = 8', { x: 720, y: 445, size: 38, visible: false });
        const law = s.tex('\\lvert \\mathcal{P}(A) \\rvert = 2^{\\lvert A \\rvert}', { x: 720, y: 520, size: 40, color: C.green, visible: false });
        return { def, aDef, nodes, edges, sw, prod, law };
      },
      steps: [
        {
          say: 'The power set of $A${A}, written $\\mathcal{P}(A)${the power set of A}, is the set of all subsets of $A${A}. For $A = \\{a, b, c\\}${A equals the set a, b, c}, start with the empty set at the bottom and the whole set at the top.',
          do: async (s, o) => {
            await o.def.write();
            await o.aDef.fadeIn();
            const by = (lv) => o.nodes.filter((n) => n.lv === lv);
            await by(0)[0].mob.fadeIn();
            await by(3)[0].mob.fadeIn();
          },
        },
        {
          say: 'In between come the three one-element subsets and the three two-element subsets. Each edge adds one element, so the eight subsets form a cube.',
          do: async (s, o) => {
            const by = (lv) => o.nodes.filter((n) => n.lv === lv);
            await s.stagger(by(1).map((n) => () => n.mob.fadeIn()), 220);
            await s.stagger(by(2).map((n) => () => n.mob.fadeIn()), 220);
            await s.stagger(o.edges.map((e) => () => e.draw({ duration: 400 })), 90);
          },
        },
        {
          say: 'Here is another way to see them. Building a subset means deciding, for each element, in or out: $a${a} in, $b${b} out, $c${c} in gives $\\{a, c\\}${the set a, c}.',
          do: async (s, o) => {
            await s.stagger(o.sw.map((r) => () => s.all(r.name.fadeIn(), r.on.fadeIn(), r.off.fadeIn())), 150);
            const pick = ['a', 'c'];
            o.marks = o.sw.map((r, i) => s.surround(pick.includes(ABC[i]) ? r.on : r.off, { color: C.yellow, pad: 8, radius: 12, visible: false }));
            await s.stagger(o.marks.map((m) => () => m.draw({ duration: 450 })), 250);
            const node = o.nodes.find((n) => n.X.join() === pick.join());
            o.lit = s.surround(node.mob, { color: C.yellow, pad: 8, radius: 12, visible: false });
            await s.all(o.lit.draw({ duration: 500 }), node.mob.recolor(C.yellow));
            o.litNode = node;
          },
        },
        {
          say: 'Flip the switches to $b${b} in, the others out, and you land on $\\{b\\}${the set b}. Every pattern of switches is exactly one subset.',
          do: async (s, o) => {
            const pick = ['b'];
            await s.all(o.sw.map((r, i) => o.marks[i].retarget(pick.includes(ABC[i]) ? r.on : r.off, { duration: 500 })));
            const node = o.nodes.find((n) => n.X.join() === pick.join());
            await s.all(o.litNode.mob.recolor(C.ink), o.lit.retarget(node.mob, { duration: 600 }), node.mob.recolor(C.yellow));
          },
        },
        {
          say: 'Three switches, two positions each: $2 \\times 2 \\times 2 = 8${two times two times two equals eight}. So a set with $n${n} elements has $2^n${two to the n} subsets, a counting argument we will make precise later.',
          do: async (s, o) => {
            await o.prod.write();
            await o.law.write();
            await o.law.indicate({ color: C.green });
          },
        },
      ],
    },

    // 10 -----------------------------------------------------------------------------------------------
    {
      id: 'try-power',
      kind: 'try',
      title: 'How many?',
      say: 'A power set of a power set. Count carefully, one layer at a time.',
      prompt: 'How many elements does $\\mathcal{P}(\\mathcal{P}(\\{1, 2\\}))$ have?',
      answer: { type: 'number', value: PP12_SIZE },
      hint: 'First count $\\mathcal{P}(\\{1, 2\\})$.',
      solution: [
        `$\\mathcal{P}(\\{1, 2\\}) = ${P12_TEX}$ has $${P12.length}$ elements.`,
        `So its power set has $2^{${P12.length}} = ${PP12_SIZE}$ elements.`,
      ],
    },

    // 11 -----------------------------------------------------------------------------------------------
    {
      id: 'sets-of-sets',
      title: 'Sets of sets, and a warning',
      scene(s) {
        const roster = s.tex('\\mathcal{P}(A) = \\{\\part{e0}{\\varnothing}, \\part{e1}{\\{1\\}}, \\{2\\}, \\{1, 2\\}\\}', { x: 480, y: 55, size: 40, visible: false });
        const aDef = s.text('for $A = \\{1, 2\\}$', { x: 480, y: 112, size: 30, color: C.muted, visible: false });
        const st = (tex, x, y, color) => s.tex(tex, { x, y, size: 36, color, visible: false });
        const good = [
          st('\\varnothing \\in \\mathcal{P}(A) \\ \\checkmark', 270, 185, C.green),
          st('\\varnothing \\subseteq \\mathcal{P}(A) \\ \\checkmark', 690, 185, C.green),
          st('\\{1\\} \\in \\mathcal{P}(A) \\ \\checkmark', 270, 260, C.green),
        ];
        const bad = st('1 \\in \\mathcal{P}(A)', 690, 260, C.red);
        const card = s.defCard({ y: 390, size: 36, title: 'Elements of a power set', tex: 'X \\in \\mathcal{P}(A) \\iff X \\subseteq A', visible: false });
        const russell = s.tex('R = \\{\\, x : x \\notin x \\,\\}', { x: 480, y: 150, size: 44, visible: false });
        const para = s.tex('R \\in R \\iff R \\notin R', { x: 480, y: 250, size: 44, color: C.red, visible: false });
        const notSet = s.stamp('not a set', { x: 800, y: 200, color: 'red', size: 32 });
        const safe = s.tex('\\{\\, x \\in \\part{A}{A} : P(x) \\,\\}', { x: 480, y: 390, size: 44, visible: false });
        const safeWhy = s.text('build new sets inside a set you already have: always safe', { x: 480, y: 470, size: 30, color: C.green, visible: false });
        return { roster, aDef, good, bad, card, russell, para, notSet, safe, safeWhy };
      },
      steps: [
        {
          say: 'The elements of a power set are sets. For $A = \\{1, 2\\}${A equals the set one, two}, the empty set is an element of $\\mathcal{P}(A)${the power set of A}, and also a subset of it, and $\\{1\\}${the set containing one} is an element.',
          do: async (s, o) => {
            await s.all(o.roster.write({ duration: 1200 }), o.aDef.fadeIn({ delay: 600 }));
            await o.roster.color('e0', C.green);
            await o.good[0].fadeIn();
            await o.good[1].fadeIn();
            await o.roster.color('e1', C.green);
            await o.good[2].fadeIn();
          },
        },
        {
          say: 'But the number one is not an element of $\\mathcal{P}(A)${the power set of A}: its elements are sets. The rule to remember: $X${X} is in $\\mathcal{P}(A)${the power set of A} exactly when $X${X} is a subset of $A${A}.',
          do: async (s, o) => {
            await o.bad.fadeIn();
            o.badStrike = s.strike(o.bad);
            await o.badStrike;
            await o.card.reveal();
          },
        },
        {
          say: 'A warning. Not every description defines a set. Let $R${R} be the set of all sets that are not elements of themselves, and ask whether $R${R} is in $R${R}.',
          do: async (s, o) => {
            const old = [o.roster, o.aDef, ...o.good, o.bad, o.card];
            await s.all(old.map((m, i) => m.fadeOut({ delay: i * 40, shift: [0, -20] })), o.badStrike.fadeOut());
            await o.russell.write();
          },
        },
        {
          say: 'If it is, then by its own definition it is not; if it is not, then it is. That is Russell’s paradox: this $R${R} cannot be a set.',
          do: async (s, o) => {
            await o.para.write();
            await o.para.flash({ color: C.red });
            await o.notSet.slam();
          },
        },
        {
          say: 'The axioms of set theory, called ZFC, say which constructions are safe. In this course we always build new sets from sets we already have, like the elements of $A${A} with a property, and that is always safe.',
          do: async (s, o) => {
            await o.safe.write();
            await o.safe.color('A', C.green);
            await o.safeWhy.fadeIn();
          },
        },
      ],
    },

    // 12 -----------------------------------------------------------------------------------------------
    {
      id: 'wo-power-subset',
      kind: 'workout',
      title: 'Work it out',
      say: 'Grab paper. This proof needs both directions, and both kinds of membership, so be careful with element and subset.',
      prompt: 'Prove: for all sets $A$ and $B$, $A \\subseteq B$ if and only if $\\mathcal{P}(A) \\subseteq \\mathcal{P}(B)$.',
      answer: { type: 'proof' },
      hints: [
        'Two directions. For (⇒) take $X \\in \\mathcal{P}(A)$, and then an element $x \\in X$.',
        'For (⇐), which element of $\\mathcal{P}(A)$ is the obvious one to use?',
      ],
      solution: [
        '**Proof.** Let $A$ and $B$ be sets.',
        '(⇒) Suppose $A \\subseteq B$, and let $X \\in \\mathcal{P}(A)$, so $X \\subseteq A$. Let $x \\in X$. Then $x \\in A$ because $X \\subseteq A$, so $x \\in B$ because $A \\subseteq B$. Hence $X \\subseteq B$, that is, $X \\in \\mathcal{P}(B)$. Since $X$ was arbitrary, $\\mathcal{P}(A) \\subseteq \\mathcal{P}(B)$.',
        '(⇐) Suppose $\\mathcal{P}(A) \\subseteq \\mathcal{P}(B)$. Since $A \\subseteq A$, we have $A \\in \\mathcal{P}(A)$, so $A \\in \\mathcal{P}(B)$, that is, $A \\subseteq B$. ∎',
      ],
      rubric: [
        'Both directions are proved and labelled.',
        '(⇒) chases an element $X$ of $\\mathcal{P}(A)$, and then an element $x$ of $X$.',
        'Uses $X \\in \\mathcal{P}(B) \\iff X \\subseteq B$ correctly.',
        '(⇐) uses $A \\in \\mathcal{P}(A)$.',
        'Never confuses $\\in$ and $\\subseteq$.',
      ],
    },

    // 13 -----------------------------------------------------------------------------------------------
    {
      id: 'cp-element-subset',
      kind: 'explain',
      title: 'Explain it back',
      say: 'Before the recap, explain in your own words how being an element differs from being a subset, and how you prove two sets equal.',
      prompt: 'Explain the difference between $x \\in A$ and $X \\subseteq A$, and describe how to prove that two sets are equal.',
      points: [
        '$\\in$ is membership (one object belongs to the set); $X \\subseteq A$ means every element of $X$ is an element of $A$.',
        'A set can be both an element and a subset of another set, e.g. $\\{1\\}$ and $\\{1, \\{1\\}\\}$.',
        'Prove $A \\subseteq B$ by element chasing: “Let $x \\in A$ … so $x \\in B$.”',
        'Prove $A = B$ by proving both inclusions, $A \\subseteq B$ and $B \\subseteq A$.',
      ],
    },

    // 14 -----------------------------------------------------------------------------------------------
    {
      id: 'recap',
      title: 'Recap',
      scene(s) {
        const items = [
          recapItem(s, '• A set is its elements: roster $\\{1, 2, 3\\}$ or set-builder $\\{n \\in \\mathbb{Z} : P(n)\\}$; our $\\mathbb{N}$ starts at $1$.', 110),
          recapItem(s, '• $\\in$ versus $\\subseteq$. Prove $A \\subseteq B$ by chasing an element; $A = B$ by both inclusions; $A \\not\\subseteq B$ by one element.', 235),
          recapItem(s, '• $\\mathcal{P}(A)$ is the set of all subsets, and $\\lvert \\mathcal{P}(A) \\rvert = 2^n$.', 360),
          recapItem(s, 'Next: combining sets with union, intersection and complement.', 470, C.blue),
        ];
        return { items };
      },
      steps: [
        {
          say: 'A set is determined by its elements. Write it as a roster or with set-builder notation, and remember that our natural numbers start at one.',
          do: (s, o) => o.items[0].fadeIn({ shift: [-16, 0] }),
        },
        {
          say: 'Element and subset are different relations. Prove a subset by chasing an arbitrary element, equality by both inclusions, and non-inclusion with one element.',
          do: (s, o) => o.items[1].fadeIn({ shift: [-16, 0] }),
        },
        {
          say: 'The power set collects all subsets, and an $n${n} element set has $2^n${two to the n} of them. Next time we combine sets: unions, intersections and complements.',
          do: async (s, o) => {
            await o.items[2].fadeIn({ shift: [-16, 0] });
            await o.items[3].fadeIn({ shift: [-16, 0] });
          },
        },
      ],
    },
  ],
};
