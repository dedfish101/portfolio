'use strict';

require('dotenv').config();

const crypto = require('crypto');
const path = require('path');
const express = require('express');
const multer = require('multer');
const AdmZip = require('adm-zip');

const { improveMarkdown, getRateLimitInfo, DEFAULT_MODEL } = require('./groq');

const PORT = Number(process.env.PORT) || 1337;
const JOB_TTL_MS = 30 * 60 * 1000;
const PREVIEW_CHAR_LIMIT = 200_000;

const MD_RE = /\.(md|markdown)$/i;
const JUNK_SEGMENTS = new Set(['__MACOSX', 'node_modules', '.git']);
const JUNK_FILES = new Set(['.DS_Store', 'Thumbs.db']);

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024, files: 400 },
});

app.use(express.static(path.join(__dirname, 'public')));

// Jobs live in memory only; nothing is written to disk and entries expire after 30 minutes.
const jobs = new Map();

function cleanPath(raw) {
  const segments = String(raw)
    .replace(/\\/g, '/')
    .split('/')
    .filter((s) => s && s !== '.' && s !== '..');
  if (!segments.length) return null;
  if (segments.some((s) => JUNK_SEGMENTS.has(s))) return null;
  if (JUNK_FILES.has(segments[segments.length - 1])) return null;
  return segments.join('/');
}

function collectEntries(files, paths) {
  const byPath = new Map();
  files.forEach((file, index) => {
    const name = paths[index] || file.originalname;
    if (/\.zip$/i.test(name)) {
      const zip = new AdmZip(file.buffer);
      for (const entry of zip.getEntries()) {
        if (entry.isDirectory) continue;
        const p = cleanPath(entry.entryName);
        if (p) byPath.set(p, { path: p, data: entry.getData() });
      }
    } else {
      const p = cleanPath(name);
      if (p) byPath.set(p, { path: p, data: file.buffer });
    }
  });
  return [...byPath.values()];
}

function addWarning(job, message) {
  if (message && !job.warnings.includes(message)) job.warnings.push(message);
}

async function runJob(job, entries, settings) {
  const zip = new AdmZip();
  const siblings = entries.filter((e) => !MD_RE.test(e.path)).map((e) => e.path);

  for (const entry of entries) {
    if (!MD_RE.test(entry.path)) {
      zip.addFile(entry.path, entry.data);
      continue;
    }

    job.currentFile = entry.path;
    const original = entry.data.toString('utf8');
    let improved = original;

    try {
      const result = await improveMarkdown({
        content: original,
        filePath: entry.path,
        siblingFiles: siblings,
        settings,
      });
      improved = result.content;
      result.warnings.forEach((w) => addWarning(job, w));
    } catch (err) {
      addWarning(job, `${entry.path}: ${err.message} — kept the original text.`);
    }

    zip.addFile(entry.path, Buffer.from(improved, 'utf8'));
    job.results.push({
      path: entry.path,
      original: original.slice(0, PREVIEW_CHAR_LIMIT),
      improved: improved.slice(0, PREVIEW_CHAR_LIMIT),
    });
    job.done += 1;
  }

  job.zip = zip.toBuffer();
  job.currentFile = null;
  job.status = 'done';
}

app.get('/api/status', (req, res) => {
  res.json({
    keyConfigured: Boolean(process.env.GROQ_API_KEY),
    defaultModel: process.env.GROQ_MODEL || DEFAULT_MODEL,
    rateLimit: getRateLimitInfo(),
  });
});

app.post('/api/process', upload.array('files'), (req, res) => {
  if (!process.env.GROQ_API_KEY) {
    return res.status(400).json({
      error: 'GROQ_API_KEY is not set. Add it to .env (or export it) and restart the server.',
    });
  }

  let settings = {};
  let paths = [];
  try {
    settings = JSON.parse(req.body.settings || '{}');
    paths = JSON.parse(req.body.paths || '[]');
  } catch {
    return res.status(400).json({ error: 'Invalid request payload.' });
  }

  let entries;
  try {
    entries = collectEntries(req.files || [], paths);
  } catch (err) {
    return res.status(400).json({ error: `Could not read the upload: ${err.message}` });
  }

  if (!entries.length) return res.status(400).json({ error: 'No usable files received.' });

  const total = entries.filter((e) => MD_RE.test(e.path)).length;
  if (!total) return res.status(400).json({ error: 'No markdown (.md) files found in the upload.' });

  const id = crypto.randomBytes(8).toString('hex');
  const job = {
    id,
    status: 'processing',
    total,
    done: 0,
    currentFile: null,
    warnings: [],
    error: null,
    results: [],
    zip: null,
    createdAt: Date.now(),
  };
  jobs.set(id, job);
  res.json({ jobId: id, total });

  runJob(job, entries, settings).catch((err) => {
    job.status = 'error';
    job.error = err.message;
  });
});

function findJob(req, res) {
  const job = jobs.get(req.params.id);
  if (!job) res.status(404).json({ error: 'Job not found (it may have expired).' });
  return job;
}

app.get('/api/job/:id', (req, res) => {
  const job = findJob(req, res);
  if (!job) return;
  const { status, total, done, currentFile, warnings, error } = job;
  res.json({ status, total, done, currentFile, warnings, error });
});

app.get('/api/job/:id/result', (req, res) => {
  const job = findJob(req, res);
  if (!job) return;
  if (job.status !== 'done') return res.status(409).json({ error: 'Job is not finished yet.' });
  res.json({ results: job.results, warnings: job.warnings });
});

app.get('/api/job/:id/download', (req, res) => {
  const job = findJob(req, res);
  if (!job) return;
  if (job.status !== 'done') return res.status(409).json({ error: 'Job is not finished yet.' });
  res.set({
    'Content-Type': 'application/zip',
    'Content-Disposition': 'attachment; filename="improved-reports.zip"',
  });
  res.send(job.zip);
});

// Multer size/count violations and malformed multipart bodies land here.
app.use((err, req, res, next) => {
  res.status(400).json({ error: err.message || 'Upload failed.' });
});

setInterval(() => {
  const now = Date.now();
  for (const [id, job] of jobs) {
    if (now - job.createdAt > JOB_TTL_MS) jobs.delete(id);
  }
}, 60 * 1000).unref();

app.listen(PORT, () => {
  console.log(`CTF Report Improver running at http://localhost:${PORT}`);
  if (!process.env.GROQ_API_KEY) {
    console.warn('WARNING: GROQ_API_KEY is not set — processing requests will fail until it is.');
  }
});
