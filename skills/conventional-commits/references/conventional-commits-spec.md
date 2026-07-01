# Conventional Commits 1.0.0 规范摘要

> 完整规范: https://www.conventionalcommits.org/en/v1.0.0/

## 概述

Conventional Commits 是一种轻量级的提交消息约定，为提交历史提供一套明确的规则，使其更易于编写自动化工具。它与 [SemVer](https://semver.org/) 语义化版本紧密配合：

| 提交类型 | SemVer 影响 |
|---------|------------|
| `fix` | PATCH 版本递增 |
| `feat` | MINOR 版本递增 |
| 任何类型 + `!` 或 `BREAKING CHANGE` footer | MAJOR 版本递增 |

## 消息结构

```
<type>[optional scope][optional !]: <description>
                                                    ← 空行
[optional body]
                                                    ← 空行
[optional footer(s)]
```

### 规则

1. **type** 是必需的，必须是以下之一：`feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`。
2. **scope** 是可选的，用圆括号括起来，提供上下文信息（如模块名、组件名）。
3. **`!`** 放在 `:` 前面，表示这是一个 breaking change。
4. **description** 是必需的，紧跟在 `: ` 之后，简明描述本次变更。
5. **body** 是可选的，用空行与 description 分隔，提供更详细的上下文。
6. **footer** 是可选的，用空行与 body 分隔，每行一个，格式为 `<token>: <value>` 或 `<token> #<value>`。

### Footer 常见 token

| Token | 用途 | 示例 |
|-------|------|------|
| `BREAKING CHANGE` | 标记破坏性变更 | `BREAKING CHANGE: removed legacy API` |
| `Fixes` | 关联修复的 issue | `Fixes #123` |
| `Refs` | 引用相关 issue/PR | `Refs #456` |
| `Reviewed-by` | 代码审查者 | `Reviewed-by: Alice` |
| `Co-authored-by` | 联合作者 | `Co-authored-by: Bob <bob@example.com>` |

## 与 SemVer 的关系

当使用 Conventional Commits 时，版本号变更遵循以下规则：

- **PATCH** (`1.0.0` → `1.0.1`)：包含 `fix` 类型的提交
- **MINOR** (`1.0.0` → `1.1.0`)：包含 `feat` 类型的提交
- **MAJOR** (`1.0.0` → `2.0.0`)：包含 `BREAKING CHANGE` footer 或类型/scope 后带 `!` 的提交

其他类型（`docs`, `style`, `refactor` 等）不直接触发版本号变更，但会记录在 changelog 中。

## FAQ

**Q: 在开发阶段（0.y.z）如何处理？**
A: 和正式版本一样使用 Conventional Commits。SemVer 在 0.y.z 阶段允许随时引入破坏性变更。

**Q: commit 类型应该大写还是小写？**
A: 任何大小写均可，但推荐一致使用小写。

**Q: 如果一次提交涉及多个类型怎么办？**
A: 尽量将提交拆分为多个。如果无法拆分，选择最重要的类型。
