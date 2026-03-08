const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: false,
    executablePath: 'C:\\Users\\admin\\AppData\\Local\\ms-playwright\\chromium-1208\\chrome-win64\\chrome.exe'
  });
  const page = await browser.newPage();
  await page.goto('https://www.baidu.com');
  console.log('百度网站已打开');
  // 保持浏览器打开
})();