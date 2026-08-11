'use strict';

const $ = (id) => document.getElementById(id);

const els = {
  dropzone: $('dropzone'),
  folderInput: $('folder-input'),
  filesInput: $('files-input'),
  pickFolder: $('pick-folder'),
  pickFiles: $('pick-files'),
  cmdLine: $('cmd-line'),
  manifest: $('manifest'),
  statFiles: $('stat-files'),
  statMd: $('stat-md'),
  statImages: $('stat-images'),
  statSize: $('stat-size'),
  clearBtn: $('clear-btn'),
  treePanel: $('tree-panel'),
  tree: $('tree'),
  progressPanel: $('progress-panel'),
  barFill: $('bar-fill'),
  progressCount: $('progress-count'),
  progressFile: $('progress-file'),
  errorBox: $('error-box'),
  errorText: $('error-text'),
  warnings: $('warnings'),
  warningsBody: $('warnings-body'),
  previewPanel: $('preview-panel'),
  fileSelect: $('file-select'),
  viewRaw: $('view-raw'),
  viewRendered: $('view-rendered'),
  paneBefore: $('pane-before'),
  paneAfter: $('pane-after'),
  processBtn: $('process-btn'),
  downloadBtn: $('download-btn'),
  keyStatus: $('key-status'),
  model: $('model-select'),
  category: $('category-select'),
  customInstructions: $('custom-instructions'),
  optDepth: $('opt-depth'),
  optCvss: $('opt-cvss'),
  optSummary: $('opt-summary'),
  rateFill: $('rate-fill'),
  rateLabel: $('rate-label'),
};

const MD_RE = /\.(md|markdown)$/i;
const IMG_RE = /\.(png|jpe?g|gif|svg|webp|bmp|ico)$/i;
const JUNK_RE = /(^|\/)(\.git|__MACOSX|node_modules|\.DS_Store|Thumbs\.db)(\/|$)/;

const state = {
  files: new Map(), // path -> File
  results: [],
  objectUrls: new Map(),
  viewMode: 'raw',
  processing: false,
  phase: 'idle', // idle | running | done
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/* ---------- file intake ---------- */

function addFiles(items) {
  for (const { path, file } of items) {
    const clean = path.replace(/\\/g, '/').replace(/^\/+/, '');
    if (!clean || JUNK_RE.test(clean)) continue;
    state.files.set(clean, file);
  }
  refreshUi();
}

function walkEntry(entry, prefix, out) {
  return new Promise((resolve) => {
    if (entry.isFile) {
      entry.file((file) => {
        out.push({ path: prefix + entry.name, file });
        resolve();
      }, resolve);
    } else if (entry.isDirectory) {
      const reader = entry.createReader();
      const readBatch = () =>
        reader.readEntries(async (batch) => {
          if (!batch.length) return resolve();
          await Promise.all(batch.map((child) => walkEntry(child, `${prefix}${entry.name}/`, out)));
          readBatch();
        }, resolve);
      readBatch();
    } else {
      resolve();
    }
  });
}

async function handleDrop(event) {
  event.preventDefault();
  els.dropzone.classList.remove('dragover');

  const collected = [];
  const traversals = [];
  const items = [...(event.dataTransfer?.items || [])];

  for (const item of items) {
    const entry = item.webkitGetAsEntry?.();
    if (entry) {
      traversals.push(walkEntry(entry, '', collected));
    } else {
      const file = item.getAsFile?.();
      if (file) collected.push({ path: file.name, file });
    }
  }
  if (!items.length) {
    for (const file of event.dataTransfer?.files || []) collected.push({ path: file.name, file });
  }

  await Promise.all(traversals);
  addFiles(collected);
}

/* ---------- ui state ---------- */

function formatSize(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function refreshUi() {
  const paths = [...state.files.keys()];
  const mdCount = paths.filter((p) => MD_RE.test(p)).length;
  const imgCount = paths.filter((p) => IMG_RE.test(p)).length;
  const hasZip = paths.some((p) => /\.zip$/i.test(p));
  let size = 0;
  for (const file of state.files.values()) size += file.size;

  const hasFiles = paths.length > 0;
  els.manifest.classList.toggle('hidden', !hasFiles);
  els.treePanel.classList.toggle('hidden', !hasFiles);

  els.statFiles.textContent = paths.length;
  els.statMd.textContent = mdCount;
  els.statImages.textContent = imgCount;
  els.statSize.textContent = hasFiles ? formatSize(size) : '0 KB';

  els.processBtn.disabled = state.processing || (mdCount === 0 && !hasZip);
  if (hasFiles) renderTree();
  updateCmdLine();
}

// A live command-line echo of the current settings — reinforces the tool aesthetic
// and shows exactly what the run will do.
function updateCmdLine() {
  const s = currentSettings();
  const mdCount = [...state.files.keys()].filter((p) => MD_RE.test(p)).length;

  let cmd = `improve --model ${s.model}`;
  if (s.category) cmd += ` --category ${s.category.replace(/\s+/g, '-')}`;
  if (s.technicalDepth) cmd += ' --depth';
  if (s.includeCvss) cmd += ' --cvss';
  if (s.addSummary) cmd += ' --summary';

  let suffix;
  if (state.phase === 'running') suffix = 'running…';
  else if (state.phase === 'done') suffix = 'done ✓';
  else if (mdCount) suffix = `${mdCount} report${mdCount > 1 ? 's' : ''} queued`;
  else suffix = 'awaiting input';

  els.cmdLine.textContent = `${cmd}  ·  ${suffix}`;
}

function fileType(name) {
  return MD_RE.test(name) ? 'md' : IMG_RE.test(name) ? 'img' : 'file';
}

// Flatten the folder tree into `tree`-command style lines with connectors.
function buildTreeLines(node, prefix, out) {
  const dirs = Object.keys(node).filter((k) => k !== '__files').sort();
  const files = (node.__files || []).sort();
  const entries = [
    ...dirs.map((name) => ({ name, dir: true, child: node[name] })),
    ...files.map((name) => ({ name, dir: false })),
  ];
  entries.forEach((entry, i) => {
    const last = i === entries.length - 1;
    out.push({
      prefix: prefix + (last ? '└─ ' : '├─ '),
      name: entry.name + (entry.dir ? '/' : ''),
      type: entry.dir ? 'dir' : fileType(entry.name),
    });
    if (entry.dir) buildTreeLines(entry.child, prefix + (last ? '   ' : '│  '), out);
  });
}

function renderTree() {
  const root = {};
  for (const path of [...state.files.keys()].sort()) {
    const parts = path.split('/');
    let node = root;
    parts.forEach((part, i) => {
      if (i === parts.length - 1) (node.__files ||= []).push(part);
      else node = node[part] ||= {};
    });
  }
  const lines = [];
  buildTreeLines(root, '', lines);
  els.tree.innerHTML = lines
    .map(
      (l) =>
        `<div class="tl ${l.type}"><span class="pfx">${escapeHtml(l.prefix)}</span><span class="nm">${escapeHtml(l.name)}</span></div>`
    )
    .join('');
}

function clearFiles() {
  state.files.clear();
  state.results = [];
  state.phase = 'idle';
  for (const url of state.objectUrls.values()) URL.revokeObjectURL(url);
  state.objectUrls.clear();
  els.previewPanel.classList.add('hidden');
  els.progressPanel.classList.add('hidden');
  els.warnings.classList.add('hidden');
  els.downloadBtn.hidden = true;
  clearError();
  refreshUi();
}

/* ---------- errors & warnings ---------- */

function showError(message) {
  els.errorText.textContent = message;
  els.errorBox.classList.remove('hidden');
  els.errorBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function clearError() {
  els.errorBox.classList.add('hidden');
  els.errorText.textContent = '';
}

function showWarnings(warnings) {
  els.warningsBody.innerHTML = '';
  if (!warnings?.length) {
    els.warnings.classList.add('hidden');
    return;
  }
  for (const warning of warnings) {
    const p = document.createElement('p');
    p.textContent = warning;
    els.warningsBody.appendChild(p);
  }
  els.warnings.classList.remove('hidden');
}

/* ---------- processing ---------- */

function currentSettings() {
  return {
    model: els.model.value,
    category: els.category.value,
    technicalDepth: els.optDepth.checked,
    includeCvss: els.optCvss.checked,
    addSummary: els.optSummary.checked,
    customInstructions: els.customInstructions.value,
  };
}

function updateProgress({ done = 0, total = 1, currentFile = null }) {
  const percent = total ? Math.round((done / total) * 100) : 0;
  els.barFill.style.width = `${percent}%`;
  els.progressCount.textContent = `${done} / ${total}`;
  els.progressFile.textContent = currentFile ? `> ${currentFile}` : done === total ? '> done' : '> queued…';
}

async function pollJob(jobId) {
  for (;;) {
    await sleep(700);
    const response = await fetch(`/api/job/${jobId}`);
    const job = await response.json();
    if (!response.ok) throw new Error(job.error || 'Lost track of the processing job.');
    updateProgress(job);
    if (job.status === 'error') throw new Error(job.error || 'Processing failed.');
    if (job.status === 'done') return job;
  }
}

async function processFiles() {
  clearError();
  state.processing = true;
  state.phase = 'running';
  els.processBtn.disabled = true;
  els.processBtn.classList.add('busy');
  els.processBtn.textContent = 'uploading…';
  els.downloadBtn.hidden = true;
  els.previewPanel.classList.add('hidden');
  els.warnings.classList.add('hidden');
  updateCmdLine();

  try {
    const fd = new FormData();
    const paths = [...state.files.keys()];
    fd.append('settings', JSON.stringify(currentSettings()));
    fd.append('paths', JSON.stringify(paths));
    for (const path of paths) fd.append('files', state.files.get(path), path.split('/').pop());

    const response = await fetch('/api/process', { method: 'POST', body: fd });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || `Upload failed (HTTP ${response.status}).`);

    els.progressPanel.classList.remove('hidden');
    updateProgress({ done: 0, total: data.total });
    els.processBtn.textContent = 'processing…';

    const job = await pollJob(data.jobId);
    showWarnings(job.warnings);

    const result = await (await fetch(`/api/job/${data.jobId}/result`)).json();
    state.results = result.results || [];
    showPreview();

    els.downloadBtn.href = `/api/job/${data.jobId}/download`;
    els.downloadBtn.hidden = false;
    state.phase = 'done';
    checkStatus();
  } catch (err) {
    showError(err.message);
    els.progressPanel.classList.add('hidden');
    state.phase = 'idle';
  } finally {
    state.processing = false;
    els.processBtn.classList.remove('busy');
    els.processBtn.textContent = 'improve reports';
    refreshUi();
  }
}

/* ---------- preview ---------- */

function showPreview() {
  if (!state.results.length) return;
  els.fileSelect.innerHTML = '';
  for (const result of state.results) {
    const option = document.createElement('option');
    option.value = result.path;
    option.textContent = result.path;
    els.fileSelect.appendChild(option);
  }
  els.previewPanel.classList.remove('hidden');
  renderPreview();
  els.previewPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function renderPreview() {
  const result = state.results.find((r) => r.path === els.fileSelect.value) || state.results[0];
  if (!result) return;

  const rendered = state.viewMode === 'rendered';
  for (const [pane, text] of [
    [els.paneBefore, result.original],
    [els.paneAfter, result.improved],
  ]) {
    pane.classList.toggle('rendered', rendered);
    if (rendered) pane.innerHTML = renderMarkdown(text, result.path);
    else pane.textContent = text;
  }
}

function setViewMode(mode) {
  state.viewMode = mode;
  els.viewRaw.classList.toggle('active', mode === 'raw');
  els.viewRendered.classList.toggle('active', mode === 'rendered');
  renderPreview();
}

/* ---------- tiny markdown renderer (preview only) ---------- */

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function normalizePath(p) {
  const out = [];
  for (const seg of p.split('/')) {
    if (!seg || seg === '.') continue;
    if (seg === '..') out.pop();
    else out.push(seg);
  }
  return out.join('/');
}

function resolveSrc(url, mdPath) {
  if (/^(https?:|data:)/i.test(url)) return url;
  const baseDir = mdPath.includes('/') ? mdPath.slice(0, mdPath.lastIndexOf('/') + 1) : '';
  const raw = url.replace(/^\.\//, '');
  const resolved = normalizePath(baseDir + raw);
  const key =
    (state.files.has(resolved) && resolved) ||
    (state.files.has(raw) && raw) ||
    [...state.files.keys()].find((p) => p.endsWith(`/${raw}`) || p.endsWith(`/${resolved}`));
  if (!key) return url;
  if (!state.objectUrls.has(key)) state.objectUrls.set(key, URL.createObjectURL(state.files.get(key)));
  return state.objectUrls.get(key);
}

function renderMarkdown(source, mdPath) {
  const codeBlocks = [];
  let text = source.replace(/```[\w-]*\n([\s\S]*?)```/g, (_, code) => {
    codeBlocks.push(`<pre class="code"><code>${escapeHtml(code)}</code></pre>`);
    return `\u0000${codeBlocks.length - 1}\u0000`;
  });
  text = escapeHtml(text);

  const inline = (s) =>
    s
      .replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_, alt, url) => `<img src="${resolveSrc(url, mdPath)}" alt="${alt}">`)
      .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[\s(])\*([^*\n]+)\*/g, '$1<em>$2</em>');

  const out = [];
  let list = null;
  const closeList = () => {
    if (list) {
      out.push(`</${list}>`);
      list = null;
    }
  };

  for (const line of text.split('\n')) {
    const heading = line.match(/^(#{1,6})\s+(.*)/);
    if (heading) {
      closeList();
      const level = heading[1].length;
      out.push(`<h${level}>${inline(heading[2])}</h${level}>`);
      continue;
    }
    if (/^\s*[-*]\s+/.test(line)) {
      if (list !== 'ul') { closeList(); out.push('<ul>'); list = 'ul'; }
      out.push(`<li>${inline(line.replace(/^\s*[-*]\s+/, ''))}</li>`);
      continue;
    }
    if (/^\s*\d+\.\s+/.test(line)) {
      if (list !== 'ol') { closeList(); out.push('<ol>'); list = 'ol'; }
      out.push(`<li>${inline(line.replace(/^\s*\d+\.\s+/, ''))}</li>`);
      continue;
    }
    if (/^\s*(---+|\*\*\*+)\s*$/.test(line)) { closeList(); out.push('<hr>'); continue; }
    if (/^&gt;\s?/.test(line)) {
      closeList();
      out.push(`<blockquote>${inline(line.replace(/^&gt;\s?/, ''))}</blockquote>`);
      continue;
    }
    if (!line.trim()) { closeList(); continue; }
    closeList();
    out.push(`<p>${inline(line)}</p>`);
  }
  closeList();

  return out.join('\n').replace(/\u0000(\d+)\u0000/g, (_, i) => codeBlocks[Number(i)]);
}

/* ---------- server status ---------- */

function updateRateMeter(info) {
  if (!info || info.limitRequests == null) {
    els.rateFill.style.width = '0%';
    els.rateLabel.textContent = 'no usage data yet — appears after the first run';
    return;
  }
  const used = info.limitRequests - (info.remainingRequests ?? info.limitRequests);
  const usedPct = Math.min(100, Math.round((used / info.limitRequests) * 100));
  const remainingRatio = (info.remainingRequests ?? 0) / info.limitRequests;
  els.rateFill.style.width = `${usedPct}%`;
  els.rateFill.classList.toggle('low', remainingRatio < 0.15);
  els.rateLabel.textContent = `${info.remainingRequests} / ${info.limitRequests} requests left today`;
}

async function checkStatus() {
  try {
    const status = await (await fetch('/api/status')).json();
    if (status.keyConfigured) {
      els.keyStatus.textContent = '● key: ready';
      els.keyStatus.className = 'pill ok';
    } else {
      els.keyStatus.textContent = '○ key: not set';
      els.keyStatus.className = 'pill bad';
    }
    updateRateMeter(status.rateLimit);
  } catch {
    els.keyStatus.textContent = '○ server offline';
    els.keyStatus.className = 'pill bad';
  }
}

/* ---------- wiring ---------- */

els.pickFolder.addEventListener('click', (e) => { e.stopPropagation(); els.folderInput.click(); });
els.pickFiles.addEventListener('click', (e) => { e.stopPropagation(); els.filesInput.click(); });
els.dropzone.addEventListener('click', () => els.filesInput.click());
els.dropzone.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); els.filesInput.click(); }
});

els.folderInput.addEventListener('change', () => {
  addFiles([...els.folderInput.files].map((file) => ({ path: file.webkitRelativePath || file.name, file })));
  els.folderInput.value = '';
});
els.filesInput.addEventListener('change', () => {
  addFiles([...els.filesInput.files].map((file) => ({ path: file.name, file })));
  els.filesInput.value = '';
});

els.dropzone.addEventListener('dragover', (e) => { e.preventDefault(); els.dropzone.classList.add('dragover'); });
els.dropzone.addEventListener('dragleave', () => els.dropzone.classList.remove('dragover'));
els.dropzone.addEventListener('drop', handleDrop);
window.addEventListener('dragover', (e) => e.preventDefault());
window.addEventListener('drop', (e) => e.preventDefault());

els.clearBtn.addEventListener('click', clearFiles);
els.processBtn.addEventListener('click', processFiles);
els.fileSelect.addEventListener('change', renderPreview);
els.viewRaw.addEventListener('click', () => setViewMode('raw'));
els.viewRendered.addEventListener('click', () => setViewMode('rendered'));

// keep the command-line echo in sync with the settings controls
for (const control of [els.model, els.category, els.optDepth, els.optCvss, els.optSummary]) {
  control.addEventListener('change', updateCmdLine);
}

updateCmdLine();
checkStatus();
