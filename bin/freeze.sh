#!/usr/bin/env bash

if [ -z "$1" ] 
  then
    echo "No port specified"
    exit 1
fi

iden=$(echo $1-3000 | bc)
echo Going to freeze 127.0.0.$iden

sudo iptables -A INPUT -i lo -d 127.0.0.$iden -j DROP
sudo iptables -A OUTPUT -o lo -s 127.0.0.$iden -j DROP

