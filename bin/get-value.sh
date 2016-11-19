#/bin/bash
port=$(( $RANDOM % 3 + 3001 )); 
set -x
curl -v  http://localhost:$port/database/city

