@echo off
rem ---------------------------------------------------------------
rem Starts the TEFERA dev stack (Laravel API :8000 + Vite :5174).
rem Ensures the SQLite schema exists and seeds it only when empty.
rem Safe to run repeatedly - servers are only started if their port
rem is free, so no duplicate/stacked processes can be spawned.
rem ---------------------------------------------------------------

cd /d "c:\Users\HP\Desktop\Main File\tefera\backend"

echo [1/4] Running migrations (no-op if up to date)...
php artisan migrate --force > "%TEMP%\tefera-migrate.log" 2>&1

echo [2/4] Seeding database only if it has no profile yet...
php artisan tinker --execute="if (App\Models\Profile::count() === 0) { Artisan::call('db:seed'); echo 'SEEDED'; } else { echo 'DATA-OK'; }" > "%TEMP%\tefera-seed.log" 2>&1
type "%TEMP%\tefera-seed.log"

echo [3/4] Starting Laravel API on http://127.0.0.1:8000 ...
netstat -ano | findstr ":8000" | findstr /i "LISTENING" >nul 2>&1
if errorlevel 1 (
    start "tefera-api" /min cmd /c "cd /d c:\Users\HP\Desktop\Main File\tefera\backend && php artisan serve --host=127.0.0.1 --port=8000"
) else (
    echo     port 8000 already in use - API already running, skipping.
)

echo [4/4] Starting Vite dev server on http://localhost:5174 ...
netstat -ano | findstr ":5174" | findstr /i "LISTENING" >nul 2>&1
if errorlevel 1 (
    start "tefera-web" /min cmd /c "cd /d c:\Users\HP\Desktop\Main File\tefera\frontend && npm run dev"
) else (
    echo     port 5174 already in use - Vite already running, skipping.
)

echo Done - both servers are starting in minimized windows.
exit /b 0
