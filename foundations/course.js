/**
 * Foundations for Higher Mathematics (WashU MATH 3010): the course manifest read by lectern's boot(course).
 *
 * Default export, in the shape fixed by lectern/CONTRACT.md:
 *   { slug, title, course, voice, blurb, units: [{ title, lectures: [{ id, title, section, minutes, summary, load }] }] }
 * `id` is stable forever (progress keys) and names the lecture file `./lectures/<id>.js`.
 * `section` cites the readings: the course zyBook (Irani, *Discrete Mathematics*, cited by chapter name because
 * WashU uses a custom build), Dumas–McCarthy *Transition to Higher Mathematics* and Liebeck *A Concise
 * Introduction to Pure Mathematics* by chapter number. The full per-lecture plan lives in ./PLAN.md.
 */
export default {
  slug: 'foundations',
  title: 'Foundations of Higher Math',
  course: 'MATH 3010 · WashU',
  voice: 'af_heart',
  blurb:
    'Learn to read and write rigorous mathematics: logic, quantifiers, proof techniques, sets, functions, relations, induction and the integers. ' +
    'Then use those tools on counting, the sizes of infinite sets and the construction of the real numbers, with every proof written line by line.',
  units: [
    {
      title: 'Logic',
      lectures: [
        { id: 'propositions', title: 'Propositions and connectives', section: 'Irani · Logic', minutes: 12,
          summary: 'Truth tables for not, and, or; tautologies; logical equivalence and De Morgan’s laws.',
          load: () => import('./lectures/propositions.js') },
        { id: 'conditionals', title: 'Conditionals and biconditionals', section: 'Irani · Logic', minutes: 14,
          summary: 'If–then, vacuous truth, converse and contrapositive, “only if”, and negating an implication.',
          load: () => import('./lectures/conditionals.js') },
        { id: 'quantifiers', title: 'Predicates and quantifiers', section: 'Irani · Logic', minutes: 14,
          summary: 'For all and there exists, domains, witnesses and counterexamples, and negating quantified statements.',
          load: () => import('./lectures/quantifiers.js') },
        { id: 'nested-quantifiers', title: 'Nested quantifiers', section: 'Irani · Logic', minutes: 15,
          summary: 'Why order matters, quantifiers as a game, proving for-all-there-exists, and a first look at ε–N.',
          load: () => import('./lectures/nested-quantifiers.js') },
        { id: 'inference', title: 'Valid arguments and rules of inference', section: 'Irani · Logic', minutes: 13,
          summary: 'Validity, modus ponens and tollens, the two classic fallacies, and rules for quantified statements.',
          load: () => import('./lectures/inference.js') },
      ],
    },
    {
      title: 'Proof techniques',
      lectures: [
        { id: 'direct-proof', title: 'Definitions and direct proof', section: 'Irani · Proofs', minutes: 16,
          summary: 'Even, odd, divides, rational; scratch work versus the written proof; the classic mistakes.',
          load: () => import('./lectures/direct-proof.js') },
        { id: 'contrapositive-contradiction', title: 'Contrapositive and contradiction', section: 'Irani · Proofs', minutes: 16,
          summary: 'If n² is even then n is even; √2 is irrational; there are infinitely many primes.',
          load: () => import('./lectures/contrapositive-contradiction.js') },
        { id: 'cases-counterexamples', title: 'Cases, counterexamples, existence and uniqueness', section: 'Irani · Proofs · Liebeck 1', minutes: 15,
          summary: 'Exhaustive case splits, the triangle inequality, disproof by counterexample, and proving “exactly one”.',
          load: () => import('./lectures/cases-counterexamples.js') },
      ],
    },
    {
      title: 'Sets',
      lectures: [
        { id: 'sets', title: 'Sets, subsets and power sets', section: 'Irani · Sets', minutes: 14,
          summary: 'Membership versus inclusion, element-chasing proofs, double inclusion, and the power set.',
          load: () => import('./lectures/sets.js') },
        { id: 'set-operations', title: 'Set operations and identities', section: 'Irani · Sets', minutes: 15,
          summary: 'Union, intersection, difference, complement, products, indexed families, and proving set identities.',
          load: () => import('./lectures/set-operations.js') },
      ],
    },
    {
      title: 'Functions',
      lectures: [
        { id: 'functions', title: 'Functions, injections and surjections', section: 'Irani · Functions · Liebeck 19', minutes: 15,
          summary: 'Well-defined functions, domain and codomain, and proving one-to-one, onto and bijective.',
          load: () => import('./lectures/functions.js') },
        { id: 'composition-inverses', title: 'Composition, inverses, images and preimages', section: 'Irani · Functions · Dumas–McCarthy 1', minutes: 16,
          summary: 'Composing functions, inverses exactly for bijections, and which image and preimage identities hold.',
          load: () => import('./lectures/composition-inverses.js') },
      ],
    },
    {
      title: 'Relations',
      lectures: [
        { id: 'relations', title: 'Relations and their properties', section: 'Irani · Relations', minutes: 14,
          summary: 'Reflexive, symmetric, antisymmetric, transitive; partial orders and Hasse diagrams.',
          load: () => import('./lectures/relations.js') },
        { id: 'equivalence-relations', title: 'Equivalence relations and partitions', section: 'Irani · Relations · Liebeck 18', minutes: 17,
          summary: 'Equivalence classes partition a set; building ℤ and ℚ from pairs; well-defined operations on classes.',
          load: () => import('./lectures/equivalence-relations.js') },
      ],
    },
    {
      title: 'Induction',
      lectures: [
        { id: 'induction', title: 'Mathematical induction', section: 'Irani · Induction · Liebeck 8', minutes: 16,
          summary: 'Base case and inductive step for sums, inequalities and divisibility, and why induction works.',
          load: () => import('./lectures/induction.js') },
        { id: 'strong-induction', title: 'Strong induction and recursion', section: 'Irani · Induction', minutes: 15,
          summary: 'Prime factorizations, postage problems, Fibonacci bounds and minimal-counterexample proofs.',
          load: () => import('./lectures/strong-induction.js') },
      ],
    },
    {
      title: 'Integers & number theory',
      lectures: [
        { id: 'division', title: 'Divisibility and the division algorithm', section: 'Irani · Integers · Liebeck 10', minutes: 14,
          summary: 'Quotients and remainders exist and are unique, and remainders make case proofs work.',
          load: () => import('./lectures/division.js') },
        { id: 'gcd', title: 'GCD, Euclid’s algorithm and unique factorization', section: 'Irani · Integers · Liebeck 11', minutes: 17,
          summary: 'Euclid’s algorithm, Bézout’s identity, Euclid’s lemma and the Fundamental Theorem of Arithmetic.',
          load: () => import('./lectures/gcd.js') },
        { id: 'congruences', title: 'Congruences and modular arithmetic', section: 'Irani · Integers · Liebeck 13', minutes: 17,
          summary: 'Arithmetic mod n, fast powers, inverses, linear congruences and Fermat’s little theorem.',
          load: () => import('./lectures/congruences.js') },
      ],
    },
    {
      title: 'Counting',
      lectures: [
        { id: 'counting', title: 'Products, permutations and combinations', section: 'Liebeck 16', minutes: 15,
          summary: 'Sum and product rules, inclusion–exclusion, n choose k by double counting, and combinatorial proof.',
          load: () => import('./lectures/counting.js') },
        { id: 'binomial-pigeonhole', title: 'The binomial theorem and pigeonhole', section: 'Liebeck 16', minutes: 14,
          summary: 'Expanding (x + y)ⁿ by choosing, and the pigeonhole principle as a fact about functions.',
          load: () => import('./lectures/binomial-pigeonhole.js') },
      ],
    },
    {
      title: 'Cardinality',
      lectures: [
        { id: 'cardinality', title: 'Finite and countable sets', section: 'Dumas–McCarthy 6 · Liebeck 21', minutes: 16,
          summary: 'Same size means a bijection; ℕ, ℤ, ℕ × ℕ and ℚ all have the same size.',
          load: () => import('./lectures/cardinality.js') },
        { id: 'uncountable', title: 'Uncountable sets and Cantor’s diagonal', section: 'Dumas–McCarthy 6', minutes: 17,
          summary: 'The reals cannot be listed, no set is as big as its power set, and Schröder–Bernstein.',
          load: () => import('./lectures/uncountable.js') },
        { id: 'choice', title: 'The axiom of choice', section: 'Supplement · Krantz', minutes: 14,
          summary: 'Choice functions, where choice hides in earlier proofs, Zorn’s lemma and well-ordering.',
          load: () => import('./lectures/choice.js') },
      ],
    },
    {
      title: 'Real numbers & limits',
      lectures: [
        { id: 'real-numbers', title: 'The real numbers and completeness', section: 'Dumas–McCarthy 8 · Liebeck 22', minutes: 17,
          summary: 'Suprema, the completeness axiom, the Archimedean property, density of ℚ and Dedekind cuts.',
          load: () => import('./lectures/real-numbers.js') },
        { id: 'limits', title: 'Sequences and limits', section: 'Dumas–McCarthy 5 · Liebeck 23', minutes: 18,
          summary: 'The ε–N definition, limit proofs with scratch work, divergence, and monotone convergence.',
          load: () => import('./lectures/limits.js') },
      ],
    },
  ],
};
