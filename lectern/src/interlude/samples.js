/**
 * Sample interlude beats for #/kit: one of every kind and every answer type, with small linear-algebra and logic
 * examples. Default export: an array of plain interlude beats (render each with renderInterlude).
 */

const det2 = (a, b, c, d) => a * d - b * c;

export default [
  // ---------------------------------------------------------------- try
  {
    id: 'kit-try-choice',
    kind: 'try',
    title: 'Your turn',
    say: 'Pause and try this one.',
    prompt: 'In the echelon form shown, which column holds the **second** pivot?',
    figure: (s) => {
      s.tex('\\begin{bmatrix} \\boxed{1} & 2 & -1 & 3 \\\\ 0 & 0 & \\boxed{4} & 1 \\\\ 0 & 0 & 0 & 0 \\end{bmatrix}', { x: 480, y: 300, size: 64 });
    },
    answer: { type: 'choice', value: 'c3' },
    choices: [
      { id: 'c1', label: 'Column 1', why: 'Column 1 holds the first pivot.' },
      { id: 'c2', label: 'Column 2', why: 'Row 2 has a zero in column 2, so no pivot there.' },
      { id: 'c3', label: 'Column 3', why: 'The first nonzero entry of row 2 sits in column 3.' },
      { id: 'c4', label: 'Column 4', why: 'Row 2 already has a nonzero entry before column 4.' },
    ],
    hint: 'Look for the first nonzero entry of row 2.',
    solution: ['A pivot is the first nonzero entry of a nonzero row.', 'Row 2 is $(0, 0, 4, 1)$, so its pivot is in column 3.'],
  },
  {
    id: 'kit-try-multi',
    kind: 'try',
    title: 'Your turn',
    say: 'Select every statement that is a tautology.',
    prompt: 'Which of these are tautologies? Select all that apply.',
    answer: { type: 'multi', value: ['a', 'c'] },
    choices: [
      { id: 'a', label: '$P \\lor \\neg P$' },
      { id: 'b', label: '$P \\to \\neg P$', why: '$P \\to \\neg P$ is false when $P$ is true.' },
      { id: 'c', label: '$(P \\land Q) \\to P$' },
      { id: 'd', label: '$P \\to (P \\land Q)$', why: 'Take $P$ true and $Q$ false.' },
    ],
    solution: ['A tautology is true in every row of its truth table.', '$P \\lor \\neg P$ and $(P \\land Q) \\to P$ never fail; the other two fail for $P$ true.'],
  },
  {
    id: 'kit-try-number',
    kind: 'try',
    title: 'Your turn',
    say: 'Compute this determinant.',
    prompt: 'Compute $\\det \\begin{bmatrix} 2 & 1 \\\\ 3 & 4 \\end{bmatrix}$.',
    answer: { type: 'number', value: 5 },
    hint: 'For a $2 \\times 2$ matrix, $\\det = ad - bc$.',
    solution: ['$\\det = 2 \\cdot 4 - 1 \\cdot 3 = 8 - 3 = 5$.'],
  },
  {
    id: 'kit-try-vector',
    kind: 'try',
    title: 'Your turn',
    say: 'Multiply the matrix by the vector.',
    prompt: 'Compute $A\\mathbf{x}$ for $A = \\begin{bmatrix} 1 & 2 \\\\ 0 & 1 \\end{bmatrix}$ and $\\mathbf{x} = \\begin{bmatrix} 1 \\\\ 1 \\end{bmatrix}$.',
    answer: { type: 'vector', value: ['3', '1'] },
    hint: '$A\\mathbf{x}$ is $x_1$ times column 1 plus $x_2$ times column 2.',
    solution: ['$A\\mathbf{x} = 1\\begin{bmatrix}1\\\\0\\end{bmatrix} + 1\\begin{bmatrix}2\\\\1\\end{bmatrix} = \\begin{bmatrix}3\\\\1\\end{bmatrix}$.'],
  },
  {
    id: 'kit-try-matrix',
    kind: 'try',
    title: 'Your turn',
    say: 'Write down the transpose.',
    prompt: 'Write $A^T$ for $A = \\begin{bmatrix} 1 & 2 & 3 \\\\ 4 & 5 & 6 \\end{bmatrix}$.',
    answer: { type: 'matrix', value: [[1, 4], [2, 5], [3, 6]] },
    hint: 'Row $i$ of $A^T$ is column $i$ of $A$.',
    solution: ['The columns of $A$ become the rows of $A^T$.'],
  },
  {
    id: 'kit-try-text',
    kind: 'try',
    title: 'Your turn',
    say: 'Name this kind of function.',
    prompt: 'A function that is both one-to-one and onto is called ___.',
    answer: { type: 'text', accept: ['bijective', 'a bijection', 'bijection', 'one-to-one correspondence', 'a one-to-one correspondence'] },
    solution: ['One-to-one (injective) and onto (surjective) together make a **bijection**.'],
  },
  {
    id: 'kit-try-set',
    kind: 'try',
    title: 'Your turn',
    say: 'List the elements of this set.',
    prompt: 'List the elements of $\\{x \\in \\mathbb{Z} : x^2 < 5\\}$, separated by commas.',
    answer: { type: 'set', value: ['-2', '-1', '0', '1', '2'] },
    hint: 'Negative integers count too.',
    solution: ['$x^2 < 5$ holds for $x = 0, \\pm 1, \\pm 2$ and fails from $|x| = 3$ on.'],
  },

  // ---------------------------------------------------------------- blanks
  {
    id: 'kit-blanks',
    kind: 'blanks',
    title: 'Fill in the blanks',
    say: 'Fill in the missing pieces.',
    prompt: 'Complete the identities.',
    lines: [
      ['\\det(AB) = ', { id: 'a', chips: ['\\det A', '\\det B', '\\det(A+B)'], answer: '\\det A', hint: 'The determinant is multiplicative.' }, '\\cdot', { id: 'b', chips: ['\\det A', '\\det B', '\\det(A+B)'], answer: '\\det B' }],
      ['\\det\\begin{bmatrix}2&0\\\\0&3\\end{bmatrix} = ', { id: 'c', answer: { type: 'number', value: 6 }, hint: 'Multiply the diagonal entries.' }],
      ['\\neg(P \\land Q) \\equiv ', { id: 'd', chips: ['\\neg P \\lor \\neg Q', '\\neg P \\land \\neg Q', 'P \\lor Q'], answer: '\\neg P \\lor \\neg Q', hint: 'De Morgan swaps $\\land$ and $\\lor$.' }],
    ],
    solution: ['$\\det(AB) = \\det A \\cdot \\det B$.', 'A diagonal matrix has determinant equal to the product of its diagonal: $2 \\cdot 3 = 6$.', 'De Morgan: $\\neg(P \\land Q) \\equiv \\neg P \\lor \\neg Q$.'],
  },

  {
    id: 'kit-blanks-matrix',
    kind: 'blanks',
    title: 'Fill in the blanks',
    say: 'Finish the row operation.',
    prompt: 'Apply $R_2 \\to R_2 - 2R_1$ to the augmented matrix.',
    lines: [
      [
        { matrix: [['1', '2', '4'], ['2', '5', '7']], augment: 2 },
        '\\;\\sim\\;',
        {
          matrix: [
            ['1', '2', '4'],
            [{ id: 'm21', answer: { type: 'number', value: 0 }, hint: '$2 - 2 \\cdot 1$' }, { id: 'm22', answer: { type: 'number', value: 1 } }, { id: 'm23', chips: ['-1', '3', '-2'], answer: '-1', hint: '$7 - 2 \\cdot 4$' }],
          ],
          augment: 2,
        },
      ],
      ['\\mathbf{x} = ', { matrix: [[{ id: 'x1', answer: { type: 'number', value: 6 } }], [{ id: 'x2', answer: { type: 'number', value: -1 } }]] }],
    ],
    solution: ['Row 2 becomes $(2, 5, 7) - 2(1, 2, 4) = (0, 1, -1)$.', 'Back substitution: $x_2 = -1$, then $x_1 = 4 - 2x_2 = 6$.'],
  },

  {
    id: 'kit-blanks-tex',
    kind: 'blanks',
    title: 'Fill in the blanks',
    say: 'Fill in the pieces of these formulas.',
    prompt: 'Complete the inverse of a $2 \\times 2$ matrix and the length of a vector.',
    lines: [
      [
        'A^{-1} = ',
        {
          tex: '\\frac{1}{\\blank{det}} \\begin{bmatrix} d & \\blank{b} \\\\ -c & a \\end{bmatrix}',
          blanks: {
            det: { chips: ['ad - bc', 'ad + bc', 'ab - cd'], answer: 'ad - bc', hint: 'The determinant.' },
            b: { chips: ['-b', 'b', '-c'], answer: '-b', hint: 'Swap the diagonal, negate the off-diagonal.' },
          },
        },
      ],
      [
        '\\left\\| \\begin{bmatrix} 3 \\\\ 4 \\end{bmatrix} \\right\\| = ',
        { tex: '\\sqrt{3^{\\blank{p}} + 4^2} = \\blank{len}', blanks: { p: { answer: { type: 'number', value: 2 } }, len: { answer: { type: 'number', value: 5 }, hint: '$\\sqrt{25}$' } } },
      ],
    ],
    solution: ['$A^{-1} = \\frac{1}{ad - bc}\\begin{bmatrix} d & -b \\\\ -c & a \\end{bmatrix}$ when $ad - bc \\neq 0$.', '$\\sqrt{3^2 + 4^2} = \\sqrt{25} = 5$.'],
  },

  // ---------------------------------------------------------------- workout
  {
    id: 'kit-wo-matrix',
    kind: 'workout',
    title: 'Work it out',
    say: 'Grab paper and row reduce this matrix.',
    prompt: 'Row reduce $\\begin{bmatrix} 1 & 2 & 4 \\\\ 2 & 5 & 7 \\end{bmatrix}$ to reduced echelon form.',
    answer: { type: 'matrix', value: [[1, 0, 6], [0, 1, -1]] },
    hints: ['Start with $R_2 \\to R_2 - 2R_1$.', 'Then clear the entry above the second pivot with $R_1 \\to R_1 - 2R_2$.'],
    solution: ['$R_2 \\to R_2 - 2R_1$: $\\begin{bmatrix} 1 & 2 & 4 \\\\ 0 & 1 & -1 \\end{bmatrix}$.', '$R_1 \\to R_1 - 2R_2$: $\\begin{bmatrix} 1 & 0 & 6 \\\\ 0 & 1 & -1 \\end{bmatrix}$.'],
  },
  {
    id: 'kit-wo-matrix-free',
    kind: 'workout',
    title: 'Work it out',
    say: 'Find the product, including its size.',
    prompt: 'Compute $AB$ for $A = \\begin{bmatrix} 1 & 2 \\end{bmatrix}$ and $B = \\begin{bmatrix} 3 \\\\ 4 \\end{bmatrix}$, then $BA$. Enter $BA$ (pick the size yourself).',
    answer: { type: 'matrix', free: true, value: [[3, 6], [4, 8]] },
    hints: ['$B$ is $2 \\times 1$ and $A$ is $1 \\times 2$, so $BA$ is $2 \\times 2$.'],
    solution: ['$BA = \\begin{bmatrix} 3 \\\\ 4 \\end{bmatrix}\\begin{bmatrix} 1 & 2 \\end{bmatrix} = \\begin{bmatrix} 3 & 6 \\\\ 4 & 8 \\end{bmatrix}$.'],
  },
  {
    id: 'kit-wo-vector',
    kind: 'workout',
    title: 'Work it out',
    say: 'Solve the system.',
    prompt: 'Solve $x_1 + x_2 = 3$, $x_1 - x_2 = 1$. Enter $\\mathbf{x}$.',
    answer: { type: 'vector', value: ['2', '1'] },
    hints: ['Add the equations.'],
    solution: ['Adding gives $2x_1 = 4$, so $x_1 = 2$ and $x_2 = 1$.'],
  },
  {
    id: 'kit-wo-number',
    kind: 'workout',
    title: 'Work it out',
    say: 'Compute this determinant by cofactor expansion.',
    prompt: 'Compute $\\det \\begin{bmatrix} 1 & 0 & 2 \\\\ 0 & 3 & 0 \\\\ 4 & 0 & 5 \\end{bmatrix}$.',
    answer: { type: 'number', value: -9 },
    hints: ['Expand along row 2: it has only one nonzero entry.'],
    solution: ['Expanding along row 2: $\\det = 3 \\cdot \\det\\begin{bmatrix} 1 & 2 \\\\ 4 & 5 \\end{bmatrix} = 3(5 - 8) = -9$.'],
  },
  {
    id: 'kit-wo-text',
    kind: 'workout',
    title: 'Work it out',
    say: 'Name the property.',
    prompt: 'A relation that is reflexive, symmetric and transitive is called an ___ relation.',
    answer: { type: 'text', accept: ['equivalence', 'equivalence relation'] },
    solution: ['Reflexive + symmetric + transitive = an **equivalence** relation.'],
  },
  {
    id: 'kit-wo-choice',
    kind: 'workout',
    title: 'Work it out',
    say: 'Decide whether the columns are independent.',
    prompt: 'Are the columns of $\\begin{bmatrix} 1 & 2 \\\\ 2 & 4 \\end{bmatrix}$ linearly independent?',
    answer: { type: 'choice', value: 'no' },
    choices: [
      { id: 'yes', label: 'Yes, they are independent' },
      { id: 'no', label: 'No, one is a multiple of the other' },
    ],
    solution: ['Column 2 is $2 \\times$ column 1, so the columns are dependent.'],
  },
  {
    id: 'kit-wo-solution',
    kind: 'workout',
    title: 'Work it out',
    say: 'Describe every solution in parametric vector form.',
    prompt: 'Write the solution set of $x_1 + 2x_2 - x_3 = 4$ in parametric vector form: a particular solution plus free directions.',
    answer: { type: 'solution', particular: ['4', '0', '0'], basis: [['-2', '1', '0'], ['1', '0', '1']] },
    hints: ['$x_2$ and $x_3$ are free.', 'Solve for $x_1 = 4 - 2x_2 + x_3$.'],
    solution: ['$\\mathbf{x} = \\begin{bmatrix}4\\\\0\\\\0\\end{bmatrix} + x_2\\begin{bmatrix}-2\\\\1\\\\0\\end{bmatrix} + x_3\\begin{bmatrix}1\\\\0\\\\1\\end{bmatrix}$.'],
  },
  {
    id: 'kit-wo-basis',
    kind: 'workout',
    title: 'Work it out',
    say: 'Find a basis for the null space.',
    prompt: 'Find a basis for $\\operatorname{Nul} \\begin{bmatrix} 1 & 1 & 1 \\end{bmatrix}$.',
    answer: { type: 'basis', value: [['-1', '1', '0'], ['-1', '0', '1']] },
    hints: ['Two of the three variables are free.'],
    solution: ['$x_1 = -x_2 - x_3$, so $\\mathbf{x} = x_2\\begin{bmatrix}-1\\\\1\\\\0\\end{bmatrix} + x_3\\begin{bmatrix}-1\\\\0\\\\1\\end{bmatrix}$; those two vectors form a basis.'],
  },
  {
    id: 'kit-wo-proof',
    kind: 'workout',
    title: 'Work it out',
    say: 'Prove this statement.',
    prompt: 'Prove: the sum of two odd integers is even.',
    answer: { type: 'proof' },
    hints: ['Write the odd integers as $2a + 1$ and $2b + 1$.'],
    solution: ['Let $m$ and $n$ be odd. Then $m = 2a + 1$ and $n = 2b + 1$ for some integers $a, b$.', 'So $m + n = 2a + 2b + 2 = 2(a + b + 1)$.', 'Since $a + b + 1$ is an integer, $m + n$ is even. $\\blacksquare$'],
    rubric: ['Starts from arbitrary odd integers (not examples)', 'Uses the definition of odd: $2k + 1$ with $k$ an integer', 'Writes the sum as $2 \\cdot (\\text{an integer})$', 'Concludes that the sum is even'],
  },
  {
    id: 'kit-wo-generate',
    kind: 'workout',
    title: 'Work it out',
    say: 'Here is one with fresh numbers whenever you want them.',
    prompt: 'Compute $\\det \\begin{bmatrix} 3 & 1 \\\\ 2 & 2 \\end{bmatrix}$.',
    answer: { type: 'number', value: 4 },
    hints: ['$\\det = ad - bc$.'],
    solution: ['$3 \\cdot 2 - 1 \\cdot 2 = 4$.'],
    generate: (rand) => {
      const [a, b, c, d] = [rand.nonzero(-5, 5), rand.int(-5, 5), rand.int(-5, 5), rand.nonzero(-5, 5)];
      const m = `\\begin{bmatrix} ${a} & ${b} \\\\ ${c} & ${d} \\end{bmatrix}`;
      return {
        prompt: `Compute $\\det ${m}$.`,
        answer: { type: 'number', value: det2(a, b, c, d) },
        solution: [`$(${a})(${d}) - (${b})(${c}) = ${det2(a, b, c, d)}$.`],
      };
    },
  },

  // ---------------------------------------------------------------- explain
  {
    id: 'kit-explain',
    kind: 'explain',
    title: 'Explain it back',
    say: 'Before we go on, explain this in your own words.',
    prompt: 'In your own words: why does a system with more unknowns than equations never have exactly one solution?',
    points: ['Each equation gives at most one pivot, so there are fewer pivots than variables', 'Columns without a pivot give free variables', 'With a free variable, a consistent system has infinitely many solutions', 'It can also be inconsistent: zero solutions'],
  },
];
