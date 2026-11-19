import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GRAPH, NEGATIVE, dijkstra, bellmanFord, improved, runFrames } from '../src/model/dijkstra.js';

/** Deterministic PRNG so failures reproduce. */
function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
}

function randomGraph(r, directed) {
  const n = 2 + Math.floor(r() * 8);
  const vertices = Array.from({ length: n }, (_, i) => ({ id: String.fromCharCode(65 + i), x: i * 50, y: (i % 2) * 80 }));
  const edges = [];
  for (const a of vertices) for (const b of vertices) {
    if (a.id !== b.id && (directed || a.id < b.id) && r() < 0.35) edges.push([a.id, b.id, Math.floor(r() * 10)]);
  }
  return { directed, vertices, edges };
}

test('lesson graph from A: removal order, distances, tree, improved labels', () => {
  const run = dijkstra(GRAPH, 'A');
  assert.deepEqual(run.order, ['A', 'C', 'B', 'D', 'E', 'F']);
  assert.deepEqual(run.dist, { A: 0, B: 3, C: 2, D: 8, E: 10, F: 13 });
  assert.deepEqual(run.parent, { A: null, B: 'C', C: 'A', D: 'B', E: 'D', F: 'E' });
  assert.deepEqual(improved(run), ['B', 'E', 'F']);
  assert.ok(run.steps.some((s) => s.kind === 'skip' && s.u === 'E' && s.z === 'B'));
});

test('random graphs, directed and undirected: Dijkstra matches Bellman-Ford', () => {
  for (let seed = 1; seed <= 300; seed++) {
    const r = rng(seed);
    const g = randomGraph(r, seed % 2 === 0);
    const s = g.vertices[Math.floor(r() * g.vertices.length)].id;
    const run = dijkstra(g, s);
    assert.deepEqual(run.dist, bellmanFord(g, s).dist, `seed ${seed}`);
    // Vertices leave the queue in nondecreasing dist, and each is removed once.
    const ds = run.order.map((v) => run.dist[v]);
    assert.deepEqual(ds, [...ds].sort((a, b) => a - b));
    assert.deepEqual(run.steps.at(-1).wrong, [], 'nonnegative weights: no skipped edge would have helped');
    assert.equal(new Set(run.order).size, run.order.length);
    // The parent pointers are the last edge of a shortest path.
    for (const v of g.vertices) {
      const p = run.parent[v.id];
      if (v.id === s || run.dist[v.id] === Infinity) assert.equal(p, null);
      else assert.ok(g.edges.some(([a, b, w]) => ((a === p && b === v.id) || (!g.directed && b === p && a === v.id)) && run.dist[p] + w === run.dist[v.id]));
    }
    // Unreachable vertices are exactly the ones never removed.
    assert.equal(run.order.length, g.vertices.filter((v) => run.dist[v.id] !== Infinity).length);
  }
});

test('a negative edge into a finished vertex gives a wrong distance', () => {
  const run = dijkstra(NEGATIVE, 'S');
  assert.equal(run.dist.A, 2);
  assert.ok(run.steps.some((s) => s.kind === 'skip' && s.z === 'A' && s.cand === 1));
  assert.deepEqual(run.steps.at(-1).wrong.map((s) => [s.u, s.z, s.cand]), [['B', 'A', 1]]);
  assert.equal(bellmanFord(NEGATIVE, 'S').dist.A, 1);
});

test('frames: one per step, ids stable, queue holds exactly the vertices not yet removed', () => {
  const run = dijkstra(GRAPH, 'A');
  const frames = runFrames(GRAPH, 'A', run);
  assert.equal(frames.length, run.steps.length);
  frames.forEach((f, i) => {
    const s = run.steps[i];
    const queued = f.items.filter((it) => it.id.startsWith('q') && it.id !== 'qhead').map((it) => it.id.slice(1));
    assert.deepEqual(queued, s.queue);
    assert.deepEqual(queued.map((v) => s.dist[v]), [...queued.map((v) => s.dist[v])].sort((a, b) => a - b));
    for (const v of GRAPH.vertices) assert.equal(f.items.find((it) => it.id === `d${v.id}`).text, s.dist[v.id] === Infinity ? '\u221e' : String(s.dist[v.id]));
  });
  // Final frame: every tree edge is green.
  const last = frames.at(-1);
  for (const [v, p] of Object.entries(run.parent)) if (p) assert.equal(last.roles[`e${p}-${v}`], 'found');
});
