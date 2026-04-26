@echo off
title Memo Price - stop
echo.
echo  Recherche du serveur sur le port 8765...
echo.
set FOUND=0
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8765 " ^| findstr "LISTENING"') do (
    echo  -^> arret du PID %%a
    taskkill /F /PID %%a >nul 2>&1
    set FOUND=1
)
if %FOUND%==0 (
    echo  Aucun serveur en cours sur le port 8765.
) else (
    echo.
    echo  Serveur arrete.
)
echo.
timeout /t 3 >nul
