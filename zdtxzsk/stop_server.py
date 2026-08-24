#!/usr/bin/env python3
"""
ASKB Server 停止脚本 (Windows/Linux)
查找占用 8765 端口的进程并终止
"""
import os
import sys
import signal
import subprocess
import platform

KB_ROOT = os.path.dirname(os.path.abspath(__file__))
PORT = int(os.environ.get('SERVER_PORT', '8765'))


def stop_server():
    system = platform.system()

    if system == 'Windows':
        # Windows: 用 netstat 查找占用端口的 PID
        try:
            result = subprocess.run(
                ['netstat', '-ano'],
                capture_output=True, text=True, timeout=5
            )
            for line in result.stdout.splitlines():
                if f':{PORT}' in line and 'LISTENING' in line:
                    parts = line.strip().split()
                    pid = parts[-1]
                    if pid.isdigit():
                        print(f"[ASKB] 终止进程 PID={pid} (端口 {PORT})")
                        os.system(f'taskkill /F /PID {pid}')
                        return True
            print(f"[ASKB] 端口 {PORT} 上没有运行中的进程")
            return False
        except Exception as e:
            print(f"[ASKB] 停止失败: {e}")
            return False
    else:
        # Linux/Mac: 用 lsof
        try:
            result = subprocess.run(
                ['lsof', '-ti TCP:' + str(PORT)],
                capture_output=True, text=True, timeout=5
            )
            pids = result.stdout.strip().split('\n')
            for pid in pids:
                if pid.isdigit():
                    print(f"[ASKB] 终止进程 PID={pid} (端口 {PORT})")
                    os.kill(int(pid), signal.SIGTERM)
            return bool(pids)
        except Exception as e:
            print(f"[ASKB] 停止失败: {e}")
            return False


if __name__ == '__main__':
    print(f"[ASKB] 尝试停止端口 {PORT} 上的服务...")
    stopped = stop_server()
    if stopped:
        print("[ASKB] 服务已停止")
    else:
        print("[ASKB] 没有发现运行中的服务")
    sys.exit(0 if stopped else 1)
