#/bin/bash
year=$(( $RANDOM % 100 + 1996 ))
port=3001 # $(( $RANDOM % 3 + 3001 )); 
set -x
curl -v -X POST http://localhost:$port/database/city/London-in-$year

