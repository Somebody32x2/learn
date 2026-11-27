/**
 * Structure of every lecture of every subject (matrix/, foundations/), loaded the way the player and tts/gen.mjs
 * load them (course.js → entry.load()), without a DOM: lecture modules only touch the stage at runtime.
 *
 * Checks: course shape and unique lecture ids that match the lecture files; unique beat ids; scene beats (title,
 * scene(), ≥ 1 step, non-empty `say`, `do` a function or absent); interlude kinds and required fields (CONTRACT.md);
 * no `$…$` in narration without `{spoken words}` right after it; choice answers name existing choices; chips contain
 * their answer; every checkable answer spec accepts its own value; generate(rng(seed)) variants are well-formed and
 * self-check. Also unit tests for tts/speech.mjs (narration → spoken words). Subjects without course.js are skipped.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { check } from '../src/core/answer.js';
import { rng } from '../src/core/hash.js';
import { spoken, pieces } from '../tts/speech.mjs';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const SUBJECTS = ['matrix', 'foundations'];
const KINDS = ['try', 'blanks', 'workout', 'explain'];
const SPEC_TYPES = ['number', 'vector', 'matrix', 'basis', 'span', 'solution', 'text', 'choice', 'multi', 'set', 'proof'];

const nonEmpty = (x) => typeof x === 'string' && x.trim().length > 0;
const strs = (xs) => xs.map(String);

/** Every `$…$` in narration must be followed by `{spoken words}`. Returns the offending pieces. */
function unspokenMath(say) {
  const bad = [];
  const re = /\$((?:[^$\\]|\\.)+)\$(\{[^}]*\})?/g;
  for (let m; (m = re.exec(say)); ) if (!m[2] || !m[2].slice(1, -1).trim()) bad.push(m[0]);
  if (say.replace(re, '').includes('$')) bad.push('unpaired $');
  return bad;
}

/** The spec's own value in the form the inputs produce, or undefined when it is not auto-checkable. */
function selfResponse(spec) {
  switch (spec.type) {
    case 'number':
      return String(spec.value);
    case 'vector':
      return strs(spec.value);
    case 'matrix':
      return spec.value.map(strs);
    case 'basis':
    case 'span':
      return spec.value.map(strs);
    case 'solution':
      return { particular: strs(spec.particular), basis: (spec.basis ?? []).map(strs) };
    case 'choice':
      return spec.value;
    case 'multi':
      return spec.value.slice();
    case 'text':
      return spec.accept[0];
    case 'set':
      return spec.value.join(', ');
    default:
      return undefined;
  }
}

function assertSpec(spec, where) {
  assert.ok(spec && typeof spec === 'object', `${where}: answer spec missing`);
  assert.ok(SPEC_TYPES.includes(spec.type), `${where}: unknown answer type ${spec.type}`);
  if (spec.type === 'text') assert.ok(Array.isArray(spec.accept) && spec.accept.length && spec.accept.every(nonEmpty), `${where}: text needs accept[]`);
  if (spec.type === 'solution') assert.ok(Array.isArray(spec.particular), `${where}: solution needs particular`);
  else if (!['text', 'proof'].includes(spec.type)) assert.ok(spec.value !== undefined && spec.value !== null, `${where}: spec needs value`);
  if (['multi', 'set', 'vector', 'matrix', 'basis', 'span'].includes(spec.type)) assert.ok(Array.isArray(spec.value), `${where}: value must be an array`);
  const response = selfResponse(spec);
  if (response === undefined) return;
  const r = check(spec, response);
  assert.equal(r.ok, true, `${where}: the spec does not accept its own value ${JSON.stringify(response)} (${r.why ?? 'no reason'})`);
}

function assertChoices(beat, where) {
  const { answer } = beat;
  if (!['choice', 'multi'].includes(answer?.type)) return;
  assert.ok(Array.isArray(beat.choices) && beat.choices.length >= 2, `${where}: choice questions need choices[]`);
  const ids = beat.choices.map((c) => c.id);
  assert.equal(new Set(ids).size, ids.length, `${where}: duplicate choice ids`);
  for (const c of beat.choices) {
    assert.ok(nonEmpty(c.id), `${where}: choice without id`);
    assert.ok(nonEmpty(c.label), `${where}: choice ${c.id} without label`);
  }
  for (const v of [answer.value].flat()) assert.ok(ids.includes(v), `${where}: answer ${v} is not a choice id`);
}

const assertParas = (xs, where, what = 'solution') =>
  assert.ok(Array.isArray(xs) && xs.length > 0 && xs.every(nonEmpty), `${where}: ${what} must be a non-empty array of markdown strings`);

function assertSay(say, where) {
  assert.ok(nonEmpty(say), `${where}: empty say`);
  assert.deepEqual(unspokenMath(say), [], `${where}: math without {spoken words} in "${say}"`);
  const warnings = [];
  const ps = pieces(say, { warn: (m) => warnings.push(m) });
  assert.deepEqual(warnings, [], `${where}: speech warnings`);
  assert.ok(ps.length > 0, `${where}: nothing to speak`);
  for (const p of ps) assert.ok(p.text.length <= 400 && !p.text.includes('$'), `${where}: bad speech piece "${p.text}"`);
}

function checkGenerate(beat, where) {
  if (beat.generate === undefined) return;
  assert.equal(typeof beat.generate, 'function', `${where}: generate must be a function`);
  for (const seed of [1, 2, 3]) {
    const v = beat.generate(rng(seed));
    const w = `${where} generate(rng(${seed}))`;
    assert.ok(v && nonEmpty(v.prompt), `${w}: no prompt`);
    assert.ok(Array.isArray(v.solution) ? v.solution.length && v.solution.every(nonEmpty) : nonEmpty(v.solution), `${w}: no solution`);
    assertSpec(v.answer, w);
    if (['choice', 'multi'].includes(v.answer.type)) assertChoices({ answer: v.answer, choices: v.choices ?? beat.choices }, w);
    const again = beat.generate(rng(seed));
    assert.deepEqual(JSON.parse(JSON.stringify(again.answer)), JSON.parse(JSON.stringify(v.answer)), `${w}: not deterministic`);
  }
}

function checkBeat(beat, where) {
  if (!beat.kind) {
    assert.ok(nonEmpty(beat.title), `${where}: scene beat needs a title`);
    assert.equal(typeof beat.scene, 'function', `${where}: scene beat needs scene(s)`);
    assert.ok(Array.isArray(beat.steps) && beat.steps.length >= 1, `${where}: scene beat needs at least one step`);
    beat.steps.forEach((step, i) => {
      assertSay(step.say, `${where} step ${i + 1}`);
      assert.ok(step.do === undefined || typeof step.do === 'function', `${where} step ${i + 1}: do must be a function`);
    });
    return;
  }
  assert.ok(KINDS.includes(beat.kind), `${where}: unknown kind ${beat.kind}`);
  assert.ok(nonEmpty(beat.title), `${where}: interlude needs a title`);
  assertSay(beat.say, where);
  if (beat.figure !== undefined) assert.equal(typeof beat.figure, 'function', `${where}: figure must be a function`);
  switch (beat.kind) {
    case 'try':
      assert.ok(nonEmpty(beat.prompt), `${where}: try needs a prompt`);
      assertSpec(beat.answer, where);
      assertChoices(beat, where);
      assertParas(beat.solution, where);
      if (beat.hint !== undefined) assert.ok(nonEmpty(beat.hint), `${where}: empty hint`);
      checkGenerate(beat, where);
      break;
    case 'blanks': {
      assert.ok(Array.isArray(beat.lines) && beat.lines.length > 0, `${where}: blanks needs lines`);
      const ids = [];
      const checkBlank = (part) => {
        assert.ok(part && nonEmpty(part.id), `${where}: blank without id`);
        ids.push(part.id);
        const w = `${where} blank ${part.id}`;
        if (part.chips) {
          assert.ok(Array.isArray(part.chips) && part.chips.length >= 2, `${w}: chips need at least two options`);
          assert.ok(typeof part.answer === 'string' && part.chips.includes(part.answer), `${w}: chips must contain the answer`);
        } else {
          assertSpec(part.answer, w);
        }
      };
      for (const line of beat.lines) {
        assert.ok(Array.isArray(line), `${where}: each line is an array`);
        for (const part of line) {
          if (typeof part === 'string') continue;
          if (part && Array.isArray(part.matrix)) {
            // a matrix piece: rows of cells, each a TeX string or a blank
            const rows = part.matrix;
            assert.ok(rows.length > 0 && rows.every((r) => Array.isArray(r) && r.length === rows[0].length && r.length > 0), `${where}: matrix piece rows must be non-empty and equally long`);
            if (part.augment !== undefined) assert.ok(Number.isInteger(part.augment) && part.augment > 0 && part.augment < rows[0].length, `${where}: matrix augment must split the columns`);
            for (const cell of rows.flat()) if (typeof cell !== 'string' && typeof cell !== 'number') checkBlank(cell);
            continue;
          }
          if (part && typeof part.tex === 'string') {
            // blanks inside TeX: every \blank{id} has a definition and every definition is used exactly once
            const used = [...part.tex.matchAll(/\\blank\{([^}]*)\}/g)].map((m) => m[1]);
            const defs = part.blanks ?? {};
            assert.ok(used.length > 0, `${where}: tex piece without \\blank{…}`);
            assert.equal(new Set(used).size, used.length, `${where}: a \\blank id appears twice in one tex piece`);
            for (const id of used) assert.ok(defs[id], `${where}: \\blank{${id}} has no entry in blanks`);
            for (const id of Object.keys(defs)) assert.ok(used.includes(id), `${where}: blanks.${id} is never used in the tex`);
            for (const id of used) checkBlank({ ...defs[id], id });
            continue;
          }
          checkBlank(part);
        }
      }
      assert.ok(ids.length > 0, `${where}: no blanks`);
      assert.equal(new Set(ids).size, ids.length, `${where}: duplicate blank ids`);
      if (beat.solution !== undefined) assertParas(beat.solution, where);
      break;
    }
    case 'workout':
      assert.ok(nonEmpty(beat.prompt), `${where}: workout needs a prompt`);
      assertSpec(beat.answer, where);
      assertChoices(beat, where);
      assertParas(beat.solution, where);
      if (beat.hints !== undefined) assert.ok(Array.isArray(beat.hints) && beat.hints.every(nonEmpty), `${where}: hints must be strings`);
      if (beat.answer.type === 'proof') assertParas(beat.rubric, where, 'rubric');
      checkGenerate(beat, where);
      break;
    case 'explain':
      assert.ok(nonEmpty(beat.prompt), `${where}: explain needs a prompt`);
      assertParas(beat.points, where, 'points');
      break;
  }
}

for (const slug of SUBJECTS) {
  const file = `${ROOT}${slug}/course.js`;
  if (!existsSync(file)) {
    test(`${slug}: lectures`, { skip: `${slug}/course.js does not exist yet` }, () => {});
    continue;
  }

  test(`${slug}: lectures`, async (t) => {
    const { default: course } = await import(pathToFileURL(file).href);
    assert.equal(course.slug, slug, 'course.slug must equal the folder name');
    for (const k of ['title', 'course', 'voice']) assert.ok(nonEmpty(course[k]), `course.${k} missing`);
    assert.ok(Array.isArray(course.units) && course.units.length > 0, 'course.units missing');
    const entries = course.units.flatMap((u) => {
      assert.ok(nonEmpty(u.title), 'unit without title');
      assert.ok(Array.isArray(u.lectures), `unit ${u.title}: lectures missing`);
      return u.lectures;
    });
    const ids = entries.map((e) => e.id);
    assert.equal(new Set(ids).size, ids.length, `duplicate lecture ids: ${ids.filter((x, i) => ids.indexOf(x) !== i)}`);

    for (const entry of entries) {
      await t.test(entry.id, async () => {
        assert.ok(nonEmpty(entry.id) && /^[a-z0-9-]+$/.test(entry.id), `bad lecture id ${entry.id}`);
        assert.ok(nonEmpty(entry.title), `${entry.id}: entry title missing`);
        assert.equal(typeof entry.load, 'function', `${entry.id}: entry.load must be a function`);
        const { default: lecture } = await entry.load();
        assert.ok(lecture, `${entry.id}: no default export`);
        assert.equal(lecture.id, entry.id, 'lecture.id must match its course.js entry');
        assert.ok(nonEmpty(lecture.title), 'lecture title missing');
        assert.ok(Array.isArray(lecture.goals), 'lecture goals missing');
        assert.ok(Array.isArray(lecture.beats) && lecture.beats.length > 0, 'lecture has no beats');
        const beatIds = lecture.beats.map((b) => b.id);
        assert.ok(beatIds.every(nonEmpty), 'beat without id');
        assert.equal(new Set(beatIds).size, beatIds.length, `duplicate beat ids: ${beatIds.filter((x, i) => beatIds.indexOf(x) !== i)}`);
        for (const beat of lecture.beats) checkBeat(beat, `${slug}/${entry.id}/${beat.id}`);
      });
    }
  });
}

test('speech: math becomes words, pauses, pronunciation', () => {
  assert.equal(spoken('So $x_1 = 3${x one equals three}.'), 'So x one equals three.');
  const warned = [];
  assert.equal(spoken('Then $x$ is free.', { warn: (m) => warned.push(m) }), 'Then is free.');
  assert.equal(warned.length, 1);
  assert.equal(spoken('Row reduce to RREF, e.g. by hand.'), 'Row reduce to R-R-E-F, for example by hand.');
  assert.equal(spoken('A subspace of R^n, i.e. of Rⁿ.'), 'A subspace of R n, that is of R n.');
  assert.equal(spoken('p iff q; gcd vs. lcm'), 'p if and only if q; G C D versus L C M');
  assert.equal(spoken('The det is zero, so determinants vanish.'), 'The determinant is zero, so determinants vanish.');
  assert.equal(spoken('First <pause> then'), 'First. then');
  assert.equal(spoken('First, <short pause> then'), 'First, then');
  assert.deepEqual(unspokenMath('Fine $a${a} and $b$ and $c${ }'), ['$b$', '$c${ }']);
  assert.deepEqual(unspokenMath('costs 5 $'), ['unpaired $']);
});

test('speech: pieces carry pauses and stay under 400 characters', () => {
  assert.deepEqual(pieces('One. <pause> Two. <short pause>'), [{ text: 'One.', pause: 600 }, { text: 'Two.', pause: 300 }]);
  const long = Array.from({ length: 30 }, (_, i) => `Sentence number ${i} is here.`).join(' ');
  const ps = pieces(long);
  assert.ok(ps.length > 1);
  assert.ok(ps.every((p) => p.text.length <= 400 && p.pause === 0));
  assert.equal(ps.map((p) => p.text).join(' '), long);
});
