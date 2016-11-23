#!/usr/bin/env bash

if [ -z "$1" ] 
  then
    echo "No port specified"
    exit 1
fi

iden=$(echo $1-3000 | bc)
echo Going to trick 127.0.0.$iden:$1

curl -v -H 'Content-Type: application/json' -X POST -d '{"key": "city", "val": "London-in-FAKE", "ts": 11111111}' http://127.0.0.$iden:$1/quorum/repair
echo -e "\n"

