/**
 * Lecture 18 · GCD, Euclid's algorithm and unique factorization (foundations/PLAN.md § 18). Irani · Integers,
 * Liebeck 11.
 *
 * Choreography: divisor lists whose common entries fly into one row; Euclid's algorithm written line by line
 * beside a 360 × 84 rectangle tiled by ever smaller squares (the last square size tiles everything); the
 * back-substitution where the boxed remainder is replaced by the expression that flies up from its line;
 * Bézout's set of combinations lighting up on a number line; prime exponents flying down into gcd / lcm rows.
 * Every number (divisors, quotients, remainders, coefficients, checks) is computed below.
 */
import { C, FILL } from '../../lectern/src/core/stage.js';

// ---------------------------------------------------------------- number theory (pure)

const gcd = (a, b) => {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a;
};
const divisors = (n) => Array.from({ length: n }, (_, i) => i + 1).filter((d) => n % d === 0);
const commonDivisors = (a, b) => divisors(Math.min(a, b)).filter((d) => a % d === 0 && b % d === 0);

/** Division lines of Euclid's algorithm for a ≥ b > 0: [{ a, b, q, r }], the last one with r = 0. */
function euclid(a, b) {
  const out = [];
  while (b) {
    const q = Math.floor(a / b);
    const r = a % b;
    out.push({ a, b, q, r });
    [a, b] = [b, r];
  }
  return out;
}

/**
 * Extended Euclid by back-substitution. trail[0]: g = s·A + t·B from the line whose remainder is g; each later
 * entry substitutes the remainder `sub.r = sub.a - sub.q·sub.b` and ends at g = x·a + y·b.
 */
function backsub(a, b) {
  const L = euclid(a, b);
  const k = L.length - 2;
  if (k < 0) return { g: b, x: 0, y: 1, L, trail: [] };
  let s = 1;
  let t = -L[k].q;
  const trail = [{ s, A: L[k].a, t, B: L[k].b }];
  for (let i = k - 1; i >= 0; i--) {
    const prev = { s, t, A: L[i + 1].a, B: L[i + 1].b };
    [s, t] = [t, s - t * L[i].q];
    trail.push({ s, A: L[i].a, t, B: L[i].b, sub: L[i], prev });
  }
  return { g: L[k].r, x: s, y: t, L, trail };
}

/** Prime factorization as [[p, e], …]. */
function factor(n) {
  const out = [];
  for (let p = 2; p * p <= n; p++) {
    let e = 0;
    while (n % p === 0) {
      n /= p;
      e++;
    }
    if (e) out.push([p, e]);
  }
  if (n > 1) out.push([n, 1]);
  return out;
}
const expOf = (n, p) => factor(n).find(([q]) => q === p)?.[1] ?? 0;

// ---------------------------------------------------------------- TeX formatting

const times = (c, X) => (c === 1 ? `${X}` : c === -1 ? `-${X}` : `${c} \\cdot ${X}`);
/** s·A + t·B as TeX ("4 \cdot 54 - 198"). */
const lin = (s, A, t, B) => `${times(s, A)} ${t < 0 ? '-' : '+'} ${times(Math.abs(t), B)}`;
const divLine = ({ a, b, q, r }) => `${a} = ${q} \\cdot ${b} + ${r}`;
const paren = (v) => (v < 0 ? `(${v})` : `${v}`);

/** Markdown paragraphs: Euclid's lines, the back-substitution, the coefficients and the check. */
function euclidSolution(a, b) {
  const R = backsub(a, b);
  const paras = [`Divide and repeat: ${R.L.map((l) => `$${divLine(l)}$`).join(', ')}. The last nonzero remainder is $${R.g}$, so $\\gcd(${a}, ${b}) = ${R.g}$.`];
  if (R.trail.length) {
    const first = R.trail[0];
    const steps = [`From the second-to-last line, $${R.g} = ${lin(first.s, first.A, first.t, first.B)}$.`];
    for (const st of R.trail.slice(1)) {
      const { sub, prev } = st;
      const inner = `${sub.a} - ${times(sub.q, sub.b)}`;
      const c = Math.abs(prev.t);
      steps.push(
        `Substitute $${sub.r} = ${inner}$: $${R.g} = ${times(prev.s, prev.A)} ${prev.t < 0 ? '-' : '+'} ${c === 1 ? '' : c}(${inner}) = ${lin(st.s, st.A, st.t, st.B)}$.`,
      );
    }
    paras.push(steps.join(' '));
  } else {
    paras.push(`$${b}$ divides $${a}$, so $${R.g} = 0 \\cdot ${a} + 1 \\cdot ${b}$.`);
  }
  paras.push(`So $x = ${R.x}$, $y = ${R.y}$. Check: $${a} \\cdot ${paren(R.x)} + ${b} \\cdot ${paren(R.y)} = ${a * R.x} ${b * R.y < 0 ? '-' : '+'} ${Math.abs(b * R.y)} = ${R.g}$.`);
  return { R, paras };
}

// ---------------------------------------------------------------- data

const A0 = 360;
const B0 = 84;
const DIV_B = divisors(B0);
const DIV_A = divisors(A0);
const COMMON = commonDivisors(A0, B0);
const G0 = gcd(A0, B0);
const EU = euclid(A0, B0); // 360 = 4·84 + 24, 84 = 3·24 + 12, 24 = 2·12 + 0
const BZ = backsub(A0, B0); // 12 = 13·84 − 3·360
const R1 = EU[0].r;

// Twenty-digit pair: shared prime 1000000007 (the factorization is never needed by Euclid).
const P_BIG = 1000000007n;
const BIG_A = P_BIG * 1000000009n;
const BIG_B = P_BIG * 998244353n;
function bigEuclid(a, b) {
  let n = 0;
  while (b) {
    [a, b] = [b, a % b];
    n++;
  }
  return { g: a, n };
}
const BIG = bigEuclid(BIG_A, BIG_B);
const group3 = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '\\,');

// Practice data.
const TRY = backsub(1071, 462);
const WO = euclidSolution(252, 198);
const LCM0 = (A0 * B0) / G0;
const PRIMES = [2, 3, 5, 7];

// ---------------------------------------------------------------- local helpers

const recapItem = (s, str, y, color = C.ink) => s.text(str, { x: 80, y, size: 32, anchor: [0, 0.5], width: 820, align: 'left', color, visible: false });

/** Rows of numbers (each its own Tex) laid out from x0 with a fixed pitch. */
function numberRow(s, nums, { x0, y, pitch = 56, size = 30, color } = {}) {
  return nums.map((n, i) => s.tex(String(n), { x: x0 + i * pitch, y, size, color, visible: false }));
}

/** Euclid's squares for a × b (a ≥ b): per division line, the squares cut off, in number units. */
function tiling(a, b) {
  let reg = { x: 0, y: 0, w: a, h: b };
  return euclid(a, b).map(({ b: side, q }) => {
    const wide = reg.w >= reg.h;
    const sq = Array.from({ length: q }, (_, i) => (wide ? { x: reg.x + i * side, y: reg.y, side } : { x: reg.x, y: reg.y + i * side, side }));
    reg = wide ? { x: reg.x + q * side, y: reg.y, w: reg.w - q * side, h: reg.h } : { x: reg.x, y: reg.y + q * side, w: reg.w, h: reg.h - q * side };
    return { sq, rest: { ...reg } };
  });
}

// Euclid beat geometry (the rectangle 360 × 84 drawn 820 px wide).
const RX = 100;
const RY = 268;
const RK = 820 / A0;
const TILES = tiling(A0, B0);
const TILE_COLORS = ['blue', 'teal', 'green'];
const EQ_Y = [55, 110, 165];

function euclidLines(s, visible) {
  return EU.map((l, i) => s.tex(`${l.a} = ${l.q} \\cdot ${l.b} + \\part{r}{${l.r}}`, { x: 250, y: EQ_Y[i], size: 36, visible }));
}

const lecture = {
  id: 'gcd',
  title: 'GCD, Euclid’s algorithm and unique factorization',
  goals: [
    'Define $\\gcd(a, b)$ and compute it with the Euclidean algorithm',
    'Prove $\\gcd(a, b) = \\gcd(b, r)$ and explain why the algorithm terminates',
    'Find Bézout coefficients $x, y$ with $ax + by = \\gcd(a, b)$',
    'Prove Euclid’s lemma and the uniqueness part of the Fundamental Theorem of Arithmetic',
  ],
  beats: [
    // 1 ------------------------------------------------------------------------------------------------
    {
      id: 'gcd-def',
      title: 'Greatest common divisor',
      scene(s) {
        const lab = (str, y) => s.text(str, { x: 70, y, size: 30, anchor: [0, 0.5], color: C.muted, visible: false });
        const X0 = 105;
        const PITCH = 68;
        const labB = lab(`divisors of $${B0}$`, 52);
        const labA = lab(`divisors of $${A0}$`, 148);
        const labC = lab('common divisors', 300);
        const rowB = numberRow(s, DIV_B, { x0: X0, y: 96, pitch: PITCH });
        const rowA = [...numberRow(s, DIV_A.slice(0, 12), { x0: X0, y: 192, pitch: PITCH }), ...numberRow(s, DIV_A.slice(12), { x0: X0, y: 240, pitch: PITCH })];
        const fly = COMMON.map((d) => s.tex(String(d), { x: rowB[DIV_B.indexOf(d)].x, y: 96, size: 30, color: C.yellow, visible: false }));
        const slots = COMMON.map((_, i) => X0 + i * PITCH);
        const card = s.defCard({
          y: 478,
          body: 'For $a, b \\in \\mathbb{Z}$ not both $0$, $\\gcd(a, b)$ is the largest integer dividing both $a$ and $b$. Also $\\gcd(a, 0) = \\lvert a \\rvert$.',
          width: 860,
          visible: false,
        });
        const bigA = s.tex(`a = ${group3(BIG_A)}`, { x: 480, y: 266, size: 36, visible: false });
        const bigB = s.tex(`b = ${group3(BIG_B)}`, { x: 480, y: 322, size: 36, visible: false });
        const bigQ = s.tex('\\gcd(a, b) = \\;?', { x: 480, y: 390, size: 36, color: C.yellow, visible: false });
        const bigE = s.tex(`\\text{Euclid: } ${BIG.n} \\text{ divisions} \\implies \\gcd(a, b) = ${group3(BIG.g)}`, { x: 480, y: 470, size: 34, color: C.green, visible: false });
        return { labA, labB, labC, rowA, rowB, fly, slots, card, bigA, bigB, bigQ, bigE };
      },
      steps: [
        {
          say: 'Take two numbers, eighty-four and three hundred sixty, and list every positive divisor of each.',
          do: async (s, o) => {
            await o.labB.fadeIn({ shift: [-12, 0] });
            await s.stagger(o.rowB.map((m) => () => m.fadeIn()), 70);
            await o.labA.fadeIn({ shift: [-12, 0] });
            await s.stagger(o.rowA.map((m) => () => m.fadeIn()), 45);
          },
        },
        {
          say: 'The common divisors are the numbers on both lists: one, two, three, four, six and twelve. The greatest of them, twelve, is the greatest common divisor.',
          do: async (s, o) => {
            const hit = (row, list) => row.filter((_, i) => COMMON.includes(list[i]));
            await s.all([...hit(o.rowB, DIV_B), ...hit(o.rowA, DIV_A)].map((m) => m.recolor(C.yellow)));
            await o.labC.fadeIn({ shift: [-12, 0] });
            await s.stagger(o.fly.map((m, i) => () => m.show() && m.moveTo(o.slots[i], 345, { duration: 650 })), 120);
            await s.wait(150);
            const top = o.fly.at(-1);
            await s.all(top.recolor(C.green), top.scaleTo(1.3));
            o.r12 = s.surround(top, { color: C.green, pad: 8, radius: 12, visible: false });
            await o.r12.draw({ duration: 450 });
          },
        },
        {
          say: 'Here is the definition. For integers $a${a} and $b${b}, not both zero, $\\gcd(a, b)${the gcd of a and b} is the largest integer dividing both, and $\\gcd(a, 0) = \\lvert a \\rvert${the gcd of a and zero is the absolute value of a}.',
          do: (s, o) => o.card.reveal(),
        },
        {
          say: 'Listing divisors works for small numbers only. For numbers with nearly twenty digits, listing divisors means factoring, and factoring big numbers is hard.',
          do: async (s, o) => {
            const old = [o.labA, o.labB, o.labC, ...o.rowA, ...o.rowB, ...o.fly, o.r12];
            await s.all(old.map((m, i) => m.fadeOut({ delay: (i % 12) * 20, shift: [0, -14] })));
            await o.card.shift(0, -340, { duration: 700 });
            await o.bigA.write();
            await o.bigB.write();
            await o.bigQ.fadeIn();
          },
        },
        {
          say: 'Euclid’s algorithm avoids factoring entirely. It finds this gcd in sixteen divisions, without knowing a single prime factor.',
          do: async (s, o) => {
            await o.bigQ.fadeOut();
            await o.bigE.write({ duration: 1100 });
            await o.bigE.indicate({ color: C.green, scale: 1.06 });
          },
        },
      ],
    },

    // 2 ------------------------------------------------------------------------------------------------
    {
      id: 'key-lemma',
      title: 'The key lemma',
      scene(s) {
        const lemma = s.text('**Lemma.** Let $a, b, q, r \\in \\mathbb{Z}$ with $a, b$ not both $0$. If $a = bq + r$, then $\\gcd(a, b) = \\gcd(b, r)$.', { y: 74, size: 30, width: 860, visible: false });
        const set = (x) => `\\{${x.join(', ')}\\}`;
        const D1 = commonDivisors(A0, B0);
        if (set(D1) !== set(commonDivisors(B0, R1))) throw new Error('gcd lecture: key-lemma example');
        const ex = s.tex(`(${A0}, ${B0}) \\to \\part{s}{${set(D1)}} \\leftarrow (${B0}, ${R1})`, { x: 480, y: 142, size: 30, color: C.muted, visible: false });
        const p = s.proof({ y: 172, width: 900, height: 398, size: 30 });
        return { lemma, ex, p };
      },
      steps: [
        {
          say: 'The whole algorithm rests on one lemma: if $a = bq + r${a equals b q plus r}, then the pair $a, b${a, b} and the pair $b, r${b, r} have exactly the same common divisors. Three sixty and eighty-four share theirs with eighty-four and twenty-four.',
          do: async (s, o) => {
            await o.lemma.fadeIn();
            await o.ex.write({ duration: 1100 });
            await o.ex.color('s', C.yellow);
          },
        },
        {
          say: 'One direction: a common divisor $d${d} of $a${a} and $b${b} divides $a - bq${a minus b q}, which is $r${r}. That is the linear-combination fact from last lecture.',
          do: async (s, o) => {
            await o.p.add('**Proof.** Let $d \\in \\mathbb{Z}$.', { kind: 'assume', why: '$a = bq + r$ as above' });
            o.d1 = o.p.add('If $d \\mid a, b$, then $d \\mid a - bq = r$.', { why: 'linear combination' });
            await o.d1;
            await o.p.highlight(o.d1, 'yellow');
          },
        },
        {
          say: 'The other direction is the same fact: a common divisor of $b${b} and $r${r} divides $bq + r${b q plus r}, which is $a${a}.',
          do: async (s, o) => {
            await o.p.unhighlight(o.d1);
            o.d2 = o.p.add('If $d \\mid b, r$, then $d \\mid bq + r = a$.', { why: 'linear combination' });
            await o.d2;
            await o.p.highlight(o.d2, 'yellow');
          },
        },
        {
          say: 'Same common divisors, so the same greatest one. We may replace the pair $(a, b)${a, b} by the smaller pair $(b, r)${b, r} without changing the gcd.',
          do: async (s, o) => {
            await o.p.unhighlight(o.d2);
            await o.p.add('Same common divisors for both pairs.', { why: 'lines 2 and 3' });
            await o.p.add('Therefore $\\gcd(a, b) = \\gcd(b, r)$.', { kind: 'conclude', why: 'same set, same max' });
            await o.p.qed();
          },
        },
      ],
    },

    // 3 ------------------------------------------------------------------------------------------------
    {
      id: 'euclid',
      title: 'Euclid’s algorithm',
      scene(s) {
        const eqs = euclidLines(s, false);
        const H = B0 * RK;
        const outer = s.rect(RX, RY, A0 * RK, H, { color: C.ink, width: 3, visible: false });
        const brace = s.brace(RX, RY - 8, RX + A0 * RK, RY - 8, { label: String(A0), side: 'above', size: 30, visible: false });
        const side = s.text(String(B0), { x: RX - 38, y: RY + H / 2, size: 30, visible: false });
        const tiles = TILES.map(({ sq }, i) =>
          sq.map(({ x, y, side: d }) => {
            const c = TILE_COLORS[i];
            const rect = s.rect(RX + x * RK, RY + y * RK, d * RK, d * RK, { color: C[c], fill: FILL[c], width: 2, visible: false });
            const label = d * RK >= 50 ? s.text(String(d), { x: RX + (x + d / 2) * RK, y: RY + (y + d / 2) * RK, size: 30, color: C[c], visible: false }) : null;
            return { rect, label };
          }),
        );
        const rest = TILES.map(({ rest: r }) => ({ x: RX + r.x * RK, y: RY + r.y * RK, w: r.w * RK, h: r.h * RK }));
        const dec = s.tex([A0, B0, ...EU.map((l) => l.r)].join(' > '), { x: 690, y: 110, size: 32, visible: false });
        const g = EU.at(-2).r;
        const grid = [];
        for (let x = g; x < A0; x += g) grid.push(`M${RX + x * RK} ${RY}V${RY + H}`);
        for (let y = g; y < B0; y += g) grid.push(`M${RX} ${RY + y * RK}H${RX + A0 * RK}`);
        const gridMob = s.path(grid.join(''), { color: C.green, width: 1.5, layer: 'front', visible: false });
        const chain = s.tex(`${EU.map((l) => `\\gcd(${l.a}, ${l.b})`).join(' = ')} = ${g}`, { x: 480, y: 525, size: 32, color: C.green, visible: false });
        return { eqs, outer, brace, side, tiles, rest, dec, gridMob, chain };
      },
      steps: [
        {
          say: 'Divide three sixty by eighty-four: four times, remainder twenty-four. In the picture, four eighty-four squares fit in a three sixty by eighty-four rectangle, leaving a strip twenty-four wide.',
          do: async (s, o) => {
            await s.all(o.outer.draw({ duration: 700 }), o.brace.draw(), o.side.fadeIn());
            await o.eqs[0].write();
            await s.stagger(o.tiles[0].map((t) => () => s.all(t.rect.fadeIn({ shift: [0, 0] }), t.label?.fadeIn())), 280);
            o.strip = s.surround(o.rest[0], { color: C.yellow, pad: 3, radius: 4, visible: false });
            await o.strip.draw({ duration: 500 });
          },
        },
        {
          say: 'Keep the divisor and the remainder, and repeat. Eighty-four is three twenty-fours plus twelve, and twenty-four is exactly two twelves, remainder zero.',
          do: async (s, o) => {
            await o.strip.fadeOut();
            await o.eqs[1].write();
            await s.stagger(o.tiles[1].map((t) => () => s.all(t.rect.fadeIn({ shift: [0, 0] }), t.label?.fadeIn())), 250);
            await o.eqs[2].write();
            await s.stagger(o.tiles[2].map((t) => () => t.rect.fadeIn({ shift: [0, 0] })), 250);
          },
        },
        {
          say: 'The remainders strictly decrease and never go below zero, so the algorithm must stop: a decreasing sequence of nonnegative integers cannot go on forever.',
          do: async (s, o) => {
            await s.all(o.eqs.map((e) => e.color('r', C.yellow)));
            await o.dec.write({ duration: 1000 });
          },
        },
        {
          say: 'The last nonzero remainder, twelve, is the gcd: by the lemma every line keeps the gcd the same, and $\\gcd(12, 0) = 12${the gcd of twelve and zero is twelve}. In the picture, twelve-squares tile the whole rectangle.',
          do: async (s, o) => {
            await s.all(o.eqs[1].color('r', C.green), o.eqs[0].color('r', C.muted), o.eqs[2].color('r', C.muted));
            await o.gridMob.draw({ duration: 1200 });
            await o.chain.write({ duration: 1200 });
          },
        },
      ],
    },

    // 4 ------------------------------------------------------------------------------------------------
    {
      id: 'try-gcd',
      kind: 'try',
      title: 'Run Euclid',
      say: 'Your turn. Run Euclid’s algorithm on these two numbers.',
      prompt: 'Compute $\\gcd(1071, 462)$.',
      answer: { type: 'number', value: TRY.g },
      hint: `$${divLine(TRY.L[0])}$.`,
      solution: [`${TRY.L.map((l) => `$${divLine(l)}$`).join('; ')}.`, `The last nonzero remainder is $${TRY.g}$, so $\\gcd(1071, 462) = ${TRY.g}$.`],
    },

    // 5 ------------------------------------------------------------------------------------------------
    {
      id: 'bezout-back',
      title: 'Running it backwards',
      scene(s) {
        const eqs = euclidLines(s, true).slice(0, 2);
        const solved = EU.slice(0, 2).map((l, i) =>
          s.tex(`\\part{r}{${l.r}} = \\part{rhs}{${l.a} - ${l.q} \\cdot ${l.b}}`, { x: 735, y: EQ_Y[i], size: 36, visible: false }),
        );
        const arrows = EQ_Y.slice(0, 2).map((y) => s.arrow(465, y, 560, y, { color: C.muted, width: 3, visible: false }));
        const [l0, l1] = EU;
        const main = s.tex(`${G0} = ${l1.a} - ${l1.q} \\cdot \\part{b}{${l1.b}}`, { x: 480, y: 250, size: 42, visible: false });
        const sub = `${l0.a} - ${l0.q} \\cdot ${l0.b}`;
        const mainSub = `${G0} = ${l1.a} - ${l1.q}\\,(\\part{b}{${sub}})`;
        const coll = s.tex(`= \\part{y}{${BZ.y}} \\cdot ${B0} - \\part{x}{${-BZ.x}} \\cdot ${A0}`, { x: 480, y: 330, size: 42, visible: false });
        const check = s.tex(`${BZ.y} \\cdot ${B0} - ${-BZ.x} \\cdot ${A0} = ${BZ.y * B0} - ${-BZ.x * A0} = ${BZ.y * B0 + BZ.x * A0} \\ \\checkmark`, { x: 480, y: 425, size: 36, color: C.green, visible: false });
        const note = s.text(`Bézout coefficients: $${A0} \\cdot (${BZ.x}) + ${B0} \\cdot ${BZ.y} = ${G0}$`, { x: 480, y: 510, size: 30, color: C.muted, visible: false });
        return { eqs, solved, arrows, main, mainSub, sub, coll, check, note };
      },
      steps: [
        {
          say: 'Euclid’s algorithm also runs backwards. First solve each line for its remainder: twenty-four is three sixty minus four eighty-fours, and twelve is eighty-four minus three twenty-fours.',
          do: async (s, o) => {
            for (let i = 0; i < 2; i++) {
              await o.arrows[i].draw({ duration: 400 });
              await o.solved[i].write({ duration: 800 });
            }
          },
        },
        {
          say: 'Start from the gcd: twelve is eighty-four minus three times twenty-four. But twenty-four is not one of our original numbers, so it has to go.',
          do: async (s, o) => {
            await o.main.write();
            o.box = s.ring([o.main, 'b'], { color: 'yellow', shape: 'box' });
            await o.box;
          },
        },
        {
          say: 'Substitute three sixty minus four eighty-fours for the twenty-four, then collect the multiples of eighty-four: $12 = 13 \\cdot 84 - 3 \\cdot 360${twelve equals thirteen times eighty-four minus three times three sixty}.',
          do: async (s, o) => {
            const from = o.solved[0].partBox('rhs');
            const to = o.main.partBox('b');
            const fly = s.tex(o.sub, { x: from.cx, y: from.cy, size: 36, color: C.yellow });
            await s.all(o.solved[0].color('rhs', C.yellow), fly.moveTo(to.cx, to.cy - 6, { duration: 900 }));
            await s.all(o.box.fadeOut(), fly.fadeOut(), o.main.swap(o.mainSub));
            await o.main.color('b', C.yellow);
            await o.coll.write();
            await s.all(o.coll.color('y', C.blue), o.coll.color('x', C.blue));
          },
        },
        {
          say: 'Always check the final combination. Thirteen times eighty-four is ten ninety-two, three times three sixty is ten eighty, and the difference is twelve.',
          do: async (s, o) => {
            await o.check.write({ duration: 1100 });
            await o.note.fadeIn();
          },
        },
      ],
    },

    // 6 ------------------------------------------------------------------------------------------------
    {
      id: 'bezout-theorem',
      title: 'Bézout’s identity',
      scene(s) {
        const card = s.defCard({
          y: 118,
          title: 'Bézout’s identity',
          body: 'For $a, b \\in \\mathbb{Z}$ not both $0$, $\\gcd(a, b)$ is the smallest positive element of $\\{ax + by : x, y \\in \\mathbb{Z}\\}$.',
          width: 860,
          visible: false,
        });
        const nl = s.numberLine({ x: 480, y: 330, width: 800, range: [-12, 12], ticks: 1, labels: 2, size: 30, visible: false });
        const nlCap = s.text('combinations $4x + 6y$', { x: 480, y: 240, size: 30, color: C.muted, visible: false });
        const sk = [
          'Positive elements exist ($a^2 + b^2$); $d$ = the least (well-ordering).',
          'Divide: $a = dq + r$, $0 \\le r < d$; then $r = a - dq$ is one too.',
          '$r < d$ forces $r = 0$ (minimality), so $d \\mid a$; likewise $d \\mid b$.',
          'Common divisors of $a, b$ divide $ax + by = d$, so $d = \\gcd(a, b)$.',
        ].map((str, i) => s.text(str, { x: 60, y: 242 + i * 54, size: 30, anchor: [0, 0.5], visible: false }));
        const cor = [
          '• Every common divisor of $a$ and $b$ divides $\\gcd(a, b)$.',
          '• $\\gcd(a, b) = 1 \\iff ax + by = 1$ for some $x, y \\in \\mathbb{Z}$.',
        ].map((str, i) => s.text(str, { x: 60, y: 475 + i * 56, size: 30, anchor: [0, 0.5], color: C.blue, visible: false }));
        return { card, nl, nlCap, sk, cor };
      },
      steps: [
        {
          say: 'Bézout’s identity says the gcd is a linear combination. For integers $a${a} and $b${b}, not both zero, the smallest positive number of the form $ax + by${a x plus b y} is exactly the gcd.',
          do: (s, o) => o.card.reveal(),
        },
        {
          say: 'Picture it for four and six. Four and six are combinations, so is six minus four, which is two, and then every multiple of two. Nothing odd ever appears, and the smallest positive one is two, the gcd.',
          do: async (s, o) => {
            await s.all(o.nl.fadeIn({ shift: [0, 0] }), o.nlCap.fadeIn());
            o.p4 = o.nl.point(4, { color: 'blue', label: '4' });
            o.p6 = o.nl.point(6, { color: 'teal', label: '6' });
            await s.all(o.p4, o.p6);
            const two = o.nl.point(2, { color: 'green', label: '2' });
            await two;
            const rest = [-12, -10, -8, -6, -4, -2, 0, 8, 10, 12].map((v, i) => o.nl.point(v, { color: 'muted' }));
            await Promise.all(rest);
            o.two = two;
          },
        },
        {
          say: 'The proof is well-ordering plus division again. Let $d${d} be the smallest positive combination and divide $a${a} by $d${d}: the remainder is again a combination, but smaller than $d${d}, so it must be zero.',
          do: async (s, o) => {
            await s.all(o.nl.fadeOut(), o.nlCap.fadeOut());
            for (const t of o.sk.slice(0, 3)) await t.fadeIn({ shift: [-12, 0] });
          },
        },
        {
          say: 'And any common divisor of $a${a} and $b${b} divides every combination, $d${d} included. So $d${d} is the greatest common divisor.',
          do: async (s, o) => {
            await o.sk[3].fadeIn({ shift: [-12, 0] });
            await o.sk[3].indicate({ color: C.green, scale: 1.04 });
          },
        },
        {
          say: 'Two corollaries we will use constantly: every common divisor divides the gcd, and $a${a} and $b${b} are coprime exactly when the number one is a combination of them.',
          do: (s, o) => s.stagger(o.cor.map((c) => () => c.fadeIn({ shift: [-12, 0] })), 700),
        },
      ],
    },

    // 7 ------------------------------------------------------------------------------------------------
    {
      id: 'fill-bezout',
      kind: 'blanks',
      title: 'Back-substitute',
      say: 'Run the algorithm backwards for the pair from the last exercise and fill in the two coefficients.',
      prompt: `From $${divLine(TRY.L[0])}$ and $${divLine(TRY.L[1])}$, write $${TRY.g}$ as a combination of $1071$ and $462$. Enter the coefficients that back-substitution gives.`,
      lines: [
        [`${TRY.g} = 1071 \\cdot (`, { id: 'x', answer: { type: 'number', value: TRY.x }, hint: 'Start from the second line, solved for its remainder.' }, ') + 462 \\cdot ', { id: 'y', answer: { type: 'number', value: TRY.y } }],
      ],
      solution: [
        `$${TRY.g} = 462 - 3 \\cdot 147 = 462 - 3(1071 - 2 \\cdot 462) = ${lin(TRY.y, 462, TRY.x, 1071)}$.`,
        `Check: $1071 \\cdot (${TRY.x}) + 462 \\cdot ${TRY.y} = ${1071 * TRY.x} + ${462 * TRY.y} = ${TRY.g}$. Other pairs exist (add $22$ to $x$ and subtract $51$ from $y$); this one comes from back-substitution.`,
      ],
    },

    // 8 ------------------------------------------------------------------------------------------------
    {
      id: 'euclid-lemma',
      title: 'Euclid’s lemma',
      scene(s) {
        const thm = s.text('**Euclid’s lemma.** If $p$ is prime and $p \\mid ab$, then $p \\mid a$ or $p \\mid b$.', { y: 52, size: 32, visible: false });
        const ex = s.tex(`7 \\mid 6 \\cdot 14 = ${6 * 14}, \\ \\ 7 \\nmid 6 \\implies 7 \\mid 14`, { x: 480, y: 104, size: 30, color: C.muted, visible: false });
        const p = s.proof({ y: 134, width: 900, height: 436, size: 30 });
        return { thm, ex, p };
      },
      steps: [
        {
          say: 'Euclid’s lemma: if a prime divides a product, it divides one of the factors. Seven divides six times fourteen, and since seven does not divide six, it must divide fourteen.',
          do: async (s, o) => {
            await o.thm.fadeIn();
            await o.ex.write({ duration: 1000 });
          },
        },
        {
          say: 'The proof: if $p${p} divides $a${a} we are done, so assume it does not, and show that $p${p} divides $b${b}. A prime’s only positive divisors are one and itself, so $\\gcd(p, a) = 1${the gcd of p and a is one}.',
          do: async (s, o) => {
            await o.p.add('**Proof.** Let $a, b \\in \\mathbb{Z}$ with $p \\mid ab$.', { kind: 'assume', why: 'hypotheses' });
            await o.p.add('If $p \\mid a$, done; so let $p \\nmid a$.', { why: 'show $p \\mid b$' });
            await o.p.add('Then $\\gcd(p, a) = 1$.', { why: 'only divisors $1, p$' });
          },
        },
        {
          say: 'Bézout turns coprime into an equation: $px + ay = 1${p x plus a y equals one} for some integers $x${x} and $y${y}.',
          do: async (s, o) => {
            o.bz = o.p.add('So $px + ay = 1$ for some $x, y \\in \\mathbb{Z}$.', { why: 'Bézout' });
            await o.bz;
            await o.p.highlight(o.bz, 'yellow');
          },
        },
        {
          say: 'Multiply by $b${b}: $b = pbx + aby${b equals p b x plus a b y}. The prime divides both terms, the second because it divides $ab${a b}. So it divides their sum, which is $b${b}.',
          do: async (s, o) => {
            await o.p.unhighlight(o.bz);
            await o.p.add('Then $b = pbx + aby$.', { why: 'multiply by $b$' });
            await o.p.add('$p \\mid pbx$, and $p \\mid aby$ since $p \\mid ab$.', { why: 'definition of divides' });
            await o.p.add('Therefore $p \\mid b$.', { kind: 'conclude', why: 'linear combination' });
            await o.p.qed();
          },
        },
      ],
    },

    // 9 ------------------------------------------------------------------------------------------------
    {
      id: 'try-lemma-needs-prime',
      kind: 'try',
      title: 'Why prime?',
      say: 'Here is a product divisible by six, where six divides neither factor. What does it show?',
      prompt: `$6 \\mid 4 \\cdot 9 = ${4 * 9}$, but $6 \\nmid 4$ and $6 \\nmid 9$. What does this show?`,
      answer: { type: 'choice', value: 'a' },
      choices: [
        { id: 'a', label: 'Euclid’s lemma needs $p$ to be prime', why: `Right. For $6$ the proof breaks at its second line: $\\gcd(6, 4) = ${gcd(6, 4)} \\ne 1$, so there is no Bézout equation with $1$.` },
        { id: 'b', label: 'Euclid’s lemma is false', why: 'The lemma is stated for primes, and $6$ is not prime: this is not a counterexample to it.' },
        { id: 'c', label: '$6 \\nmid 36$', why: `It does: $36 = 6 \\cdot ${36 / 6}$.` },
        { id: 'd', label: '$\\gcd(6, 4) = 1$', why: `$\\gcd(6, 4) = ${gcd(6, 4)}$, and that is exactly where the proof breaks.` },
      ],
      hint: 'Which line of the proof of Euclid’s lemma fails when $p = 6$?',
      solution: [
        `The proof needs $\\gcd(p, a) = 1$ from $p \\nmid a$, which holds because a prime has no divisors besides $1$ and $p$. For $6$ and $4$: $\\gcd(6, 4) = ${gcd(6, 4)} \\ne 1$, so there is no Bézout equation $6x + 4y = 1$.`,
        'So the hypothesis “$p$ prime” is essential: (a).',
      ],
    },

    // 10 -----------------------------------------------------------------------------------------------
    {
      id: 'fta',
      title: 'The Fundamental Theorem of Arithmetic',
      scene(s) {
        const thm = s.text('**Theorem.** Every integer $n \\ge 2$ is a product of primes, uniquely up to the order of the factors.', { y: 70, size: 30, width: 860, visible: false });
        // existence: split 360 by its smallest prime factor, one factor at a time
        const fs = [];
        for (let n = A0, p = 2; n > 1; ) {
          if (n % p === 0) {
            fs.push(p);
            n /= p;
          } else p++;
        }
        const frames = [];
        for (let i = 1; i <= fs.length; i++) {
          const rest = A0 / fs.slice(0, i).reduce((a, b) => a * b, 1);
          frames.push(`${A0} = ${fs.slice(0, i).join(' \\cdot ')}${rest > 1 ? ` \\cdot ${rest}` : ''}`);
        }
        const pretty = `${A0} = ${factor(A0).map(([p, e]) => (e > 1 ? `${p}^{${e}}` : `${p}`)).join(' \\cdot ')}`;
        const exist = s.tex(frames[0], { x: 480, y: 152, size: 38, visible: false });
        const tag = s.text('existence: strong induction (lecture 16)', { x: 480, y: 203, size: 30, color: C.muted, visible: false });
        const eq = s.tex('\\part{p1}{p_1} p_2 \\cdots p_r = q_1 q_2 \\cdots \\part{qj}{q_j} \\cdots q_s', { x: 480, y: 282, size: 40, visible: false });
        const why = s.tex('p_1 \\mid q_1 q_2 \\cdots q_s \\implies p_1 \\mid q_j \\text{ for some } j \\implies p_1 = q_j', { x: 480, y: 350, size: 32, visible: false });
        const whyNote = s.text('Euclid’s lemma, extended to many factors by induction', { x: 480, y: 398, size: 30, color: C.muted, visible: false });
        const repeat = s.text('cancel, repeat: induction on $r$', { x: 480, y: 450, size: 30, color: C.blue, visible: false });
        const atoms = s.text('primes are the atoms of $\\mathbb{Z}$', { x: 480, y: 525, size: 32, color: C.green, visible: false });
        return { thm, frames, pretty, exist, tag, eq, why, whyNote, repeat, atoms };
      },
      steps: [
        {
          say: 'The Fundamental Theorem of Arithmetic: every integer from two on is a product of primes, in only one way up to order. Existence we proved by strong induction: keep splitting until every factor is prime.',
          do: async (s, o) => {
            await o.thm.fadeIn();
            await o.exist.write();
            for (const f of o.frames.slice(1)) await o.exist.swap(f, { duration: 420 });
            await o.tag.fadeIn();
          },
        },
        {
          say: 'Uniqueness needs Euclid’s lemma. Suppose two prime factorizations are equal. The prime $p_1${p one} divides the right side, so it divides some $q_j${q j}, and since $q_j${q j} is prime, they are equal.',
          do: async (s, o) => {
            await o.eq.write();
            o.r1 = s.ring([o.eq, 'p1'], { color: 'blue' });
            await o.r1;
            await o.why.write({ duration: 1200 });
            await o.whyNote.fadeIn();
            o.r2 = s.ring([o.eq, 'qj'], { color: 'yellow' });
            await o.r2;
          },
        },
        {
          say: 'Cancel them, and repeat with the shorter products. Formally, that is an induction on the number of factors.',
          do: async (s, o) => {
            await s.all(o.r1.fadeOut(), o.r2.fadeOut());
            await o.eq.swap('p_2 \\cdots p_r = q_1 \\cdots q_{j-1}\\, q_{j+1} \\cdots q_s');
            await o.repeat.fadeIn();
          },
        },
        {
          say: 'That is why primes are the atoms of the integers: every integer is built from them in exactly one way. Three sixty is two cubed times three squared times five, and nothing else.',
          do: async (s, o) => {
            await o.exist.swap(o.pretty);
            await o.exist.recolor(C.green);
            await o.atoms.fadeIn();
          },
        },
      ],
    },

    // 11 -----------------------------------------------------------------------------------------------
    {
      id: 'gcd-factorization',
      title: 'GCD and LCM from factorizations',
      scene(s) {
        const COLS = [300, 420, 540, 660];
        const rowY = { a: 80, b: 150, g: 280, l: 350 };
        const label = (tex, y, color) => s.tex(tex, { x: 225, y, size: 38, color, anchor: [1, 0.5], visible: false });
        const dots = (y, color) => COLS.slice(1).map((x) => s.tex('\\cdot', { x: x - 60, y, size: 38, color, visible: false }));
        const cell = (p, e, y, color) => s.tex(`${p}^{${e}}`, { x: 0, y, size: 38, color: e === 0 && !color ? C.muted : color, visible: false });
        const row = (n, y) => PRIMES.map((p, j) => cell(p, expOf(n, p), y).set({ x: COLS[j] }));
        const rows = {
          a: { label: label(`${B0} =`, rowY.a), cells: row(B0, rowY.a), dots: dots(rowY.a) },
          b: { label: label(`${A0} =`, rowY.b), cells: row(A0, rowY.b), dots: dots(rowY.b) },
        };
        const mins = PRIMES.map((p) => Math.min(expOf(B0, p), expOf(A0, p)));
        const maxs = PRIMES.map((p) => Math.max(expOf(B0, p), expOf(A0, p)));
        const gRow = { label: label('\\gcd =', rowY.g, C.green), dots: dots(rowY.g, C.green), res: s.tex(`= ${G0}`, { x: 730, y: rowY.g, size: 38, color: C.green, anchor: [0, 0.5], visible: false }) };
        const lRow = { label: label('\\mathrm{lcm} =', rowY.l, C.blue), dots: dots(rowY.l, C.blue), res: s.tex(`= ${LCM0}`, { x: 730, y: rowY.l, size: 38, color: C.blue, anchor: [0, 0.5], visible: false }) };
        // flying copies start on the row holding the min / max
        const pick = (vals, j) => (expOf(B0, PRIMES[j]) === vals[j] ? 'a' : 'b');
        const gFly = mins.map((e, j) => s.tex(`${PRIMES[j]}^{${e}}`, { x: COLS[j], y: rowY[pick(mins, j)], size: 38, color: C.green, visible: false }));
        const lFly = maxs.map((e, j) => s.tex(`${PRIMES[j]}^{${e}}`, { x: COLS[j], y: rowY[pick(maxs, j)], size: 38, color: C.blue, visible: false }));
        const prod = s.tex(`${G0} \\cdot ${LCM0} = ${G0 * LCM0} = ${B0} \\cdot ${A0}`, { x: 480, y: 450, size: 38, color: C.green, visible: false });
        const note = s.text('for each prime: $\\min(e, f) + \\max(e, f) = e + f$', { x: 480, y: 520, size: 30, color: C.muted, visible: false });
        return { rows, gRow, lRow, gFly, lFly, rowY, mins, maxs, prod, note, pick, COLS };
      },
      steps: [
        {
          say: 'Factor both numbers and line them up prime by prime, writing a zero exponent where a prime is missing.',
          do: async (s, o) => {
            for (const r of [o.rows.a, o.rows.b]) {
              await r.label.fadeIn({ shift: [-12, 0] });
              await s.stagger([...r.cells, ...r.dots].map((m) => () => m.fadeIn()), 110);
            }
          },
        },
        {
          say: 'A common divisor can use each prime at most as often as both numbers do, so the gcd takes the smaller exponent of each prime: two squared times three, which is twelve.',
          do: async (s, o) => {
            await s.all(o.gRow.label.fadeIn({ shift: [-12, 0] }), o.gRow.dots.map((d) => d.fadeIn()));
            await s.stagger(
              o.gFly.map((m, j) => async () => {
                const src = o.rows[o.pick(o.mins, j)].cells[j];
                await src.indicate({ color: C.green });
                m.show();
                await m.moveTo(o.COLS[j], o.rowY.g, { duration: 650 });
              }),
              450,
            );
            await o.gRow.res.fadeIn({ shift: [-12, 0] });
          },
        },
        {
          say: 'The least common multiple must contain each prime as often as either number does, so it takes the larger exponent: twenty-five twenty.',
          do: async (s, o) => {
            await s.all(o.lRow.label.fadeIn({ shift: [-12, 0] }), o.lRow.dots.map((d) => d.fadeIn()));
            await s.stagger(
              o.lFly.map((m, j) => async () => {
                const src = o.rows[o.pick(o.maxs, j)].cells[j];
                await src.indicate({ color: C.blue });
                m.show();
                await m.moveTo(o.COLS[j], o.rowY.l, { duration: 650 });
              }),
              450,
            );
            await o.lRow.res.fadeIn({ shift: [-12, 0] });
          },
        },
        {
          say: 'The smaller plus the larger of two exponents is their sum, so $\\gcd(a, b) \\cdot \\mathrm{lcm}(a, b) = ab${the gcd times the lcm equals a times b} for positive $a${a} and $b${b}.',
          do: async (s, o) => {
            await o.prod.write({ duration: 1100 });
            await o.note.fadeIn();
          },
        },
      ],
    },

    // 12 -----------------------------------------------------------------------------------------------
    {
      id: 'wo-extended-euclid',
      kind: 'workout',
      title: 'Euclid and Bézout',
      say: 'Grab paper. Run the algorithm forwards to find the gcd, then backwards to find the coefficients.',
      prompt: 'Find $d = \\gcd(252, 198)$ and integers $x, y$ with $252x + 198y = d$. Enter $d$; show $x$ and $y$ in your work.',
      answer: { type: 'number', value: WO.R.g },
      hints: [`$${divLine(WO.R.L[0])}$.`, 'Then back-substitute from the last nonzero remainder.'],
      solution: WO.paras,
      generate(rand) {
        const g = rand.int(1, 12);
        let m;
        let n;
        do {
          m = rand.int(5, 40);
          n = rand.int(5, 40);
        } while (!(m > n && gcd(m, n) === 1 && euclid(m, n).length >= 3));
        const a = g * m;
        const b = g * n;
        const { R, paras } = euclidSolution(a, b);
        return {
          prompt: `Find $d = \\gcd(${a}, ${b})$ and integers $x, y$ with $${a}x + ${b}y = d$. Enter $d$; show $x$ and $y$ in your work.`,
          answer: { type: 'number', value: R.g },
          hints: [`$${divLine(R.L[0])}$.`, 'Then back-substitute from the last nonzero remainder.'],
          solution: paras,
        };
      },
    },

    // 13 -----------------------------------------------------------------------------------------------
    {
      id: 'wo-coprime-divides',
      kind: 'workout',
      title: 'Work it out',
      say: 'Now a proof. Bézout is the tool; decide what to multiply by.',
      prompt: 'Prove: if $a, b, c \\in \\mathbb{Z}$, $\\gcd(a, b) = 1$ and $a \\mid bc$, then $a \\mid c$.',
      answer: { type: 'proof' },
      hints: ['Write $1$ as a combination of $a$ and $b$.', 'Multiply that equation by $c$.'],
      solution: [
        '**Proof.** Let $a, b, c \\in \\mathbb{Z}$ with $\\gcd(a, b) = 1$ and $a \\mid bc$.',
        'Since $\\gcd(a, b) = 1$, there are $x, y \\in \\mathbb{Z}$ with $ax + by = 1$, by Bézout’s identity. Multiplying by $c$ gives $c = acx + bcy$.',
        'Now $a \\mid acx$, since $acx = a(cx)$ with $cx \\in \\mathbb{Z}$; and $a \\mid bc$ gives $bc = ak$ for some $k \\in \\mathbb{Z}$, so $bcy = a(ky)$ and $a \\mid bcy$.',
        'Hence $a$ divides the sum $acx + bcy = c$. Therefore $a \\mid c$. ∎',
      ],
      rubric: [
        'Invokes Bézout with the hypothesis $\\gcd(a, b) = 1$ to get $ax + by = 1$.',
        'Multiplies by $c$ correctly: $c = acx + bcy$.',
        'Justifies $a \\mid acx$ and $a \\mid bcy$ (the second from $a \\mid bc$).',
        'Uses the linear-combination fact to conclude $a \\mid c$.',
      ],
    },

    // 14 -----------------------------------------------------------------------------------------------
    {
      id: 'cp-euclid',
      kind: 'explain',
      title: 'Explain it back',
      say: 'Before we wrap up, explain Euclid’s algorithm in your own words: why it gives the gcd, and why it stops.',
      prompt: 'Why does Euclid’s algorithm compute the gcd, and why must it stop?',
      points: [
        'Each step replaces $(a, b)$ by $(b, r)$, which has the same common divisors (the lemma), so the gcd never changes.',
        'The remainders form a strictly decreasing sequence of nonnegative integers, which cannot go on forever (well-ordering).',
        'When the remainder is $0$, the gcd is $\\gcd(d, 0) = d$, the last nonzero remainder.',
        'Running the lines backwards writes the gcd as $ax + by$ (Bézout coefficients).',
      ],
    },

    // 15 -----------------------------------------------------------------------------------------------
    {
      id: 'recap',
      title: 'Recap',
      scene(s) {
        const items = [
          recapItem(s, '• Euclid: divide, keep divisor and remainder, repeat. The gcd never changes, and the remainders must hit $0$.', 120),
          recapItem(s, '• Bézout ⇒ Euclid’s lemma ⇒ unique factorization into primes.', 260),
          recapItem(s, 'Next: arithmetic with remainders, congruences mod $n$.', 400, C.blue),
        ];
        return { items };
      },
      steps: [
        {
          say: 'Euclid’s algorithm: divide, keep the divisor and the remainder, and repeat. The lemma keeps the gcd the same at every line, and the remainders must reach zero.',
          do: (s, o) => o.items[0].fadeIn({ shift: [-16, 0] }),
        },
        {
          say: 'Run backwards, it gives Bézout’s identity; Bézout gives Euclid’s lemma; and Euclid’s lemma gives unique factorization into primes.',
          do: (s, o) => o.items[1].fadeIn({ shift: [-16, 0] }),
        },
        {
          say: 'Next time: arithmetic with remainders, where we compute modulo $n${n}.',
          do: (s, o) => o.items[2].fadeIn({ shift: [-16, 0] }),
        },
      ],
    },
  ],
};

export default lecture;

// Guard: the stage numbers must match the narration (literal clips).
if (G0 !== 12 || BZ.x !== -3 || BZ.y !== 13 || TRY.g !== 21 || LCM0 !== 2520 || WO.R.g !== 18 || BIG.g !== P_BIG || BIG.n !== 16) throw new Error('gcd lecture: data changed; update the narration');
