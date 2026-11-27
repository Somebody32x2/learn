/**
 * Safe Markdown + math → HTML, for prompts, solutions, hints and tutor replies.
 *
 *   md(text)                    → block HTML (paragraphs, lists, headings)
 *   md(text, { inline: true })  → inline HTML only (no <p>; newlines become spaces)
 *   md(['para 1', 'para 2'])    → arrays are joined as separate paragraphs
 *
 * Everything is HTML-escaped first; the only markup produced is: <p>, <ul>/<ol>/<li>, <h4>, <strong>, <em>,
 * <code>, <br> (two trailing spaces or a backslash at line end), and KaTeX output for $inline$, $$display$$,
 * \( … \) and \[ … \]. `\$` is a literal dollar sign. Code spans are taken before math, so `$x` inside them is
 * shown as typed.
 */
import { katexHtml } from './mobject.js';
import { escapeHtml } from './dom.js';

const OPEN = '\u0001';
const CLOSE = '\u0002';

export function md(text, { inline = false } = {}) {
  if (text === null || text === undefined) return '';
  let src = Array.isArray(text) ? text.map(String).join('\n\n') : String(text);
  src = src.replace(/\r\n?/g, '\n').replace(/[\u0001\u0002]/g, '');

  const held = [];
  const hold = (html) => `${OPEN}${held.push(html) - 1}${CLOSE}`;

  src = src.replace(/\\\$/g, () => hold('$'));
  src = src.replace(/`([^`\n]+)`/g, (_, code) => hold(`<code>${escapeHtml(code)}</code>`));
  src = src.replace(/\$\$([\s\S]+?)\$\$/g, (_, tex) => hold(`<span class="md-display">${katexHtml(tex.trim(), { display: true })}</span>`));
  src = src.replace(/\\\[([\s\S]+?)\\\]/g, (_, tex) => hold(`<span class="md-display">${katexHtml(tex.trim(), { display: true })}</span>`));
  src = src.replace(/\\\(([\s\S]+?)\\\)/g, (_, tex) => hold(katexHtml(tex.trim(), { display: false })));
  src = src.replace(/\$([^$\n]+?)\$/g, (_, tex) => hold(katexHtml(tex.trim(), { display: false })));

  const html = inline ? inlineMd(src.replace(/\s*\n\s*/g, ' ')) : blocks(src);
  return html.replace(new RegExp(`${OPEN}(\\d+)${CLOSE}`, 'g'), (_, i) => held[Number(i)]);
}

function inlineMd(s) {
  return escapeHtml(s)
    .replace(/\*\*(?=\S)([\s\S]*?\S)\*\*/g, '<strong>$1</strong>')
    .replace(/__(?=\S)([\s\S]*?\S)__/g, '<strong>$1</strong>')
    .replace(/(^|[^*\w])\*(?=\S)([^*]*?\S)\*(?!\*)/g, '$1<em>$2</em>')
    .replace(/(^|[^_\w])_(?=\S)([^_]*?\S)_(?![_\w])/g, '$1<em>$2</em>');
}

const BULLET = /^\s*[-*+]\s+(.*)$/;
const NUMBER = /^\s*(\d+)[.)]\s+(.*)$/;
const HEADING = /^\s*#{1,6}\s+(.*)$/;

function lineBreaks(lines) {
  return lines
    .map((line, i) => {
      const last = i === lines.length - 1;
      const hard = !last && (/ {2,}$/.test(line) || /\\$/.test(line));
      const text = inlineMd(line.replace(/\\$/, '').trim());
      return hard ? `${text}<br>` : text;
    })
    .join(' ')
    .replace(/<br> /g, '<br>');
}

function blocks(src) {
  const out = [];
  for (const block of src.split(/\n\s*\n/)) {
    const lines = block.split('\n').filter((l) => l.trim() !== '');
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      const heading = HEADING.exec(line);
      if (heading) {
        out.push(`<h4>${inlineMd(heading[1].trim())}</h4>`);
        i++;
        continue;
      }
      const isBullet = BULLET.test(line);
      const isNumber = !isBullet && NUMBER.test(line);
      if (isBullet || isNumber) {
        const re = isBullet ? BULLET : NUMBER;
        const items = [];
        const start = isNumber ? Number(NUMBER.exec(line)[1]) : 1;
        while (i < lines.length && !HEADING.test(lines[i])) {
          const m = re.exec(lines[i]);
          if (m) items.push([isBullet ? m[1] : m[2]]);
          else if (BULLET.test(lines[i]) || NUMBER.test(lines[i])) break;
          else items[items.length - 1].push(lines[i]);
          i++;
        }
        const tag = isBullet ? 'ul' : 'ol';
        const startAttr = isNumber && start !== 1 ? ` start="${start}"` : '';
        out.push(`<${tag}${startAttr}>${items.map((it) => `<li>${lineBreaks(it)}</li>`).join('')}</${tag}>`);
        continue;
      }
      const para = [];
      while (i < lines.length && !HEADING.test(lines[i]) && !BULLET.test(lines[i]) && !NUMBER.test(lines[i])) para.push(lines[i++]);
      out.push(`<p>${lineBreaks(para)}</p>`);
    }
  }
  return out.join('');
}
