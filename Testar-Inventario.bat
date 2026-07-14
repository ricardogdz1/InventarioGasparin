@echo off
rem ============================================================
rem  Inventario Gasparin - teste com 1 clique (modo desenvolvimento)
rem  Abre o app desktop com o codigo mais recente do projeto.
rem  A primeira abertura pode demorar ~1 minuto (compilacao).
rem ============================================================
title Inventario Gasparin - Teste
cd /d "%~dp0"

rem Garante o Rust e o ambiente do compilador da Microsoft no PATH
set "PATH=%USERPROFILE%\.cargo\bin;%PATH%"
call "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvars64.bat" >nul 2>&1

echo Abrindo o Inventario Gasparin... (feche esta janela para encerrar o app)
call npm run tauri dev

echo.
echo O app foi encerrado. Se apareceu algum erro acima, tire um print e envie.
pause
