#/bin/bash
year=$(( $RANDOM % 100 + 1996 ))
port=3001 # $(( $RANDOM % 3 + 3001 )); 
CMD="curl -v -X POST http://localhost:$port/database/city/London-in-$year"
echo -e "\n"
echo $CMD
$CMD
echo -e "\n"

