@echo off
rem Windows development script for Halogen Sudo API

echo Starting Halogen Sudo API in development mode...

rem Activate virtual environment
call venv\Scripts\activate.bat

rem Start the server
echo Starting development server on http://localhost:8082
uvicorn main:app --host 0.0.0.0 --port 8082 --reload
