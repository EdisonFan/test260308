# Human-in-the-Loop MCP Server

一个轻量级的 MCP (Model Context Protocol) 服务器实现，用于模拟"等待人类指令"的工作流程。

## 功能特性

- **官方 MCP SDK**：使用官方 FastMCP SDK，100% 符合协议标准
- **零依赖自定义版**：同时提供手动实现版本（`loop.py`）供学习
- **Mock 模式**：内置模拟回复，无需真实人类参与即可测试
- **单工具设计**：提供 `wait_for_human` 工具，用于任务间的断点续传

## 适用场景

- 验证 Trae 等 AI IDE 能否正确调用 MCP 工具
- 测试 AI Agent 的"人类在环"工作流
- 开发需要人工确认的多步骤任务系统
- 学习和理解 MCP 协议实现

## 快速开始

### 环境要求

- **Python 3.10+**（官方 SDK 版本）
- **Python 3.6+**（手动实现版本）
- MCP SDK：`pip install mcp`（仅官方 SDK 版本需要）

### 版本说明

本项目包含两个版本的 MCP 服务器：

| 文件 | 说明 | 推荐 |
|------|------|------|
| `loop_official.py` | 使用官方 FastMCP SDK 实现 | ✅ **推荐日常使用** |
| `loop.py` | 手动实现 JSON-RPC 协议 | 📚 **供学习参考** |
| `loop_simple.py` | 简化版手动实现 | 📚 **供学习参考** |

### 安装 MCP SDK（仅官方版本需要）

```bash
pip install mcp
```

### MCP 配置 (Trae)

在 Trae 的 MCP 配置中添加：

```json
{
  "mcpServers": {
    "human-loop": {
      "command": "python",
      "args": [
        "E:/frontEnd/test/hostApp/loop_official.py"
      ],
      "env": {}
    }
  }
}
```

> **注意**：
> - Windows 系统使用 `python` 命令，而非 `python3`
> - 路径可以使用正斜杠 `/` 或双反斜杠 `\\`
> - 配置后**完全重启 Trae** 使配置生效

## 工具说明

### wait_for_human

当你完成一个阶段的任务后，调用此工具通知人类并等待下一步指令。

**参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| summary | string | 是 | 简要描述你刚完成的工作 |

**返回值**：

工具会返回人类的下一个任务指令（当前为 Mock 数据）。

**示例**：

```python
# 调用工具
wait_for_human(summary="已完成代码审查")

# 返回结果
"现在帮我写一个 README.md，介绍这个项目的功能和使用方法"
```

## 项目结构

```
hostApp/
├── loop_official.py    # ✅ 推荐：使用官方 FastMCP SDK
├── loop.py             # 📚 手动实现（完整功能）
├── loop_simple.py      # 📚 手动实现（简化版）
├── mcp_config_example.json  # 配置示例
├── test_mcp.py         # 测试脚本
└── README.md           # 本文件
```

## 核心代码解析

### 官方 SDK 版本 (loop_official.py)

```python
from mcp.server.fastmcp import FastMCP

# 初始化 FastMCP 服务器
mcp = FastMCP("human-loop")

@mcp.tool()
def wait_for_human(summary: str) -> str:
    """
    当你完成一个阶段的任务后，调用此工具通知人类并等待下一步指令。
    """
    mock_reply = "现在帮我写一个 README.md，介绍这个项目的功能和使用方法"
    return f"✅ 已收到你的完成报告：\n{summary}\n\n📩 人类的下一个任务指令：\n{mock_reply}"

if __name__ == "__main__":
    mcp.run(transport="stdio")
```

### 手动实现版本要点

- 使用 `sys.stdin` 和 `sys.stdout` 进行通信
- JSON-RPC 2.0 协议格式
- 消息格式：`Content-Length` header + JSON body
- ⚠️ 注意：所有日志必须写 `stderr`，**不要写入 stdout**

## Mock 数据说明

当前 `wait_for_human` 工具返回固定的模拟回复：

```python
mock_reply = "现在帮我写一个 README.md，介绍这个项目的功能和使用方法"
```

如需接入真实的人类交互，可修改工具实现。

## 协议规范

- **协议**：MCP (Model Context Protocol)
- **传输**：stdio (标准输入输出)
- **编码**：JSON-RPC 2.0
- **消息格式**：`Content-Length` header + JSON body
- **SDK**：官方 MCP Python SDK 1.2.0+

## 常见问题

### 1. 一直显示"准备中"怎么办？

- 使用 **`loop_official.py`**（官方 SDK 版本）而非手动实现
- 确认已安装 MCP SDK：`pip install mcp`
- 完全重启 Trae

### 2. 路径怎么写？

Windows 下推荐使用：
- 正斜杠：`E:/frontEnd/test/hostApp/loop_official.py`
- 或双反斜杠：`E:\\frontEnd\\test\\hostApp\\loop_official.py`

### 3. Python 命令找不到？

在配置中使用完整的 Python 路径，例如：
```json
{
  "command": "C:\\Users\\你的用户名\\AppData\\Local\\Programs\\Python\\Python313\\python.exe"
}
```

## 许可证

MIT License

## 作者

用于 Trae MCP 功能验证测试
