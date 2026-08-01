---
title: "Linux Privilege Escalation — Quick Checklist"
date: 2026-06-20
tags: [linux, privesc, cheatsheet]
---

A compact set of first things to check once you land a low-priv shell on a
Linux box. Not exhaustive — just the high-signal stuff, in the order I usually
run it.

## Enumerate fast

```bash
id                      # who am I, what groups
sudo -l                 # can I run anything as root?
uname -a                # kernel version → known exploits?
cat /etc/os-release
```

## Common wins

- **`sudo -l`** — misconfigured entries (`NOPASSWD`, wildcards, `LD_PRELOAD`).
- **SUID binaries** — `find / -perm -4000 -type f 2>/dev/null`, then check
  [GTFOBins](https://gtfobins.github.io/).
- **Cron jobs** — writable scripts run by root: `cat /etc/crontab`, `ls -la /etc/cron.*`.
- **Capabilities** — `getcap -r / 2>/dev/null` (e.g. `cap_setuid` on python).
- **Writable `/etc/passwd`** — add a root user with a known hash.

## Credentials lying around

```bash
grep -riE "password|passwd|secret" /var/www 2>/dev/null
cat ~/.bash_history ~/.ssh/id_* 2>/dev/null
```

> Rule of thumb: if `sudo -l` or GTFOBins gets you root in 30 seconds, take it
> and write the boring stuff up afterwards.
