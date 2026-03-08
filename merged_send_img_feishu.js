/**
 * 合并：Feishu WS 客户端 + 图片+文字发送到 Workbench 的脚本
 * 说明：将原有的 `feishu.js`（改为 CommonJS）和 `send_img_with_text.js` 合并在同一文件。
 * 用法：node merged_send_img_feishu.js
 */

// --------- Feishu 部分（已改为 CommonJS） ---------
const Lark = require('@larksuiteoapi/node-sdk');

const baseConfig = {
    appId: 'cli_a92f18623538dbc8',
    appSecret: 'Am2Ld2JBArQlMSzgrHEjnbcwfTFna8Hy'
}

const client = new Lark.Client(baseConfig);
const wsClient = new Lark.WSClient({ ...baseConfig, loggerLevel: Lark.LoggerLevel.debug });

// 消息去重：防止飞书重试导致同一条消息被处理多次
const processedMsgIds = new Set();

// 启动 WS 客户端并注册事件处理器
wsClient.start({
  eventDispatcher: new Lark.EventDispatcher({}).register({
    'im.message.receive_v1': async (data) => {
      // 过滤掉机器人自己发的消息，避免死循环
      const senderType = data?.sender?.sender_type;
      if (senderType !== 'user') {
        console.log('⏭️ 忽略非用户消息（sender_type:', senderType, '）');
        return;
      }

      const {
        message: { chat_id, content, message_id }
      } = data;

      // 消息去重
      if (processedMsgIds.has(message_id)) {
        console.log('⏭️ 忽略重复消息，message_id:', message_id);
        return;
      }
      processedMsgIds.add(message_id);
      // 防止内存泄漏，最多保留 200 条
      if (processedMsgIds.size > 200) {
        const first = processedMsgIds.values().next().value;
        processedMsgIds.delete(first);
      }

      console.log('收到飞书消息事件：', JSON.stringify(data, null, 2));

      let incomingText = '';
      let imageBase64 = null;
      let imageExt = 'png';
      let unsupportedType = null; // 如果是不支持的类型，设置提示文字

      const messageType = data?.message?.message_type || '';
      console.log('📨 消息类型：', messageType);

      try {
        const parsed = JSON.parse(content);

        switch (messageType) {
          case 'text':
            // 纯文本消息
            incomingText = parsed?.text || JSON.stringify(parsed);
            break;

          case 'image':
            // 图片消息
            if (parsed.image_key) {
              console.log('📥 从飞书下载图片，message_id:', message_id, 'image_key:', parsed.image_key);
              const buffer = await downloadFeishuResource(message_id, parsed.image_key, 'image');
              imageBase64 = buffer.toString('base64');
              console.log(`📷 图片下载完成（${(buffer.length / 1024).toFixed(1)} KB）`);
              incomingText = DEFAULT_MESSAGE;
            }
            break;

          case 'file':
            // 文件消息：下载后告知AI文件信息，文本类文件可提取内容
            if (parsed.file_key) {
              const fileName = parsed.file_name || '未知文件';
              console.log('📥 收到文件消息：', fileName, 'file_key:', parsed.file_key);
              try {
                const fileBuffer = await downloadFeishuResource(message_id, parsed.file_key, 'file');
                console.log(`📁 文件下载完成（${(fileBuffer.length / 1024).toFixed(1)} KB）`);
                const ext = fileName.split('.').pop()?.toLowerCase() || '';
                // 对于文本类文件，尝试提取内容发送给AI
                const textExts = ['txt', 'md', 'json', 'csv', 'xml', 'html', 'htm', 'log', 'yaml', 'yml', 'ini', 'conf', 'cfg', 'properties', 'js', 'ts', 'py', 'java', 'c', 'cpp', 'h', 'go', 'rs', 'rb', 'php', 'sql', 'sh', 'bat', 'ps1', 'css', 'scss', 'less', 'vue', 'jsx', 'tsx'];
                if (textExts.includes(ext)) {
                  const textContent = fileBuffer.toString('utf-8');
                  // 限制长度避免超长内容
                  const maxLen = 8000;
                  const truncated = textContent.length > maxLen
                    ? textContent.substring(0, maxLen) + '\n...（文件内容过长，已截断）'
                    : textContent;
                  incomingText = `用户发送了一个文件「${fileName}」，以下是文件内容：\n\n${truncated}\n\n请分析这个文件的内容。`;
                } else {
                  // 非文本文件（如 PDF、Word、Excel 等），告知AI文件信息
                  incomingText = `用户发送了一个文件「${fileName}」（${ext.toUpperCase()} 格式，${(fileBuffer.length / 1024).toFixed(1)} KB）。这是一个二进制文件，无法直接读取其内容。请告知用户您收到了文件信息，并建议用户将文件内容以文本或截图形式发送以便分析。`;
                }
              } catch (dlErr) {
                console.error('文件下载失败：', dlErr?.message || dlErr);
                incomingText = `用户发送了一个文件「${fileName}」，但下载失败：${dlErr?.message}。请告知用户重新发送。`;
              }
            }
            break;

          case 'audio':
            // 语音消息
            if (parsed.file_key) {
              console.log('🎵 收到语音消息，file_key:', parsed.file_key);
              const duration = parsed.duration ? `${Math.ceil(parsed.duration / 1000)}秒` : '未知时长';
              incomingText = `用户发送了一条语音消息（时长约${duration}）。目前暂不支持语音转文字，请告知用户以文字形式发送问题，以便为其提供帮助。`;
            }
            break;

          case 'video':
            // 视频消息：尝试下载视频缩略图
            if (parsed.image_key) {
              console.log('🎬 收到视频消息，尝试下载缩略图 image_key:', parsed.image_key);
              try {
                const thumbBuffer = await downloadFeishuResource(message_id, parsed.image_key, 'image');
                imageBase64 = thumbBuffer.toString('base64');
                console.log(`🎬 视频缩略图下载完成（${(thumbBuffer.length / 1024).toFixed(1)} KB）`);
                const duration = parsed.duration ? `${Math.ceil(parsed.duration / 1000)}秒` : '未知时长';
                incomingText = `用户发送了一条视频消息（时长约${duration}）。这是视频的缩略图预览。目前暂不支持视频内容分析，请根据缩略图描述画面内容，并建议用户如需详细分析，可以发送视频截图。`;
              } catch (thumbErr) {
                console.error('视频缩略图下载失败：', thumbErr?.message);
                const duration = parsed.duration ? `${Math.ceil(parsed.duration / 1000)}秒` : '未知时长';
                incomingText = `用户发送了一条视频消息（时长约${duration}）。目前暂不支持视频内容分析，请告知用户以文字描述或截图形式发送，以便提供帮助。`;
              }
            } else {
              incomingText = `用户发送了一条视频消息。目前暂不支持视频内容分析，请告知用户以文字描述或截图形式发送，以便提供帮助。`;
            }
            break;

          case 'post':
            // 富文本消息：提取所有文本内容
            incomingText = extractPostText(parsed);
            if (!incomingText) {
              incomingText = JSON.stringify(parsed);
            }
            console.log('📝 富文本消息提取结果：', incomingText.substring(0, 100) + (incomingText.length > 100 ? '...' : ''));
            break;

          case 'sticker':
            // 表情包消息
            unsupportedType = '表情包';
            break;

          case 'share_chat':
            // 分享群聊消息
            incomingText = `用户分享了一个群聊「${parsed.chat_id || '未知群聊'}」。请告知用户您收到了群聊分享，但目前无法处理此类型消息，建议以文字形式描述需求。`;
            break;

          case 'share_user':
            // 分享用户名片消息
            incomingText = `用户分享了一个联系人名片（user_id: ${parsed.user_id || '未知'}）。请告知用户您收到了名片分享，但目前无法处理此类型消息，建议以文字形式描述需求。`;
            break;

          case 'merge_forward':
            // 合并转发消息
            unsupportedType = '合并转发';
            break;

          default:
            // 兜底逻辑：尝试提取文本
            if (parsed.image_key) {
              console.log('📥 从飞书下载图片（兜底），message_id:', message_id, 'image_key:', parsed.image_key);
              const buffer = await downloadFeishuResource(message_id, parsed.image_key, 'image');
              imageBase64 = buffer.toString('base64');
              console.log(`📷 图片下载完成（${(buffer.length / 1024).toFixed(1)} KB）`);
              incomingText = DEFAULT_MESSAGE;
            } else if (parsed.text) {
              incomingText = parsed.text;
            } else {
              unsupportedType = messageType || '未知';
            }
            break;
        }
      } catch (e) {
        console.error('解析消息内容失败：', e?.message || e, e?.stack);
        incomingText = String(content || '');
      }

      // 如果是不支持的消息类型，直接回复用户并结束
      if (unsupportedType) {
        console.log(`⚠️ 不支持的消息类型：${unsupportedType}`);
        try {
          await client.im.v1.message.create({
            params: { receive_id_type: 'chat_id' },
            data: {
              receive_id: chat_id,
              content: JSON.stringify({ text: `⚠️ 暂不支持「${unsupportedType}」类型的消息，请发送文字、图片或文件（文本类文件可自动读取内容）。` }),
              msg_type: 'text',
            },
          });
        } catch (err) {
          console.error('发送不支持提示失败：', err?.message || err);
        }
        return;
      }

      // ① 立即回复飞书，告知已收到
      try {
        await client.im.v1.message.create({
          params: { receive_id_type: 'chat_id' },
          data: {
            receive_id: chat_id,
            content: JSON.stringify({ text: '收到，我马上调用AI查询，请稍后' }),
            msg_type: 'text',
          },
        });
      } catch (err) {
        console.error('发送确认回复失败：', err?.message || err);
      }

      // ② 后台处理：发送到 Workbench，等 Trae 回答后发回飞书（不阻塞事件回调）
      (async () => {
        try {
          const replyText = await main({ imageBase64, imageExt, message: incomingText });
          if (replyText) {
            console.log('📤 将回答发回飞书...');
            await client.im.v1.message.create({
              params: { receive_id_type: 'chat_id' },
              data: {
                receive_id: chat_id,
                content: JSON.stringify({ text: replyText }),
                msg_type: 'text',
              },
            });
            console.log('✅ 回答已发回飞书');
          }
        } catch (err) {
          console.error('处理失败：', err?.message || err);
          try {
            await client.im.v1.message.create({
              params: { receive_id_type: 'chat_id' },
              data: {
                receive_id: chat_id,
                content: JSON.stringify({ text: `❌ 处理失败：${err?.message || err}` }),
                msg_type: 'text',
              },
            });
          } catch (_) {}
        }
      })();
    }
  })
});

// --------- Workbench 图片+文字 自动发送 部分 ---------
const http = require("http");
const WebSocket = require('ws');

const CDP_PORT = 9005;
const https = require('https');

// 获取飞书 tenant_access_token
function getTenantToken() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      app_id: baseConfig.appId,
      app_secret: baseConfig.appSecret,
    });
    const req = https.request({
      hostname: 'open.feishu.cn',
      path: '/open-apis/auth/v3/tenant_access_token/internal',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.tenant_access_token) resolve(json.tenant_access_token);
          else reject(new Error('获取 token 失败: ' + data));
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// 从飞书下载消息中的资源文件（图片/文件/视频等，使用 Message Resource API）
// resourceType: 'image' | 'file'
async function downloadFeishuResource(messageId, fileKey, resourceType = 'image') {
  const token = await getTenantToken();
  console.log('🔑 已获取 tenant_access_token');
  const apiPath = `/open-apis/im/v1/messages/${messageId}/resources/${fileKey}?type=${resourceType}`;
  console.log('📡 请求路径:', apiPath);
  return new Promise((resolve, reject) => {
    https.get(`https://open.feishu.cn${apiPath}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    }, (res) => {
      // 处理重定向
      if (res.statusCode === 302 || res.statusCode === 301) {
        https.get(res.headers.location, (redirectRes) => {
          const chunks = [];
          redirectRes.on('data', chunk => chunks.push(chunk));
          redirectRes.on('end', () => resolve(Buffer.concat(chunks)));
          redirectRes.on('error', reject);
        }).on('error', reject);
        return;
      }
      if (res.statusCode !== 200) {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => reject(new Error(`下载资源失败 HTTP ${res.statusCode}: ${body}`)));
        return;
      }
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

// 从飞书富文本消息（post）中提取纯文本
function extractPostText(postContent) {
  try {
    // post 消息的 content 格式: { "zh_cn": { "title": "...", "content": [[{"tag":"text","text":"..."}, ...], ...] } }
    // 也可能是其他语言 key，如 en_us
    const langKeys = Object.keys(postContent);
    if (langKeys.length === 0) return '';

    // 优先 zh_cn，否则取第一个
    const lang = postContent.zh_cn || postContent.en_us || postContent[langKeys[0]];
    if (!lang) return '';

    let result = '';
    if (lang.title) {
      result += lang.title + '\n\n';
    }

    if (Array.isArray(lang.content)) {
      for (const paragraph of lang.content) {
        if (!Array.isArray(paragraph)) continue;
        let line = '';
        for (const element of paragraph) {
          switch (element.tag) {
            case 'text':
              line += element.text || '';
              break;
            case 'a':
              line += `${element.text || ''}(${element.href || ''})`;
              break;
            case 'at':
              line += `@${element.user_name || element.user_id || '用户'}`;
              break;
            case 'img':
              line += '[图片]';
              break;
            case 'media':
              line += '[媒体文件]';
              break;
            case 'emotion':
              line += `[${element.emoji_type || '表情'}]`;
              break;
            default:
              line += element.text || '';
              break;
          }
        }
        result += line + '\n';
      }
    }

    return result.trim();
  } catch (e) {
    console.error('解析富文本失败：', e?.message || e);
    return '';
  }
}

const DEFAULT_MESSAGE = "请描述一下这张图片"; // ← 默认文字

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
        // ignore non-json or other messages
      }
    });

    ws.on('error', (err) => reject(err));
  });
}

async function waitUntil(cdp, expression, timeout = 30000, interval = 500) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const result = await cdp.send("Runtime.evaluate", { expression, returnByValue: true });
    if (result.result?.value === true) return true;
    await new Promise(r => setTimeout(r, interval));
  }
  throw new Error("等待超时");
}

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

async function main({ imageBase64, imageExt = 'png', message } = {}) {
  const MESSAGE = message || DEFAULT_MESSAGE;
  const mimeType = imageExt === 'jpg' ? 'image/jpeg' : `image/${imageExt}`;

  console.log("🔍 自动发现 WS 地址...");
  const wsUrl = await getWorkbenchUrl();
  const cdp = await cdpSession(wsUrl);
  await cdp.send("Runtime.enable");

  // ── 第一步：粘贴图片（仅在有图片时执行） ──────────────────
  if (imageBase64) {
    console.log(`📷 图片大小：${(imageBase64.length * 0.75 / 1024).toFixed(1)} KB`);
    console.log("💉 粘贴图片...");
    const base64 = imageBase64;
    const ext = imageExt;
    const imgResult = await cdp.send("Runtime.evaluate", {
      expression: `
  globalThis.__imgTask = (async () => {
    const input = document.querySelector('[data-lexical-editor="true"]');
    if (!input) return "❌ 找不到输入框";
    input.focus();
    await new Promise(r => setTimeout(r, 100));

    const byteChars = atob("${base64}");
    const byteArr = new Uint8Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) byteArr[i] = byteChars.charCodeAt(i);
    const file = new File([new Blob([byteArr], { type: "${mimeType}" })], "image.${ext}", { type: "${mimeType}" });

    const dt = new DataTransfer();
    dt.items.add(file);
    input.dispatchEvent(new ClipboardEvent("paste", { clipboardData: dt, bubbles: true, cancelable: true }));
    await new Promise(r => setTimeout(r, 300));
    return "✅ 图片粘贴完成";
  })(); globalThis.__imgTask;
      `,
      awaitPromise: true,
      returnByValue: true,
    });
    console.log(imgResult.result?.value);

    // ── 第二步：等待图片上传完成（发送按钮从 disabled 变回可用）
    console.log("⏳ 等待图片上传完成...");
    await waitUntil(cdp,
      `(() => {
        const btn = document.querySelector(".chat-input-v2-send-button");
        return btn && !btn.disabled;
      })()`,
      30000
    );
    console.log("✅ 图片上传完成，发送按钮已可用");
  }

  // ── 第三步：追加文字 ──────────────────────────────
  console.log("💉 追加文字...");
  const textResult = await cdp.send("Runtime.evaluate", {
    expression: `
globalThis.__textTask = (async () => {
  const input = document.querySelector('[data-lexical-editor="true"]');
  if (!input) return "❌ 找不到输入框";
  input.focus();
  await new Promise(r => setTimeout(r, 100));

  // 光标移到末尾
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
  console.log(textResult.result?.value);

  // ── 第四步：点击发送 ──────────────────────────────
  console.log("🚀 发送...");
  await cdp.send("Runtime.evaluate", {
    expression: `document.querySelector(".chat-input-v2-send-button")?.click();`,
    returnByValue: true,
  });

  // ── 第五步：等待开始生成（含排队检测，单循环）─────────
  console.log("⏳ 等待 Trae 开始生成...");
  {
    const timeout = 600000;
    const interval = 1000;
    const start = Date.now();
    let lastQueueMsg = "";
    while (Date.now() - start < timeout) {
      const r = await cdp.send("Runtime.evaluate", {
        expression: `
          (() => {
            const stopBtn = !!document.querySelector('.chat-input-v2-send-button .codicon-stop-circle');
            const queueEl = document.querySelector(".icube-alert-msg");
            const queueMsg = queueEl && queueEl.textContent.includes("排")
              ? queueEl.textContent.trim() : "";
            return JSON.stringify({ stopBtn, queueMsg });
          })()
        `,
        returnByValue: true,
      });
      const { stopBtn, queueMsg } = JSON.parse(r.result?.value || "{}");
      if (!stopBtn) break;
      if (queueMsg && queueMsg !== lastQueueMsg) {
        console.log(queueMsg);
        lastQueueMsg = queueMsg;
      }
      await new Promise(r => setTimeout(r, interval));
    }
  }
  console.log("✅ 生成中...");

  console.log("⏳ 等待 Trae 回答完成...");
  await waitUntil(cdp,
    `!document.querySelector('.chat-input-v2-send-button .codicon-stop-circle')`,
    120000
  );
  console.log("✅ 生成完成！");

  // ── 第六步：等待内容稳定后获取完整回复 ─────────────
  console.log("⏳ 等待内容稳定...");
  // 先用 textContent 做稳定性检测（轻量）
  await waitUntilStable(cdp,
    `(() => {
      const turns = document.querySelectorAll(".assistant-chat-turn-content");
      if (turns.length === 0) return "";
      return turns[turns.length - 1].textContent.trim();
    })()`
  );

  // 稳定后再用 DOM 遍历提取完整内容并转换为可读文本（保留表格等结构）
  // 使用字符串数组拼接构建表达式，避免模板字符串中的转义问题
  const htmlToTextExpr = [
    '(() => {',
    '  const turns = document.querySelectorAll(".assistant-chat-turn-content");',
    '  if (turns.length === 0) return "";',
    '  const el = turns[turns.length - 1];',
    '  const NL = String.fromCharCode(10);',
    '  const BT = String.fromCharCode(96);',
    '  function htmlToText(node) {',
    '    if (node.nodeType === Node.TEXT_NODE) return node.textContent;',
    '    if (node.nodeType !== Node.ELEMENT_NODE) return "";',
    '    const tag = node.tagName.toLowerCase();',
    '    if (tag === "table") {',
    '      const rows = [];',
    '      node.querySelectorAll("tr").forEach(tr => {',
    '        const cells = [];',
    '        tr.querySelectorAll("th, td").forEach(cell => { cells.push(cell.textContent.trim()); });',
    '        rows.push(cells);',
    '      });',
    '      if (rows.length === 0) return "";',
    '      const colCount = Math.max(...rows.map(r => r.length));',
    '      const colWidths = Array(colCount).fill(0);',
    '      rows.forEach(row => {',
    '        row.forEach((cell, i) => {',
    '          const w = [...cell].reduce((s, c) => s + (c.charCodeAt(0) > 127 ? 2 : 1), 0);',
    '          if (w > colWidths[i]) colWidths[i] = w;',
    '        });',
    '      });',
    '      const pad = (t, ci) => {',
    '        const w = [...t].reduce((s, c) => s + (c.charCodeAt(0) > 127 ? 2 : 1), 0);',
    '        return t + " ".repeat(Math.max(0, colWidths[ci] - w));',
    '      };',
    '      const lines = rows.map(row => "| " + row.map((c, i) => pad(c, i)).join(" | ") + " |");',
    '      if (lines.length > 1) {',
    '        const sep = "| " + colWidths.map(w => "-".repeat(w)).join(" | ") + " |";',
    '        lines.splice(1, 0, sep);',
    '      }',
    '      return NL + lines.join(NL) + NL;',
    '    }',
    '    if (tag === "pre") return NL + BT+BT+BT + NL + node.textContent.trim() + NL + BT+BT+BT + NL;',
    '    if (tag === "code" && node.parentElement && node.parentElement.tagName.toLowerCase() !== "pre") return BT + node.textContent + BT;',
    '    if (tag === "ul" || tag === "ol") {',
    '      let idx = 0; let result = NL;',
    '      node.querySelectorAll(":scope > li").forEach(li => { idx++; const pfx = tag === "ol" ? idx + ". " : "\\u2022 "; result += pfx + li.textContent.trim() + NL; });',
    '      return result;',
    '    }',
    '    if (/^h[1-6]$/.test(tag)) { const lv = parseInt(tag[1]); return NL + "#".repeat(lv) + " " + node.textContent.trim() + NL; }',
    '    if (tag === "p" || tag === "div") { let t = ""; node.childNodes.forEach(ch => { t += htmlToText(ch); }); return NL + t.trim() + NL; }',
    '    if (tag === "br") return NL;',
    '    if (tag === "strong" || tag === "b") return "**" + node.textContent + "**";',
    '    if (tag === "em" || tag === "i") return "*" + node.textContent + "*";',
    '    let t = ""; node.childNodes.forEach(ch => { t += htmlToText(ch); }); return t;',
    '  }',
    '  let result = htmlToText(el);',
    '  result = result.replace(/\\n{3,}/g, "\\n\\n").trim();',
    '  return result;',
    '})()',
  ].join('\n');

  const richResult = await cdp.send("Runtime.evaluate", {
    expression: htmlToTextExpr,
    returnByValue: true,
  });
  const stableText = richResult.result?.value || "";
  console.log(`\n🤖 Trae 的回答：\n${stableText}`);

  cdp.close();
  return stableText;
}

// 启动后仅监听飞书消息，不再自动发送
console.log("✅ 脚本已启动，等待飞书消息...");
