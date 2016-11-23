#/bin/bash
# sudo iptables -A input -i localhost -d 127.0.0.4/32 -j DROP
# sudo iptables -A output -i localhost -d 127.0.0.4/32 -j DROP

#sudo iptables -A INPUT -i lo -d 127.0.0.2 -j DROP                        
#sudo iptables -A OUTPUT -i lo -s 127.0.0.2 -j DROP

# sudo iptables -A FORWARD -d 127.0.0.2 -j DROP
# sudo iptables -A FORWARD -s 127.0.0.2 -j DROP
# sudo iptables -A INPUT -d 127.0.0.2 -j DROP
# sudo iptables -A OUTPUT -s 127.0.0.2 -j DROP

sudo iptables -A INPUT -i lo -d 127.0.0.2 -j DROP
sudo iptables -A OUTPUT -o lo -s 127.0.0.2 -j DROP
sudo iptables -L
