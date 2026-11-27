/**
 * Tutor detection. The public site has no tutor; when the page is served by the private learn tutor,
 * `window.__tutor = { root }` is set and the bridge module lives at `<root>lectern-tutor/bridge.js`.
 *
 *   const bridge = await getBridge();   // null on the public site or when the module fails to load
 *
 * The bridge module exports `bridge` (a default export or a namespace with the API functions also work).
 * The promise is cached: every caller shares one import.
 */
let pending = null;

export async function getBridge() {
  if (!pending) pending = load();
  return pending;
}

async function load() {
  const tutor = typeof window !== 'undefined' ? window.__tutor : null;
  if (!tutor) return null;
  try {
    const root = typeof tutor === 'object' && typeof tutor.root === 'string' ? tutor.root : '';
    const mod = await import(new URL(`${root}lectern-tutor/bridge.js`, location.href).href);
    const bridge = mod.bridge ?? (mod.default && typeof mod.default === 'object' ? mod.default : mod);
    return bridge && typeof bridge.open === 'function' ? bridge : null;
  } catch (err) {
    console.warn('lectern: tutor bridge unavailable', err);
    return null;
  }
}
