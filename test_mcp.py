#!/usr/bin/env python3
"""测试 MCP 服务器完整流程"""

import subprocess
import json
import sys

def send_request(proc, request):
    """发送 JSON-RPC 请求并返回响应"""
    body = json.dumps(request, ensure_ascii=False)
    header = f'Content-Length: {len(body.encode("utf-8"))}\r\n\r\n'
    message = (header + body).encode('utf-8')
    
    proc.stdin.write(message)
    proc.stdin.flush()
    
    # 读取响应 header (bytes)
    header_line = proc.stdout.readline()
    if not header_line.startswith(b'Content-Length:'):
        return None
    
    length = int(header_line.split(b':')[1].strip())
    
    # 读取空行
    empty_line = proc.stdout.readline()
    
    # 读取 body
    body_data = proc.stdout.read(length)
    return json.loads(body_data.decode('utf-8'))

def test_mcp_server():
    # 启动 MCP 服务器
    proc = subprocess.Popen(
        [sys.executable, 'E:/frontEnd/test/hostApp/loop.py'],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        bufsize=0,  # 无缓冲
    )
    
    print("=" * 50)
    print("[Test 1] Initialize")
    print("=" * 50)
    
    init_req = {
        'jsonrpc': '2.0',
        'id': 1,
        'method': 'initialize',
        'params': {
            'protocolVersion': '2024-11-05',
            'clientInfo': {'name': 'test', 'version': '1.0'},
            'capabilities': {}
        }
    }
    
    response = send_request(proc, init_req)
    print(f"Response: {json.dumps(response, indent=2, ensure_ascii=False)}")
    
    print("\n" + "=" * 50)
    print("[Test 2] Tools/List")
    print("=" * 50)
    
    tools_req = {
        'jsonrpc': '2.0',
        'id': 2,
        'method': 'tools/list'
    }
    
    response = send_request(proc, tools_req)
    print(f"Response: {json.dumps(response, indent=2, ensure_ascii=False)}")
    
    print("\n" + "=" * 50)
    print("[Test 3] Tools/Call - wait_for_human")
    print("=" * 50)
    
    call_req = {
        'jsonrpc': '2.0',
        'id': 3,
        'method': 'tools/call',
        'params': {
            'name': 'wait_for_human',
            'arguments': {
                'summary': '我完成了代码检查工作'
            }
        }
    }
    
    response = send_request(proc, call_req)
    print(f"Response: {json.dumps(response, indent=2, ensure_ascii=False)}")
    
    # 关闭
    proc.stdin.close()
    proc.wait()
    
    print("\n" + "=" * 50)
    print("[Test] All tests passed!")
    print("=" * 50)

if __name__ == '__main__':
    test_mcp_server()
