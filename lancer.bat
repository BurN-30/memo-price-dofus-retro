@echo off
cd /d "%~dp0"
title Memo Price - serveur local
echo.
echo  ===============================================
echo    Memo Price - serveur local
echo  ===============================================
echo.
echo    URL    :  http://127.0.0.1:8765/
echo    Stop   :  ferme cette fenetre, OU Ctrl+C ici,
echo              OU double-clic sur stop.bat
echo.
echo  ===============================================
echo.
python serve.py
echo.
echo  --- serveur arrete ---
echo  tu peux fermer cette fenetre.
pause >nul
