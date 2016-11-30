# sysdist
The sample project containing the code for my NodeJS talk about distributed systems.  
**Please note that this code is no more that a spike I wrote in around 4 days: be gentle with that, and do not run it in production!**  
I will refactor it, tough, for the next speech :)

# what does it do?
What you have here is a process capable to implement some aspects of a key-value store (namely read and write) which does it using a distributed architecture. Following the CAP theorem it can use a CA approach (two-phase commit), an AP approach (sloppy quorums) or a CP approach (majority quorums). Based on the environment variable MODE it will select the operating mode.

# what are the basic APIs?
`POST /database/:key/:val`  
create or update a key on the database  
`GET /database/:key`  
Returns the value of the key on the database  
`GET /admin/dump`  
Dumps the database on screen (useful for demos)  
`GET /admin/clean`  
Kind of "cleans" the screen pushing a lot of blank lines (useful for demos)  

# how does it work?
The whole distributs system is composed of 5 different (potentially) running instances that sit oo host 127.0.0.x:300x, where x ranges from 1 to 5. Just launch `node Server.js 3001` for example to start the server on port 3001, repeat for the others, then simply curl using the APIs them to see how it works :) Feel free to kill some servers or to freeze them using iptables (a script is provided for Linux)

# are there any scripts?
**General use:**  
`bin/get-value.sh`  
Read the value of the key "city" from server #3001  
`bin/set-value.sh`   
Sets the value of the key "city" to a random value on a random server    
`bin/clean.sh`  
Invokes the clean screen on all servers     
`bin/dump.sh`   
Invokes the database dump on all servers  
`bin/freeze.sh`    
Using iptables, freezes the ip related to the port you specified (i.e. freeze.sh 3002 locks 127.0.0.2). Requires root.  
`bin/unfreeze.sh`   
Flushes your iptables rules, **all** your rules will be removed! (iptables -f). Requires root.  

**Specific for some modes:**  
`bin/trick-value.sh`  
AP only - tricks the value of the key "city" to something else  
`bin/propose.sh`    
AC only - propose a value for a transaction  
`bin/commit.sh`   
AC only - rolls back the existing transaction   
`bin/rollback.sh`  
AC only - commits the existing transaction  

# Any hard requirements?
Node 4+ please and Linux with iptables if you want to play with freeze!

# Where are the slides?
On [slideshare](http://www.slideshare.net/bbossola/distributed-programming) where you can also download them if you need to
