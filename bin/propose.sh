#!/usr/bin/env bash
set -x
curl -v -H "Content-Type: application/json" -X POST -d '{"id":"1","key":"city","val":"London"}' http://localhost:3001/2pc/propose

