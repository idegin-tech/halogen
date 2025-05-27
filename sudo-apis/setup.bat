@echo off
rem Windows setup script for Halogen Sudo API

echo Setting up Halogen Sudo API for Windows development...

rem Check if Python is installed
where python >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Python is not installed or not in PATH
    echo Please install Python 3 from https://www.python.org/downloads/
    exit /b 1
)

rem Create virtual environment if it doesn't exist
if not exist venv (
    echo Creating Python virtual environment...
    python -m venv venv
)

rem Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

rem Install dependencies
echo Installing Python dependencies...
pip install --upgrade pip
pip install -r requirements.txt

rem Create .env file if it doesn't exist
if not exist .env (
    echo Creating .env file...
    (
        echo # Python Sudo API Environment Variables
        echo API_HOST=0.0.0.0
        echo API_PORT=8082
        echo API_RELOAD=True
        echo API_LOG_LEVEL=info
        echo.
        echo # Nginx paths - these won't be used in Windows, but are required by the config
        echo NGINX_SITES_AVAILABLE=C:\Temp\nginx\sites-available
        echo NGINX_SITES_ENABLED=C:\Temp\nginx\sites-enabled
        echo NGINX_CONFIG_DIR=C:\Temp\nginx\configs
        echo NGINX_TEMPLATES_DIR=C:\Temp\nginx\templates
        echo.
        echo # Certbot paths - these won't be used in Windows, but are required by the config
        echo WEBROOT_DIR=C:\Temp\certbot
        echo CERTBOT_LIVE_DIR=C:\Temp\letsencrypt\live
        echo DEFAULT_EMAIL=admin@example.com
        echo.
        echo # CORS configuration
        echo ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8081
    ) > .env
)

echo Setup complete!
echo To start the development server, run: start-dev.bat
