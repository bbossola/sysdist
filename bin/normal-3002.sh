#/bin/bash
# sudo iptables -A input -i localhost -s 127.0.0.4/32 -j DROP
# sudo iptables -A output -i localhost -s 127.0.0.4/32 -j DROP

sudo iptables -D INPUT -s 127.0.0.2 -j DROP
sudo iptables -D OUTPUT -s 127.0.0.2 -j DROP
sudo iptables -L
