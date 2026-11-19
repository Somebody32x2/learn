import { mountSite } from '../../shared/shell.js';
import { chapters, hero, legend } from './lessons/index.js';

mountSite({
  site: {
    title: 'Dijkstra\u2019s algorithm',
    eyebrow: 'Graphs \u00b7 Shortest paths \u00b7 Priority queues',
    heroTitle: 'Shortest paths, <em>seen</em>.',
    heroLede:
      'Grow a cloud of finished vertices from the source, nearest first. Watch each label drop as edges are relaxed, see why a vertex is final the moment it leaves the queue, and why one negative edge breaks the whole thing.',
    logo: '<svg viewBox="0 0 24 24"><path d="M5.5 12 12 5.5M5.5 12l6.5 6.5M12 5.5l6.5 6.5M12 18.5l6.5-6.5" /><circle cx="5.5" cy="12" r="2.6" class="accent" /><circle cx="12" cy="5.5" r="2.6" /><circle cx="12" cy="18.5" r="2.6" /><circle cx="18.5" cy="12" r="2.6" /></svg>',
  },
  chapters,
  hero,
  legend,
});
