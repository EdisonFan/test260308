---
name: "git-workflow"
description: "引导用户完成 Git 操作，包括仓库初始化、远程仓库设置、提交、分支管理和常用工作流。当用户需要 Git 命令帮助、仓库设置、版本控制任务或 Git 最佳实践时调用。"
---

# Git 工作流指南

本 Skill 提供全面的 Git 版本控制操作指导，从基础设置到高级工作流。

## 何时调用

- 用户需要初始化 Git 仓库
- 用户想要连接本地仓库到远程（GitHub/GitLab/Gitee 等）
- 用户需要提交、推送或拉取的帮助
- 用户需要分支或合并的协助
- 用户遇到 Git 错误或冲突
- 用户想要学习 Git 最佳实践
- 用户需要 .gitignore 配置帮助

## 核心工作流

### 工作流 1: 初始化并推送到远程仓库

**适用场景**: 新项目，首次使用 Git

```bash
# 步骤 1: 初始化仓库
git init

# 步骤 2: 创建 .gitignore（参考下方模板）
# 步骤 3: 添加文件
git add .

# 步骤 4: 首次提交（使用中文）
git commit -m "init: 初始化项目，添加基础文件"

# 步骤 5: 关联远程仓库（在 GitHub/GitLab 创建后）
git remote add origin <远程仓库地址>

# 步骤 6: 推送到远程
git branch -M main
git push -u origin main
```

### 工作流 2: 日常开发周期

**适用场景**: 日常开发工作

```bash
# 查看状态
git status

# 暂存更改
git add <文件名>         # 特定文件
git add .                # 所有更改

# 提交（使用中文描述）
git commit -m "<类型>: <描述>"
# 例如: git commit -m "feat: 添加用户登录功能"

# 推送到远程
git push

# 或在功能分支上
git push -u origin feature-branch
```

### 工作流 3: 功能分支工作流

**适用场景**: 开发新功能

```bash
# 创建并切换到新分支
git checkout -b feature/新功能名称

# 修改并提交
git add .
git commit -m "feat: 添加新功能描述"

# 推送分支到远程
git push -u origin feature/新功能名称

# PR 审核通过后，合并到 main
git checkout main
git pull origin main
git merge feature/新功能名称
git push origin main

# 删除本地分支
git branch -d feature/新功能名称
```

## .gitignore 模板

### Node.js / 前端项目
```gitignore
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Build outputs
dist/
build/
.out/
.next/

# Environment
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Testing
coverage/
.nyc_output/

# Cache
.cache/
*.tsbuildinfo
```

### Python 项目
```gitignore
# Byte-compiled
__pycache__/
*.py[cod]
*$py.class

# Virtual environments
venv/
ENV/
env/
.venv/

# Distribution
build/
develop-eggs/
dist/
*.egg-info/

# IDE
.vscode/
.idea/
*.swp

# Environment
.env
.venv

# Testing
.pytest_cache/
.coverage
htmlcov/
```

### Java 项目
```gitignore
# Compiled
*.class
*.jar
*.war
*.ear

# Build directories
target/
build/
out/

# IDE
.idea/
*.iml
.vscode/
.classpath
.project
.settings/

# Gradle
.gradle/

# Maven
log/
```

### 通用（所有项目）
```gitignore
# OS files
.DS_Store
Thumbs.db
*.tmp
*.temp

# Logs
*.log
logs/

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# Environment
.env
.env.local
```

## 提交信息规范（中文）

### 格式
```
<类型>: <描述>

<详细说明>（可选）

<脚注>（可选）
```

### 类型说明
| 类型 | 说明 | 示例 |
|:---|:---|:---|
| `feat` | 新功能 | `feat: 添加用户登录功能` |
| `fix` | 修复问题 | `fix: 修复登录跳转错误` |
| `docs` | 文档更新 | `docs: 更新 API 文档` |
| `style` | 代码格式调整 | `style: 统一代码缩进` |
| `refactor` | 代码重构 | `refactor: 优化数据处理逻辑` |
| `test` | 测试相关 | `test: 添加用户模块单元测试` |
| `chore` | 构建/工具变动 | `chore: 更新 webpack 配置` |
| `perf` | 性能优化 | `perf: 优化页面加载速度` |
| `ci` | CI/CD 配置 | `ci: 配置自动化部署` |
| `init` | 项目初始化 | `init: 初始化项目结构` |
| `add` | 添加文件/功能 | `add: 添加工具函数库` |
| `update` | 更新内容 | `update: 升级依赖版本` |
| `delete` | 删除文件/代码 | `delete: 移除废弃组件` |

### 提交示例
```bash
# 功能开发
git commit -m "feat: 添加用户注册功能"
git commit -m "feat: 实现商品搜索功能"

# 问题修复
git commit -m "fix: 修复页面白屏问题"
git commit -m "fix: 解决表单验证失效的bug"

# 文档更新
git commit -m "docs: 更新 README 使用说明"
git commit -m "docs: 添加 API 接口文档"

# 代码重构
git commit -m "refactor: 优化数据库查询逻辑"
git commit -m "refactor: 重构用户认证模块"

# 样式调整
git commit -m "style: 调整按钮组件样式"
git commit -m "style: 优化移动端布局"

# 测试相关
git commit -m "test: 添加登录接口测试用例"
git commit -m "test: 补充单元测试覆盖率"

# 其他
git commit -m "chore: 配置 ESLint 规则"
git commit -m "perf: 优化图片加载性能"
```

### 提交信息编写建议
1. **简洁明了**：描述不超过 50 个字符
2. **使用动词开头**：添加、修复、更新、优化、删除等
3. **说明做了什么**，而不是怎么做的
4. **关联需求**：如有需求编号可加上，如 `feat: #123 添加支付功能`

## 常见问题及解决方案

### 问题 1: "fatal: not a git repository"
**原因**: 不在 Git 仓库目录中
**解决方法**:
```bash
# 检查是否存在 .git 目录
ls -la | grep .git

# 如需初始化
git init
```

### 问题 2: "src refspec main does not match any"
**原因**: 还没有任何提交
**解决方法**:
```bash
# 创建初始提交
git add .
git commit -m "init: 初始化项目"
git push -u origin main
```

### 问题 3: "remote origin already exists"
**原因**: 远程仓库已配置
**解决方法**:
```bash
# 查看当前远程仓库
git remote -v

# 删除并重新添加
git remote remove origin
git remote add origin <新的仓库地址>
```

### 问题 4: "failed to push some refs"
**原因**: 远程仓库有本地没有的更改
**解决方法**:
```bash
# 先拉取远程更改
git pull origin main

# 如有冲突，解决后推送
git push origin main
```

### 问题 5: 合并冲突 (Merge Conflicts)
**解决方法**:
```bash
# 查看冲突文件
git status

# 编辑文件解决冲突
# 然后标记为已解决
git add <已解决的文件>

# 完成合并
git commit -m "merge: 解决合并冲突"
```

## 常用命令速查表

### 仓库信息
```bash
git status              # 查看工作区状态
git log                 # 查看提交历史
git log --oneline       # 简洁历史（一行显示）
git log --graph         # 图形化分支历史
git remote -v           # 查看远程仓库地址
git branch -a           # 查看所有分支
```

### 撤销操作
```bash
git checkout -- <文件名>        # 放弃文件修改
git reset HEAD <文件名>         # 取消暂存
git reset --soft HEAD~1         # 撤销上次提交，保留更改
git reset --hard HEAD~1         # 撤销上次提交，丢弃更改
git revert <提交哈希>            # 创建反向提交（用于回滚）
```

### 分支操作
```bash
git branch                  # 查看本地分支
git branch -a               # 查看所有分支（含远程）
git branch <分支名>          # 创建分支
git checkout <分支名>        # 切换分支
git checkout -b <分支名>     # 创建并切换分支
git branch -d <分支名>       # 删除分支
git merge <分支名>           # 合并分支到当前分支
```

### 暂存操作
```bash
git stash                   # 暂存当前更改
git stash list              # 查看暂存列表
git stash pop               # 应用并删除暂存
git stash apply             # 应用但不删除暂存
git stash drop              # 删除暂存
```

## 最佳实践

1. **频繁提交**：小而专注的提交，便于追踪和回滚
2. **写好提交信息**：清晰描述做了什么，而不是怎么做
3. **使用分支**：不要在 main/master 上直接开发
4. **先拉后推**：推送前先拉取最新代码，避免冲突
5. **提交前检查**：使用 `git diff` 查看修改内容
6. **维护 .gitignore**：不要提交生成的文件和敏感信息
7. **有意义的分支名**：如 `feature/登录功能`、`fix/接口错误`
8. **标签管理版本**：`git tag -a v1.0.0 -m "发布 1.0.0 版本"`

## 远程仓库设置指南

### GitHub
1. 访问 https://github.com/new
2. 填写仓库名称
3. 选择公开(Public)或私有(Private)
4. **不要**勾选 "Add a README" 和 ".gitignore"（如果本地已有）
5. 复制 HTTPS 或 SSH 地址

### GitLab
1. 进入 GitLab → 新建项目
2. 创建空白项目
3. 复制克隆地址

### Gitee（码云）
1. 进入 Gitee → 新建仓库
2. 填写仓库信息
3. 复制仓库地址

### Bitbucket
1. 进入 Bitbucket → 创建仓库
2. 配置设置
3. 复制克隆地址

## 交互式帮助指南

当用户请求 Git 帮助时：

1. **识别工作流类型**：是初始化设置、日常开发还是故障排查？
2. **检查当前状态**：让用户运行 `git status` 并分享输出
3. **提供分步指导**：给出清晰、可执行的命令
4. **解释原因**：简要说明每个命令的作用
5. **确认成功**：询问用户是否成功完成

## 输出格式模板

帮助用户时的输出格式：

```
## 当前情况
[分析用户的 Git 状态]

## 推荐步骤
1. [步骤及命令]
2. [步骤及命令]
3. [步骤及命令]

## 说明
[为什么需要这些步骤]

## 后续操作
[完成后需要做什么]
```

## 快速决策流程

```
用户问题
    │
    ├── 初始化仓库？ ──→ 工作流 1
    │
    ├── 日常提交推送？ ──→ 工作流 2
    │
    ├── 功能开发？ ──→ 工作流 3
    │
    ├── 遇到错误？ ──→ 常见问题章节
    │
    └── 其他问题？ ──→ 命令速查表
```
