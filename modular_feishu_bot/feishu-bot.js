/**
 * 模块化重构：Feishu WS 客户端入口，主要负责接收消息与回复
 * 用法：node feishu-bot.js
 */

const Lark = require('@larksuiteoapi/node-sdk');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { askBrowser, DEFAULT_MESSAGE } = require('./browser-driver');

const baseConfig = {
    appId: 'cli_a92f18623538dbc8',
    appSecret: 'Am2Ld2JBArQlMSzgrHEjnbcwfTFna8Hy'
}

const client = new Lark.Client(baseConfig);
const wsClient = new Lark.WSClient({ ...baseConfig, loggerLevel: Lark.LoggerLevel.debug });

const TEMP_DIR = path.join(__dirname, 'temp_files');

// 初始化并清理 30 天前的旧文件
function initAndCleanTempDir() {
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
    console.log(`📁 创建临时目录: ${TEMP_DIR}`);
  }

  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  let deletedCount = 0;

  try {
    const files = fs.readdirSync(TEMP_DIR);
    for (const file of files) {
      const filePath = path.join(TEMP_DIR, file);
      const stats = fs.statSync(filePath);
      if (now - stats.mtimeMs > thirtyDaysMs) {
        fs.unlinkSync(filePath);
        deletedCount++;
      }
    }
    if (deletedCount > 0) {
      console.log(`🧹 启动清理：已删除 ${deletedCount} 个 30 天前的临时文件`);
    }
  } catch (err) {
    console.error(`❌ 清理临时目录失败: ${err.message}`);
  }
}

// 启动时执行清理
initAndCleanTempDir();

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

// 提取并下载飞书的附件/图片数据，直接写入到本地临时文件
async function downloadFeishuResourceToTemp(messageId, fileKey, resourceType, fileName) {
  const token = await getTenantToken();
  const apiPath = `/open-apis/im/v1/messages/${messageId}/resources/${fileKey}?type=${resourceType}`;
  
  // 生成绝对路径
  const safeFileName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_'); // 简单的过滤防止路径穿越
  const finalFileName = `${messageId}_${safeFileName}`;
  const savePath = path.join(TEMP_DIR, finalFileName);

  return new Promise((resolve, reject) => {
    https.get(`https://open.feishu.cn${apiPath}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    }, (res) => {
      if (res.statusCode === 302 || res.statusCode === 301) {
        https.get(res.headers.location, (redirectRes) => {
          const fileStream = fs.createWriteStream(savePath);
          redirectRes.pipe(fileStream);
          fileStream.on('finish', () => resolve(savePath));
          fileStream.on('error', reject);
        }).on('error', reject);
        return;
      }
      if (res.statusCode !== 200) {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => reject(new Error(`下载资源失败 HTTP ${res.statusCode}: ${body}`)));
        return;
      }
      const fileStream = fs.createWriteStream(savePath);
      res.pipe(fileStream);
      fileStream.on('finish', () => resolve(savePath));
      fileStream.on('error', reject);
    }).on('error', reject);
  });
}

// 解析富文本(Post)消息的内容结构
function extractPostText(postContent) {
  try {
    const langKeys = Object.keys(postContent);
    if (langKeys.length === 0) return '';
    const lang = postContent.zh_cn || postContent.en_us || postContent[langKeys[0]];
    if (!lang) return '';
    let result = '';
    if (lang.title) result += lang.title + '\n\n';
    if (Array.isArray(lang.content)) {
      for (const paragraph of lang.content) {
        if (!Array.isArray(paragraph)) continue;
        let line = '';
        for (const element of paragraph) {
          switch (element.tag) {
            case 'text': line += element.text || ''; break;
            case 'a': line += `${element.text || ''}(${element.href || ''})`; break;
            case 'at': line += `@${element.user_name || element.user_id || '用户'}`; break;
            case 'img': line += '[图片]'; break;
            case 'media': line += '[媒体文件]'; break;
            case 'emotion': line += `[${element.emoji_type || '表情'}]`; break;
            default: line += element.text || ''; break;
          }
        }
        result += line + '\n';
      }
    }
    return result.trim();
  } catch (e) {
    return '';
  }
}

// 消息去重
const processedMsgIds = new Set();

// 启动 WS 客户端并注册事件处理器
wsClient.start({
  eventDispatcher: new Lark.EventDispatcher({}).register({
    'im.message.receive_v1': async (data) => {
      // 1. 过滤判断
      const senderType = data?.sender?.sender_type;
      if (senderType !== 'user') return;

      const { message: { chat_id, content, message_id } } = data;

      // 消息去重
      if (processedMsgIds.has(message_id)) return;
      processedMsgIds.add(message_id);
      if (processedMsgIds.size > 200) processedMsgIds.delete(processedMsgIds.values().next().value);

      console.log('--- 收到新的飞书用户消息 ---');

      let incomingText = '';
      let imageBase64 = null;
      let imageExt = 'png';
      let unsupportedType = null;
      const messageType = data?.message?.message_type || '';

      // 2. 解析不同类型的消息内容
      try {
        const parsed = JSON.parse(content);
        switch (messageType) {
          case 'text':
            incomingText = parsed?.text || JSON.stringify(parsed);
            break;
          case 'image':
            if (parsed.image_key) {
              const savePath = await downloadFeishuResourceToTemp(message_id, parsed.image_key, 'image', 'image.png');
              console.log(`🖼️ 图片已保存至: ${savePath}`);
              incomingText = `请分析这张本地图片: ${savePath}`;
            }
            break;
          case 'file':
            if (parsed.file_key) {
              const fileName = parsed.file_name || '未知文件';
              try {
                const savePath = await downloadFeishuResourceToTemp(message_id, parsed.file_key, 'file', fileName);
                console.log(`📁 文件已保存至: ${savePath}`);
                incomingText = `请分析这个本地文件 (${fileName}): ${savePath}`;
              } catch (dlErr) {
                incomingText = `文件「${fileName}」获取失败。`;
              }
            }
            break;
          case 'audio': incomingText = `用户发了语音，暂不支持。`; break;
          case 'video': incomingText = `用户发了视频，暂不支持。`; break;
          case 'post': incomingText = extractPostText(parsed) || JSON.stringify(parsed); break;
          case 'sticker': unsupportedType = '表情包'; break;
          case 'share_chat': unsupportedType = '群聊分享'; break;
          case 'share_user': unsupportedType = '名片分享'; break;
          case 'merge_forward': unsupportedType = '合并转发'; break;
          default:
            if (parsed.image_key) {
              const savePath = await downloadFeishuResourceToTemp(message_id, parsed.image_key, 'image', 'image.png');
              console.log(`🖼️ 图片(默认处理)已保存至: ${savePath}`);
              incomingText = `请分析这张本地图片: ${savePath}`;
            } else if (parsed.text) {
              incomingText = parsed.text;
            } else unsupportedType = messageType || '未知';
            break;
        }
      } catch (e) {
        incomingText = String(content || '');
      }

      // 3. 处理不支持或错误
      if (unsupportedType) {
        try {
          await client.im.v1.message.create({
            params: { receive_id_type: 'chat_id' },
            data: { receive_id: chat_id, content: JSON.stringify({ text: `⚠️ 暂不支持「${unsupportedType}」类型消息` }), msg_type: 'text' },
          });
        } catch(err){}
        return;
      }

      // 4. 初次确认：回复收件状态
      try {
        await client.im.v1.message.create({
          params: { receive_id_type: 'chat_id' },
          data: { receive_id: chat_id, content: JSON.stringify({ text: '收到，我马上调用AI查询，请稍后' }), msg_type: 'text' },
        });
      } catch (err) {}

      // 5. 调用外部浏览器驱动发送给 AI，然后发送回答
      (async () => {
        try {
          const replyText = await askBrowser({ imageBase64, imageExt, message: incomingText });
          if (replyText) {
            console.log('📤 抓取结束，回传飞书群聊...');
            await client.im.v1.message.create({
              params: { receive_id_type: 'chat_id' },
              data: { receive_id: chat_id, content: JSON.stringify({ text: replyText }), msg_type: 'text' },
            });
            console.log('✅ 回复已送出');
          }
        } catch (err) {
          console.error('浏览器执行失败：', err?.message || err);
          try {
            await client.im.v1.message.create({
              params: { receive_id_type: 'chat_id' },
              data: { receive_id: chat_id, content: JSON.stringify({ text: `❌ 生成失败：${err?.message || err}` }), msg_type: 'text' },
            });
          } catch (_) {}
        }
      })();
    }
  })
});

console.log("✅ 飞书模块化脚本已启动，监听消息中...");
