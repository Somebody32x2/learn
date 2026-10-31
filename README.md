# Learn

Interactive lessons: figures you can step through, a checkpoint after every idea, and practice that shows
exactly where an answer went wrong. This repo is the hub page plus one folder per subject.

| Path | What it is |
|---|---|
| `/` | the hub: lists every subject (`subjects.js`), installable as one app (`manifest.webmanifest`, `sw.js`) |
| [`dsa/`](dsa/) | Data Structures & Algorithms: AVL trees and rotations, the master theorem, heaps |
| [`physics2/`](physics2/) | Physics II: fields, circuits, magnetism, light and optics, early quantum physics, with narration |

## Run locally

Static files, no build step, no dependencies (Node 22+ for the dev server and tests).

```sh
npm start     # http://localhost:5173 (the hub; subjects at /dsa/ and /physics2/)
npm test      # every subject's model tests (node:test)
```

## Serving

`Dockerfile` serves the repo with nginx (`nginx.conf`), minus tests, narration tooling and docs
(`.dockerignore`). Every URL in the site is relative, so it works at a domain root or under a path prefix
that a reverse proxy strips. Each `index.html` adds the trailing slash it needs, and `nginx.conf` serves
folder indexes itself instead of redirecting (a redirect would lose the stripped prefix).

The service worker's scope is the hub's folder, so it covers every subject: installing the hub installs
them all, and any page you have opened works offline afterwards. It is network-first; the cache is only
the offline fallback.

## Adding a subject

1. Create `<slug>/` with its own `index.html` (copy the head of `physics2/index.html`: the trailing-slash
   script, the hub's `../manifest.webmanifest`, and the `../sw.js` registration with scope `../`).
2. Give it a `package.json` with `"type": "module"` and its tests under `<slug>/tests/`, then add those
   tests to the root `package.json` `test` script.
3. Add an entry to `subjects.js`; the hub lists it. Use relative links (`<slug>/`), and point `repo` at
   `https://github.com/Somebody32x2/learn/tree/main/<slug>`.

## License

MIT
