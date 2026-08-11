# CTF Report Improver

A dark, minimalist web app that rewrites CTF writeups and pentest reports into cleaner, better-structured markdown using Groq-hosted LLMs. Drop in a report folder (markdown + screenshots), tune the prompt, preview before/after side by side, and download the improved reports as a ZIP — images untouched, references preserved.

![stack](https://img.shields.io/badge/stack-Express%20%2B%20vanilla%20JS-00ff9c) ![state](https://img.shields.io/badge/state-stateless-6c7bff)

## Features

- **Drag & drop** a whole folder, individual `.md` files, or a `.zip` — folder structure is preserved end to end
- **Folder tree + stats**: file count, markdown count, image count, total size
- **Side-by-side preview** of original vs. improved markdown (raw or rendered, with local image resolution)
- **Custom prompting**: category, toggles (technical depth, CVSS scores, summary section), and a free-form instructions box merged into the default prompt
- **Groq integration** with retry + exponential backoff on 429/5xx, `retry-after` support, free-tier usage meter, and a warning when you approach the limit
- **Legacy model remap**: `mixtral-8x7b-32768` / `llama2-70b` were retired by Groq — the server transparently remaps them to `llama-3.3-70b-versatile` and tells you
- **Stateless**: uploads are processed in memory only; jobs expire after 30 minutes; nothing touches disk

## Run locally (Arch Linux)

```bash
# 1. Install Node.js (>= 18; any current Arch package works)
sudo pacman -S nodejs npm

# 2. Get a free Groq API key
#    https://console.groq.com/keys

# 3. Configure
cd ctf-report-improver
cp .env.example .env
$EDITOR .env          # paste your GROQ_API_KEY

# 4. Install & start
npm install
npm start
```

Open **http://localhost:1337** (change with `PORT=... npm start`).

You can also skip `.env` and export the key for one session:

```bash
GROQ_API_KEY=gsk_... npm start
```

## API

| Method | Endpoint                | Purpose                                             |
| ------ | ----------------------- | --------------------------------------------------- |
| `GET`  | `/api/status`           | Key configured? Default model, last rate-limit info |
| `POST` | `/api/process`          | Multipart upload (`files` + `paths` + `settings`) → `{ jobId, total }` |
| `GET`  | `/api/job/:id`          | Progress: status, done/total, current file, warnings |
| `GET`  | `/api/job/:id/result`   | Before/after text for every processed markdown file |
| `GET`  | `/api/job/:id/download` | The improved bundle as `improved-reports.zip`       |

`settings` is a JSON string:

```json
{
  "model": "llama-3.3-70b-versatile",
  "category": "web",
  "technicalDepth": true,
  "includeCvss": false,
  "addSummary": true,
  "customInstructions": "Always explain why each payload works."
}
```

## Notes

- **Models**: the spec'd `mixtral-8x7b-32768` and `llama2-70b` no longer exist on Groq (retired 2024–2025). The default is `llama-3.3-70b-versatile`; picking a retired model still works via automatic remapping.
- **Rate limits**: Groq's free tier is limited per model (requests/day and tokens/min). The app reads the `x-ratelimit-*` response headers, shows remaining quota in the sidebar, and warns below 15%.
- **Failure handling**: if one file fails (rate limit exhausted, network, etc.) the job continues — the original text is kept for that file and a warning is shown.
- **Limits**: 25 MB per file, 400 files per upload, 100k characters of markdown sent per file.
