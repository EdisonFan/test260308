const TurndownService = require('turndown');
const turndownPluginGfm = require('turndown-plugin-gfm');

const gfm = turndownPluginGfm.gfm;
const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-',
  emDelimiter: '*',
  strongDelimiter: '**'
});

// 使用 GFM 插件，支持表格、删除线等 GitHub 风格 Markdown
turndownService.use(gfm);

/**
 * 将获取到的 HTML 内容转换为易读的 Markdown 纯文本
 * @param {string} htmlString - 要解析的 HTML 字符串
 * @returns {string} 转换后的 Markdown 文本
 */
function parseHtmlToText(htmlString) {
  if (!htmlString || typeof htmlString !== 'string') return '';
  try {
    // 过滤掉不必要的标签（如果是很脏的 HTML）可以在这之前先用正则做预处理
    return turndownService.turndown(htmlString);
  } catch (err) {
    console.error('HTML 转换为 Markdown 失败:', err);
    // 降级兜底：简单地剥离 HTML 标签
    return htmlString.replace(/<[^>]+>/g, '').trim();
  }
}

module.exports = { parseHtmlToText };
