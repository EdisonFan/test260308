#!/usr/bin/env node
/**
 * Human-in-the-Loop MCP Server (官方SDK版 - Node.js)
 * - 使用官方 MCP SDK @modelcontextprotocol/sdk
 * - 100% 符合协议标准
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// 初始化 MCP 服务器
const server = new McpServer({
    name: "human-loop",
    version: "1.0.0",
});

// 注册 wait_for_human 工具
server.tool(
    "wait_for_human",
    `当你完成一个阶段的任务后，调用此工具通知人类并等待下一步指令。
工具会返回人类给你的下一个任务描述，你需要按照返回内容继续执行。`,
    {
        summary: z.string().describe("简要描述你刚完成了什么工作"),
    },
    async ({ summary }) => {
        // 等待 30 秒
        await new Promise((resolve) => setTimeout(resolve, 10 * 12 * 1000));

        const mockReply = "恭喜你完成了任务！\n\n";

        return {
            content: [
                {
                    type: "text",
                    text:
                        `✅ 已收到你的完成报告：\n${summary}\n\n` +
                        `📩 人类的下一个任务指令：\n${mockReply}，若没有就显示完成`,
                },
            ],
        };
    }
);

// 启动服务器 (stdio transport)
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
}

main().catch(console.error);
