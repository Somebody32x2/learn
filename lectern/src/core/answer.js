/**
 * Checking typed answers. Every checker returns { ok, why? }: `why` is shown to the learner when they are close
 * (right shape, wrong entries; a multiple instead of the value; an unsimplified but equal form is accepted).
 *
 * Answer specs (the `answer` field of try / workout items):
 *   { type: 'number', value: '3/4' }                     fractions, decimals; `tol` for approximate answers
 *   { type: 'vector', value: ['1', '-2', '0'] }
 *   { type: 'matrix', value: [[1, 0], [0, 1]] }          the input grid has this shape unless `free: true`
 *   { type: 'basis', value: [[1, 0, 2], [0, 1, 1]] }      any basis of the same subspace (order free)
 *   { type: 'span', value: …, dim }                       same as basis but dependent lists also pass
 *   { type: 'solution', particular, basis }               any parametric description of the same solution set
 *   { type: 'text', accept: ['injective', 'one-to-one'] } normalized string match
 *   { type: 'choice', value: 'b' }                        (multiple choice; the item's choices carry the ids)
 *   { type: 'multi', value: ['a', 'c'] }                  select all that apply
 *   { type: 'set', value: ['1', '2', '3'] }               a finite set of numbers or words, order free
 *   { type: 'proof' }                                     free text, never auto-graded (self-check or tutor)
 */
import { F, parseFrac } from './frac.js';
import { fromCols, rank, inSpan, eqVec, vec } from './linalg.js';

const MINUS = /[\u2212\u2013]/g;

/** "3/4", "-0.5", "−2" → Frac or null. Also accepts "2/-4" and surrounding spaces. */
export function parseNumber(text) {
  if (text === null || text === undefined) return null;
  return parseFrac(String(text).replace(MINUS, '-'));
}

/** "(1, -2, 3)", "[1 -2 3]", "1,-2,3", "<1;2>" → [Frac] or null. */
export function parseVector(text) {
  const body = String(text ?? '').replace(MINUS, '-').trim().replace(/^[[(<{]\s*|\s*[\])>}]$/g, '');
  if (!body) return null;
  const parts = body.split(/\s*[,;]\s*|\s+/).filter(Boolean);
  const nums = parts.map(parseNumber);
  return nums.every(Boolean) ? nums : null;
}

export function normalizeText(text) {
  return String(text ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(MINUS, '-')
    .replace(/[\s_]+/g, ' ')
    .replace(/[.!]+$/, '')
    .trim();
}

const sameNumber = (a, b, tol) => (tol ? Math.abs(a.valueOf() - F(b).valueOf()) <= tol : a.eq(F(b)));

/** Checks a response (strings / arrays of strings as the inputs produced them) against a spec. */
export function check(spec, response) {
  switch (spec.type) {
    case 'number': {
      const x = parseNumber(response);
      if (!x) return { ok: false, why: 'Enter a number: an integer, a fraction like 3/4, or a decimal.' };
      if (sameNumber(x, spec.value, spec.tol)) return { ok: true };
      if (sameNumber(x.neg(), spec.value, spec.tol) && !F(spec.value).zero) return { ok: false, why: 'Check the sign.' };
      return { ok: false };
    }
    case 'vector': {
      const v = Array.isArray(response) ? response.map(parseNumber) : parseVector(response);
      if (!v || v.some((x) => !x)) return { ok: false, why: 'Fill every entry with a number.' };
      const want = vec(spec.value);
      if (v.length !== want.length) return { ok: false, why: `The answer has ${want.length} entries.` };
      if (eqVec(v, want)) return { ok: true };
      const wrong = v.filter((x, i) => !x.eq(want[i])).length;
      return { ok: false, why: wrong === 1 ? 'One entry is off.' : undefined, wrongAt: v.map((x, i) => !x.eq(want[i])) };
    }
    case 'matrix': {
      const want = spec.value.map((row) => row.map((x) => F(x)));
      if (!Array.isArray(response) || response.length !== want.length || response.some((row, i) => !Array.isArray(row) || row.length !== want[i].length))
        return { ok: false, why: `The answer is ${want.length}×${want[0].length}.` };
      const got = response.map((row) => row.map(parseNumber));
      if (got.some((row) => row.some((x) => !x))) return { ok: false, why: 'Fill every entry with a number.' };
      const wrongAt = got.map((row, i) => row.map((x, j) => !x.eq(want[i][j])));
      const wrong = wrongAt.flat().filter(Boolean).length;
      if (!wrong) return { ok: true };
      return { ok: false, wrongAt, why: wrong === 1 ? 'One entry is off.' : wrong <= 2 ? 'Two entries are off.' : undefined };
    }
    case 'basis':
    case 'span': {
      const vs = (response ?? []).map((v) => (Array.isArray(v) ? v.map(parseNumber) : parseVector(v)));
      if (vs.some((v) => !v || v.some((x) => !x))) return { ok: false, why: 'Fill every entry of every vector.' };
      const want = spec.value.map(vec);
      const dim = want.length ? rank(fromCols(want)) : 0;
      if (vs.some((v) => v.length !== (want[0]?.length ?? v.length))) return { ok: false, why: 'Check the number of entries in each vector.' };
      const inside = vs.every((v) => (want.length ? inSpan(v, want) : v.every((x) => x.zero)));
      if (!inside) return { ok: false, why: 'At least one of your vectors is not in the subspace.' };
      const r = vs.length ? rank(fromCols(vs)) : 0;
      if (r < dim) return { ok: false, why: 'Your vectors are in the subspace but do not span all of it.' };
      if (spec.type === 'basis' && vs.length !== dim) return { ok: false, why: 'Your vectors span the subspace but are linearly dependent: a basis has no extras.' };
      return { ok: true };
    }
    case 'solution': {
      // response: { particular: [..], basis: [[..], ..] }
      const p = (response?.particular ?? []).map(parseNumber);
      const B = (response?.basis ?? []).map((v) => v.map(parseNumber));
      if (p.some((x) => !x) || B.some((v) => v.some((x) => !x))) return { ok: false, why: 'Fill every entry.' };
      const wantP = vec(spec.particular);
      const wantB = (spec.basis ?? []).map(vec);
      const diff = p.map((x, i) => x.sub(wantP[i]));
      const pOk = wantB.length ? inSpan(diff, wantB) : diff.every((x) => x.zero);
      if (!pOk) return { ok: false, why: 'Your particular solution does not solve the system.' };
      return check({ type: 'basis', value: wantB }, B);
    }
    case 'text': {
      const got = normalizeText(response);
      if (!got) return { ok: false, why: 'Type an answer.' };
      return { ok: spec.accept.some((a) => normalizeText(a) === got) };
    }
    case 'choice':
      return { ok: response === spec.value };
    case 'multi': {
      const got = new Set(response ?? []);
      const want = new Set(spec.value);
      const missing = [...want].filter((x) => !got.has(x)).length;
      const extra = [...got].filter((x) => !want.has(x)).length;
      if (!missing && !extra) return { ok: true };
      return { ok: false, why: extra && !missing ? 'You picked one too many.' : missing && !extra ? 'There is at least one more.' : undefined };
    }
    case 'set': {
      const parts = String(response ?? '').replace(/^[{(]\s*|\s*[})]$/g, '').split(/\s*,\s*/).filter(Boolean);
      const key = (x) => parseNumber(x)?.toString() ?? normalizeText(x);
      const got = new Set(parts.map(key));
      const want = new Set(spec.value.map(key));
      const ok = got.size === want.size && [...want].every((x) => got.has(x));
      return { ok, why: ok ? undefined : got.size !== want.size ? `The set has ${want.size} element${want.size === 1 ? '' : 's'}.` : undefined };
    }
    case 'proof':
      return { ok: null };
    default:
      throw new Error(`Unknown answer type ${spec.type}`);
  }
}

/** A display string of the expected answer (for "show answer"). TeX. */
export function answerTex(spec) {
  const t = (x) => F(x).tex();
  switch (spec.type) {
    case 'number':
      return t(spec.value);
    case 'vector':
      return `\\begin{bmatrix}${spec.value.map(t).join('\\\\')}\\end{bmatrix}`;
    case 'matrix':
      return `\\begin{bmatrix}${spec.value.map((r) => r.map(t).join('&')).join('\\\\')}\\end{bmatrix}`;
    case 'basis':
    case 'span':
      return spec.value.length ? `\\left\\{${spec.value.map((v) => `\\begin{bmatrix}${v.map(t).join('\\\\')}\\end{bmatrix}`).join(',\\;')}\\right\\}` : '\\{\\,\\}';
    case 'solution': {
      const v = (x) => `\\begin{bmatrix}${x.map(t).join('\\\\')}\\end{bmatrix}`;
      return [v(spec.particular), ...(spec.basis ?? []).map((b, i) => `t_{${i + 1}}${v(b)}`)].join(' + ');
    }
    case 'set':
      return `\\{${spec.value.join(', ')}\\}`;
    case 'text':
      return `\\text{${spec.accept[0]}}`;
    default:
      return '';
  }
}
