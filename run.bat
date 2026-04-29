@echo off
set PYTHONUTF8=1
cd /d "%~dp0"
echo ============================================
echo   جامعة وطنية - نظام إدارة الأنشطة الطلابية
echo   Watania University - Student Activities System
echo ============================================
echo.

:: Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo Error: Python is not installed. Please install Python first.
    pause
    exit /b 1
)

:: Create virtual environment if it doesn't exist
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

:: Activate virtual environment
call venv\Scripts\activate

:: Install requirements
echo Installing requirements...
python -m pip install -r backend\requirements.txt -q

:: Navigate to backend directory
cd backend

:: Apply database migrations
echo Setting up database migrations...
python manage.py makemigrations
echo Applying database migrations...
python manage.py migrate

:: Create super employee account
echo Creating super employee account...
python manage.py seed_super_employee

echo.
echo ============================================
echo   Server is starting...
echo   Open browser: http://localhost:8080
echo   Super Employee Login: user / user123
echo ============================================
echo.

:: Start the server
python manage.py runserver 0.0.0.0:8080

pause
