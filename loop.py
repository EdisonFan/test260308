#!/usr/bin/env python3
"""
Human-in-the-Loop MCP Server (Mock版)
- 不依赖任何第三方库
- wait_for_human() 工具直接返回写死的模拟消息
- 验证 Trae 能否调用 MCP 工具并把返回值当作下一步指令
"""

import sys
import json
import io

# 强制使用无缓冲的 stdout，确保 MCP 消息及时发送
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', line_buffering=True)

def send(obj):
    """发送 JSON-RPC 消息给客户端（Trae）"""
    body = json.dumps(obj, ensure_ascii=False)
    header = f"Content-Length: {len(body.encode('utf-8'))}\r\n\r\n"
    message = header + body
    
    sys.stdout.write(message)
    sys.stdout.flush()

def recv():
    """从 stdin 读取一条 JSON-RPC 消息"""
    try:
        # 读 Content-Length header
        headers = {}
        while True:
            line = sys.stdin.readline()
            if not line:
                return None
            if line == "\r\n" or line == "\n":
                break
            if ":" in line:
                k, v = line.split(":", 1)
                headers[k.strip().lower()] = v.strip()

        length = int(headers.get("content-length", 0))
        if length == 0:
            return None

        # 读取指定长度的 body
        body = sys.stdin.read(length)
        if not body:
            return None
            
        return json.loads(body)
    except Exception as e:
        sys.stderr.write(f"[recv error] {e}\n")
        sys.stderr.flush()
        return None

def handle(req):
    """处理各种 JSON-RPC 请求"""
    if not req or not isinstance(req, dict):
        return
        
    method = req.get("method", "")
    req_id = req.get("id")

    # ── 握手 ──────────────────────────────────────────
    if method == "initialize":
        send({
            "jsonrpc": "2.0",
            "id": req_id,
            "result": {
                "protocolVersion": "2024-11-05",
                "serverInfo": {"name": "human-loop-mcp", "version": "0.1.0"},
                "capabilities": {
                    "tools": {
                        "listChanged": True
                    }
                }
            }
        })

    elif method == "notifications/initialized":
        pass  # 通知，不需要回复

    # ── ping ─────────────────────────────────────────
    elif method == "ping":
        send({
            "jsonrpc": "2.0",
            "id": req_id,
            "result": {}
        })

    # ── 工具列表 ──────────────────────────────────────
    elif method == "tools/list":
        send({
            "jsonrpc": "2.0",
            "id": req_id,
            "result": {
                "tools": [
                    {
                        "name": "wait_for_human",
                        "description": (
                            "当你完成一个阶段的任务后，调用此工具通知人类并等待下一步指令。"
                            "工具会返回人类给你的下一个任务描述，你需要按照返回内容继续执行。"
                        ),
                        "inputSchema": {
                            "type": "object",
                            "properties": {
                                "summary": {
                                    "type": "string",
                                    "description": "简要描述你刚完成了什么工作"
                                }
                            },
                            "required": ["summary"]
                        }
                    }
                ]
            }
        })

    # ── 工具调用 ──────────────────────────────────────
    elif method == "tools/call":
        params = req.get("params", {}) or {}
        tool_name = params.get("name", "")
        arguments = params.get("arguments", {}) or {}

        if tool_name == "wait_for_human":
            summary = arguments.get("summary", "（无摘要）")

            # === Mock：模拟你从手机回复了一条消息 ===
            mock_reply = "现在帮我写一个 README.md，介绍这个项目的功能和使用方法"
            # ==========================================

            send({
                "jsonrpc": "2.0",
                "id": req_id,
                "result": {
                    "content": [
                        {
                            "type": "text",
                            "text": (
                                f"✅ 已收到你的完成报告：\n{summary}\n\n"
                                f"📩 人类的下一个任务指令：\n{mock_reply}"
                            )
                        }
                    ]
                }
            })
        else:
            send({
                "jsonrpc": "2.0",
                "id": req_id,
                "error": {"code": -32601, "message": f"未知工具: {tool_name}"}
            })

    # ── 未知方法 ──────────────────────────────────────
    elif req_id is not None:
        send({
            "jsonrpc": "2.0",
            "id": req_id,
            "error": {"code": -32601, "message": f"未知方法: {method}"}
        })

def main():
    """主循环：持续读取并处理消息"""
    # 发送启动日志
    sys.stderr.write("[MCP Server] human-loop-mcp started\n")
    sys.stderr.flush()
    
    while True:
        try:
            req = recv()
            if req is None:
                break
            
            # 记录收到的请求
            method = req.get("method", "unknown") if req else "unknown"
            sys.stderr.write(f"[MCP Server] Received: {method}\n")
            sys.stderr.flush()
            
            handle(req)
        except EOFError:
            sys.stderr.write("[MCP Server] EOF received, exiting\n")
            sys.stderr.flush()
            break
        except Exception as e:
            sys.stderr.write(f"[MCP Server Error] {e}\n")
            sys.stderr.flush()

if __name__ == "__main__":
    main()
