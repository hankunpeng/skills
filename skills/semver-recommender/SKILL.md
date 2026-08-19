---
name: semver-recommender
description: Intelligently analyze code changes, API contract diffs, and commit history to recommend the next Semantic Version (SemVer MAJOR, MINOR, or PATCH) with concrete rationales and breaking change detection. Use this skill whenever the user asks about version bumping, semantic versioning, "what version should this be", "should this be a major/minor/patch release", analyzing breaking changes in a diff/PR, or preparing versions for build/release scripts.
---

# Semantic Version Recommender Skill

This skill analyzes code changes, public API contracts, and commit histories to intelligently determine and recommend the next Semantic Version (**SemVer 2.0.0**) for a project or release artifact.

## When to Use This Skill

- **Determining next version**: User asks what version number to release next based on recent changes or git commits.
- **Breaking change detection**: User wants to know if their recent code diff contains breaking changes (requiring a `MAJOR` bump).
- **Release preparation & script linkage**: When preparing to run build/release scripts (e.g. `node build.js -v <version>` or updating `package.json`).
- **Reviewing PRs / Diff impact**: Assessing whether an incoming PR represents a feature (`MINOR`), bugfix/refactor (`PATCH`), or breaking change (`MAJOR`).

---

## SemVer Decision Matrix

Follow SemVer 2.0.0 (`MAJOR.MINOR.PATCH`):

| Type | When to Bump | Concrete Examples |
|---|---|---|
| **`MAJOR`** (x.0.0) | **Incompatible / Breaking Changes** | • Renaming or deleting exported functions/classes/types.<br>• Changing required function parameters or return types.<br>• Changing default config/behavior that breaks existing consumers.<br>• Dropping support for a runtime/platform version.<br>• Conventional commit with `!` or `BREAKING CHANGE:`. |
| **`MINOR`** (0.x.0) | **Backward-Compatible New Features** | • Adding new public functions, classes, options, or endpoints.<br>• Deprecating existing functionality (without removing it).<br>• Adding optional parameters to existing functions.<br>• Substantial performance improvements introducing new capabilities.<br>• Conventional commit `feat(...)`. |
| **`PATCH`** (0.0.x) | **Backward-Compatible Bug Fixes & Chores** | • Internal bug fixes without API changes.<br>• Internal refactoring, style fixes, performance tuning.<br>• Updating internal build tools, CI scripts, or documentation.<br>• Upgrading internal dependencies (non-breaking).<br>• Conventional commit `fix(...)`, `refactor(...)`, `chore(...)`. |

> **Special Note on Pre-1.0.0 (`0.y.z`)**:
> During initial rapid development (`0.x.y`), `0.x` is often treated with flexible breaking changes. If current version is `< 1.0.0`, breaking changes may bump `MINOR` (`0.1.0` -> `0.2.0`), and new features bump `PATCH` (`0.1.0` -> `0.1.1`), unless the project explicitly enforces 1.0.0+ rules. Note this context in your recommendation.

---

## Workflow Steps

### Step 1: Gather Context & Current Version
1. **Detect Current Version**:
   - Check `package.json` (`version` field).
   - Check HTML title / metadata (e.g. `<title>... v1.0.0</title>`).
   - Check latest Git tag (`git describe --tags --abbrev=0`).
   - Or ask the user if none is found (fallback default `1.0.0`).
2. **Inspect Changes**:
   - Run helper script: `node scripts/semver-analyzer.js --staged` (or `--working`, `--commits <range>`).
   - Inspect `git diff` on modified public interfaces, exports, and function signatures.

### Step 2: Analyze API & Behavioral Impact
Categorize all changes into three buckets:
- **Breaking Changes**: Are any callers broken?
- **Features**: Are there new capabilities available?
- **Fixes & Internal**: Are changes purely internal/corrective?

### Step 3: Compute Next Version & Output Recommendation

Always structure the output using this standard format:

```markdown
### 🏷️ 推荐版本号: `vX.Y.Z` (当前: `vA.B.C` ➔ 升级类型: `MAJOR / MINOR / PATCH`)

#### 📋 变更影响分析与依据 (Rationale)
* 💥 **破坏性变更 (Breaking Changes)**:
  - [无 / 列出被移除、修改签名或改变默认行为的 API]
* ✨ **新增特性 (Features)**:
  - [无 / 列出新增的导出、方法、配置项或向下兼容扩展]
* 🐛 **修复与优化 (Fixes & Chores)**:
  - [列出 bug 修复、内部重构、构建脚本或文档更新]

#### 🚀 建议后续操作 (Next Actions)
- **构建打包 (如适用)**: `node build.js [input.html] -o [output-vX.Y.Z.html] -v X.Y.Z`
- **版本标记 (如适用)**: `git tag -a vX.Y.Z -m "release: vX.Y.Z"`
```

---

## Helper Script Reference

The skill bundles `scripts/semver-analyzer.js` for rapid local inspection:

```bash
# Analyze all uncommitted changes
node scripts/semver-analyzer.js

# Analyze staged changes and extract current version from HTML file
node scripts/semver-analyzer.js --staged --file app.html

# Analyze commit log between tags or range
node scripts/semver-analyzer.js --commits v1.0.0..HEAD --json
```
