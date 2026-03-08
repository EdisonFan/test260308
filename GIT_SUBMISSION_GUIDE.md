# Git 提交过程指南

本文档提供了将本地项目初始化并推送到 GitHub 远程仓库的通用步骤。

---

## 📋 前置信息

在开始之前，请准备以下信息：

| 信息项 | 说明 | 示例 |
|:---|:---|:---|
| `PROJECT_NAME` | 您的项目名称 | `my-project` |
| `LOCAL_PATH` | 项目本地路径 | `/path/to/project` |
| `GITHUB_USERNAME` | GitHub 用户名 | `yourname` |
| `REPO_URL` | 远程仓库地址 | `https://github.com/username/repo.git` |

---

## 🚀 完整步骤

### 步骤 1: 初始化 Git 仓库

在项目根目录执行：

```bash
cd PROJECT_NAME
git init
```

**预期输出**:
```
Initialized empty Git repository in /path/to/PROJECT_NAME/.git/
```

---

### 步骤 2: 创建 .gitignore 文件

根据项目类型创建 `.gitignore` 文件：

#### Node.js / React / Vue 项目
```gitignore
# Dependencies
node_modules
.pnp
.pnp.js

# Build outputs
dist
dist-ssr
build
out

# Environment variables
.env
.env.local
.env.*.local

# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

# Testing
coverage
.nyc_output

# Cache
.cache
.parcel-cache
.eslintcache
.stylelintcache
*.tsbuildinfo
```

#### Python 项目
```gitignore
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
env/
venv/
ENV/
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg

# Virtual environments
venv/
ENV/
env/
```

#### Java 项目
```gitignore
# Compiled class files
*.class

# Log files
*.log

# Package files
*.jar
*.war
*.nar
*.ear
*.zip
*.tar.gz
*.rar

# Virtual machine crash logs
hs_err_pid*

# IDE files
.idea/
*.iml
.vscode/

# Build directories
target/
build/
out/
```

---

### 步骤 3: 创建 GitHub 远程仓库

#### 方式 A: 使用浏览器手动创建

1. 访问 https://github.com/new
2. 填写 Repository name: `PROJECT_NAME`
3. 选择 Public 或 Private
4. **不要勾选** "Add a README" 和 "Add .gitignore"（本地已有）
5. 点击 "Create repository"
6. 复制仓库地址（HTTPS 或 SSH）

#### 方式 B: 使用 GitHub CLI（如果已安装）

```bash
# 安装 GitHub CLI: https://cli.github.com/

# 登录
gitHub auth login

# 创建仓库
gitHub repo create PROJECT_NAME --public --source=. --remote=origin
```

#### 方式 C: 使用 Playwright 自动化脚本

```javascript
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  await page.goto('https://github.com/new');
  
  console.log('请在浏览器中完成：');
  console.log('1. 登录 GitHub');
  console.log('2. 填写 Repository name');
  console.log('3. 选择 Public/Private');
  console.log('4. 点击 Create repository');
  console.log('5. 复制仓库地址');
})();
```

---

### 步骤 4: 关联远程仓库

```bash
git remote add origin REPO_URL
```

**示例**:
```bash
git remote add origin https://github.com/username/project.git
```

**验证**:
```bash
git remote -v
```

---

### 步骤 5: 配置分支名称（可选）

```bash
git branch -M main
```

> 注：Git 2.28+ 版本默认使用 `main` 作为主分支名

---

### 步骤 6: 添加文件到暂存区

```bash
# 添加所有文件
git add .

# 或添加特定文件
git add filename.txt
```

---

### 步骤 7: 提交更改

```bash
git commit -m "Initial commit: 项目初始化"
```

**提交信息规范**:
- `feat`: 新功能
- `fix`: 修复问题
- `docs`: 文档修改
- `style`: 代码格式修改
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

**示例**:
```bash
git commit -m "feat: 添加用户登录功能"
git commit -m "fix: 修复页面加载缓慢问题"
git commit -m "docs: 更新 README 文档"
```

---

### 步骤 8: 推送到远程仓库

```bash
git push -u origin main
```

**首次推送输出示例**:
```
Counting objects: 100% (53/53), done.
Delta compression using up to 4 threads
Compressing objects: 100% (48/48), done.
Writing objects: 100% (53/53), 22.82 KiB/s, done.
Total 53 (delta 13), reused 0 (delta 0)
remote: Resolving deltas: 100% (13/13), done.
To https://github.com/username/project.git
 * [new branch]      main -> main
branch 'main' set up to track 'origin/main'.
```

---

## 📊 验证提交

### 查看本地状态
```bash
git status
```

### 查看提交历史
```bash
git log --oneline
```

### 查看远程仓库信息
```bash
git remote -v
```

---

## � 后续开发流程

### 日常提交流程

```bash
# 1. 查看修改
git status

# 2. 添加修改的文件
git add .

# 3. 提交更改
git commit -m "描述您的修改"

# 4. 推送到远程
git push
```

### 拉取远程更新

```bash
# 拉取并合并远程更改
git pull

# 或先获取再合并
git fetch origin
git merge origin/main
```

---

## 🛠️ 常见问题

### Q1: 提示 "fatal: not a git repository"
**解决**: 确保在项目根目录执行，或先运行 `git init`

### Q2: 提示 "src refspec main does not match any"
**解决**: 先执行 `git add .` 和 `git commit` 创建初始提交

### Q3: 提示 "remote origin already exists"
**解决**: 
```bash
git remote remove origin
git remote add origin REPO_URL
```

### Q4: 推送时提示权限错误
**解决**: 
- 检查 GitHub 登录状态
- 确认有仓库写入权限
- 或使用 SSH 方式：`git@github.com:username/repo.git`

---

## 📚 常用命令速查表

| 命令 | 说明 |
|:---|:---|
| `git init` | 初始化仓库 |
| `git status` | 查看状态 |
| `git add .` | 添加所有文件 |
| `git commit -m "msg"` | 提交更改 |
| `git push` | 推送到远程 |
| `git pull` | 拉取远程更新 |
| `git log` | 查看历史 |
| `git branch` | 查看分支 |
| `git checkout -b name` | 创建分支 |
| `git merge branch` | 合并分支 |
| `git clone URL` | 克隆仓库 |
| `git remote -v` | 查看远程地址 |

---

## 🔗 相关资源

- [Git 官方文档](https://git-scm.com/doc)
- [GitHub 文档](https://docs.github.com/)
- [Git 可视化学习](https://learngitbranching.js.org/)
- [GitHub CLI 文档](https://cli.github.com/manual/)

---

## ✅ 提交检查清单

- [ ] 已初始化 Git 仓库 (`git init`)
- [ ] 已创建 `.gitignore` 文件
- [ ] 已创建 GitHub 远程仓库
- [ ] 已关联远程仓库 (`git remote add`)
- [ ] 已添加文件到暂存区 (`git add`)
- [ ] 已提交更改 (`git commit`)
- [ ] 已推送到远程 (`git push`)
- [ ] 已在 GitHub 上验证文件

---

*本文档为通用指南，请根据实际情况替换占位符变量*
