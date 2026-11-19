import { h, p } from '../../../shared/ui/dom.js';
import { Player } from '../../../shared/ui/player.js';
import { figure, segmented, callout } from '../../../shared/ui/figure.js';
import { checkpoint } from '../../../shared/ui/quiz.js';
import { GRAPH, NEGATIVE, dijkstra, fmt, graphFrame, runFrames } from '../model/dijkstra.js';

const section = (title) => h('h2', { class: 'reveal', html: title });

/** The path the parent pointers give, source first. */
function pathTo(run, v) {
  const path = [];
  for (let x = v; x != null; x = run.parent[x]) path.unshift(x);
  return path;
}

/* ---------- figures ---------- */

function runFigure() {
  let source = 'A';
  let player;
  const host = h('div');
  const fig = figure(
    {
      title: 'Dijkstra\u2019s algorithm, step by step',
      wide: true,
      tools: [segmented(GRAPH.vertices.map((v) => ({ value: v.id, label: v.id })), source, (v) => ((source = v), player.load(runFrames(GRAPH, v))), { label: 'Source vertex' })],
      note: 'The number beside each vertex is its dist; the number on an edge is its weight. The queue is drawn sorted so you can read it; a heap keeps the same entries only partly sorted. Pick another source above: from F, nothing else is reachable.',
    },
    host,
  );
  player = new Player(host, { frames: runFrames(GRAPH, source), view: { height: 440 } });
  return fig;
}

function negativeFigure() {
  const host = h('div');
  const fig = figure({ title: 'One negative edge is enough to break it', wide: true }, host);
  new Player(host, { frames: runFrames(NEGATIVE, 'S'), view: { height: 360 } });
  return fig;
}

/* ---------- checkpoint ---------- */

const Q = {
  directed: true,
  vertices: GRAPH.vertices,
  edges: [
    ['A', 'B', 6],
    ['A', 'C', 2],
    ['C', 'B', 3],
    ['C', 'E', 7],
    ['B', 'D', 4],
    ['B', 'E', 1],
    ['E', 'D', 2],
    ['D', 'F', 5],
    ['E', 'F', 4],
  ],
};
const QS = 'A';
const qRun = dijkstra(Q, QS);
const qBare = () => graphFrame(Q, { tags: { [`v${QS}`]: ['source'] } });
// After the order quiz: the shortest-path tree, without the dist labels (the order pills sit where they would).
const qDone = () => graphFrame(Q, { parent: qRun.parent, cloud: qRun.order });
const QU = 'E';
const qLowered = qRun.steps.filter((s) => s.kind === 'relax' && s.u === QU && s.better);
const qBefore = qRun.steps.find((s) => s.kind === 'remove' && s.u === QU);
const QT = 'F';
const qPath = pathTo(qRun, QT);
const weight = (a, b) => Q.edges.find(([x, y]) => x === a && y === b)[2];

const quiz = [
  {
    type: 'pick',
    id: 'dijkstra.order',
    prompt: `Run Dijkstra from <b>${QS}</b>. Click the vertices in the order removeMin returns them.`,
    build: () => ({ frame: qBare(), answer: qRun.order.map((v) => `v${v}`), after: qDone() }),
    ordered: true,
    labels: qRun.order.map((_, i) => String(i + 1)),
    view: { height: 320 },
    explain: `Order: ${qRun.order.map((v) => `<b>${v}</b> (${qRun.dist[v]})`).join(', ')}. Vertices leave the queue in order of their <b>final</b> distance. B is reached through C (${qRun.dist.C} + ${weight('C', 'B')} = ${qRun.dist.B}), not by the direct edge (${weight(QS, 'B')}), and E (${qRun.dist.E}) comes out before D (${qRun.dist.D}): through B, the edge B \u2192 E is cheaper than B \u2192 D.`,
  },
  {
    type: 'input',
    id: 'dijkstra.dist',
    prompt: `Same graph, source ${QS}. What is the shortest-path distance to <b>${QT}</b>?`,
    answers: [String(qRun.dist[QT])],
    placeholder: `dist[${QT}]`,
    explain: `<b>${qRun.dist[QT]}</b>, along ${qPath.join(' \u2192 ')} = ${qPath.slice(1).map((v, i) => weight(qPath[i], v)).join(' + ')}. Through D it costs ${qRun.dist.D} + ${weight('D', 'F')} = ${qRun.dist.D + weight('D', 'F')}, and along the top, ${QS} \u2192 B \u2192 D \u2192 F, ${weight(QS, 'B') + weight('B', 'D') + weight('D', 'F')}.`,
  },
  {
    type: 'pick',
    id: 'dijkstra.relax',
    prompt: () => `Same run. When removeMin returns <b>${QU}</b> (dist ${qRun.dist[QU]}), its edges are relaxed. Click every vertex whose dist <b>goes down</b> during that step.`,
    build: () => ({
      frame: graphFrame(Q, { ...qBefore, queue: undefined, roles: { [`v${QU}`]: 'visit' } }),
      answer: qLowered.map((s) => `v${s.z}`),
      after: graphFrame(Q, { ...qRun.steps.findLast((s) => s.u === QU), queue: undefined, roles: { [`v${QU}`]: 'visit' } }),
    }),
    view: { height: 340 },
    explain: `${qLowered.map((s) => `${QU} \u2192 ${s.z}: ${qRun.dist[QU]} + ${s.w} = ${s.cand} &lt; ${fmt(s.before)}, so dist[${s.z}] drops to <b>${s.cand}</b>`).join('; ')}. Only edges <em>out of</em> ${QU} are relaxed, and only into vertices still in the queue. The figure now shows the labels after the step.`,
  },
  {
    type: 'mcq',
    id: 'dijkstra.negative',
    prompt: 'Why does Dijkstra\u2019s algorithm require nonnegative edge weights?',
    choices: [
      'A priority queue cannot store negative keys',
      'Once a vertex leaves the queue its dist is never changed, but a negative edge found later could still shorten the path to it',
      'With a negative edge the algorithm never terminates',
      'Relaxation only works when the new distance is larger than the old one',
    ],
    answer: 1,
    explain: 'The proof that removeMin hands back a final distance uses "a path only gets longer as it goes": every other route to u leaves the cloud at some vertex already at least as far as u. A negative edge breaks that, as in the S, A, B figure: A is finished at 2, then B \u2192 A (\u22122) would give 1. The algorithm still stops after n removeMins; it just returns a wrong answer. Keys can be negative in a heap without trouble.',
  },
  {
    type: 'input',
    id: 'dijkstra.relaxations',
    prompt: 'A directed graph has n = 1,000 vertices and m = 5,000 edges. At most how many times can Dijkstra lower some vertex\u2019s dist (a replaceKey)?',
    answers: ['5000', '5,000'],
    placeholder: 'replaceKey calls',
    explain: 'Each edge (u, z) is relaxed exactly once, when its tail u is removed from the queue, and each relaxation lowers at most one label. So at most <b>m = 5,000</b> replaceKeys, each O(log n) in a heap.',
  },
  {
    type: 'mcq',
    id: 'dijkstra.time',
    prompt: 'With a heap-based priority queue, what is the running time of Dijkstra\u2019s algorithm on a graph with n vertices and m edges, stored as adjacency lists?',
    choices: ['O(n log n)', 'O(m + n)', 'O((n + m) log n)', 'O(n\u00b2 log n)'],
    answer: 2,
    explain: 'n removeMins and at most m replaceKeys, each O(log n), plus O(n + m) to scan the adjacency lists once: O((n + m) log n). O(n log n) forgets the edges; O(n + m) would need a queue with O(1) operations. With an unsorted array instead of a heap it is O(n\u00b2 + m), better only when the graph is dense (m close to n\u00b2).',
  },
  {
    type: 'mcq',
    id: 'dijkstra.lazy',
    prompt: 'Java\u2019s <span class="mono">PriorityQueue</span> has no replaceKey. A common fix: when dist[z] goes down, insert a new entry (dist[z], z) and leave the old one in the queue. What must the loop do when removeMin returns an entry (d, v)?',
    choices: [
      'Process v every time: its edges get relaxed again with the newer distance',
      'Remove every other entry for v from the queue first',
      'Nothing special: a vertex can never appear in the queue twice',
      'Skip it if v is already in the cloud (then d &gt; dist[v]: the entry is stale); otherwise process v as usual',
    ],
    answer: 3,
    explain: 'The first entry for v to come out has the smallest key, which is v\u2019s final dist; later entries for v are leftovers with larger keys. Processing them again changes no label, but it scans v\u2019s edges once per stale entry, which can cost far more than m in total. Removing them is O(n) each in a <span class="mono">PriorityQueue</span>. With the skip, the queue holds at most m + 1 entries, and log m \u2264 2 log n, so the time is still O((n + m) log n).',
  },
];

export default {
  id: 'dijkstra',
  title: 'Dijkstra\u2019s algorithm',
  group: 'Shortest paths',
  blurb: 'Shortest paths from one source in a graph with nonnegative edge weights: grow a cloud of finished vertices, nearest first, relaxing edges as you go.',
  quiz,
  render(root) {
    root.append(
      p('In a <b>weighted graph</b> every edge has a number, its <b>weight</b>: a travel time, a cost, a delay. The length of a path is the sum of its weights, and the <b>distance</b> from s to v is the length of the shortest path from s to v (\u221e if there is none). The <b>single-source</b> problem asks for the distance from one source s to every vertex.'),
      p('Breadth-first search solves this when every edge counts as 1: it finds vertices in order of how many edges away they are. With weights, the path with the fewest edges is often not the shortest. Dijkstra\u2019s algorithm keeps the idea of finding vertices in order of distance, but uses a <b>priority queue</b> to decide which vertex is next. It needs every weight to be \u2265 0.'),
    );

    root.append(section('Labels and relaxation'));
    root.append(
      p('Every vertex v carries a label <b>dist[v]</b>: the length of the shortest path to v found so far. It starts at 0 for the source and \u221e for everything else, and it only goes down. Labels get better by <b>relaxing</b> an edge (u, z) of weight w:'),
      h('div', { class: 'table-wrap reveal' }, h('table', { html: '<tbody><tr><td class="mono">if dist[u] + w &lt; dist[z]:<br>&nbsp;&nbsp;&nbsp;&nbsp;dist[z] \u2190 dist[u] + w</td><td>Going to u and then along the edge is shorter than the best route to z known so far, so use it.</td></tr></tbody>' })),
      p('The algorithm keeps a <b>cloud</b> of vertices whose dist is final. Each round it takes the vertex outside the cloud with the <b>smallest</b> dist, adds it to the cloud, and relaxes its outgoing edges:'),
      h('pre', { class: 'code reveal', html: `<span class="kw">Algorithm</span> ShortestPath(G, s):
  dist[s] \u2190 0;  dist[v] \u2190 \u221e for every other vertex v
  Q \u2190 a priority queue of all vertices, keyed by dist
  <span class="kw">while</span> Q is not empty:
    u \u2190 Q.removeMin()               <span class="cm">// dist[u] is now final: u joins the cloud</span>
    <span class="kw">for each</span> edge (u, z) with z still in Q:
      <span class="kw">if</span> dist[u] + w(u, z) &lt; dist[z]:   <span class="cm">// relax the edge</span>
        dist[z] \u2190 dist[u] + w(u, z)
        Q.replaceKey(z, dist[z])
  <span class="kw">return</span> dist` }),
      p('Remember which vertex last lowered each label (its <b>parent</b>) and the parent edges form a <b>shortest-path tree</b>: follow parents back from any vertex to read off its shortest path. Step through the run below. Watch B: it first gets 4 straight from A, then 3 through C.'),
    );
    root.append(runFigure());

    root.append(
      callout('key', 'Why a vertex is finished when it leaves the queue', 'Say removeMin returns u, but some path P to u is shorter than dist[u]. P starts at s, inside the cloud, and ends at u, outside it. Let y be the first vertex of P outside the cloud and x the one before it. x is in the cloud, so the edge (x, y) was relaxed when x was removed, and dist[y] is at most the length of P up to y. Weights are \u2265 0, so the rest of P adds nothing negative: dist[y] \u2264 length(P) &lt; dist[u]. Then y had a smaller key than u and removeMin would have returned y. Contradiction, so dist[u] is the true distance.'),
    );

    root.append(section('Negative weights'));
    root.append(
      p('That argument used one fact about weights: the rest of a path never makes it shorter. Drop that and the algorithm finishes a vertex too early:'),
    );
    root.append(negativeFigure());
    root.append(
      callout('warn', 'Dijkstra is only correct with weights \u2265 0', `S \u2192 B \u2192 A costs 3 + (\u22122) = 1, but A left the queue with dist 2 before B was even processed, and a finished vertex is never updated. Graphs with negative edges need a different algorithm (Bellman-Ford, which relaxes every edge n \u2212 1 times).`),
    );

    root.append(section('Running time'));
    root.append(
      p('With n vertices, m edges and adjacency lists, each vertex is removed once and each edge is relaxed once, from its tail (an undirected edge is looked at from both ends, still O(1) times). With an adaptable heap, where every entry knows its own index so replaceKey can up-heap it in place:'),
      h('div', { class: 'table-wrap reveal' }, h('table', { html: `<thead><tr><th>Work</th><th>How many</th><th>Each</th></tr></thead><tbody>
        <tr><td>insert every vertex</td><td class="mono">n</td><td class="mono">O(log n)</td></tr>
        <tr><td><b>removeMin</b></td><td class="mono">n</td><td class="mono">O(log n)</td></tr>
        <tr><td><b>replaceKey</b> (a label goes down)</td><td class="mono">\u2264 m</td><td class="mono">O(log n)</td></tr>
        <tr><td>scan an adjacency list entry</td><td class="mono">m</td><td class="mono">O(1)</td></tr>
        <tr><td><b>Total</b></td><td colspan="2" class="mono">O((n + m) log n)</td></tr>
      </tbody>` })),
      p('Space is O(n + m) for the graph, plus O(n) for the labels and the queue.'),
      callout('note', 'Without replaceKey', 'Many library priority queues, Java\u2019s <span class="mono">PriorityQueue</span> among them, cannot change a key. Instead, insert a fresh entry (dist[z], z) every time a label goes down, and when removeMin returns an entry for a vertex that is already in the cloud, throw it away: it is stale. The queue then holds up to m + 1 entries, so the space for it grows to O(m), but log m \u2264 log n<sup>2</sup> = 2 log n, so the time is still O((n + m) log n).'),
    );

    root.append(checkpoint(quiz));
  },
};
