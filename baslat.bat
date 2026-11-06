@echo off
chcp 65001 >nul
title Voight-Kampff - gelistirme sunucusu
cd /d "%~dp0"
if not exist node_modules (
  echo Ilk calistirma: paketler kuruluyor...
  call npm install
)
echo.
echo  Voight-Kampff aciliyor: http://localhost:5173
echo  Kapatmak icin bu pencereyi kapat ya da Ctrl+C bas.
echo.
call npm run dev -- --open
