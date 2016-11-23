#!/usr/bin/env bash
port=3002 # $(( $RANDOM % 3 + 3001 )); 
curl -v -H 'Content-Type: application/json' -X POST -d '{"key": "city", "val": "London-in-FAKE", "ts": 11111111}' http://localhost:$port/quorum/repair
echo -e "\n"

