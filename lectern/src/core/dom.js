/** Small DOM helpers shared by every lectern module. */

const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * el('button', { class: 'x', text: 'Go', onclick, 'aria-label': '…' }, ...children)
 * Props: class, text, html (trusted strings only), style (object or string), dataset (object), on* handlers,
 * booleans (true sets an empty attribute, false/null/undefined skip it). Children: nodes, strings, arrays, falsy (skipped).
 */
export function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  setProps(node, props);
  append(node, children);
  return node;
}

/** The same for SVG elements. */
export function svg(tag, props = {}, ...children) {
  const node = document.createElementNS(SVG_NS, tag);
  setProps(node, props);
  append(node, children);
  return node;
}

function setProps(node, props) {
  for (const [key, value] of Object.entries(props ?? {})) {
    if (value === false || value === null || value === undefined) continue;
    if (key === 'class') node.setAttribute('class', Array.isArray(value) ? value.filter(Boolean).join(' ') : value);
    else if (key === 'text') node.textContent = value;
    else if (key === 'html') node.innerHTML = value;
    else if (key === 'style') {
      if (typeof value === 'string') node.setAttribute('style', value);
      else for (const [k, v] of Object.entries(value)) if (v !== null && v !== undefined) node.style.setProperty(k.startsWith('--') ? k : k.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`), v);
    } else if (key === 'dataset') Object.assign(node.dataset, value);
    else if (key.startsWith('on') && typeof value === 'function') node.addEventListener(key.slice(2).toLowerCase(), value);
    else node.setAttribute(key, value === true ? '' : value);
  }
}

function append(node, children) {
  for (const child of children.flat(Infinity)) {
    if (child === null || child === undefined || child === false || child === '') continue;
    node.append(child instanceof Node ? child : String(child));
  }
}

export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** A stable short id for DOM ids (labels, aria). */
let uid = 0;
export const nextId = (prefix = 'lx') => `${prefix}-${++uid}`;

/** Resolves on the next animation frame (two frames when `double`, so a style change has been painted). */
export const frame = (double = false) =>
  new Promise((resolve) => requestAnimationFrame(() => (double ? requestAnimationFrame(resolve) : resolve())));

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Escapes text for HTML. */
export function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

/** Restarts a CSS animation class on a node (feedback shakes, pops). */
export function replay(node, className) {
  node.classList.remove(className);
  void node.offsetWidth;
  node.classList.add(className);
  node.addEventListener('animationend', () => node.classList.remove(className), { once: true });
}

/** Light haptic tick where supported (Android); silently nothing elsewhere. */
export function haptic(pattern = 8) {
  try {
    navigator.vibrate?.(pattern);
  } catch {}
}
