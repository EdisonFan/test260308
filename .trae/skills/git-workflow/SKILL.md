---
name: "git-workflow"
description: "Guides users through Git operations including repository initialization, remote setup, commits, branching, and common workflows. Invoke when user needs help with Git commands, repository setup, version control tasks, or Git best practices."
---

# Git Workflow Guide

This skill provides comprehensive guidance for Git version control operations, from basic setup to advanced workflows.

## When to Invoke

- User needs to initialize a Git repository
- User wants to connect local repo to remote (GitHub/GitLab/etc.)
- User asks for help with commits, pushes, or pulls
- User needs branching or merging assistance
- User encounters Git errors or conflicts
- User wants to learn Git best practices
- User needs .gitignore configuration help

## Core Workflows

### Workflow 1: Initialize and Push to Remote

**Use Case**: New project, first time using Git

```bash
# Step 1: Initialize repository
git init

# Step 2: Create .gitignore (see templates below)
# Step 3: Add files
git add .

# Step 4: First commit
git commit -m "Initial commit"

# Step 5: Add remote (after creating on GitHub/GitLab)
git remote add origin <REMOTE_URL>

# Step 6: Push to remote
git branch -M main
git push -u origin main
```

### Workflow 2: Daily Development Cycle

**Use Case**: Regular development work

```bash
# Check status
git status

# Stage changes
git add <file>           # Specific file
git add .                # All changes

# Commit with meaningful message
git commit -m "type: description"

# Push to remote
git push

# Or if working on feature branch
git push -u origin feature-branch
```

### Workflow 3: Feature Branch Workflow

**Use Case**: Working on new features

```bash
# Create and switch to new branch
git checkout -b feature/new-feature

# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Push branch to remote
git push -u origin feature/new-feature

# After PR review, merge to main
git checkout main
git pull origin main
git merge feature/new-feature
git push origin main

# Delete local branch
git branch -d feature/new-feature
```

## .gitignore Templates

### Node.js / Frontend Projects
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

### Python Projects
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

### Java Projects
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

### General (All Projects)
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

## Commit Message Convention

### Format
```
type(scope): subject

body (optional)

footer (optional)
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Build process or auxiliary tool changes
- `perf`: Performance improvements
- `ci`: CI/CD changes

### Examples
```bash
git commit -m "feat: add user authentication"
git commit -m "fix: resolve login redirect issue"
git commit -m "docs: update API documentation"
git commit -m "refactor: simplify data processing logic"
git commit -m "test: add unit tests for auth module"
```

## Common Issues and Solutions

### Issue: "fatal: not a git repository"
**Cause**: Not in a Git repository directory
**Solution**:
```bash
# Check if .git exists
ls -la | grep .git

# Initialize if needed
git init
```

### Issue: "src refspec main does not match any"
**Cause**: No commits exist yet
**Solution**:
```bash
# Create initial commit
git add .
git commit -m "Initial commit"
git push -u origin main
```

### Issue: "remote origin already exists"
**Cause**: Remote already configured
**Solution**:
```bash
# View current remote
git remote -v

# Remove and re-add
git remote remove origin
git remote add origin <NEW_URL>
```

### Issue: "failed to push some refs"
**Cause**: Remote has changes not in local
**Solution**:
```bash
# Pull remote changes first
git pull origin main

# Resolve conflicts if any, then push
git push origin main
```

### Issue: Merge Conflicts
**Solution**:
```bash
# View conflicted files
git status

# Edit files to resolve conflicts
# Then mark as resolved
git add <resolved-file>

# Complete merge
git commit -m "merge: resolve conflicts"
```

## Useful Commands Reference

### Repository Info
```bash
git status              # Working directory status
git log                 # Commit history
git log --oneline       # Compact history
git log --graph         # Visual branch history
git remote -v           # Remote repositories
git branch -a           # All branches
```

### Undo Operations
```bash
git checkout -- <file>          # Discard file changes
git reset HEAD <file>           # Unstage file
git reset --soft HEAD~1         # Undo last commit, keep changes
git reset --hard HEAD~1         # Undo last commit, discard changes
git revert <commit-hash>        # Create inverse commit
```

### Branching
```bash
git branch                  # List local branches
git branch -a               # List all branches
git branch <name>           # Create branch
git checkout <name>         # Switch branch
git checkout -b <name>      # Create and switch
git branch -d <name>        # Delete branch
git merge <branch>          # Merge branch into current
```

### Stashing
```bash
git stash                   # Stash changes
git stash list              # List stashes
git stash pop               # Apply and remove stash
git stash apply             # Apply but keep stash
git stash drop              # Remove stash
```

## Best Practices

1. **Commit Often**: Make small, focused commits
2. **Write Good Messages**: Clear, descriptive commit messages
3. **Use Branches**: Don't work directly on main/master
4. **Pull Before Push**: Always pull latest changes first
5. **Review Before Commit**: Check `git diff` before committing
6. **Keep .gitignore Updated**: Don't commit generated files
7. **Use Meaningful Branch Names**: `feature/login`, `fix/api-error`
8. **Tag Releases**: `git tag -a v1.0.0 -m "Version 1.0.0"`

## Remote Repository Setup

### GitHub
1. Go to https://github.com/new
2. Fill repository name
3. Choose Public/Private
4. Don't initialize with README/.gitignore (if local exists)
5. Copy HTTPS or SSH URL

### GitLab
1. Go to GitLab → New Project
2. Create blank project
3. Copy clone URL

### Bitbucket
1. Go to Bitbucket → Create Repository
2. Configure settings
3. Copy clone URL

## Interactive Guide

When user asks for Git help:

1. **Identify the workflow**: Is it initial setup, daily work, or troubleshooting?
2. **Check current state**: Ask user to run `git status` and share output
3. **Provide step-by-step**: Give clear, actionable commands
4. **Explain why**: Briefly explain what each command does
5. **Verify**: Ask user to confirm success

## Output Format

When helping with Git:

```
## Current Situation
[Analyze user's Git state]

## Recommended Steps
1. [Step with command]
2. [Step with command]
3. [Step with command]

## Explanation
[Why these steps are needed]

## Next Steps
[What to do after completion]
```
