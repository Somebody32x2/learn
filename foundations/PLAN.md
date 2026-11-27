# Foundations of Higher Math: lecture plan

The complete plan for every lecture of `foundations/` (WashU MATH 3010, formerly Math 310). Each lecture file
`foundations/lectures/<id>.js` is written from its section below, in the shape fixed by `lectern/CONTRACT.md`.
Ids written here (lecture ids, beat ids) are permanent: they become progress keys.

**Course map.** Readings: the course zyBook (Irani, *Discrete Mathematics*; WashU uses a custom build whose
chapters are Logic, Proofs, Sets, Functions, Relations, Induction, Integers, so we cite it by chapter name),
Dumas–McCarthy *Transition to Higher Mathematics* ch. 5 (limits), 6 (cardinality), 8 (real numbers), Liebeck *A
Concise Introduction to Pure Mathematics*, and Krantz for the axiom of choice. Dumas–McCarthy ch. 9 (complex
numbers, "time permitting" in the syllabus) is not covered. The goal is the syllabus goal: read and write
rigorous definitions, theorems and proofs, ready for Math 4111 (analysis) and 429 (linear algebra). The grading
standard we teach to is the course's: iron-clad proofs, no benefit of the doubt.

| # | id | title | unit |
|---|----|-------|------|
| 1 | `propositions` | Propositions and connectives | Logic |
| 2 | `conditionals` | Conditionals and biconditionals | Logic |
| 3 | `quantifiers` | Predicates and quantifiers | Logic |
| 4 | `nested-quantifiers` | Nested quantifiers | Logic |
| 5 | `inference` | Valid arguments and rules of inference | Logic |
| 6 | `direct-proof` | Definitions and direct proof | Proof techniques |
| 7 | `contrapositive-contradiction` | Contrapositive and contradiction | Proof techniques |
| 8 | `cases-counterexamples` | Cases, counterexamples, existence and uniqueness | Proof techniques |
| 9 | `sets` | Sets, subsets and power sets | Sets |
| 10 | `set-operations` | Set operations and identities | Sets |
| 11 | `functions` | Functions, injections and surjections | Functions |
| 12 | `composition-inverses` | Composition, inverses, images and preimages | Functions |
| 13 | `relations` | Relations and their properties | Relations |
| 14 | `equivalence-relations` | Equivalence relations and partitions | Relations |
| 15 | `induction` | Mathematical induction | Induction |
| 16 | `strong-induction` | Strong induction and recursion | Induction |
| 17 | `division` | Divisibility and the division algorithm | Integers & number theory |
| 18 | `gcd` | GCD, Euclid's algorithm and unique factorization | Integers & number theory |
| 19 | `congruences` | Congruences and modular arithmetic | Integers & number theory |
| 20 | `counting` | Products, permutations and combinations | Counting |
| 21 | `binomial-pigeonhole` | The binomial theorem and pigeonhole | Counting |
| 22 | `cardinality` | Finite and countable sets | Cardinality |
| 23 | `uncountable` | Uncountable sets and Cantor's diagonal | Cardinality |
| 24 | `choice` | The axiom of choice | Cardinality |
| 25 | `real-numbers` | The real numbers and completeness | Real numbers & limits |
| 26 | `limits` | Sequences and limits | Real numbers & limits |

---

## Style guide for authors

### Voice

The lecture is a one-on-one office hour with a professor who likes this material and respects the student.
Warm, unhurried, precise. Speak to "you"; say "we" when doing the proof together. Every `say` is 1–3 sentences
carrying one idea. Never say "simply", "obviously", "clearly" or "trivially"; if a step is easy, say *why* it is
easy. Name the justification for every step out loud ("by the definition of odd", "by the inductive
hypothesis"). When a common mistake comes up, say plainly that it is a mistake and why it loses credit: this
course grades iron-clad proofs with no benefit of the doubt, and the narration should prepare the student for
that standard without scaring them.

Each lecture follows the same arc: **why we care** → **precise definition** (purple) → **example** →
**how to find the proof** (scratch work, faint, on the left) → **how to write it** (two-column proof on the right)
→ **what goes wrong** (red) → **practice**.

Math in narration is written `$tex${spoken words}` (CONTRACT.md), e.g.
`So $n^2 = 2m + 1${n squared equals two m plus one}, which is odd.` Spoken forms: `\forall` "for all",
`\exists` "there exists", `\implies` "implies", `\iff` "if and only if", `\neg p` "not p", `\in` "is in" /
"is an element of", `\subseteq` "is a subset of", `\mathcal{P}(A)` "the power set of A", `f^{-1}(T)` "the
preimage of T", `a \mid b` "a divides b", `a \equiv b \pmod n` "a is congruent to b mod n", `\binom{n}{k}`
"n choose k", `\varepsilon` "epsilon". Never leave a bare `$…$` in a `say`.

### Notation (use exactly these)

| idea | TeX | notes |
|------|-----|-------|
| connectives | `\neg`, `\land`, `\lor`, `\oplus`, `\to`, `\leftrightarrow` | `\to`/`\leftrightarrow` inside logic formulas |
| between statements | `\implies`, `\iff` | in proofs and theorem statements |
| quantifiers | `\forall x \in A,\ P(x)`, `\exists x \in A,\ P(x)`, `\exists!` | always name the domain |
| equivalence of formulas | `\equiv` | `p \to q \equiv \neg p \lor q` |
| sets | `\in`, `\notin`, `\subseteq`, `\subsetneq`, `\cup`, `\cap`, `A \setminus B`, `A^c`, `A \times B`, `\varnothing`, `\mathcal{P}(A)`, `\lvert A \rvert` | set-builder `\{x \in A : P(x)\}` with a colon |
| numbers | `\mathbb{N}`, `\mathbb{Z}`, `\mathbb{Q}`, `\mathbb{R}` | **convention: $\mathbb{N} = \{1, 2, 3, \dots\}$**; write `\mathbb{Z}_{\ge 0}` when 0 is wanted. Say it aloud the first time (lectures 3 and 9) |
| functions | `f\colon A \to B`, `x \mapsto x^2`, `g \circ f`, `f(S)`, `f^{-1}(T)`, `\mathrm{id}_A` | |
| relations | `a \mathrel{R} b`, `a \sim b`, `[a]_\sim` (or `[a]` once `\sim` is fixed), `A/{\sim}` | |
| integers | `a \mid b`, `a \nmid b`, `\gcd(a, b)`, `a \equiv b \pmod n`, `\mathbb{Z}_n` | |
| counting | `n!`, `\binom{n}{k}`, `P(n, k)` | |
| analysis | `\sup S`, `\inf S`, `(a_n)`, `\lim_{n\to\infty} a_n = L`, `\varepsilon`, `\lvert x \rvert` | |

### Proof-writing conventions (on the stage and in solutions)

- Open with **Proof.** and close with **∎** (`\blacksquare` on the stage; "∎" in markdown).
- Introduce every variable with its type and quantifier: "Let $n \in \mathbb{Z}$." / "Let $\varepsilon > 0$."
  Hypotheses with **Suppose**. Consequences with **Then** / **So** / **Hence**. The last line starts
  **Therefore** and restates the goal in the words of the theorem.
- Announce the method in the first line: "We prove the contrapositive." / "Suppose, for contradiction, that …"
  / "We proceed by induction on $n$." / "We prove both inclusions."
- New existential witnesses get new names: two odd integers are $2a + 1$ and $2b + 1$, never $2k + 1$ twice.
- Scratch work and the written proof are shown separately. Scratch work may run backwards from the goal; the
  written proof never does.
- Two-column proofs (the `proof` component) put the statement left and the justification right. Prose proofs in
  solutions put justifications in the sentence ("…, since $\mathbb{Z}$ is closed under multiplication").

### Colors (the stage palette from `C`/`FILL` in `core/stage.js`)

| color | meaning |
|-------|---------|
| `C.blue` / `FILL.blue` | hypotheses, givens, what we may use (the "Suppose" lines, the inductive hypothesis) |
| `C.green` / `FILL.green` | the conclusion, the goal, "what we want"; a finished line that reaches the goal |
| `C.red` / `FILL.red` | contradictions, counterexamples, broken steps, wrong proofs (struck through) |
| `C.yellow` / `FILL.yellow` | attention: the step being explained right now, the place a hypothesis gets used |
| `C.purple` / `FILL.purple` | definitions (definition cards, unpacked definitions) |
| `C.muted` | scratch work, side remarks |
| `C.teal`, `C.orange` | neutral second/third series (a second set, a second sequence), never semantic |

Mark colorable pieces with `\part{name}{…}` and color them via `tex.color(name, C.blue)`.

### Component vocabulary used in this plan

Factories are registered by `lectern/src/viz/logic.js`, `sets.js` and `shapes.js`; the exact option and method
names are those in their header comments and in the `#/kit` demos. This plan uses these names; where the real
method differs, use the real one with the same effect.

- `s.tex`, `s.text`, `s.group`: statements, cards, captions. A **definition card** = purple-outlined `Rect`
  (`FILL.purple`) with a `Tex` inside. A **scratch pane** = left half of the stage, muted ink, titled "scratch".
- `s.truthTable({ vars, cols })`: fills columns one at a time, highlights rows, marks cells T/F (green/red).
- `s.proof({ x, y, width })`: the two-column proof writer; `line(statement, reason)` writes the next line,
  lines can be highlighted (yellow), colored (blue/green), struck (red) and annotated with an arrow to a
  previous line ("by line 2").
- `s.chain(...)`: an implication/equivalence chain $A \iff B \iff C$, each link appearing with its reason.
- `s.venn({ sets, universe })`: two or three sets; shade/unshade regions by name (e.g. `'A∩B'`, `'A−B'`),
  place elements in regions.
- `s.mapDiagram({ domain, codomain })`: two ovals with dots; draw arrows `a ↦ b`, highlight collisions or
  unhit targets, reverse all arrows (inverse), chain a second diagram (composition).
- `s.relationGraph({ nodes })`: directed graph; edges and loops; can lay out as a Hasse diagram.
- `s.numberLine({ range })`: points, open/closed intervals, an epsilon band around a point, a sequence of
  points appearing one by one, labels and markers (e.g. "N").
- `s.digitGrid({ rows, cols })`: a table of digits (Cantor's diagonal); highlight the diagonal, write a new
  row with changed digits.
- `s.dominoes({ n })`: a row of dominoes; topple the first, then the chain; can show "each knocks the next"
  and "all earlier knock the next" (strong induction).
- `s.modClock({ n })`: a clock with residues $0, \dots, n - 1$; step a pointer by $+a$ or $\times a$, highlight
  residues, draw a cycle.
- Shapes: `Line`, `Arrow`, `Rect`, `Circle`, `Dot`, `Path`, `Brace`, `Surround`, `Label`. Graphs of functions
  may use `s.plane` from the matrix viz.

### Interludes

- **try** (`kind: 'try'`): one question with `choice`, `multi`, `number` or `set` answers. Every choice has a
  `why` (for wrong ones: the misconception; for the right one: the reason). Always a `hint` and a `solution`.
- **blanks**: fill in a step of a proof, a negation or a formula. Symbolic pieces are `chips` (3–4 TeX choices,
  wrong chips are the real mistakes students make); numbers are typed (`{ type: 'number', value }`). In the plan a
  blank is written [answer]. A line alternates TeX strings and blanks, so a blank can't sit inside `\frac{}{}` or
  another TeX group: write the surrounding math with `/` and parentheses instead.
- **workout**: 1–2 per lecture. Proof workouts have `answer: { type: 'proof' }`, a model proof as `solution`
  (paragraphs, starting "**Proof.**", ending "∎") and a `rubric` of 3–5 items (what a complete, iron-clad proof
  contains). Computational workouts have exact answers and, where natural, `generate(rand)` for fresh bank
  variants (the generator is described in the plan; `rand` is the seeded rng from `core/hash.js`).
  Hints are revealed one at a time: 2–3 per workout.
- **explain**: one per lecture, near the end; a prompt and 3–4 `points`.
- Each lecture's last scene beat is `recap`: the lecture's takeaways as a short list that builds one item per
  step (2–4 steps), ending with a pointer to the next lecture.

Notation in this plan: "✓" marks the correct choice; choice ids are the letters shown. "Steps" are the
narration steps of a scene beat, summarized.

---

## 1 · `propositions` — Propositions and connectives

*Irani · Logic · 12 min*

**Goals**
- Decide whether a sentence is a proposition
- Compute truth values of compound propositions with $\neg$, $\land$, $\lor$, $\oplus$ using truth tables
- Recognize tautologies and contradictions
- Show two propositions are (or are not) logically equivalent, and negate "and"/"or" with De Morgan's laws

**Beats**

1. **scene `why-logic` — Why start with logic?**
   Stage: two sentences fade in, "Every square is even." and "If $n$ is even, then $n^2$ is even."; a red F
   stamp lands on the first ($3^2 = 9$), a green T on the second. Then the English "soup or salad?" appears
   with "exactly one" underlined in yellow.
   Steps: (1) Mathematics is made of sentences that are true or false, and a proof is a chain of them.
   (2) English is ambiguous: a waiter's "or" means exactly one; in math we fix every word's meaning once.
   (3) This course is about reading and writing proofs that leave no gaps, and logic is the grammar.

2. **scene `propositions` — What is a proposition?**
   Stage: five sentences in a column, each getting a stamp: "7 is prime" (T), "$2 + 2 = 5$" (F), "$x > 3$" (—, not
   a proposition), "Close the door." (—), "Every even integer greater than 2 is a sum of two primes" (T or F,
   unknown: Goldbach).
   Steps: (1) A proposition is a declarative sentence that is either true or false, not both. (2) "$x > 3$" has
   a free variable, so it has no truth value yet; commands and questions are not propositions either.
   (3) Goldbach's conjecture is a proposition even though nobody knows its truth value.

3. **scene `connectives` — Not, and, or**
   Stage: `truthTable({ vars: ['p','q'], cols: ['\\neg p', 'p \\land q', 'p \\lor q'] })`; rows in the order
   TT, TF, FT, FF; each column fills top to bottom, the TT row of $\land$ glows green, the FF row of $\lor$ red.
   Steps: (1) Two variables give four rows, always in this order. (2) $\neg p$ flips. (3) $p \land q$ is true
   only when both are. (4) $p \lor q$ is *inclusive*: false only when both are false.

4. **try `try-inclusive-or` — Your turn**
   Prompt: Let $p$ be "$5 > 3$" and $q$ be "$5$ is even". What are the truth values of $p \lor q$ and $p \land q$?
   Answer: choice `a`. Choices: (a) $p \lor q$ true, $p \land q$ false ✓ (p is true, which satisfies "or";
   q is false, which breaks "and"); (b) both false (p alone makes "or" true); (c) both true ("and" needs q
   too, and 5 is odd); (d) $p \lor q$ false, $p \land q$ true ("and" true would force "or" true).
   Hint: Find the truth value of each piece first. Solution: $p$ is T, $q$ is F; row TF of the table gives
   $p \lor q = $ T and $p \land q = $ F.

5. **scene `xor` — Exclusive or**
   Stage: a $p \oplus q$ column is added beside $p \lor q$; the TT row differs and is boxed yellow. Below:
   $p \oplus q \equiv (p \lor q) \land \neg(p \land q)$ writes in.
   Steps: (1) "Exactly one" is a different connective, exclusive or. (2) It disagrees with "or" only in the
   top row. (3) In this course "or" always means inclusive unless we say "exactly one".

6. **scene `compound` — Evaluating a compound proposition**
   Stage: an 8-row table for $(p \lor q) \land \neg r$ with helper columns $p \lor q$ and $\neg r$; rows
   TTF, TFF, FTF end green, the rest red.
   Steps: (1) Three variables, $2^3 = 8$ rows: halve the pattern in each column (4 T's then 4 F's; 2 and 2;
   alternating). (2) Build helper columns from the inside out. (3) Combine them with the main connective.

7. **blanks `fill-row` — Fill in the row**
   Lines (chips `\mathrm{T}`, `\mathrm{F}` for every blank):
   - $p = \mathrm{F},\ q = \mathrm{T},\ r = \mathrm{F}$: $p \lor q = $ [T], $\neg r = $ [T], $(p \lor q) \land \neg r = $ [T]
   - $p = \mathrm{T},\ q = \mathrm{F},\ r = \mathrm{T}$: $p \lor q = $ [T], $\neg r = $ [F], $(p \lor q) \land \neg r = $ [F]
   Solution: inside out; "and" needs both helper columns true.

8. **scene `tautology` — Tautologies and contradictions**
   Stage: a two-row table with $p \lor \neg p$ (all T, column turns green) and $p \land \neg p$ (all F, red).
   Steps: (1) A tautology is true in every row. (2) A contradiction is false in every row. (3) Contradictions
   are what proofs by contradiction aim to reach.

9. **scene `equivalence` — Logical equivalence**
   Stage: definition card (purple): "$A \equiv B$ means $A$ and $B$ have the same truth value in every row."
   Then a table with columns $\neg(p \land q)$ and $\neg p \lor \neg q$; the two final columns flash and a
   green "=" appears between them.
   Steps: (1) Equivalent means indistinguishable by truth values. (2) Compare the final columns row by row.
   (3) Equivalently, $A \leftrightarrow B$ is a tautology.

10. **scene `de-morgan` — De Morgan's laws**
    Stage: $\neg(p \land q) \equiv \neg p \lor \neg q$ and $\neg(p \lor q) \equiv \neg p \land \neg q$, with the
    $\neg$ sliding in front of each letter and $\land$ morphing into $\lor$. Then the wrong version
    $\neg(p \land q) \equiv \neg p \land \neg q$ appears; row $p = \mathrm{T}, q = \mathrm{F}$ shows T vs F in
    red and the line is struck.
    Steps: (1) Negating "and" gives "or" of the negations, and vice versa. (2) English: "not both rich and
    famous" means "not rich or not famous". (3) Keeping the "and" is the most common logic error; one row kills it.

11. **try `try-negate-and` — Negate it**
    Prompt: Negate: "$x$ is positive and $x$ is an integer."
    Answer: choice `b`. Choices: (a) "$x$ is not positive and $x$ is not an integer" (that's
    $\neg p \land \neg q$; De Morgan switches "and" to "or"); (b) "$x$ is not positive or $x$ is not an
    integer" ✓; (c) "$x$ is negative or $x$ is not an integer" ("not positive" includes $0$); (d) "$x$ is
    positive or $x$ is an integer" (that drops the negation).
    Hint: $\neg(p \land q) \equiv$ ? Solution: By De Morgan, $\neg(p \land q) \equiv \neg p \lor \neg q$; and
    the negation of "positive" is "not positive", i.e. $x \le 0$, not "negative".

12. **scene `laws` — An algebra of propositions**
    Stage: a card of laws fades in line by line (commutative, associative, distributive both ways, identity
    $p \land \mathrm{T} \equiv p$, domination $p \lor \mathrm{T} \equiv \mathrm{T}$, complement
    $p \lor \neg p \equiv \mathrm{T}$, double negation, De Morgan, absorption $p \lor (p \land q) \equiv p$). Then
    `proof` simplifies $\neg(p \lor \neg q) \lor q$: $\equiv (\neg p \land \neg\neg q) \lor q$ (De Morgan)
    $\equiv (\neg p \land q) \lor q$ (double negation) $\equiv q \lor (q \land \neg p)$ (commutative)
    $\equiv q$ (absorption).
    Steps: (1) Each law is a small truth-table fact we can reuse. (2) A chain of laws proves equivalence
    without a table; each step names its law. (3) With many variables this beats a $2^n$-row table.

13. **workout `wo-equiv` — Work it out**
    Prompt: Using the laws of logic (name each one), show that $(p \land q) \lor (\neg p \land q) \equiv q$.
    Answer: proof. Hints: (1) Both terms contain $q$: factor it out. (2) Which law turns $p \lor \neg p$ into
    something simple?
    Solution: **Proof.** $(p \land q) \lor (\neg p \land q) \equiv (q \land p) \lor (q \land \neg p)$
    (commutative) $\equiv q \land (p \lor \neg p)$ (distributive) $\equiv q \land \mathrm{T}$ (complement)
    $\equiv q$ (identity). ∎
    Rubric: every step names a valid law; the distributive law is applied in the right direction; uses the
    complement law $p \lor \neg p \equiv \mathrm{T}$; ends exactly at $q$; a truth table is also accepted if all
    four rows are shown and the columns compared.

14. **explain `cp-equivalence` — Explain it back**
    Prompt: What does it mean for two propositions to be logically equivalent, and how would you show that two
    propositions are *not* equivalent?
    Points: same truth value under every assignment of the variables; a truth table compares the final
    columns row by row (or a chain of laws transforms one into the other); to show non-equivalence it is
    enough to give one assignment where they differ; example: $\neg(p \land q)$ vs $\neg p \land \neg q$ at
    $p = \mathrm{T}, q = \mathrm{F}$.

15. **scene `recap` — Recap**
    Steps: (1) Propositions, connectives, truth tables. (2) Equivalence = same column; De Morgan flips and/or.
    (3) Next: "if … then", the connective every theorem is built on.

---

## 2 · `conditionals` — Conditionals and biconditionals

*Irani · Logic · 14 min*

**Goals**
- Give the truth table of $p \to q$, including vacuous truth
- Translate "only if", "necessary", "sufficient" and "whenever" into $p \to q$ in the right direction
- Form the converse, inverse and contrapositive, and know which are equivalent to the original
- Negate a conditional correctly: $\neg(p \to q) \equiv p \land \neg q$
- Read biconditionals and definitions

**Beats**

1. **scene `promise` — A promise**
   Stage: the sentence "If you get an A on the final, then you get an A in the course." with the hypothesis
   in blue and the conclusion in green. Four cards appear: (A on final, A in course), (A, not A), (not A, A),
   (not A, not A); only the second gets a red "promise broken".
   Steps: (1) Think of $p \to q$ as a promise. (2) It is broken only if $p$ happens and $q$ doesn't. (3) If you
   didn't ace the final, I kept my promise no matter what grade you got.

2. **scene `cond-table` — The truth table of $p \to q$**
   Stage: `truthTable` with columns $p \to q$ then $\neg p \lor q$; the TF row is red; the FT and FF rows get a
   yellow tag "vacuously true"; the two final columns match (green).
   Steps: (1) $p$ is the hypothesis, $q$ the conclusion. (2) The only false row is T→F. (3) So
   $p \to q \equiv \neg p \lor q$, which we will use constantly.

3. **scene `vacuous` — Vacuous truth**
   Stage: "Every unicorn in this room is purple." gets a green T; then "$\forall x \in \varnothing,\ P(x)$"
   and "If $2 + 2 = 5$, then $\pi = 3$." also T.
   Steps: (1) A conditional with a false hypothesis is true: there is nothing to check. (2) "Every element of
   the empty set …" is true for the same reason. (3) This is not a trick; it is what makes definitions such
   as "$\varnothing \subseteq A$" work.

4. **try `try-cond-values` — Which are true?**
   Prompt: Which of these statements are true? Select all.
   Answer: multi `['a','c','d']`. Choices: (a) "If 3 is even, then 7 is prime." ✓ (false hypothesis);
   (b) "If 7 is prime, then 3 is even." (T → F is the one false row); (c) "If $2 < 3$, then $2 < 5$." ✓ (T → T);
   (d) "If 4 is odd, then 4 is odd." ✓ ($p \to p$ is a tautology).
   Hint: A conditional is false only when the hypothesis is true and the conclusion false.
   Solution: Check each against the table; only (b) has a true hypothesis and a false conclusion.

5. **scene `english` — Many ways to say $p \to q$**
   Stage: a list, each line with $p$ in blue and $q$ in green and an arrow from blue to green: "if $p$, then
   $q$", "$q$ if $p$", "$p$ only if $q$", "$p$ is sufficient for $q$", "$q$ is necessary for $p$", "$q$
   whenever $p$". "only if" is boxed yellow.
   Steps: (1) The hypothesis is whatever follows "if" (but not "only if"). (2) "$p$ only if $q$" means $q$ is
   forced by $p$: the arrow points *toward* $q$. (3) Sufficient conditions are hypotheses; necessary
   conditions are conclusions. Example: "You may graduate only if you pass this course."

6. **scene `variants` — Converse, inverse, contrapositive**
   Stage: four statements in a 2×2 grid, original $p \to q$, converse $q \to p$, inverse $\neg p \to \neg q$,
   contrapositive $\neg q \to \neg p$; then a truth table with all four columns; matching columns are joined
   by green brackets (original ≡ contrapositive, converse ≡ inverse). Example "If $4 \mid n$, then $n$ is
   even" and its false converse, with $n = 2$ in red.
   Steps: (1) Name the three relatives. (2) The contrapositive has the same table, so it says the same
   thing. (3) The converse does not; $n = 2$ is even but not divisible by 4.

7. **blanks `fill-variants` — Contrapositive and converse**
   For "If $f$ is differentiable, then $f$ is continuous" (chips for each blank: `\text{f is continuous}`,
   `\text{f is not continuous}`, `\text{f is differentiable}`, `\text{f is not differentiable}`):
   - Contrapositive: If [f is not continuous], then [f is not differentiable].
   - Converse: If [f is continuous], then [f is differentiable].
   Solution: the contrapositive swaps and negates; the converse only swaps. The theorem and its
   contrapositive are true; the converse is false ($f(x) = \lvert x \rvert$ at $0$).

8. **scene `negate-cond` — Negating an implication**
   Stage: `proof` lines: $\neg(p \to q) \equiv \neg(\neg p \lor q)$ (conditional law) $\equiv \neg\neg p \land
   \neg q$ (De Morgan) $\equiv p \land \neg q$ (double negation). Then the tempting wrong answer
   "$p \to \neg q$" is struck in red.
   Steps: (1) The negation of a promise is "it was broken": $p$ happened and $q$ didn't. (2) The negation of
   an "if" is an "and", not another "if". (3) Example: the negation of "If it rains, the game is cancelled" is
   "It rains and the game is not cancelled."

9. **try `try-negate-cond` — Negate it**
   Prompt: For a fixed integer $n$, which is the negation of "If $n$ is prime, then $n$ is odd"?
   Answer: choice `b`. Choices: (a) "If $n$ is prime, then $n$ is even" (both this and the original are true
   when $n$ is not prime, so it can't be the negation); (b) "$n$ is prime and $n$ is even" ✓ ($p \land \neg q$;
   true for $n = 2$); (c) "If $n$ is not prime, then $n$ is not odd" (the inverse); (d) "$n$ is not prime
   and $n$ is odd" (negates the wrong part).
   Hint: When exactly is the original false? Solution: $\neg(p \to q) \equiv p \land \neg q$.

10. **scene `biconditional` — If and only if**
    Stage: the table of $p \leftrightarrow q$ (T in TT and FF); then $p \leftrightarrow q \equiv (p \to q) \land
    (q \to p)$; then two arrows ⇒ (blue to green) and ⇐ (green to blue) drawn under "$n$ is even $\iff$ $n^2$
    is even".
    Steps: (1) "If and only if" is true when both sides agree. (2) It is two conditionals. (3) So proving an
    "iff" means proving both directions, labelled (⇒) and (⇐).

11. **scene `definitions-iff` — Definitions say "if" but mean "iff"**
    Stage: a purple definition card "An integer $n$ is **even** if $n = 2k$ for some integer $k$."; the word
    "if" morphs into "if and only if" in yellow.
    Steps: (1) In a definition, "if" is an "iff" by convention: the defined word means exactly the condition.
    (2) In a theorem, "if" is one direction only. (3) So you may always unpack a definition both ways.

12. **try `try-assoc` — Is $\to$ associative?**
    Prompt: Are $(p \to q) \to r$ and $p \to (q \to r)$ logically equivalent?
    Answer: choice `b`. Choices: (a) Yes (check $p = \mathrm{F}, r = \mathrm{F}$); (b) No: they differ when
    $p = \mathrm{F}, q = \mathrm{T}, r = \mathrm{F}$ ✓ (left: $(\mathrm{F} \to \mathrm{T}) \to \mathrm{F} =
    \mathrm{T} \to \mathrm{F} = \mathrm{F}$; right: $\mathrm{F} \to \dots = \mathrm{T}$); (c) No: they differ
    when $p = q = \mathrm{T}, r = \mathrm{F}$ (both are F there); (d) No: they differ when $p = \mathrm{T}, q =
    r = \mathrm{F}$ (both are T there).
    Hint: A false hypothesis makes the right side true; can you make the left side false at the same time?
    Solution: Evaluate both at each candidate row; one differing row proves non-equivalence.

13. **workout `wo-distribute-cond` — Work it out**
    Prompt: Prove, using laws of logic, that $(p \to q) \land (p \to r) \equiv p \to (q \land r)$. Then say
    in one English sentence what it means.
    Answer: proof. Hints: (1) Rewrite each conditional with $\neg p \lor \cdots$. (2) $\lor$ distributes over
    $\land$.
    Solution: **Proof.** $(p \to q) \land (p \to r) \equiv (\neg p \lor q) \land (\neg p \lor r)$ (conditional
    law, twice) $\equiv \neg p \lor (q \land r)$ (distributive law) $\equiv p \to (q \land r)$ (conditional
    law). ∎ In words: to prove that $p$ implies two things, prove each separately.
    Rubric: uses $p \to q \equiv \neg p \lor q$ correctly; applies distributivity of $\lor$ over $\land$; names
    every law; reaches the right side exactly; gives a correct English reading.

14. **explain `cp-contrapositive` — Explain it back**
    Prompt: Why is a conditional equivalent to its contrapositive but not to its converse?
    Points: $p \to q$ is false only when $p$ is true and $q$ false; $\neg q \to \neg p$ is false only when
    $\neg q$ is true and $\neg p$ false, the same row; the converse $q \to p$ is false in the row $p$ false, $q$
    true, where the original is true; an example such as "$4 \mid n \implies n$ even" with $n = 2$.

15. **scene `recap` — Recap**
    Steps: (1) $p \to q$ fails only at T→F; vacuous truth. (2) Contrapositive ≡ original; converse is a
    different statement; $\neg(p \to q) \equiv p \land \neg q$. (3) Next: statements about *every* or *some*
    object.

---

## 3 · `quantifiers` — Predicates and quantifiers

*Irani · Logic · 14 min*

**Goals**
- Evaluate predicates and quantified statements over a stated domain
- Prove an existential statement with a witness, disprove a universal statement with a counterexample
- Negate quantified statements (De Morgan's laws for quantifiers), including restricted quantifiers
- Translate English with "every", "some", "no" into symbols, avoiding the $\forall\land$ and $\exists\to$ traps

**Beats**

1. **scene `predicates` — Sentences with holes**
   Stage: $P(x)\colon\ x > 3$ with the $x$ boxed; a `numberLine` from $-2$ to $8$; dots at $5$ (green, P(5)
   true) and $1$ (red, false); the region $x > 3$ shades green.
   Steps: (1) A predicate is a sentence with variables; plugging in values makes it a proposition. (2) The
   domain says which values are allowed; we always state it. (3) Our convention: $\mathbb{N} = \{1, 2, 3,
   \dots\}$; $0$ is not a natural number in this course.

2. **scene `universal` — For all**
   Stage: $\forall n \in \{1,2,3,4\},\ n^2 \le 16$ expands into $P(1) \land P(2) \land P(3) \land P(4)$, each
   conjunct turning green. Then $\forall x \in \mathbb{R},\ x^2 \ge 0$.
   Steps: (1) Over a finite domain, "for all" is a big "and". (2) Over an infinite domain we can't check
   every case, so we need a proof for an arbitrary element. (3) One false conjunct makes the whole thing false.

3. **scene `existential` — There exists**
   Stage: $\exists n \in \mathbb{N},\ n^2 = n + 6$ expands to $P(1) \lor P(2) \lor \cdots$; $P(3)$ lights green
   ($9 = 9$), labelled "witness".
   Steps: (1) "There exists" is a big "or". (2) To prove it, produce a witness and check it. (3) Here $n = 3$
   works, and that's a complete proof.

4. **try `try-evaluate` — True over the integers?**
   Prompt: The domain is $\mathbb{Z}$. Which statements are true? Select all.
   Answer: multi `['a']`. Choices: (a) $\forall x,\ x^2 \ge x$ ✓ (for $x \le 0$, $x^2 \ge 0 \ge x$; for $x \ge
   1$, $x^2 = x \cdot x \ge x$); (b) $\exists x,\ x^2 = 2$ ($\sqrt 2$ is not an integer); (c) $\exists x,\ x^2 <
   x$ (that needs $0 < x < 1$, and no integer is there); (d) $\forall x,\ x^2 > 0$ ($x = 0$ fails).
   Hint: Try $x = 0$, a negative, and a positive. Solution: as in the whys. Over $\mathbb{R}$ the answers
   change: (a) fails at $x = \tfrac12$ and (c) becomes true; the domain is part of the statement.

5. **scene `domain-matters` — The domain is part of the statement**
   Stage: $\exists x,\ x^2 = 2$ shown twice, domain $\mathbb{Q}$ (red F) and domain $\mathbb{R}$ (green T,
   with $\sqrt 2$ marked on the number line).
   Steps: (1) The same formula can be true over one domain and false over another. (2) Write the domain into
   the quantifier: $\exists x \in \mathbb{R}$. (3) Over the empty domain every $\forall$ is (vacuously) true and
   every $\exists$ false.

6. **scene `negating` — Negating quantifiers**
   Stage: $\neg \forall x,\ P(x)$; the $\neg$ slides right past the quantifier, which morphs $\forall \to
   \exists$, giving $\exists x,\ \neg P(x)$; likewise $\neg \exists x,\ P(x) \equiv \forall x,\ \neg P(x)$.
   Example: "Not every prime is odd" ≡ "Some prime is even" (2, in red as the counterexample).
   Steps: (1) "Not all" means "at least one fails". (2) "None" means "all fail". (3) Mechanically: push the
   $\neg$ inward and flip each quantifier it passes.

7. **blanks `fill-negation` — Negate it**
   Line: $\neg\big(\forall x \in \mathbb{R},\ (x > 0 \to x^2 > x)\big) \equiv$ [$\exists$] $x \in \mathbb{R},\
   x > 0$ [$\land$] $x^2$ [$\le$] $x$.
   Chips: $\forall$ / $\exists$; $\land$ / $\lor$ / $\to$; $\le$ / $<$ / $\ge$.
   Solution: flip the quantifier; $\neg(p \to q) \equiv p \land \neg q$; $\neg(x^2 > x)$ is $x^2 \le x$. The
   negation is true: $x = \tfrac12$.

8. **scene `counterexample` — One counterexample is enough**
   Stage: claim $\forall n \in \mathbb{N},\ n^2 + n + 41$ is prime; a table $n = 1..5$ (43, 47, 53, 61, 71)
   each green; then a jump to $n = 40$: $1681 = 41^2$ in red.
   Steps: (1) Forty examples in a row, and the statement is still false. (2) To disprove a "for all", one
   counterexample suffices, verified explicitly. (3) To prove one, examples are never enough.

9. **scene `translation` — From English to symbols**
   Stage: "Every student in this class has a laptop" → $\forall x\,(S(x) \to L(x))$; "Some student has a
   laptop" → $\exists x\,(S(x) \land L(x))$; then the two traps in red: $\forall x\,(S(x) \land L(x))$ ("every
   thing is a student with a laptop") and $\exists x\,(S(x) \to L(x))$ (true as soon as one non-student
   exists). Restricted forms $\forall x \in S$ and $\exists x \in S$ appear as shorthand.
   Steps: (1) "All" pairs with "→". (2) "Some" pairs with "∧". (3) Restricted quantifiers hide the pairing.

10. **try `try-translate` — Translate**
    Prompt: Which symbolizes "Some real number is larger than its square"?
    Answer: choice `a`. Choices: (a) $\exists x \in \mathbb{R},\ x > x^2$ ✓; (b) $\forall x \in \mathbb{R},\ x >
    x^2$ ("some" is not "all"); (c) $\exists x \in \mathbb{R},\ x^2 > x$ (reversed inequality); (d) $\exists
    x\,(x \in \mathbb{R} \to x > x^2)$ (true as soon as anything is not a real number: the $\exists\to$ trap).
    Hint: "Some" pairs with "and", or with a restricted quantifier. Solution: (a); it is true, e.g. $x = \tfrac12$.

11. **scene `restricted-negation` — Negating restricted quantifiers**
    Stage: `proof` lines: $\neg \forall x\,(S(x) \to L(x)) \equiv \exists x\,\neg(S(x) \to L(x)) \equiv \exists
    x\,(S(x) \land \neg L(x))$, then the shorthand $\neg(\forall x \in S,\ L(x)) \equiv \exists x \in S,\ \neg
    L(x)$ with the domain "$\in S$" highlighted yellow and unchanged.
    Steps: (1) The negation of "every student has a laptop" is "some *student* lacks one", not "something
    lacks one". (2) The domain stays; only the quantifier flips and the predicate is negated.

12. **workout `wo-disprove` — Work it out**
    Prompt: Disprove: "For every integer $n$, if $6 \mid n$ then $4 \mid n$." Write the negation first, then
    prove the negation.
    Answer: proof. Hints: (1) The negation is an existential statement; what does it ask for? (2) Try the
    smallest positive multiple of 6.
    Solution: The negation is $\exists n \in \mathbb{Z},\ 6 \mid n \land 4 \nmid n$. **Proof.** Take $n = 6$.
    Then $6 = 6 \cdot 1$, so $6 \mid 6$. But $4 \nmid 6$, since $6/4 = 3/2$ is not an integer. So $n = 6$ is a
    counterexample and the statement is false. ∎
    Rubric: states the negation correctly ($\exists$, with "and", conclusion negated); names a specific
    integer; verifies both $6 \mid n$ and $4 \nmid n$ from the definition; does not offer examples where the
    statement holds as evidence.

13. **explain `cp-quantifier-negation` — Explain it back**
    Prompt: Why is the negation of "for all $x$, $P(x)$" the statement "there exists $x$ with not $P(x)$"? What
    does that tell you about proving and disproving each kind of statement?
    Points: "for all" is a conjunction over the domain, so it fails exactly when some instance fails; to
    prove $\exists$ give a witness and verify it; to disprove $\forall$ give one counterexample; examples
    never prove $\forall$ over an infinite domain, which needs an argument for an arbitrary element.

14. **scene `recap` — Recap**
    Steps: (1) Predicates, domains, $\forall$ and $\exists$. (2) Witnesses and counterexamples; push $\neg$
    inward and flip. (3) Next: statements with several quantifiers, where order changes the meaning.

---

## 4 · `nested-quantifiers` — Nested quantifiers

*Irani · Logic · 15 min*

**Goals**
- Read nested quantifiers left to right and see why $\forall\exists$ and $\exists\forall$ differ
- Negate multiply-quantified statements mechanically
- Prove a $\forall x\,\exists y$ statement by choosing $y$ as a function of an arbitrary $x$
- Read the $\varepsilon$–$N$ definition of a limit and the definition of an unbounded sequence

**Beats**

1. **scene `two-variables` — Predicates with two variables**
   Stage: a 4×4 grid (Rects; rows $x \in \{a,b,c,d\}$, columns $y \in \{1,2,3,4\}$) with check marks where
   $L(x, y)$ holds: $a$: {2}, $b$: {1, 3}, $c$: {4}, $d$: {2, 4}.
   Steps: (1) $L(x, y)$ now needs two inputs. (2) $\forall x\,\exists y\,L(x,y)$: every row has a check — rows
   flash green one at a time. (3) $\exists y\,\forall x\,L(x,y)$: some column is full — each column is
   scanned and fails (red).

2. **scene `order-matters` — Order matters**
   Stage: same grid; checks are added to make column 2 full; now $\exists y\,\forall x$ is true (the column
   glows green), and the earlier row-scan still passes. A Tex line $\exists y\,\forall x\,L \implies \forall
   x\,\exists y\,L$ appears, with the converse struck in red.
   Steps: (1) $\exists y\,\forall x$ asks for one $y$ that works for everyone. (2) $\forall x\,\exists y$ lets
   $y$ depend on $x$. (3) The first implies the second, never the other way in general.

3. **scene `game` — Quantifiers as a game**
   Stage: $\forall x \in \mathbb{Z}\ \exists y \in \mathbb{Z},\ x + y = 0$. A `numberLine` $[-6, 6]$: the
   opponent drops a red point at $x = 4$; you answer with a green point at $y = -4$ (reflection arc). Then
   $\exists y\,\forall x$: you commit to $y = -4$ first, the opponent picks $x = 1$, and $1 + (-4) \ne 0$ (red).
   Steps: (1) Read left to right: "for all" is your opponent's move, "there exists" is yours. (2) You win
   $\forall\exists$ because you move second and can use $x$. (3) In $\exists\forall$ you must commit first.

4. **try `try-order` — True over the reals?**
   Prompt: The domain is $\mathbb{R}$. Which are true? Select all.
   Answer: multi `['a','d']`. Choices: (a) $\forall x\,\exists y,\ y > x$ ✓ ($y = x + 1$); (b) $\exists y\,\forall
   x,\ y > x$ (no largest real: $x = y$ beats it); (c) $\forall x\,\exists y,\ xy = 1$ ($x = 0$ has no
   partner); (d) $\exists x\,\forall y,\ xy = 0$ ✓ ($x = 0$).
   Hint: Play the game: who moves first? Solution: as in the whys.

5. **scene `negate-nested` — Negating nested quantifiers**
   Stage: $\neg\,\forall x\,\exists y\,\forall z\,P(x,y,z)$; the $\neg$ steps right one quantifier at a time,
   each flipping ($\forall \to \exists$, $\exists \to \forall$), ending as $\exists x\,\forall y\,\exists
   z\,\neg P(x,y,z)$.
   Steps: (1) Same rule as before, applied repeatedly. (2) Domains ride along unchanged. (3) Finally negate
   the inner statement carefully: $<$ becomes $\ge$, "and" becomes "or", "→" becomes "and not".

6. **blanks `fill-nested-neg` — Negate it**
   Line: $\neg\big(\forall \varepsilon > 0\ \exists \delta > 0\ \forall x,\ (\lvert x \rvert < \delta \to
   \lvert f(x) \rvert < \varepsilon)\big) \equiv$ [$\exists$] $\varepsilon > 0$ [$\forall$] $\delta > 0$
   [$\exists$] $x,\ \lvert x \rvert < \delta$ [$\land$] $\lvert f(x) \rvert$ [$\ge$] $\varepsilon$.
   Chips: $\forall$/$\exists$ for the quantifier blanks; $\land$/$\lor$/$\to$; $\ge$/$>$/$<$.
   Solution: flip all three quantifiers (the restrictions $\varepsilon > 0$, $\delta > 0$ stay); $\neg(p \to
   q) \equiv p \land \neg q$; $\neg(\lvert f(x) \rvert < \varepsilon)$ is $\lvert f(x) \rvert \ge \varepsilon$.

7. **scene `prove-forall-exists` — Proving "for all, there exists"**
   Stage: Theorem $\forall x \in \mathbb{R}\ \exists y \in \mathbb{R},\ 2y + 3 = x$. Scratch pane (left): solve
   $2y + 3 = x$ for $y$: $y = (x - 3)/2$. Then `proof` on the right: "Let $x \in \mathbb{R}$." (blue) / "Let $y =
   (x - 3)/2$." / "Then $y \in \mathbb{R}$ and $2y + 3 = (x - 3) + 3 = x$." (green) ∎. An arrow from the
   scratch answer to the "Let $y$" line.
   Steps: (1) Scratch work finds $y$ by solving; it is not the proof. (2) The proof fixes an arbitrary $x$,
   names $y$ in terms of $x$, and checks. (3) The check is what makes it a proof; the solving is how we found it.

8. **scene `arbitrary` — Arbitrary versus specific**
   Stage: three attempted proofs of $\forall x \in \mathbb{R},\ x^2 - 2x + 1 \ge 0$: "Take $x = 3$: $4 \ge 0$."
   (red, an example), "For $x = 0, 1, 2$ it holds." (red), and "Let $x \in \mathbb{R}$. Then $x^2 - 2x + 1 = (x -
   1)^2 \ge 0$." (green).
   Steps: (1) "Let $x$ be arbitrary" means you may not choose $x$; the argument must work for every $x$ at
   once. (2) Checking cases is evidence, not proof. (3) The existential variable is the one you choose.

9. **try `try-which-proof` — Which proof is valid?**
   Prompt: Claim: $\exists M \in \mathbb{R}\ \forall x \in \mathbb{R},\ \sin x \le M$. Which is a valid proof?
   Answer: choice `a`. Choices: (a) "Let $M = 1$. Let $x \in \mathbb{R}$. Then $\sin x \le 1 = M$." ✓;
   (b) "Let $x \in \mathbb{R}$ and let $M = \sin x$. Then $\sin x \le M$." ($M$ depends on $x$: this proves
   $\forall x\,\exists M$); (c) "Take $x = 0$: $\sin 0 = 0 \le 1$." (checks one $x$); (d) "Since $\sin$ is
   bounded, such an $M$ exists." (restates the claim).
   Hint: Which variable must be chosen first? Solution: In $\exists M\,\forall x$, $M$ is fixed before $x$
   appears, so it cannot mention $x$.

10. **scene `limit-preview` — Reading an $\varepsilon$–$N$ definition**
    Stage: $\forall \varepsilon > 0\ \exists N \in \mathbb{N}\ \forall n \ge N,\ \lvert a_n - L \rvert <
    \varepsilon$, with $\varepsilon$ red (opponent), $N$ green (you). `numberLine` $[-0.2, 1.1]$ with $a_n =
    1/n$ appearing; an epsilon band around $L = 0$ of half-width $0.15$; points from $n = 7$ on fall inside;
    an "N = 7" marker. Then the band shrinks to $0.05$ and $N$ moves to $21$.
    Steps: (1) The opponent names a tolerance $\varepsilon$. (2) You answer with a cutoff $N$, which may
    depend on $\varepsilon$. (3) Every term from $N$ on must be inside the band. We'll prove such statements in
    the last lecture.

11. **scene `unbounded` — What "unbounded" means**
    Stage: bounded: $\exists M\ \forall n,\ \lvert a_n \rvert \le M$; its negation slides into $\forall M\
    \exists n,\ \lvert a_n \rvert > M$. `numberLine` with $a_n = n$: the opponent places $M = 4.5$; you answer
    $n = 5$.
    Steps: (1) Negate mechanically. (2) Unbounded means: whatever bound you propose, some term beats it.
    (3) For $a_n = n$, given $M$ choose any integer $n > M$.

12. **workout `wo-nested` — Work it out**
    Prompt: (a) Prove $\forall x \in \mathbb{Z}\ \exists y \in \mathbb{Z},\ x + y$ is odd. (b) Prove that $\exists
    y \in \mathbb{Z}\ \forall x \in \mathbb{Z},\ x + y$ is odd is false.
    Answer: proof. Hints: (1) For (a), let $y$ depend on $x$. (2) For (b), write the negation and prove it.
    Solution: **Proof.** (a) Let $x \in \mathbb{Z}$ and let $y = x + 1 \in \mathbb{Z}$. Then $x + y = 2x + 1$,
    which is odd because $x \in \mathbb{Z}$. (b) The negation is $\forall y \in \mathbb{Z}\ \exists x \in
    \mathbb{Z},\ x + y$ is even. Let $y \in \mathbb{Z}$ and take $x = y$. Then $x + y = 2y$ is even, so not odd.
    Hence the statement in (b) is false. ∎
    Rubric: (a) fixes an arbitrary $x$ and gives $y$ explicitly as an integer; verifies oddness by the
    definition $2k + 1$ with $k \in \mathbb{Z}$; (b) negates correctly (both quantifiers flipped, "odd"
    negated to "even"); proves the negation for arbitrary $y$; uses that no integer is both even and odd
    (justified later by the division algorithm) or argues directly.

13. **explain `cp-order` — Explain it back**
    Prompt: Explain why $\exists y\,\forall x\,P(x,y)$ implies $\forall x\,\exists y\,P(x,y)$ but not
    conversely.
    Points: in $\exists y\,\forall x$ one $y$ works for every $x$; in $\forall x\,\exists y$ the $y$ may change
    with $x$; given the single $y$, it serves as the witness for each $x$, so the implication holds; the
    converse fails, e.g. $x + y = 0$ over $\mathbb{Z}$.

14. **scene `recap` — Recap**
    Steps: (1) Read left to right; order matters. (2) Negate by flipping each quantifier. (3) Prove
    $\forall\exists$ with "Let $x$ … take $y = \dots$ … check". Next: how a proof's steps are allowed to
    follow from each other.

---

## 5 · `inference` — Valid arguments and rules of inference

*Irani · Logic · 13 min*

**Goals**
- Define a valid argument and test validity with a truth table
- Use modus ponens, modus tollens, hypothetical and disjunctive syllogism, addition, simplification
- Recognize the fallacies of affirming the consequent and denying the antecedent
- Apply universal/existential instantiation and generalization correctly

**Beats**

1. **scene `argument-form` — What an argument is**
   Stage: premises "If it rained, the grass is wet." and "It rained." above a rule line; "∴ The grass is wet."
   below; then the same form in symbols $p \to q,\ p\ \therefore q$.
   Steps: (1) An argument is premises and a conclusion. (2) It is valid when the conclusion must be true
   whenever all premises are. (3) Validity depends on the form, not on the topic.

2. **scene `validity-table` — Checking validity with a table**
   Stage: `truthTable` with $p, q, p \to q$ and the conclusion $q$; rows where both premises are true (only
   TT) get a blue band; its conclusion cell turns green.
   Steps: (1) Look only at rows where every premise is true. (2) If the conclusion is true in all of them, the
   argument is valid. (3) This one is modus ponens.

3. **scene `rules` — The rules of inference**
   Stage: a card grid, each rule in fraction form: modus ponens ($p \to q,\ p \,/\, q$), modus tollens ($p \to
   q,\ \neg q \,/\, \neg p$), hypothetical syllogism ($p \to q,\ q \to r \,/\, p \to r$), disjunctive
   syllogism ($p \lor q,\ \neg p \,/\, q$), addition ($p \,/\, p \lor q$), simplification ($p \land q \,/\, p$),
   conjunction ($p,\ q \,/\, p \land q$).
   Steps: (1) Each rule is a small valid argument, checked once by a table. (2) Longer arguments chain them.
   (3) Modus tollens is the contrapositive in action.

4. **try `try-name-rule` — Name the rule**
   Prompt: "If $4 \mid n$, then $n$ is even. $n$ is odd. Therefore $4 \nmid n$." Which rule is this?
   Answer: choice `b`. Choices: (a) modus ponens (that would conclude $q$ from $p$); (b) modus tollens ✓
   (from $p \to q$ and $\neg q$, conclude $\neg p$); (c) hypothetical syllogism (that chains two
   conditionals); (d) affirming the consequent (that's the fallacy from $q$ to $p$).
   Hint: Which part of the conditional is negated in the second premise? Solution: "odd" is "not even", the
   negated conclusion, so we conclude the negated hypothesis.

5. **scene `fallacies` — Two famous fallacies**
   Stage: affirming the consequent $p \to q,\ q\ \therefore p$: in its table the row $p = \mathrm{F}, q =
   \mathrm{T}$ has both premises true and the conclusion false (red). Example: "If $4 \mid n$ then $n$ is
   even; 6 is even; so $4 \mid 6$." Then denying the antecedent $p \to q,\ \neg p\ \therefore \neg q$ with the
   same bad row.
   Steps: (1) One row with true premises and a false conclusion makes an argument invalid. (2) Both fallacies
   confuse a conditional with its converse or inverse. (3) They hide in proofs as "and so, since the
   conclusion holds, the hypothesis does".

6. **try `try-valid` — Valid or not?**
   Prompt: Which argument forms are valid? Select all.
   Answer: multi `['a','c']`. Choices: (a) $p \lor q,\ \neg p\ \therefore q$ ✓ (disjunctive syllogism);
   (b) $p \to q,\ \neg p\ \therefore \neg q$ (denying the antecedent; row F, T); (c) $p \to q,\ q \to r\
   \therefore p \to r$ ✓ (hypothetical syllogism); (d) $p \to q,\ q\ \therefore p$ (affirming the consequent).
   Hint: Look for a row with all premises true and conclusion false. Solution: as in the whys.

7. **scene `derivation` — A derivation, step by step**
   Stage: `proof` with premises 1. $p \lor q$, 2. $\neg q \lor r$, 3. $\neg r$ (blue), then 4. $\neg q$
   (disjunctive syllogism, 2, 3), 5. $p$ (disjunctive syllogism, 1, 4; green); arrows from each reason to the
   lines it cites.
   Steps: (1) Each new line follows from earlier lines by a named rule. (2) Cite the lines you use. (3) This is
   exactly the discipline of a written proof, just in symbols.

8. **scene `quantified-rules` — Rules for quantifiers**
   Stage: four cards: universal instantiation ("every prime greater than 2 is odd; 7 is a prime greater than
   2; ∴ 7 is odd"), universal generalization ("$P(c)$ for an *arbitrary* $c$ ⇒ $\forall x\,P(x)$"),
   existential instantiation ("$\exists x\,P(x)$ ⇒ name one, $P(c)$ with a **new** $c$"), existential
   generalization ("$P(7)$ ⇒ $\exists x\,P(x)$"). The word "new" glows yellow; a red example reuses a name.
   Steps: (1) Instantiation uses a general fact on a particular object. (2) Generalization needs the object to
   be arbitrary. (3) A witness gets a fresh name; reusing a name is the "same $k$" bug we'll meet in proofs.

9. **blanks `fill-derivation` — Complete the derivation**
   Premises 1. $p \to q$, 2. $q \to r$, 3. $p$.
   - $4.\ q$ — rule [modus ponens] (lines 1, 3). Chips: `\text{modus ponens}`, `\text{modus tollens}`,
     `\text{addition}`.
   - $5.$ [$r$] — rule [modus ponens] (lines 2, 4). Statement chips: $r$, $\neg r$, $q \land r$, $p$; rule chips
     as above.
   Solution: two applications of modus ponens (or one hypothetical syllogism $p \to r$ then modus ponens).

10. **scene `proofs-are-arguments` — Proofs are arguments**
    Stage: the 5-line symbolic derivation shrinks to the left; on the right the same reasoning appears as a
    prose sentence: "Since $p$ and $p \to q$, we have $q$; since $q \to r$, we get $r$."
    Steps: (1) Written proofs are valid arguments whose premises are hypotheses, definitions and known
    theorems. (2) We write them in sentences, but every "so" must be a valid step. (3) Next unit: real proofs.

11. **workout `wo-derive` — Work it out**
    Prompt: From the premises (1) $p \to (q \land r)$, (2) $r \to s$, (3) $\neg s$, derive $\neg p$. Number your
    lines and name the rule for each.
    Answer: proof. Hints: (1) What do (2) and (3) give together? (2) How do you get $\neg(q \land r)$ from $\neg
    r$?
    Solution: 4. $\neg r$ (modus tollens, 2, 3). 5. $\neg q \lor \neg r$ (addition, 4, with commutativity).
    6. $\neg(q \land r)$ (De Morgan, 5). 7. $\neg p$ (modus tollens, 1, 6). ∎
    Rubric: every line cites a rule and the lines used; modus tollens applied in the right direction; the step
    from $\neg r$ to $\neg(q \land r)$ is justified (addition + De Morgan, or a stated equivalence); no
    fallacious step (no affirming the consequent / denying the antecedent).

12. **explain `cp-valid` — Explain it back**
    Prompt: What does it mean for an argument to be valid, and why is "affirming the consequent" invalid?
    Points: valid means no assignment makes all premises true and the conclusion false; validity is about
    form, not about whether the premises are actually true; affirming the consequent fails at $p$ false, $q$
    true; a valid argument with a false premise can have a false conclusion.

13. **scene `recap` — Recap**
    Steps: (1) Valid = conclusion forced by premises. (2) The rules, the fallacies, fresh names for witnesses.
    (3) Next: definitions and our first real proofs.

---

## 6 · `direct-proof` — Definitions and direct proof

*Irani · Proofs · 16 min*

**Goals**
- State the definitions of even, odd, divides and rational exactly, and use them to unpack and repack
- Structure a direct proof of $\forall x\,(P(x) \to Q(x))$
- Separate scratch work (finding the proof) from the written proof
- Avoid the classic errors: reusing a witness name, proof by example, arguing from the conclusion

**Beats**

1. **scene `definitions` — The definitions we'll use**
   Stage: four purple definition cards fade in: $n \in \mathbb{Z}$ is **even** iff $n = 2k$ for some $k \in
   \mathbb{Z}$; **odd** iff $n = 2k + 1$ for some $k \in \mathbb{Z}$; for $a, b \in \mathbb{Z}$, $a \mid b$
   iff $b = ak$ for some $k \in \mathbb{Z}$; $x \in \mathbb{R}$ is **rational** iff $x = p/q$ for some $p, q
   \in \mathbb{Z}$ with $q \ne 0$.
   Steps: (1) A proof can only use what the words mean, so we fix the meanings. (2) Every definition here is
   an existential statement: "there is an integer $k$". (3) Notice $a \mid b$ is a statement, while $a/b$ is a
   number; don't mix them.

2. **scene `unpacking` — Unpack and repack**
   Stage: "14 is even" → $14 = 2 \cdot 7$ with $k = 7$ boxed; "$-7$ is odd" → $-7 = 2(-4) + 1$; "$3 \mid 12$"
   → $12 = 3 \cdot 4$. Arrows labelled "unpack" (purple) and "repack" (green).
   Steps: (1) To use a hypothesis, unpack it into an equation with a named witness. (2) To reach a
   conclusion, repack: exhibit the witness. (3) The witness must be an integer, and you must say why it is.

3. **scene `structure` — The shape of a direct proof**
   Stage: a `proof` skeleton: "Theorem. For all $n \in \mathbb{Z}$, if $P(n)$ then $Q(n)$." / "**Proof.**
   Let $n \in \mathbb{Z}$ and suppose $P(n)$." (blue) / "⋮" / "Therefore $Q(n)$." (green) / "∎".
   Steps: (1) First line: introduce the arbitrary object and assume the hypothesis. (2) Last line: the
   conclusion in the theorem's words. (3) The middle is a chain of justified steps from blue to green.

4. **try `try-odd-def` — From the definition**
   Prompt: Which line shows, directly from the definition, that $2023$ is odd?
   Answer: choice `a`. Choices: (a) $2023 = 2 \cdot 1011 + 1$, and $1011 \in \mathbb{Z}$ ✓; (b) $2023 = 2
   \cdot 1011.5$ ($k$ must be an integer, and this is the form for even); (c) "$2023$ is not divisible by 2"
   (true, but that's a different statement; equating it with "odd" needs the division algorithm);
   (d) $2023 = 2 \cdot 1012 - 1$ (true, but not yet in the form $2k + 1$; rewrite it as $2 \cdot 1011 + 1$).
   Hint: The definition says $n = 2k + 1$ with $k \in \mathbb{Z}$. Solution: (a) names the witness $k = 1011$.

5. **scene `scratch` — Finding the proof**
   Stage: Theorem "If $n$ is odd, then $n^2$ is odd." Scratch pane (muted): top, from the hypothesis: $n =
   2k + 1$; bottom, from the goal: "want $n^2 = 2(\,?\,) + 1$"; middle: $n^2 = 4k^2 + 4k + 1 = 2(2k^2 + 2k) +
   1$, the "?" filling in with $2k^2 + 2k$ (yellow).
   Steps: (1) Work forwards from what you know. (2) Work backwards from what you want: what form must $n^2$
   take? (3) Meet in the middle: the question mark is $2k^2 + 2k$.

6. **scene `write-proof` — Writing it up**
   Stage: `proof` lines with reasons: "Let $n$ be an odd integer." (hypothesis) / "Then $n = 2k + 1$ for some
   $k \in \mathbb{Z}$." (def. of odd) / "So $n^2 = 4k^2 + 4k + 1 = 2(2k^2 + 2k) + 1$." (algebra) / "Let $m =
   2k^2 + 2k$; then $m \in \mathbb{Z}$." (closure of $\mathbb{Z}$ under $+$, $\times$) / "Thus $n^2 = 2m + 1$
   is odd." (def. of odd) / ∎.
   Steps: (1) Introduce, unpack. (2) Compute. (3) Name the new witness and say why it's an integer. (4) Repack
   with the definition. Every line says why it's true.

7. **blanks `fill-sum-odd` — Sum of two odds**
   Proof that the sum of two odd integers is even:
   - "Let $m, n$ be odd. Then $m = 2a + 1$ and $n = 2$[$b$]$+ 1$ for some integers $a, b$." Chips: $a$, $b$, $k$.
   - "So $m + n = 2a + 2b + 2 = 2($[$a + b + 1$]$)$." Chips: $a + b + 1$, $a + b$, $2ab + 1$.
   - "Since $a + b + 1 \in$ [$\mathbb{Z}$], $m + n$ is even." Chips: $\mathbb{Z}$, $\mathbb{Q}$, $\mathbb{N}$.
   Solution: each odd number gets its own witness; $a + b + 1$ is an integer because integers are closed under
   addition (it need not be positive, so $\mathbb{N}$ is wrong).

8. **scene `same-k-error` — The same-$k$ mistake**
   Stage: the wrong proof "Let $m = 2k + 1$ and $n = 2k + 1$. Then $m + n = 4k + 2 = 2(2k + 1)$." with both
   $k$'s circled red and a note "this forces $m = n$". Below, "Proof: $3 + 5 = 8$ is even." also struck.
   Steps: (1) Using one letter for two witnesses silently assumes $m = n$. (2) Checking an example proves
   nothing about all integers. (3) Both get zero credit in this course.

9. **scene `divides-transitive` — Divisibility is transitive**
   Stage: Theorem: for $a, b, c \in \mathbb{Z}$, if $a \mid b$ and $b \mid c$ then $a \mid c$. Scratch: $b =
   ak$, $c = b\ell$, so $c = a(k\ell)$. Then `proof`: "Suppose $a \mid b$ and $b \mid c$." / "Then $b = ak$ and
   $c = b\ell$ for some $k, \ell \in \mathbb{Z}$." / "So $c = (ak)\ell = a(k\ell)$." / "Since $k\ell \in
   \mathbb{Z}$, $a \mid c$." ∎
   Steps: (1) Two hypotheses, two different witnesses. (2) Substitute. (3) Repack with the witness $k\ell$.

10. **try `try-counterexample-divides` — Find a counterexample**
    Prompt: "If $a \mid bc$, then $a \mid b$ or $a \mid c$." Which triple $(a, b, c)$ is a counterexample?
    Answer: choice `a`. Choices: (a) $(6, 2, 3)$ ✓ ($6 \mid 6$ but $6 \nmid 2$ and $6 \nmid 3$); (b) $(2, 4,
    3)$ ($2 \mid 4$, so the conclusion holds); (c) $(3, 2, 5)$ ($3 \nmid 10$, so the hypothesis fails);
    (d) $(5, 10, 1)$ ($5 \mid 10$).
    Hint: A counterexample needs a true hypothesis and a false conclusion. Solution: (a). (When $a$ is prime the
    statement is true: Euclid's lemma, lecture 18.)

11. **scene `rational-sum` — Sums of rationals**
    Stage: Theorem: if $x, y \in \mathbb{Q}$ then $x + y \in \mathbb{Q}$. `proof`: $x = a/b$, $y = c/d$ with
    $b, d \ne 0$ / $x + y = (ad + bc)/(bd)$ / $ad + bc,\ bd \in \mathbb{Z}$ / "$bd \ne 0$ since $b \ne 0$ and $d
    \ne 0$" (yellow) / so $x + y \in \mathbb{Q}$ ∎.
    Steps: (1) Unpack both with separate letters. (2) Compute. (3) The easily forgotten step: the denominator
    must be nonzero, and we say why.

12. **scene `errors` — Don't argue from the conclusion**
    Stage: Claim: for $a, b \in \mathbb{R}$, $a^2 + b^2 \ge 2ab$. Left (red, struck): "$a^2 + b^2 \ge 2ab \Rightarrow
    a^2 - 2ab + b^2 \ge 0 \Rightarrow (a - b)^2 \ge 0$, true." Right (green): "$(a - b)^2 \ge 0$, so $a^2 - 2ab +
    b^2 \ge 0$, so $a^2 + b^2 \ge 2ab$." ∎. A further list fades in: undefined variables, "clearly", unjustified
    integer claims.
    Steps: (1) Starting from the claim and reaching something true proves the converse, not the claim.
    (2) Backwards reasoning belongs in scratch work. (3) Rewrite it forwards; each step here is reversible, but
    the written proof must show the right direction.

13. **workout `wo-direct` — Work it out**
    Prompt: Prove: for all integers $a, b, c$, if $a \mid b$ and $a \mid c$, then $a \mid (3b - 2c)$.
    Answer: proof. Hints: (1) Unpack both hypotheses with different letters. (2) Write $3b - 2c$ as $a$ times
    something.
    Solution: **Proof.** Let $a, b, c \in \mathbb{Z}$ and suppose $a \mid b$ and $a \mid c$. Then $b = ak$ and
    $c = a\ell$ for some $k, \ell \in \mathbb{Z}$. So $3b - 2c = 3ak - 2a\ell = a(3k - 2\ell)$. Since $3k - 2\ell
    \in \mathbb{Z}$, we conclude $a \mid (3b - 2c)$. ∎
    Rubric: introduces arbitrary integers and states the hypotheses; unpacks with two distinct witnesses;
    factors $3b - 2c = a(3k - 2\ell)$; justifies that $3k - 2\ell$ is an integer; concludes with the
    definition of divides.

14. **explain `cp-scratch` — Explain it back**
    Prompt: What is the difference between scratch work and the written proof? Why can't the written proof
    start from the statement you want to prove?
    Points: scratch work explores in both directions and may guess; the written proof goes from hypotheses to
    conclusion with every step justified; starting from the conclusion and deriving something true proves
    the converse; every variable is introduced with its type ("Let $n \in \mathbb{Z}$") and witnesses get
    fresh names.

15. **scene `recap` — Recap**
    Steps: (1) Definitions are existential: unpack and repack. (2) Find forwards and backwards, write forwards.
    (3) Next: what to do when a direct proof gets stuck.

---

## 7 · `contrapositive-contradiction` — Contrapositive and contradiction

*Irani · Proofs · 16 min*

**Goals**
- Prove a statement by proving its contrapositive, with the correct first line
- Structure a proof by contradiction and negate the assumption correctly
- Prove that $\sqrt 2$ is irrational and that there are infinitely many primes
- Choose between direct proof, contrapositive and contradiction

**Beats**

1. **scene `stuck-direct` — When direct proof gets stuck**
   Stage: Theorem "For $n \in \mathbb{Z}$, if $n^2$ is even then $n$ is even." Direct attempt: $n^2 = 2k$, so
   $n = \sqrt{2k}$ … the line turns red with a "?" (is $\sqrt{2k}$ even? is it even an integer?).
   Steps: (1) Unpacking $n^2$ tells us nothing usable about $n$. (2) The hypothesis is about $n^2$ but the
   conclusion is about $n$, and square roots go the wrong way. (3) Let's turn the statement around.

2. **scene `contrapositive` — Prove the contrapositive**
   Stage: `chain`: "$n^2$ even $\implies$ $n$ even" $\equiv$ "$n$ odd $\implies$ $n^2$ odd" (the lecture 2
   equivalence, yellow); then `proof`: "We prove the contrapositive. Suppose $n$ is odd." (blue) / "Then $n =
   2k + 1$ …" / "so $n^2 = 2(2k^2 + 2k) + 1$ is odd." (green) ∎, with "proved in lecture 6" tag.
   Steps: (1) The contrapositive is equivalent, so proving it proves the theorem. (2) Now the hypothesis is
   about $n$, which we can unpack. (3) Say "we prove the contrapositive" so the reader knows what you assume.

3. **scene `contra-reals` — A contrapositive with "or"**
   Stage: Theorem: for $x, y \in \mathbb{R}$, if $x + y \ge 2$ then $x \ge 1$ or $y \ge 1$. The contrapositive
   builds with De Morgan: "if $x < 1$ and $y < 1$, then $x + y < 2$"; one-line proof: add the inequalities.
   Steps: (1) Negating "$x \ge 1$ or $y \ge 1$" gives "$x < 1$ and $y < 1$". (2) That's two facts to use instead
   of one awkward "or". (3) Adding gives $x + y < 2$. ∎

4. **try `try-contrapositive-start` — First line**
   Prompt: To prove "for every integer $n$, if $3n + 2$ is odd then $n$ is odd" by contrapositive, what is the
   first line after "Let $n \in \mathbb{Z}$"?
   Answer: choice `a`. Choices: (a) "Suppose $n$ is even." ✓; (b) "Suppose $3n + 2$ is even." (that assumes the
   negated hypothesis, which leads nowhere useful); (c) "Suppose $n$ is odd." (that's the conclusion);
   (d) "Suppose $3n + 2$ is odd and $n$ is even." (that's a proof by contradiction, a different method).
   Hint: The contrapositive of $p \to q$ is $\neg q \to \neg p$. Solution: assume $\neg q$: $n$ even, $n = 2k$;
   then $3n + 2 = 2(3k + 1)$ is even.

5. **scene `contradiction-idea` — Proof by contradiction**
   Stage: the template: "Suppose, for contradiction, that $\neg P$." (blue) / "⋮" / "Then $r$ and $\neg r$."
   (red) / "So $P$." (green). Beside it a two-row table: $\neg P \to \mathrm{F}$ is true only when $P$ is true.
   Steps: (1) Assume the opposite of what you want. (2) Derive something impossible: a statement and its
   negation. (3) Since a true assumption can't lead to a falsehood, the assumption was false.

6. **scene `sqrt2-plan` — Planning √2**
   Stage: Claim: $\sqrt 2$ is irrational. Scratch pane: "irrational" = "not rational", a negative; so assume
   $\sqrt 2 = a/b$. Purple card: every rational can be written in lowest terms ($a, b$ with no common factor
   greater than 1; a fact we accept now, provable from the well-ordering principle).
   Steps: (1) Negative conclusions ("not rational", "no largest") invite contradiction: assuming the opposite
   hands you something concrete. (2) Lowest terms is the extra handle. (3) Our target: show $a$ and $b$ are
   both even.

7. **scene `sqrt2-proof` — √2 is irrational**
   Stage: `proof` lines: "Suppose, for contradiction, $\sqrt 2 \in \mathbb{Q}$." / "Then $\sqrt 2 = a/b$, $a, b
   \in \mathbb{Z}$, $b \ne 0$, in lowest terms." / "So $2b^2 = a^2$, hence $a^2$ is even." / "So $a$ is even
   (theorem from beat 2), $a = 2c$." (yellow arrow back to beat 2's theorem) / "Then $2b^2 = 4c^2$, so $b^2 =
   2c^2$, so $b$ is even." / "Both even: contradicts lowest terms." (red) ∎
   Steps: (1) Assume and unpack. (2) Square and clear denominators. (3) The contrapositive theorem does the
   work twice. (4) Two evens share the factor 2: contradiction.

8. **blanks `fill-sqrt2` — Fill in the proof**
   - "From $\sqrt 2 = a/b$ we get $a^2 = $ [$2b^2$]." Chips: $2b^2$, $2b$, $b^2/2$.
   - "So $a^2$ is even, hence $a$ is [even] by [the contrapositive of 'n odd ⇒ n² odd']." Chips: even / odd;
     `\text{the contrapositive of } n \text{ odd} \Rightarrow n^2 \text{ odd}`, `\text{the definition of even}`,
     `\text{the converse of } n \text{ even} \Rightarrow n^2 \text{ even}`.
   - "Writing $a = 2c$ gives $b^2 = $ [$2c^2$]." Chips: $2c^2$, $4c^2$, $c^2$.
   Solution: the converse chip is the classic trap: "$n$ even ⇒ $n^2$ even" is true but its converse is what we
   need, and the converse is exactly what we proved by contrapositive.

9. **scene `primes-infinite` — Infinitely many primes**
   Stage: "Suppose there are finitely many primes $p_1, \dots, p_k$." / "Let $N = p_1 p_2 \cdots p_k + 1$." /
   "$N > 1$, so some prime $p$ divides $N$ (every integer $> 1$ has a prime divisor; lecture 16)." / "$p = p_i$
   for some $i$, and $p_i \mid p_1 \cdots p_k$." / "So $p_i \mid N - p_1 \cdots p_k = 1$." (red) ∎. Then:
   $2 \cdot 3 \cdot 5 \cdot 7 \cdot 11 \cdot 13 + 1 = 30031 = 59 \cdot 509$ in yellow.
   Steps: (1) Assume a complete finite list. (2) Build a number the list can't divide. (3) A prime dividing 1
   is impossible. (4) Careful: $N$ itself need not be prime; 30031 isn't.

10. **try `try-euclid-N` — Is N prime?**
    Prompt: Is $2 \cdot 3 \cdot 5 \cdot 7 \cdot 11 \cdot 13 + 1 = 30031$ prime?
    Answer: choice `b`. Choices: (a) Yes, by Euclid's proof (the proof only says $N$'s prime factors are not on
    the list); (b) No: $30031 = 59 \cdot 509$ ✓; (c) No: it's divisible by 13 (it leaves remainder 1 on division
    by each listed prime); (d) It can't be decided (it's a finite computation).
    Hint: Euclid's argument shows the prime factors of $N$ are new; it does not show $N$ is prime.
    Solution: $59 \cdot 509 = 30031$; both factors are primes not on the list, as the proof predicts.

11. **scene `which-method` — Choosing a method**
    Stage: a three-column guide: direct ("hypothesis unpacks into something you can compute with"),
    contrapositive ("the negated conclusion is easier to unpack than the hypothesis"; example $n^2$ even),
    contradiction ("the conclusion is negative: irrational, infinitely many, no largest, not equal"). A
    footnote: a "contradiction" proof that never uses its assumption is a direct proof in disguise.
    Steps: (1) Look at which side gives you something to unpack. (2) Negative conclusions suggest
    contradiction. (3) Don't wrap a direct proof in a fake contradiction; it hides the argument.

12. **scene `contradiction-pitfalls` — Assume the right thing**
    Stage: to prove $p \to q$ by contradiction, assume $\neg(p \to q) \equiv p \land \neg q$ (both blue); the
    red wrong version "assume $\neg p$" is struck. Then "the contradiction must contradict something": a list
    (a hypothesis, an earlier line, a known fact).
    Steps: (1) The negation of "if $p$ then $q$" is "$p$ and not $q$": you get to use both. (2) Announce it:
    "Suppose, for contradiction, …". (3) End by naming what was contradicted.

13. **workout `wo-contrapositive` — Work it out**
    Prompt: Prove: for every integer $n$, if $n^2 - 6n + 5$ is even, then $n$ is odd.
    Answer: proof. Hints: (1) The conclusion "odd" negates to "even", which unpacks nicely. (2) Expand $(2k)^2 -
    6(2k) + 5$ and write it as $2(\dots) + 1$.
    Solution: **Proof.** We prove the contrapositive: if $n$ is even, then $n^2 - 6n + 5$ is odd. Let $n \in
    \mathbb{Z}$ be even, so $n = 2k$ for some $k \in \mathbb{Z}$. Then $n^2 - 6n + 5 = 4k^2 - 12k + 5 = 2(2k^2 -
    6k + 2) + 1$. Since $2k^2 - 6k + 2 \in \mathbb{Z}$, $n^2 - 6n + 5$ is odd. ∎
    Rubric: announces the contrapositive and states it correctly; unpacks "even" with a witness; algebra
    correct and repacked as $2m + 1$ with $m$ shown to be an integer; concludes the contrapositive (and hence
    the theorem) explicitly. (Uses "not odd ⇒ even", justified by the division algorithm.)

14. **workout `wo-contradiction` — Work it out**
    Prompt: Prove that there is no smallest positive rational number.
    Answer: proof. Hints: (1) Assume there is one, call it $q$. (2) Find a smaller positive rational.
    Solution: **Proof.** Suppose, for contradiction, that $q$ is the smallest positive rational number. Write
    $q = a/b$ with $a, b \in \mathbb{Z}$, $b \ne 0$. Then $q/2 = a/(2b)$ with $2b \ne 0$, so $q/2 \in \mathbb{Q}$;
    and $q > 0$ gives $0 < q/2 < q$. So $q/2$ is a positive rational smaller than $q$, contradicting the
    choice of $q$. Therefore no smallest positive rational exists. ∎
    Rubric: assumes the negation precisely ("there is a smallest positive rational $q$"); shows $q/2$ is
    rational (with nonzero denominator); shows $0 < q/2 < q$; names the contradiction.

15. **explain `cp-methods` — Explain it back**
    Prompt: How do proof by contrapositive and proof by contradiction differ? For each, what exactly do you
    assume at the start, and what are you trying to reach?
    Points: contrapositive: assume $\neg q$, reach $\neg p$ (a direct proof of an equivalent statement);
    contradiction: assume $p$ and $\neg q$ (or just $\neg P$), reach any contradiction; contradiction gives
    more to work with but a less specific target; contrapositive is a special case where the contradiction is
    with $p$.

16. **scene `recap` — Recap**
    Steps: (1) Contrapositive when the negated conclusion unpacks better. (2) Contradiction for negative
    conclusions; assume $p \land \neg q$. (3) Next: cases, counterexamples, and "exactly one".

---

## 8 · `cases-counterexamples` — Cases, counterexamples, existence and uniqueness

*Irani · Proofs · Liebeck 1 · 15 min*

**Goals**
- Write a proof by cases whose cases are exhaustive
- Use "without loss of generality" only with a stated symmetry
- Prove or disprove: test small cases and give a verified counterexample
- Distinguish constructive and non-constructive existence proofs, and prove uniqueness

**Beats**

1. **scene `cases-idea` — Splitting into cases**
   Stage: Theorem "For every $n \in \mathbb{Z}$, $n^2 + n$ is even." A tree: "$n \in \mathbb{Z}$" branches to
   "$n$ even" and "$n$ odd", both arrows ending at a green "$n^2 + n$ even".
   Steps: (1) Sometimes one argument can't handle every object, but two can. (2) The cases must cover
   everything: every integer is even or odd. (3) Each branch must reach the same conclusion.

2. **scene `cases-proof` — Writing a proof by cases**
   Stage: `proof`: "Let $n \in \mathbb{Z}$. Then $n$ is even or odd." / "Case 1: $n = 2k$. Then $n^2 + n =
   4k^2 + 2k = 2(2k^2 + k)$, even." / "Case 2: $n = 2k + 1$. Then $n^2 + n = (2k + 1)(2k + 2) = 2(2k + 1)(k +
   1)$, even." / "In both cases $n^2 + n$ is even." ∎. Then a muted aside: $n^2 + n = n(n + 1)$, a product of
   consecutive integers.
   Steps: (1) State the split and why it's exhaustive. (2) Each case is a mini direct proof. (3) Conclude for
   all cases. (4) Sometimes a clever rewrite avoids cases, but cases are always honest.

3. **scene `triangle` — The triangle inequality**
   Stage: purple card $\lvert x \rvert = x$ if $x \ge 0$, $-x$ if $x < 0$. Lemma: $\lvert a \rvert \le b \iff
   -b \le a \le b$ (on a `numberLine`, the interval $[-b, b]$). Proof of $\lvert x + y \rvert \le \lvert x
   \rvert + \lvert y \rvert$: $-\lvert x \rvert \le x \le \lvert x \rvert$ and $-\lvert y \rvert \le y \le
   \lvert y \rvert$ (each by two cases); add; apply the lemma.
   Steps: (1) Absolute value is defined by cases, so proofs about it often use cases. (2) Four sign cases
   would work; the lemma packages them. (3) This inequality is the workhorse of analysis.

4. **try `try-exhaustive` — Exhaustive cases**
   Prompt: Which case splits cover every integer $n$? Select all.
   Answer: multi `['b','d']`. Choices: (a) $n < 0$; $n > 0$ (misses $0$); (b) $n = 3k$; $n = 3k + 1$; $n = 3k +
   2$ ✓ (every remainder mod 3); (c) $n$ even; $n$ prime (misses $9$); (d) $n \le 5$; $n \ge 5$ ✓ (overlap is
   fine; gaps are not).
   Hint: Look for an integer no case catches. Solution: as in the whys.

5. **scene `wlog` — Without loss of generality**
   Stage: Claim: $\max(x, y) + \min(x, y) = x + y$. "WLOG $x \le y$" (yellow), with a note "the statement is
   symmetric in $x$ and $y$: swapping them changes nothing". Then $\max = y$, $\min = x$, sum $x + y$. ∎
   Steps: (1) WLOG means "the other case is the same argument with the letters swapped". (2) It is only
   allowed when that is actually true; say why. (3) If the cases are genuinely different, write both.

6. **scene `counterexample` — Disproof by counterexample**
   Stage: Claim "For every prime $p$, $2^p - 1$ is prime." A table: $p = 2, 3, 5, 7$ gives $3, 7, 31, 127$
   (green); $p = 11$: $2047 = 23 \cdot 89$ (red). Then the written disproof: "The negation is: there is a prime
   $p$ with $2^p - 1$ not prime. Take $p = 11$: $2^{11} - 1 = 2047 = 23 \cdot 89$." ∎
   Steps: (1) Test small cases first. (2) A counterexample must be specific and verified, with the
   arithmetic shown. (3) Write the disproof as a proof of the negation.

7. **try `try-counterexample` — Pick the counterexample**
   Prompt: Claim: for all $x, y \in \mathbb{R}$, if $x^2 = y^2$ then $x = y$. Which is a counterexample?
   Answer: choice `b`. Choices: (a) $x = y = 2$ (hypothesis and conclusion both true); (b) $x = 1$, $y = -1$ ✓;
   (c) $x = 2$, $y = 3$ (hypothesis false, so it says nothing); (d) $x = y = 0$.
   Hint: Hypothesis true, conclusion false. Solution: $1^2 = (-1)^2$ but $1 \ne -1$.

8. **scene `existence` — Constructive and non-constructive existence**
   Stage: constructive: "$\exists n \in \mathbb{Z},\ n^2 - 5n + 6 = 0$: take $n = 2$." Non-constructive: "There
   exist irrational $a, b$ with $a^b$ rational." Two branches on "$\sqrt2^{\sqrt2}$ rational?": yes → $a = b =
   \sqrt 2$; no → $a = \sqrt2^{\sqrt2}$, $b = \sqrt 2$, $a^b = \sqrt2^{2} = 2$.
   Steps: (1) Constructive proofs exhibit the witness. (2) Non-constructive proofs show one must exist without
   saying which. (3) Both are valid; here we never learn which case holds.

9. **scene `uniqueness` — Proving uniqueness**
   Stage: $\exists!\,x$ = "exists" + "at most one". Theorem: for $a, b \in \mathbb{R}$ with $a \ne 0$, $ax + b =
   0$ has exactly one real solution. `proof`: existence: $x = -b/a$ works. Uniqueness: "Suppose $ax + b = 0$
   and $ay + b = 0$. Then $a(x - y) = 0$; since $a \ne 0$, $x = y$." ∎
   Steps: (1) Uniqueness: take two solutions and prove they are equal. (2) Don't assume they're different
   and look for a contradiction unless you need to. (3) Existence and uniqueness are separate parts; label them.

10. **blanks `fill-uniqueness` — Fill in the uniqueness step**
    - "Suppose $ax + b = 0$ and $ay + b = 0$. Subtracting, $ax = $ [$ay$]." Chips: $ay$, $-ay$, $y$.
    - "So $a(x - y) = $ [$0$]." Chips: $0$, $b$, $a$.
    - "Since $a$ [$\ne$] $0$, $x - y = 0$, so $x = y$." Chips: $\ne$, $=$, $>$.
    Solution: in $\mathbb{R}$, if a product is $0$ one factor is $0$; $a \ne 0$ forces $x - y = 0$.

11. **scene `prove-or-disprove` — Prove or disprove**
    Stage: Claim "For all $n \in \mathbb{N}$, $n^2 - n + 11$ is prime." A table $n = 1, \dots, 10$: 11, 13, 17,
    23, 31, 41, 53, 67, 83, 101 (green); $n = 11$: $121 = 11^2$ (red).
    Steps: (1) "Prove or disprove" means: decide first. (2) Ten successes, still false. (3) When a polynomial
    is involved, try the value that makes the constant term divide everything.

12. **workout `wo-cases` — Work it out**
    Prompt: Prove that for every integer $n$, $3n^2 + n + 14$ is even.
    Answer: proof. Hints: (1) Split by parity. (2) In the odd case, expand $3(2k + 1)^2 + (2k + 1) + 14$.
    Solution: **Proof.** Let $n \in \mathbb{Z}$; $n$ is even or odd. Case 1: $n = 2k$, $k \in \mathbb{Z}$. Then
    $3n^2 + n + 14 = 12k^2 + 2k + 14 = 2(6k^2 + k + 7)$, which is even. Case 2: $n = 2k + 1$. Then $3n^2 + n + 14
    = 12k^2 + 12k + 3 + 2k + 1 + 14 = 12k^2 + 14k + 18 = 2(6k^2 + 7k + 9)$, even. In every case $3n^2 + n + 14$ is
    even. ∎
    Rubric: states the parity split and that it is exhaustive; correct algebra in both cases; each case
    repacked as $2m$ with $m \in \mathbb{Z}$; concluding sentence covering all cases.

13. **explain `cp-cases` — Explain it back**
    Prompt: When is a proof by cases a complete proof? And how many examples does it take to prove, or to
    disprove, a "for all" statement?
    Points: the cases must be exhaustive (overlap is harmless, gaps are fatal) and each case must reach the
    conclusion; one verified counterexample disproves a universal statement; no number of examples proves it
    over an infinite domain; uniqueness is proved by taking two objects and showing they are equal.

14. **scene `recap` — Recap**
    Steps: (1) Cases must cover everything; WLOG needs a symmetry. (2) Disprove with one checked
    counterexample; existence can be constructive or not; uniqueness = any two are equal. (3) Next: sets, the
    language the rest of mathematics is written in.

---

## 9 · `sets` — Sets, subsets and power sets

*Irani · Sets · 14 min*

**Goals**
- Read and write sets in roster and set-builder notation
- Distinguish $\in$ from $\subseteq$, including for sets of sets
- Prove $A \subseteq B$ by element-chasing, $A \not\subseteq B$ by an element, and $A = B$ by double inclusion
- Compute power sets and know $\lvert \mathcal{P}(A) \rvert = 2^n$

**Beats**

1. **scene `what-set` — What a set is**
   Stage: $\{1, 2, 3\} = \{3, 2, 1, 1\}$ (green "="); set-builder $\{n \in \mathbb{Z} : n \text{ is even}\} =
   \{\dots, -2, 0, 2, \dots\}$; then the standard sets $\mathbb{N} = \{1, 2, 3, \dots\}$ (the convention boxed
   yellow), $\mathbb{Z}$, $\mathbb{Q}$, $\mathbb{R}$, and intervals $[a, b)$ on a `numberLine`.
   Steps: (1) A set is determined by its elements: order and repetition don't matter. (2) Set-builder
   notation: "the set of $n$ in $\mathbb{Z}$ such that …". (3) Our $\mathbb{N}$ starts at 1.

2. **scene `member-subset` — Element versus subset**
   Stage: purple card: $A \subseteq B$ iff $\forall x\,(x \in A \to x \in B)$. `venn` with $A$ nested in $B$;
   a dot $x$ in $A$ moves and is then seen inside $B$ too. Then $\{1\} \subseteq \{1, 2\}$ vs $1 \in \{1, 2\}$,
   with $\{1\} \in \{1, 2\}$ struck red.
   Steps: (1) $\in$ relates an element to a set; $\subseteq$ relates two sets. (2) A subset is defined by a
   conditional, so subset proofs are direct proofs. (3) $\subsetneq$ means subset but not equal.

3. **try `try-in-subset` — In or subset?**
   Prompt: Let $A = \{1, \{1\}, \{2, 3\}\}$. Which are true? Select all.
   Answer: multi `['a','b','c','e']`. Choices: (a) $1 \in A$ ✓; (b) $\{1\} \in A$ ✓ (listed as an element);
   (c) $\{1\} \subseteq A$ ✓ (its only element, 1, is in $A$); (d) $\{2, 3\} \subseteq A$ ($2 \notin A$: the
   set $\{2,3\}$ is an element, its members aren't); (e) $\varnothing \subseteq A$ ✓ (vacuously); (f) $2 \in A$.
   Hint: List the three elements of $A$. Solution: $A$'s elements are $1$, $\{1\}$, $\{2, 3\}$.

4. **scene `empty-set` — The empty set**
   Stage: $\varnothing \subseteq A$ for every $A$: "$\forall x\,(x \in \varnothing \to x \in A)$" with the
   hypothesis "always false" in yellow. Then $\varnothing$ vs $\{\varnothing\}$: an empty box vs a box
   containing an empty box; $\lvert \varnothing \rvert = 0$, $\lvert \{\varnothing\} \rvert = 1$.
   Steps: (1) The empty set is a subset of everything, by vacuous truth. (2) There is only one empty set (two
   empty sets are subsets of each other). (3) $\{\varnothing\}$ is not empty: it has one element.

5. **scene `subset-proof` — Element chasing**
   Stage: Claim $\{n \in \mathbb{Z} : 6 \mid n\} \subseteq \{n \in \mathbb{Z} : 2 \mid n\}$. `proof`: "Let $x \in
   A$." (blue) / "Then $x = 6k$ for some $k \in \mathbb{Z}$." / "So $x = 2(3k)$ with $3k \in \mathbb{Z}$." /
   "Hence $x \in B$." (green) ∎; a `venn` with $A$ inside $B$ beside it.
   Steps: (1) Start with "Let $x \in A$". (2) Unpack membership in $A$. (3) Repack as membership in $B$.

6. **scene `double-inclusion` — Proving two sets are equal**
   Stage: $A = \{2k + 1 : k \in \mathbb{Z}\}$, $B = \{2j - 1 : j \in \mathbb{Z}\}$. Two `proof` columns:
   ($\subseteq$) "Let $x \in A$, $x = 2k + 1$. Let $j = k + 1$. Then $2j - 1 = 2k + 1 = x$, so $x \in B$."
   ($\supseteq$) "Let $x \in B$, $x = 2j - 1$. Let $k = j - 1$. Then $2k + 1 = x$, so $x \in A$." ∎
   Steps: (1) $A = B$ iff $A \subseteq B$ and $B \subseteq A$. (2) Two element-chasing proofs. (3) Label the
   directions.

7. **blanks `fill-double` — Fill in the other inclusion**
   - "Let $x \in B$. Then $x = 2j - 1$ for some $j \in \mathbb{Z}$. Let $k = $ [$j - 1$]." Chips: $j - 1$, $j + 1$,
     $j$.
   - "Then $2k + 1 = $ [$2j - 1$] $= x$," Chips: $2j - 1$, $2j + 1$, $2j - 3$.
   - "so $x \in$ [$A$]." Chips: $A$, $B$, $\mathbb{Z}$.
   Solution: choose the witness $k$ so that $2k + 1$ equals the given element.

8. **scene `not-subset` — Showing $A \not\subseteq B$**
   Stage: $\{n : 2 \mid n\} \not\subseteq \{n : 4 \mid n\}$: the element $2$ appears in red, inside $A$ but
   outside $B$ in a `venn`. Negation: $\neg\forall x\,(x \in A \to x \in B) \equiv \exists x\,(x \in A \land x
   \notin B)$.
   Steps: (1) Not a subset means one element of $A$ is missing from $B$. (2) Exhibit it and verify both
   memberships. (3) Here: $2 = 2 \cdot 1$ but $2 \ne 4k$ for any integer $k$.

9. **scene `power-set` — The power set**
   Stage: $A = \{a, b, c\}$; its 8 subsets appear arranged as a cube (∅ bottom, $A$ top; edges = add one
   element). Then each element gets an "in / out" switch: $2 \times 2 \times 2 = 8$. $\lvert \mathcal{P}(A)
   \rvert = 2^{\lvert A \rvert}$.
   Steps: (1) $\mathcal{P}(A)$ is the set of all subsets of $A$. (2) Building a subset = deciding in or out for
   each element. (3) So an $n$-element set has $2^n$ subsets (a counting argument we'll make precise later).

10. **try `try-power` — How many?**
    Prompt: How many elements does $\mathcal{P}(\mathcal{P}(\{1, 2\}))$ have?
    Answer: number 16. Hint: First count $\mathcal{P}(\{1, 2\})$. Solution: $\mathcal{P}(\{1,2\}) = \{\varnothing,
    \{1\}, \{2\}, \{1,2\}\}$ has 4 elements, so its power set has $2^4 = 16$.

11. **scene `sets-of-sets` — Sets of sets, and a warning**
    Stage: $\mathcal{P}(\{1, 2\}) = \{\varnothing, \{1\}, \{2\}, \{1, 2\}\}$; green: $\varnothing \in
    \mathcal{P}(A)$, $\varnothing \subseteq \mathcal{P}(A)$, $\{1\} \in \mathcal{P}(A)$; red: $1 \in
    \mathcal{P}(A)$. Then Russell's set $R = \{x : x \notin x\}$ and "$R \in R \iff R \notin R$" in red.
    Steps: (1) Elements of $\mathcal{P}(A)$ are sets; $X \in \mathcal{P}(A) \iff X \subseteq A$. (2) Not every
    description defines a set: Russell's paradox. (3) Axioms (ZFC) say which constructions are safe; in this
    course we build sets from ones we already have, and that's always safe.

12. **workout `wo-power-subset` — Work it out**
    Prompt: Prove: for all sets $A$ and $B$, $A \subseteq B$ if and only if $\mathcal{P}(A) \subseteq
    \mathcal{P}(B)$.
    Answer: proof. Hints: (1) Two directions. For (⇒) take $X \in \mathcal{P}(A)$. (2) For (⇐), which element of
    $\mathcal{P}(A)$ is the obvious one to use?
    Solution: **Proof.** (⇒) Suppose $A \subseteq B$ and let $X \in \mathcal{P}(A)$, so $X \subseteq A$. Let $x
    \in X$. Then $x \in A$, so $x \in B$. Hence $X \subseteq B$, i.e. $X \in \mathcal{P}(B)$. So $\mathcal{P}(A)
    \subseteq \mathcal{P}(B)$. (⇐) Suppose $\mathcal{P}(A) \subseteq \mathcal{P}(B)$. Since $A \subseteq A$, $A
    \in \mathcal{P}(A)$, so $A \in \mathcal{P}(B)$, i.e. $A \subseteq B$. ∎
    Rubric: both directions labelled; (⇒) chases an element $X$ of $\mathcal{P}(A)$ and then an element $x$ of
    $X$; correct use of $X \in \mathcal{P}(B) \iff X \subseteq B$; (⇐) uses $A \in \mathcal{P}(A)$; no
    confusion of $\in$ and $\subseteq$.

13. **explain `cp-element-subset` — Explain it back**
    Prompt: Explain the difference between $x \in A$ and $X \subseteq A$, and describe how to prove that two
    sets are equal.
    Points: $\in$ is membership, $\subseteq$ means every element of one is in the other; a set can be both an
    element and a subset of another set (e.g. $\{1\}$ and $\{1, \{1\}\}$); prove $A \subseteq B$ by "let $x \in
    A$ … so $x \in B$"; equality by proving both inclusions.

14. **scene `recap` — Recap**
    Steps: (1) Roster and set-builder; $\mathbb{N}$ starts at 1. (2) $\in$ vs $\subseteq$; element chasing;
    double inclusion; $\lvert \mathcal{P}(A) \rvert = 2^n$. (3) Next: combining sets.

---

## 10 · `set-operations` — Set operations and identities

*Irani · Sets · 15 min*

**Goals**
- Compute unions, intersections, differences, complements, symmetric differences and Cartesian products
- Prove set identities by element-chasing (two inclusions or a chain of "iff"s)
- Use Venn diagrams to find counterexamples, and know why they are not proofs
- Work with indexed unions and intersections; recognize a partition

**Beats**

1. **scene `operations` — Union, intersection, difference, complement**
   Stage: `venn({ sets: ['A','B'], universe: 'U' })`; regions shade in turn for $A \cup B$, $A \cap B$, $A
   \setminus B$, $A^c$, $A \triangle B$; beside each, its set-builder definition with the matching connective
   highlighted: $x \in A \lor x \in B$, $\land$, $x \in A \land x \notin B$, $\neg$, $\oplus$.
   Steps: (1) Each operation is a logical connective applied to membership. (2) Complements need a universe
   $U$. (3) So set identities will come from logical equivalences.

2. **scene `compute` — Computing with small sets**
   Stage: $U = \{1, \dots, 6\}$, $A = \{1, 2, 3, 4\}$, $B = \{3, 4, 5\}$; elements drop into `venn` regions;
   results appear: $A \cup B = \{1,2,3,4,5\}$, $A \cap B = \{3,4\}$, $A \setminus B = \{1,2\}$, $B^c =
   \{1,2,6\}$, $A \triangle B = \{1,2,5\}$.
   Steps: (1) Place each element in its region first. (2) Then read off any combination. (3) Notice $A
   \setminus B = A \cap B^c$.

3. **try `try-compute` — Compute**
   Prompt: $U = \{1, \dots, 8\}$, $A = \{1, 2, 3, 4, 5\}$, $B = \{2, 4, 6\}$. Find $(A \setminus B) \cup B^c$.
   Answer: set `['1','3','5','7','8']`. Hint: Compute $A \setminus B$ and $B^c$ separately. Solution: $A
   \setminus B = \{1, 3, 5\}$, $B^c = \{1, 3, 5, 7, 8\}$; the union is $\{1, 3, 5, 7, 8\}$.

4. **scene `de-morgan-sets` — De Morgan for sets**
   Stage: two `venn`s side by side shading $(A \cup B)^c$ and $A^c \cap B^c$ (they match); then a `chain`: $x \in
   (A \cup B)^c \iff \neg(x \in A \lor x \in B) \iff x \notin A \land x \notin B \iff x \in A^c \cap B^c$, each
   link labelled (def. complement, De Morgan, def. intersection).
   Steps: (1) The picture suggests the identity. (2) The chain of iffs proves it, because each step is a
   definition or a logical equivalence. (3) A chain of iffs proves both inclusions at once, but only if every
   link is really an iff.

5. **scene `distributive` — Distributing $\cap$ over $\cup$**
   Stage: three-set `venn` shading $A \cap (B \cup C)$ and $(A \cap B) \cup (A \cap C)$; then `proof` for
   ($\subseteq$): "Let $x \in A \cap (B \cup C)$. Then $x \in A$, and $x \in B$ or $x \in C$. Case $x \in B$: $x
   \in A \cap B$. Case $x \in C$: $x \in A \cap C$. Either way $x \in (A \cap B) \cup (A \cap C)$."
   Steps: (1) An "or" in the hypothesis means cases. (2) Each case lands in one part of the union. (3) The
   reverse inclusion is your turn.

6. **blanks `fill-distrib` — The other inclusion**
   - "Let $x \in (A \cap B) \cup (A \cap C)$. Case 1: $x \in A \cap B$. Then $x \in A$ and $x \in$ [$B$]," Chips:
     $B$, $C$, $B \cap C$.
   - "so $x \in$ [$B \cup C$]," Chips: $B \cup C$, $B \cap C$, $A \cap C$.
   - "hence $x \in$ [$A \cap (B \cup C)$]. Case 2 is the same with $C$." Chips: $A \cap (B \cup C)$, $A \cup (B \cap
     C)$, $(A \cap B) \cup C$.
   Solution: an element of $B$ is in $B \cup C$ by the definition of union.

7. **scene `venn-not-proof` — Pictures suggest, proofs decide**
   Stage: a four-circle attempt that misses a region (one of the 16 regions absent, flashed red). Then Venn as
   a counterexample-finder: is $A \setminus (B \setminus C) = (A \setminus B) \setminus C$? Take $A = B = C =
   \{1\}$: left $= \{1\} \setminus \varnothing = \{1\}$, right $= \varnothing \setminus \{1\} = \varnothing$ (red).
   Steps: (1) A Venn diagram with circles can't show every case for four sets. (2) Diagrams are for intuition
   and for finding counterexamples. (3) A counterexample is a specific choice of sets, written out.

8. **try `try-not-identity` — Which is not an identity?**
   Prompt: Which of these fails for some sets $A, B$?
   Answer: choice `b`. Choices: (a) $A \setminus B = A \cap B^c$ (always true); (b) $(A \cup B) \setminus B = A$
   ✓ (fails when $A \cap B \ne \varnothing$, e.g. $A = B = \{1\}$); (c) $A \cap (A \cup B) = A$ (absorption);
   (d) $(A \cap B)^c = A^c \cup B^c$ (De Morgan).
   Hint: Try $A = B$. Solution: $(A \cup B) \setminus B = A \setminus B$, which equals $A$ only when $A$ and $B$
   are disjoint.

9. **scene `cartesian` — Cartesian products**
   Stage: $\{1, 2\} \times \{a, b, c\}$ as a 2×3 grid of ordered pairs; $(a, b) = (c, d) \iff a = c \land b =
   d$; $\mathbb{R} \times \mathbb{R}$ as the plane; $\lvert A \times B \rvert = \lvert A \rvert \cdot \lvert B
   \rvert$; $A \times B \ne B \times A$ (example $(1, a)$ vs $(a, 1)$).
   Steps: (1) Ordered pairs: order matters, unlike sets. (2) Sizes multiply. (3) Products distribute over
   unions: $A \times (B \cup C) = (A \times B) \cup (A \times C)$.

10. **scene `indexed` — Indexed families**
    Stage: `numberLine` $[-1.2, 1.2]$; intervals $A_n = (-1/n, 1/n)$ stacked for $n = 1, \dots, 5$ (shrinking);
    $\bigcup_{n \in \mathbb{N}} A_n = (-1, 1)$, $\bigcap_{n \in \mathbb{N}} A_n = \{0\}$. Proof sketch of the
    intersection: $0$ is in every $A_n$; if $x \ne 0$, choose $n > 1/\lvert x \rvert$, then $x \notin A_n$.
    Steps: (1) $x \in \bigcup A_n$ iff $\exists n,\ x \in A_n$; $x \in \bigcap A_n$ iff $\forall n,\ x \in A_n$.
    (2) To exclude $x \ne 0$ from the intersection, one $n$ suffices. (3) That choice of $n$ uses the
    Archimedean property, lecture 25.

11. **try `try-indexed` — Indexed intersection**
    Prompt: What is $\bigcap_{n \in \mathbb{N}} [0, 1/n)$?
    Answer: choice `b`. Choices: (a) $\varnothing$ ($0$ is in every interval); (b) $\{0\}$ ✓; (c) $[0, 1)$ (that's
    the $n = 1$ interval, the biggest); (d) $(0, 1)$.
    Hint: Is $0$ in every set? Is any positive $x$? Solution: $0 \in [0, 1/n)$ for all $n$; for $x > 0$ choose $n >
    1/x$, then $x \notin [0, 1/n)$.

12. **scene `partitions` — Partitions**
    Stage: a set drawn as a blob cut into pieces; definition: nonempty, pairwise disjoint, union is the whole
    set. Examples: $\mathbb{Z}$ = evens ∪ odds; $\mathbb{Z}$ by remainder mod 3 (three colors on a
    `numberLine`). Non-example: $\{1,2\}, \{2,3\}$ (overlap, red).
    Steps: (1) A partition cuts a set into non-overlapping, nonempty blocks. (2) Every element is in exactly one
    block. (3) In lecture 14, partitions and equivalence relations turn out to be the same thing.

13. **workout `wo-set-identity` — Work it out**
    Prompt: Prove: for all sets $A, B, C$, $A \setminus (B \cup C) = (A \setminus B) \cap (A \setminus C)$.
    Answer: proof. Hints: (1) Translate membership into logic. (2) De Morgan, then rearrange the "and"s.
    Solution: **Proof.** For any $x$: $x \in A \setminus (B \cup C) \iff x \in A \land \neg(x \in B \lor x \in C)
    \iff x \in A \land x \notin B \land x \notin C \iff (x \in A \land x \notin B) \land (x \in A \land x \notin
    C) \iff x \in (A \setminus B) \cap (A \setminus C)$. The steps use the definitions of difference and union,
    De Morgan's law, and idempotence/associativity of $\land$. Hence the sets are equal. ∎
    Rubric: works with an arbitrary element $x$; each step is a genuine equivalence with a named reason (or
    two separate inclusions are proved); De Morgan applied correctly; the duplicated "$x \in A$" is justified
    ($p \equiv p \land p$); concludes equality of sets.

14. **explain `cp-venn` — Explain it back**
    Prompt: Why isn't a Venn diagram a proof of a set identity? What is it good for?
    Points: a drawing shows particular sets, not all sets; circle diagrams can't show all regions for four or
    more sets; a proof needs an arbitrary element and logical steps; diagrams are excellent for guessing and
    for finding concrete counterexamples.

15. **scene `recap` — Recap**
    Steps: (1) Operations = connectives on membership. (2) Prove identities by element chasing; disprove with
    small concrete sets. (3) Indexed families and partitions. Next: functions.

---

## 11 · `functions` — Functions, injections and surjections

*Irani · Functions · Liebeck 19 · 15 min*

**Goals**
- State the definition of a function $f\colon A \to B$ and check that a rule is well-defined
- Distinguish domain, codomain and range
- Prove or disprove that a function is injective, surjective or bijective
- Know what injections and surjections say about the sizes of finite sets

**Beats**

1. **scene `function-def` — What a function is**
   Stage: `mapDiagram` $A = \{1, 2, 3\}$, $B = \{a, b, c, d\}$ with arrows $1 \mapsto a$, $2 \mapsto a$, $3 \mapsto
   c$ (green "function"). Then two non-examples: $1$ with two arrows (red), $3$ with none (red). Purple card:
   $f\colon A \to B$ assigns to each $a \in A$ exactly one $f(a) \in B$ (formally, a subset of $A \times B$ with
   that property).
   Steps: (1) Every input gets an output. (2) Exactly one output. (3) Outputs may repeat and some targets may
   be unused; that's fine.

2. **scene `domain-codomain` — Domain, codomain, range**
   Stage: $f\colon \mathbb{R} \to \mathbb{R}$, $x \mapsto x^2$; a `numberLine` for the codomain with the range
   $[0, \infty)$ shaded. Then $g\colon \mathbb{R} \to [0, \infty)$ with the same formula, labelled "a different
   function".
   Steps: (1) The codomain is part of the function's data, not the set of values it hits. (2) The range (image)
   is $\{f(a) : a \in A\}$. (3) Same formula, different codomain: different function, as we'll see with "onto".

3. **try `try-is-function` — Is it a function?**
   Prompt: Which of these define functions? Select all.
   Answer: multi `['c']`. Choices: (a) $f\colon \mathbb{R} \to \mathbb{R}$, $f(x) = 1/x$ (undefined at $0$);
   (b) $f\colon \mathbb{Q} \to \mathbb{Z}$, $f(a/b) = a$ (not well-defined: $1/2 = 2/4$ gives $1$ and $2$);
   (c) $f\colon \mathbb{Z} \to \mathbb{Z}$, $f(n) = n^2$ ✓; (d) $f\colon \mathbb{R} \to \mathbb{R}$, $f(x) =
   \sqrt x$ (undefined for $x < 0$); (e) $f\colon \mathbb{N} \to \mathbb{N}$, $f(n) = n - 1$ ($f(1) = 0 \notin
   \mathbb{N}$ with our convention).
   Hint: Check every input has exactly one output in the codomain. Solution: as in the whys.

4. **scene `well-defined` — Well-defined**
   Stage: $f\colon \mathbb{Q} \to \mathbb{Z}$, $f(a/b) = a + b$: $\frac12 \mapsto 3$, $\frac24 \mapsto 6$; the
   same point of $\mathbb{Q}$ with two arrows (red). Then $g(a/b) = 2a/b$ checked: if $a/b = c/d$ then $2a/b =
   2c/d$ (green).
   Steps: (1) When inputs have several names, the output must not depend on the name. (2) Check: equal inputs
   give equal outputs. (3) This check comes back with equivalence classes in lecture 14.

5. **scene `injective` — One-to-one**
   Stage: purple card: $f$ is **injective** iff $\forall a_1, a_2 \in A,\ f(a_1) = f(a_2) \implies a_1 = a_2$.
   A `mapDiagram` with two arrows colliding (red). Then `proof` for $f\colon \mathbb{R} \to \mathbb{R}$, $f(x) =
   3x + 7$: "Let $a_1, a_2 \in \mathbb{R}$ with $f(a_1) = f(a_2)$." / "Then $3a_1 + 7 = 3a_2 + 7$, so $a_1 =
   a_2$." ∎
   Steps: (1) Different inputs never share an output. (2) The usable form: assume equal outputs, derive equal
   inputs. (3) To disprove, exhibit two different inputs with the same output.

6. **scene `surjective` — Onto**
   Stage: purple card: **surjective** iff $\forall b \in B\ \exists a \in A,\ f(a) = b$. Scratch: solve $3a + 7 =
   b$, $a = (b - 7)/3$. `proof`: "Let $b \in \mathbb{R}$. Let $a = (b - 7)/3 \in \mathbb{R}$. Then $f(a) = b$." ∎.
   Then $g\colon \mathbb{Z} \to \mathbb{Z}$, $g(n) = 3n + 7$: $b = 0$ would need $n = -7/3 \notin \mathbb{Z}$ (red).
   Steps: (1) Every target is hit. (2) A $\forall\exists$ statement: solve in scratch, then verify. (3) The
   preimage you find must lie in the domain; over $\mathbb{Z}$ it doesn't.

7. **try `try-inj-surj` — Classify**
   Prompt: $f\colon \mathbb{Z} \to \mathbb{Z}$, $f(n) = 2n$. Which is true?
   Answer: choice `a`. Choices: (a) injective, not surjective ✓ ($2n = 2m \Rightarrow n = m$; $1$ is not hit);
   (b) surjective, not injective; (c) bijective (odd numbers are missed); (d) neither (it is injective).
   Hint: Is $1$ in the range? Solution: as in (a).

8. **scene `restrict` — Changing domain and codomain**
   Stage: graph of $x^2$ on `s.plane`; a horizontal line $y = 1$ hitting twice (not injective, red) and $y = -1$
   missing (not surjective, red). Restrict the domain to $[0, \infty)$: half the parabola fades; then codomain
   $[0, \infty)$: now a bijection (green).
   Steps: (1) $x^2$ on $\mathbb{R} \to \mathbb{R}$ is neither. (2) Shrinking the domain fixes injectivity.
   (3) Shrinking the codomain fixes surjectivity; together a bijection, with inverse $\sqrt{\ }$.

9. **blanks `fill-injective` — Prove injective**
   $f\colon \mathbb{R} \setminus \{1\} \to \mathbb{R}$, $f(x) = \dfrac{x}{x - 1}$.
   - "Suppose $f(a) = f(b)$. Then $a(b - 1) = $ [$b(a - 1)$]," Chips: $b(a - 1)$, $a(a - 1)$, $b(b - 1)$.
   - "i.e. $ab - a = $ [$ab - b$]," Chips: $ab - b$, $ab - a$, $ab + b$.
   - "so $a = $ [$b$]." Chips: $b$, $-b$, $1$.
   Solution: cross-multiplying is allowed because $a - 1$ and $b - 1$ are nonzero. The function is not
   surjective onto $\mathbb{R}$: $x/(x - 1) = 1$ would mean $x = x - 1$.

10. **scene `bijection-sizes` — Bijections and sizes**
    Stage: three small `mapDiagram`s: injection $\{1,2\} \to \{a,b,c\}$, surjection $\{1,2,3\} \to \{a,b\}$,
    bijection $\{1,2,3\} \to \{a,b,c\}$. Captions: injective ⇒ $\lvert A \rvert \le \lvert B \rvert$; surjective
    ⇒ $\lvert A \rvert \ge \lvert B \rvert$; bijective ⇒ equal.
    Steps: (1) A bijection pairs elements perfectly. (2) For finite sets of the same size, injective ⇔
    surjective (pigeonhole, lecture 21). (3) For infinite sets that fails: $n \mapsto 2n$; this is where
    cardinality gets interesting.

11. **scene `function-pitfalls` — Common mistakes**
    Stage: three red-struck snippets: "injective: if $a_1 = a_2$ then $f(a_1) = f(a_2)$" (that's just being a
    function); "surjective: $a = (b - 7)/3$" with no check that $a$ is in the domain or that $f(a) = b$;
    "not injective because the formula has a square".
    Steps: (1) Injectivity runs from equal outputs to equal inputs. (2) A surjectivity proof must name $a$, show
    $a \in A$, and verify $f(a) = b$. (3) Disproofs need specific elements.

12. **workout `wo-bijection` — Work it out**
    Prompt: Let $f\colon \mathbb{R} \setminus \{2\} \to \mathbb{R} \setminus \{1\}$, $f(x) = \dfrac{x}{x - 2}$.
    Prove that $f$ is well-defined (lands in the codomain) and bijective.
    Answer: proof. Hints: (1) Why can $f(x)$ never equal 1? (2) For surjectivity solve $y = x/(x - 2)$ for $x$, and
    check $x \ne 2$.
    Solution: **Proof.** *Codomain.* If $x/(x - 2) = 1$ then $x = x - 2$, impossible; so $f(x) \in \mathbb{R}
    \setminus \{1\}$. *Injective.* If $a/(a - 2) = b/(b - 2)$ then $ab - 2a = ab - 2b$, so $a = b$. *Surjective.*
    Let $y \in \mathbb{R} \setminus \{1\}$ and put $x = 2y/(y - 1)$, defined since $y \ne 1$. If $x = 2$ then $2y =
    2y - 2$, impossible, so $x \in \mathbb{R} \setminus \{2\}$. Then $x - 2 = 2/(y - 1)$, so $f(x) = \dfrac{2y/(y-1)}{2/(y-1)}
    = y$. Hence $f$ is a bijection. ∎
    Rubric: shows $f(x) \ne 1$; injectivity from $f(a) = f(b)$ to $a = b$ with valid algebra; surjectivity names
    the preimage and shows it is in the domain ($\ne 2$); verifies $f(x) = y$; concludes bijective.

13. **explain `cp-surjective` — Explain it back**
    Prompt: Explain how to prove a function is surjective, and why checking that your preimage lies in the
    domain matters.
    Points: surjective is $\forall b\,\exists a$, so fix an arbitrary $b$ in the codomain; find $a$ by scratch
    work (solving $f(a) = b$); the proof must show $a \in A$ and verify $f(a) = b$; e.g. $3n + 7$ on $\mathbb{Z}$
    fails because $(b - 7)/3$ need not be an integer.

14. **scene `recap` — Recap**
    Steps: (1) Function = exactly one output per input; well-defined. (2) Injective: equal outputs ⇒ equal
    inputs; surjective: solve and verify in the domain. (3) Next: combining and inverting functions.

---

## 12 · `composition-inverses` — Composition, inverses, images and preimages

*Irani · Functions · Dumas–McCarthy 1 · 16 min*

**Goals**
- Compose functions and prove compositions preserve injectivity and surjectivity
- Know that $f$ has an inverse exactly when it is bijective, and compute inverses
- Compute images $f(S)$ and preimages $f^{-1}(T)$
- Prove or disprove identities for images and preimages

**Beats**

1. **scene `composition` — Composition**
   Stage: two `mapDiagram`s chained $A \xrightarrow{f} B \xrightarrow{g} C$; arrows combine into $g \circ f$.
   Then $f(x) = x + 1$, $g(x) = x^2$: $(g \circ f)(x) = (x + 1)^2$ and $(f \circ g)(x) = x^2 + 1$, unequal at $x =
   1$ ($4 \ne 2$, red).
   Steps: (1) $g \circ f$ means "first $f$, then $g$": read right to left. (2) The codomain of $f$ must sit inside
   the domain of $g$. (3) Composition is not commutative.

2. **scene `comp-injective` — Compositions of injections**
   Stage: `proof`: Theorem: if $f\colon A \to B$ and $g\colon B \to C$ are injective, so is $g \circ f$. "Suppose
   $g(f(a_1)) = g(f(a_2))$." / "$g$ injective ⇒ $f(a_1) = f(a_2)$." / "$f$ injective ⇒ $a_1 = a_2$." ∎. A note:
   the same holds for surjections (your workout).
   Steps: (1) Peel off the outer function first. (2) Then the inner one. (3) Each step uses exactly one
   hypothesis.

3. **try `try-comp` — Compose**
   Prompt: $f, g\colon \mathbb{R} \to \mathbb{R}$, $f(x) = 2x$, $g(x) = x - 3$. Compute $(f \circ g)(5)$.
   Answer: number 4. Hint: Apply $g$ first. Solution: $g(5) = 2$, $f(2) = 4$. (Note $(g \circ f)(5) = 7$.)

4. **scene `comp-converse` — The converse half-holds**
   Stage: Theorem: if $g \circ f$ is injective then $f$ is injective. Then a counterexample to "then $g$ is
   injective": $A = \{1\}$, $B = \{1, 2\}$, $C = \{1\}$, $f(1) = 1$, $g(1) = g(2) = 1$: $g \circ f$ injective, $g$
   not (red collision).
   Steps: (1) If $f(a_1) = f(a_2)$, apply $g$ and use injectivity of $g \circ f$. (2) But $g$ can misbehave
   outside the range of $f$. (3) Small finite counterexamples are the fastest disproofs.

5. **scene `inverse` — Inverse functions**
   Stage: $\mathrm{id}_A$; definition: $g\colon B \to A$ is an inverse of $f$ iff $g \circ f = \mathrm{id}_A$ and $f
   \circ g = \mathrm{id}_B$. A bijection's `mapDiagram` has all arrows reversed (still a function); a
   non-injective one reversed shows a point with two arrows (red), a non-surjective one a point with none.
   Example $f(x) = 3x + 7$, $f^{-1}(y) = (y - 7)/3$.
   Steps: (1) Reversing arrows gives a function exactly when $f$ is a bijection. (2) Theorem: $f$ has an
   inverse iff $f$ is bijective; the inverse is unique. (3) Compute it by solving $y = f(x)$ for $x$.

6. **blanks `fill-inverse` — Find the inverse**
   $f\colon \mathbb{R} \to \mathbb{R}$, $f(x) = 5x - 4$.
   - $f^{-1}(y) = (y + $ [4] $)\,/\,$ [5]: both blanks typed numbers.
   - $(f^{-1} \circ f)(x) = $ [$x$]. Chips: $x$, $5x - 4$, $1$.
   Solution: solve $y = 5x - 4$: $x = (y + 4)/5$; check $f^{-1}(f(x)) = (5x - 4 + 4)/5 = x$.

7. **scene `image-preimage` — Images and preimages**
   Stage: $f(x) = x^2$; `numberLine` domain with $S = [-1, 2]$; arrows carry it to $f(S) = [0, 4]$ on a second
   line. Then $T = [1, 4]$ pulled back to $f^{-1}(T) = [-2, -1] \cup [1, 2]$. Definitions in purple: $f(S) =
   \{f(x) : x \in S\}$, $f^{-1}(T) = \{x \in A : f(x) \in T\}$.
   Steps: (1) The image of a set: all outputs of its elements. (2) The preimage of a set: all inputs landing
   in it. (3) $f^{-1}(T)$ is defined for every $f$; it does not mean $f$ has an inverse.

8. **try `try-preimage` — Preimage**
   Prompt: $f\colon \mathbb{Z} \to \mathbb{Z}$, $f(n) = n^2$. Find $f^{-1}(\{0, 1, 2, 4\})$.
   Answer: set `['-2','-1','0','1','2']`. Hint: For each target, which integers square to it?
   Solution: $0 \leftarrow 0$; $1 \leftarrow \pm 1$; $2$ has no integer square root; $4 \leftarrow \pm 2$.

9. **scene `image-intersection` — Images don't respect intersections**
   Stage: `proof` of $f(A \cap B) \subseteq f(A) \cap f(B)$. Then counterexample to equality with $f(x) = x^2$, $A
   = \{-1\}$, $B = \{1\}$: $f(A \cap B) = f(\varnothing) = \varnothing$ but $f(A) \cap f(B) = \{1\}$ (red).
   Steps: (1) One inclusion always holds. (2) Two different inputs can share an output, which breaks the other.
   (3) If $f$ is injective, equality holds.

10. **scene `preimage-ops` — Preimages behave perfectly**
    Stage: `chain`: $x \in f^{-1}(C \cap D) \iff f(x) \in C \cap D \iff f(x) \in C \land f(x) \in D \iff x \in
    f^{-1}(C) \cap f^{-1}(D)$; then the same for $\cup$ and complements listed.
    Steps: (1) Membership in a preimage is a statement about $f(x)$. (2) So preimages commute with every set
    operation. (3) This is why analysis defines continuity with preimages.

11. **try `try-image-identities` — Always true?**
    Prompt: For $f\colon X \to Y$, $A, B \subseteq X$, $C, D, T \subseteq Y$, which always hold? Select all.
    Answer: multi `['a','c','e']`. Choices: (a) $f(A \cup B) = f(A) \cup f(B)$ ✓; (b) $f(A \cap B) = f(A) \cap
    f(B)$ (only $\subseteq$); (c) $f^{-1}(C \cap D) = f^{-1}(C) \cap f^{-1}(D)$ ✓; (d) $f(f^{-1}(T)) = T$ (only
    $\subseteq$; equality needs $T$ inside the range, e.g. $f$ surjective); (e) $A \subseteq f^{-1}(f(A))$ ✓
    (equality needs injectivity).
    Hint: Test with $f(x) = x^2$. Solution: as in the whys.

12. **workout `wo-preimage-union` — Work it out**
    Prompt: Prove: for $f\colon X \to Y$ and $C, D \subseteq Y$, $f^{-1}(C \cup D) = f^{-1}(C) \cup f^{-1}(D)$.
    Answer: proof. Hints: (1) Unpack $x \in f^{-1}(\cdot)$. (2) A chain of iffs works.
    Solution: **Proof.** Let $x \in X$. Then $x \in f^{-1}(C \cup D) \iff f(x) \in C \cup D \iff f(x) \in C \lor
    f(x) \in D \iff x \in f^{-1}(C) \lor x \in f^{-1}(D) \iff x \in f^{-1}(C) \cup f^{-1}(D)$, by the definitions of
    preimage and union. ∎
    Rubric: arbitrary element of $X$; definition of preimage used in both directions; definition of union;
    each step is a genuine "iff" (or both inclusions proved); concludes set equality.

13. **workout `wo-comp-surjective` — Work it out**
    Prompt: Let $f\colon A \to B$ and $g\colon B \to C$. Prove: if $g \circ f$ is surjective, then $g$ is surjective.
    Answer: proof. Hints: (1) Start with an arbitrary $c \in C$. (2) What element of $B$ maps to $c$?
    Solution: **Proof.** Suppose $g \circ f$ is surjective and let $c \in C$. Then there is $a \in A$ with $g(f(a))
    = c$. Let $b = f(a)$; then $b \in B$ and $g(b) = c$. Since $c$ was arbitrary, $g$ is surjective. ∎
    Rubric: fixes arbitrary $c \in C$; uses surjectivity of $g \circ f$ to get $a$; names $b = f(a)$ and notes $b \in
    B$; verifies $g(b) = c$. (Bonus: a counterexample showing $f$ need not be surjective.)

14. **explain `cp-inverse` — Explain it back**
    Prompt: Why does a function have an inverse exactly when it is a bijection? And why does $f^{-1}(T)$ make
    sense even when $f$ has no inverse?
    Points: reversing arrows must give exactly one arrow out of each point of $B$; "at least one" is
    surjectivity and "at most one" is injectivity; $f^{-1}(T)$ is a set of inputs, defined by a membership
    condition on $f(x)$, so it needs no inverse function; when $f$ is bijective the two notations agree.

15. **scene `recap` — Recap**
    Steps: (1) $g \circ f$: first $f$; compositions preserve injective and surjective. (2) Inverse ⇔ bijection.
    (3) Images and preimages; preimages respect all set operations. Next: relations.

---

## 13 · `relations` — Relations and their properties

*Irani · Relations · 14 min*

**Goals**
- Define a relation on a set as a subset of $A \times A$ and draw it as a directed graph
- Prove or disprove reflexivity, symmetry, antisymmetry and transitivity
- Tell "antisymmetric" apart from "not symmetric"
- Recognize partial orders and draw Hasse diagrams; find comparable and incomparable elements

**Beats**

1. **scene `relation-def` — What a relation is**
   Stage: purple card: a relation on $A$ is a subset $R \subseteq A \times A$; write $a \mathrel{R} b$ for $(a, b)
   \in R$. `relationGraph` on $\{1, \dots, 6\}$ with edges for "$a \mid b$" (including loops) drawing in.
   Steps: (1) A relation records which pairs are related. (2) Examples: $<$, $=$, $\mid$, "same birthday".
   (3) As a picture: an arrow from $a$ to $b$ whenever $a \mathrel{R} b$.

2. **scene `functions-are-relations` — Functions are relations**
   Stage: a `mapDiagram` of $f\colon \{1,2,3\} \to \{1,2,3\}$ morphs into a `relationGraph` with one outgoing
   arrow per node; then a relation with a node having two outgoing arrows (red "not a function").
   Steps: (1) A function is a relation with exactly one arrow out of each element. (2) Relations drop that
   requirement. (3) So relations are the more general idea.

3. **scene `properties` — Four properties**
   Stage: four panels, each a small `relationGraph` with its quantified definition (purple): reflexive ($\forall a,\
   a \mathrel{R} a$; loops everywhere), symmetric ($a \mathrel{R} b \implies b \mathrel{R} a$; arrows paired),
   antisymmetric ($a \mathrel{R} b \land b \mathrel{R} a \implies a = b$; no two-way arrows between distinct
   nodes), transitive ($a \mathrel{R} b \land b \mathrel{R} c \implies a \mathrel{R} c$; a yellow shortcut
   arrow appears for each two-step path).
   Steps: (1) Reflexive: every element relates to itself. (2) Symmetric and antisymmetric. (3) Transitive:
   every two-step path has a shortcut.

4. **try `try-properties` — Which properties?**
   Prompt: On $\{1, 2, 3\}$, $R = \{(1,1), (2,2), (3,3), (1,2), (2,1)\}$. Which properties does $R$ have? Select all.
   Answer: multi `['refl','sym','trans']`. Choices: (refl) reflexive ✓ (all three loops); (sym) symmetric ✓
   ($(1,2)$ and $(2,1)$); (anti) antisymmetric ($1 \mathrel{R} 2$, $2 \mathrel{R} 1$, $1 \ne 2$); (trans)
   transitive ✓ (the only two-step paths are $1 \to 2 \to 1$ and $2 \to 1 \to 2$, whose shortcuts are loops).
   Hint: For transitivity, list every path of length two. Solution: as in the whys.

5. **scene `divides-properties` — Proving and disproving properties**
   Stage: "divides" on $\mathbb{Z}$. Reflexive: $a = a \cdot 1$ (green). Symmetric: $2 \mid 4$ but $4 \nmid 2$
   (red). Antisymmetric on $\mathbb{N}$: $a \mid b$ and $b \mid a$ give $b = ak$, $a = b\ell$, $k\ell = 1$, $k =
   \ell = 1$ (green); on $\mathbb{Z}$: $2 \mid -2$ and $-2 \mid 2$ (red). Transitive: lecture 6 (green).
   Steps: (1) Proving a property is a $\forall$ proof. (2) Disproving it needs specific elements. (3) The set
   matters: antisymmetry holds on $\mathbb{N}$ but not on $\mathbb{Z}$.

6. **scene `anti-vs-not-sym` — Antisymmetric is not "not symmetric"**
   Stage: two `relationGraph`s: equality on $\{1,2,3\}$ (only loops) labelled "symmetric AND antisymmetric";
   $\{(1,2), (2,1), (1,3)\}$ labelled "neither".
   Steps: (1) Antisymmetric forbids two-way arrows between different elements. (2) Equality has none, and is
   also symmetric. (3) Negate definitions carefully; don't guess from the names.

7. **try `try-subset-order` — Classify $\subseteq$**
   Prompt: On $\mathcal{P}(\{1, 2\})$, the relation $\subseteq$ is …
   Answer: choice `a`. Choices: (a) a partial order that is not total ✓ ($\{1\}$ and $\{2\}$ are incomparable);
   (b) an equivalence relation (not symmetric: $\varnothing \subseteq \{1\}$ only one way); (c) a total order
   ($\{1\} \not\subseteq \{2\}$ and $\{2\} \not\subseteq \{1\}$); (d) not transitive ($\subseteq$ is transitive).
   Hint: Check reflexive, antisymmetric, transitive, then try comparing $\{1\}$ and $\{2\}$.
   Solution: reflexive ($X \subseteq X$), antisymmetric (double inclusion), transitive; not total.

8. **scene `partial-orders` — Partial orders and Hasse diagrams**
   Stage: purple card: a partial order is reflexive, antisymmetric and transitive. `relationGraph` of
   divisibility on $\{1, 2, 3, 4, 6, 12\}$ with all arrows; loops and implied arrows fade away leaving the Hasse
   diagram ($1$–$2$, $1$–$3$, $2$–$4$, $2$–$6$, $3$–$6$, $4$–$12$, $6$–$12$, upward). The pair $4, 6$ glows
   yellow: incomparable.
   Steps: (1) Partial orders generalize $\le$. (2) Hasse diagrams drop loops and anything implied by
   transitivity; "up" means "bigger". (3) Total order: every two elements comparable; divisibility isn't.

9. **blanks `fill-transitive` — Prove transitivity**
   Relation on $\mathbb{R}$: $x \mathrel{R} y$ iff $x - y \in \mathbb{Q}$.
   - "Suppose $x \mathrel{R} y$ and $y \mathrel{R} z$. Then $x - y = q$ and $y - z = r$ with $q, r \in$
     [$\mathbb{Q}$]." Chips: $\mathbb{Q}$, $\mathbb{Z}$, $\mathbb{R}$.
   - "So $x - z = $ [$q + r$]," Chips: $q + r$, $q - r$, $qr$.
   - "which is rational because [$\mathbb{Q}$ is closed under addition]." Chips: `\mathbb{Q}\text{ is closed under addition}`,
     `x, z \in \mathbb{R}`, `q \ne 0`.
   Solution: add the two differences; the $y$ cancels. (This relation is also reflexive and symmetric: an
   equivalence relation, next lecture.)

10. **scene `not-transitive` — A relation that isn't transitive**
    Stage: $x \mathrel{R} y$ iff $\lvert x - y \rvert < 1$ on $\mathbb{R}$; `numberLine` with $0$, $0.6$, $1.2$:
    arcs $0 \to 0.6$ and $0.6 \to 1.2$ green, $0 \to 1.2$ red (distance $1.2$).
    Steps: (1) "Close to" is reflexive and symmetric. (2) But closeness doesn't chain. (3) The disproof names
    three specific numbers.

11. **workout `wo-relation` — Work it out**
    Prompt: On $\mathbb{Z}$ define $a \mathrel{R} b$ iff $ab \ge 0$. Which of reflexive, symmetric,
    antisymmetric, transitive does $R$ have? Enter the list, and justify each answer on paper.
    Answer: set `['reflexive','symmetric']`. Hints: (1) Zero is related to everything. (2) Try a chain through
    $0$ for transitivity.
    Solution: Reflexive: $a \cdot a = a^2 \ge 0$. Symmetric: $ab = ba$. Not antisymmetric: $1 \mathrel{R} 2$ and $2
    \mathrel{R} 1$ but $1 \ne 2$. Not transitive: $1 \mathrel{R} 0$ and $0 \mathrel{R} -1$ (products $0$), but
    $1 \cdot (-1) = -1 < 0$.
    Rubric (for the written justification): proofs of reflexive and symmetric for arbitrary integers; a specific
    counterexample for antisymmetry; a specific counterexample for transitivity; correct conclusion list.

12. **explain `cp-properties` — Explain it back**
    Prompt: Explain the four properties of a relation, and how you would show that a relation *fails* each one.
    Points: each property is a universal statement (reflexive $\forall a$; the others are conditionals);
    failure needs specific elements: an $a$ with $a \not\mathrel{R} a$, a pair related one way only, a two-way
    pair of distinct elements, or $a \mathrel{R} b$, $b \mathrel{R} c$ with $a \not\mathrel{R} c$;
    antisymmetric and symmetric are not opposites; partial order = reflexive + antisymmetric + transitive.

13. **scene `recap` — Recap**
    Steps: (1) Relations are sets of pairs, drawn as arrows. (2) The four properties and their disproofs;
    partial orders and Hasse diagrams. (3) Next: equivalence relations, the formal idea of "the same".

---

## 14 · `equivalence-relations` — Equivalence relations and partitions

*Irani · Relations · Liebeck 18 · 17 min*

**Goals**
- Prove that a relation is an equivalence relation
- Compute equivalence classes $[a]_\sim$ and describe the quotient set
- Prove that equivalence classes partition the set, and that partitions give equivalence relations
- Construct $\mathbb{Z}$ and $\mathbb{Q}$ from pairs, and check that operations on classes are well-defined

**Beats**

1. **scene `sameness` — Formalizing "the same"**
   Stage: three examples fade in: "same parity", "same birthday", "same remainder mod 3"; then the purple
   card: an **equivalence relation** is reflexive, symmetric and transitive; written $a \sim b$.
   Steps: (1) Mathematics constantly treats different things as "the same in some respect". (2) The three
   properties are exactly what "same" needs. (3) Equality is the extreme case.

2. **scene `mod3` — Same remainder mod 3**
   Stage: $a \sim b$ iff $3 \mid (a - b)$ on $\mathbb{Z}$. `proof`: reflexive $a - a = 0 = 3 \cdot 0$; symmetric
   $a - b = 3k \Rightarrow b - a = 3(-k)$; transitive $a - b = 3k$, $b - c = 3\ell \Rightarrow a - c = 3(k + \ell)$.
   Steps: (1) Three short proofs, each from the definition of divides. (2) Note the different witnesses $k$ and
   $\ell$. (3) This relation is congruence mod 3, lecture 19.

3. **scene `classes` — Equivalence classes**
   Stage: purple card $[a]_\sim = \{x \in A : x \sim a\}$. `numberLine` $-6..6$; integers colored by class
   (blue $[0]$, green $[1]$, orange $[2]$); then $[4]$ lights up exactly the green points: $[4] = [1]$.
   Steps: (1) The class of $a$ collects everything equivalent to $a$. (2) Mod 3 there are three classes.
   (3) Different names, same class: $[4] = [1] = [-2]$.

4. **try `try-classes` — Same class?**
   Prompt: On $\mathbb{Z}$, $a \sim b$ iff $5 \mid (a - b)$. Which classes equal $[2]$? Select all.
   Answer: multi `['c7','cm3','c12']`. Choices: (c7) $[7]$ ✓ ($7 - 2 = 5$); (cm3) $[-3]$ ✓ ($-3 - 2 = -5$);
   (c3) $[3]$ ($3 - 2 = 1$); (c12) $[12]$ ✓ ($10$); (cm2) $[-2]$ ($-4$).
   Hint: $[a] = [2]$ iff $a \sim 2$. Solution: as in the whys.

5. **scene `partition-theorem` — Classes partition the set**
   Stage: Theorem: the classes of $\sim$ partition $A$. A blob cut into classes. `proof`: nonempty ($a \in [a]$ by
   reflexivity); cover ($a \in [a]$); disjoint or equal: "Suppose $c \in [a] \cap [b]$. Then $c \sim a$ and $c \sim
   b$, so $a \sim b$ (symmetry, transitivity), so $[a] = [b]$ (lemma)."
   Steps: (1) Each class is nonempty and every element lies in one. (2) Two classes that share one element are
   equal. (3) So classes never partly overlap.

6. **blanks `fill-class-lemma` — The lemma**
   Lemma: if $a \sim b$ then $[a] = [b]$.
   - "Let $x \in [a]$. Then $x \sim a$. Since $a \sim b$, by [transitivity] $x \sim b$, so $x \in [b]$." Chips:
     `\text{reflexivity}`, `\text{symmetry}`, `\text{transitivity}`.
   - "Conversely, from $a \sim b$ we get $b \sim a$ by [symmetry], and the same argument gives $[b] \subseteq
     [a]$." Same chips.
   Solution: double inclusion, using transitivity each way and symmetry to reverse the hypothesis.

7. **scene `partition-to-relation` — Partitions give equivalence relations**
   Stage: a partition of $\{1, \dots, 6\}$ into $\{1, 4\}, \{2, 5, 6\}, \{3\}$; the relation "in the same block"
   drawn as a `relationGraph` (complete clusters with loops).
   Steps: (1) Given a partition, define $a \sim b$ iff they share a block. (2) It's an equivalence relation
   whose classes are the blocks. (3) Equivalence relations and partitions are two descriptions of one idea.

8. **scene `quotient` — The quotient set**
   Stage: $\mathbb{Z}/{\sim} = \{[0], [1], [2]\}$ for mod 3: the three colored classes collapse into three dots.
   Then $[a] + [b] := [a + b]$, with a check: $[1] = [4]$ and $[2] = [5]$, and $[1 + 2] = [3] = [0] = [9] = [4 +
   5]$ (green).
   Steps: (1) Treat each class as a single new object. (2) To define an operation on classes, use
   representatives. (3) Then prove the answer doesn't depend on which representatives you picked.

9. **scene `construct-q` — Building $\mathbb{Q}$ (and $\mathbb{Z}$) from pairs**
   Stage: pairs $(a, b)$ with $b \ne 0$ plotted as lattice points; $(a, b) \sim (c, d)$ iff $ad = bc$; the points
   $(1, 2), (2, 4), (-3, -6)$ light up together on one line through the origin. Then "$\tfrac{a}{b}$ is our name
   for $[(a, b)]$". Transitivity sketch: $ad = bc$, $cf = de$ ⇒ $adf = bcf = bde$ ⇒ $d(af - be) = 0$ ⇒ $af = be$,
   with "$d \ne 0$" highlighted yellow. A short aside: $\mathbb{Z}$ from pairs of naturals, $(a, b) \sim (c, d)$
   iff $a + d = b + c$, where $(a, b)$ stands for $a - b$.
   Steps: (1) A fraction is an equivalence class of pairs. (2) The interesting step in transitivity is where the
   nonzero denominator is used. (3) Number systems are built this way, layer by layer.

10. **try `try-is-equivalence` — Equivalence relation?**
    Prompt: Which are equivalence relations? Select all.
    Answer: multi `['b','c','e']`. Choices: (a) on $\mathbb{R}$, $x \sim y$ iff $\lvert x - y \rvert \le 1$ (not
    transitive: $0, 1, 2$); (b) on $\mathbb{Z}$, $a \sim b$ iff $a^2 = b^2$ ✓; (c) on lines in the plane, "parallel or
    equal" ✓; (d) on $\mathbb{Z}$, $a \sim b$ iff $a \mid b$ (not symmetric); (e) on $\mathbb{R}$, $x \sim y$ iff $x - y
    \in \mathbb{Z}$ ✓.
    Hint: Test transitivity and symmetry with small numbers. Solution: as in the whys; the classes in (b) are
    $\{a, -a\}$ and in (e) the sets $x + \mathbb{Z}$.

11. **scene `well-defined-ops` — Well-defined operations**
    Stage: addition on $\mathbb{Q}$: $[(a, b)] + [(c, d)] := [(ad + bc, bd)]$; a yellow box "if $(a,b) \sim (a',b')$ and
    $(c,d) \sim (c',d')$, is $(ad + bc, bd) \sim (a'd' + b'c', b'd')$?" with the verification lines. Then a bad
    definition: $f\colon \mathbb{Z}/3 \to \mathbb{Z}$, $f([a]) = a$: $f([1]) = 1$ but $f([4]) = 4$ (red).
    Steps: (1) A formula in the representative defines a function on classes only if equivalent
    representatives give the same answer. (2) For $\mathbb{Q}$ addition this is a short computation. (3) Skip
    the check and you may have defined nothing at all.

12. **workout `wo-equivalence` — Work it out**
    Prompt: On $\mathbb{Z}$, define $a \sim b$ iff $4 \mid (3a + b)$. Prove that $\sim$ is an equivalence
    relation, and determine how many equivalence classes it has.
    Answer: proof. Hints: (1) Reflexive: $3a + a = 4a$. (2) For symmetry, write $b = 4k - 3a$ and compute $3b +
    a$. (3) For the classes: $3a + b = 4a + (b - a)$.
    Solution: **Proof.** *Reflexive:* $3a + a = 4a$. *Symmetric:* if $3a + b = 4k$ then $3b + a = 3(4k - 3a) + a =
    4(3k - 2a)$. *Transitive:* if $3a + b = 4k$ and $3b + c = 4\ell$ then $3a + c = 4k + 4\ell - 4b = 4(k + \ell - b)$.
    So $\sim$ is an equivalence relation. Since $3a + b = 4a + (b - a)$, $a \sim b \iff 4 \mid (b - a)$, so $\sim$
    is congruence mod 4 and there are exactly **4** classes, $[0], [1], [2], [3]$ (distinct since $0, 1, 2, 3$
    differ by less than 4). ∎
    Rubric: all three properties proved for arbitrary integers with witnesses; algebra correct; identifies
    $\sim$ with "$4 \mid (b - a)$" with justification; states 4 classes and why they are distinct.

13. **explain `cp-partition` — Explain it back**
    Prompt: Why can two equivalence classes never partly overlap?
    Points: if $c$ is in both $[a]$ and $[b]$ then $a \sim c$ and $c \sim b$ by symmetry; transitivity gives $a
    \sim b$; then every element of $[a]$ is in $[b]$ and vice versa; so two classes are either equal or
    disjoint, and together they cover the set.

14. **scene `recap` — Recap**
    Steps: (1) Equivalence = reflexive, symmetric, transitive; classes partition. (2) Quotients turn classes
    into objects; operations must be well-defined. (3) Next: induction.

---

## 15 · `induction` — Mathematical induction

*Irani · Induction · Liebeck 8 · 16 min*

**Goals**
- State the principle of mathematical induction and explain why it is valid
- Write the base case, inductive hypothesis and inductive step explicitly
- Prove sum formulas, inequalities and divisibility statements by induction
- Find the flaw in a broken induction

**Beats**

1. **scene `pattern` — A pattern**
   Stage: $1, 1 + 3, 1 + 3 + 5, 1 + 3 + 5 + 7$ evaluate to $1, 4, 9, 16$; beside them square grids of dots grow by
   L-shaped layers ($2k - 1$ new dots each, the new layer yellow).
   Steps: (1) The sum of the first $n$ odd numbers looks like $n^2$. (2) The picture suggests why: each odd
   number is an L around the previous square. (3) Induction turns "each step adds a layer" into a proof.

2. **scene `dominoes` — Falling dominoes**
   Stage: `dominoes({ n: 12 })`: caption "$P(1)$" as the first is pushed; then "if $P(k)$ then $P(k+1)$" drawn
   between a generic pair; then the whole row topples. Purple card: if $P(1)$ and $\forall k \in \mathbb{N}\,(P(k)
   \to P(k + 1))$, then $\forall n \in \mathbb{N},\ P(n)$.
   Steps: (1) Push the first domino: the base case. (2) Each domino knocks over the next: the inductive step.
   (3) Then all fall.

3. **scene `template` — The template**
   Stage: `proof` skeleton: "We proceed by induction on $n$." / "**Base case** ($n = 1$): …" / "**Inductive
   step.** Let $k \in \mathbb{N}$ and suppose $P(k)$." (blue, labelled IH) / "We show $P(k + 1)$." (green) / "…" /
   "By induction, $P(n)$ holds for all $n \in \mathbb{N}$." ∎
   Steps: (1) The inductive hypothesis is assumed for one arbitrary $k$, not for all $k$. (2) Write the goal
   $P(k+1)$ out explicitly before computing. (3) Point to where the IH is used.

4. **scene `sum-proof` — Gauss's sum**
   Stage: `proof` of $1 + 2 + \cdots + n = n(n + 1)/2$: base $1 = 1 \cdot 2/2$; step: $1 + \cdots + k + (k + 1) =
   \tfrac{k(k+1)}{2} + (k + 1)$ (the IH substitution boxed yellow) $= \tfrac{(k + 1)(k + 2)}{2}$ (green).
   Steps: (1) Base case: check $n = 1$. (2) Split off the last term so the IH applies. (3) Factor to reach the
   goal form.

5. **blanks `fill-odd-sum` — The odd-number sum**
   Inductive step for $\sum_{i=1}^{n} (2i - 1) = n^2$:
   - $\sum_{i=1}^{k+1}(2i - 1) = $ [$k^2$] $+ (2(k + 1) - 1)$ "by the IH". Chips: $k^2$, $(k + 1)^2$, $2k - 1$.
   - $= k^2 + $ [$2k + 1$]. Chips: $2k + 1$, $2k - 1$, $2k$.
   - $= $ [$(k + 1)^2$]. Chips: $(k + 1)^2$, $k^2 + 1$, $(2k + 1)^2$.
   Solution: the IH replaces the first $k$ terms; the rest is algebra.

6. **scene `inequality` — An inequality with a late start**
   Stage: table of $2^n$ vs $n^2$ for $n = 1..7$ ($2 > 1$ ✓, $4 = 4$, $8 < 9$, $16 = 16$, $32 > 25$ ✓, $64 > 36$,
   $128 > 49$). Claim: $2^n > n^2$ for all $n \ge 5$. Step: $2^{k+1} = 2 \cdot 2^k > 2k^2 \ge (k + 1)^2$, the
   last because $k^2 - 2k - 1 = (k - 1)^2 - 2 \ge 0$ for $k \ge 3$ (yellow: "here we use $k \ge 5$").
   Steps: (1) Induction can start at any integer. (2) In the step, use the IH, then an extra inequality. (3) Say
   where the starting point is needed.

7. **try `try-base` — Where does it start?**
   Prompt: What is the smallest $N$ such that $2^n > n^2$ for every integer $n \ge N$?
   Answer: number 5. Hint: Check $n = 1, 2, 3, 4$. Solution: $n = 2$ and $n = 4$ give equality and $n = 3$ gives
   $8 < 9$; from $n = 5$ on the inequality holds by the induction in the previous slide.

8. **scene `divisibility-induction` — Divisibility by induction**
   Stage: claim $3 \mid 4^n - 1$ for all $n \in \mathbb{N}$. Base $4 - 1 = 3$. Step: $4^{k+1} - 1 = 4(4^k - 1) + 3$;
   with IH $4^k - 1 = 3m$: $= 3(4m + 1)$.
   Steps: (1) Rewrite the $k + 1$ expression to contain the $k$ expression. (2) Substitute the IH witness.
   (3) Repack with the definition of divides.

9. **scene `horses` — All horses are the same color?**
   Stage: the bogus proof with dots as horses: a group of $k + 1$ horses, the first $k$ (bracket 1) and the last
   $k$ (bracket 2) overlapping in the middle. Then $k + 1 = 2$: two dots, the brackets don't overlap (red gap).
   Steps: (1) The "proof": both groups of $k$ are one color, and they overlap, so all $k + 1$ are. (2) The
   overlap argument needs a horse in both groups. (3) From 1 to 2 there isn't one: the chain breaks at the
   first link.

10. **try `try-horses` — Find the flaw**
    Prompt: Where does the "all horses are the same color" induction fail?
    Answer: choice `b`. Choices: (a) the base case is false (one horse has one color); (b) the step from $k = 1$
    to $k = 2$, because the two groups don't overlap ✓; (c) induction doesn't apply to horses (it applies to any
    statement $P(n)$); (d) the IH assumes the conclusion (assuming $P(k)$ for one $k$ is legitimate).
    Hint: Draw the case $k + 1 = 2$. Solution: the step must work for every $k \ge 1$; it fails at $k = 1$.

11. **scene `why-works` — Why induction works**
    Stage: purple card, the well-ordering principle: every nonempty subset of $\mathbb{N}$ has a least element.
    `proof`: "Suppose $P(1)$ and the step hold, but $S = \{n : \neg P(n)\} \ne \varnothing$. Let $m = \min S$." / "$m
    \ne 1$, so $m - 1 \in \mathbb{N}$ and $P(m - 1)$ holds." / "By the step, $P(m)$ (red: contradiction)." ∎
    Steps: (1) Induction is equivalent to well-ordering. (2) A failure would have a first failure, and the step
    rules that out. (3) So assuming $P(k)$ in the step is not circular.

12. **workout `wo-sum-squares` — Work it out**
    Prompt: Prove by induction that for every $n \in \mathbb{N}$, $\displaystyle\sum_{i=1}^{n} i^2 = \frac{n(n +
    1)(2n + 1)}{6}$.
    Answer: proof. Hints: (1) Base case $n = 1$. (2) In the step, factor $(k + 1)$ out of $\tfrac{k(k+1)(2k+1)}{6} +
    (k + 1)^2$. (3) $2k^2 + 7k + 6 = (k + 2)(2k + 3)$.
    Solution: **Proof.** By induction on $n$. Base: $1^2 = 1 = \tfrac{1 \cdot 2 \cdot 3}{6}$. Step: let $k \in
    \mathbb{N}$ and suppose $\sum_{i=1}^k i^2 = \tfrac{k(k+1)(2k+1)}{6}$. Then $\sum_{i=1}^{k+1} i^2 =
    \tfrac{k(k+1)(2k+1)}{6} + (k+1)^2 = \tfrac{(k+1)(2k^2 + k + 6k + 6)}{6} = \tfrac{(k+1)(k+2)(2k+3)}{6}$, which
    is the formula for $n = k + 1$. By induction the formula holds for all $n \in \mathbb{N}$. ∎
    Rubric: base case checked; IH stated for an arbitrary $k$; goal $P(k+1)$ written; IH used visibly; algebra
    correct to the exact target form; concluding sentence.

13. **workout `wo-bernoulli` — Work it out**
    Prompt: Prove Bernoulli's inequality: for every real $x \ge -1$ and every $n \in \mathbb{N}$, $(1 + x)^n \ge 1 +
    nx$.
    Answer: proof. Hints: (1) Induct on $n$ with $x$ fixed. (2) Multiply the IH by $1 + x$: why is that allowed?
    Solution: **Proof.** Fix $x \ge -1$; induct on $n$. Base: $(1 + x)^1 = 1 + x$. Step: suppose $(1 + x)^k \ge 1 +
    kx$. Since $1 + x \ge 0$, multiplying preserves the inequality: $(1 + x)^{k+1} \ge (1 + kx)(1 + x) = 1 + (k +
    1)x + kx^2 \ge 1 + (k + 1)x$, because $kx^2 \ge 0$. By induction the inequality holds for all $n$. ∎
    Rubric: fixes $x$ and inducts on $n$; base case; uses $1 + x \ge 0$ to multiply the inequality (the key
    justification); drops $kx^2 \ge 0$ with reason; conclusion.

14. **explain `cp-induction` — Explain it back**
    Prompt: Why do $P(1)$ and "$P(k) \Rightarrow P(k + 1)$ for every $k$" prove $P(n)$ for every $n$? Isn't
    assuming $P(k)$ circular?
    Points: the step proves an implication, not $P(k)$ itself; chaining the implications from $P(1)$ reaches
    any $n$ in finitely many steps; formally, a least counterexample would contradict the step (well-ordering);
    the step must hold for every $k$ from the base on (horses).

15. **scene `recap` — Recap**
    Steps: (1) Base case, IH for one arbitrary $k$, show $P(k + 1)$. (2) Sums, inequalities, divisibility; check
    every link. (3) Next: when one previous domino isn't enough.

---

## 16 · `strong-induction` — Strong induction and recursion

*Irani · Induction · 15 min*

**Goals**
- State strong induction and recognize when it is needed
- Prove that every integer $n \ge 2$ is a product of primes
- Handle several base cases (postage problems) and recursive definitions (Fibonacci)
- Write a minimal-counterexample (well-ordering) proof

**Beats**

1. **scene `need-strong` — When one step back isn't enough**
   Stage: factoring $12 = 3 \cdot 4$, then $4 = 2 \cdot 2$; knowing about $11$ is useless. `dominoes` where
   domino $k + 1$ is pushed by arcs from *all* earlier dominoes.
   Steps: (1) Ordinary induction lets $P(k)$ prove $P(k + 1)$. (2) Factorizations break $k + 1$ into much smaller
   pieces. (3) So we assume every earlier case.

2. **scene `strong-principle` — Strong induction**
   Stage: purple card: if $P(1)$, and for every $k$, $P(1) \land \cdots \land P(k) \implies P(k + 1)$, then
   $\forall n,\ P(n)$. Then "it's not stronger": apply ordinary induction to $Q(n) = P(1) \land \cdots \land
   P(n)$.
   Steps: (1) The IH is now "$P(j)$ for all $j \le k$". (2) It proves exactly the same theorems as ordinary
   induction. (3) It's a convenience, and we say which form we use.

3. **scene `factorization` — Every $n \ge 2$ is a product of primes**
   Stage: `proof`: base $n = 2$ prime. Step: let $k \ge 2$, assume all $2 \le j \le k$ are products of primes;
   if $k + 1$ is prime, done; else $k + 1 = ab$ with $2 \le a, b \le k$; the IH applies to both (yellow); multiply.
   Beside it a factor tree for $60 = 2 \cdot 2 \cdot 3 \cdot 5$ growing.
   Steps: (1) Two cases: prime or composite. (2) A composite splits into smaller factors, both covered by the
   strong IH. (3) A prime counts as a product of one prime. Uniqueness comes in lecture 18.

4. **try `try-which-induction` — Which needs strong induction?**
   Prompt: Which proof most naturally needs strong induction?
   Answer: choice `b`. Choices: (a) $1 + \cdots + n = n(n+1)/2$ (each case uses only the previous one); (b) every
   $n \ge 2$ is a product of primes ✓ (the factors can be any smaller numbers); (c) $2^n > n$ (previous case
   suffices); (d) $3 \mid 4^n - 1$ (previous case suffices).
   Hint: Which step refers back further than one? Solution: (b).

5. **scene `postage` — Stamps of 4 and 5**
   Stage: claim every $n \ge 12$ is $4a + 5b$ with $a, b \in \mathbb{Z}_{\ge 0}$. A table: $12 = 4 \cdot 3$, $13 = 4
   \cdot 2 + 5$, $14 = 4 + 5 \cdot 2$, $15 = 5 \cdot 3$ (base cases, blue); then $16 = 12 + 4$, $17 = 13 + 4$, …
   arrows jumping back 4 rows. $11$ in red: impossible.
   Steps: (1) The step from $n$ uses $n - 4$, four back. (2) So we need four base cases, $12$–$15$. (3) Check:
   for $n \ge 16$, $n - 4 \ge 12$, so the IH applies.

6. **blanks `fill-postage` — The base cases**
   Typed numbers: $12 = 4 \cdot$ [3] $+ 5 \cdot 0$; $13 = 4 \cdot$ [2] $+ 5 \cdot 1$; $14 = 4 \cdot 1 + 5
   \cdot$ [2]; $15 = 4 \cdot 0 + 5 \cdot$ [3].
   Solution: each base case is a direct check; there are four because the step reaches back four.

7. **scene `fibonacci` — Recursive definitions**
   Stage: $F_1 = F_2 = 1$, $F_{n} = F_{n-1} + F_{n-2}$; terms $1, 1, 2, 3, 5, 8, 13, \dots$ appear as growing
   squares (spiral). Claim $F_n < 2^n$: bases $1 < 2$, $1 < 4$; step $F_{k+1} = F_k + F_{k-1} < 2^k + 2^{k-1} <
   2^{k+1}$.
   Steps: (1) A recursive definition is itself an induction. (2) A two-term recurrence needs two base cases.
   (3) The step uses the two previous cases: strong induction.

8. **try `try-fib` — Compute**
   Prompt: With $F_1 = F_2 = 1$ and $F_n = F_{n-1} + F_{n-2}$, what is $F_{10}$?
   Answer: number 55. Hint: Just keep adding. Solution: $1, 1, 2, 3, 5, 8, 13, 21, 34, 55$.

9. **scene `minimal-counterexample` — Minimal counterexamples**
   Stage: claim: every integer $n \ge 2$ has a prime divisor. `proof`: "Suppose not; by well-ordering let $m$ be the
   least $n \ge 2$ with no prime divisor." / "$m$ isn't prime (it would divide itself), so $m = ab$, $1 < a < m$." /
   "$a < m$ has a prime divisor $p$; $p \mid a \mid m$." (red: contradiction) ∎. A callback tag to Euclid's
   proof (lecture 7).
   Steps: (1) Assume a counterexample exists and take the smallest. (2) Use the fact that everything smaller
   works. (3) Same logic as strong induction, written as a contradiction.

10. **scene `strong-pitfalls` — A broken strong induction**
    Stage: bogus claim "$5n = 0$ for all $n \ge 0$": base $5 \cdot 0 = 0$; step "write $k + 1 = i + j$ with $0 \le i,
    j \le k$; $5(k + 1) = 5i + 5j = 0 + 0$". For $k + 1 = 1$: $i + j = 1$ forces one of them to be $1 > k = 0$ (red).
    Steps: (1) The step must work for every $k$, including the smallest. (2) Here the decomposition doesn't
    exist at $k = 0$. (3) Lesson: check the step at the first few $k$, and have enough base cases.

11. **workout `wo-strong` — Work it out**
    Prompt: Prove that every integer $n \ge 8$ can be written as $3a + 5b$ with $a, b \in \mathbb{Z}_{\ge 0}$.
    Answer: proof. Hints: (1) Step back by 3. (2) How many base cases does that need?
    Solution: **Proof.** By strong induction on $n \ge 8$. Base cases: $8 = 3 + 5$, $9 = 3 \cdot 3$, $10 = 5 \cdot
    2$. Step: let $k \ge 10$ and suppose every $j$ with $8 \le j \le k$ has such a representation. Then $k + 1 - 3
    = k - 2 \ge 8$, so $k - 2 = 3a + 5b$ with $a, b \ge 0$, and $k + 1 = 3(a + 1) + 5b$. By strong induction the
    claim holds for all $n \ge 8$. ∎
    Rubric: three base cases verified; strong IH stated over the right range; checks $k - 2 \ge 8$; produces
    nonnegative coefficients for $k + 1$; conclusion.

12. **workout `wo-recurrence` — Compute a term**
    Prompt: $a_1 = 1$, $a_2 = 3$, $a_n = a_{n-1} + 2a_{n-2}$ for $n \ge 3$. Find $a_6$.
    Answer: number 43. Hints: (1) Compute $a_3, a_4, a_5$ in order. (2) $a_3 = 5$.
    Solution: $a_3 = 3 + 2 = 5$, $a_4 = 5 + 6 = 11$, $a_5 = 11 + 10 = 21$, $a_6 = 21 + 22 = 43$. (By strong
    induction one can prove $a_n = \tfrac{2^{n+1} + (-1)^n}{3}$; check $n = 6$: $(128 + 1)/3 = 43$.)
    `generate(rand)`: $a_1, a_2 \in \{1, \dots, 5\}$, coefficients $c_1, c_2 \in \{1, 2, 3\}$, recurrence $a_n =
    c_1 a_{n-1} + c_2 a_{n-2}$; ask for $a_6$; answer and solution list the terms $a_3..a_6$.

13. **explain `cp-strong` — Explain it back**
    Prompt: When do you need strong induction instead of ordinary induction, and why is it not actually a
    stronger principle?
    Points: when the step for $k + 1$ uses cases further back than $k$ (factorizations, recurrences, stepping
    back by more than 1); number of base cases matches how far back the step reaches; applying ordinary
    induction to "$P(1) \land \cdots \land P(n)$" gives strong induction; both are equivalent to well-ordering.

14. **scene `recap` — Recap**
    Steps: (1) Strong IH: all earlier cases. (2) Enough base cases; recurrences; minimal counterexamples.
    (3) Next: the integers, starting with division with remainder.

---

## 17 · `division` — Divisibility and the division algorithm

*Irani · Integers · Liebeck 10 · 14 min*

**Goals**
- Use basic properties of divisibility, including $a \mid b,\ a \mid c \Rightarrow a \mid (bx + cy)$
- State the division algorithm and prove existence (well-ordering) and uniqueness of $q$ and $r$
- Compute quotients and remainders, including for negative dividends
- Use remainder cases to prove statements about all integers

**Beats**

1. **scene `divisibility-props` — Facts about divisibility**
   Stage: a card of facts, each with a one-line proof sketch fading in: $1 \mid n$ and $n \mid 0$; if $a \mid b$ and
   $a \mid c$ then $a \mid (bx + cy)$ for all $x, y \in \mathbb{Z}$; if $a \mid b$ and $b \ne 0$ then $\lvert a \rvert
   \le \lvert b \rvert$; if $a \mid b$ and $b \mid a$ then $a = \pm b$.
   Steps: (1) These follow from the definition in one or two lines. (2) The linear-combination fact is the one we
   use most. (3) The size fact is why $p \mid 1$ was a contradiction.

2. **scene `division-algorithm` — Division with remainder**
   Stage: purple card: for $a \in \mathbb{Z}$ and $b \in \mathbb{N}$ there are unique $q, r \in \mathbb{Z}$ with $a =
   bq + r$ and $0 \le r < b$. `numberLine` with multiples of $b = 5$ marked; $a = 17$ lands between $15$ and $20$:
   $q = 3$, $r = 2$ (yellow brace). Then $a = -17$ between $-20$ and $-15$: $q = -4$, $r = 3$.
   Steps: (1) $bq$ is the largest multiple of $b$ at or below $a$. (2) The remainder is the gap, always in $[0,
   b)$. (3) For negative $a$, the quotient rounds down, so the remainder stays nonnegative.

3. **blanks `fill-qr` — Quotient and remainder**
   Typed numbers: $-17 = 5 \cdot$ [$-4$] $+$ [$3$]; $17 = 5 \cdot$ [$3$] $+$ [$2$]; $-30 = 7 \cdot$ [$-5$] $+$ [$5$].
   Solution: choose $q$ so that $0 \le a - 5q < 5$ (resp. $< 7$): $-17 - (-20) = 3$; $-30 - (-35) = 5$.

4. **scene `existence` — Why $q$ and $r$ exist**
   Stage: `proof`: "Let $S = \{a - bk : k \in \mathbb{Z},\ a - bk \ge 0\}$." / "$S \ne \varnothing$: take $k = -\lvert a
   \rvert$, giving $a + b\lvert a \rvert \ge 0$." / "By well-ordering (of $\mathbb{Z}_{\ge 0}$), let $r = a - bq$ be
   the least element." / "If $r \ge b$, then $r - b = a - b(q + 1) \in S$ is smaller (red)." / "So $0 \le r < b$." ∎
   `numberLine` showing the elements of $S$ as dots and the least one boxed.
   Steps: (1) Look at all nonnegative values $a - bk$. (2) Well-ordering gives a smallest one. (3) If it were
   at least $b$, subtracting $b$ would make a smaller one.

5. **scene `uniqueness` — Why they are unique**
   Stage: `proof`: "Suppose $bq + r = bq' + r'$ with $0 \le r, r' < b$." / "Then $b(q - q') = r' - r$." / "$-b < r' - r
   < b$, and it's a multiple of $b$, so it is $0$." / "Hence $r = r'$, $q = q'$." ∎
   Steps: (1) Take two representations. (2) Their difference is a multiple of $b$ smaller than $b$ in size.
   (3) The only such multiple is zero.

6. **try `try-square-remainder` — Remainders of squares**
   Prompt: Which remainders can $n^2$ leave on division by 4? Enter the set.
   Answer: set `['0','1']`. Hint: Split by parity. Solution: $(2k)^2 = 4k^2$ leaves 0; $(2k + 1)^2 = 4(k^2 + k) + 1$
   leaves 1. (So no perfect square has the form $4m + 2$ or $4m + 3$; e.g. $1\,000\,003$ is not a square.)

7. **scene `remainder-cases` — Cases by remainder**
   Stage: claim $3 \mid n^3 - n$. A three-row table $n = 3q$, $3q + 1$, $3q + 2$ with $n^3 - n = (n - 1)n(n + 1)$:
   in each row one factor is a multiple of 3 (highlighted).
   Steps: (1) The division algorithm gives exhaustive, non-overlapping cases. (2) Factor first. (3) In each
   case one of three consecutive integers is divisible by 3.

8. **scene `parity-settled` — Even or odd, never both**
   Stage: with $b = 2$: every integer is $2q$ or $2q + 1$ and not both, by uniqueness of $r \in \{0, 1\}$. A
   yellow note links back to lectures 6–8 where "odd means not even" was used.
   Steps: (1) This fills the gap we left earlier. (2) "Not even ⇒ odd" is now a theorem. (3) The same
   holds for any modulus: exactly one remainder.

9. **workout `wo-not-div4` — Work it out**
   Prompt: Prove that for every integer $n$, $n^2 - 2$ is not divisible by 4.
   Answer: proof. Hints: (1) Parity cases. (2) Write $n^2 - 2$ as $4m + r$ with $0 \le r < 4$ and use uniqueness
   of the remainder.
   Solution: **Proof.** Let $n \in \mathbb{Z}$. If $n = 2k$, then $n^2 - 2 = 4k^2 - 2 = 4(k^2 - 1) + 2$. If $n = 2k +
   1$, then $n^2 - 2 = 4k^2 + 4k - 1 = 4(k^2 + k - 1) + 3$. In either case the remainder of $n^2 - 2$ on division by
   4 is 2 or 3, not 0; by uniqueness of the remainder, $4 \nmid n^2 - 2$. ∎
   Rubric: exhaustive cases; correct algebra with remainders in $[0, 4)$; appeals to uniqueness of the
   remainder (a form like $4(k^2) - 2$ is not enough); conclusion.

10. **workout `wo-qr` — Compute $q$ and $r$**
    Prompt: Find the quotient and remainder when $a = -83$ is divided by $b = 9$. Enter $(q, r)$.
    Answer: vector `['-10','7']`. Hints: (1) Find the largest multiple of 9 that is $\le -83$. (2) $9 \cdot (-10) =
    -90$.
    Solution: $-83 = 9 \cdot (-10) + 7$ with $0 \le 7 < 9$.
    `generate(rand)`: $a$ uniform in $[-200, 200] \setminus \{0\}$, $b$ in $\{2, \dots, 12\}$; $q = \lfloor a/b
    \rfloor$, $r = a - bq$; solution states $a = bq + r$ with $0 \le r < b$.

11. **scene `bases` — Writing numbers in base $b$**
    Stage: repeated division of 2026 by 7: $2026 = 7 \cdot 289 + 3$, $289 = 7 \cdot 41 + 2$, $41 = 7 \cdot 5 + 6$,
    $5 = 7 \cdot 0 + 5$; the remainders read bottom-up: $2026 = 5623_7$; check $5 \cdot 343 + 6 \cdot 49 + 2 \cdot
    7 + 3 = 2026$.
    Steps: (1) Every positive integer has a base-$b$ expansion: divide repeatedly. (2) The remainders are the
    digits, last digit first. (3) Uniqueness of remainders makes the expansion unique.

12. **explain `cp-division` — Explain it back**
    Prompt: Why are the quotient and remainder unique, and how do remainders help prove statements about all
    integers?
    Points: two representations differ by a multiple of $b$ that is less than $b$ in absolute value, hence 0;
    remainders split $\mathbb{Z}$ into $b$ exhaustive, non-overlapping cases; uniqueness is what lets us
    conclude "not divisible" from a nonzero remainder; existence came from well-ordering.

13. **scene `recap` — Recap**
    Steps: (1) $a = bq + r$, $0 \le r < b$, unique. (2) Remainder cases; parity settled; bases. (3) Next: greatest
    common divisors and Euclid.

---

## 18 · `gcd` — GCD, Euclid's algorithm and unique factorization

*Irani · Integers · Liebeck 11 · 17 min*

**Goals**
- Define $\gcd(a, b)$ and compute it with the Euclidean algorithm
- Prove $\gcd(a, b) = \gcd(b, r)$ and explain why the algorithm terminates
- Find Bézout coefficients $x, y$ with $ax + by = \gcd(a, b)$
- Prove Euclid's lemma and the uniqueness part of the Fundamental Theorem of Arithmetic

**Beats**

1. **scene `gcd-def` — Greatest common divisor**
   Stage: positive divisors of 84 and of 360 listed in two rows; common ones highlighted (1, 2, 3, 4, 6, 12); the
   largest, 12, green. Purple card: for $a, b$ not both 0, $\gcd(a, b)$ is the largest integer dividing both;
   $\gcd(a, 0) = \lvert a \rvert$.
   Steps: (1) Listing divisors works for small numbers only. (2) Factoring big numbers is hard. (3) Euclid's
   algorithm avoids factoring entirely.

2. **scene `key-lemma` — The key lemma**
   Stage: Lemma: if $a = bq + r$ then $\gcd(a, b) = \gcd(b, r)$. `proof`: if $d \mid a$ and $d \mid b$ then $d \mid a -
   bq = r$; if $d \mid b$ and $d \mid r$ then $d \mid bq + r = a$; same common divisors, same greatest.
   Steps: (1) Common divisors of $a, b$ and of $b, r$ are the same set. (2) Each direction is the
   linear-combination fact. (3) So we may replace $(a, b)$ by the smaller pair $(b, r)$.

3. **scene `euclid` — Euclid's algorithm**
   Stage: equations appear one by one: $360 = 4 \cdot 84 + 24$, $84 = 3 \cdot 24 + 12$, $24 = 2 \cdot 12 + 0$; the
   last nonzero remainder 12 green. Beside it a $360 \times 84$ rectangle tiled by four $84$-squares, then three
   $24$-squares, then two $12$-squares (manim-style).
   Steps: (1) Divide, keep the divisor and remainder, repeat. (2) Remainders strictly decrease and stay $\ge
   0$, so the algorithm stops. (3) The last nonzero remainder is the gcd, by the lemma applied at every line.

4. **try `try-gcd` — Run Euclid**
   Prompt: Compute $\gcd(1071, 462)$.
   Answer: number 21. Hint: $1071 = 2 \cdot 462 + 147$. Solution: $1071 = 2 \cdot 462 + 147$; $462 = 3 \cdot 147 +
   21$; $147 = 7 \cdot 21 + 0$. So the gcd is 21.

5. **scene `bezout-back` — Running it backwards**
   Stage: from $84 = 3 \cdot 24 + 12$: $12 = 84 - 3 \cdot 24$; substitute $24 = 360 - 4 \cdot 84$ (the 24 boxed and
   replaced): $12 = 84 - 3(360 - 4 \cdot 84) = 13 \cdot 84 - 3 \cdot 360$; check $1092 - 1080 = 12$ (green).
   Steps: (1) Solve each line for its remainder. (2) Substitute upward, collecting multiples of the original
   numbers. (3) Always check the final combination.

6. **scene `bezout-theorem` — Bézout's identity**
   Stage: purple card: for $a, b$ not both 0, $\gcd(a, b)$ is the smallest positive element of $\{ax + by : x, y
   \in \mathbb{Z}\}$. Proof sketch: let $d$ be that smallest element (well-ordering); divide $a$ by $d$; the
   remainder is also a combination and smaller than $d$, so it is 0; so $d \mid a$, likewise $d \mid b$; any
   common divisor divides $d$. Corollaries: every common divisor divides the gcd; $\gcd(a, b) = 1 \iff \exists x,
   y,\ ax + by = 1$.
   Steps: (1) The gcd is a linear combination. (2) The proof is well-ordering plus division again. (3) "Coprime"
   means 1 is a combination.

7. **blanks `fill-bezout` — Back-substitute**
   From $1071 = 2 \cdot 462 + 147$ and $462 = 3 \cdot 147 + 21$: $21 = 1071 \cdot$ [$-3$] $+ 462 \cdot$ [$7$]
   (typed numbers).
   Solution: $21 = 462 - 3 \cdot 147 = 462 - 3(1071 - 2 \cdot 462) = 7 \cdot 462 - 3 \cdot 1071$. (Other pairs
   exist, e.g. $x = -3 + 22$, $y = 7 - 51$; this blank expects the one from back-substitution.)

8. **scene `euclid-lemma` — Euclid's lemma**
   Stage: `proof`: "Let $p$ be prime with $p \mid ab$ and $p \nmid a$." (blue) / "Then $\gcd(p, a) = 1$ (its only
   positive divisors are 1 and $p$)." / "So $px + ay = 1$ for some $x, y$." / "Multiply by $b$: $b = pbx + aby$." /
   "$p \mid pbx$ and $p \mid ab$, so $p \mid b$." (green) ∎
   Steps: (1) Primes divide a product only by dividing a factor. (2) Bézout turns "coprime" into an equation.
   (3) Multiply by $b$ and use the linear-combination fact.

9. **try `try-lemma-needs-prime` — Why prime?**
   Prompt: $6 \mid 4 \cdot 9$, but $6 \nmid 4$ and $6 \nmid 9$. What does this show?
   Answer: choice `a`. Choices: (a) Euclid's lemma needs $p$ to be prime ✓; (b) Euclid's lemma is false (it's
   stated for primes, and 6 isn't); (c) $6 \nmid 36$ (it does); (d) $\gcd(6, 4) = 1$ (it's 2, which is where the
   proof breaks).
   Hint: Which step of the proof fails for 6? Solution: $\gcd(6, 4) = 2 \ne 1$, so there is no Bézout equation
   with 1.

10. **scene `fta` — The Fundamental Theorem of Arithmetic**
    Stage: Theorem: every $n \ge 2$ is a product of primes, uniquely up to order. Existence: tag "lecture 16".
    Uniqueness sketch: $p_1 \cdots p_r = q_1 \cdots q_s$; $p_1 \mid q_1 \cdots q_s$ so $p_1 \mid q_j$ (Euclid's lemma,
    extended by induction), $p_1 = q_j$; cancel and repeat (induction on $r$). Example $360 = 2^3 \cdot 3^2 \cdot 5$.
    Steps: (1) Existence was strong induction. (2) Uniqueness needs Euclid's lemma. (3) This is why primes are
    the "atoms" of $\mathbb{Z}$.

11. **scene `gcd-factorization` — GCD and LCM from factorizations**
    Stage: $84 = 2^2 \cdot 3 \cdot 7$, $360 = 2^3 \cdot 3^2 \cdot 5$ aligned by prime; min exponents give $\gcd = 2^2
    \cdot 3 = 12$, max give $\mathrm{lcm} = 2^3 \cdot 3^2 \cdot 5 \cdot 7 = 2520$; $12 \cdot 2520 = 84 \cdot 360$.
    Steps: (1) Common divisors use each prime at most as often as both numbers do. (2) gcd: min exponents; lcm:
    max. (3) So $\gcd \cdot \mathrm{lcm} = ab$ for positive $a, b$.

12. **workout `wo-extended-euclid` — Euclid and Bézout**
    Prompt: Find $d = \gcd(252, 198)$ and integers $x, y$ with $252x + 198y = d$. Enter $d$; show $x$ and $y$ in
    your work.
    Answer: number 18. Hints: (1) $252 = 1 \cdot 198 + 54$. (2) Then back-substitute from the last nonzero
    remainder.
    Solution: $252 = 1 \cdot 198 + 54$; $198 = 3 \cdot 54 + 36$; $54 = 1 \cdot 36 + 18$; $36 = 2 \cdot 18$. So $d =
    18$. Back: $18 = 54 - 36 = 54 - (198 - 3 \cdot 54) = 4 \cdot 54 - 198 = 4(252 - 198) - 198 = 4 \cdot 252 - 5
    \cdot 198$. Check: $1008 - 990 = 18$.
    `generate(rand)`: pick $g \in \{1, \dots, 12\}$, coprime $m > n$ in $[5, 40]$; $a = gm$, $b = gn$; answer $g$;
    solution runs the algorithm (division lines) and back-substitution computed programmatically.

13. **workout `wo-coprime-divides` — Work it out**
    Prompt: Prove: if $a, b, c \in \mathbb{Z}$, $\gcd(a, b) = 1$ and $a \mid bc$, then $a \mid c$.
    Answer: proof. Hints: (1) Write 1 as a combination of $a$ and $b$. (2) Multiply by $c$.
    Solution: **Proof.** Since $\gcd(a, b) = 1$, there are $x, y \in \mathbb{Z}$ with $ax + by = 1$ (Bézout). Then
    $c = acx + bcy$. Now $a \mid acx$, and $a \mid bc$ gives $a \mid bcy$; hence $a$ divides their sum, $c$. ∎
    Rubric: invokes Bézout with the hypothesis $\gcd = 1$; multiplies by $c$ correctly; justifies $a \mid acx$ and $a
    \mid bcy$; uses the linear-combination fact to conclude.

14. **explain `cp-euclid` — Explain it back**
    Prompt: Why does Euclid's algorithm compute the gcd, and why must it stop?
    Points: each step replaces $(a, b)$ by $(b, r)$ with the same common divisors (lemma), so the gcd never
    changes; remainders form a strictly decreasing sequence of nonnegative integers, which can't go on forever
    (well-ordering); when the remainder is 0, $\gcd(d, 0) = d$; running it backwards gives Bézout coefficients.

15. **scene `recap` — Recap**
    Steps: (1) Euclid's algorithm and why it works. (2) Bézout ⇒ Euclid's lemma ⇒ unique factorization. (3) Next:
    arithmetic with remainders.

---

## 19 · `congruences` — Congruences and modular arithmetic

*Irani · Integers · Liebeck 13 · 17 min*

**Goals**
- Work with $a \equiv b \pmod n$ as an equivalence relation and do arithmetic with it
- Compute large powers modulo $n$
- Decide when $a$ has an inverse mod $n$ and compute it; solve linear congruences
- State Fermat's little theorem and use it

**Beats**

1. **scene `clock` — Clock arithmetic**
   Stage: `modClock({ n: 12 })`; the pointer moves from 9 by $+5$ to 2. Purple card: $a \equiv b \pmod n$ iff $n \mid
   (a - b)$; equivalently, $a$ and $b$ leave the same remainder on division by $n$.
   Steps: (1) Nine o'clock plus five hours is two o'clock: arithmetic that wraps around. (2) Congruent means the
   difference is a multiple of $n$. (3) The two descriptions agree by the division algorithm.

2. **scene `zn` — $\mathbb{Z}_n$**
   Stage: the three classes from lecture 14 reappear for $n = 3$; then for $n = 7$, $\mathbb{Z}_7 = \{[0], \dots,
   [6]\}$ on a `modClock({ n: 7 })`.
   Steps: (1) Congruence mod $n$ is an equivalence relation. (2) Its classes are the residue classes; the
   quotient is $\mathbb{Z}_n$. (3) We usually name a class by its remainder.

3. **scene `arithmetic` — Arithmetic respects congruence**
   Stage: Theorem: if $a \equiv b$ and $c \equiv d \pmod n$ then $a + c \equiv b + d$ and $ac \equiv bd$. `proof` of the
   product: $ac - bd = a(c - d) + d(a - b)$ (the trick term $\pm ad$ in yellow); both terms are multiples of $n$.
   Steps: (1) This is exactly the well-definedness of $+$ and $\times$ on $\mathbb{Z}_n$. (2) Add and subtract
   $ad$. (3) So we may reduce at any time during a computation.

4. **try `try-reduce` — Reduce first**
   Prompt: Find the remainder of $47 \cdot 38$ on division by 9.
   Answer: number 4. Hint: Reduce each factor mod 9 first. Solution: $47 \equiv 2$ and $38 \equiv 2$, so $47 \cdot
   38 \equiv 4 \pmod 9$. (Check: $1786 = 9 \cdot 198 + 4$.)

5. **scene `powers` — Big powers**
   Stage: `modClock({ n: 7 })`: powers of 3 hop $3, 2, 6, 4, 5, 1$ and the cycle is drawn. Then $3^{100} =
   (3^6)^{16} \cdot 3^4 \equiv 3^4 = 81 \equiv 4 \pmod 7$.
   Steps: (1) Powers mod $n$ eventually cycle. (2) Find the cycle length, here 6. (3) Write the exponent as
   $6q + r$: $100 = 6 \cdot 16 + 4$.

6. **scene `nines` — Casting out nines**
   Stage: $10 \equiv 1 \pmod 9$, so $10^k \equiv 1$; $2026 = 2 \cdot 10^3 + 0 \cdot 10^2 + 2 \cdot 10 + 6 \equiv 2 + 0 +
   2 + 6 = 10 \equiv 1 \pmod 9$.
   Steps: (1) Every number is congruent to its digit sum mod 9. (2) So $9 \mid n$ iff 9 divides the digit sum.
   (3) That's a proof of the grade-school rule.

7. **blanks `fill-power` — $2^{50} \bmod 7$**
   Typed numbers: $2^3 = 8 \equiv$ [1] $\pmod 7$; $50 = 3 \cdot$ [16] $+ 2$; so $2^{50} \equiv 2^2 =$ [4] $\pmod 7$.
   Solution: $2^{50} = (2^3)^{16} \cdot 2^2 \equiv 1 \cdot 4$.

8. **scene `inverses` — Division mod $n$**
   Stage: red: $2 \cdot 3 \equiv 2 \cdot 0 \pmod 6$ but $3 \not\equiv 0$. Purple card: $a$ has an inverse mod $n$
   ($ab \equiv 1$) iff $\gcd(a, n) = 1$. Proof sketch: $ax + ny = 1 \iff ax \equiv 1$. Example: $5 \cdot 5 = 25
   \equiv 1 \pmod{12}$, a `modClock({ n: 12 })` marking the units $1, 5, 7, 11$.
   Steps: (1) You can't cancel freely mod $n$. (2) You can cancel a factor coprime to $n$, because it has an
   inverse. (3) Bézout finds the inverse.

9. **try `try-inverse` — Find the inverse**
   Prompt: Find the inverse of 7 modulo 26, as a number between 0 and 25.
   Answer: number 15. Hint: Run Euclid on 26 and 7. Solution: $26 = 3 \cdot 7 + 5$, $7 = 5 + 2$, $5 = 2 \cdot 2 +
   1$; back-substituting, $1 = 3 \cdot 26 - 11 \cdot 7$, so $7^{-1} \equiv -11 \equiv 15$. Check $7 \cdot 15 = 105
   = 4 \cdot 26 + 1$.

10. **scene `linear-congruence` — Solving $ax \equiv b$**
    Stage: $4x \equiv 6 \pmod{10}$: $\gcd(4, 10) = 2 \mid 6$; divide through: $2x \equiv 3 \pmod 5$; $2^{-1} \equiv 3$, so
    $x \equiv 9 \equiv 4 \pmod 5$; solutions mod 10: $x \equiv 4, 9$ (both checked: $16 \equiv 6$, $36 \equiv 6$). Then
    $4x \equiv 5 \pmod{10}$: $2 \nmid 5$, no solution (red: $4x$ is even, $5 + 10k$ is odd).
    Steps: (1) $ax \equiv b \pmod n$ is solvable iff $\gcd(a, n) \mid b$. (2) Divide by the gcd, then multiply by an
    inverse. (3) There are $\gcd(a, n)$ solutions mod $n$.

11. **scene `fermat` — Fermat's little theorem**
    Stage: purple card: if $p$ is prime and $p \nmid a$, then $a^{p-1} \equiv 1 \pmod p$. `modClock({ n: 7 })`:
    multiplication by 3 sends $1, 2, 3, 4, 5, 6$ to $3, 6, 2, 5, 1, 4$ (arrows, a permutation). Products: $3^6 \cdot 6!
    \equiv 6!$; cancel $6!$ (coprime to 7).
    Steps: (1) Multiplying by $a$ shuffles the nonzero residues. (2) Multiply all of them both ways and compare.
    (3) Cancel, allowed because $(p - 1)!$ is coprime to $p$. That's why $3^6 \equiv 1 \pmod 7$.

12. **workout `wo-solve-congruence` — Solve it**
    Prompt: Solve $17x \equiv 3 \pmod{29}$. Enter the solution $x$ with $0 \le x < 29$.
    Answer: number 7. Hints: (1) Find $17^{-1} \bmod 29$ with Euclid. (2) $17^{-1} \equiv 12$.
    Solution: $29 = 17 + 12$, $17 = 12 + 5$, $12 = 2 \cdot 5 + 2$, $5 = 2 \cdot 2 + 1$. Back: $1 = 5 \cdot 5 - 2
    \cdot 12 = 5 \cdot 17 - 7 \cdot 12 = 12 \cdot 17 - 7 \cdot 29$. So $17^{-1} \equiv 12$ and $x \equiv 36 \equiv 7$.
    Check $17 \cdot 7 = 119 = 4 \cdot 29 + 3$.
    `generate(rand)`: $p \in \{11, 13, 17, 19, 23, 29, 31\}$, $a \in \{2, \dots, p - 1\}$, $b \in \{1, \dots, p - 1\}$;
    answer $x = b \cdot a^{-1} \bmod p$ (inverse by extended Euclid); solution shows the inverse and the check.

13. **workout `wo-congruence-proof` — Work it out**
    Prompt: Prove that for every $n \in \mathbb{N}$, $7 \mid 3^{2n} - 2^n$.
    Answer: proof. Hints: (1) $3^{2n} = 9^n$. (2) What is $9$ mod 7?
    Solution: **Proof.** Let $n \in \mathbb{N}$. Since $9 \equiv 2 \pmod 7$ and congruences may be multiplied,
    $9^n \equiv 2^n \pmod 7$ (formally, by induction on $n$). So $3^{2n} - 2^n = 9^n - 2^n \equiv 0 \pmod 7$, i.e. $7
    \mid 3^{2n} - 2^n$. ∎
    Rubric: rewrites $3^{2n} = 9^n$; reduces $9 \equiv 2$; justifies raising a congruence to the $n$-th power
    (product rule / induction); translates $\equiv 0$ back to divisibility. (A direct induction proof is equally
    acceptable.)

14. **explain `cp-mod-inverse` — Explain it back**
    Prompt: Explain why $a$ has a multiplicative inverse modulo $n$ exactly when $\gcd(a, n) = 1$.
    Points: $ab \equiv 1 \pmod n$ means $ab + ny = 1$ for some integer $y$; if such $b, y$ exist, any common
    divisor of $a$ and $n$ divides 1; conversely Bézout gives $ax + ny = 1$ when the gcd is 1; extended Euclid
    computes the inverse.

15. **scene `recap` — Recap**
    Steps: (1) Congruence is an equivalence relation compatible with $+$ and $\times$. (2) Powers by cycles;
    inverses iff coprime; linear congruences; Fermat. (3) Next: counting.

---

## 20 · `counting` — Products, permutations and combinations

*Liebeck 16 · 15 min*

**Goals**
- Use the sum and product rules as statements about disjoint unions and Cartesian products
- Count with inclusion–exclusion for two and three sets
- Count permutations $n!$, $P(n, k)$ and combinations $\binom{n}{k}$, deriving $\binom{n}{k} = \frac{n!}{k!(n-k)!}$ by double counting
- Spot overcounting, and write a combinatorial proof of an identity

**Beats**

1. **scene `product-rule` — The product rule**
   Stage: a tree: 26 letter branches, each splitting into 10 digit branches; "a letter then a digit": $26 \cdot 10
   = 260$. Then $\lvert A \times B \rvert = \lvert A \rvert \lvert B \rvert$ as a grid.
   Steps: (1) Counting a sequence of independent choices: multiply. (2) Formally, it is the size of a Cartesian
   product. (3) "Independent" means the number of options at each stage doesn't depend on earlier choices.

2. **scene `sum-rule` — The sum rule and inclusion–exclusion**
   Stage: `venn` of $A$ = multiples of 2 and $B$ = multiples of 3 in $\{1, \dots, 100\}$, counts in regions: $\lvert A
   \rvert = 50$, $\lvert B \rvert = 33$, $\lvert A \cap B \rvert = 16$ (multiples of 6); $\lvert A \cup B \rvert = 50 +
   33 - 16 = 67$.
   Steps: (1) For disjoint sets, sizes add. (2) If they overlap, the overlap is counted twice, so subtract it
   once. (3) Multiples of $d$ up to $N$: $\lfloor N/d \rfloor$.

3. **try `try-ie` — Inclusion–exclusion**
   Prompt: How many integers in $\{1, \dots, 1000\}$ are divisible by 3 or by 5?
   Answer: number 467. Hint: Divisible by both means divisible by 15. Solution: $333 + 200 - 66 = 467$.

4. **scene `permutations` — Arrangements**
   Stage: 8 runners, a podium with three steps filling: $8 \cdot 7 \cdot 6 = 336$; then all 8 in a line: $8!$.
   Formula cards $n!$, $P(n, k) = n!/(n - k)!$.
   Steps: (1) Choices shrink by one each time: product rule again. (2) All $n$ objects: $n!$; $0! = 1$ by
   convention. (3) Only the first $k$ places: $P(n, k)$.

5. **scene `combinations` — Choosing: double counting**
   Stage: the 4 three-element subsets of $\{a, b, c, d\}$ in a column; each expands into its 6 orderings, giving
   all $24 = P(4, 3)$ ordered triples. Then $P(n, k) = \binom{n}{k} \cdot k!$, so $\binom{n}{k} = \frac{n!}{k!(n -
   k)!}$.
   Steps: (1) Count ordered selections two ways: directly, or choose the set then order it. (2) Both counts are
   equal, so solve for $\binom{n}{k}$. (3) Double counting is a proof technique, not just a trick.

6. **blanks `fill-officers` — A club election**
   A club of 10 chooses a president, then a treasurer, then a 3-person committee from the remaining 8.
   Typed numbers: $10 \cdot$ [9] $\cdot \binom{8}{3} = 90 \cdot$ [56] $=$ [5040].
   Solution: ordered roles multiply ($10 \cdot 9$); the committee is unordered ($\binom{8}{3} = 56$).

7. **scene `overcounting` — Overcounting**
   Stage: choose 2 people from 5 girls and 5 boys with at least one girl. Wrong: "pick a girl (5), then anyone (9):
   45" in red; the pair {Ann, Bea} is shown being counted twice. Right: $\binom{10}{2} - \binom{5}{2} = 45 - 10 = 35$
   (complement), and $45 - 10 = 35$ explains the double count exactly.
   Steps: (1) "Pick a special one, then the rest" counts some outcomes more than once. (2) Count the complement
   instead, or split into disjoint cases (one girl: 25; two girls: 10). (3) Sanity-check with a small case.

8. **try `try-two-aces` — Poker hands**
   Prompt: How many 5-card hands from a standard 52-card deck contain exactly two aces?
   Answer: number 103776. Hint: Choose the aces and the non-aces separately. Solution: $\binom{4}{2}\binom{48}{3} = 6
   \cdot 17296 = 103776$.

9. **scene `combinatorial-proof` — Combinatorial proofs**
   Stage: $\binom{n}{k} = \binom{n}{n - k}$ (choosing who's in = choosing who's out, a subset and its complement
   highlighted); Pascal: $\binom{n}{k} = \binom{n - 1}{k - 1} + \binom{n - 1}{k}$ split by "is person $n$ in?". Pascal's
   triangle builds row by row.
   Steps: (1) Show two expressions count the same set. (2) Pascal's rule: split by one element. (3) No algebra
   needed, and the proof explains why the identity is true.

10. **scene `ie-three` — Three sets**
    Stage: three-set `venn`; formula $\lvert A \cup B \cup C \rvert = \sum \lvert A \rvert - \sum \lvert A \cap B \rvert +
    \lvert A \cap B \cap C \rvert$; each region gets a running tally that ends at 1. Example: multiples of 2, 3 or 5
    up to 100: $50 + 33 + 20 - 16 - 10 - 6 + 3 = 74$.
    Steps: (1) Add singles, subtract pairs, add back the triple. (2) Check: every region is counted exactly once.
    (3) So 26 numbers up to 100 are coprime to 30.

11. **workout `wo-count` — Count it**
    Prompt: How many bit strings of length 10 have exactly four 1s and start with a 1?
    Answer: number 84. Hints: (1) The first bit is fixed. (2) Choose positions for the remaining 1s.
    Solution: the first bit is 1; choose 3 of the remaining 9 positions for the other 1s: $\binom{9}{3} = 84$.
    `generate(rand)`: $n \in \{6, \dots, 12\}$, $k \in \{2, \dots, n - 2\}$; prompt with $n, k$; answer
    $\binom{n - 1}{k - 1}$.

12. **workout `wo-subsets-sum` — Work it out**
    Prompt: Give a combinatorial proof that $\displaystyle\sum_{k=0}^{n} \binom{n}{k} = 2^n$ for every $n \in
    \mathbb{Z}_{\ge 0}$.
    Answer: proof. Hints: (1) Both sides count subsets of $\{1, \dots, n\}$. (2) Count once by size, once by
    in/out choices.
    Solution: **Proof.** We count the subsets of $S = \{1, \dots, n\}$ in two ways. Each element is in or out,
    independently, so by the product rule there are $2^n$ subsets. Alternatively, the subsets of size $k$ number
    $\binom{n}{k}$, and every subset has exactly one size $k \in \{0, \dots, n\}$, so by the sum rule there are
    $\sum_{k=0}^n \binom{n}{k}$. The two counts are equal. ∎
    Rubric: names the set being counted; first count justified (product rule); second count justified (sizes
    partition the subsets, sum rule); concludes equality.

13. **explain `cp-double-count` — Explain it back**
    Prompt: Explain how double counting shows $\binom{n}{k} = \frac{n!}{k!(n - k)!}$.
    Points: count ordered selections of $k$ from $n$ directly: $n!/(n - k)!$; count them as "choose a $k$-subset,
    then order it": $\binom{n}{k} \cdot k!$; both count the same set, so they are equal; divide by $k!$.

14. **scene `recap` — Recap**
    Steps: (1) Sum and product rules; inclusion–exclusion. (2) $n!$, $P(n,k)$, $\binom{n}{k}$; beware overcounting.
    (3) Next: binomial coefficients in algebra, and pigeons.

---

## 21 · `binomial-pigeonhole` — The binomial theorem and pigeonhole

*Liebeck 16 · 14 min*

**Goals**
- State and prove the binomial theorem (combinatorially), and extract coefficients
- Derive identities by substituting into the binomial theorem
- State the pigeonhole principle (simple and generalized) as a statement about functions
- Use pigeonhole to prove existence results in number theory and geometry

**Beats**

1. **scene `expand` — Expanding by choosing**
   Stage: $(x + y)(x + y)(x + y)$ with one letter circled in each factor; all 8 choice-strings listed ($xxx, xxy,
   \dots$); those with two $x$'s and one $y$ highlighted: 3 of them; result $x^3 + 3x^2y + 3xy^2 + y^3$.
   Steps: (1) Each term of the expansion picks $x$ or $y$ from every factor. (2) The coefficient of $x^2y$ counts
   the ways to choose which factor gives the $y$. (3) That's $\binom{3}{1}$.

2. **scene `binomial-theorem` — The binomial theorem**
   Stage: $(x + y)^n = \sum_{k=0}^{n} \binom{n}{k} x^{n-k} y^k$; Pascal's triangle rows 0–5 beside it; row 3 slides
   into the coefficients of the previous slide.
   Steps: (1) The coefficient of $x^{n-k}y^k$ is the number of ways to choose the $k$ factors giving $y$.
   (2) That's the whole proof. (3) Pascal's rule from last lecture builds the coefficients.

3. **try `try-coefficient` — A coefficient**
   Prompt: What is the coefficient of $x^3$ in $(2x - 1)^5$?
   Answer: number 80. Hint: The term is $\binom{5}{3}(2x)^3(-1)^2$. Solution: $10 \cdot 8 \cdot 1 = 80$.

4. **scene `substitute` — Identities by substitution**
   Stage: $x = y = 1$: $\sum \binom{n}{k} = 2^n$; $x = 1, y = -1$: $\sum (-1)^k \binom{n}{k} = 0$ (for $n \ge 1$); row 4
   of Pascal's triangle with alternating signs: $1 - 4 + 6 - 4 + 1 = 0$.
   Steps: (1) Plug numbers into an identity of polynomials. (2) The alternating sum says even-size and odd-size
   subsets are equally many. (3) So each is $2^{n-1}$.

5. **scene `pigeonhole` — The pigeonhole principle**
   Stage: 13 dots dropping into 12 boxes (months); one box gets two (yellow). Purple card: if $\lvert A \rvert >
   \lvert B \rvert$ (finite), no function $A \to B$ is injective. Generalized: $N$ objects in $k$ boxes ⇒ some box
   holds at least $\lceil N/k \rceil$.
   Steps: (1) More pigeons than holes forces a shared hole. (2) As functions: a map to a smaller set collides.
   (3) The proof is one line: if every box held at most $\lceil N/k \rceil - 1$, there would be fewer than $N$
   objects.

6. **blanks `fill-generalized` — How many at least?**
   Typed numbers: "Among 100 people, at least [9] share a birth month." "To guarantee 3 cards of the same suit, draw
   [9] cards."
   Solution: $\lceil 100/12 \rceil = 9$; with 8 cards you could have 2 of each suit, so 9 forces 3 of one.

7. **scene `pigeon-numbers` — Pigeonhole in number theory**
   Stage: among any $n + 1$ integers, two have difference divisible by $n$: holes = remainders $0, \dots, n - 1$
   (a `modClock`), pigeons dropped onto residues; two collide. Then: any 5 numbers from $\{1, \dots, 8\}$ include
   two summing to 9; holes = pairs $\{1,8\}, \{2,7\}, \{3,6\}, \{4,5\}$.
   Steps: (1) The art is choosing the holes. (2) Same remainder means the difference is a multiple. (3) Pairs that
   sum to 9 make 4 holes for 5 pigeons.

8. **try `try-pigeon` — Pigeonhole**
   Prompt: How many numbers must you choose from $\{1, \dots, 20\}$ to guarantee two of them sum to 21?
   Answer: number 11. Hint: Pair up numbers that sum to 21. Solution: the 10 pairs $\{1, 20\}, \dots, \{10, 11\}$ are
   the holes; 11 numbers force two in one pair; 10 numbers ($1, \dots, 10$) are not enough.

9. **scene `divides-another` — A classic**
   Stage: choose $n + 1$ numbers from $\{1, \dots, 2n\}$ (with $n = 5$, the six numbers $3, 5, 6, 7, 9, 10$); each written as
   $2^a m$ with $m$ odd; holes = odd parts $1, 3, \dots, 2n - 1$ ($n$ holes); two share $m$, e.g. $3$ and $6$, so one
   divides the other.
   Steps: (1) Every positive integer is $2^a m$ with $m$ odd. (2) Only $n$ odd numbers are below $2n$. (3) Same odd
   part: the one with the smaller power of 2 divides the other.

10. **scene `pigeon-writing` — Writing a pigeonhole proof**
    Stage: a `proof` template: "Pigeons: … Holes: … Assignment: each pigeon goes to … Since … pigeons > … holes, two
    pigeons share a hole. Then …". Red example: "by pigeonhole, done" with no holes named.
    Steps: (1) Name the pigeons, the holes and the map. (2) Count both. (3) Say what sharing a hole gives you.

11. **workout `wo-pigeon` — Work it out**
    Prompt: Prove that among any 5 points in a square of side 1, some two are at distance at most $\frac{\sqrt 2}{2}$.
    Answer: proof. Hints: (1) Cut the square into 4 pieces. (2) What is the longest distance inside a square of side
    $\tfrac12$?
    Solution: **Proof.** Divide the unit square into four closed squares of side $\tfrac12$ by joining the midpoints of
    opposite sides. Each of the 5 points lies in at least one small square (assign each point to one). With 5
    points and 4 squares, two points lie in the same small square. Any two points of a square of side $\tfrac12$ are
    at distance at most its diagonal, $\tfrac{\sqrt 2}{2}$. ∎
    Rubric: explicit holes (four small squares, covering the big one); pigeons and assignment stated (points on
    shared edges handled); pigeonhole count $5 > 4$; diagonal bound justified.

12. **workout `wo-binomial` — A coefficient**
    Prompt: Find the coefficient of $x^4y^2$ in $(x - 2y)^6$.
    Answer: number 60. Hints: (1) Which $k$ gives $y^2$? (2) Don't forget the $(-2)^2$.
    Solution: $\binom{6}{2} x^4 (-2y)^2 = 15 \cdot 4\, x^4y^2$, so 60.
    `generate(rand)`: $(ax + by)^n$ with $a \in \{1, 2, 3\}$, $b \in \{-3, -2, -1, 1, 2, 3\}$, $n \in \{4, \dots,
    8\}$, $k \in \{1, \dots, n - 1\}$; ask for the coefficient of $x^{n-k}y^k$; answer $\binom{n}{k}a^{n-k}b^k$.

13. **explain `cp-pigeonhole` — Explain it back**
    Prompt: State the pigeonhole principle as a fact about functions, and explain how you choose pigeons and holes
    in a proof.
    Points: a function from a finite set to a smaller finite set is not injective; pigeons are the objects, holes
    the categories, and the function assigns each object a category; the holes must be chosen so that "two in
    one hole" gives what you want; generalized version $\lceil N/k \rceil$.

14. **scene `recap` — Recap**
    Steps: (1) Binomial theorem by choosing; substitute to get identities. (2) Pigeonhole: name pigeons, holes
    and the map. (3) Next: sizes of infinite sets.

---

## 22 · `cardinality` — Finite and countable sets

*Dumas–McCarthy 6 · Liebeck 21 · 16 min*

**Goals**
- Define $\lvert A \rvert = \lvert B \rvert$ by bijections; define finite, countably infinite and countable
- Prove that $\mathbb{N}$, the even numbers, $\mathbb{Z}$, $\mathbb{N} \times \mathbb{N}$ and $\mathbb{Q}$ are countable
- Use injections into $\mathbb{N}$ to prove countability
- Build explicit bijections between intervals

**Beats**

1. **scene `same-size` — Same size without counting**
   Stage: a `mapDiagram` of students to chairs, every chair taken, no student standing; caption "same number,
   without counting". Purple card: $\lvert A \rvert = \lvert B \rvert$ iff there is a bijection $A \to B$; $A$ is
   finite with $\lvert A \rvert = n$ iff $\lvert A \rvert = \lvert \{1, \dots, n\} \rvert$.
   Steps: (1) Bijections are how we compare sizes. (2) For finite sets, this matches counting. (3) For infinite
   sets, it's the definition, and it has surprises.

2. **scene `hilbert` — Hilbert's hotel**
   Stage: a row of rooms $1, 2, 3, \dots$ all occupied; a new guest arrives; everyone moves $n \mapsto n + 1$ (arrows);
   room 1 frees up. Then $n \mapsto 2n$: $\lvert \mathbb{N} \rvert = \lvert \{2, 4, 6, \dots\} \rvert$.
   Steps: (1) $n \mapsto n + 1$ is a bijection from $\mathbb{N}$ onto $\mathbb{N} \setminus \{1\}$. (2) An infinite set
   can be the same size as a proper subset. (3) Finite sets never are (pigeonhole).

3. **scene `integers` — $\mathbb{Z}$ is countable**
   Stage: `numberLine` $-5..5$; a path zigzags $0, 1, -1, 2, -2, \dots$ with labels $1, 2, 3, 4, 5, \dots$. Formula:
   $f(n) = n/2$ if $n$ is even, $-(n - 1)/2$ if $n$ is odd; injective and surjective sketched.
   Steps: (1) Countably infinite means: listable as $a_1, a_2, a_3, \dots$ with every element appearing once.
   (2) Listing all positives first would never reach the negatives; zigzagging reaches everything. (3) The formula
   makes it a proof.

4. **try `try-zigzag` — Where is $-7$?**
   Prompt: With $f(n) = n/2$ for even $n$ and $f(n) = -(n - 1)/2$ for odd $n$, which $n$ has $f(n) = -7$?
   Answer: number 15. Hint: Negative outputs come from odd $n$. Solution: $-(n - 1)/2 = -7 \Rightarrow n = 15$.

5. **scene `nxn` — $\mathbb{N} \times \mathbb{N}$ is countable**
   Stage: a grid of pairs $(m, n)$; a path snakes along the anti-diagonals $(1,1), (1,2), (2,1), (1,3), (2,2), \dots$
   numbering them. Then the slicker injection $(m, n) \mapsto 2^m 3^n$, injective by unique factorization (tag
   lecture 18).
   Steps: (1) Rows are infinite, so go diagonal by diagonal. (2) Each diagonal is finite, so every pair gets a
   number. (3) Or inject into $\mathbb{N}$, and use the next theorem.

6. **scene `rationals` — $\mathbb{Q}$ is countable**
   Stage: a grid of fractions $p/q$ ($p, q \in \mathbb{N}$); non-lowest-terms entries ($2/2, 2/4, \dots$) grey out; the
   diagonal path skips them. Theorem card: a nonempty set $A$ is countable iff there is an injection $A \to \mathbb{N}$
   iff there is a surjection $\mathbb{N} \to A$. Then: $\mathbb{Q}^+$ injects into $\mathbb{N} \times \mathbb{N}$ via
   lowest terms; $\mathbb{Q} = \mathbb{Q}^- \cup \{0\} \cup \mathbb{Q}^+$.
   Steps: (1) Between any two rationals lie infinitely many more, yet they can be listed. (2) Injecting into a
   countable set is enough. (3) Density is about order; countability ignores order.

7. **blanks `fill-bijections` — Write the bijection**
   - Bijection $\mathbb{N} \to \{2, 4, 6, \dots\}$: $f(n) = $ [$2n$], inverse $g(m) = $ [$m/2$]. Chips: $2n$, $n + 2$,
     $n^2$; $m/2$, $m - 2$, $2m$.
   - Bijection $\mathbb{N} \to \mathbb{Z}_{\ge 0}$: $h(n) = $ [$n - 1$]. Chips: $n - 1$, $n + 1$, $\lvert n \rvert$.
   Solution: check each inverse composes to the identity.

8. **scene `unions` — Countable unions**
   Stage: rows $A_1, A_2, A_3, \dots$, each a countable list $a_{i1}, a_{i2}, \dots$; the diagonal path again. Theorem:
   a countable union of countable sets is countable. A yellow flag: "choosing a listing of each $A_i$ uses the
   axiom of choice (lecture 24)".
   Steps: (1) Arrange the lists as rows of a grid. (2) Traverse diagonally, skipping repeats. (3) We had to pick a
   listing of every row at once, a hidden infinite choice.

9. **try `try-countable` — Countable?**
   Prompt: Which sets are countable? Select all.
   Answer: multi `['a','b','d','e']`. Choices: (a) $\mathbb{Z} \times \mathbb{Z}$ ✓; (b) the set of finite subsets
   of $\mathbb{N}$ ✓ (countable union over the largest element); (c) $\mathcal{P}(\mathbb{N})$ (not countable: next
   lecture); (d) polynomials with integer coefficients ✓ (countable union over degree); (e) finite strings over
   $\{a, \dots, z\}$ ✓ (countable union over length).
   Hint: Organize the set as a countable union of finite or countable pieces. Solution: as in the whys.

10. **scene `finite-well-defined` — Finite sizes are well-defined**
    Stage: claim: if $m \ne n$ there is no bijection $\{1, \dots, m\} \to \{1, \dots, n\}$; `mapDiagram` with $m = 4$,
    $n = 3$ and a forced collision. Proof sketch: pigeonhole, itself proved by induction on $n$. Then $\mathbb{N}$ is
    infinite: any $f\colon \{1, \dots, n\} \to \mathbb{N}$ misses $1 + \max f$.
    Steps: (1) Without this, "the number of elements" wouldn't make sense. (2) Infinite = not finite. (3) Countable
    = finite or countably infinite.

11. **workout `wo-interval-bijection` — Work it out**
    Prompt: Prove that $\lvert (0, 1) \rvert = \lvert (1, \infty) \rvert$ by showing that $f(x) = 1/x$ is a bijection
    $(0, 1) \to (1, \infty)$.
    Answer: proof. Hints: (1) First check $f$ lands in $(1, \infty)$. (2) For surjectivity, given $y > 1$, take $x =
    1/y$; check $x \in (0, 1)$.
    Solution: **Proof.** If $0 < x < 1$ then $1/x > 1$, so $f$ maps into $(1, \infty)$. *Injective:* $1/a = 1/b$ gives
    $a = b$. *Surjective:* let $y > 1$; then $x = 1/y$ satisfies $0 < x < 1$ and $f(x) = y$. So $f$ is a bijection and
    the intervals have the same cardinality. ∎
    Rubric: verifies the codomain; injectivity argument; surjectivity with the preimage shown to lie in $(0, 1)$;
    cites the definition of equal cardinality.

12. **explain `cp-countable` — Explain it back**
    Prompt: The rationals are dense: between any two there are infinitely many more. Explain why they can still be
    listed in a sequence.
    Points: countable means a bijection with $\mathbb{N}$ (a list hitting every element once); the list need not
    respect the usual order; arrange $p/q$ in a grid and traverse by diagonals (finite at each stage), skipping
    repeats, or inject into $\mathbb{N} \times \mathbb{N}$; density is an order property, countability is not.

13. **scene `recap` — Recap**
    Steps: (1) Same size = bijection. (2) $\mathbb{N}$, evens, $\mathbb{Z}$, $\mathbb{N} \times \mathbb{N}$, $\mathbb{Q}$ are
    all countable. (3) Next: a set that is too big to list.

---

## 23 · `uncountable` — Uncountable sets and Cantor's diagonal

*Dumas–McCarthy 6 · 17 min*

**Goals**
- Prove that $(0, 1)$ is uncountable with Cantor's diagonal argument, handling double decimal expansions
- Prove Cantor's theorem: no surjection $A \to \mathcal{P}(A)$
- Compare sizes with injections; state and use the Schröder–Bernstein theorem
- Place $\mathbb{N}$, $\mathbb{R}$, $\mathcal{P}(\mathbb{N})$ in the hierarchy of infinities

**Beats**

1. **scene `list-attempt` — Suppose we could list the reals**
   Stage: `digitGrid({ rows: 6, cols: 8 })` with rows $r_1 = 0.14159265\ldots$, $r_2 = 0.71828182\ldots$, $r_3 =
   0.41521356\ldots$, $r_4 = 0.57721566\ldots$, $r_5 = 0.30102999\ldots$, $r_6 = 0.69314718\ldots$, and "⋮" below.
   Steps: (1) Suppose, for contradiction, that $(0, 1)$ is countable: some list contains every number in it.
   (2) Write each in decimal. (3) We will build a number the list misses.

2. **scene `diagonal` — The diagonal**
   Stage: the diagonal digits $1, 1, 5, 2, 2, 7$ glow yellow; a new row $x$ is written below digit by digit: 5 if the
   diagonal digit isn't 5, else 4: $x = 0.554555\ldots$; then $x$ is compared with each row, the differing digit
   flashing red.
   Steps: (1) Change the $n$-th digit of the $n$-th number. (2) So $x$ differs from $r_n$ in place $n$, for every
   $n$. (3) Then $x$ is in $(0, 1)$ but not on the list: contradiction.

3. **scene `diagonal-proof` — Writing it carefully**
   Stage: `proof` lines: suppose $f\colon \mathbb{N} \to (0, 1)$ is surjective; write $f(n) = 0.d_{n1}d_{n2}\ldots$ (not
   ending in all 9s); define $x = 0.e_1e_2\ldots$ with $e_n = 5$ if $d_{nn} \ne 5$, $e_n = 4$ if $d_{nn} = 5$; $x \in (0,
   1)$ and its expansion uses no 0s or 9s, so it is its own unique expansion; $x \ne f(n)$ since they differ at digit
   $n$ (red). ∎ Aside: $0.0999\ldots = 0.1000\ldots$ with the two expansions boxed.
   Steps: (1) Some numbers have two decimal expansions. (2) Using only digits 4 and 5 for $x$ sidesteps that.
   (3) Then "different digit" really means "different number".

4. **try `try-diagonal` — Build the diagonal number**
   Prompt: The list starts $r_1 = 0.1415\ldots$, $r_2 = 0.7182\ldots$, $r_3 = 0.4152\ldots$, $r_4 = 0.5772\ldots$. Using the
   rule "digit 5 unless the diagonal digit is 5, then 4", what are the first four digits of $x$?
   Answer: choice `a`. Choices: (a) $0.5545\ldots$ ✓ (diagonal $1, 1, 5, 2$); (b) $0.5555\ldots$ (the third diagonal digit
   is 5, so $x$ needs a 4 there); (c) $0.2263\ldots$ (that's the "add 1 to each digit" rule: a valid diagonal rule, but
   not the one given); (d) $0.1152\ldots$ (that's the diagonal itself, which may well be on the list).
   Hint: Read $r_n$'s $n$-th digit. Solution: diagonal $1, 1, 5, 2$ ⇒ $x = 0.5545\ldots$.

5. **scene `why-not-q` — Why this doesn't work for $\mathbb{Q}$**
   Stage: the same construction on a list of all rationals in $(0, 1)$; the new $x$ appears with a "?" — is it
   rational? (red: no reason it should be). Then "add $x$ to the list": a new list, a new diagonal, a new $x'$.
   Steps: (1) The diagonal number differs from every listed number, but it needn't be rational. (2) So no
   contradiction for $\mathbb{Q}$, consistent with last lecture. (3) Adding $x$ doesn't help: the argument applies to
   every list.

6. **scene `comparing` — Comparing sizes**
   Stage: purple card: $\lvert A \rvert \le \lvert B \rvert$ iff there's an injection $A \to B$; Schröder–Bernstein:
   injections both ways give a bijection. Example: $[0, 1]$ vs $(0, 1)$: inclusion $(0, 1) \hookrightarrow [0, 1]$ and
   $x \mapsto x/2 + 1/4$ from $[0, 1]$ into $[1/4, 3/4] \subseteq (0, 1)$ (`numberLine` showing the squeeze). Then
   $(-1, 1) \to \mathbb{R}$, $x \mapsto x/(1 - x^2)$, so $\lvert \mathbb{R} \rvert = \lvert (0, 1) \rvert$.
   Steps: (1) Injections compare sizes. (2) Schröder–Bernstein saves us from building explicit bijections. (3) So
   all intervals have the size of $\mathbb{R}$.

7. **blanks `fill-sb` — Two injections**
   - Injection $(0, 1) \to [0, 1]$: $x \mapsto$ [$x$]. Chips: $x$, $2x$, $1/x$.
   - Injection $[0, 1] \to (0, 1)$: $x \mapsto x\,/\,$[2]$\, + 1\,/\,$[4] (both blanks typed numbers).
   Solution: the second map has image $[1/4, 3/4] \subseteq (0, 1)$ and is injective (a nonconstant linear map). By
   Schröder–Bernstein, $\lvert [0, 1] \rvert = \lvert (0, 1) \rvert$. Other correct constants exist; these are the ones
   from the slide.

8. **scene `cantor-theorem` — No set is as big as its power set**
   Stage: $A = \{1, 2, 3\}$ with a `mapDiagram` to subsets: $1 \mapsto \{1, 2\}$, $2 \mapsto \{1, 3\}$, $3 \mapsto
   \varnothing$. Build $D = \{a : a \notin f(a)\}$ element by element: $1 \in f(1)$ (out), $2 \notin f(2)$ (in), $3
   \notin f(3)$ (in): $D = \{2, 3\}$, which no arrow hits. Then the general `proof`: if $D = f(d)$, then $d \in D \iff d
   \notin f(d) = D$ (red). ∎
   Steps: (1) $D$ disagrees with $f(a)$ about the element $a$, for every $a$. (2) So $D$ is never an output: $f$ isn't
   surjective. (3) It's the diagonal argument again, in set language, and it works for every set $A$.

9. **try `try-cantor-d` — Compute $D$**
   Prompt: Let $A = \{1, 2, 3\}$ and $f(1) = \{1, 2\}$, $f(2) = \{1, 3\}$, $f(3) = \varnothing$. Find $D = \{a \in A : a
   \notin f(a)\}$.
   Answer: set `['2','3']`. Hint: Check each $a$ against its own image. Solution: $1 \in \{1, 2\}$; $2 \notin \{1, 3\}$;
   $3 \notin \varnothing$. So $D = \{2, 3\}$, and indeed no $f(a)$ equals it.

10. **scene `hierarchy` — A ladder of infinities**
    Stage: a vertical ladder: $\lvert \mathbb{N} \rvert < \lvert \mathcal{P}(\mathbb{N}) \rvert = \lvert \mathbb{R} \rvert <
    \lvert \mathcal{P}(\mathbb{R}) \rvert < \cdots$; a note: subsets of $\mathbb{N}$ ↔ 0/1 sequences ↔ binary expansions
    (sketch). Then "Is there a size strictly between $\mathbb{N}$ and $\mathbb{R}$?" — the continuum hypothesis,
    independent of the usual axioms (Gödel, Cohen).
    Steps: (1) Cantor's theorem gives infinitely many infinite sizes. (2) $\mathbb{R}$ has the size of
    $\mathcal{P}(\mathbb{N})$. (3) Whether anything lies in between can't be decided from ZFC.

11. **workout `wo-binary-sequences` — Work it out**
    Prompt: Prove that the set $S$ of all infinite sequences $(s_1, s_2, s_3, \dots)$ with each $s_i \in \{0, 1\}$ is
    uncountable.
    Answer: proof. Hints: (1) Suppose $f\colon \mathbb{N} \to S$ is surjective. (2) Flip the diagonal.
    Solution: **Proof.** Suppose, for contradiction, that $f\colon \mathbb{N} \to S$ is surjective, and write $f(n) =
    (s_{n1}, s_{n2}, \dots)$. Define $t = (t_1, t_2, \dots)$ by $t_n = 1 - s_{nn}$. Then $t \in S$. For each $n$, $t_n \ne
    s_{nn}$, so $t \ne f(n)$. Thus $t$ is not in the range of $f$, contradicting surjectivity. Since $S$ is infinite
    (e.g. the sequences with a single 1 are distinct), $S$ is uncountable. ∎
    Rubric: sets up the contradiction with an arbitrary listing/surjection; defines the diagonal sequence
    explicitly; shows it differs from every $f(n)$ at position $n$; concludes not countable (and notes $S$ is
    infinite, or argues no surjection from $\mathbb{N}$ suffices).

12. **explain `cp-diagonal` — Explain it back**
    Prompt: Explain Cantor's diagonal argument, and why the same argument doesn't prove that $\mathbb{Q}$ is
    uncountable.
    Points: any proposed list of reals determines a number differing from the $n$-th in the $n$-th digit; avoiding
    digits 0 and 9 makes "different digits" mean "different numbers"; so no list is complete; for $\mathbb{Q}$ the
    constructed number need not be rational, so no contradiction arises.

13. **scene `recap` — Recap**
    Steps: (1) $(0, 1)$, $\mathbb{R}$ and $\mathcal{P}(\mathbb{N})$ are uncountable. (2) $\lvert A \rvert <
    \lvert \mathcal{P}(A) \rvert$; Schröder–Bernstein. (3) Next: the axiom that's been hiding in our infinite choices.

---

## 24 · `choice` — The axiom of choice

*Supplement · Krantz · 14 min*

**Goals**
- State the axiom of choice in terms of choice functions
- Recognize where a proof uses choice, and where a rule makes it unnecessary
- State the equivalent forms: every surjection has a right inverse, Zorn's lemma, the well-ordering theorem
- Distinguish maximal from maximum elements in a partial order

**Beats**

1. **scene `shoes-socks` — Shoes and socks**
   Stage: an infinite row of pairs of shoes; each pair gets a green check on the left shoe ("rule: take the left").
   Then an infinite row of pairs of socks with question marks (Russell's example).
   Steps: (1) Choosing from finitely many sets needs no axiom (induction on the number of sets). (2) Infinitely
   many choices are fine when a rule picks for you. (3) For socks there is no rule, and that's what the axiom
   provides.

2. **scene `axiom` — The axiom of choice**
   Stage: purple card: for every family $\{A_i\}_{i \in I}$ of nonempty sets there is a function $c\colon I \to
   \bigcup_i A_i$ with $c(i) \in A_i$ for all $i$. Picture: sets as ovals in a row, the choice function's arrows
   picking one dot from each.
   Steps: (1) A choice function picks one element from each set at once. (2) The axiom says one exists, without
   saying how to find it. (3) Equivalently, a product of nonempty sets is nonempty.

3. **scene `sections` — Surjections have right inverses**
   Stage: a surjection $f\colon A \to B$ as a `mapDiagram` with several arrows into each $b$; for each $b$ one preimage
   is chosen (green), defining $g\colon B \to A$ with $f \circ g = \mathrm{id}_B$.
   Steps: (1) Each fiber $f^{-1}(\{b\})$ is nonempty because $f$ is onto. (2) Choice picks one point from every
   fiber. (3) "Every surjection has a right inverse" is equivalent to the axiom of choice.

4. **try `try-needs-choice` — Does it need choice?**
   Prompt: Which of these require the axiom of choice? Select all.
   Answer: multi `['b','d']`. Choices: (a) choosing an element from every nonempty subset of $\mathbb{N}$ (take the least:
   well-ordering is a rule); (b) choosing an element from every nonempty subset of $\mathbb{R}$ ✓ (no definable rule
   works for all subsets); (c) a right inverse for $f\colon \mathbb{Z} \to \mathbb{Z}_{\ge 0}$, $f(n) = \lvert n \rvert$
   (choose the nonnegative preimage); (d) one sock from each of infinitely many pairs ✓.
   Hint: Is there an explicit rule? Solution: as in the whys.

5. **scene `hidden-choice` — Choice hiding in earlier proofs**
   Stage: the countable-unions slide from lecture 22 reappears; the step "choose a listing of each $A_i$" glows
   yellow, labelled "countable choice".
   Steps: (1) Each $A_i$ has many listings, and we chose one for every $i$ at once. (2) That's a use of choice.
   (3) Most analysis uses a mild version (countable or dependent choice) without comment.

6. **scene `equivalents` — Equivalent forms**
   Stage: three cards linked by $\iff$: AC; Zorn's lemma ("if every chain in a nonempty poset has an upper bound,
   there is a maximal element"); the well-ordering theorem ("every set can be well-ordered"). Under them,
   consequences: every vector space has a basis (Math 429); any two sets are comparable in size.
   Steps: (1) These are equivalent over the other axioms of set theory. (2) Zorn's lemma is the form used in
   algebra. (3) Comparability: for any $A, B$, $\lvert A \rvert \le \lvert B \rvert$ or $\lvert B \rvert \le \lvert A
   \rvert$.

7. **blanks `fill-zorn` — State Zorn's lemma**
   Line: "If every [chain] in a nonempty partially ordered set has an [upper bound], then the set has a
   [maximal] element." Chips: `\text{chain}`, `\text{antichain}`, `\text{subset}`; `\text{upper bound}`,
   `\text{least element}`, `\text{maximal element}`; `\text{maximal}`, `\text{maximum}`, `\text{minimal}`.
   Solution: a chain is a totally ordered subset; "maximal" (nothing above it), not "maximum" (above everything).

8. **scene `maximal-maximum` — Maximal versus maximum**
   Stage: Hasse diagram of divisibility on $\{1, 2, 3, 4, 6\}$: $4$ and $6$ both glow as maximal (nothing above),
   with a red "no maximum" (neither is above the other).
   Steps: (1) Maximal: no element is strictly bigger. (2) Maximum: bigger than or equal to everything. (3) In a
   total order they agree; in a partial order there can be many maximal elements and no maximum.

9. **scene `independence` — Is choice true?**
   Stage: a timeline: Zermelo 1904 (well-ordering via AC), Gödel 1938 (AC consistent with ZF), Cohen 1963 (its
   negation consistent too). Side panel: strange consequences (Banach–Tarski, non-measurable sets) vs essential
   ones (bases, maximal ideals, Tychonoff).
   Steps: (1) AC can't be proved or refuted from the other axioms. (2) Most mathematicians accept it: ZFC. (3) It's
   good practice to notice when you use it.

10. **try `try-maximal` — Maximal elements**
    Prompt: In the poset $(\{2, 3, 4, 5, 6, 8, 9, 12\}, \mid)$, which elements are maximal? Enter the set.
    Answer: set `['5','8','9','12']`. Hint: An element is maximal if it divides nothing else in the set.
    Solution: $2 \mid 4$, $3 \mid 6$, $4 \mid 8$, $6 \mid 12$ are not maximal; $5, 8, 9, 12$ divide no other element. There
    is no maximum.

11. **workout `wo-section` — Work it out**
    Prompt: Let $f\colon A \to B$ and $g\colon B \to A$ with $f \circ g = \mathrm{id}_B$. Prove that $f$ is surjective and $g$
    is injective. (No choice needed for this direction.)
    Answer: proof. Hints: (1) For $b \in B$, what does $f$ send $g(b)$ to? (2) Apply $f$ to $g(b_1) = g(b_2)$.
    Solution: **Proof.** *Surjective:* let $b \in B$; then $f(g(b)) = \mathrm{id}_B(b) = b$, so $b$ is in the range of $f$.
    *Injective:* if $g(b_1) = g(b_2)$, applying $f$ gives $b_1 = f(g(b_1)) = f(g(b_2)) = b_2$. ∎
    Rubric: surjectivity with an arbitrary $b$ and explicit preimage $g(b)$; injectivity from $g(b_1) = g(b_2)$ by
    applying $f$; uses $f \circ g = \mathrm{id}_B$ correctly (not $g \circ f$).

12. **explain `cp-choice` — Explain it back**
    Prompt: What does the axiom of choice say? Give one construction that needs it and one that looks similar but
    doesn't.
    Points: a family of nonempty sets has a choice function; needed when infinitely many arbitrary choices must be
    made with no rule (socks, a right inverse of a general surjection, listing each of countably many sets);
    not needed when a rule exists (least element of subsets of $\mathbb{N}$, left shoes); equivalent to Zorn's lemma
    and well-ordering; independent of ZF.

13. **scene `recap` — Recap**
    Steps: (1) AC = choice functions exist. (2) Equivalents: sections of surjections, Zorn, well-ordering.
    (3) Next: the real numbers, built so that they have no gaps.

---

## 25 · `real-numbers` — The real numbers and completeness

*Dumas–McCarthy 8 · Liebeck 22 · 17 min*

**Goals**
- Define upper bounds, supremum and infimum, and use the $\varepsilon$-characterization of the supremum
- State the completeness axiom and explain why $\mathbb{Q}$ fails it
- Prove the Archimedean property and the density of $\mathbb{Q}$ in $\mathbb{R}$
- Sketch the construction of $\mathbb{R}$ by Dedekind cuts

**Beats**

1. **scene `gaps-in-q` — Holes in the rationals**
   Stage: `numberLine` $[1, 2]$ zooming in around $\sqrt 2$; rationals $1.4, 1.41, 1.414, \dots$ (blue) creep up from
   below and $1.5, 1.42, 1.415, \dots$ (orange) down from above; the spot $\sqrt 2$ is a hollow circle "not in
   $\mathbb{Q}$". $S = \{q \in \mathbb{Q} : q^2 < 2\}$.
   Steps: (1) $S$ is bounded above in $\mathbb{Q}$. (2) Every rational upper bound can be improved. (3) So $S$ has no
   least upper bound in $\mathbb{Q}$: the rationals have a hole there.

2. **scene `bounds` — Upper bounds and suprema**
   Stage: `numberLine` with $S = (0, 1)$ shaded; the region $[1, \infty)$ of upper bounds shaded green; its left end
   $1$ labelled $\sup S$. Purple card: $s = \sup S$ iff (i) $x \le s$ for all $x \in S$, and (ii) if $b$ is an upper
   bound then $s \le b$. Then $[0, 1]$: $\sup = \max = 1$.
   Steps: (1) An upper bound sits above every element. (2) The supremum is the least one. (3) The supremum
   need not belong to the set; when it does, it's the maximum.

3. **try `try-sup` — Sup and max**
   Prompt: Let $S = \{1 - 1/n : n \in \mathbb{N}\}$. Which is true?
   Answer: choice `a`. Choices: (a) $\sup S = 1$ and $S$ has no maximum ✓; (b) $\sup S = \max S = 1$ ($1 - 1/n < 1$ for
   every $n$, so $1 \notin S$); (c) $\sup S = 0$ ($0$ is the minimum); (d) $\sup S$ doesn't exist ($S$ is bounded above
   by 1).
   Hint: Is $1$ in $S$? Is anything smaller than 1 an upper bound? Solution: 1 is an upper bound; any $b < 1$ is
   beaten by $1 - 1/n$ once $1/n < 1 - b$. Proof in the workout.

4. **scene `epsilon-sup` — The $\varepsilon$ test for suprema**
   Stage: `numberLine` with a set $S$ (dots accumulating near $s$); an epsilon band $(s - \varepsilon, s]$ shaded
   yellow, always containing a dot of $S$ as $\varepsilon$ shrinks. Card: an upper bound $s$ is $\sup S$ iff $\forall
   \varepsilon > 0\ \exists x \in S,\ x > s - \varepsilon$.
   Steps: (1) "Least" means nothing smaller is an upper bound. (2) So every $s - \varepsilon$ is beaten by some
   element. (3) This is the form we use in proofs.

5. **scene `completeness` — The completeness axiom**
   Stage: a short list of ordered-field axioms (shared with $\mathbb{Q}$, muted), then the completeness axiom boxed:
   every nonempty subset of $\mathbb{R}$ that is bounded above has a supremum in $\mathbb{R}$. The hole at $\sqrt 2$
   fills in.
   Steps: (1) $\mathbb{Q}$ and $\mathbb{R}$ satisfy the same algebra and order axioms. (2) Completeness is the
   difference. (3) Everything in analysis that "converges" rests on it.

6. **scene `archimedean` — The Archimedean property**
   Stage: `proof`: Theorem: $\mathbb{N}$ is not bounded above in $\mathbb{R}$. "Suppose, for contradiction, it is." /
   "By completeness let $s = \sup \mathbb{N}$." / "$s - 1$ is not an upper bound, so some $n \in \mathbb{N}$ has $n > s -
   1$." / "Then $n + 1 > s$ and $n + 1 \in \mathbb{N}$." (red) ∎. Corollary: for every $\varepsilon > 0$ there is $n$
   with $1/n < \varepsilon$.
   Steps: (1) Obvious-looking, but it needs completeness. (2) Use the $\varepsilon$ test with $\varepsilon = 1$. (3) The
   corollary is what limit proofs use to choose $N$.

7. **blanks `fill-archimedean` — Fill in the proof**
   - "Suppose $\mathbb{N}$ is bounded above. Let $s = $ [$\sup \mathbb{N}$]." Chips: $\sup \mathbb{N}$, $\max \mathbb{N}$, $\inf
     \mathbb{N}$.
   - "Then $s - 1$ is not an [upper bound]," Chips: `\text{upper bound}`, `\text{element of } \mathbb{N}`,
     `\text{lower bound}`.
   - "so some $n \in \mathbb{N}$ has $n >$ [$s - 1$]. Then $n + 1 > s$, a contradiction." Chips: $s - 1$, $s$, $s + 1$.
   Solution: $\max \mathbb{N}$ doesn't exist; the supremum does, by completeness, if $\mathbb{N}$ were bounded.

8. **scene `density` — $\mathbb{Q}$ is dense in $\mathbb{R}$**
   Stage: `numberLine` with $a < b$ close together; zoom; tick marks at multiples of $1/n$ appear, spaced closer than
   $b - a$; one lands inside $(a, b)$: $m/n$. Proof lines: choose $n > 1/(b - a)$; let $m$ be the least integer $> na$;
   then $na < m \le na + 1 < nb$.
   Steps: (1) Make the step size $1/n$ smaller than the gap. (2) Then some multiple of $1/n$ must land in the gap.
   (3) Both choices use the Archimedean property.

9. **try `try-inf` — An infimum**
   Prompt: Find $\inf \{1/n + (-1)^n : n \in \mathbb{N}\}$.
   Answer: number -1. Hint: Look at odd and even $n$ separately. Solution: odd $n$ give $1/n - 1$, which decrease
   toward $-1$ and stay above it; even $n$ give values above 1. So every element is $> -1$, and for any $\varepsilon >
   0$ an odd $n > 1/\varepsilon$ gives an element below $-1 + \varepsilon$. The infimum $-1$ is not attained (and
   the supremum is $3/2$, attained at $n = 2$).

10. **scene `dedekind` — Building $\mathbb{R}$: Dedekind cuts**
    Stage: a cut drawn as a ray of $\mathbb{Q}$ shaded up to a point: $A \subseteq \mathbb{Q}$ nonempty, not all of
    $\mathbb{Q}$, closed downward, no largest element. $\sqrt 2 := \{q \in \mathbb{Q} : q < 0 \text{ or } q^2 < 2\}$.
    Order is $\subseteq$; the supremum of a bounded family of cuts is their union (shaded rays merging).
    Steps: (1) Define a real number as the set of rationals below it. (2) Then completeness is a theorem: the union
    of cuts is a cut. (3) Alternative construction: Cauchy sequences of rationals modulo an equivalence relation,
    another quotient, as in lecture 14.

11. **workout `wo-sup` — Work it out**
    Prompt: Let $S = \{1 - 1/n : n \in \mathbb{N}\}$. Prove that $\sup S = 1$.
    Answer: proof. Hints: (1) Show 1 is an upper bound. (2) Given $\varepsilon > 0$, use the Archimedean property to
    find an element above $1 - \varepsilon$.
    Solution: **Proof.** For every $n \in \mathbb{N}$, $1 - 1/n < 1$, so 1 is an upper bound of $S$. Let $\varepsilon >
    0$. By the Archimedean property there is $n \in \mathbb{N}$ with $n > 1/\varepsilon$, so $1/n < \varepsilon$ and $1 -
    1/n > 1 - \varepsilon$. Hence no number less than 1 is an upper bound, and $\sup S = 1$. ∎
    Rubric: upper bound shown for all $n$; arbitrary $\varepsilon > 0$; Archimedean property cited to choose $n$;
    inequality $1 - 1/n > 1 - \varepsilon$ derived; concludes via the definition or the $\varepsilon$ test.

12. **workout `wo-sup-sum` — Work it out**
    Prompt: Let $A, B \subseteq \mathbb{R}$ be nonempty and bounded above, and $A + B = \{a + b : a \in A, b \in B\}$.
    Prove $\sup(A + B) = \sup A + \sup B$.
    Answer: proof. Hints: (1) Show $\sup A + \sup B$ is an upper bound. (2) For $\varepsilon > 0$, approximate each
    supremum within $\varepsilon/2$.
    Solution: **Proof.** Let $\alpha = \sup A$, $\beta = \sup B$ (they exist by completeness). For $a \in A$, $b \in B$,
    $a + b \le \alpha + \beta$, so $\alpha + \beta$ is an upper bound of $A + B$ (which is nonempty, so $\sup(A + B)$
    exists). Let $\varepsilon > 0$. There are $a \in A$ with $a > \alpha - \varepsilon/2$ and $b \in B$ with $b > \beta -
    \varepsilon/2$; then $a + b \in A + B$ and $a + b > \alpha + \beta - \varepsilon$. So no smaller number is an
    upper bound, and $\sup(A + B) = \alpha + \beta$. ∎
    Rubric: existence of the suprema justified; upper-bound half; $\varepsilon/2$ approximations from the
    $\varepsilon$ test; the sum lies in $A + B$ and exceeds $\alpha + \beta - \varepsilon$; conclusion.

13. **explain `cp-completeness` — Explain it back**
    Prompt: What is the completeness axiom, and why does $\mathbb{Q}$ fail it?
    Points: every nonempty set bounded above has a least upper bound in the set; $\{q \in \mathbb{Q} : q^2 < 2\}$ is
    bounded in $\mathbb{Q}$ but its least upper bound would be $\sqrt 2 \notin \mathbb{Q}$; completeness is what
    separates $\mathbb{R}$ from $\mathbb{Q}$ (both are ordered fields); consequences include the Archimedean
    property and convergence theorems.

14. **scene `recap` — Recap**
    Steps: (1) Suprema and the $\varepsilon$ test. (2) Completeness ⇒ Archimedean ⇒ density of $\mathbb{Q}$;
    Dedekind cuts. (3) Next: limits, where all of this gets used.

---

## 26 · `limits` — Sequences and limits

*Dumas–McCarthy 5 · Liebeck 23 · 18 min*

**Goals**
- State the $\varepsilon$–$N$ definition of $\lim a_n = L$ and explain each quantifier
- Prove limits by finding $N$ in scratch work and writing the proof forwards
- Prove divergence by negating the definition; prove limits are unique
- Prove a limit law and state the monotone convergence theorem

**Beats**

1. **scene `intuition` — Getting close and staying close**
   Stage: `numberLine` $[-0.1, 1.1]$; $a_n = 1/n$ appears point by point, piling up near 0; then $a_n = (-1)^n/n$
   hopping on both sides of 0.
   Steps: (1) The terms get as close to 0 as we like. (2) And they stay close from some point on. (3) "As close as we
   like" and "from some point on" become $\varepsilon$ and $N$.

2. **scene `definition` — The definition**
   Stage: $\lim_{n \to \infty} a_n = L \iff \forall \varepsilon > 0\ \exists N \in \mathbb{N}\ \forall n \ge N,\ \lvert
   a_n - L \rvert < \varepsilon$, with $\varepsilon$ red, $N$ green. `numberLine` with an epsilon band around $L$ and
   an "N" marker; terms after $N$ turn green inside the band; the band shrinks and $N$ moves right.
   Steps: (1) The challenger picks a tolerance $\varepsilon$. (2) You answer with $N$, allowed to depend on
   $\varepsilon$. (3) From $N$ on, every term must lie in the band.

3. **scene `one-over-n` — First limit proof**
   Stage: scratch (left): want $1/n < \varepsilon$ ⇐ $n > 1/\varepsilon$; so choose $N > 1/\varepsilon$. `proof`
   (right): "Let $\varepsilon > 0$." / "By the Archimedean property choose $N \in \mathbb{N}$ with $N > 1/\varepsilon$." /
   "Let $n \ge N$. Then $\lvert 1/n - 0 \rvert = 1/n \le 1/N < \varepsilon$." ∎
   Steps: (1) Scratch: work backwards from the inequality you want to a condition on $n$. (2) Proof: fix
   $\varepsilon$, choose $N$, then check every $n \ge N$. (3) The Archimedean property guarantees $N$ exists.

4. **try `try-find-n` — Find $N$**
   Prompt: For $a_n = 1/n$, $L = 0$ and $\varepsilon = 0.01$, what is the smallest $N$ that works?
   Answer: number 101. Hint: You need $1/n < 0.01$ for every $n \ge N$. Solution: $1/n < 0.01 \iff n > 100$; $n = 100$
   gives exactly $0.01$, which is not $< 0.01$. So $N = 101$. (Any larger $N$ also works; the definition never asks for
   the smallest.)

5. **scene `harder-limit` — Bounding by something simpler**
   Stage: $a_n = \dfrac{2n + 1}{n + 3} \to 2$. Scratch: $\lvert a_n - 2 \rvert = \dfrac{5}{n + 3} < \dfrac{5}{n}$; want
   $5/n < \varepsilon$, so $N > 5/\varepsilon$. `proof` written forwards with the chain $\lvert a_n - 2 \rvert = 5/(n +
   3) < 5/n \le 5/N < \varepsilon$.
   Steps: (1) Simplify $\lvert a_n - L \rvert$ exactly. (2) Bound it above by something simpler that still goes to
   0. (3) Choose $N$ from the simpler bound.

6. **blanks `fill-limit` — Fill in the scratch work**
   For $a_n = \dfrac{3n - 1}{n + 2} \to 3$:
   - $\lvert a_n - 3 \rvert = $ [7] $/\,(n + 2)$: typed number.
   - $7/(n + 2) < 7\,/\,$[$n$]. Chips: $n$, $n + 3$, $n^2$.
   - "so choose $N > $ [7] $/\,\varepsilon$": typed number.
   Solution: $3n - 1 - 3(n + 2) = -7$; dropping the $+2$ makes the denominator smaller and the fraction larger.

7. **scene `divergence` — Proving divergence**
   Stage: negation slides in: $\exists \varepsilon > 0\ \forall N\ \exists n \ge N,\ \lvert a_n - L \rvert \ge
   \varepsilon$. `numberLine` with $(-1)^n$ alternating between $-1$ and $1$; for any proposed $L$ a band of radius
   $\varepsilon = 1$ can't contain both $-1$ and $1$ (distance 2) — shown for $L = 0.3$.
   Steps: (1) Not converging to $L$: some tolerance is violated arbitrarily late. (2) Divergent: that holds for
   every $L$. (3) For $(-1)^n$, $\varepsilon = 1$ works for every $L$ by the triangle inequality.

8. **scene `uniqueness` — Limits are unique**
   Stage: two candidate limits $L \ne M$ on a `numberLine`, bands of radius $\varepsilon = \lvert L - M \rvert/2$ that
   don't overlap; terms can't eventually be in both. `proof`: for $n \ge \max(N_1, N_2)$, $\lvert L - M \rvert \le
   \lvert L - a_n \rvert + \lvert a_n - M \rvert < 2\varepsilon = \lvert L - M \rvert$ (red). ∎
   Steps: (1) Choose $\varepsilon$ to separate the candidates. (2) Take $N = \max$ to use both. (3) The triangle
   inequality gives the contradiction. That's why we may write "the" limit.

9. **try `try-negation-limit` — Negate the definition**
   Prompt: Which statement means "$(a_n)$ does not converge to $L$"?
   Answer: choice `a`. Choices: (a) $\exists \varepsilon > 0\ \forall N\ \exists n \ge N,\ \lvert a_n - L \rvert \ge
   \varepsilon$ ✓; (b) $\forall \varepsilon > 0\ \exists N\ \forall n \ge N,\ \lvert a_n - L \rvert \ge \varepsilon$
   (much stronger: far away for every $\varepsilon$, eventually always); (c) $\exists \varepsilon > 0\ \exists N\
   \forall n \ge N,\ \lvert a_n - L \rvert \ge \varepsilon$ (stronger: eventually always far); (d) $\exists
   \varepsilon > 0\ \forall N\ \forall n \ge N,\ \lvert a_n - L \rvert \ge \varepsilon$ (stronger: every term from
   every point far).
   Hint: Flip each quantifier and negate $<$. Solution: (a); $(-1)^n$ with $L = 1$ satisfies (a) but not (c), since
   half its terms equal 1.

10. **scene `sum-law` — The sum law**
    Stage: `proof` of $a_n \to A,\ b_n \to B \implies a_n + b_n \to A + B$: "Let $\varepsilon > 0$." / "Choose $N_1$ with
    $\lvert a_n - A \rvert < \varepsilon/2$ for $n \ge N_1$, and $N_2$ for $b_n$." / "Let $N = \max(N_1, N_2)$." / "Then
    $\lvert (a_n + b_n) - (A + B) \rvert \le \lvert a_n - A \rvert + \lvert b_n - B \rvert < \varepsilon$." ∎ The
    $\varepsilon/2$ boxed yellow.
    Steps: (1) Spend half the tolerance on each sequence. (2) Take the later of the two cutoffs. (3) The triangle
    inequality adds the errors.

11. **scene `monotone` — Monotone convergence**
    Stage: $a_1 = 1$, $a_{n+1} = \sqrt{2 + a_n}$ on a `numberLine` $[0.8, 2.2]$: $1, 1.732, 1.932, 1.983, \dots$
    climbing toward 2 with the bound 2 drawn as a wall. Theorem card: a sequence that is increasing and bounded
    above converges to its supremum. Proof idea: $s = \sup$ (completeness); for $\varepsilon > 0$ some $a_N > s -
    \varepsilon$, and then all later terms are between $a_N$ and $s$.
    Steps: (1) Increasing and bounded: it must settle somewhere. (2) Completeness says where: at the supremum.
    (3) The limit $L$ then satisfies $L = \sqrt{2 + L}$, so $L = 2$.

12. **workout `wo-limit` — Work it out**
    Prompt: Prove from the definition that $\displaystyle\lim_{n \to \infty} \frac{n + 5}{2n - 1} = \frac12$.
    Answer: proof. Hints: (1) Compute $\lvert a_n - \tfrac12 \rvert$ exactly. (2) For $n \ge 1$, $2n - 1 \ge n$.
    Solution: **Proof.** For $n \in \mathbb{N}$, $\left\lvert \frac{n + 5}{2n - 1} - \frac12 \right\rvert = \frac{11}{2(2n -
    1)} \le \frac{11}{2n}$, since $2n - 1 \ge n > 0$. Let $\varepsilon > 0$ and choose $N \in \mathbb{N}$ with $N >
    \frac{11}{2\varepsilon}$ (Archimedean property). Then for $n \ge N$, $\left\lvert a_n - \frac12 \right\rvert \le
    \frac{11}{2n} \le \frac{11}{2N} < \varepsilon$. ∎
    Rubric: exact simplification of $\lvert a_n - \tfrac12 \rvert$; a valid simpler bound with justification; $N$
    chosen in terms of $\varepsilon$ (existence justified); the final chain of inequalities for every $n \ge N$;
    written forwards (scratch work not presented as the proof).

13. **workout `wo-bounded` — Work it out**
    Prompt: Prove that every convergent sequence is bounded.
    Answer: proof. Hints: (1) Use the definition with $\varepsilon = 1$. (2) Only finitely many terms come before $N$.
    Solution: **Proof.** Suppose $a_n \to L$. With $\varepsilon = 1$ there is $N$ such that $\lvert a_n - L \rvert < 1$
    for all $n \ge N$; then $\lvert a_n \rvert \le \lvert a_n - L \rvert + \lvert L \rvert < 1 + \lvert L \rvert$. Let $M =
    \max\{\lvert a_1 \rvert, \dots, \lvert a_{N-1} \rvert, 1 + \lvert L \rvert\}$, a maximum of finitely many numbers. Then
    $\lvert a_n \rvert \le M$ for every $n \in \mathbb{N}$. ∎
    Rubric: applies the definition with a specific $\varepsilon$; triangle inequality for the tail; handles the
    finitely many early terms; defines $M$ explicitly and checks it bounds every term.

14. **explain `cp-epsilon-n` — Explain it back**
    Prompt: Explain in your own words what $\lim a_n = L$ means, and what a proof of a specific limit has to do.
    Points: for every tolerance $\varepsilon > 0$ the terms are eventually within $\varepsilon$ of $L$; $N$ may depend on
    $\varepsilon$ but not on $n$; a proof fixes an arbitrary $\varepsilon$, produces $N$ (found by scratch work, often
    via a simpler bound and the Archimedean property), and verifies the inequality for every $n \ge N$; the order of
    the quantifiers matters.

15. **scene `recap` — Recap and farewell**
    Steps: (1) $\varepsilon$–$N$: fix $\varepsilon$, find $N$, check all $n \ge N$. (2) Divergence by negation;
    uniqueness; the sum law; monotone convergence from completeness. (3) That's the toolkit: logic, proof, sets,
    functions, relations, induction, number theory, counting, infinity and the reals. (4) You're ready for analysis
    (Math 4111) and linear algebra (Math 429), where every one of these tools gets used.
