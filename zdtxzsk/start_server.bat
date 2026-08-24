@echo off
REM ASKB Server 启动脚本 (Windows)
REM 用法: start_server.bat [端口]
REM 示例: start_server.bat 8765

set KB_ROOT=%~dp0
set KB_ROOT=%KB_ROOT:~0,-1%

python "%KB_ROOT%\server.py"
if errorlevel 1 (
    echo [ERROR] 服务器启动失败，请检查依赖: pip install flask pyyaml
    pause
)
