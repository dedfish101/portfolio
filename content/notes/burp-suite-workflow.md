---
title: "My Burp Suite Workflow for Web Recon"
date: 2026-07-05
tags: [web, burp, recon]
---

How I set Burp up at the start of a web engagement so I'm not fighting the tool
later.

## Scope first

Set a **tight target scope** (Target → Scope) and enable *"drop out-of-scope
requests"* so Repeater/Intruder don't leak to third parties.

## Passive pass

1. Browse the app like a normal user with the proxy on.
2. Let the **site map** fill in; sort by status code and content type.
3. Skim **Issues** for the free passive findings (missing headers, verbose
   errors, reflected params).

## Active pass

- Send interesting requests to **Repeater** and mutate one variable at a time.
- Use **Intruder** (Sniper) for parameter fuzzing — wordlists over IDs, verbs,
  and hidden fields.
- Watch for **length/time deltas** in the response table; that's usually where
  the bug is hiding.

```
# quick content discovery outside Burp
ffuf -u https://target/FUZZ -w /usr/share/wordlists/dirb/common.txt -mc 200,301,302
```

Keep notes in the **Logger** tab so the write-up basically drafts itself.
