#!/usr/bin/env bash
curl http://127.0.0.1:3001/admin/clean 1>/dev/null 2>/dev/null
curl http://127.0.0.2:3002/admin/clean 1>/dev/null 2>/dev/null
curl http://127.0.0.3:3003/admin/clean 1>/dev/null 2>/dev/null
curl http://127.0.0.4:3004/admin/clean 1>/dev/null 2>/dev/null
curl http://127.0.0.5:3005/admin/clean 1>/dev/null 2>/dev/null

