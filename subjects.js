/**
 * Everything the hub lists. Each subject is a folder of this repo, served at <hub>/<slug>/
 * (see README.md, "Adding a subject").
 */
export const subjects = [
  {
    slug: 'dsa',
    title: 'Data Structures & Algorithms',
    course: 'CSE 2407 \u00b7 WashU',
    short: 'DSA', // button label
    blurb:
      'Lessons built around figures you can step through: balanced trees and rotations, divide-and-conquer recurrences, heaps, shortest paths. Every idea ends in a checkpoint, and practice problems walk you through the step you got wrong.',
    repo: 'https://github.com/Somebody32x2/learn/tree/main/dsa',
    topics: [
      {
        title: 'Trees & AVL rotations',
        href: 'dsa/trees/',
        meta: '9 chapters',
        blurb: 'BSTs, balance factors, single and double rotations, restructure(x), AVL insertion and deletion.',
        storage: 'tree-rotations', // localStorage namespace of the topic's checkpoint progress
      },
      {
        title: 'The master theorem',
        href: 'dsa/master/',
        meta: '8 chapters',
        blurb: 'Recursion trees, the three cases, a drill to memorize the statement, generated practice with guided walkthroughs.',
        storage: 'master',
      },
      {
        title: 'Heaps',
        href: 'dsa/heaps/',
        meta: '1 chapter',
        blurb: 'Heap order, complete binary trees stored in an array, insert with up-heap, removeMin with down-heap.',
        storage: 'heaps',
      },
      {
        title: 'Dijkstra\u2019s algorithm',
        href: 'dsa/dijkstra/',
        meta: '1 chapter',
        blurb: 'Shortest paths from one source: dist labels, edge relaxation, why the nearest vertex is final, why negative edges break it.',
        storage: 'dijkstra',
      },
    ],
    // Line-art mark for the card: a small tree beside shrinking level-cost bars.
    art: '<svg viewBox="0 0 160 72" aria-hidden="true"><path d="M30 12 16 36M30 12l14 24M16 36 9 60M16 36l7 24" /><circle cx="30" cy="12" r="6" /><circle cx="16" cy="36" r="6" /><circle cx="44" cy="36" r="6" class="dot" /><circle cx="9" cy="60" r="6" /><circle cx="23" cy="60" r="6" /><rect x="74" y="8" width="78" height="10" rx="2" /><rect x="74" y="26" width="56" height="10" rx="2" /><rect x="74" y="44" width="36" height="10" rx="2" /><rect x="74" y="62" width="18" height="6" rx="2" class="dot" /></svg>',
  },
  {
    slug: 'physics2',
    title: 'Physics II',
    course: 'PHYS 1742 \u00b7 WashU',
    short: 'Physics II',
    blurb:
      'A visual head start on the whole semester: every chapter animates the physics, says in plain words what each equation relates, and ends with a checkpoint. Fields you can drag, circuits that light up, rays you can trace.',
    repo: 'https://github.com/Somebody32x2/learn/tree/main/physics2',
    topics: [
      {
        title: 'Start here: the big picture',
        href: 'physics2/#/overview',
        meta: '21 chapters',
        blurb: 'How charges, fields, circuits, magnetism, light and the quantum fit into one story.',
        storage: 'physics2', // the whole site shares one progress namespace, so the solved count lives on this row
      },
      // Each section row opens that section's table of contents (#/toc/<slug>, slug of the group name).
      { title: 'Electric fields', href: 'physics2/#/toc/electric-fields', meta: '4 chapters', blurb: "Coulomb's law, field lines, Gauss's law, potential and voltage." },
      { title: 'Circuits', href: 'physics2/#/toc/circuits', meta: '4 chapters', blurb: 'Capacitors, current and resistance, Kirchhoff, RC charging.' },
      { title: 'Magnetism', href: 'physics2/#/toc/magnetism', meta: '4 chapters', blurb: 'F = qv \u00d7 B, fields of currents, Faraday and Lenz, LC oscillations.' },
      { title: 'Light & optics', href: 'physics2/#/toc/light-optics', meta: '4 chapters', blurb: 'EM waves, Snell and lenses, interference, diffraction.' },
      { title: 'Quantum & nuclear', href: 'physics2/#/toc/quantum-nuclear', meta: '3 chapters', blurb: 'Photons, Bohr atoms and matter waves, binding energy and decay.' },
    ],
    // Line-art mark: a charge with field lines, and a light wave.
    art: '<svg viewBox="0 0 160 72" aria-hidden="true"><path d="M30 36H6M30 36h24M30 36 13 19M30 36l17-17M30 36 13 53M30 36l17 17M30 36V8M30 36v28" style="fill:none" /><circle cx="30" cy="36" r="9" class="dot" /><path d="M26 36h8M30 32v8" style="fill:none" /><path d="M72 36c6-24 12-24 18 0s12 24 18 0 12-24 18 0 12 24 18 0" style="fill:none" /><path d="M146 30l8 6-8 6" style="fill:none" /></svg>',
  },
  {
    slug: 'matrix',
    title: 'Matrix Algebra',
    course: 'MATH 3300 \u00b7 WashU',
    short: 'Matrix Algebra',
    blurb:
      'Narrated lectures you watch like a private class: row reduction you can see, linear maps that bend the plane, determinants as area, eigenvectors that stay on their line, projections and least squares. Every few slides the lecture stops for you to try a problem; skipped ones wait in a bank.',
    repo: 'https://github.com/Somebody32x2/learn/tree/main/matrix',
    topics: [
      { title: 'All lectures', href: 'matrix/', meta: 'Lay, chapters 1\u20137', blurb: 'Linear systems, matrix algebra, determinants, vector spaces, eigenvalues, orthogonality, symmetric matrices.', storage: 'matrix' },
      { title: 'Problem bank', href: 'matrix/#/bank', meta: 'skipped problems', blurb: 'The work-it-out problems you skipped, ready when you are.' },
    ],
    art: '<svg viewBox="0 0 160 72" aria-hidden="true"><path d="M8 6v60M8 6h6M8 66h6M62 6v60M62 6h-6M62 66h-6" style="fill:none" /><rect x="16" y="12" width="12" height="12" rx="2" class="dot" /><rect x="42" y="12" width="12" height="12" rx="2" /><rect x="16" y="48" width="12" height="12" rx="2" /><rect x="42" y="48" width="12" height="12" rx="2" class="dot" /><path d="M84 62 152 62M84 62 84 8" style="fill:none" /><path d="M84 62 116 50M84 62 98 28" style="fill:none" /><path d="M116 50 130 16 98 28" style="fill:none;stroke-dasharray:3 3" /></svg>',
  },
  {
    slug: 'foundations',
    title: 'Foundations of Higher Math',
    course: 'MATH 3010 \u00b7 WashU',
    short: 'Foundations',
    blurb:
      'How mathematicians think and write: logic and quantifiers, proofs written live line by line, sets, functions, relations, induction, number theory, counting, and the infinite sizes of sets. Narrated like a 1-on-1, with proof exercises you write yourself.',
    repo: 'https://github.com/Somebody32x2/learn/tree/main/foundations',
    topics: [
      { title: 'All lectures', href: 'foundations/', meta: 'logic to the real numbers', blurb: 'Logic, proof techniques, sets, induction, functions, relations, integers, counting, cardinality, limits.', storage: 'foundations' },
      { title: 'Problem bank', href: 'foundations/#/bank', meta: 'skipped problems', blurb: 'The proofs and problems you skipped, ready when you are.' },
    ],
    art: '<svg viewBox="0 0 160 72" aria-hidden="true"><circle cx="34" cy="36" r="24" style="fill:none" /><circle cx="60" cy="36" r="24" style="fill:none" /><path d="M47 16a24 24 0 0 1 0 40a24 24 0 0 1 0-40z" class="dot" /><path d="M96 14h56M96 30h40M96 46h48M104 62h20" style="fill:none" /><rect x="140" y="56" width="10" height="10" class="dot" /></svg>',
  },
];

/** Study tools that live elsewhere on the same site. Absolute paths: they are not under the hub. */
export const tools = [
  { title: 'CSE 2407 grade calculator', href: '/CSE2407', blurb: 'What you need on the remaining exams for each letter grade.' },
];
