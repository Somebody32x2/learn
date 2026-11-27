/**
 * Lecture 5 · Valid arguments and rules of inference (foundations/PLAN.md § 5). Irani · Logic.
 *
 * Choreography: an English argument turns into its symbolic form (the colored phrases fly out as p and q);
 * validity is read off a truth table (premise rows banded blue, the conclusion cell green or red); the rules are a
 * grid of fraction-form cards; derivations are `s.proof` lines whose citations are drawn as arcs back to the
 * lines they use.
 */
import { C, FILL } from '../../lectern/src/core/stage.js';

// ---------------------------------------------------------------- local helpers

/** A box ring (drawn on the front layer): s.ring with a rounded box. */
const ring = (s, target, color, pad = 6) => s.ring(target, { color, pad, shape: 'box' });

/** A rule of inference in fraction form: premises over a bar, the conclusion under it. */
const frac = (premises, concl) => `\\begin{array}{c} ${premises} \\\\ \\hline ${concl} \\end{array}`;

/** A rule card: name on top, the fraction form below, in a soft blue frame. */
function ruleCard(s, name, tex, { x, y, w = 204, h = 200 }) {
  const frame = s.rect(x - w / 2, y, w, h, { color: C.blue, fill: FILL.blue, radius: 14, width: 2, visible: false });
  const title = s.text(name, { x, y: y + 46, size: 30, width: w - 14, weight: 600, color: C.blue, visible: false });
  // one fraction, or several side by side (each its own Tex, spread across the card)
  const list = [tex].flat();
  const bodies = list.map((t, i) => s.tex(t, { x: x + (i - (list.length - 1) / 2) * (w / list.length), y: y + 142, size: 30, visible: false }));
  return {
    frame,
    title,
    bodies,
    box: () => ({ x: x - w / 2, y, w, h }),
    show: (delay = 0) => s.all(frame.fadeIn({ shift: [0, 0], delay }), title.fadeIn({ delay: delay + 80 }), ...bodies.map((b) => b.fadeIn({ delay: delay + 200 }))),
  };
}

/** An arc in the left margin of a proof from one row back up to a cited row, with an arrowhead. */
function cite(s, p, from, to, { color = C.yellow, depth = 34 } = {}) {
  const a = p.lineBox(from, 'row');
  const b = p.lineBox(to, 'row');
  const x = a.x - 6;
  const [y1, y2] = [a.cy, b.cy];
  const path = s.path(`M ${x} ${y1} C ${x - depth} ${y1}, ${x - depth} ${y2}, ${x - 8} ${y2}`, { color, width: 3, layer: 'front', visible: false });
  const head = s.polygon([[x + 2, y2], [x - 12, y2 - 7], [x - 12, y2 + 7]], { color, fill: 'currentColor', width: 1, layer: 'front', visible: false });
  return path.draw({ duration: 600 }).then(() => head.fadeIn({ shift: [0, 0], duration: 200 })).then(() => [path, head]);
}

const recapItem = (s, str, y, color = C.ink) => s.text(str, { x: 80, y, size: 32, anchor: [0, 0.5], width: 820, align: 'left', color, visible: false });

/** The derivation shared by `fill-derivation` and `proofs-are-arguments`. */
const CHAIN = [
  ['p \\to q', 'premise'],
  ['q \\to r', 'premise'],
  ['p', 'premise'],
  ['q', 'MP 1, 3'],
  ['r', 'MP 2, 4'],
];

// ---------------------------------------------------------------- lecture

export default {
  id: 'inference',
  title: 'Valid arguments and rules of inference',
  goals: [
    'Define a valid argument and test validity with a truth table',
    'Use modus ponens, modus tollens, hypothetical and disjunctive syllogism, addition, simplification',
    'Recognize the fallacies of affirming the consequent and denying the antecedent',
    'Apply universal/existential instantiation and generalization correctly',
  ],
  beats: [
    // 1 ------------------------------------------------------------------------------------------------
    {
      id: 'argument-form',
      title: 'What an argument is',
      scene(s) {
        const eng = [
          s.tex('\\text{If } \\part{p}{\\text{it rained}}\\text{, then } \\part{q}{\\text{the grass is wet}}.', { x: 450, y: 110, size: 31, visible: false }),
          s.tex('\\part{p}{\\text{It rained}}.', { x: 450, y: 175, size: 31, visible: false }),
          s.tex('\\therefore\\ \\part{q}{\\text{The grass is wet}}.', { x: 450, y: 270, size: 31, visible: false }),
        ];
        const bar = s.line(200, 220, 700, 220, { width: 3, visible: false });
        const lab = (str, y) => s.text(str, { x: 180, y, size: 30, anchor: [1, 0.5], color: C.muted, italic: true, visible: false });
        const labels = [lab('premises', 142), lab('conclusion', 270)];
        const sym = [
          s.tex('\\part{p}{p} \\to \\part{q}{q}', { x: 830, y: 110, size: 40, visible: false }),
          s.tex('\\part{p}{p}', { x: 830, y: 175, size: 40, visible: false }),
          s.tex('\\therefore\\ \\part{q}{q}', { x: 830, y: 270, size: 40, visible: false }),
        ];
        const symBar = s.line(760, 220, 900, 220, { width: 3, visible: false });
        const def = s.defCard({ y: 395, width: 760, title: false, body: '**Valid**: in every situation where all the premises are true, the conclusion is true too.', visible: false });
        const same = s.tex('\\text{Same form: } 4 \\mid 12 \\to 12 \\text{ even},\\ \\ 4 \\mid 12\\ \\ \\therefore\\ 12 \\text{ even}', { x: 480, y: 520, size: 32, visible: false });
        return { eng, bar, labels, sym, symBar, def, same };
      },
      steps: [
        {
          say: 'An argument is a list of statements called premises, followed by a conclusion. If it rained, the grass is wet. It rained. Therefore the grass is wet.',
          do: async (s, o) => {
            await o.eng[0].write();
            await o.eng[1].write({ duration: 600 });
            await o.bar.draw({ duration: 500 });
            await o.eng[2].write({ duration: 700 });
            await s.all(o.labels.map((l, i) => l.fadeIn({ delay: i * 200, shift: [-12, 0] })));
          },
        },
        {
          say: 'The argument is valid when the conclusion must be true whenever all the premises are true. It does not ask whether it actually rained.',
          do: async (s, o) => {
            await s.all(o.eng.map((e) => e.color('p', C.blue)));
            await s.all(o.eng.map((e) => e.color('q', C.green)));
            await o.def.reveal();
          },
        },
        {
          say: 'Validity depends only on the form. Replace “it rained” by $p${p} and “the grass is wet” by $q${q}, and you get $p \\to q${p implies q}, $p${p}, therefore $q${q}.',
          do: async (s, o) => {
            const fly = [];
            o.eng.forEach((e, i) => {
              for (const name of ['p', 'q']) {
                if (!e.part(name).length || !o.sym[i].part(name).length) continue;
                const src = e.partBox(name);
                const dst = o.sym[i].partBox(name);
                const m = s.tex(name, { x: src.cx, y: src.cy, size: 40, color: name === 'p' ? C.blue : C.green });
                fly.push(m.moveTo(dst.cx, dst.cy, { duration: 900 }).then(() => m.fadeOut({ duration: 300 })));
              }
            });
            await s.all(...fly, o.symBar.draw({ delay: 500, duration: 500 }));
            for (const t of o.sym) {
              for (const e of t.part('p')) e.style.color = C.blue;
              for (const e of t.part('q')) e.style.color = C.green;
            }
            await s.all(o.sym.map((t) => t.fadeIn({ shift: [0, 0], duration: 400 })));
          },
        },
        {
          say: 'Any statements with this shape give a valid argument, about grass or about numbers. That is why we study the form.',
          do: async (s, o) => {
            await o.same.write({ duration: 1200 });
            await o.sym[0].indicate({ color: C.yellow });
          },
        },
      ],
    },

    // 2 ------------------------------------------------------------------------------------------------
    {
      id: 'validity-table',
      title: 'Checking validity with a table',
      scene(s) {
        const form = s.tex('p \\to q,\\ \\ p\\ \\ \\therefore\\ q', { x: 330, y: 60, size: 40 });
        const t = s.truthTable({
          x: 330,
          y: 320,
          size: 36,
          vars: ['p', 'q'],
          cols: [
            { tex: 'p \\to q', key: 'imp', fn: (v) => !v.p || v.q },
            { tex: '\\therefore\\, q', key: 'concl', fn: (v) => v.q },
          ],
          visible: false,
        });
        const note = (str, y, color) => s.text(str, { x: 600, y, size: 30, anchor: [0, 0.5], width: 320, align: 'left', color, visible: false });
        const notes = [note('premises: $p$ and $p \\to q$', 200, C.blue), note('both true: row 1 only', 260, C.blue), note('conclusion true there', 340, C.green)];
        const verdict = s.stamp('valid', { x: 700, y: 430, color: 'green', size: 34 });
        const name = s.text('modus ponens', { x: 700, y: 520, size: 34, weight: 600, color: C.blue, visible: false });
        return { form, t, notes, verdict, name };
      },
      steps: [
        {
          say: 'To test an argument, list every truth assignment and look only at the rows where every premise is true. Here the premises are $p${p} and $p \\to q${p implies q}: both hold only in the first row.',
          do: async (s, o) => {
            await o.t.fadeIn();
            await o.t.fillColumn('imp', { gap: 180 });
            await o.notes[0].fadeIn({ shift: [-12, 0] });
            await o.t.highlightRows((v) => v.p && (!v.p || v.q), 'blue');
            await o.notes[1].fadeIn({ shift: [-12, 0] });
          },
        },
        {
          say: 'If the conclusion is true in every one of those rows, the argument is valid. In row one, $q${q} is true, so this argument is valid.',
          do: async (s, o) => {
            await o.t.fillColumn('concl', { gap: 180 });
            await o.t.highlightCell(0, 'concl', 'green');
            await o.t.markRow(0, '✓');
            await o.notes[2].fadeIn({ shift: [-12, 0] });
            await o.verdict.slam();
          },
        },
        {
          say: 'This form has a name: modus ponens. From $p \\to q${p implies q} and $p${p}, conclude $q${q}. It is the step you take every time you apply a theorem.',
          do: async (s, o) => {
            await o.name.fadeIn();
            await o.form.indicate({ color: C.blue });
          },
        },
      ],
    },

    // 3 ------------------------------------------------------------------------------------------------
    {
      id: 'rules',
      title: 'The rules of inference',
      scene(s) {
        const top = 40;
        const bot = 265;
        const cards = {
          mp: ruleCard(s, 'modus ponens', frac('p \\to q,\\;\\; p', 'q'), { x: 140, y: top }),
          mt: ruleCard(s, 'modus tollens', frac('p \\to q,\\;\\; \\neg q', '\\neg p'), { x: 365, y: top }),
          simp: ruleCard(s, 'simplification', frac('p \\land q', 'p'), { x: 590, y: top }),
          add: ruleCard(s, 'addition', frac('p', 'p \\lor q'), { x: 815, y: top }),
          ds: ruleCard(s, 'disjunctive syllogism', [frac('p \\lor q,\\ \\neg p', 'q'), frac('p \\lor q,\\ \\neg q', 'p')], { x: 240, y: bot, w: 380 }),
          hs: ruleCard(s, 'hypothetical syllogism', frac('p \\to q,\\;\\; q \\to r', 'p \\to r'), { x: 575, y: bot, w: 250 }),
          conj: ruleCard(s, 'conjunction', frac('p,\\;\\; q', 'p \\land q'), { x: 818, y: bot, w: 200 }),
        };
        const chain = s.tex('p \\to q,\\ q \\to r,\\ p \\;\\xrightarrow{\\text{HS}}\\; p \\to r,\\ p \\;\\xrightarrow{\\text{MP}}\\; r', { x: 480, y: 530, size: 34, visible: false });
        const contra = s.tex('p \\to q \\;\\equiv\\; \\neg q \\to \\neg p:\\ \\text{ MT is MP on the contrapositive}', { x: 480, y: 530, size: 30, visible: false });
        return { cards, chain, contra };
      },
      steps: [
        {
          say: 'Each rule of inference is a small valid argument, checked once and for all by a truth table, the way we just checked modus ponens. Premises go above the bar, the conclusion below.',
          do: async (s, o) => {
            await o.cards.mp.show();
            await o.cards.mp.frame.flash({ color: C.green });
          },
        },
        {
          say: 'Disjunctive syllogism: if $p \\lor q${p or q} is true and $p${p} is false, then $q${q} must be true. Either disjunct can be the one you cancel.',
          do: async (s, o) => {
            await o.cards.ds.show();
            o.rs = [ring(s, o.cards.ds.box(), C.yellow, 4)];
            await o.rs[0];
          },
        },
        {
          say: 'Three small ones. Simplification: from $p \\land q${p and q}, conclude $p${p}. Addition: if $p${p} is true, so is $p \\lor q${p or q}, whatever $q${q} is. Conjunction: two true facts give $p \\land q${p and q}.',
          do: async (s, o) => {
            await s.all(o.rs.map((r) => r.fadeOut()));
            o.rs = [];
            for (const k of ['simp', 'add', 'conj']) {
              await o.cards[k].show();
              const r = ring(s, o.cards[k].box(), C.yellow, 4);
              o.rs.push(r);
              await r;
            }
          },
        },
        {
          say: 'Longer arguments chain the rules. From $p \\to q${p implies q}, $q \\to r${q implies r} and $p${p}, hypothetical syllogism gives $p \\to r${p implies r}, and then modus ponens gives $r${r}.',
          do: async (s, o) => {
            await s.all(o.rs.map((r) => r.fadeOut()));
            await o.cards.hs.show();
            await o.chain.write({ duration: 1400 });
            o.r1 = ring(s, o.cards.hs.box(), C.yellow, 4);
            await o.r1;
            o.r2 = ring(s, o.cards.mp.box(), C.yellow, 4);
            await o.r2;
          },
        },
        {
          say: 'Modus tollens is the contrapositive in action: from $p \\to q${p implies q} and not $q${q}, conclude not $p${p}. It is modus ponens applied to $\\neg q \\to \\neg p${not q implies not p}.',
          do: async (s, o) => {
            await s.all(o.r1.fadeOut(), o.r2.fadeOut(), o.chain.fadeOut());
            await o.cards.mt.show();
            await ring(s, o.cards.mt.box(), C.yellow, 4);
            await o.contra.write({ duration: 1200 });
          },
        },
      ],
    },

    // 4 ------------------------------------------------------------------------------------------------
    {
      id: 'try-name-rule',
      kind: 'try',
      title: 'Name the rule',
      say: 'Your turn. Read the argument and name the rule it uses.',
      prompt: '“If $4 \\mid n$, then $n$ is even. $n$ is odd. Therefore $4 \\nmid n$.” Which rule is this?',
      answer: { type: 'choice', value: 'b' },
      choices: [
        { id: 'a', label: 'Modus ponens', why: 'Modus ponens would conclude $q$ (“$n$ is even”) from $p$ (“$4 \\mid n$”).' },
        { id: 'b', label: 'Modus tollens', why: 'From $p \\to q$ and $\\neg q$ (“$n$ is odd”, i.e. not even), conclude $\\neg p$: $4 \\nmid n$.' },
        { id: 'c', label: 'Hypothetical syllogism', why: 'That chains two conditionals; here there is only one.' },
        { id: 'd', label: 'Affirming the consequent', why: 'That is the fallacy from $q$ to $p$; here the conclusion is negated, not affirmed.' },
      ],
      hint: 'Which part of the conditional does the second premise negate?',
      solution: [
        'Let $p$ be “$4 \\mid n$” and $q$ be “$n$ is even”. The premises are $p \\to q$ and “$n$ is odd”, which is $\\neg q$.',
        'From $p \\to q$ and $\\neg q$ we conclude $\\neg p$, that is $4 \\nmid n$. This is **modus tollens**.',
      ],
    },

    // 5 ------------------------------------------------------------------------------------------------
    {
      id: 'fallacies',
      title: 'Two famous fallacies',
      scene(s) {
        const form = s.tex('\\text{Affirming the consequent: } p \\to q,\\ \\ q\\ \\ \\therefore\\ p', { x: 480, y: 52, size: 34, visible: false });
        const t = s.truthTable({
          x: 270,
          y: 290,
          size: 30,
          vars: ['p', 'q'],
          cols: [
            { tex: 'p \\to q', key: 'imp', fn: (v) => !v.p || v.q },
            { tex: '\\neg p', key: 'np', fn: (v) => !v.p },
            { tex: '\\neg q', key: 'nq', fn: (v) => !v.q },
          ],
          visible: false,
        });
        const ex = (tex, y, color) => s.tex(tex, { x: 720, y, size: 32, color, visible: false });
        const ac = [ex('\\text{If } 4 \\mid n, \\text{ then } n \\text{ is even.}', 130), ex('6 \\text{ is even.}', 185), ex('\\therefore\\ 4 \\mid 6', 260, C.red)];
        const da = [ex('\\text{If } 4 \\mid n, \\text{ then } n \\text{ is even.}', 130), ex('4 \\nmid 6.', 185), ex('\\therefore\\ 6 \\text{ is not even}', 260, C.red)];
        const bar = s.line(580, 222, 860, 222, { width: 3, visible: false });
        const why = s.text('', { x: 720, y: 345, size: 30, color: C.red, visible: false });
        const hide = s.text('“… and since $n$ is even, $4 \\mid n$.”', { x: 480, y: 500, size: 32, visible: false });
        const hideWhy = s.text('affirming the consequent, hiding in a proof', { x: 480, y: 552, size: 30, color: C.red, visible: false });
        return { form, t, ac, da, bar, why, hide, hideWhy };
      },
      steps: [
        {
          say: 'Affirming the consequent: from $p \\to q${p implies q} and $q${q}, conclude $p${p}. One row with true premises and a false conclusion is enough to make an argument invalid, and here it is: $p${p} false, $q${q} true.',
          do: async (s, o) => {
            await o.form.write();
            await o.t.fadeIn();
            await o.t.fillColumn('imp', { gap: 150 });
            await o.t.highlightRows((v) => (!v.p || v.q) && v.q, 'blue');
            await o.t.highlightRows([2], 'red');
            await o.t.markRow(0, '✓');
            await o.t.markRow(2, '✗');
          },
        },
        {
          say: 'In words: if four divides $n${n}, then $n${n} is even; six is even; so four divides six. True premises, false conclusion.',
          do: async (s, o) => {
            await o.ac[0].write({ duration: 700 });
            await o.ac[1].write({ duration: 500 });
            await o.bar.draw({ duration: 400 });
            await o.ac[2].write({ duration: 500 });
            o.why.setText('it uses the converse $q \\to p$');
            await o.why.fadeIn();
          },
        },
        {
          say: 'Its twin is denying the antecedent: from $p \\to q${p implies q} and not $p${p}, conclude not $q${q}. The same row breaks it: four does not divide six, yet six is even. Both fallacies confuse a conditional with its converse or its inverse.',
          do: async (s, o) => {
            await s.all(o.t.clear(), o.bar.fadeOut(), ...o.ac.map((m) => m.fadeOut()), o.why.fadeOut());
            await s.all(o.form.swap('\\text{Denying the antecedent: } p \\to q,\\ \\ \\neg p\\ \\ \\therefore\\ \\neg q'), o.bar.fadeIn({ shift: [0, 0] }));
            await o.t.fillColumn('np', { gap: 120 });
            await o.t.fillColumn('nq', { gap: 120 });
            await o.t.highlightRows((v) => (!v.p || v.q) && !v.p, 'blue');
            await o.t.highlightRows([2], 'red');
            await o.t.markRow(3, '✓');
            await o.t.markRow(2, '✗');
            for (const m of o.da) await m.write({ duration: 500 });
            o.why.setText('it uses the inverse $\\neg p \\to \\neg q$');
            await o.why.fadeIn();
          },
        },
        {
          say: 'In proofs they hide in sentences like “and since the conclusion holds, the hypothesis does”. That step is invalid and loses the credit for the whole argument.',
          do: async (s, o) => {
            await o.hide.fadeIn();
            await s.strike(o.hide);
            await o.hideWhy.fadeIn();
          },
        },
      ],
    },

    // 6 ------------------------------------------------------------------------------------------------
    {
      id: 'try-valid',
      kind: 'try',
      title: 'Valid or not?',
      say: 'Which of these argument forms are valid? Select every one that is.',
      prompt: 'Which argument forms are valid? Select all.',
      answer: { type: 'multi', value: ['a', 'c'] },
      choices: [
        { id: 'a', label: '$p \\lor q,\\ \\neg p\\ \\therefore q$', why: 'Valid: disjunctive syllogism. If $p$ is false and $p \\lor q$ is true, $q$ must be true.' },
        { id: 'b', label: '$p \\to q,\\ \\neg p\\ \\therefore \\neg q$', why: 'Invalid: denying the antecedent. Row $p = \\mathrm{F}$, $q = \\mathrm{T}$ makes both premises true and $\\neg q$ false.' },
        { id: 'c', label: '$p \\to q,\\ q \\to r\\ \\therefore p \\to r$', why: 'Valid: hypothetical syllogism. If $p$ is true, then $q$ is, then $r$ is.' },
        { id: 'd', label: '$p \\to q,\\ q\\ \\therefore p$', why: 'Invalid: affirming the consequent. Row $p = \\mathrm{F}$, $q = \\mathrm{T}$ again.' },
      ],
      hint: 'For each one, look for a row with all premises true and the conclusion false.',
      solution: [
        '(a) is disjunctive syllogism and (c) is hypothetical syllogism: both valid.',
        '(b) and (d) both fail at $p = \\mathrm{F}$, $q = \\mathrm{T}$: there $p \\to q$ is true, $\\neg p$ and $q$ are true, but $\\neg q$ and $p$ are false.',
      ],
    },

    // 7 ------------------------------------------------------------------------------------------------
    {
      id: 'derivation',
      title: 'A derivation, step by step',
      scene(s) {
        const p = s.proof({ x: 520, y: 40, width: 760, height: 450, size: 32, whyWidth: 290 });
        const foot = s.text('every line: a statement, the rule, the lines it uses', { x: 520, y: 520, size: 30, color: C.muted, visible: false });
        return { p, foot };
      },
      steps: [
        {
          say: 'A derivation lists the premises, then adds one line at a time. Premises: $p \\lor q${p or q}, $\\neg q \\lor r${not q, or r}, and $\\neg r${not r}. Since $r${r} is false, the second premise forces $\\neg q${not q}: disjunctive syllogism.',
          do: async (s, o) => {
            o.l = [];
            o.l.push(o.p.add('p \\lor q', { tex: true, kind: 'assume', why: 'premise' }));
            o.l.push(o.p.add('\\neg q \\lor r', { tex: true, kind: 'assume', why: 'premise' }));
            o.l.push(o.p.add('\\neg r', { tex: true, kind: 'assume', why: 'premise' }));
            await o.l[2];
            o.l.push(o.p.add('\\neg q', { tex: true, why: 'disj. syllogism 2, 3' }));
            await o.l[3];
          },
        },
        {
          say: 'Every new line cites the lines it uses. Line four used lines two and three; now lines one and four give $p${p}, by disjunctive syllogism again.',
          do: async (s, o) => {
            await o.p.highlight(o.l[3], 'yellow');
            o.arcs = [...(await cite(s, o.p, o.l[3], o.l[1])), ...(await cite(s, o.p, o.l[3], o.l[2], { depth: 22 }))];
            await o.p.unhighlight(o.l[3]);
            await s.all(o.arcs.map((m) => m.fadeOut()));
            o.l.push(o.p.add('p', { tex: true, kind: 'conclude', why: 'disj. syllogism 1, 4' }));
            await o.l[4];
            await o.p.highlight(o.l[4], 'green');
            await cite(s, o.p, o.l[4], o.l[0], { color: C.green, depth: 46 });
            await cite(s, o.p, o.l[4], o.l[3], { color: C.green, depth: 22 });
          },
        },
        {
          say: 'This is exactly the discipline of a written proof, just in symbols: every statement comes with its reason and the earlier lines it depends on.',
          do: async (s, o) => {
            await o.p.qed();
            await o.foot.fadeIn();
          },
        },
      ],
    },

    // 8 ------------------------------------------------------------------------------------------------
    {
      id: 'quantified-rules',
      title: 'Rules for quantifiers',
      scene(s) {
        // One row per rule: name and a reminder on the left, the rule in symbols on the right.
        const card = (y, title, sub, tex) => {
          const frame = s.rect(40, y, 880, 98, { color: C.line, fill: FILL.ink, radius: 14, width: 2, visible: false });
          const t = s.text(title, { x: 64, y: y + 30, size: 30, weight: 600, color: C.blue, anchor: [0, 0.5], visible: false });
          const e = s.tex(sub, { x: 64, y: y + 70, size: 30, color: C.muted, anchor: [0, 0.5], visible: false });
          const f = s.tex(tex, { x: 765, y: y + 49, size: 34, visible: false });
          return { frame, t, f, e, show: () => s.all(frame.fadeIn({ shift: [0, 0] }), t.fadeIn({ delay: 100 }), e.fadeIn({ delay: 300 }), f.write({ delay: 200 })) };
        };
        const ui = card(28, 'universal instantiation', '\\text{primes} > 2 \\text{ are odd, so } 7 \\text{ is odd}', '\\forall x\\, P(x) \\;\\Rightarrow\\; P(c)');
        const ug = card(134, 'universal generalization', '\\text{for an } \\part{arb}{\\text{arbitrary}}\\ c', 'P(c) \\;\\Rightarrow\\; \\forall x\\, P(x)');
        const ei = card(240, 'existential instantiation', '\\text{name the witness with a } \\part{new}{\\text{new}} \\text{ letter}', '\\exists x\\, P(x) \\;\\Rightarrow\\; P(c)');
        const eg = card(346, 'existential generalization', '\\text{one example is enough}', 'P(7) \\;\\Rightarrow\\; \\exists x\\, P(x)');
        const bad = s.tex('m \\text{ even: } m = 2\\part{k1}{k};\\quad n \\text{ even: } n = 2\\part{k2}{k}', { x: 480, y: 485, size: 34, visible: false });
        const badWhy = s.text('reusing $k$ silently assumes $m = n$', { x: 480, y: 545, size: 30, color: C.red, visible: false });
        return { ui, ug, ei, eg, bad, badWhy };
      },
      steps: [
        {
          say: 'Instantiation uses a general fact on a particular object. Every prime greater than two is odd; seven is a prime greater than two; so seven is odd.',
          do: (s, o) => o.ui.show(),
        },
        {
          say: 'Generalization goes the other way. To conclude “for all $x${x}”, the object $c${c} must be arbitrary: nothing about it may be assumed. To conclude “there exists”, one example is enough.',
          do: async (s, o) => {
            await o.ug.show();
            await o.ug.e.color('arb', C.yellow);
            await o.eg.show();
          },
        },
        {
          say: 'When a hypothesis says something exists, give the witness a new name. Reusing a name is the “same $k${k}” bug we will meet in proofs: it silently makes two different objects equal.',
          do: async (s, o) => {
            await o.ei.show();
            await o.ei.e.color('new', C.yellow);
            await o.ei.f.indicate({ color: C.yellow });
            await o.bad.write();
            await s.all(s.ring([o.bad, 'k1'], { color: 'red' }), s.ring([o.bad, 'k2'], { color: 'red' }));
            await o.badWhy.fadeIn();
          },
        },
      ],
    },

    // 9 ------------------------------------------------------------------------------------------------
    {
      id: 'fill-derivation',
      kind: 'blanks',
      title: 'Complete the derivation',
      say: 'Complete this derivation: name each rule, and fill in the missing statement.',
      prompt: 'Premises: $1.\\ p \\to q$, $\\ 2.\\ q \\to r$, $\\ 3.\\ p$. Complete lines 4 and 5.',
      lines: [
        ['4.\\quad q \\qquad \\text{by }', { id: 'r4', chips: ['\\text{modus ponens}', '\\text{modus tollens}', '\\text{addition}'], answer: '\\text{modus ponens}', hint: 'From $p \\to q$ and $p$.' }, '\\ \\text{(lines 1, 3)}'],
        ['5.\\quad ', { id: 's5', chips: ['r', '\\neg r', 'q \\land r', 'p'], answer: 'r', hint: 'What does $q \\to r$ give once you know $q$?' }, '\\qquad \\text{by }', { id: 'r5', chips: ['\\text{modus ponens}', '\\text{modus tollens}', '\\text{addition}'], answer: '\\text{modus ponens}' }, '\\ \\text{(lines 2, 4)}'],
      ],
      solution: [
        'Line 4: from $p \\to q$ (line 1) and $p$ (line 3), modus ponens gives $q$.',
        'Line 5: from $q \\to r$ (line 2) and $q$ (line 4), modus ponens gives $r$.',
        'Another route: hypothetical syllogism on lines 1 and 2 gives $p \\to r$, then modus ponens with line 3 gives $r$.',
      ],
    },

    // 10 -----------------------------------------------------------------------------------------------
    {
      id: 'proofs-are-arguments',
      title: 'Proofs are arguments',
      scene(s) {
        const p = s.proof({ x: 480, y: 50, width: 440, height: 480, size: 32, whyWidth: 140 });
        writeChain(p);
        const src = ['hypotheses', 'definitions', 'known theorems'].map((str, i) =>
          s.text(str, { x: 710, y: 80 + i * 48, size: 30, color: C.blue, visible: false }),
        );
        const arrow = s.arrow(710, 220, 710, 262, { color: C.blue, width: 3, visible: false });
        const prem = s.text('the premises of a proof', { x: 710, y: 290, size: 30, weight: 600, color: C.blue, visible: false });
        const prose = [
          s.text('Since $p$ and $p \\to q$, we have $q$;', { x: 710, y: 385, size: 30, visible: false }),
          s.text('since $q \\to r$, we get $r$.', { x: 710, y: 435, size: 30, visible: false }),
        ];
        const next = s.text('Next: definitions and direct proof', { x: 710, y: 530, size: 30, color: C.muted, visible: false });
        return { p, src, arrow, prem, prose, next };
      },
      steps: [
        {
          say: 'A written proof is a valid argument. Its premises are the hypotheses of the theorem, the definitions, and theorems we already know.',
          do: async (s, o) => {
            await o.p.moveTo(260, 50, { duration: 800 });
            await s.all(o.src.map((m, i) => m.fadeIn({ delay: i * 200, shift: [-12, 0] })));
            await o.arrow.draw({ duration: 400 });
            await o.prem.fadeIn();
          },
        },
        {
          say: 'We write proofs in sentences, not numbered symbols: since $p${p} and $p \\to q${p implies q}, we have $q${q}; since $q \\to r${q implies r}, we get $r${r}. But every “so” must be one valid step.',
          do: async (s, o) => {
            await o.p.highlight(3, 'yellow');
            await o.prose[0].fadeIn({ shift: [0, 10] });
            await o.p.unhighlight(3);
            await o.p.highlight(4, 'yellow');
            await o.prose[1].fadeIn({ shift: [0, 10] });
          },
        },
        {
          say: 'Next we start writing real proofs, beginning with the definitions they rest on.',
          do: (s, o) => o.next.fadeIn(),
        },
      ],
    },

    // 11 -----------------------------------------------------------------------------------------------
    {
      id: 'wo-derive',
      kind: 'workout',
      title: 'Work it out',
      say: 'Grab paper. Derive the conclusion from the premises, numbering your lines and naming the rule for each one.',
      prompt: 'From the premises (1) $p \\to (q \\land r)$, (2) $r \\to s$, (3) $\\neg s$, derive $\\neg p$. Number your lines and name the rule (and the lines it uses) for each.',
      answer: { type: 'proof' },
      hints: ['What do premises (2) and (3) give together?', 'You have $\\neg r$. How do you get $\\neg(q \\land r)$ from it? Think addition, then De Morgan.'],
      solution: [
        '**Proof.** Lines 1–3 are the premises: 1. $p \\to (q \\land r)$, 2. $r \\to s$, 3. $\\neg s$.',
        '4. $\\neg r$ — modus tollens, lines 2, 3.',
        '5. $\\neg q \\lor \\neg r$ — addition, line 4 (with commutativity of $\\lor$).',
        '6. $\\neg(q \\land r)$ — De Morgan’s law, line 5.',
        '7. $\\neg p$ — modus tollens, lines 1, 6. ∎',
      ],
      rubric: [
        'Every line names a rule and the lines it uses.',
        'Modus tollens is applied in the right direction (from $p \\to q$ and $\\neg q$ to $\\neg p$).',
        'The step from $\\neg r$ to $\\neg(q \\land r)$ is justified (addition and De Morgan, or a stated equivalence).',
        'No fallacious step (no affirming the consequent or denying the antecedent).',
      ],
    },

    // 12 -----------------------------------------------------------------------------------------------
    {
      id: 'cp-valid',
      kind: 'explain',
      title: 'Explain it back',
      say: 'Before we finish, explain validity in your own words, and say why affirming the consequent fails.',
      prompt: 'What does it mean for an argument to be valid, and why is “affirming the consequent” invalid?',
      points: [
        'Valid means no truth assignment makes all the premises true and the conclusion false.',
        'Validity is about the form, not about whether the premises are actually true.',
        'Affirming the consequent ($p \\to q$, $q$, therefore $p$) fails at $p$ false, $q$ true.',
        'A valid argument with a false premise can have a false conclusion.',
      ],
    },

    // 13 -----------------------------------------------------------------------------------------------
    {
      id: 'recap',
      title: 'Recap',
      scene(s) {
        const items = [
          recapItem(s, '• Valid: whenever all premises are true, the conclusion is forced.', 130),
          recapItem(s, '• Rules: MP, MT, HS, DS, addition, simplification. Fallacies: affirming the consequent, denying the antecedent. Witnesses get fresh names.', 260),
          recapItem(s, 'Next: definitions and our first real proofs.', 420, C.blue),
        ];
        return { items };
      },
      steps: [
        {
          say: 'An argument is valid when its premises force its conclusion: no row makes the premises true and the conclusion false.',
          do: (s, o) => o.items[0].fadeIn({ shift: [-16, 0] }),
        },
        {
          say: 'The rules of inference are small valid arguments we chain together. Watch for the two fallacies, and give every witness a fresh name.',
          do: (s, o) => o.items[1].fadeIn({ shift: [-16, 0] }),
        },
        {
          say: 'Next: definitions, and our first real proofs.',
          do: (s, o) => o.items[2].fadeIn({ shift: [-16, 0] }),
        },
      ],
    },
  ],
};

/** Writes the derivation of `fill-derivation` into a proof (beat start state of `proofs-are-arguments`). */
function writeChain(p) {
  CHAIN.forEach(([tex, why], i) => p.add(tex, { tex: true, why, kind: i < 3 ? 'assume' : i === 4 ? 'conclude' : 'step', duration: 200 }));
}
