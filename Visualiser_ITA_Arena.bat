@echo off
setlocal
echo ======================================================
echo    Lancement de ITA Arena (Mode Visualisation)
echo ======================================================
echo.
echo 1. Preparation du serveur local...
echo.

REM Check if node exists
where npx >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERREUR] Node.js n'est pas installe. 
    echo Veuillez installer Node.js pour visualiser la plateforme.
    pause
    exit /b
)

echo 2. Ouverture de votre navigateur...
start "" "http://localhost:3000"

echo 3. Service des fichiers...
npx serve -l 3000 out

pause
