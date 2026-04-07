@echo off
cd /d %~dp0
set PORT=3010
echo Starting AI TCM backend at http://127.0.0.1:%PORT%
node backend\server.js
