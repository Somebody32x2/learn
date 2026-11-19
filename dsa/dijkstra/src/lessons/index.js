import dijkstra from './dijkstra.js';
import { GRAPH, runFrames } from '../model/dijkstra.js';

/** Reading order. */
export const chapters = [dijkstra];

export const hero = () => ({ title: 'Dijkstra from A', frames: runFrames(GRAPH, 'A'), view: { height: 440 } });

export const legend = [
  { sym: '<span class="swatch role-visit"></span>', text: 'the vertex removeMin just returned; its outgoing edges are being relaxed' },
  { sym: '<span class="swatch role-path"></span>', text: 'the edge being relaxed and the vertex it leads to' },
  { sym: '<span class="swatch role-info"></span>', text: 'reached but not finished: in the queue with a finite dist. A blue edge is the best way in found so far' },
  { sym: '<span class="swatch role-found"></span>', text: 'in the cloud: its dist is final. Green edges form the shortest-path tree' },
];
