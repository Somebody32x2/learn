#!/usr/bin/env node
/**
 * Narration audio for the lectern subjects (Kokoro-82M, local, offline). See lectern/tts/README.md.
 *
 *   node lectern/tts/gen.mjs              every subject with a course.js (matrix, foundations)
 *   node lectern/tts/gen.mjs matrix       only these subjects
 *   node lectern/tts/gen.mjs --dry        counts and characters of what is missing; synthesizes nothing
 *   node lectern/tts/gen.mjs --jobs 4     4 persistent Kokoro workers (default 2); KOKORO_THREADS=n threads per worker
 *   node lectern/tts/gen.mjs --max 10     stop after 10 clips
 *   node lectern/tts/gen.mjs --redo eigen re-record clips whose say matches /eigen/i (after a pronunciation fix)
 *
 * Every `say` of a scene step and of an interlude beat (`beat.say`) is one clip `<subject>/audio/<key>.mp3`,
 * key = clipKey(course.voice, say) from lectern/src/core/hash.js (the browser computes the same key). Existing
 * clips are never made again, so editing one step re-records only that step. After each lecture the subject's
 * `audio/index.json` `{ voice, clips: { key: seconds } }` is rewritten (clips that exist, keys sorted).
 * Needs lectern/tts/.venv (kokoro-onnx), lectern/tts/models, ffmpeg and ffprobe.
 */
import { execFile, spawn } from 'node:child_process';
import { cpus } from 'node:os';
import { promisify } from 'node:util';
import { createInterface } from 'node:readline';
import { existsSync, mkdirSync, openSync, closeSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { clipKey } from '../src/core/hash.js';
import { pieces } from './speech.mjs';

const TTS = dirname(fileURLToPath(import.meta.url));
const ROOT = join(TTS, '..', '..');
const WORK = join(TTS, '.work');
const PYTHON = join(TTS, '.venv', 'bin', 'python');
const SUBJECTS = ['matrix', 'foundations'];
const SPEED = 1.0;
const ENCODING = { rate: 24000, bitrate: '48k' };

const args = process.argv.slice(2);
const flag = (name, fallback) => (args.includes(name) ? Number(args[args.indexOf(name) + 1]) : fallback);
const dry = args.includes('--dry');
const maxClips = flag('--max', Infinity);
const jobs = Math.max(1, flag('--jobs', 2) || 1);
const threads = Number(process.env.KOKORO_THREADS) || Math.max(2, Math.floor(cpus().length / jobs));
const redoArg = args.includes('--redo') ? args[args.indexOf('--redo') + 1] : null;
const redo = redoArg ? new RegExp(redoArg, 'i') : null;
const only = args.filter((a, i) => !a.startsWith('--') && !['--max', '--jobs', '--redo'].includes(args[i - 1]));

const execFileP = promisify(execFile);
const round = (s) => Math.round(s * 100) / 100;

/** One long-lived Kokoro worker process: send a job line, await its one-line reply. */
function startWorker() {
  const py = spawn(PYTHON, [join(TTS, 'kokoro_say.py')], { stdio: ['pipe', 'pipe', 'inherit'], env: { ...process.env, KOKORO_THREADS: String(threads) } });
  const lines = createInterface({ input: py.stdout });
  const waiting = [];
  lines.on('line', (l) => {
    let msg;
    try {
      msg = JSON.parse(l);
    } catch {
      return; // stray library output
    }
    waiting.shift()?.[0](msg);
  });
  py.on('error', (e) => waiting.splice(0).forEach(([, rej]) => rej(e)));
  py.on('exit', (c) => waiting.splice(0).forEach(([, rej]) => rej(new Error(`kokoro worker exited (${c})`))));
  const next = () => new Promise((res, rej) => waiting.push([res, rej]));
  const ready = next();
  return {
    ready,
    async say(job) {
      const reply = next();
      py.stdin.write(`${JSON.stringify(job)}\n`);
      const r = await reply;
      if (!r.ok) throw new Error(r.error);
      return r;
    },
    stop: () => py.stdin.end(),
  };
}

async function toMp3(wav, mp3) {
  const tmp = `${mp3}.tmp.mp3`;
  await execFileP('ffmpeg', ['-loglevel', 'error', '-y', '-i', wav, '-ac', '1', '-ar', String(ENCODING.rate), '-b:a', ENCODING.bitrate, tmp]);
  renameSync(tmp, mp3);
}

async function duration(mp3) {
  const { stdout } = await execFileP('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', mp3]);
  return round(Number(stdout.trim()));
}

/** Every narration line of a lecture, in order, deduplicated: [{ say, where }]. */
function clipsOf(lecture) {
  const out = [];
  const seen = new Set();
  const addSay = (say, where) => {
    if (typeof say !== 'string' || !say.trim() || seen.has(say)) return;
    seen.add(say);
    out.push({ say, where });
  };
  for (const beat of lecture.beats ?? []) {
    addSay(beat.say, beat.id);
    (beat.steps ?? []).forEach((step, i) => addSay(step.say, `${beat.id}#${i + 1}`));
  }
  return out;
}

async function loadSubject(slug) {
  const file = join(ROOT, slug, 'course.js');
  if (!existsSync(file)) return null;
  const { default: course } = await import(pathToFileURL(file).href);
  const lectures = [];
  const failed = [];
  for (const unit of course.units ?? []) {
    for (const entry of unit.lectures ?? []) {
      try {
        const { default: lecture } = await entry.load();
        lectures.push({ id: entry.id, clips: clipsOf(lecture).map((c) => ({ ...c, key: clipKey(course.voice, c.say) })) });
      } catch (e) {
        failed.push(entry.id);
        console.error(`${slug}/${entry.id}: could not load (${e.message}); skipped`);
      }
    }
  }
  return { slug, course, lectures, failed, audio: join(ROOT, slug, 'audio') };
}

/** Rewrites <subject>/audio/index.json from the clips on disk. */
async function writeIndex(subject, known) {
  const clips = {};
  const refs = new Set(subject.lectures.flatMap((l) => l.clips.map((c) => c.key)));
  // Keep earlier entries too when a lecture failed to load (its clips are still valid, just unlisted this run).
  if (subject.failed.length) for (const k of Object.keys(known)) refs.add(k);
  for (const key of [...refs].sort()) {
    const mp3 = join(subject.audio, `${key}.mp3`);
    if (!existsSync(mp3)) continue;
    known[key] ??= await duration(mp3);
    clips[key] = known[key];
  }
  const tmp = join(subject.audio, 'index.json.tmp');
  writeFileSync(tmp, `${JSON.stringify({ voice: subject.course.voice, clips }, null, 1)}\n`);
  renameSync(tmp, join(subject.audio, 'index.json'));
  return Object.keys(clips).length;
}

function readIndex(subject) {
  const file = join(subject.audio, 'index.json');
  if (!existsSync(file)) return {};
  try {
    const idx = JSON.parse(readFileSync(file, 'utf8'));
    return idx.voice === subject.course.voice ? { ...idx.clips } : {};
  } catch {
    return {};
  }
}

async function main() {
  const unknown = only.filter((s) => !SUBJECTS.includes(s) && !existsSync(join(ROOT, s, 'course.js')));
  if (unknown.length) throw new Error(`no course.js for: ${unknown.join(', ')}`);
  const subjects = [];
  for (const slug of only.length ? only : SUBJECTS) {
    const s = await loadSubject(slug);
    if (s) subjects.push(s);
    else console.log(`${slug}: no course.js yet, skipped`);
  }

  // --redo: drop the matching clips so the run below records them again.
  if (redo) {
    let n = 0;
    for (const s of subjects) {
      for (const l of s.lectures) {
        for (const c of l.clips) {
          const mp3 = join(s.audio, `${c.key}.mp3`);
          if (!redo.test(c.say) || !existsSync(mp3)) continue;
          n++;
          if (!dry) unlinkSync(mp3);
        }
      }
    }
    console.log(`--redo ${redo}: ${n} clip(s) ${dry ? 'would be' : ''} re-recorded`.replace('  ', ' '));
  }

  // Summary of what is missing.
  let missingTotal = 0;
  let charsTotal = 0;
  for (const s of subjects) {
    let clips = 0;
    let missing = 0;
    let chars = 0;
    for (const l of s.lectures) {
      const todo = l.clips.filter((c) => !existsSync(join(s.audio, `${c.key}.mp3`)));
      const n = todo.reduce((t, c) => t + c.say.length, 0);
      clips += l.clips.length;
      missing += todo.length;
      chars += n;
      if (dry) console.log(`  ${s.slug}/${l.id}: ${l.clips.length} clips, ${todo.length} missing (${n} characters)`);
    }
    console.log(`${s.slug} (${s.course.voice}): ${s.lectures.length} lectures, ${clips} clips, ${missing} missing (${chars} characters)`);
    missingTotal += missing;
    charsTotal += chars;
  }
  console.log(`total: ${missingTotal} clip(s) to make, ${charsTotal} characters${dry ? ' (dry run)' : ''}`);
  if (dry) return;

  mkdirSync(WORK, { recursive: true });
  const lock = join(WORK, '.lock');
  let fd;
  try {
    fd = openSync(lock, 'wx');
  } catch {
    throw new Error(`another run holds ${lock} (delete it if no run is active)`);
  }
  let workers = [];
  let voices = null;
  let made = 0;
  let audioSec = 0;
  let failed = null;
  const t0 = Date.now();
  const budget = Math.min(maxClips, missingTotal);
  try {
    for (const s of subjects) {
      mkdirSync(s.audio, { recursive: true });
      const known = readIndex(s);
      for (const l of s.lectures) {
        const queue = l.clips.filter((c) => !existsSync(join(s.audio, `${c.key}.mp3`))).slice(0, Math.max(0, maxClips - made));
        if (queue.length && !failed) {
          if (!workers.length) {
            workers = Array.from({ length: Math.min(jobs, budget) }, startWorker);
            console.log(`${workers.length} worker(s) × ${threads} thread(s)`);
            ({ voices } = await workers[0].ready);
          }
          if (!voices.includes(s.course.voice)) throw new Error(`${s.slug}: unknown Kokoro voice ${s.course.voice}`);
          const lang = s.course.voice.startsWith('b') ? 'en-gb' : 'en-us';
          const run = async (worker) => {
            await worker.ready;
            for (let c; !failed && (c = queue.shift()); ) {
              const wav = join(WORK, `${c.key}.wav`);
              const mp3 = join(s.audio, `${c.key}.mp3`);
              const t = Date.now();
              try {
                const r = await worker.say({ out: wav, voice: s.course.voice, speed: SPEED, lang, pieces: pieces(c.say, { warn: (m) => console.warn(`${s.slug}/${l.id} ${c.where}: ${m}`) }) });
                await toMp3(wav, mp3);
                unlinkSync(wav);
                known[c.key] = await duration(mp3).catch(() => round(r.dur));
                made++;
                audioSec += known[c.key];
                console.log(`made  ${s.slug}/${l.id} ${c.where}  ${c.key}  ${known[c.key].toFixed(1)}s audio in ${((Date.now() - t) / 1000).toFixed(1)}s  (${made}/${budget})`);
              } catch (e) {
                failed ??= new Error(`${s.slug}/${l.id} ${c.where} ${c.key}: ${e.message}`);
              }
            }
          };
          await Promise.all(workers.map(run));
        }
        const n = await writeIndex(s, known);
        const left = l.clips.filter((c) => !existsSync(join(s.audio, `${c.key}.mp3`))).length;
        console.log(`${s.slug}/${l.id}: ${left ? `${left} missing` : 'all recorded'} (index: ${n} clips)`);
      }
    }
    if (made >= maxClips && made < missingTotal) console.log(`stopped at --max ${maxClips}; run again to continue`);
    const wall = (Date.now() - t0) / 1000;
    if (made) console.log(`${made} clip(s), ${audioSec.toFixed(1)}s of audio in ${wall.toFixed(1)}s (${(audioSec / wall).toFixed(2)}x realtime, incl. model load)`);
    if (failed) throw failed;
  } finally {
    for (const w of workers) w.stop();
    closeSync(fd);
    unlinkSync(lock);
  }
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
