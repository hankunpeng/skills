# 我的 AI 技能包 ٩(^ᴗ^)۶

[English](README.md) | 简体中文

用于提升日常工作效率的自定义 AI Agent 技能集合。

## 可用技能

本仓库包含以下技能：

### 1. YouTube 视频总结 (`yt-summarize`)
* **说明**：下载 YouTube 字幕并使用 Gemini 模型总结视频内容，同时自动过滤赞助商推广信息。
* **安装**：
  ```bash
  npx skills add hankunpeng/skills --skill yt-summarize
  ```

### 2. Twitter 自动发帖 (`twitter`)
* **说明**：使用 Chrome 电脑使用模式（Computer Use Mode）向 X (Twitter) 发布内容（支持文本和最多 4 张图片）。
* **安装**：
  ```bash
  npx skills add hankunpeng/skills --skill twitter
  ```

### 3. 约定式提交规范 (`cc`)
* **说明**：在 Git 仓库中强制执行、验证、检查和管理约定式提交（Conventional Commits）。自动生成语义化变更日志并安装 Git Hooks。
* **安装**：
  ```bash
  npx skills add hankunpeng/skills --skill cc
  ```

### 4. Antigravity CLI 状态栏定制 (`antigravity-cli-statusline`)
* **说明**：将 Antigravity CLI 状态栏重构为紧凑的单行布局，在单行内优雅整合快捷键提示、工作目录、当前模型、上下文消耗与 5 小时/7 天 Token 配额（带实时刷新倒计时与自适应宽度保护）。
* **安装**：
  ```bash
  npx skills add hankunpeng/skills --skill antigravity-cli-statusline
  ```

### 5. 中文排版纠错 Linter (`chinese-copywriting-linter`)
* **说明**：根据《中文文案排版指南》，对 Markdown 文档中的中文文案和排版格式进行检查并自动格式化。
* **安装**：
  ```bash
  npx skills add hankunpeng/skills --skill chinese-copywriting-linter
  ```

### 6. LlamaParse 文档解析 (`llama-parse`)
* **说明**：使用 LlamaParse API 将复杂的 PDF、Word 文档 (docx)、PowerPoint 演示文稿 (pptx)、Excel 表格 (xlsx) 和图像解析为干净的 Markdown 或结构化 JSON。可精确保留排版布局并准确提取表格。
* **安装**：
  ```bash
  npx skills add hankunpeng/skills --skill llama-parse
  ```

### 7. 语义化版本智能推导 (`svr`)
* **说明**：智能分析代码改动、API 契约 Diff 和 Commit 提交记录，自动推导并推荐下一个符合语义化版本规范（SemVer MAJOR、MINOR 或 PATCH）的版本号，并给出详细的决策依据与破坏性变更检测。
* **安装**：
  ```bash
  npx skills add hankunpeng/skills --skill svr
  ```

### 8. 深入浅出通俗解释 (`eli5`)
* **说明**：用零基础也能秒懂的地道语言解释复杂主题，输出内置可玩微交互演示与 1 道秒懂自测题的单文件 HTML Artifact。既可附带主题（如 `$eli5 注意力机制`），也可在讨论后单独发送 `$eli5` 解释上文机制；紧跟 ISO 639-1 两字母语言参数（如 `$eli5 -zh KV Cache` 或 `/eli5 -en`，其中 `zh` 默认简体中文、`en` 默认美国英语）可指定输出语言。
* **安装**：
  ```bash
  npx skills add hankunpeng/skills --skill eli5
  ```

### 9. 网页剪藏 (`clip`)
* **说明**：基于 Chrome CDP 与默认开启的多层级去广告引擎（网络层广告域名拦截、DOM/Shadow-DOM 广告与视频列表清洗、伪标题层级归一化），配合 X/Twitter、YouTube 字幕、Hacker News 及通用网页（Defuddle）适配器抓取网页并转换为干净的 Markdown 或结构化 JSON，支持登录/验证码交互等待与本地媒体下载。支持通过 `-g`（GitHub Alerts + 标准相对媒体链接）与 `-o`（Obsidian 单行 Callout + `![[...]]` 本地媒体嵌入）切换输出格式；未传参时检测到目标目录位于 `.obsidian/` 库内则自动切换为 OFM，否则默认输出 GFM。
* **安装**：
  ```bash
  npx skills add hankunpeng/skills --skill clip
  ```

### 10. Playwright 复用系统 Chrome (`playwright-use-chrome`)
* **说明**：配置并强制 Playwright 直接使用系统中已安装的 Google Chrome 浏览器，避免下载体积庞大的自带 Chromium/WebKit/Firefox 二进制文件（节省约 1.5 GB ~ 2 GB 磁盘空间）。提供 TypeScript、JavaScript、Python 及命令行测试的标准配置模板。
* **安装**：
  ```bash
  npx skills add hankunpeng/skills --skill playwright-use-chrome
  ```

### 11. 约定式提交与推送 (`ccp`)
* **说明**：具备上下文与依赖感知的 Commit And Push 快捷工作流。自动将指定文件（或当前会话刚修改的文件）及其内部引用的本地配套资源（如博客文章关联的 `assets/img/posts/<slug>/` 配图目录）一并暂存，严格隔离工作区其他无关改动，按 Conventional Commits 规范校验提交信息后一键完成 `commit` 与 `push`。
* **安装**：
  ```bash
  npx skills add hankunpeng/skills --skill ccp
  ```

### 12. GitHub Flavored Markdown (`gfm`)

输入 `$gfm 写一份关于……的文档`，即可用 GitHub Flavored Markdown 撰写文档。

```bash
npx skills add hankunpeng/skills --skill gfm
```

### 13. Obsidian Flavored Markdown (`ofm`)

用 `$ofm` 指定 Obsidian Flavored Markdown 格式，后面的自然语言决定具体动作。例如，`$ofm 总结上面的讨论` 会在对话中给出总结，`$ofm 把上面的讨论保存为 meeting-notes.md` 会写入文件。

```bash
npx skills add hankunpeng/skills --skill ofm
```

### 14. Codex 会话清理 (`csc`)

输入 `$csc` 可预览当前工作目录 `/resume` 列表中的活动会话。输入 `$csc 删除当前目录中除当前会话外的其他活动会话` 可永久删除这些会话。需要 Python 3.8 或更新版本，以及支持 `thread/delete` 的本地 Codex CLI。

```bash
npx skills add hankunpeng/skills --skill csc
```

### 15. 需求复述对齐 (`yw`)

输入 `$yw` 或 `/yw`，让 Agent 先用自己的话复述要解决的问题、期望目标与关键边界，并停下等待确认后再动手修改。既可以附带新需求（如 `$yw 重构登录态刷新逻辑`），也可以在讨论后单独发送 `$yw` 对齐当前任务；紧跟 ISO 639-1 两字母语言参数（如 `$yw -zh <英文 Issue>` 或 `/yw -en`，其中 `zh` 默认简体中文、`en` 默认美国英语）可指定输出语言。

```bash
npx skills add hankunpeng/skills --skill yw
```


---


## 安装方法

列出本仓库中所有可用的技能：

```bash
npx skills add hankunpeng/skills -l
```

您可以安装本仓库中的所有技能：

```bash
npx skills add hankunpeng/skills
```

或者全局安装所有技能：

```bash
npx skills add hankunpeng/skills -g --all
```


或者通过指定名称安装特定技能：

```bash
npx skills add hankunpeng/skills --skill <skill-name>
```

或者安装多个特定的技能：

```bash
npx skills add hankunpeng/skills --skill <skill-name-1> --skill <skill-name-2>
```


## 开源协议

本项目采用 [MIT 协议](LICENSE) 开源。


## Star 历史

<a href="https://www.star-history.com/?repos=hankunpeng%2Fskills&type=date&legend=top-left">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/chart?repos=hankunpeng/skills&type=date&theme=dark&legend=top-left" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/chart?repos=hankunpeng/skills&type=date&legend=top-left" />
   <img alt="Star History Chart" src="https://api.star-history.com/chart?repos=hankunpeng/skills&type=date&legend=top-left" />
 </picture>
</a>
