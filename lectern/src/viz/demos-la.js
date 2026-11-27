/**
 * Demo scenes for the linear-algebra components (shapes, matrix, plane, space), shown in #/kit and meant as
 * copy-paste examples for lecture authors. Shape: [{ title, scene(s) → o, steps: [{ say, do(s, o) }] }].
 * Between them they call every animation the components offer (see docs/viz-la.md).
 */
import { C, FILL } from '../core/stage.js';
import { rref } from '../core/linalg.js';
import './shapes.js';
import './matrix.js';
import './plane.js';
import './space.js';

const RREF_DEMO = [
  [0, 2, 4, 2],
  [1, 1, 1, 3],
  [2, 4, 6, 8],
];

export default [
  {
    title: 'Shapes: lines, arrows, braces, boxes',
    scene(s) {
      const line = s.line(80, 120, 300, 120, { color: C.muted, visible: false });
      const dashed = s.line(80, 170, 300, 170, { color: C.muted, dash: true, visible: false });
      const arrow = s.arrow(380, 150, 560, 80, { color: C.blue, visible: false });
      const rect = s.rect(640, 70, 220, 120, { color: C.purple, radius: 12, fill: FILL.purple, visible: false });
      const circle = s.circle(160, 330, 70, { color: C.teal, visible: false });
      const dot = s.dot(160, 330, { color: C.red, visible: false });
      const path = s.path('M 300 380 C 360 250, 440 410, 520 300', { color: C.orange, visible: false });
      const tri = s.polygon([[620, 380], [760, 380], [690, 260]], { color: C.green, fill: FILL.green, visible: false });
      const eq = s.tex('x_1 + 2x_2 - x_3 = 4', { x: 480, y: 450, visible: false });
      return { line, dashed, arrow, rect, circle, dot, path, tri, eq };
    },
    steps: [
      { say: 'Lines draw along their length; a dash option makes them dashed.', do: (s, o) => s.all(o.line.draw(), o.dashed.draw({ delay: 200 })) },
      { say: 'An arrow grows from its tail, and its ends can move.', do: async (s, o) => { await o.arrow.draw(); await o.arrow.setEnds(380, 150, 580, 200); } },
      { say: 'Rectangles, circles and dots.', do: (s, o) => s.all(o.rect.draw(), o.circle.draw(), o.dot.draw({ delay: 500 })) },
      { say: 'Any path, and polygons that can morph.', do: async (s, o) => { await s.all(o.path.draw(), o.tri.draw()); await o.tri.morph([[620, 400], [800, 400], [800, 260]]); } },
      { say: 'Shapes are mobs: they move, pulse and recolor.', do: (s, o) => s.all(o.dot.moveTo(240, 330), o.rect.indicate(), o.circle.recolor(C.red)) },
      {
        say: 'Braces label a stretch, and surround boxes and underlines point at math.',
        do: async (s, o) => {
          await o.eq.write();
          const b = o.eq.box();
          const brace = s.brace(b.x, b.y + b.h + 22, b.x + b.w, b.y + b.h + 22, { label: '\\text{one equation}', side: 'below', visible: false });
          await brace.draw();
          const box = s.surround(o.eq, { visible: false });
          await box.draw();
          await box.retarget({ x: b.x, y: b.y, w: b.w * 0.3, h: b.h });
          await s.underline(o.eq, { color: C.blue, visible: false }).draw();
        },
      },
    ],
  },

  {
    title: 'Matrix: entries and highlights',
    scene(s) {
      const m = s.matrix(
        [
          [1, '-1/2', 3, 0, -4],
          [2, 5, '2/3', -1, 7],
          [0, -3, 1, '5/4', 2],
          [6, 1, -2, 3, '-1/3'],
        ],
        { x: 400, y: 300, augment: 4, visible: false },
      );
      return { m };
    },
    steps: [
      { say: 'A four by five augmented matrix, with fractions and negatives.', do: (s, o) => o.m.write() },
      { say: 'Highlight a row, a column, or a single entry.', do: (s, o) => s.all(o.m.highlightRow(0), o.m.highlightCol(2, C.blue), o.m.highlightCell(3, 4, C.red)) },
      { say: 'Clear them, then ring the pivots.', do: async (s, o) => { await o.m.clearHighlights(); await s.all(o.m.pivot(0, 0), o.m.pivot(1, 1, { color: C.green })); } },
      { say: 'A single entry changes: the old value slides out, the new one in.', do: (s, o) => o.m.setEntry(2, 1, 0) },
      {
        say: 'Several entries change at once, and the note beside a row says why.',
        do: (s, o) =>
          s.all(
            o.m.note(2, '\\text{new row}'),
            o.m.setRows([
              [1, '-1/2', 3, 0, -4],
              [2, 5, '2/3', -1, 7],
              [0, 0, 0, 0, 1],
              [6, 1, -2, 3, '-1/3'],
            ]),
          ),
      },
      { say: 'Clear the rings and the note.', do: (s, o) => s.all(o.m.clearPivots(), o.m.note()) },
      { say: 'Point at a row with a surround box.', do: (s, o) => s.surround(o.m.rowBox(2), { color: C.red, visible: false }).draw() },
    ],
  },

  {
    title: 'Matrix: row operations',
    scene(s) {
      const m = s.matrix(
        [
          [0, 3, -6, 6],
          [3, -7, 8, -5],
          [3, -9, 12, -9],
        ],
        { x: 380, y: 210, augment: 3, visible: false },
      );
      const det = s.matrix(
        [
          [2, 1],
          [1, 3],
        ],
        { x: 520, y: 480, size: 36, brackets: '||', visible: false },
      );
      const paren = s.matrix([[1], [-2]], { x: 760, y: 480, size: 36, brackets: '()', visible: false });
      return { m, det, paren };
    },
    steps: [
      { say: 'An augmented matrix, ready for row operations.', do: (s, o) => o.m.fadeIn() },
      { say: 'Interchange: the two rows slide past each other.', do: (s, o) => o.m.swapRows(0, 2) },
      { say: 'Scaling: every entry of the row is multiplied by the factor in the chip.', do: (s, o) => o.m.scaleRow(0, '1/3') },
      { say: 'Replacement: a scaled copy of one row slides onto another and is added.', do: (s, o) => o.m.addRow(1, 0, -3) },
      { say: 'Through rowOp, each step also writes its name beside the row.', do: (s, o) => o.m.rowOp({ op: 'add', i: 2, j: 1, k: '-3/2' }) },
      { say: 'Other bracket styles: bars for a determinant, parentheses for a vector.', do: (s, o) => s.all(o.det.fadeIn(), o.paren.fadeIn()) },
    ],
  },

  {
    title: 'Matrix: row reduction, step by step',
    scene(s) {
      const r = rref(RREF_DEMO, { augmented: 1 });
      const m = s.matrix(RREF_DEMO, { x: 360, y: 300, augment: 3, visible: false });
      return { m, r };
    },
    steps: [
      { say: 'Row reduce this augmented matrix with the algorithm from section 1.2.', do: (s, o) => o.m.fadeIn() },
      {
        say: 'Each step comes from the exact row reduction in the core library.',
        do: async (s, o) => {
          for (const step of o.r.steps) await o.m.rowOp(step);
        },
      },
      { say: 'The pivots of the reduced echelon form.', do: (s, o) => s.all(o.m.note(), ...o.r.pivots.map(([i, j]) => o.m.pivot(i, j))) },
    ],
  },

  {
    title: 'Plane: vectors, spans, lines',
    scene(s) {
      const p = s.plane({ x: 480, y: 300, width: 600, range: [-5, 5, -4, 4], names: ['x_1', 'x_2'], visible: false });
      const u = p.vector([3, 1], { color: C.blue, label: '\\mathbf{u}', visible: false });
      const v = p.vector([-1, 2], { color: C.red, label: '\\mathbf{v}', visible: false });
      const sum = p.vector([2, 3], { color: C.purple, label: '\\mathbf{u}+\\mathbf{v}', visible: false });
      const span = p.span([3, 1], { visible: false });
      const line = p.line({ a: 1, b: 1, c: 2 }, { color: C.green, visible: false });
      const pt = p.point([1, 1], { label: '(1,1)', visible: false });
      const par = p.parallelogram([3, 1], [-1, 2], { color: C.purple, visible: false });
      const tag = p.label([-3.5, 3], 'x_1 + x_2 = 2', { color: C.green, size: 32, visible: false });
      return { p, u, v, sum, span, line, pt, par, tag };
    },
    steps: [
      { say: 'A coordinate plane draws in.', do: (s, o) => o.p.draw() },
      { say: 'Vectors grow from the origin.', do: (s, o) => s.all(o.u.grow(), o.v.grow({ delay: 300 })) },
      { say: 'Tip to tail: slide v so it starts where u ends; the sum closes the triangle.', do: async (s, o) => { await o.p.addTip(o.u, o.v); await o.sum.grow(); } },
      { say: 'The parallelogram they span.', do: async (s, o) => { await o.v.moveTail([0, 0]); await o.par.draw(); } },
      { say: 'The span of u is the whole line through it.', do: (s, o) => s.all(o.par.fadeOut(), o.sum.fadeOut(), o.span.draw()) },
      { say: 'Vectors move to new coordinates.', do: (s, o) => o.u.moveTo([2, -2]) },
      { say: 'Lines from an equation, points and labels.', do: (s, o) => s.all(o.line.draw(), o.pt.draw({ delay: 400 }), o.tag.draw({ delay: 600 })) },
    ],
  },

  {
    title: 'Plane: linear maps',
    scene(s) {
      const p = s.plane({ x: 600, y: 300, width: 600, range: [-5, 5, -4, 4] });
      const b = p.basis({ visible: false });
      const v = p.vector([2, 1], { color: C.yellow, label: '\\mathbf{x}', visible: false });
      const sq = p.polygon([[0, 0], [1, 0], [1, 1], [0, 1]], { color: C.purple, visible: false });
      const pin = p.point([-3, -3], { color: C.muted, label: '\\text{fixed}', transform: false, visible: false });
      const shear = s.tex('\\begin{bmatrix}1 & 1\\\\ 0 & 1\\end{bmatrix}', { x: 140, y: 150, size: 40, visible: false });
      const rot = s.tex('\\begin{bmatrix}0 & -1\\\\ 1 & 0\\end{bmatrix}', { x: 140, y: 330, size: 40, visible: false });
      return { p, b, v, sq, pin, shear, rot };
    },
    steps: [
      { say: 'The basis vectors i hat and j hat, a vector x, and the unit square.', do: (s, o) => s.all(o.b.i.grow(), o.b.j.grow(), o.v.grow({ delay: 300 }), o.sq.draw({ delay: 300 }), o.pin.draw()) },
      { say: 'A shear moves the grid, the basis, x and the square together; the faint grid stays behind.', do: async (s, o) => { await o.shear.write(); await o.p.applyMatrix([[1, 1], [0, 1]]); } },
      { say: 'A rotation after it: the maps compose.', do: async (s, o) => { await o.rot.write(); await o.p.applyMatrix([[0, -1], [1, 0]]); } },
      { say: 'And back to where we started.', do: (s, o) => o.p.resetMatrix() },
      { say: 'A singular map squashes the plane onto a line.', do: (s, o) => o.p.applyMatrix([[1, 2], [0.5, 1]]) },
      { say: 'Reset once more: every map starts again from the identity.', do: (s, o) => o.p.resetMatrix() },
    ],
  },

  {
    title: 'Space: vectors and planes in three dimensions',
    scene(s) {
      const sp = s.space({ x: 480, y: 310, size: 460, range: 3, visible: false });
      const u = sp.vector([2, 0, 1], { color: C.blue, label: '\\mathbf{u}', visible: false });
      const v = sp.vector([0, 2, 1], { color: C.red, label: '\\mathbf{v}', visible: false });
      const P = sp.plane([2, 0, 1], [0, 2, 1], { color: C.teal, visible: false });
      const H = sp.plane({ normal: [0, 0, 1], d: -1.5 }, { color: C.purple, visible: false });
      const L = sp.line([0, 0, 0], [1, 1, -1], { color: C.orange, dash: true, visible: false });
      const pt = sp.point([2, 2, 2], { label: '(2,2,2)', visible: false });
      return { sp, u, v, P, H, L, pt };
    },
    steps: [
      { say: 'Three axes grow in.', do: (s, o) => o.sp.draw() },
      { say: 'Two vectors in space.', do: (s, o) => s.all(o.u.grow(), o.v.grow({ delay: 300 })) },
      { say: 'Their span is a plane through the origin.', do: (s, o) => o.P.draw() },
      { say: 'Turn the camera to see it edge on, then back.', do: async (s, o) => { await o.sp.rotate(-90, 5); await o.sp.rotate(-35, 20); } },
      { say: 'A plane given by a normal vector, a line and a point.', do: (s, o) => s.all(o.H.fadeIn({ shift: [0, 0] }), o.L.draw(), o.pt.draw()) },
      { say: 'A vector moves, and the camera orbits.', do: (s, o) => s.all(o.u.moveTo([1, -2, 2]), o.sp.orbit(90, 4000)) },
    ],
  },
];
