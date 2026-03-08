const http = require("http");
const WebSocket = require('ws');
const { parseHtmlToText } = require('./html-parser');

const CDP_PORT = 9005;
const DEFAULT_MESSAGE = "请描述一下这张图片";

// 自动获取工作台的 WebSocket Debugger URL
function getWorkbenchUrl() {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:${CDP_PORT}/json`, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        const targets = JSON.parse(data);
        const target = targets.find(t => t.type === "page" && t.webSocketDebuggerUrl);
        if (!target) reject(new Error("找不到 Workbench Target"));
        else resolve(target.webSocketDebuggerUrl);
      });
    }).on("error", e => reject(new Error(e.message)));
  });
}

// 封装 CDP WebSocket 客户端
function cdpSession(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    let msgId = 1;
    const pending = {};

    ws.on('open', () => resolve({
      send(method, params = {}) {
        return new Promise((res, rej) => {
          const id = msgId++;
          pending[id] = { res, rej };
          try {
            ws.send(JSON.stringify({ id, method, params }));
          } catch (e) {
            delete pending[id];
            rej(e);
          }
        });
      },
      close() { ws.close(); }
    }));

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.id && pending[msg.id]) {
          const { res, rej } = pending[msg.id];
          delete pending[msg.id];
          if (msg.error) rej(new Error(msg.error.message));
          else res(msg.result);
        }
      } catch (e) {
        // ignore non-json messages
      }
    });

    ws.on('error', (err) => reject(err));
  });
}

// 等待 CDP 中的某个表达式计算为 true
async function waitUntil(cdp, expression, timeout = 30000, interval = 500) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const result = await cdp.send("Runtime.evaluate", { expression, returnByValue: true });
    if (result.result?.value === true) return true;
    await new Promise(r => setTimeout(r, interval));
  }
  throw new Error("等待超时");
}

// 等待 CDP 中的某个返回值连续数次保持稳定不变
async function waitUntilStable(cdp, expression, timeout = 120000, interval = 500, stableTimes = 3) {
  const start = Date.now();
  let lastValue = null;
  let stableCount = 0;
  while (Date.now() - start < timeout) {
    const result = await cdp.send("Runtime.evaluate", { expression, returnByValue: true });
    const current = result.result?.value;
    if (current && current === lastValue) {
      stableCount++;
      if (stableCount >= stableTimes) return current;
    } else {
      stableCount = 0;
      lastValue = current;
    }
    await new Promise(r => setTimeout(r, interval));
  }
  throw new Error("等待内容稳定超时");
}

/**
 * 驱动浏览器，发送消息并获取回复
 */
async function askBrowser({ imageBase64, imageExt = 'png', message, timeout = 120000 } = {}) {
  const MESSAGE = message || DEFAULT_MESSAGE;
  const mimeType = imageExt === 'jpg' ? 'image/jpeg' : `image/${imageExt}`;

  console.log("🔍 [CDP] 自动发现 WS 地址...");
  const wsUrl = await getWorkbenchUrl();
  const cdp = await cdpSession(wsUrl);
  await cdp.send("Runtime.enable");

  try {
    // ── 第一步：追加文字（现在图片和文件都作为路径包含在 MESSAGE 中） ──────────────────────────────
    console.log("💉 [CDP] 追加文字...");
    await cdp.send("Runtime.evaluate", {
      expression: `
        globalThis.__textTask = (async () => {
          const input = document.querySelector('[data-lexical-editor="true"]');
          if (!input) return "不存在输入框";
          input.focus();
          await new Promise(r => setTimeout(r, 100));

          const range = document.createRange();
          range.selectNodeContents(input);
          range.collapse(false);
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
          await new Promise(r => setTimeout(r, 100));

          const dt = new DataTransfer();
          dt.setData("text/plain", ${JSON.stringify(MESSAGE)});
          input.dispatchEvent(new ClipboardEvent("paste", { clipboardData: dt, bubbles: true, cancelable: true }));
          await new Promise(r => setTimeout(r, 300));
          return "✅ 文字追加完成";
        })(); globalThis.__textTask;
      `,
      awaitPromise: true,
      returnByValue: true,
    });

    // ── 第三步：点击发送 ──────────────────────────────
    console.log("🚀 [CDP] 触发发送按钮点击...");
    await cdp.send("Runtime.evaluate", {
      expression: `document.querySelector(".chat-input-v2-send-button")?.click();`,
      returnByValue: true,
    });

    // ── 第四步：等待开始生成与排队检测单循环 ─────────
    console.log("⏳ [CDP] 等待大模型开始生成回复...");
    const waitStart = Date.now();
    let lastQueueMsg = "";
    let lastProcessedText = ""; 
    let lastTurnCount = 0;      
    let stableIntervalCount = 0; // 用于记录内容没有变化的次数
    while (Date.now() - waitStart < 600000) {
      const r = await cdp.send("Runtime.evaluate", {
        expression: `
          (() => {
            // 深度搜索函数，用于穿透 Shadow DOM
            const findInShadow = (selector, root = document) => {
              const el = root.querySelector(selector);
              if (el) return el;
              const shadows = Array.from(root.querySelectorAll('*')).filter(e => e.shadowRoot);
              for (const s of shadows) {
                const found = findInShadow(selector, s.shadowRoot);
                if (found) return found;
              }
              return null;
            };

            const getAllElementsInShadow = (root = document, acc = []) => {
              acc.push(...Array.from(root.querySelectorAll('*')));
              const shadows = Array.from(root.querySelectorAll('*')).filter(e => e.shadowRoot);
              for (const s of shadows) {
                getAllElementsInShadow(s.shadowRoot, acc);
              }
              return acc;
            };

            // 只要包含 codicon-stop 关键字的图标都在，就认为在生成
            const stopBtn = !!document.querySelector('.chat-input-v2-send-button [class*="stop"]');
            const queueEl = document.querySelector(".icube-alert-msg");
            const queueMsg = queueEl && queueEl.textContent.includes("排") ? queueEl.textContent.trim() : "";
            
            const turns = document.querySelectorAll(".assistant-chat-turn-content");
            const lastTurn = turns.length > 0 ? turns[turns.length - 1] : null;

            // 仅对当前最后一轮进行阻断检测
            const isPendingForm = lastTurn ? !!findInShadow('.ask-user-question-card-status-pending', lastTurn) : false;
            
            // 检测全局或最后回复中的等待文本
            const allElements = lastTurn ? getAllElementsInShadow(lastTurn) : [];
            const isWaitingText = allElements.some(el => (el.textContent || '').includes('正在等待你的操作'));

            // 仅检测最后回复中的可交互按钮
            const interactiveButtons = allElements.some(b => {
              if (!(b.tagName === 'BUTTON' || b.tagName === 'A' || b.getAttribute('role') === 'button' || b.classList.contains('icube-btn'))) return false;
              const text = (b.textContent || '').trim();
              const isTargetText = ['确认', '删除', 'Next', '执行', '确定'].some(t => text.includes(t));
              const isHidden = b.offsetParent === null;
              return isTargetText && !isHidden;
            });

            const needsBypass = isPendingForm || isWaitingText || interactiveButtons;
            const currentText = lastTurn ? lastTurn.textContent : "";
            const turnCount = turns.length;

            return JSON.stringify({ stopBtn, queueMsg, needsBypass, currentText, turnCount });
          })()
        `,
        returnByValue: true,
      });
      const { stopBtn, queueMsg, needsBypass, currentText, turnCount } = JSON.parse(r.result?.value || "{}");

      // 1. 核心流式打印逻辑
      if (turnCount > 0) {
        // 如果轮数增加，说明进入了新对话（可能是自动跳过后的新回复）
        if (turnCount > lastTurnCount) {
          if (lastTurnCount > 0) process.stdout.write("\n\n[新回复轮次]\n");
          lastProcessedText = "";
          lastTurnCount = turnCount;
        }

        // 只要当前抓取的文本长度 > 已处理长度，就立即打印新增量
        if (currentText.length > lastProcessedText.length) {
          const newPart = currentText.substring(lastProcessedText.length);
          process.stdout.write(newPart);
          lastProcessedText = currentText;
          stableIntervalCount = 0; // 内容有变化，重置稳定计数
        } else if (currentText.length > 0) {
          stableIntervalCount++; // 内容没变，增加稳定计数
        }
      }

      // 2. 状态提示
      if (queueMsg && queueMsg !== lastQueueMsg) {
        process.stdout.write(`\n⏳ ${queueMsg}\n`);
        lastQueueMsg = queueMsg;
      }

      // 3. 动态退出条件
      // 满足以下任一条件继续循环：
      // a) 停止按钮还在 (stopBtn 为 true)
      // b) 内容还没出 (lastProcessedText 为空)
      // c) 内容还在变 (stableIntervalCount 较小)
      const isGenerating = stopBtn || (lastProcessedText.length > 0 && stableIntervalCount < 10);

      if (!isGenerating && lastProcessedText.length > 0) {
        break; // 只有当按钮消失且内容长达 2 秒不再变化时，才认为真正结束
      }

      // 处理阻断
      if (needsBypass && !stopBtn) {
        console.log("\n⚠️ [交互阻断] 发送指令跳过...");
        await cdp.send("Runtime.evaluate", {
          expression: `
              (async () => {
                const input = document.querySelector('[data-lexical-editor="true"]');
                if (!input) return;
                input.focus();
                const dt = new DataTransfer();
                dt.setData("text/plain", "继续执行，转化成文本形式");
                input.dispatchEvent(new ClipboardEvent("paste", { clipboardData: dt, bubbles: true, cancelable: true }));
                await new Promise(r => setTimeout(r, 500));
                document.querySelector(".chat-input-v2-send-button")?.click();
              })();
            `,
          awaitPromise: true,
        });
        await new Promise(r => setTimeout(r, 3000));
        continue;
      }

      await new Promise(r => setTimeout(r, 1000));
    }
    process.stdout.write("\n\n✅ [生成结束]\n");

    // ── 第五步：提取并解析 HTML ──────────────────────────
    // 循环已经判定了内容的稳定性，这里直接抓取 outerHTML 即可
    const rawHtmlResult = await cdp.send("Runtime.evaluate", {
      expression: `(() => {
        const turns = document.querySelectorAll(".assistant-chat-turn-content");
        if (turns.length === 0) return "";
        return turns[turns.length - 1].outerHTML;
      })()`,
      returnByValue: true,
    });

    const rawHtml = rawHtmlResult.result?.value || "";
    if (!rawHtml) {
      throw new Error("截获回复失败 (HTML 节点不存在)");
    }

    // 利用独立出的 HTML 解析模块转换为可读文本
    let mdText = parseHtmlToText(rawHtml);
    // 处理掉连续三行以上的空行冗余
    mdText = mdText.replace(/\\n{3,}/g, "\\n\\n").trim();

    return mdText;

  } finally {
    cdp.close();
  }
}

module.exports = { askBrowser, DEFAULT_MESSAGE };
