---
name: "frontend-code-review"
description: "Reviews frontend code for best practices, performance issues, accessibility, and code quality. Invoke when user asks for code review, optimization suggestions, or before merging frontend changes."
---

# Frontend Code Reviewer

This skill provides comprehensive code review for frontend projects, focusing on code quality, performance, accessibility, and best practices.

## When to Invoke

- User asks for code review
- User wants optimization suggestions
- Before merging frontend changes
- User mentions code smells or potential issues
- Code needs refactoring guidance

## Review Areas

### 1. Code Quality
- Variable naming conventions
- Function complexity and length
- Code duplication (DRY principle)
- Comment quality and necessity
- Consistent code style

### 2. Performance
- Unnecessary re-renders (React/Vue/Angular)
- Memory leaks
- Inefficient algorithms
- Large bundle size issues
- Image optimization
- Lazy loading opportunities

### 3. Accessibility (a11y)
- Semantic HTML usage
- ARIA labels and roles
- Keyboard navigation
- Color contrast
- Screen reader compatibility

### 4. Security
- XSS vulnerabilities
- CSRF protection
- Input validation
- Secure data handling
- Dependency vulnerabilities

### 5. Best Practices
- Component structure
- State management
- Error handling
- Testing coverage
- Documentation

## Review Process

1. **Analyze the code** - Read and understand the code structure
2. **Identify issues** - Find potential problems in each review area
3. **Prioritize findings** - Mark issues as Critical, Warning, or Suggestion
4. **Provide solutions** - Offer specific code examples for fixes
5. **Suggest improvements** - Recommend refactoring or architectural changes

## Output Format

```
## Code Review Summary

### Critical Issues 🔴
- [Issue description]
  - Location: [file:line]
  - Solution: [specific fix]

### Warnings ⚠️
- [Issue description]
  - Location: [file:line]
  - Recommendation: [improvement suggestion]

### Suggestions 💡
- [Enhancement idea]
  - Benefit: [why this helps]

### Positive Aspects ✅
- [What's done well]
```

## Example Review

When reviewing a React component:

```jsx
// Original code with issues
function UserList({ users }) {
  const [filtered, setFiltered] = useState(users);
  
  useEffect(() => {
    setFiltered(users.filter(u => u.active));
  }, []); // Missing dependency
  
  return (
    <div>
      {filtered.map(user => (
        <div key={user.id}>{user.name}</div>
      ))}
    </div>
  );
}
```

**Review Findings:**
- 🔴 **Critical**: `useEffect` missing `users` dependency - causes stale data
- ⚠️ **Warning**: Missing accessibility attributes on list items
- 💡 **Suggestion**: Consider using `useMemo` instead of `useEffect` for filtering

## Language/Framework Support

- JavaScript/TypeScript
- React/Vue/Angular/Svelte
- HTML/CSS/SCSS
- Modern ES6+ features
- Popular UI libraries (Material-UI, Ant Design, etc.)
