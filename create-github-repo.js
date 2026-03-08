const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: false,
    executablePath: 'C:\\Users\\admin\\AppData\\Local\\ms-playwright\\chromium-1208\\chrome-win64\\chrome.exe'
  });
  
  const page = await browser.newPage();
  
  console.log('正在打开 GitHub...');
  await page.goto('https://github.com/new');
  
  console.log('请在浏览器中完成以下操作：');
  console.log('1. 如果未登录，请先登录 GitHub');
  console.log('2. 在 "Repository name" 输入框中输入：hostApp');
  console.log('3. 选择 Public（公开）或 Private（私有）');
  console.log('4. 不要勾选 "Add a README" 和 "Add .gitignore"');
  console.log('5. 点击 "Create repository" 按钮');
  console.log('6. 创建成功后，复制页面上的仓库地址（HTTPS 格式）');
  console.log('');
  console.log('完成后请把仓库地址发给我！');
  console.log('格式类似：https://github.com/您的用户名/hostApp.git');
  
  // 保持浏览器打开，让用户操作
  await new Promise(() => {});
})();
