# Conventional Commits 示例

## ✅ 正确格式

### 简单 feature
```
feat: add dark mode toggle
```

### 带 scope 的 fix
```
fix(parser): handle empty input without crash
```

### 带 body 的 feature
```
feat(auth): add OAuth2 support

Implements the full OAuth2 authorization code flow with PKCE.
Supports Google, GitHub, and Microsoft identity providers.
```

### Breaking change（使用 `!` 标记）
```
refactor(api)!: rename user endpoints to follow REST conventions

All /v1/user/* endpoints have been moved to /v2/users/*.
```

### Breaking change（使用 footer 标记）
```
feat(config): migrate to YAML configuration format

The old JSON configuration format is no longer supported.
Run `migrate-config --to-yaml` to convert existing configs.

BREAKING CHANGE: JSON configuration files are no longer read
Refs #567
```

### 带多个 footer
```
fix(db): resolve connection pool exhaustion under load

Increased default pool size and added connection timeout handling.

Fixes #1234
Reviewed-by: Alice <alice@example.com>
Co-authored-by: Bob <bob@example.com>
```

### 各类型示例一览
```
docs: update API reference for v3 endpoints
style: fix indentation in auth module
refactor: extract validation logic into shared util
perf: cache database queries for user profiles
test: add integration tests for payment flow
build: upgrade webpack to v5
ci: add Node 20 to test matrix
chore: remove deprecated helper functions
revert: revert "feat(ui): add animated transitions"
```

---

## ❌ 错误格式

### 缺少类型
```
added new login page
```
> 应改为: `feat: add new login page`

### 类型后缺少冒号
```
feat add dark mode
```
> 应改为: `feat: add dark mode`

### 冒号后缺少空格
```
fix:resolve crash on startup
```
> 应改为: `fix: resolve crash on startup`

### description 为空
```
feat(auth):
```
> 冒号后必须有描述文字

### 未知类型
```
feature(auth): add login
```
> `feature` 不是合法类型，应使用 `feat`

### description 首字母大写（不推荐）
```
fix: Resolve null pointer exception
```
> 推荐小写开头: `fix: resolve null pointer exception`
