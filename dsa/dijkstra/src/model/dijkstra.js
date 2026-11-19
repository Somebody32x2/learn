/**
 * Dijkstra's algorithm: model and frame builders (no DOM). Every figure and quiz answer in the Dijkstra
 * compartment comes from here.
 *
 * A graph is { directed, vertices: [{ id, x, y }], edges: [[from, to, weight]] }. Positions are layout only.
 *
 *   dijkstra(graph, source)    { dist, parent, order, steps }   the run, one step per event
 *   bellmanFord(graph, source) { dist }                         reference distances (any weights, no negative cycle)
 *   graphFrame(graph, opts)    one frame: the graph, a dist[v] label beside every vertex, the queue below
 *   runFrames(graph, source)   one frame per step of dijkstra(graph, source)
 *   improved(run)              vertices whose finite dist[v] was lowered later (relaxation found a shorter path)
 *
 * Follows Goodrich & Tamassia (they write D[v]; the lesson writes dist[v]): every vertex starts in the
 * priority queue keyed by dist (0 at the source, infinity elsewhere); removeMin pulls u into the cloud, its
 * dist is final; then every edge (u, z) with z still in the queue is relaxed, and an improvement is a
 * replaceKey. The queue is kept as a list sorted by (dist, name): any correct priority queue removes the
 * same vertex when ties go to the earlier name, so the trace is the one a heap would give.
 * If removeMin returns a vertex with dist infinity, nothing left is reachable and the run stops.
 *
 * Item ids: vertex `v<id>`, its label `d<id>`, queue entry `q<id>`, queue caption `qhead`.
 * Link ids: `e<from>-<to>` (undirected graphs: the edge as listed).
 */

const INF = Infinity;
export const fmt = (d) => (d === INF ? '\u221e' : d < 0 ? `\u2212${-d}` : String(d));
/** A weight as the second term of a sum: 3 + (−2). */
const term = (w) => (w < 0 ? `(${fmt(w)})` : fmt(w));

/** The lesson's graph: six vertices, one-way edges. Three labels improve after they are first set. */
export const GRAPH = {
  directed: true,
  vertices: [
    { id: 'A', x: 0, y: 110 },
    { id: 'B', x: 160, y: 0 },
    { id: 'C', x: 160, y: 220 },
    { id: 'D', x: 340, y: 0 },
    { id: 'E', x: 340, y: 220 },
    { id: 'F', x: 500, y: 110 },
  ],
  edges: [
    ['A', 'B', 4],
    ['A', 'C', 2],
    ['C', 'B', 1],
    ['B', 'D', 5],
    ['C', 'E', 10],
    ['D', 'E', 2],
    ['E', 'B', 1],
    ['D', 'F', 6],
    ['E', 'F', 3],
  ],
};

/** Smallest counterexample: a negative edge into a vertex that is already final. */
export const NEGATIVE = {
  directed: true,
  vertices: [
    { id: 'S', x: 0, y: 90 },
    { id: 'A', x: 220, y: 0 },
    { id: 'B', x: 220, y: 180 },
  ],
  edges: [
    ['S', 'A', 2],
    ['S', 'B', 3],
    ['B', 'A', -2],
  ],
};

/** Outgoing edges of u, in the order they are listed (an undirected edge goes both ways). */
function adjacency(graph) {
  const out = new Map(graph.vertices.map((v) => [v.id, []]));
  for (const [a, b, w] of graph.edges) {
    out.get(a).push({ to: b, w, link: `e${a}-${b}` });
    if (!graph.directed) out.get(b).push({ to: a, w, link: `e${a}-${b}` });
  }
  return out;
}

const byKey = (dist) => (a, b) => (dist[a] === dist[b] ? (a < b ? -1 : 1) : dist[a] < dist[b] ? -1 : 1);

export function dijkstra(graph, source) {
  const out = adjacency(graph);
  const dist = Object.fromEntries(graph.vertices.map((v) => [v.id, v.id === source ? 0 : INF]));
  const parent = Object.fromEntries(graph.vertices.map((v) => [v.id, null]));
  const cloud = [];
  let queue = graph.vertices.map((v) => v.id).sort(byKey(dist));
  const steps = [];
  const snap = (step) => steps.push({ ...step, dist: { ...dist }, parent: { ...parent }, cloud: [...cloud], queue: [...queue] });

  snap({ kind: 'init' });
  while (queue.length) {
    const u = queue.shift();
    if (dist[u] === INF) {
      queue.unshift(u);
      snap({ kind: 'unreachable', rest: [...queue] });
      break;
    }
    cloud.push(u);
    const edges = out.get(u);
    snap({ kind: 'remove', u, edges: edges.length });
    for (const { to: z, w, link } of edges) {
      const cand = dist[u] + w;
      if (cloud.includes(z)) {
        snap({ kind: 'skip', u, z, w, link, cand });
        continue;
      }
      const before = dist[z];
      const better = cand < before;
      if (better) {
        dist[z] = cand;
        parent[z] = u;
        queue = queue.sort(byKey(dist));
      }
      snap({ kind: 'relax', u, z, w, link, cand, before, better });
    }
  }
  // Edges skipped although they would have shortened a finished label: only negative weights do that.
  const wrong = steps.filter((s) => s.kind === 'skip' && s.cand < dist[s.z]);
  snap({ kind: 'done', wrong });
  return { dist, parent, order: cloud, steps };
}

/** Reference shortest-path distances: n - 1 rounds of relaxing every edge. */
export function bellmanFord(graph, source) {
  const dist = Object.fromEntries(graph.vertices.map((v) => [v.id, v.id === source ? 0 : INF]));
  const edges = graph.directed ? graph.edges : graph.edges.flatMap(([a, b, w]) => [[a, b, w], [b, a, w]]);
  for (let i = 1; i < graph.vertices.length; i++) {
    for (const [a, b, w] of edges) if (dist[a] + w < dist[b]) dist[b] = dist[a] + w;
  }
  return { dist };
}

/** Vertices whose dist was finite and then lowered by a later relaxation. */
export function improved(run) {
  return [...new Set(run.steps.filter((s) => s.kind === 'relax' && s.better && s.before !== INF).map((s) => s.z))];
}

/* ---------- frames ---------- */

const QUEUE_GAP = 100; // from the lowest vertex to the queue row
const PITCH = 62;

/**
 * One frame. dist / cloud / queue / parent come from a step (omit them for a bare graph).
 * roles: keyed by item or link id. changed: vertex whose label was just lowered (drawn blue).
 * labels: draw dist[v] beside the vertices; queue: draw the queue row.
 */
export function graphFrame(graph, { dist, parent = {}, cloud = [], queue, roles = {}, tags = {}, changed, labels = Boolean(dist), caption, badge } = {}) {
  const items = [];
  const links = [];
  const R = {};
  const xs = graph.vertices.map((v) => v.x);
  const ys = graph.vertices.map((v) => v.y);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
  const cy = (Math.min(...ys) + Math.max(...ys)) / 2;

  for (const v of graph.vertices) {
    items.push({ id: `v${v.id}`, x: v.x, y: v.y, text: v.id });
    if (cloud.includes(v.id)) R[`v${v.id}`] = 'found';
    else if (dist && dist[v.id] !== INF) R[`v${v.id}`] = 'info';
    if (labels) {
      // Beside the vertex, away from the middle of the drawing (where the edges are).
      const [dx, dy] = Math.abs(v.y - cy) > 1 ? [0, Math.sign(v.y - cy) * 34] : [Math.sign(v.x - cx) * 38, 0];
      items.push({ id: `d${v.id}`, x: v.x + dx, y: v.y + dy, shape: 'label', text: fmt(dist[v.id]), cls: v.id === changed ? 'pointer' : undefined, pick: false });
    }
  }
  for (const [a, b, w] of graph.edges) {
    const id = `e${a}-${b}`;
    links.push({ id, from: `v${a}`, to: `v${b}`, directed: graph.directed, text: fmt(w) });
    // Tree edges: green once the child is final, blue while it is still tentative.
    if (parent[b] === a) R[id] = cloud.includes(b) ? 'found' : 'visit';
    else if (!graph.directed && parent[a] === b) R[id] = cloud.includes(a) ? 'found' : 'visit';
  }
  if (queue) {
    const y = Math.max(...ys) + QUEUE_GAP;
    const x0 = cx - ((graph.vertices.length - 1) * PITCH) / 2;
    items.push({ id: 'qhead', x: x0 - 58, y, shape: 'label', text: queue.length ? 'queue' : 'queue empty', cls: 'index', pick: false });
    queue.forEach((q, i) => {
      items.push({ id: `q${q}`, x: x0 + i * PITCH, y, shape: 'rect', w: 54, h: 32, text: `${q} ${fmt(dist[q])}`, pick: false });
    });
  }
  Object.assign(R, roles);
  return { items, links, roles: R, tags, caption, badge };
}

const b = (s) => `<b>${s}</b>`;
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

function caption(step, source, graph) {
  const { dist } = step;
  switch (step.kind) {
    case 'init':
      return `Start: dist[${source}] = 0 and every other dist = \u221e. All ${graph.vertices.length} vertices go into the priority queue, keyed by dist. The cloud of finished vertices is empty.`;
    case 'remove':
      return `removeMin returns ${b(step.u)} with dist ${b(fmt(dist[step.u]))}: the smallest key in the queue. ${step.u} joins the cloud and ${b(`dist[${step.u}] = ${fmt(dist[step.u])}`)} is now final. ${step.edges ? `Relax its ${plural(step.edges, 'outgoing edge')}.` : `It has no outgoing edges.`}`;
    case 'skip':
      return `Edge ${step.u} \u2192 ${step.z}: ${step.z} is already in the cloud, so its dist is final. Skip it.${step.cand < dist[step.z] ? ` (${fmt(dist[step.u])} + ${term(step.w)} = ${fmt(step.cand)} is shorter than ${fmt(dist[step.z])}: possible only because the weight is negative.)` : ''}`;
    case 'relax': {
      const sum = `dist[${step.u}] + ${term(step.w)} = ${fmt(dist[step.u])} + ${term(step.w)} = ${step.better ? b(fmt(step.cand)) : fmt(step.cand)}`;
      return step.better
        ? `Relax ${step.u} \u2192 ${step.z}: ${sum} &lt; ${fmt(step.before)}. Shorter: set ${b(`dist[${step.z}] = ${fmt(step.cand)}`)}${step.before === INF ? '' : ` (it was ${fmt(step.before)})`} and update its key in the queue. The best route to ${step.z} so far comes from ${step.u}.`
        : `Relax ${step.u} \u2192 ${step.z}: ${sum} \u2265 dist[${step.z}] = ${fmt(step.before)}. Not shorter: nothing changes.`;
    }
    case 'unreachable':
      return `removeMin would return ${b(step.queue[0])} with dist \u221e: no edge leads from the cloud to ${step.rest.length === 1 ? 'it' : `any of ${step.rest.join(', ')}`}. ${step.rest.length === 1 ? 'It is' : 'They are'} ${b('unreachable')} from ${source}. Stop.`;
    case 'done':
      return step.wrong.length
        ? `Done, but ${step.wrong.map((s) => `${b(`dist[${s.z}] = ${fmt(dist[s.z])}`)} is wrong: the path through ${s.u} costs ${fmt(s.cand)}`).join('; ')}. A finished vertex is never updated, so Dijkstra missed it.`
        : `Done: every reachable vertex is in the cloud with its final dist, and the green edges form the shortest-path tree from ${source}.`;
  }
}

export function runFrames(graph, source, run = dijkstra(graph, source)) {
  return run.steps.map((s) => {
    const roles = {};
    let changed;
    if (s.kind === 'remove') roles[`v${s.u}`] = 'visit';
    if (s.kind === 'relax' || s.kind === 'skip') {
      roles[`v${s.u}`] = 'visit';
      roles[s.link] = 'path';
      if (s.kind === 'relax') roles[`v${s.z}`] = 'path';
      if (s.kind === 'relax' && s.better) changed = s.z;
    }
    if (s.kind === 'unreachable') for (const v of s.rest) roles[`v${v}`] = 'dim';
    if (s.kind === 'done') for (const v of graph.vertices) if (s.dist[v.id] === INF) roles[`v${v.id}`] = 'dim';
    return graphFrame(graph, { ...s, queue: s.queue, roles, changed, caption: caption(s, source, graph) });
  });
}
