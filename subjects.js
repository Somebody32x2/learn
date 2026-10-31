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
      'Lessons built around figures you can step through: balanced trees and rotations, divide-and-conquer recurrences. Every idea ends in a checkpoint, and practice problems walk you through the step you got wrong.',
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
      { title: 'Electric fields', href: 'physics2/#/charge', meta: '4 chapters', blurb: "Coulomb's law, field lines, Gauss's law, potential and voltage." },
      { title: 'Circuits', href: 'physics2/#/capacitance', meta: '4 chapters', blurb: 'Capacitors, current and resistance, Kirchhoff, RC charging.' },
      { title: 'Magnetism', href: 'physics2/#/magnetic-force', meta: '4 chapters', blurb: 'F = qv \u00d7 B, fields of currents, Faraday and Lenz, LC oscillations.' },
      { title: 'Light & optics', href: 'physics2/#/em-waves', meta: '4 chapters', blurb: 'EM waves, Snell and lenses, interference, diffraction.' },
      { title: 'Quantum & nuclear', href: 'physics2/#/photons', meta: '3 chapters', blurb: 'Photons, Bohr atoms and matter waves, binding energy and decay.' },
    ],
    // Line-art mark: a charge with field lines, and a light wave.
    art: '<svg viewBox="0 0 160 72" aria-hidden="true"><path d="M30 36H6M30 36h24M30 36 13 19M30 36l17-17M30 36 13 53M30 36l17 17M30 36V8M30 36v28" style="fill:none" /><circle cx="30" cy="36" r="9" class="dot" /><path d="M26 36h8M30 32v8" style="fill:none" /><path d="M72 36c6-24 12-24 18 0s12 24 18 0 12-24 18 0 12 24 18 0" style="fill:none" /><path d="M146 30l8 6-8 6" style="fill:none" /></svg>',
  },
];

/** Study tools that live elsewhere on the same site. Absolute paths: they are not under the hub. */
export const tools = [
  { title: 'CSE 2407 grade calculator', href: '/CSE2407', blurb: 'What you need on the remaining exams for each letter grade.' },
];
