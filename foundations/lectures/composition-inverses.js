/**
 * Lecture 12 · Composition, inverses, images and preimages (foundations/PLAN.md § 12). Irani · Functions ·
 * Dumas–McCarthy 1.
 *
 * Choreography: composition is three set ovals with f-arrows (blue) and g-arrows (red); a yellow tracer follows one
 * element through both, then the middle set drops out and the green g∘f arrows go straight across. Injectivity of
 * g∘f is proved by peeling g, then f, off an equation in sync with the proof lines. Inverses reverse the arrows of
 * three small diagrams. Images and preimages move dots between two number lines (x on top, x² below).
 */
import { C, FILL } from '../../lectern/src/core/stage.js';

// ---------------------------------------------------------------- data (computed, never typed twice)

const SET_A = ['1', '2', '3'];
const SET_B = ['a', 'b', 'c'];
const SET_C = ['x', 'y'];
const F_MAP = [1, 0, 2]; // f(1) = b, f(2) = a, f(3) = c
const G_MAP = [0, 1, 1]; // g(a) = x, g(b) = y, g(c) = y
const GF_MAP = F_MAP.map((j) => G_MAP[j]);

const fAdd = (x) => x + 1;
const gSq = (x) => x * x;
const GF_AT_1 = gSq(fAdd(1));
const FG_AT_1 = fAdd(gSq(1));

// try-comp: f(x) = 2x, g(x) = x − 3
const tf = (x) => 2 * x;
const tg = (x) => x - 3;
const TRY_COMP = tf(tg(5));
const TRY_COMP_OTHER = tg(tf(5));

// fill-inverse: f(x) = 5x − 4  ⇒  f⁻¹(y) = (y + 4) / 5
const INV_M = 5;
const INV_B = -4;

// image / preimage of x²
const sq = (x) => x * x;
const S_DOTS = [-1, -0.5, 0, 0.5, 1, 1.5, 2];
const T_ROOTS = [1, 1.25, 1.5, 1.75, 2];

// try-preimage: f(n) = n² on ℤ, preimage of {0, 1, 2, 4}
const TARGET = [0, 1, 2, 4];
const PREIMAGE = [];
for (let n = -10; n <= 10; n++) if (TARGET.includes(n * n)) PREIMAGE.push(n);

// ---------------------------------------------------------------- local helpers

const ellipse = (cx, cy, rx, ry) => `M${cx - rx} ${cy} A${rx} ${ry} 0 1 0 ${cx + rx} ${cy} A${rx} ${ry} 0 1 0 ${cx - rx} ${cy} Z`;

/** A set drawn as an oval with its elements in a column (each element a Tex, so things can travel). */
function setCol(s, labels, { x, y, spacing = 78, size = 36, title, rx = 66 }) {
  const n = labels.length;
  const ry = Math.max(70, (n * spacing) / 2 + 20);
  const oval = s.path(ellipse(x, y, rx, ry), { color: C.muted, width: 2.5, fill: FILL.ink, visible: false });
  const els = labels.map((l, i) => {
    const ey = y + (i - (n - 1) / 2) * spacing;
    return { x, y: ey, tex: s.tex(l, { x, y: ey, size, visible: false }) };
  });
  const head = title ? s.tex(title, { x, y: y - ry - 30, size: 36, visible: false }) : null;
  const mobs = [oval, ...els.map((e) => e.tex), head].filter(Boolean);
  return {
    oval, els, head, mobs, x, y, ry,
    show: (delay = 0) => s.all(oval.fadeIn({ shift: [0, 0], delay }), head?.fadeIn({ delay }), els.map((e, i) => e.tex.fadeIn({ delay: delay + 150 + i * 90 }))),
  };
}

/** Arrow from element p to element q (stage points), hidden. */
const link = (s, p, q, color, width = 3) => s.arrow(p.x + 26, p.y, q.x - 26, q.y, { color, width, visible: false });

/** Stage point of value v on a number line. */
const at = (nl, v) => [nl.x + nl.toX(v), nl.y];

const recapItem = (s, str, y, color = C.ink) => s.text(str, { x: 80, y, size: 32, anchor: [0, 0.5], width: 820, align: 'left', color, visible: false });

// ---------------------------------------------------------------- lecture

export default {
  id: 'composition-inverses',
  title: 'Composition, inverses, images and preimages',
  goals: [
    'Compose functions and prove compositions preserve injectivity and surjectivity',
    'Know that $f$ has an inverse exactly when it is bijective, and compute inverses',
    'Compute images $f(S)$ and preimages $f^{-1}(T)$',
    'Prove or disprove identities for images and preimages',
  ],
  beats: [
    // 1 ------------------------------------------------------------------------------------------------
    {
      id: 'composition',
      title: 'Composition',
      scene(s) {
        const a = setCol(s, SET_A, { x: 190, y: 270, title: 'A' });
        const b = setCol(s, SET_B, { x: 480, y: 270, title: 'B' });
        const c = setCol(s, SET_C, { x: 770, y: 270, title: 'C' });
        const fArrows = F_MAP.map((j, i) => link(s, a.els[i], b.els[j], C.blue));
        const gArrows = G_MAP.map((k, j) => link(s, b.els[j], c.els[k], C.red));
        const fName = s.tex('f', { x: 335, y: 115, size: 38, color: C.blue, visible: false });
        const gName = s.tex('g', { x: 625, y: 115, size: 38, color: C.red, visible: false });
        // after the collapse: A at x 330, C at x 630
        const DX = 140;
        const gfArrows = GF_MAP.map((k, i) => s.arrow(a.x + DX + 26, a.els[i].y, c.x - DX - 26, c.els[k].y, { color: C.green, width: 4, visible: false }));
        const gfName = s.tex('g \\circ f', { x: 480, y: 115, size: 38, color: C.green, visible: false });
        const tracer = s.dot(a.els[0].x, a.els[0].y, { r: 26, color: C.yellow, visible: false });
        const formula = s.tex(`(g \\circ f)(1) = g(\\part{in}{f(1)}) = g(${SET_B[F_MAP[0]]}) = ${SET_C[GF_MAP[0]]}`, { y: 485, size: 40, visible: false });
        const codomain = s.tex('f\\colon A \\to \\part{b1}{B}, \\quad g\\colon \\part{b2}{B} \\to C', { y: 485, size: 40, visible: false });
        const gfType = s.tex('g \\circ f\\colon A \\to C, \\quad (g \\circ f)(x) = g(f(x))', { y: 485, size: 40, visible: false });
        return { a, b, c, fArrows, gArrows, fName, gName, gfArrows, gfName, tracer, formula, codomain, gfType, DX };
      },
      steps: [
        {
          say: 'Composition chains two functions: $f${f} takes $A${A} to $B${B}, then $g${g} takes $B${B} on to $C${C}. That only works because every output of $f${f} is a legal input of $g${g}: the codomain of $f${f} sits inside the domain of $g${g}.',
          do: async (s, o) => {
            await s.all(o.a.show(), o.b.show(150), o.c.show(300));
            await s.all(o.fName.fadeIn(), s.stagger(o.fArrows.map((ar) => () => ar.draw({ duration: 500 })), 160));
            await s.all(o.gName.fadeIn(), s.stagger(o.gArrows.map((ar) => () => ar.draw({ duration: 500 })), 160));
            await o.codomain.write();
            await s.all(o.codomain.color('b1', C.yellow), o.codomain.color('b2', C.yellow), o.b.oval.recolor(C.yellow));
            await o.b.oval.flash({ color: C.yellow });
          },
        },
        {
          say: '$g \\circ f${g composed with f} means first $f${f}, then $g${g}. Follow $1${one}: $f${f} sends it to $b${b}, and $g${g} sends $b${b} to $y${y}. Read it right to left: the function next to the input acts first.',
          do: async (s, o) => {
            await s.all(o.codomain.fadeOut(), o.b.oval.recolor(C.muted));
            const q = o.b.els[F_MAP[0]];
            const r = o.c.els[GF_MAP[0]];
            await o.tracer.animate({ opacity: 0.35 }, { duration: 300 });
            await o.a.els[0].tex.recolor(C.yellow);
            await s.all(o.fArrows[0].recolor(C.yellow), o.tracer.moveTo(q.x, q.y, { duration: 900 }), q.tex.recolor(C.yellow, { delay: 700 }));
            await s.all(o.gArrows[F_MAP[0]].recolor(C.yellow), o.tracer.moveTo(r.x, r.y, { duration: 900 }), r.tex.recolor(C.yellow, { delay: 700 }));
            await o.formula.write({ duration: 1100 });
            await o.formula.color('in', C.blue);
          },
        },
        {
          say: 'Do that for every element and the middle set drops out. $g \\circ f${g composed with f} is a single function from $A${A} straight to $C${C}.',
          do: async (s, o) => {
            const ink = [o.a.els[0].tex, o.b.els[F_MAP[0]].tex, o.c.els[GF_MAP[0]].tex];
            await s.all(o.tracer.fadeOut(), ink.map((m) => m.recolor(C.ink)), o.fArrows[0].recolor(C.blue), o.gArrows[F_MAP[0]].recolor(C.red), o.formula.fadeOut());
            await s.all(o.b.mobs.map((m) => m.fadeOut({ duration: 500 })), [...o.fArrows, ...o.gArrows].map((m) => m.fadeOut({ duration: 500 })), o.fName.fadeOut(), o.gName.fadeOut());
            await s.all(o.a.mobs.map((m) => m.shift(o.DX, 0, { duration: 800 })), o.c.mobs.map((m) => m.shift(-o.DX, 0, { duration: 800 })));
            await s.all(o.gfName.fadeIn(), s.stagger(o.gfArrows.map((ar) => () => ar.draw({ duration: 550 })), 200));
            await o.gfType.write({ duration: 1000 });
          },
        },
        {
          say: 'Order matters. Take $f(x) = x + 1${f of x equals x plus one} and $g(x) = x^2${g of x equals x squared}. Then $(g \\circ f)(x) = (x + 1)^2${g of f of x is x plus one, squared}, but $(f \\circ g)(x) = x^2 + 1${f of g of x is x squared plus one}.',
          do: async (s, o) => {
            await s.all([...o.a.mobs, ...o.c.mobs, ...o.gfArrows, o.gfName, o.gfType].map((m) => m.fadeOut({ duration: 450 })));
            o.fdef = s.tex('f(x) = x + 1', { x: 300, y: 110, size: 42, color: C.blue, visible: false });
            o.gdef = s.tex('g(x) = x^2', { x: 660, y: 110, size: 42, color: C.red, visible: false });
            o.gf = s.tex('(g \\circ f)(x) = g(\\col{blue}{x + 1}) = (x + 1)^2', { y: 230, size: 42, visible: false });
            o.fg = s.tex('(f \\circ g)(x) = f(\\col{red}{x^2}) = x^2 + 1', { y: 320, size: 42, visible: false });
            await s.all(o.fdef.fadeIn(), o.gdef.fadeIn({ delay: 200 }));
            await o.gf.write({ duration: 1100 });
            await o.fg.write({ duration: 1100 });
          },
        },
        {
          say: 'Plug in $x = 1${x equals one}: the first gives $4${four}, the second gives $2${two}. Two functions that disagree at one point are different, so composition is not commutative.',
          do: async (s, o) => {
            o.chk = s.tex(`(g \\circ f)(1) = ${GF_AT_1} \\;\\part{ne}{\\ne}\\; ${FG_AT_1} = (f \\circ g)(1)`, { y: 450, size: 46, visible: false });
            await o.chk.write({ duration: 1000 });
            await o.chk.color('ne', C.red);
            o.stamp = s.stamp('$g \\circ f \\ne f \\circ g$', { x: 480, y: 528, color: 'red' });
            await o.stamp.slam();
          },
        },
      ],
    },

    // 2 ------------------------------------------------------------------------------------------------
    {
      id: 'comp-injective',
      title: 'Compositions of injections',
      scene(s) {
        const thm = s.text('**Theorem.** If $f\\colon A \\to B$ and $g\\colon B \\to C$ are injective, so is $g \\circ f$.', { y: 50, size: 30, visible: false });
        const peel = s.tex('\\part{g}{g\\big(}\\,f(a_1)\\,\\part{g}{\\big)} = \\part{g}{g\\big(}\\,f(a_2)\\,\\part{g}{\\big)}', { y: 104, size: 40, visible: false });
        const p = s.proof({ y: 146, width: 900, height: 428, size: 30 });
        return { thm, peel, p };
      },
      steps: [
        {
          say: 'Injective means equal outputs force equal inputs. So start with two inputs whose outputs under $g \\circ f${g composed with f} agree, and unpack the composition.',
          do: async (s, o) => {
            await o.thm.fadeIn();
            await o.p.add('**Proof.** Let $a_1, a_2 \\in A$.', { kind: 'assume', why: 'arbitrary inputs' });
            await o.p.add('Suppose $(g \\circ f)(a_1) = (g \\circ f)(a_2)$.', { why: 'hypothesis' });
            await o.p.add('Then $g(f(a_1)) = g(f(a_2))$.', { why: 'definition of $\\circ$' });
            await o.peel.write({ duration: 900 });
          },
        },
        {
          say: 'Peel off the outer function first. $g${g} is injective, and it gives equal outputs on $f(a_1)${f of a one} and $f(a_2)${f of a two}, so those two must be equal.',
          do: async (s, o) => {
            await o.peel.color('g', C.yellow);
            o.l3 = o.p.add('So $f(a_1) = f(a_2)$.', { why: '$g$ injective' });
            await o.l3;
            await o.p.highlight(o.l3, 'yellow');
            await o.peel.swap('\\part{f}{f(}a_1\\part{f}{)} = \\part{f}{f(}a_2\\part{f}{)}');
          },
        },
        {
          say: 'Then the inner one. $f${f} is injective, so $a_1 = a_2${a one equals a two}.',
          do: async (s, o) => {
            await o.p.unhighlight(o.l3);
            await o.peel.color('f', C.yellow);
            o.l4 = o.p.add('So $a_1 = a_2$.', { why: '$f$ injective' });
            await o.l4;
            await o.p.highlight(o.l4, 'yellow');
            await o.peel.swap('a_1 = a_2');
            await o.peel.recolor(C.green);
          },
        },
        {
          say: 'Each step used exactly one hypothesis, and we reached the definition of injective for $g \\circ f${g composed with f}.',
          do: async (s, o) => {
            await o.p.unhighlight(o.l4);
            o.last = o.p.add('Therefore $g \\circ f$ is injective.', { kind: 'conclude', why: 'definition of injective' });
            await o.last;
            await o.p.qed();
          },
        },
        {
          say: 'Surjections compose too, but the route runs backwards. Start from any $c${c} in $C${C}: $g${g} onto gives $b${b} with $g(b) = c${g of b equals c}, and $f${f} onto gives $a${a} with $f(a) = b${f of a equals b}, so $g(f(a)) = c${g of f of a equals c}.',
          do: (s, o) => o.p.note(o.last, 'surjections too: $c \\leftarrow b \\leftarrow a$', { color: 'blue' }),
        },
      ],
    },

    // 3 ------------------------------------------------------------------------------------------------
    {
      id: 'try-comp',
      kind: 'try',
      title: 'Compose',
      say: 'Your turn. Compute this composition, and watch the order.',
      prompt: 'Let $f, g\\colon \\mathbb{R} \\to \\mathbb{R}$, $f(x) = 2x$, $g(x) = x - 3$. Compute $(f \\circ g)(5)$.',
      answer: { type: 'number', value: TRY_COMP },
      hint: 'Apply $g$ first, then $f$.',
      solution: [
        `$(f \\circ g)(5) = f(g(5))$. First $g(5) = 5 - 3 = ${tg(5)}$, then $f(${tg(5)}) = 2 \\cdot ${tg(5)} = ${TRY_COMP}$.`,
        `The other order gives something else: $(g \\circ f)(5) = g(10) = ${TRY_COMP_OTHER}$.`,
      ],
    },

    // 4 ------------------------------------------------------------------------------------------------
    {
      id: 'comp-converse',
      title: 'The converse half-holds',
      scene(s) {
        const thm = s.text('**Theorem.** If $g \\circ f$ is injective, then $f$ is injective.', { y: 50, size: 30, visible: false });
        const p = s.proof({ y: 95, width: 900, height: 330, size: 30 });
        const claim = s.text('Is $g$ injective too?', { y: 100, size: 32, visible: false });
        const a = setCol(s, ['1'], { x: 230, y: 300, title: 'A' });
        const b = setCol(s, ['1', '2'], { x: 480, y: 300, title: 'B' });
        const c = setCol(s, ['1'], { x: 730, y: 300, title: 'C' });
        const fA = link(s, a.els[0], b.els[0], C.blue);
        const g1 = link(s, b.els[0], c.els[0], C.red);
        const g2 = link(s, b.els[1], c.els[0], C.red);
        const fName = s.tex('f', { x: 355, y: 175, size: 36, color: C.blue, visible: false });
        const gName = s.tex('g', { x: 605, y: 175, size: 36, color: C.red, visible: false });
        const gf = s.tex('g \\circ f\\colon 1 \\mapsto 1 \\text{ is injective}', { y: 445, size: 32, color: C.green, visible: false });
        const gBad = s.tex('g(1) = g(2) = 1\\text{: } g \\text{ is not injective}', { y: 500, size: 32, color: C.red, visible: false });
        const moral = s.text('Small sets that break the claim: the fastest disproof.', { y: 556, size: 30, color: C.muted, visible: false });
        const stamp = s.stamp('counterexample', { x: 790, y: 95, color: 'red' });
        return { thm, p, claim, a, b, c, fA, g1, g2, fName, gName, gf, gBad, moral, stamp };
      },
      steps: [
        {
          say: 'Half of the converse is true. If $f(a_1) = f(a_2)${f of a one equals f of a two}, apply $g${g} to both sides, and the injectivity of $g \\circ f${g composed with f} gives $a_1 = a_2${a one equals a two}.',
          do: async (s, o) => {
            await o.thm.fadeIn();
            await o.p.add('**Proof.** Suppose $g \\circ f$ is injective.', { kind: 'assume', why: 'hypothesis' });
            await o.p.add('Let $a_1, a_2 \\in A$ with $f(a_1) = f(a_2)$.', { why: 'to show $a_1 = a_2$' });
            await o.p.add('Then $g(f(a_1)) = g(f(a_2))$.', { why: 'apply $g$' });
            await o.p.add('So $a_1 = a_2$.', { why: '$g \\circ f$ injective' });
            await o.p.add('Therefore $f$ is injective.', { kind: 'conclude', why: 'definition' });
            await o.p.qed();
          },
        },
        {
          say: 'But $g${g} need not be injective. $g${g} can misbehave on points that $f${f} never reaches, and $g \\circ f${g composed with f} never sees them.',
          do: async (s, o) => {
            await s.all(o.p.fadeOut(), o.thm.fadeOut());
            await o.claim.fadeIn();
            await s.all(o.a.show(), o.b.show(120), o.c.show(240));
            await s.all(o.fName.fadeIn(), o.fA.draw({ duration: 500 }));
            await s.all(o.gName.fadeIn(), o.g1.draw({ duration: 500 }), o.g2.draw({ duration: 500, delay: 150 }));
            o.miss = s.ring(o.b.els[1].tex, { color: 'yellow', pad: 12 });
            await o.miss;
          },
        },
        {
          say: 'Here $g \\circ f${g composed with f} has one input, so it is injective, while $g${g} sends both points to $1${one}. Small finite counterexamples like this are the fastest disproofs.',
          do: async (s, o) => {
            await o.gf.fadeIn();
            await s.all(o.g1.recolor(C.red), o.g2.recolor(C.red), o.g1.indicate({ color: C.red, scale: 1.05 }), o.g2.indicate({ color: C.red, scale: 1.05 }), o.c.els[0].tex.recolor(C.red));
            await o.gBad.fadeIn();
            await o.stamp.slam();
            await o.moral.fadeIn();
          },
        },
      ],
    },

    // 5 ------------------------------------------------------------------------------------------------
    {
      id: 'inverse',
      title: 'Inverse functions',
      scene(s) {
        const card = s.defCard({ y: 68, title: false, tex: 'g \\text{ is an \\textbf{inverse} of } f \\iff g \\circ f = \\mathrm{id}_A \\text{ and } f \\circ g = \\mathrm{id}_B', visible: false });
        const id = s.tex('f\\colon A \\to B,\\ \\ g\\colon B \\to A, \\qquad \\mathrm{id}_A(x) = x', { y: 136, size: 30, color: C.muted, visible: false });
        const panel = (x, dom, cod, arrows) => s.mapDiagram({ x, y: 270, domain: dom, codomain: cod, arrows, labels: [], gap: 220, size: 42, scale: 0.72, visible: false });
        const d1 = panel(170, ['1', '2', '3'], ['a', 'b', 'c'], [[0, 1], [1, 2], [2, 0]]);
        const d2 = panel(480, ['1', '2', '3'], ['a', 'b'], [[0, 0], [1, 0], [2, 1]]);
        const d3 = panel(790, ['1', '2'], ['a', 'b', 'c'], [[0, 0], [1, 2]]);
        const cap = (x, str, color) => s.text(str, { x, y: 410, size: 30, color, visible: false });
        const c1 = cap(170, 'still a function', C.green);
        const c2 = cap(480, '$a$: two arrows out', C.red);
        const c3 = cap(790, '$b$: no arrow out', C.red);
        const thm = s.text('**Theorem.** $f$ has an inverse $\\iff$ $f$ is a bijection. The inverse is then unique; we call it $f^{-1}$.', { y: 500, size: 30, width: 860, visible: false });
        return { card, id, d1, d2, d3, c1, c2, c3, thm };
      },
      steps: [
        {
          say: 'The identity function on $A${A} sends every element to itself. An inverse of $f${f} undoes it from both sides: $g \\circ f${g composed with f} is the identity on $A${A}, and $f \\circ g${f composed with g} is the identity on $B${B}.',
          do: async (s, o) => {
            await o.id.fadeIn();
            await o.card.reveal({ duration: 1300 });
          },
        },
        {
          say: 'Picture it as reversing every arrow. For a bijection, each point of $B${B} gets exactly one arrow back, so the reversed picture is again a function.',
          do: async (s, o) => {
            await o.d1.fadeIn();
            await o.d1.invert({ duration: 1000 });
            await o.c1.fadeIn();
          },
        },
        {
          say: 'Reverse a function that is not injective, and some point gets two arrows out. Reverse one that is not surjective, and some point gets none. Neither is a function.',
          do: async (s, o) => {
            await s.all(o.d2.fadeIn(), o.d3.fadeIn({ delay: 200 }));
            await s.all(o.d2.invert({ duration: 1000 }), o.d3.invert({ duration: 1000 }));
            await o.d2.showCollision();
            await o.c2.fadeIn();
            await o.d3.showMissed();
            await o.c3.fadeIn();
          },
        },
        {
          say: 'That is the theorem: $f${f} has an inverse if and only if $f${f} is a bijection, and then the inverse is unique, so we may call it $f^{-1}${f inverse}.',
          do: async (s, o) => {
            await o.thm.write({ duration: 1200 });
            await o.d1.indicate({ color: C.green, scale: 1.04 });
          },
        },
        {
          say: 'To compute an inverse, solve $y = f(x)${y equals f of x} for $x${x}. For $f(x) = 3x + 7${f of x equals three x plus seven}, subtract seven and divide by three, then check that both compositions give back the input.',
          do: async (s, o) => {
            await s.all([o.id, o.d1, o.d2, o.d3, o.c1, o.c2, o.c3, o.thm].map((m) => m.fadeOut({ duration: 400 })));
            o.solve = s.tex('y = 3x + 7', { y: 175, size: 42, visible: false });
            o.res = s.tex('f^{-1}(y) = (y - 7)/3', { y: 265, size: 42, color: C.green, visible: false });
            o.chk1 = s.tex('f\\big(f^{-1}(y)\\big) = 3 \\cdot (y - 7)/3 + 7 = y \\ \\checkmark', { y: 380, size: 36, visible: false });
            o.chk2 = s.tex('f^{-1}\\big(f(x)\\big) = \\big((3x + 7) - 7\\big)/3 = x \\ \\checkmark', { y: 470, size: 36, visible: false });
            await o.solve.write();
            await o.solve.swap('y - 7 = 3x');
            await o.solve.swap('x = (y - 7)/3');
            await o.res.fadeIn();
            await o.chk1.write({ duration: 900 });
            await o.chk2.write({ duration: 900 });
          },
        },
      ],
    },

    // 6 ------------------------------------------------------------------------------------------------
    {
      id: 'fill-inverse',
      kind: 'blanks',
      title: 'Find the inverse',
      say: 'Find the inverse of this function, then check it.',
      prompt: 'Let $f\\colon \\mathbb{R} \\to \\mathbb{R}$, $f(x) = 5x - 4$. Fill in its inverse and the check.',
      lines: [
        ['f^{-1}(y) = ', { tex: '\\frac{y + \\blank{b}}{\\blank{m}}', blanks: { b: { answer: { type: 'number', value: -INV_B }, hint: 'Undo the $-4$ first.' }, m: { answer: { type: 'number', value: INV_M }, hint: 'Then undo the multiplication.' } } }],
        ['(f^{-1} \\circ f)(x) = ', { id: 'id', chips: ['x', '5x - 4', '1'], answer: 'x', hint: 'An inverse undoes $f$.' }],
      ],
      solution: [
        `Solve $y = 5x - 4$ for $x$: $y + ${-INV_B} = 5x$, so $x = \\frac{y + ${-INV_B}}{${INV_M}}$. Hence $f^{-1}(y) = \\frac{y + ${-INV_B}}{${INV_M}}$.`,
        `Check: $f^{-1}(f(x)) = \\frac{(5x - 4) + ${-INV_B}}{${INV_M}} = \\frac{5x}{5} = x$, the identity.`,
      ],
    },

    // 7 ------------------------------------------------------------------------------------------------
    {
      id: 'image-preimage',
      title: 'Images and preimages',
      scene(s) {
        const d1 = s.defCard({ x: 240, y: 68, title: false, tex: 'f(S) = \\{f(x) : x \\in S\\}', visible: false });
        const d2 = s.defCard({ x: 480, y: 68, title: false, tex: 'f^{-1}(T) = \\{x \\in A : f(x) \\in T\\}', visible: false });
        const top = s.numberLine({ x: 530, y: 215, width: 660, range: [-3, 3], size: 32, visible: false });
        const bot = s.numberLine({ x: 530, y: 420, width: 660, range: [-1, 5], size: 32, visible: false });
        const xl = s.tex('x', { x: 105, y: 215, size: 36, visible: false });
        const yl = s.tex('x^2', { x: 105, y: 420, size: 36, visible: false });
        const fl = s.tex('f(x) = x^2', { x: 130, y: 318, size: 34, color: C.muted, visible: false });
        const sLab = s.tex('S = [-1, 2]', { x: at(top, 0.5)[0], y: 160, size: 34, color: C.blue, visible: false });
        const fsLab = s.tex('f(S) = [0, 4]', { x: at(bot, 2)[0], y: 497, size: 32, color: C.green, visible: false });
        const tLab = s.tex('T = [1, 4]', { x: at(bot, 2.5)[0], y: 497, size: 32, color: C.orange, visible: false });
        const ptLab = s.tex('f^{-1}(T) = [-2, -1] \\cup [1, 2]', { x: at(top, 0)[0], y: 155, size: 34, color: C.orange, visible: false });
        return { d1, d2, top, bot, xl, yl, fl, sLab, fsLab, tLab, ptLab };
      },
      steps: [
        {
          say: 'The image of a set $S${S} is the set of all outputs of its elements. Take $f(x) = x^2${f of x equals x squared} and $S${S} the interval from $-1${minus one} to $2${two}: push every point down, and the outputs fill the interval from $0${zero} to $4${four}.',
          do: async (s, o) => {
            await s.all(o.top.fadeIn(), o.bot.fadeIn({ delay: 150 }), o.xl.fadeIn(), o.yl.fadeIn({ delay: 150 }), o.fl.fadeIn({ delay: 300 }));
            await o.d1.reveal({ duration: 800 });
            o.sInt = o.top.interval(-1, 2, { color: 'blue' });
            await s.all(o.sInt, o.sLab.fadeIn());
            o.trail = [];
            o.drops = [];
            await s.stagger(
              S_DOTS.map((v) => () => {
                const [x1, y1] = at(o.top, v);
                const [x2, y2] = at(o.bot, sq(v));
                const ln = s.line(x1, y1, x2, y2, { color: C.muted, width: 2, visible: false });
                const d = s.dot(x1, y1, { r: 8, color: C.blue });
                o.trail.push(ln);
                o.drops.push(d);
                return s.all(ln.draw({ duration: 700 }), d.moveTo(x2, y2, { duration: 700 }), d.recolor(C.green, { delay: 400 }));
              }),
              180,
            );
            o.fsInt = o.bot.interval(0, 4, { color: 'green' });
            await s.all(o.fsInt, o.fsLab.fadeIn());
          },
        },
        {
          say: 'The preimage goes the other way: all inputs that land in $T${T}. For $T${T} from $1${one} to $4${four}, each target pulls back two points, one positive and one negative, so the preimage is two intervals.',
          do: async (s, o) => {
            await s.all(o.sInt.fadeOut(), o.fsInt.fadeOut(), o.sLab.fadeOut(), o.fsLab.fadeOut(), [...o.trail, ...o.drops].map((m) => m.fadeOut({ duration: 400 })));
            await o.d1.fadeOut();
            await o.d2.reveal({ duration: 900 });
            o.tInt = o.bot.interval(1, 4, { color: 'orange' });
            await s.all(o.tInt, o.tLab.fadeIn());
            o.ups = [];
            await s.stagger(
              T_ROOTS.map((r) => () => {
                const [x0, y0] = at(o.bot, sq(r));
                const moves = [r, -r].map((v) => {
                  const [x1, y1] = at(o.top, v);
                  const ln = s.line(x0, y0, x1, y1, { color: C.muted, width: 2, visible: false });
                  const d = s.dot(x0, y0, { r: 8, color: C.orange });
                  o.ups.push(ln, d);
                  if (v === 1 || v === -1) (o.unit ??= []).push(ln);
                  return s.all(ln.draw({ duration: 700 }), d.moveTo(x1, y1, { duration: 700 }));
                });
                return s.all(moves);
              }),
              220,
            );
            o.p1 = o.top.interval(-2, -1, { color: 'orange' });
            o.p2 = o.top.interval(1, 2, { color: 'orange' });
            await s.all(o.p1, o.p2, o.ptLab.fadeIn());
          },
        },
        {
          say: 'Notice that $f${f} has no inverse: $-1${minus one} and $1${one} both go to $1${one}. Still, $f^{-1}(T)${the preimage of T} makes sense for every function. The notation does not claim an inverse exists.',
          do: async (s, o) => {
            await s.all(o.unit.map((l) => l.recolor(C.red)));
            await s.all(o.unit.map((l) => l.indicate({ color: C.red, scale: 1.02 })));
            o.warn = s.text('$f(-1) = f(1)$: no inverse, yet $f^{-1}(T)$ is a fine set', { x: 500, y: 551, size: 30, color: C.red, visible: false });
            await o.warn.fadeIn();
          },
        },
      ],
    },

    // 8 ------------------------------------------------------------------------------------------------
    {
      id: 'try-preimage',
      kind: 'try',
      title: 'Preimage',
      say: 'Find this preimage. Careful: the inputs are integers.',
      prompt: 'Let $f\\colon \\mathbb{Z} \\to \\mathbb{Z}$, $f(n) = n^2$. Find $f^{-1}(\\{0, 1, 2, 4\\})$. Enter the elements separated by commas.',
      answer: { type: 'set', value: PREIMAGE.map(String) },
      hint: 'For each target, which integers square to it?',
      solution: [
        '$f^{-1}(T)$ collects every integer $n$ with $n^2 \\in \\{0, 1, 2, 4\\}$.',
        '$0 \\leftarrow 0$; $1 \\leftarrow \\pm 1$; $2$ has no integer square root, so it contributes nothing; $4 \\leftarrow \\pm 2$.',
        `So $f^{-1}(\\{0, 1, 2, 4\\}) = \\{${PREIMAGE.join(', ')}\\}$.`,
      ],
    },

    // 9 ------------------------------------------------------------------------------------------------
    {
      id: 'image-intersection',
      title: 'Images don’t respect intersections',
      scene(s) {
        const thm = s.text('**Theorem.** For $f\\colon X \\to Y$ and $A, B \\subseteq X$, $\\ f(A \\cap B) \\subseteq f(A) \\cap f(B)$.', { y: 74, size: 30, width: 860, visible: false });
        const p = s.proof({ y: 132, width: 900, height: 330, size: 30 });
        const q = s.text('Is it an equality? Try $f(x) = x^2$, $A = \\{-1\\}$, $B = \\{1\\}$.', { y: 145, size: 30, visible: false });
        const d = s.mapDiagram({ x: 260, y: 330, domain: ['−1', '1'], codomain: ['1'], arrows: [[0, 0], [1, 0]], labels: ['X', 'Y'], name: 'f', gap: 260, visible: false });
        const lines = [
          ['A \\cap B = \\varnothing', C.ink],
          ['f(A \\cap B) = \\varnothing', C.ink],
          ['f(A) = \\{1\\} = f(B)', C.ink],
          ['f(A) \\cap f(B) = \\{1\\}', C.ink],
        ].map(([t, c], i) => s.tex(t, { x: 690, y: 200 + i * 66, size: 36, color: c, visible: false }));
        const ne = s.tex('\\varnothing \\ne \\{1\\}', { x: 690, y: 470, size: 40, color: C.red, visible: false });
        const inj = s.text('If $f$ is injective, equality holds.', { y: 548, size: 32, color: C.green, visible: false });
        return { thm, p, q, d, lines, ne, inj };
      },
      steps: [
        {
          say: 'One inclusion always holds. Take $y${y} in the image of $A \\cap B${A intersect B}: it comes from some $x${x} in both sets, so $y${y} is in both images.',
          do: async (s, o) => {
            await o.thm.fadeIn();
            await o.p.add('**Proof.** Let $y \\in f(A \\cap B)$.', { kind: 'assume', why: 'arbitrary element' });
            await o.p.add('Then $y = f(x)$ for some $x \\in A \\cap B$.', { why: 'definition of image' });
            await o.p.add('So $x \\in A$ and $x \\in B$.', { why: 'definition of $\\cap$' });
            await o.p.add('So $y \\in f(A)$ and $y \\in f(B)$.', { why: 'definition of image' });
            await o.p.add('Therefore $y \\in f(A) \\cap f(B)$.', { kind: 'conclude', why: 'definition of $\\cap$' });
            await o.p.qed();
          },
        },
        {
          say: 'The other inclusion fails. With $f(x) = x^2${f of x equals x squared}, $A${A} holding $-1${minus one} and $B${B} holding $1${one}: the sets share nothing, but their images are both $\\{1\\}${the set containing one}.',
          do: async (s, o) => {
            await o.p.fadeOut();
            await o.q.fadeIn();
            await o.d.fadeIn();
            await s.all(o.d.highlightElement('dom', 0, 'blue'), o.d.highlightElement('dom', 1, 'teal'));
            await s.stagger(o.lines.map((l) => () => l.fadeIn({ shift: [-12, 0] })), 400);
            await o.ne.write();
          },
        },
        {
          say: 'Two different inputs sharing one output is exactly what breaks it. If $f${f} is injective that cannot happen, and equality holds.',
          do: async (s, o) => {
            await o.d.showCollision();
            await o.inj.fadeIn();
          },
        },
      ],
    },

    // 10 -----------------------------------------------------------------------------------------------
    {
      id: 'preimage-ops',
      title: 'Preimages behave perfectly',
      scene(s) {
        const p = s.proof({ y: 26, width: 900, height: 400, size: 30, numbered: false });
        const ids = [
          s.tex('f^{-1}(C \\cup D) = f^{-1}(C) \\cup f^{-1}(D)', { y: 450, size: 32, color: C.green, visible: false }),
          s.tex('f^{-1}(Y \\setminus C) = X \\setminus f^{-1}(C)', { y: 500, size: 32, color: C.green, visible: false }),
        ];
        const cont = s.text('Analysis: $f$ is continuous $\\iff$ preimages of open sets are open.', { y: 553, size: 30, color: C.muted, visible: false });
        return { p, ids, cont };
      },
      steps: [
        {
          say: 'Let $x${x} be any element of $X${X}. Membership in a preimage is a statement about $f(x)${f of x}: $x${x} is in the preimage of $C \\cap D${C intersect D} exactly when $f(x)${f of x} is in $C \\cap D${C intersect D}.',
          do: async (s, o) => {
            await o.p.add('**Proof.** Let $x \\in X$. Then $x \\in f^{-1}(C \\cap D)$', { kind: 'assume', tex: false });
            o.l2 = o.p.add('\\iff f(x) \\in C \\cap D', { tex: true, why: 'def. of preimage' });
            await o.l2;
            await o.p.highlight(o.l2, 'yellow');
          },
        },
        {
          say: 'Unpack the intersection, then repack each half as a preimage. Every link is an if and only if, so the two sets have exactly the same elements.',
          do: async (s, o) => {
            await o.p.unhighlight(o.l2);
            await o.p.add('\\iff f(x) \\in C \\land f(x) \\in D', { tex: true, why: 'def. of $\\cap$' });
            await o.p.add('\\iff x \\in f^{-1}(C) \\land x \\in f^{-1}(D)', { tex: true, why: 'def. of preimage' });
            await o.p.add('\\iff x \\in f^{-1}(C) \\cap f^{-1}(D)', { tex: true, why: 'def. of $\\cap$' });
            await o.p.add('Therefore $f^{-1}(C \\cap D) = f^{-1}(C) \\cap f^{-1}(D)$.', { kind: 'conclude', tex: false });
            await o.p.qed();
          },
        },
        {
          say: 'The same argument works for every set operation, because each one is defined by a condition on $f(x)${f of x}. So preimages commute with unions and complements too.',
          do: (s, o) => s.stagger(o.ids.map((t) => () => t.write({ duration: 900 })), 900),
        },
        {
          say: 'This is why analysis defines continuity with preimages: they behave perfectly, while images do not.',
          do: (s, o) => o.cont.fadeIn(),
        },
      ],
    },

    // 11 -----------------------------------------------------------------------------------------------
    {
      id: 'try-image-identities',
      kind: 'try',
      title: 'Always true?',
      say: 'Which of these identities hold for every function? Select all that do.',
      prompt: 'For $f\\colon X \\to Y$, $A, B \\subseteq X$ and $C, D, T \\subseteq Y$, which always hold? Select all.',
      answer: { type: 'multi', value: ['a', 'c', 'e'] },
      choices: [
        { id: 'a', label: '$f(A \\cup B) = f(A) \\cup f(B)$', why: 'True: $y$ comes from an element of $A \\cup B$ exactly when it comes from an element of $A$ or of $B$.' },
        { id: 'b', label: '$f(A \\cap B) = f(A) \\cap f(B)$', why: 'Only $\\subseteq$ holds: $f(x) = x^2$, $A = \\{-1\\}$, $B = \\{1\\}$ gives $\\varnothing \\ne \\{1\\}$.' },
        { id: 'c', label: '$f^{-1}(C \\cap D) = f^{-1}(C) \\cap f^{-1}(D)$', why: 'True: both sides say $f(x) \\in C$ and $f(x) \\in D$.' },
        { id: 'd', label: '$f(f^{-1}(T)) = T$', why: 'Only $\\subseteq$: points of $T$ outside the range are lost. For $x^2$ and $T = \\{-1\\}$, the left side is $\\varnothing$. Equality needs $T$ inside the range (e.g. $f$ surjective).' },
        { id: 'e', label: '$A \\subseteq f^{-1}(f(A))$', why: 'True: if $x \\in A$ then $f(x) \\in f(A)$. Equality needs injectivity: $x^2$, $A = \\{1\\}$ gives $f^{-1}(f(A)) = \\{-1, 1\\}$.' },
      ],
      hint: 'Test each one with $f(x) = x^2$ on $\\mathbb{R}$.',
      solution: [
        '(a), (c) and (e) always hold; (b) and (d) hold only as inclusions $\\subseteq$.',
        'With $f(x) = x^2$: $f(\\{-1\\} \\cap \\{1\\}) = \\varnothing$ but $f(\\{-1\\}) \\cap f(\\{1\\}) = \\{1\\}$, which kills (b); $f(f^{-1}(\\{-1\\})) = f(\\varnothing) = \\varnothing \\ne \\{-1\\}$, which kills (d).',
        'For (e), $f^{-1}(f(\\{1\\})) = f^{-1}(\\{1\\}) = \\{-1, 1\\}$ contains $\\{1\\}$ but is larger: only the inclusion is guaranteed.',
      ],
    },

    // 12 -----------------------------------------------------------------------------------------------
    {
      id: 'wo-preimage-union',
      kind: 'workout',
      title: 'Work it out',
      say: 'Grab paper and prove this identity. A chain of if-and-only-ifs is the cleanest route.',
      prompt: 'Prove: for $f\\colon X \\to Y$ and $C, D \\subseteq Y$, $\\;f^{-1}(C \\cup D) = f^{-1}(C) \\cup f^{-1}(D)$.',
      answer: { type: 'proof' },
      hints: ['Unpack $x \\in f^{-1}(\\cdot)$ with the definition of preimage.', 'A chain of “if and only if” steps proves both inclusions at once.'],
      solution: [
        '**Proof.** Let $x \\in X$. Then',
        '$$x \\in f^{-1}(C \\cup D) \\iff f(x) \\in C \\cup D \\iff f(x) \\in C \\lor f(x) \\in D \\iff x \\in f^{-1}(C) \\lor x \\in f^{-1}(D) \\iff x \\in f^{-1}(C) \\cup f^{-1}(D),$$',
        'using the definition of preimage (first and third steps) and of union (second and fourth). Since $x \\in X$ was arbitrary, the two sets have the same elements, so $f^{-1}(C \\cup D) = f^{-1}(C) \\cup f^{-1}(D)$. ∎',
      ],
      rubric: [
        'Starts from an arbitrary element $x \\in X$.',
        'Uses the definition of preimage in both directions.',
        'Uses the definition of union correctly.',
        'Each step is a genuine “iff” (or both inclusions are proved separately).',
        'Concludes the set equality.',
      ],
    },

    // 13 -----------------------------------------------------------------------------------------------
    {
      id: 'wo-comp-surjective',
      kind: 'workout',
      title: 'Work it out',
      say: 'One more proof. Start from an arbitrary element of the final codomain.',
      prompt: 'Let $f\\colon A \\to B$ and $g\\colon B \\to C$. Prove: if $g \\circ f$ is surjective, then $g$ is surjective.',
      answer: { type: 'proof' },
      hints: ['Start with an arbitrary $c \\in C$.', 'Surjectivity of $g \\circ f$ hands you some $a \\in A$. Which element of $B$ then maps to $c$ under $g$?'],
      solution: [
        '**Proof.** Suppose $g \\circ f$ is surjective, and let $c \\in C$.',
        'Since $g \\circ f$ is surjective, there is $a \\in A$ with $g(f(a)) = c$.',
        'Let $b = f(a)$. Then $b \\in B$, because $f$ maps into $B$, and $g(b) = g(f(a)) = c$.',
        'Since $c \\in C$ was arbitrary, $g$ is surjective. ∎',
        '(Remark: $f$ need not be surjective. With $A = \\{1\\}$, $B = \\{1, 2\\}$, $C = \\{1\\}$, $f(1) = 1$, $g(1) = g(2) = 1$, $g \\circ f$ is surjective but nothing maps to $2$ under $f$.)',
      ],
      rubric: [
        'Fixes an arbitrary $c \\in C$.',
        'Uses surjectivity of $g \\circ f$ to obtain $a \\in A$ with $g(f(a)) = c$.',
        'Names $b = f(a)$ and notes $b \\in B$.',
        'Verifies $g(b) = c$ and concludes $g$ is surjective.',
      ],
    },

    // 14 -----------------------------------------------------------------------------------------------
    {
      id: 'cp-inverse',
      kind: 'explain',
      title: 'Explain it back',
      say: 'Before we wrap up, explain inverses and preimages in your own words.',
      prompt: 'Why does a function have an inverse exactly when it is a bijection? And why does $f^{-1}(T)$ make sense even when $f$ has no inverse?',
      points: [
        'Reversing the arrows gives a function only if every point of $B$ has exactly one arrow back.',
        '“At least one” arrow back is surjectivity; “at most one” is injectivity.',
        '$f^{-1}(T)$ is a set of inputs, defined by the membership condition $f(x) \\in T$, so it needs no inverse function.',
        'When $f$ is bijective, the preimage of $\\{y\\}$ is $\\{f^{-1}(y)\\}$: the two notations agree.',
      ],
    },

    // 15 -----------------------------------------------------------------------------------------------
    {
      id: 'recap',
      title: 'Recap',
      scene(s) {
        const items = [
          recapItem(s, '• $g \\circ f$: first $f$, then $g$. Compositions of injections are injective, of surjections surjective.', 110),
          recapItem(s, '• $f$ has an inverse $\\iff$ $f$ is a bijection; find it by solving $y = f(x)$.', 230),
          recapItem(s, '• Images $f(S)$ and preimages $f^{-1}(T)$; preimages respect every set operation.', 350),
          recapItem(s, 'Next: relations.', 470, C.blue),
        ];
        return { items };
      },
      steps: [
        {
          say: '$g \\circ f${g composed with f} means first $f${f}, then $g${g}. Composition preserves injective and surjective.',
          do: (s, o) => o.items[0].fadeIn({ shift: [-16, 0] }),
        },
        {
          say: 'A function has an inverse exactly when it is a bijection, and you find it by solving $y = f(x)${y equals f of x} for $x${x}.',
          do: (s, o) => o.items[1].fadeIn({ shift: [-16, 0] }),
        },
        {
          say: 'Images push sets forward, preimages pull them back, and preimages respect every set operation. Next time: relations, where one element may be related to many.',
          do: (s, o) => s.all(o.items[2].fadeIn({ shift: [-16, 0] }), o.items[3].fadeIn({ shift: [-16, 0], delay: 900 })),
        },
      ],
    },
  ],
};
