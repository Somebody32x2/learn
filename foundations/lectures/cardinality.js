/**
 * Lecture 22 · Finite and countable sets (foundations/PLAN.md § 22). Dumas–McCarthy 6 · Liebeck 21.
 *
 * Choreography: sizes are compared by drawing bijections, never by counting: students sit in chairs, Hilbert's
 * guests move along arcs, a marker zigzags over the integers, and a path snakes along the anti-diagonals of a grid
 * (pairs, fractions, rows of lists) while the list it produces grows on the right. Non-lowest-terms fractions grey
 * out and the path skips them.
 */
import { C, FILL } from '../../lectern/src/core/stage.js';

// ---------------------------------------------------------------- data (pure, computed)

const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
/** The integer bijection f: ℕ → ℤ, f(n) = n/2 (n even), −(n − 1)/2 (n odd). */
const zig = (n) => (n % 2 === 0 ? n / 2 : -(n - 1) / 2);
const ZIG = Array.from({ length: 9 }, (_, i) => zig(i + 1));
const ZIG_TARGET = -7;
const ZIG_ANS = Array.from({ length: 100 }, (_, i) => i + 1).find((n) => zig(n) === ZIG_TARGET);

/** Anti-diagonal order of the cells (i, j), 1-based, up to i + j = maxSum, i ascending within a diagonal. */
const diagonals = (maxSum) => {
  const out = [];
  for (let d = 2; d <= maxSum; d++) for (let i = 1; i < d; i++) out.push([i, d - i]);
  return out;
};
const NXN = diagonals(5); // 10 pairs, all inside the 4 × 4 grid
const QPATH = diagonals(5).filter(([p, q]) => gcd(p, q) === 1);

// ---------------------------------------------------------------- local helpers

const recapItem = (s, str, y, color = C.ink) => s.text(str, { x: 80, y, size: 32, anchor: [0, 0.5], width: 820, align: 'left', color, visible: false });

/** A grid of TeX cells: cells[i][j] for rows/cols 1..4 (index 0 unused), with ⋯ and ⋮. */
function grid(s, cell, { x0, y0, dx, dy, size = 32 }) {
  const cx = (j) => x0 + dx * (j - 1);
  const cy = (i) => y0 + dy * (i - 1);
  const cells = [null];
  for (let i = 1; i <= 4; i++) {
    const row = [null];
    for (let j = 1; j <= 4; j++) row.push(s.tex(cell(i, j), { x: cx(j), y: cy(i), size, visible: false }));
    cells.push(row);
  }
  const more = [1, 2, 3, 4].map((i) => s.tex('\\cdots', { x: cx(5) - dx * 0.25, y: cy(i), size, color: C.muted, visible: false }));
  const down = [1, 2, 3, 4].map((j) => s.tex('\\vdots', { x: cx(j), y: cy(5) - dy * 0.25, size, color: C.muted, visible: false }));
  const all = [...cells.slice(1).flatMap((r) => r.slice(1)), ...more, ...down];
  return { cells, cx, cy, all, show: () => s.all(all.map((m, k) => m.fadeIn({ delay: k * 25 }))) };
}

/** Arrows along a path of grid cells, trimmed at each cell's half-extents (hw × hh) so they do not cover it. */
function pathArrows(s, g, path, { hw = 40, hh = 22, color = C.blue } = {}) {
  return path.slice(1).map(([i, j], k) => {
    const [a, b] = path[k];
    const [x1, y1, x2, y2] = [g.cx(b), g.cy(a), g.cx(j), g.cy(i)];
    const L = Math.hypot(x2 - x1, y2 - y1);
    const [ux, uy] = [(x2 - x1) / L, (y2 - y1) / L];
    const t = Math.min(ux ? hw / Math.abs(ux) : Infinity, uy ? hh / Math.abs(uy) : Infinity) + 6;
    return s.arrow(x1 + ux * t, y1 + uy * t, x2 - ux * t, y2 - uy * t, { color, width: 3, visible: false });
  });
}

/** A curved arrow-free arc above the line from x1 to x2 at height y, peaking `lift` higher. */
const arc = (s, x1, x2, y, lift, color = C.blue) => s.path(`M ${x1} ${y} Q ${(x1 + x2) / 2} ${y - 2 * lift} ${x2} ${y}`, { color, width: 3, visible: false });

// ---------------------------------------------------------------- lecture

export default {
  id: 'cardinality',
  title: 'Finite and countable sets',
  goals: [
    'Define $\\lvert A \\rvert = \\lvert B \\rvert$ by bijections; define finite, countably infinite and countable',
    'Prove that $\\mathbb{N}$, the even numbers, $\\mathbb{Z}$, $\\mathbb{N} \\times \\mathbb{N}$ and $\\mathbb{Q}$ are countable',
    'Use injections into $\\mathbb{N}$ to prove countability',
    'Build explicit bijections between intervals',
  ],
  beats: [
    // 1 ------------------------------------------------------------------------------------------------
    {
      id: 'same-size',
      title: 'Same size without counting',
      scene(s) {
        const map = s.mapDiagram({ x: 260, y: 300, gap: 280, spacing: 66, size: 34, labels: ['students', 'chairs'], domain: ['Ana', 'Ben', 'Cal', 'Dee', 'Eva'], codomain: ['1', '2', '3', '4', '5'], visible: false });
        const cap = s.text('same number, without counting', { x: 260, y: 548, size: 30, color: C.green, visible: false });
        const card1 = s.defCard({ x: 710, y: 116, width: 420, body: '$\\lvert A \\rvert = \\lvert B \\rvert$ means: there is a bijection $A \\to B$.', visible: false });
        const card2 = s.defCard({ x: 710, y: 326, width: 420, body: '$A$ is **finite** with $\\lvert A \\rvert = n$ if $\\lvert A \\rvert = \\lvert \\{1, \\dots, n\\} \\rvert$ (or $A = \\varnothing$, $n = 0$).', visible: false });
        const note = s.text('For infinite sets this is the definition, and it holds surprises.', { x: 710, y: 507, size: 30, width: 420, color: C.blue, visible: false });
        return { map, cap, card1, card2, note };
      },
      steps: [
        {
          say: 'Are there as many students as chairs? You don\'t need to count: seat everyone. If every chair is taken and nobody is standing, the numbers match.',
          do: async (s, o) => {
            await o.map.fadeIn();
            const seats = [2, 0, 4, 1, 3];
            for (let i = 0; i < 5; i++) await o.map.addArrow(i, seats[i], { duration: 420 });
            await o.cap.fadeIn();
          },
        },
        {
          say: 'That seating is a bijection, and it is how we compare sizes: $\\lvert A \\rvert = \\lvert B \\rvert${the size of A equals the size of B} means there is a bijection from $A${A} to $B${B}.',
          do: (s, o) => o.card1.reveal(),
        },
        {
          say: 'For finite sets this matches counting: a set has $n${n} elements exactly when it is in bijection with $\\{1, \\dots, n\\}${the set one through n}.',
          do: (s, o) => o.card2.reveal(),
        },
        {
          say: 'For infinite sets there is nothing to count, so the bijection is the definition. And it has surprises.',
          do: (s, o) => o.note.fadeIn(),
        },
      ],
    },

    // 2 ------------------------------------------------------------------------------------------------
    {
      id: 'hilbert',
      title: 'Hilbert’s hotel',
      scene(s) {
        const rx = (i) => 80 + 100 * i; // room i + 1
        const rooms = Array.from({ length: 8 }, (_, i) => s.rect(rx(i) - 40, 200, 80, 90, { color: C.muted, radius: 10, width: 3, visible: false }));
        const nums = rooms.map((_, i) => s.text(String(i + 1), { x: rx(i), y: 315, size: 30, color: C.muted, visible: false }));
        const dots = s.text('⋯', { x: 870, y: 245, size: 40, color: C.muted, visible: false });
        const guests = rooms.map((_, i) => s.dot(rx(i), 245, { r: 16, color: C.blue, visible: false }));
        const newbie = s.dot(rx(0), 110, { r: 16, color: C.orange, visible: false });
        const newLabel = s.text('new guest', { x: rx(0) + 110, y: 110, size: 30, color: C.orange, visible: false });
        const shiftArcs = rooms.map((_, i) => arc(s, rx(i) + 10, rx(i + 1) - 10, 192, 26));
        const doubleArcs = [1, 2, 3, 4].map((k) => arc(s, rx(k - 1) + 10, rx(2 * k - 1) - 10, 192, 22 + 14 * k, C.teal));
        const f1 = s.tex('n \\mapsto n + 1 \\colon\\ \\mathbb{N} \\to \\mathbb{N} \\setminus \\{1\\} \\text{ is a bijection}', { y: 395, size: 36, visible: false });
        const f2 = s.tex('n \\mapsto 2n:\\quad \\lvert \\mathbb{N} \\rvert = \\lvert \\{2, 4, 6, \\dots\\} \\rvert', { y: 465, size: 36, color: C.teal, visible: false });
        const fin = s.text('A finite set is never the size of a proper subset: pigeonhole.', { y: 540, size: 30, color: C.muted, visible: false });
        return { rx, rooms, nums, dots, guests, newbie, newLabel, shiftArcs, doubleArcs, f1, f2, fin };
      },
      steps: [
        {
          say: 'A hotel with rooms one, two, three, and so on forever, every room occupied. A new guest arrives. Ask everyone to move from room $n${n} to room $n + 1${n plus one}.',
          do: async (s, o) => {
            await s.all(o.rooms.map((r, i) => r.fadeIn({ delay: i * 40 })), o.nums.map((t, i) => t.fadeIn({ delay: i * 40 })), o.dots.fadeIn());
            await s.all(o.guests.map((g, i) => g.draw({ delay: i * 50 })));
            await s.all(o.newbie.draw(), o.newLabel.fadeIn());
            await s.all(o.shiftArcs.map((a, i) => a.draw({ duration: 500, delay: i * 60 })));
            await s.all(o.guests.map((g, i) => (i < 7 ? g.moveTo(o.rx(i + 1), 245, { duration: 800 }) : s.all(g.moveTo(870, 245, { duration: 800 }), g.fadeOut({ delay: 400 })))));
          },
        },
        {
          say: 'Room one is free, and nobody lost a room. The map $n \\mapsto n + 1${n maps to n plus one} is a bijection from $\\mathbb{N}${N} onto $\\mathbb{N}${N} without the one.',
          do: async (s, o) => {
            await s.all(o.shiftArcs.map((a) => a.fadeOut()), o.newLabel.fadeOut());
            await o.rooms[0].recolor(C.yellow);
            await o.newbie.moveTo(o.rx(0), 245, { duration: 700 });
            await o.f1.write();
          },
        },
        {
          say: 'Even better: send the guest in room $n${n} to room $2n${two n}. Everyone still has a room, and all the odd rooms are empty. So $\\mathbb{N}${N} has the same size as the even numbers, a proper subset.',
          do: async (s, o) => {
            await s.all(o.rooms[0].recolor(C.muted), o.newbie.fadeOut(), o.guests.map((g, i) => (i < 7 ? g.moveTo(o.rx(i), 245, { duration: 500 }) : null)), o.guests[7].moveTo(o.rx(7), 245, { duration: 10 }));
            await o.guests[7].fadeIn({ shift: [0, 0], duration: 300 });
            await s.all(o.doubleArcs.map((a, i) => a.draw({ duration: 600, delay: i * 80 })));
            await s.all(o.guests.map((g, i) => (2 * (i + 1) <= 8 ? g.moveTo(o.rx(2 * i + 1), 245, { duration: 900, delay: (3 - i) * 120 }) : s.all(g.moveTo(870, 245, { duration: 800 }), g.fadeOut({ delay: 400 })))));
            await s.all([0, 2, 4, 6].map((i) => o.rooms[i].recolor(C.yellow)));
            await o.f2.write();
          },
        },
        {
          say: 'Finite sets never do this. A bijection from a finite set onto a proper subset would be an injection into a smaller set, which pigeonhole forbids.',
          do: (s, o) => o.fin.fadeIn(),
        },
      ],
    },

    // 3 ------------------------------------------------------------------------------------------------
    {
      id: 'integers',
      title: '$\\mathbb{Z}$ is countable',
      scene(s) {
        const nl = s.numberLine({ x: 480, y: 290, width: 800, range: [-5, 5], ticks: 1, size: 32, visible: false });
        const X = (v) => 480 + nl.toX(v);
        const arcs = ZIG.slice(1).map((v, k) => {
          const u = ZIG[k];
          const [a, b] = u < v ? [X(u), X(v)] : [X(v), X(u)];
          return arc(s, a, b, 222, 12 + 9 * Math.abs(v - u), C.blue);
        });
        const card = s.defCard({ y: 458, width: 860, body: '$A$ is **countably infinite** if there is a bijection $\\mathbb{N} \\to A$: a list $a_1, a_2, a_3, \\dots$ in which every element of $A$ appears exactly once.', visible: false });
        const bad = s.text('positives first: $-1$ never gets a turn', { x: 700, y: 120, size: 30, color: C.red, visible: false });
        const formula = s.tex('f(n) = \\begin{cases} n/2 & \\text{if } n \\text{ even} \\\\ -(n - 1)/2 & \\text{if } n \\text{ odd} \\end{cases}', { x: 305, y: 470, size: 30, visible: false });
        const why = s.text('Even $n$ hit the positives, odd $n$ hit $0$ and the negatives: each integer exactly once.', { x: 750, y: 470, size: 30, width: 330, visible: false });
        return { nl, arcs, card, bad, formula, why };
      },
      steps: [
        {
          say: 'Countably infinite means there is a bijection from $\\mathbb{N}${N}: you can list the set as $a_1, a_2, a_3${a one, a two, a three}, and so on, with every element appearing exactly once.',
          do: async (s, o) => {
            await o.nl.fadeIn();
            await o.card.reveal();
          },
        },
        {
          say: 'Try listing the integers with all the positives first. One, two, three, four... the list never ends, so minus one never gets a turn.',
          do: async (s, o) => {
            const m = o.nl.marker(1, { color: 'red' });
            await m;
            for (let v = 2; v <= 5; v++) await m.moveTo(v, { duration: 380 });
            await o.bad.fadeIn();
            await s.wait(400);
            await s.all(m.fadeOut(), o.bad.fadeOut());
          },
        },
        {
          say: 'Zigzag instead: zero, one, minus one, two, minus two. Every integer is reached after finitely many steps.',
          do: async (s, o) => {
            await o.card.fadeOut();
            for (let k = 0; k < ZIG.length; k++) {
              if (k) await o.arcs[k - 1].draw({ duration: 380 });
              await o.nl.point(ZIG[k], { label: String(k + 1), color: 'blue' });
            }
          },
        },
        {
          say: 'A formula makes it a proof: $f(n) = n/2${f of n equals n over two} for even $n${n}, and $-(n-1)/2${minus n minus one over two} for odd $n${n}. Even inputs hit the positives once each, odd inputs hit zero and the negatives once each.',
          do: async (s, o) => {
            await o.formula.write({ duration: 1100 });
            await o.why.fadeIn();
          },
        },
      ],
    },

    // 4 ------------------------------------------------------------------------------------------------
    {
      id: 'try-zigzag',
      kind: 'try',
      title: 'Where is $-7$?',
      say: 'Use the formula backwards.',
      prompt: `With $f(n) = n/2$ for even $n$ and $f(n) = -(n - 1)/2$ for odd $n$, which $n$ has $f(n) = ${ZIG_TARGET}$?`,
      answer: { type: 'number', value: ZIG_ANS },
      hint: 'Negative outputs come from odd $n$.',
      solution: [
        `A negative output comes from an odd $n$, so solve $-(n - 1)/2 = ${ZIG_TARGET}$: $n - 1 = ${-2 * ZIG_TARGET}$, so $n = ${ZIG_ANS}$.`,
        `Check: $${ZIG_ANS}$ is odd and $-(${ZIG_ANS} - 1)/2 = ${zig(ZIG_ANS)}$.`,
      ],
    },

    // 5 ------------------------------------------------------------------------------------------------
    {
      id: 'nxn',
      title: '$\\mathbb{N} \\times \\mathbb{N}$ is countable',
      scene(s) {
        const g = grid(s, (m, n) => `(${m}, ${n})`, { x0: 110, y0: 150, dx: 125, dy: 85, size: 30 });
        const rowArrow = s.arrow(150, 112, 600, 112, { color: C.red, width: 3, visible: false });
        const rowNote = s.text('row 1 never ends', { x: 375, y: 80, size: 30, color: C.red, visible: false });
        const arrows = pathArrows(s, g, NXN);
        const list = NXN.map(([m, n], k) => s.tex(`${k + 1} \\mapsto (${m}, ${n})`, { x: 720, y: 100 + 40 * k, size: 30, anchor: [0, 0.5], visible: false }));
        const inj = s.tex('(m, n) \\mapsto 2^m 3^n \\text{ is injective (unique factorization)}', { y: 548, size: 32, color: C.green, visible: false });
        return { g, rowArrow, rowNote, arrows, list, inj };
      },
      steps: [
        {
          say: 'Here are all pairs of natural numbers in a grid. Going row by row fails: the first row is infinite, so we would never reach row two.',
          do: async (s, o) => {
            await o.g.show();
            await o.rowArrow.draw({ duration: 900 });
            await o.rowNote.fadeIn();
          },
        },
        {
          say: 'Go diagonal by diagonal instead: the pairs with $m + n = 2${m plus n equals two}, then three, then four. Each diagonal is finite, so every pair gets a number.',
          do: async (s, o) => {
            await s.all(o.rowArrow.fadeOut(), o.rowNote.fadeOut());
            for (let k = 0; k < NXN.length; k++) {
              const [m, n] = NXN[k];
              if (k) await o.arrows[k - 1].draw({ duration: 300 });
              await s.all(o.g.cells[m][n].recolor(C.blue), o.list[k].fadeIn({ shift: [-10, 0], duration: 300 }));
            }
          },
        },
        {
          say: 'Or skip the picture: $(m, n) \\mapsto 2^m 3^n${m, n maps to two to the m times three to the n} is an injection into $\\mathbb{N}${N}, by unique factorization from lecture eighteen. The next theorem says that is enough.',
          do: (s, o) => o.inj.write({ duration: 1100 }),
        },
      ],
    },

    // 6 ------------------------------------------------------------------------------------------------
    {
      id: 'rationals',
      title: '$\\mathbb{Q}$ is countable',
      scene(s) {
        const g = grid(s, (p, q) => `${p}/${q}`, { x0: 110, y0: 140, dx: 125, dy: 85, size: 34 });
        const greys = [1, 2, 3, 4].flatMap((p) => [1, 2, 3, 4].map((q) => [p, q])).filter(([p, q]) => gcd(p, q) > 1);
        const arrows = pathArrows(s, g, QPATH, { hw: 34, hh: 22 });
        const list = QPATH.map(([p, q], k) => s.tex(`a_{${k + 1}} = ${q === 1 ? p : `${p}/${q}`}`, { x: 720, y: 100 + 43 * k, size: 30, anchor: [0, 0.5], visible: false }));
        const thm = s.defCard({ y: 128, kind: 'theorem', width: 860, body: 'A nonempty set $A$ is countable $\\iff$ there is an injection $A \\to \\mathbb{N}$ $\\iff$ there is a surjection $\\mathbb{N} \\to A$.', visible: false });
        const inj = s.tex('\\mathbb{Q}^+ \\to \\mathbb{N} \\times \\mathbb{N},\\quad \\tfrac{p}{q} \\mapsto (p, q) \\text{ in lowest terms}', { y: 280, size: 34, visible: false });
        const injWhy = s.text('injective: a fraction has only one lowest-terms form', { y: 340, size: 30, color: C.muted, visible: false });
        const union = s.tex('\\mathbb{Q}:\\quad 0,\\ a_1, -a_1,\\ a_2, -a_2,\\ a_3, -a_3,\\ \\dots', { y: 420, size: 34, color: C.green, visible: false });
        const dense = s.text('Density is about order. A list may ignore the order completely.', { y: 520, size: 30, color: C.blue, visible: false });
        return { g, greys, arrows, list, thm, inj, injWhy, union, dense };
      },
      steps: [
        {
          say: 'Between any two rationals there are infinitely many more, so listing them in increasing order is hopeless. Arrange the positive fractions $p/q${p over q} in a grid instead, and grey out the ones not in lowest terms.',
          do: async (s, o) => {
            await o.g.show();
            await s.all(o.greys.map(([p, q]) => o.g.cells[p][q].recolor(C.faint)));
          },
        },
        {
          say: 'Now walk the diagonals, skipping the grey repeats: one, one half, two, one third, three, and so on. Every positive rational appears exactly once.',
          do: async (s, o) => {
            for (let k = 0; k < QPATH.length; k++) {
              const [p, q] = QPATH[k];
              if (k) await o.arrows[k - 1].draw({ duration: 300 });
              await s.all(o.g.cells[p][q].recolor(C.blue), o.list[k].fadeIn({ shift: [-10, 0], duration: 300 }));
            }
          },
        },
        {
          say: 'In practice you rarely build the list. A theorem does the work: a nonempty set is countable exactly when it injects into $\\mathbb{N}${N}, or equivalently when $\\mathbb{N}${N} maps onto it.',
          do: async (s, o) => {
            await s.all([...o.g.all, ...o.arrows, ...o.list].map((m) => m.fadeOut({ shift: [-20, 0] })));
            await o.thm.reveal();
          },
        },
        {
          say: 'Sending $p/q${p over q} in lowest terms to the pair $(p, q)${p, q} injects the positive rationals into $\\mathbb{N} \\times \\mathbb{N}${N cross N}, which is countable. For all of $\\mathbb{Q}${Q}, list zero first, then alternate positives and negatives, the way the integers zigzag.',
          do: async (s, o) => {
            await o.inj.write();
            await o.injWhy.fadeIn();
            await o.union.write();
          },
        },
        {
          say: 'So density and countability don\'t conflict. Density is about the order of the rationals, and a list is free to ignore that order.',
          do: (s, o) => o.dense.fadeIn(),
        },
      ],
    },

    // 7 ------------------------------------------------------------------------------------------------
    {
      id: 'fill-bijections',
      kind: 'blanks',
      title: 'Write the bijection',
      say: 'Pick the formula for each bijection, and its inverse.',
      prompt: 'Complete each bijection (and the inverse of the first).',
      lines: [
        ['f\\colon \\mathbb{N} \\to \\{2, 4, 6, \\dots\\},\\ \\ f(n) = ', { id: 'f', chips: ['2n', 'n + 2', 'n^2'], answer: '2n', hint: 'The $n$-th even number.' }, ',\\quad f^{-1}(m) = ', { id: 'g', chips: ['m/2', 'm - 2', '2m'], answer: 'm/2', hint: 'Undo the doubling.' }],
        ['h\\colon \\mathbb{N} \\to \\mathbb{Z}_{\\ge 0},\\ \\ h(n) = ', { id: 'h', chips: ['n - 1', 'n + 1', '\\lvert n \\rvert'], answer: 'n - 1', hint: 'Remember $\\mathbb{N}$ starts at $1$ and $\\mathbb{Z}_{\\ge 0}$ at $0$.' }],
      ],
      solution: [
        '$f(n) = 2n$ and $f^{-1}(m) = m/2$: $f^{-1}(f(n)) = 2n/2 = n$ and $f(f^{-1}(m)) = 2 \\cdot m/2 = m$, so they are inverse bijections. ($n + 2$ misses $2$; $n^2$ misses $2$ and hits odd squares.)',
        '$h(n) = n - 1$ sends $1 \\mapsto 0$, $2 \\mapsto 1, \\dots$; its inverse is $k \\mapsto k + 1$. ($n + 1$ misses $0$; $\\lvert n \\rvert = n$ misses $0$ too.)',
      ],
    },

    // 8 ------------------------------------------------------------------------------------------------
    {
      id: 'unions',
      title: 'Countable unions',
      scene(s) {
        const g = grid(s, (i, j) => `a_{${i}${j}}`, { x0: 165, y0: 130, dx: 105, dy: 80, size: 34 });
        const labels = [1, 2, 3, 4].map((i) => s.tex(`A_{${i}}:`, { x: 75, y: g.cy(i), size: 34, color: C.teal, visible: false }));
        const path = diagonals(5);
        const arrows = pathArrows(s, g, path, { hw: 28, hh: 20 });
        const thm = s.defCard({ x: 760, y: 135, width: 300, kind: 'theorem', body: 'A countable union of countable sets is countable.', visible: false });
        const flagText = s.text('Choosing a listing of every $A_i$ at once uses the axiom of choice (lecture 24).', { x: 760, y: 410, size: 30, width: 280, visible: false });
        const fb = flagText.box();
        const flag = s.rect(fb.x - 14, fb.y - 12, fb.w + 28, fb.h + 24, { color: C.yellow, fill: FILL.yellow, radius: 14, width: 3, visible: false });
        const every = s.text('Each $a_{ij}$ is reached in finitely many steps.', { x: 330, y: 540, size: 30, visible: false });
        return { g, labels, path, arrows, thm, flag, flagText, every };
      },
      steps: [
        {
          say: 'Now take countably many countable sets $A_1, A_2, A_3${A one, A two, A three}, and so on. List each one as a row: row $i${i} holds the elements of $A_i${A i}. If some $A_i${A i} is finite, repeat its last element; skip the empty ones.',
          do: async (s, o) => {
            await s.all(o.labels.map((l, i) => l.fadeIn({ delay: i * 80 })));
            await o.g.show();
          },
        },
        {
          say: 'Traverse the grid diagonally, as before. If an element was already listed, as when two sets overlap, skip it. Every element is reached after finitely many steps.',
          do: async (s, o) => {
            for (let k = 0; k < o.path.length; k++) {
              const [i, j] = o.path[k];
              if (k) await o.arrows[k - 1].draw({ duration: 260 });
              if (i === 2 && j === 1) await s.strike(o.g.cells[i][j]);
              else await o.g.cells[i][j].recolor(C.blue);
            }
            await o.every.fadeIn();
            await o.thm.reveal();
          },
        },
        {
          say: 'One subtle point. We picked a listing of every row, infinitely many choices at once, with no rule telling us which. That hidden infinite choice is the axiom of choice, which we meet in lecture twenty-four.',
          do: async (s, o) => {
            await s.all(o.flag.fadeIn({ shift: [0, 0] }), o.flagText.fadeIn());
            await s.all(o.labels.map((l) => l.indicate({ color: C.yellow })));
          },
        },
      ],
    },

    // 9 ------------------------------------------------------------------------------------------------
    {
      id: 'try-countable',
      kind: 'try',
      title: 'Countable?',
      say: 'Which of these sets are countable? Look for a way to cut each one into countably many countable pieces.',
      prompt: 'Which sets are countable? Select all.',
      answer: { type: 'multi', value: ['a', 'b', 'd', 'e'] },
      choices: [
        { id: 'a', label: '$\\mathbb{Z} \\times \\mathbb{Z}$', why: 'Countable: $\\mathbb{Z}$ is countable, and a product of two countable sets is countable (the same diagonal walk as $\\mathbb{N} \\times \\mathbb{N}$).' },
        { id: 'b', label: 'the set of finite subsets of $\\mathbb{N}$', why: 'Countable: for each $m$ there are finitely many subsets with largest element $m$, so it is a countable union of finite sets (plus $\\varnothing$).' },
        { id: 'c', label: '$\\mathcal{P}(\\mathbb{N})$', why: 'Not countable: Cantor’s theorem, next lecture. Infinite subsets are what make it too big.' },
        { id: 'd', label: 'polynomials with integer coefficients', why: 'Countable: for each $d$ the polynomials of degree at most $d$ are a copy of $\\mathbb{Z}^{d+1}$ (their coefficient lists), countable; take the union over $d$.' },
        { id: 'e', label: 'finite strings over $\\{a, \\dots, z\\}$', why: 'Countable: there are $26^\\ell$ strings of length $\\ell$, finitely many; take the union over $\\ell$.' },
      ],
      hint: 'Organize the set as a countable union of finite or countable pieces.',
      solution: [
        '(a), (b), (d) and (e) are countable: each is a countable union of finite or countable pieces (by coordinates, largest element, degree, and length).',
        '(c) $\\mathcal{P}(\\mathbb{N})$ is not: Cantor’s theorem (next lecture) shows no list of subsets of $\\mathbb{N}$ is complete.',
      ],
    },

    // 10 -----------------------------------------------------------------------------------------------
    {
      id: 'finite-well-defined',
      title: 'Finite sizes are well-defined',
      scene(s) {
        const claim = s.text('**Claim.** If $m \\ne n$, there is no bijection $\\{1, \\dots, m\\} \\to \\{1, \\dots, n\\}$.', { y: 50, size: 30, visible: false });
        const map = s.mapDiagram({ x: 250, y: 320, gap: 260, spacing: 72, size: 34, labels: ['m = 4', 'n = 3'], domain: ['1', '2', '3', '4'], codomain: ['1', '2', '3'], visible: false });
        const sketch = s.text('Say $m > n$ (otherwise use the inverse bijection). By pigeonhole two inputs share an output, so no map is injective. (Pigeonhole is proved by induction on $n$.)', { x: 700, y: 300, size: 30, width: 400, visible: false });
        const ninf = s.text('$\\mathbb{N}$ is infinite: any $f\\colon \\{1, \\dots, n\\} \\to \\mathbb{N}$ misses $1 + \\max f$.', { y: 150, size: 32, visible: false });
        const nl = s.numberLine({ x: 480, y: 340, width: 760, range: [0, 10], ticks: 1, size: 32, visible: false });
        const card = s.defCard({ y: 505, width: 820, body: '**Infinite** = not finite. **Countable** = finite or countably infinite.', visible: false });
        return { claim, map, sketch, ninf, nl, card };
      },
      steps: [
        {
          say: 'One thing we used without proof: a finite set can\'t have two different sizes. Without this, "the number of elements" wouldn\'t make sense. Try to match four things with three: two of them collide.',
          do: async (s, o) => {
            await o.claim.fadeIn();
            await o.map.fadeIn();
            for (const [i, j] of [[0, 0], [1, 1], [2, 2], [3, 1]]) await o.map.addArrow(i, j, { duration: 420 });
            await o.map.showCollision();
            await o.sketch.fadeIn();
          },
        },
        {
          say: 'Infinite means not finite. For example, $\\mathbb{N}${N} is infinite: any function from $\\{1, \\dots, n\\}${one through n} into $\\mathbb{N}${N} misses one more than its largest value, so it is never onto.',
          do: async (s, o) => {
            await s.all(o.map.fadeOut(), o.sketch.fadeOut());
            await o.ninf.fadeIn();
            await o.nl.fadeIn();
            const vals = [3, 7, 2];
            await s.all(vals.map((v, i) => o.nl.point(v, { label: `f(${i + 1})`, color: 'blue' })));
            await o.nl.marker(Math.max(...vals) + 1, { label: 'missed', color: 'red' });
          },
        },
        {
          say: 'Finally, countable means finite or countably infinite: the sets you can list, with the list allowed to stop.',
          do: (s, o) => o.card.reveal(),
        },
      ],
    },

    // 11 -----------------------------------------------------------------------------------------------
    {
      id: 'wo-interval-bijection',
      kind: 'workout',
      title: 'Work it out',
      say: 'Grab paper and prove that two intervals have the same size by checking that a function is a bijection.',
      prompt: 'Prove that $\\lvert (0, 1) \\rvert = \\lvert (1, \\infty) \\rvert$ by showing that $f(x) = 1/x$ is a bijection $(0, 1) \\to (1, \\infty)$.',
      answer: { type: 'proof' },
      hints: ['First check that $f$ lands in $(1, \\infty)$.', 'For surjectivity, given $y > 1$, take $x = 1/y$; check that $x \\in (0, 1)$.'],
      solution: [
        '**Proof.** If $0 < x < 1$, then $1/x > 1$, so $f$ maps $(0, 1)$ into $(1, \\infty)$.',
        '*Injective:* let $a, b \\in (0, 1)$ with $1/a = 1/b$. Multiplying by $ab \\ne 0$ gives $b = a$.',
        '*Surjective:* let $y > 1$. Then $x = 1/y$ satisfies $0 < x < 1$, so $x \\in (0, 1)$, and $f(x) = 1/(1/y) = y$.',
        'So $f$ is a bijection $(0, 1) \\to (1, \\infty)$, and by the definition of equal cardinality, $\\lvert (0, 1) \\rvert = \\lvert (1, \\infty) \\rvert$. ∎',
      ],
      rubric: [
        'Verifies the codomain: $x \\in (0, 1)$ implies $1/x \\in (1, \\infty)$.',
        'Injectivity argument from $1/a = 1/b$.',
        'Surjectivity with the preimage $1/y$ shown to lie in $(0, 1)$.',
        'Cites the definition of equal cardinality (a bijection exists).',
      ],
    },

    // 12 -----------------------------------------------------------------------------------------------
    {
      id: 'cp-countable',
      kind: 'explain',
      title: 'Explain it back',
      say: 'Before the recap, explain in your own words how a dense set like the rationals can still be listed.',
      prompt: 'The rationals are dense: between any two there are infinitely many more. Explain why they can still be listed in a sequence.',
      points: [
        'Countable means a bijection with $\\mathbb{N}$: a list hitting every element exactly once.',
        'The list does not have to respect the usual order of the numbers.',
        'Arrange $p/q$ in a grid and traverse by diagonals (each finite), skipping repeats; or inject into $\\mathbb{N} \\times \\mathbb{N}$.',
        'Density is a property of the order; countability is not.',
      ],
    },

    // 13 -----------------------------------------------------------------------------------------------
    {
      id: 'recap',
      title: 'Recap',
      scene(s) {
        const items = [
          recapItem(s, '• Same size means there is a bijection. Infinite sets can match proper subsets.', 130),
          recapItem(s, '• $\\mathbb{N}$, the evens, $\\mathbb{Z}$, $\\mathbb{N} \\times \\mathbb{N}$ and $\\mathbb{Q}$ are all countable: list them, or inject into $\\mathbb{N}$.', 250),
          recapItem(s, 'Next: a set too big to list.', 390, C.blue),
        ];
        return { items };
      },
      steps: [
        {
          say: 'Two sets have the same size when there is a bijection between them, and infinite sets can have the size of a proper subset.',
          do: (s, o) => o.items[0].fadeIn({ shift: [-16, 0] }),
        },
        {
          say: 'The natural numbers, the even numbers, the integers, pairs of naturals and the rationals are all countable. To prove it, list them, or inject into $\\mathbb{N}${N}.',
          do: (s, o) => o.items[1].fadeIn({ shift: [-16, 0] }),
        },
        {
          say: 'Next time: a set so big that no list can contain all of it.',
          do: (s, o) => o.items[2].fadeIn({ shift: [-16, 0] }),
        },
      ],
    },
  ],
};
