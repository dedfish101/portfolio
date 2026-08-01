---
title: "Pterodactyl"
date: 2026-05-28
slug: pterodactyl
tags: [hackthebox, web, privesc]
difficulty: Medium
---
A writeup for the CTF Pterodactyl  - https://app.hackthebox.com/machines/Pterodactyl

---

# Reconnaissance
accessing the pterodactyl.htb we get this homecreen with only copy paste link for play.pterodactly.htb which is the main server 
![[Pasted image 20260528124725.png]]


after trying to add the play.pterodactyl.htb to the hosts file and tried accessing it but found nothing 
```
 Thu 28 May - 13:12  ~ 
 @dedfish  cat /etc/hosts
# Static table lookup for hostnames.
# See hosts(5) for details.
127.0.0.1        localhost
::1              localhost
10.129.5.60	Pterodactyl.htb play.Pterodactyl.htb 
```

after that I tried to enumerate the subdomains for this website 
```
ffuf -u http://pterodactyl.htb/ -w ~/wind/ctf/wordlist/directory-list-2.3-medium.txt -H 'Host: FUZZ.pterodactyl.htb' -fc 302
```
this will fuzz the subdomains for pterodactyl website 


in the /changelog file we find 
```
MonitorLand - CHANGELOG.txt
======================================

Version 1.20.X

[Added] Main Website Deployment
--------------------------------
- Deployed the primary landing site for MonitorLand.
- Implemented homepage, and link for Minecraft server.
- Integrated site styling and dark-mode as primary.

[Linked] Subdomain Configuration
--------------------------------
- Added DNS and reverse proxy routing for play.pterodactyl.htb.
- Configured NGINX virtual host for subdomain forwarding.

[Installed] Pterodactyl Panel v1.11.10
--------------------------------------
- Installed Pterodactyl Panel.
- Configured environment:
  - PHP with required extensions.
  - MariaDB 11.8.3 backend.

[Enhanced] PHP Capabilities
-------------------------------------
- Enabled PHP-FPM for smoother website handling on all domains.
- Enabled PHP-PEAR for PHP package management.
- Added temporary PHP debugging via phpinfo()

```

---

#  Findings(credentials, services, vulnerabilities)




---

# Exploitation




---

# Privilege Escalation



---

# mistakes and learning
