/**
 * #/audit and #/audit/<lecture>: a layout audit for authors (not linked from the UI).
 *
 *   renderAudit(root, { course, lectureId?, shell }) → { destroy() }
 *   window.__audit   the full report as JSON-able data (set when the run finishes)
 *
 * For every scene beat of every lecture (or one), the beat is built on one hidden but laid-out 960 × 600 stage
 * (fixed far off-screen, real DOM, scale 1) with `clock.instant`, then after each step 1..n (the starting state
 * when a beat has no steps) it measures:
 *   bounds    a visible mob (effective opacity > 0.05, not visibility:hidden) whose box leaves the stage by more
 *             than 2 px ('outside') or reaches into the 24 px safe margin ('margin'); full-stage backdrops
 *             (≥ 80 % of the stage area) are skipped
 *   small     visible text (HTML text, KaTeX, SVG <text>) whose font-size × on-screen scale is under 28 logical px,
 *             reported once per mob with its smallest size; KaTeX sub/superscripts and hidden MathML are skipped
 *   overlap   whose boxes overlap by more than 4 px both ways, ancestor/descendant pairs ignored:
 *             'text'   two visible text-bearing HTML mobs (run by run), or a text mob and an SVG text label
 *             'block'  block objects (cards, matrices, proof windows, scratch panes, truth tables, stamps, digit
 *                      grids, implication rows, and SVG components: plane, space, Venn, map, relation, number
 *                      line, dominoes, clock) against each other, and HTML blocks against text mobs. An SVG
 *                      component's box is its drawn content (visible shapes and labels), not its group frame.
 *                      Text placed on an SVG component (labels on a plane) is intended and not reported.
 *   error     an exception (or rejected Promise) from scene() or a step, or a step that waits off the stage clock
 * Each issue: { lecture, beat, step, kind, sub?, what, box, other?, otherBox?, size?, message? } (boxes in stage px).
 */
import { el, frame } from '../core/dom.js';
import { Stage, W, H } from '../core/stage.js';
import { allLectures } from './home.js';
import { isInterlude } from '../player/controls.js';

const EDGE_TOL = 2;
const SAFE = 24;
const MIN_PX = 28;
const OVERLAP_TOL = 4;
const MIN_OPACITY = 0.05;
const KINDS = ['outside', 'margin', 'small', 'overlap', 'error'];
const BLOCK_HTML = '.lx-defcard, .lx-scratch, .lx-stamp, .lx-tt, .lx-proof, .lx-impl, .lx-dg, .lx-matrix';
const BLOCK_SVG = ['lx-plane', 'lx-space', 'lx-venn', 'lx-map', 'lx-rel', 'lx-nl', 'lx-dom', 'lx-mod'];
const SHAPES = new Set(['path', 'line', 'polyline', 'polygon', 'circle', 'ellipse', 'rect', 'text', 'image', 'foreignObject']);

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));
const round = (r) => ({ x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.w), h: Math.round(r.h) });

/** Runs a step on an instant clock; resolves to null or an error message. */
async function runStep(step, stage, refs) {
  let result;
  try {
    result = step?.do?.(stage, refs);
  } catch (err) {
    return String(err?.stack ?? err);
  }
  const done = (Array.isArray(result) ? Promise.all(result) : Promise.resolve(result)).then(
    () => null,
    (err) => String(err?.stack ?? err),
  );
  const out = await Promise.race([done, tick().then(() => 'step waits on something off the stage clock (did not settle while instant)')]);
  return out;
}

export function renderAudit(root, { course, lectureId = null, shell = null }) {
  const page = el('article', { class: 'page lx-audit' });
  root.append(page);
  const status = el('p', { class: 'lx-audit-status', 'aria-live': 'polite', text: 'Starting…' });
  const table = el('table', { class: 'lx-audit-table' });
  const details = el('div', { class: 'lx-audit-details' });
  page.append(
    el('header', { class: 'lx-hero lx-audit-hero' },
      el('p', { class: 'eyebrow', text: 'Layout audit' }),
      el('h1', { text: lectureId ? `Audit: ${lectureId}` : `Audit: ${course.title}` }),
      el('p', { class: 'lede', text: `Every scene beat after every step, on a 960×600 stage: boxes outside the stage or inside the ${SAFE} px margin, text under ${MIN_PX} px, overlapping text, and errors. The report is also in window.__audit.` })),
    status, table, details);

  // the measuring stage: laid out at full size, far off-screen
  const host = el('div', { class: 'lx-audit-host', 'aria-hidden': 'true', style: { position: 'fixed', left: '-10000px', top: '0', width: `${W}px`, pointerEvents: 'none' } });
  document.body.append(host);
  const stage = new Stage(host, { label: 'Audit stage' });
  let cancelled = false;

  const lectures = allLectures(course).filter((l) => !lectureId || l.id === lectureId);
  const report = { course: course.slug, started: new Date().toISOString(), lectures: [], totals: Object.fromEntries(KINDS.map((k) => [k, 0])) };

  const run = async () => {
    await document.fonts?.ready;
    paintTable();
    for (const [i, entry] of lectures.entries()) {
      if (cancelled) return;
      status.textContent = `Auditing ${i + 1} / ${lectures.length}: ${entry.title}`;
      const lr = { id: entry.id, title: entry.title, beats: 0, steps: 0, counts: Object.fromEntries(KINDS.map((k) => [k, 0])), overlapBy: { text: 0, block: 0 }, issues: [] };
      report.lectures.push(lr);
      try {
        const mod = await entry.load();
        const lecture = mod.default ?? mod;
        for (const beat of lecture.beats ?? []) {
          if (cancelled) return;
          if (isInterlude(beat)) continue;
          lr.beats++;
          await auditBeat(stage, entry.id, beat, lr);
          await frame(); // keep the page responsive
        }
      } catch (err) {
        add(lr, { lecture: entry.id, beat: null, step: null, kind: 'error', what: 'lecture module', message: String(err?.stack ?? err) });
      }
      for (const k of KINDS) report.totals[k] += lr.counts[k];
      paintTable();
      paintDetails(lr);
    }
    report.finished = new Date().toISOString();
    window.__audit = report;
    const t = report.totals;
    status.textContent = `Done: ${lectures.length} lectures · ${t.outside} outside · ${t.margin} in the margin · ${t.small} small text · ${t.overlap} overlaps · ${t.error} errors.`;
  };

  function paintTable() {
    const head = el('tr', {}, ['Lecture', 'Beats', 'Steps', ...KINDS].map((h) => el('th', { text: h })));
    const rows = report.lectures.map((lr) =>
      el('tr', {},
        el('td', {}, el('a', { href: `#/audit/${encodeURIComponent(lr.id)}`, text: lr.id })),
        el('td', { text: String(lr.beats) }),
        el('td', { text: String(lr.steps) }),
        KINDS.map((k) => el('td', {
          class: lr.counts[k] ? 'bad' : 'ok',
          title: k === 'overlap' ? `text ${lr.overlapBy.text} · block ${lr.overlapBy.block}` : false,
          text: k === 'overlap' && lr.counts[k] ? `${lr.counts[k]} (${lr.overlapBy.block} block)` : String(lr.counts[k]),
        }))));
    const total = el('tr', { class: 'total' },
      el('td', { text: 'Total' }),
      el('td', { text: String(report.lectures.reduce((s, l) => s + l.beats, 0)) }),
      el('td', { text: String(report.lectures.reduce((s, l) => s + l.steps, 0)) }),
      KINDS.map((k) => el('td', { text: String(report.totals[k]) })));
    table.replaceChildren(el('thead', {}, head), el('tbody', {}, rows, total));
  }

  function paintDetails(lr) {
    if (!lr.issues.length) return;
    const byBeat = new Map();
    for (const it of lr.issues) {
      const key = `${it.beat ?? '(lecture)'}`;
      if (!byBeat.has(key)) byBeat.set(key, []);
      byBeat.get(key).push(it);
    }
    details.append(
      el('details', { class: 'lx-audit-lecture' },
        el('summary', { text: `${lr.id} — ${lr.issues.length} issues` }),
        [...byBeat].map(([beat, items]) =>
          el('div', { class: 'lx-audit-beat' },
            el('h3', { text: beat }),
            el('ul', {}, items.map((it) => el('li', { class: `k-${it.kind}` },
              el('code', { text: `step ${it.step ?? '-'} · ${it.kind}${it.sub ? `/${it.sub}` : ''}` }), ' ',
              describe(it))))))));
  }

  run().catch((err) => {
    status.textContent = `Audit failed: ${err?.message ?? err}`;
    console.error(err);
  });

  return {
    destroy() {
      cancelled = true;
      stage.destroy();
      host.remove();
      page.remove();
    },
  };
}

function describe(it) {
  const box = (b) => (b ? `[${b.x},${b.y} ${b.w}×${b.h}]` : '');
  if (it.kind === 'error') return it.message?.split('\n')[0] ?? '';
  if (it.kind === 'small') return `${it.what} — ${it.size.toFixed(1)} px ${box(it.box)}`;
  if (it.kind === 'overlap') return `${it.what} ${box(it.box)} ⨯ ${it.other} ${box(it.otherBox)}`;
  return `${it.what} ${box(it.box)}`;
}

function add(lr, issue) {
  lr.issues.push(issue);
  lr.counts[issue.kind === 'bounds' ? issue.sub : issue.kind]++;
  if (issue.kind === 'overlap') lr.overlapBy[issue.sub]++;
}

async function auditBeat(stage, lectureId, beat, lr) {
  stage.reset();
  stage.clock.instant = true;
  let refs = {};
  try {
    refs = beat.scene?.(stage) ?? {};
  } catch (err) {
    add(lr, { lecture: lectureId, beat: beat.id, step: 0, kind: 'error', what: 'scene()', message: String(err?.stack ?? err) });
    return;
  }
  const steps = beat.steps ?? [];
  if (!steps.length) {
    lr.steps++;
    measure(stage, lectureId, beat.id, 0, lr);
    return;
  }
  for (let k = 0; k < steps.length; k++) {
    const error = await runStep(steps[k], stage, refs);
    if (error) add(lr, { lecture: lectureId, beat: beat.id, step: k + 1, kind: 'error', what: `step ${k + 1}`, message: error });
    lr.steps++;
    measure(stage, lectureId, beat.id, k + 1, lr);
  }
}

// ---------- measuring ----------

/** Effective opacity from node up to the stage, or 0 when something on the way is visibility:hidden / display:none. */
function opacityOf(node, stop) {
  let o = 1;
  for (let n = node; n && n !== stop; n = n.parentElement) {
    const cs = getComputedStyle(n);
    if (cs.display === 'none' || cs.visibility === 'hidden' || cs.visibility === 'collapse') return 0;
    o *= Number(cs.opacity);
    if (o <= MIN_OPACITY) return 0;
  }
  return o;
}

function rel(rect, origin) {
  return { x: rect.left - origin.left, y: rect.top - origin.top, w: rect.width, h: rect.height };
}

function snippet(node) {
  const cls = [...(node.classList ?? [])].filter((c) => c !== 'lx-mob').slice(0, 3).join('.');
  const text = (node.querySelector?.('.katex-mathml annotation')?.textContent ?? node.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 48);
  return `${node.tagName.toLowerCase()}${cls ? `.${cls}` : ''}${text ? ` "${text}"` : ''}`;
}

/** Text nodes under `node` that a reader sees (skips hidden MathML, whitespace and zero-width spacers). */
function visibleTextNodes(node) {
  const out = [];
  const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, {
    acceptNode: (t) => {
      if (!/[^\s\u200b\u2060\ufeff]/.test(t.nodeValue)) return NodeFilter.FILTER_REJECT;
      const p = t.parentElement;
      if (!p || p.closest('.katex-mathml')) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  for (let t = walker.nextNode(); t; t = walker.nextNode()) out.push(t);
  return out;
}

/**
 * The text runs of a mob as boxes: one per KaTeX formula (its rendered box), one per plain text node. A mob that
 * holds many labels (axis ticks) then overlaps only where one of its labels really does.
 */
function textRuns(nodes, origin) {
  const runs = [];
  const seen = new Set();
  const range = document.createRange();
  for (const tn of nodes) {
    const k = tn.parentElement.closest('.katex-html');
    let rect;
    if (k) {
      if (seen.has(k)) continue;
      seen.add(k);
      rect = k.getBoundingClientRect();
    } else {
      range.selectNodeContents(tn);
      rect = range.getBoundingClientRect();
    }
    if (rect.width && rect.height) runs.push(rel(rect, origin));
  }
  return runs;
}

function union(boxes) {
  if (!boxes.length) return null;
  const l = Math.min(...boxes.map((b) => b.x));
  const t = Math.min(...boxes.map((b) => b.y));
  const r = Math.max(...boxes.map((b) => b.x + b.w));
  const btm = Math.max(...boxes.map((b) => b.y + b.h));
  return { x: l, y: t, w: r - l, h: btm - t };
}

/** Product of the CSS transform scales from an element up to the stage (mob scale, scaled card bodies, …). */
function scaleTo(elm, stop) {
  let k = 1;
  for (let n = elm; n && n !== stop; n = n.parentElement) {
    const tf = getComputedStyle(n).transform;
    if (tf && tf !== 'none') {
      const m = new DOMMatrixReadOnly(tf);
      k *= Math.hypot(m.a, m.b);
    }
  }
  return k;
}

/** Rendered font size of an HTML element's text in stage px (computed size × transform scale). */
function htmlTextPx(elm, stop) {
  return parseFloat(getComputedStyle(elm).fontSize) * scaleTo(elm, stop);
}

function svgTextPx(elm) {
  const fs = parseFloat(getComputedStyle(elm).fontSize);
  const m = elm.getScreenCTM();
  return fs * (m ? Math.hypot(m.a, m.b) : 1);
}

function overlaps(a, b) {
  const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
  const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
  return w > OVERLAP_TOL && h > OVERLAP_TOL;
}

function measure(stage, lectureId, beatId, step, lr) {
  const inner = stage.inner;
  const origin = inner.getBoundingClientRect();
  const base = { lecture: lectureId, beat: beatId, step };
  const mobs = [...stage.mobs].filter((m) => m.node?.isConnected && inner.contains(m.node));

  // (a) bounds, per mob
  for (const mob of mobs) {
    const node = mob.node;
    if (opacityOf(node, inner) <= MIN_OPACITY) continue;
    const r = node.getBoundingClientRect();
    if (!r.width && !r.height) continue;
    const box = rel(r, origin);
    if (box.w * box.h >= 0.8 * W * H) continue; // a backdrop
    const outside = box.x < -EDGE_TOL || box.y < -EDGE_TOL || box.x + box.w > W + EDGE_TOL || box.y + box.h > H + EDGE_TOL;
    const margin = !outside && (box.x < SAFE - EDGE_TOL || box.y < SAFE - EDGE_TOL || box.x + box.w > W - SAFE + EDGE_TOL || box.y + box.h > H - SAFE + EDGE_TOL);
    if (outside || margin) add(lr, { ...base, kind: 'bounds', sub: outside ? 'outside' : 'margin', what: snippet(node), box: round(box) });
  }

  // visible text in HTML mobs, each text node owned by its innermost mob; visible SVG text labels
  const mobNodes = new Set(mobs.filter((m) => stage.html.contains(m.node)).map((m) => m.node));
  const owned = new Map(); // mob node → text nodes
  for (const node of mobNodes) {
    for (const t of visibleTextNodes(node)) {
      let owner = t.parentElement;
      while (owner && !mobNodes.has(owner)) owner = owner.parentElement;
      if (owner !== node) continue;
      if (opacityOf(t.parentElement, inner) <= MIN_OPACITY) continue;
      if (!owned.has(node)) owned.set(node, []);
      owned.get(node).push(t);
    }
  }
  const textMobs = [...owned].map(([node, texts]) => {
    const runs = textRuns(texts, origin);
    return { node, texts, runs, box: union(runs) };
  });
  // only labels drawn directly on the stage's SVG layers (component internals use their own <svg>s too)
  const labels = [...inner.querySelectorAll(':scope > svg text')]
    .filter((t) => /[^\s\u200b]/.test(t.textContent) && opacityOf(t, inner) > MIN_OPACITY)
    .map((t) => ({ node: t, box: rel(t.getBoundingClientRect(), origin) }))
    .filter((t) => t.box.w && t.box.h);

  // (b) small text: smallest rendered size per mob (HTML) or per label (SVG)
  for (const tm of textMobs) {
    let min = Infinity;
    for (const t of tm.texts) {
      const p = t.parentElement;
      if (p.closest('.msupsub')) continue; // KaTeX sub/superscripts are small by design
      min = Math.min(min, htmlTextPx(p, inner));
    }
    if (min < MIN_PX - 0.25) add(lr, { ...base, kind: 'small', what: snippet(tm.node), size: min, box: round(tm.box ?? rel(tm.node.getBoundingClientRect(), origin)) });
  }
  for (const lb of labels) {
    const px = svgTextPx(lb.node);
    if (px < MIN_PX - 0.25) add(lr, { ...base, kind: 'small', what: snippet(lb.node), size: px, box: round(lb.box) });
  }

  // (c) overlaps, run against run: text mob × text mob (neither inside the other), text mob × SVG label
  const ids = new Map();
  const idOf = (n) => (ids.has(n) ? ids.get(n) : (ids.set(n, ids.size), ids.size - 1));
  const reported = new Set();
  const pairKey = (a, b) => [idOf(a), idOf(b)].sort((x, y) => x - y).join('|');
  const report = (sub, a, aBox, b, bBox) => {
    const key = pairKey(a, b);
    if (reported.has(key)) return;
    reported.add(key);
    add(lr, { ...base, kind: 'overlap', sub, what: snippet(a), box: round(aBox), other: snippet(b), otherBox: round(bBox) });
  };
  const related = (a, b) => a.contains(b) || b.contains(a);
  const hit = (runsA, runsB) => {
    for (const a of runsA) for (const b of runsB) if (overlaps(a, b)) return [a, b];
    return null;
  };
  for (let i = 0; i < textMobs.length; i++) {
    const a = textMobs[i];
    for (let j = i + 1; j < textMobs.length; j++) {
      const b = textMobs[j];
      if (related(a.node, b.node)) continue;
      const h = hit(a.runs, b.runs);
      if (h) report('text', a.node, h[0], b.node, h[1]);
    }
    for (const lb of labels) {
      const h = hit(a.runs, [lb.box]);
      if (h) report('text', a.node, h[0], lb.node, h[1]);
    }
  }

  // block objects: frames (HTML) or drawn content (SVG components) against each other and against text mobs
  const blocks = [];
  for (const mob of mobs) {
    const node = mob.node;
    const isSvg = BLOCK_SVG.some((c) => node.classList?.contains(c));
    if (!isSvg && !node.matches?.(BLOCK_HTML)) continue;
    const o = opacityOf(node, inner);
    if (o <= MIN_OPACITY) continue;
    const box = isSvg ? drawnBox(node, o, origin) : rel(node.getBoundingClientRect(), origin);
    if (box && box.w > 0 && box.h > 0) blocks.push({ node, box, svg: isSvg });
  }
  for (let i = 0; i < blocks.length; i++) {
    const a = blocks[i];
    for (let j = i + 1; j < blocks.length; j++) {
      const b = blocks[j];
      if (!related(a.node, b.node) && overlaps(a.box, b.box)) report('block', a.node, a.box, b.node, b.box);
    }
    if (a.svg) continue; // labels on a figure are intended
    for (const t of textMobs) {
      if (related(a.node, t.node)) continue;
      const h = hit([a.box], t.runs);
      if (h) report('block', a.node, h[0], t.node, h[1]);
    }
  }
}

/** Union of the visible drawn shapes of an SVG component (its content, not its group frame). */
function drawnBox(root, rootOpacity, origin) {
  const boxes = [];
  const visit = (n, o) => {
    for (const c of n.children) {
      const cs = getComputedStyle(c);
      if (cs.display === 'none' || cs.visibility === 'hidden') continue;
      const co = o * Number(cs.opacity);
      if (co <= MIN_OPACITY) continue;
      if (SHAPES.has(c.localName)) {
        const r = c.getBoundingClientRect();
        if (r.width || r.height) boxes.push(rel(r, origin));
      } else visit(c, co);
    }
  };
  visit(root, rootOpacity);
  return union(boxes);
}
