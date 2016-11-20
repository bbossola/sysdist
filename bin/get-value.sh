#/bin/bash
# port=$(( $RANDOM % 3 + 3001 )); 
port=3001
CMD="curl -v  http://localhost:$port/database/city"
echo -e "\n"
echo $CMD
$CMD
echo -e "\n"

