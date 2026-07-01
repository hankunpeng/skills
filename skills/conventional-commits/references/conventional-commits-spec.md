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

```text
<type>[optional scope][optional !]: <description>
                                                    ← 空行
[optional body]
                                                    ← 空行
[optional footer(s)]
```

### 规则

1. **type** 是必需的，必须是以下之一：`feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`（详细说明见下表）。
2. **scope** 是可选的，用圆括号括起来，提供上下文信息（如模块名、组件名）。
3. **`!`** 放在 `:` 前面，表示这是一个 breaking change。
4. **description** 是必需的，紧跟在 `: ` 之后，简明描述本次变更。
5. **body** 是可选的，用空行与 description 分隔，提供更详细的上下文。
6. **footer** 是可选的，用空行与 body 分隔，每行一个，格式为 `<token>: <value>` 或 `<token> #<value>`。

---

## 核心与常用类型 (Type)

约定式提交将修改划分为了不同的类型，以便于快速筛选历史以及自动化分析：

| 类型 | 说明 | 示例 | 对应的语义化版本变化 |
| :--- | :--- | :--- | :--- |
| **`feat`** | 引入全新的功能 | `feat(auth): add google login` | **Minor (次版本)** |
| **`fix`** | 修复已有的 Bug | `fix(api): resolve timeout issue` | **Patch (修订号)** |
| **`docs`** | 仅修改文档、说明文件等 | `docs: update conventional commits guide` | 无（通常不升级版本） |
| **`style`** | 不改变代码逻辑 of 格式调整（空白、格式化、分号缺失等） | `style: run prettier formatter` | 无 |
| **`refactor`**| 既不增加新功能也不修复 Bug 的代码重构 | `refactor: optimize database query` | 无 |
| **`perf`** | 提升系统性能、运行速度或资源利用率的修改 | `perf: lazy load image components` | 无 |
| **`test`** | 增加缺失的测试或修正现有的测试 | `test: add unit tests for user service` | 无 |
| **`build`** | 修改构建系统、打包配置或外部依赖（如 Webpack, Maven, npm 等） | `build(deps): bump lodash from 4.0.0 to 4.17.21`| 无 |
| **`ci`** | 修改持续集成/部署的脚本和配置文件（如 GitHub Actions, Travis 等） | `ci: add lint check before push` | 无 |
| **`chore`** | 其他不修改源代码和测试文件的日常琐事（如辅助工具配置等） | `chore: update gitignore` | 无 |
| **`revert`**| 撤销之前的某个 Commit | `revert: feat(auth): add google login` | 无 |

---

## 重大变更 (Breaking Changes)

如果修改会导致向后不兼容（例如删除了已有的 API 或改变了核心逻辑），必须将其标记为 **BREAKING CHANGE**。在约定式提交中，有两种方式来声明重大变更：

### 方式 A：在 Header 的类型或作用域后加感叹号 `!`
这是最直观的方式，适合简短的破坏性修改：
```text
feat(api)!: remove support for older version v1
```

### 方式 B：在 Footer 声明 `BREAKING CHANGE:` 开头的段落
这是最完整的方式，可用于正规详细阐述破坏性变更的内容和迁移指南：
```text
refactor(auth): simplify session token generation

This changes the structure of encryption keys used for sessions.

BREAKING CHANGE: The older session tokens are no longer valid. Users must re-login.
```

> [!NOTE]
> 无论是感叹号 `!` 还是 Footer 里的声明，它们都会强制触发语义化版本中的 **Major (主版本号/大版本)** 升级。

---

## Footer 常见 token

| Token | 用途 | 示例 |
|-------|------|------|
| `BREAKING CHANGE` | 标记破坏性变更 | `BREAKING CHANGE: removed legacy API` |
| `Fixes` | 关联修复的 issue | `Fixes #123` |
| `Refs` | 引用相关 issue/PR | `Refs #456` |
| `Reviewed-by` | 代码审查者 | `Reviewed-by: Alice` |
| `Co-authored-by` | 联合作者 | `Co-authored-by: Bob <bob@example.com>` |

---

## 提交消息示例

### 示例 1：包含 Scope 和感叹号重大变更的提交
```text
feat(api)!: send an email to the customer when a product is shipped
```

### 示例 2：标准 Feat 提交（带 Body 和 Footer）
```text
feat(parser): add support for JSON Lines format

The parser can now parse multi-line JSON structures separated by newlines.
This optimizes parsing speeds for large analytical logs.

Closes #842, #845
```

### 示例 3：纯 Bug 修复提交
```text
fix: resolve database connection leakage on server restart
```

---

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
