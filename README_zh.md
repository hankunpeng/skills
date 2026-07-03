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

### 3. 约定式提交规范 (`conventional-commits`)
* **说明**：在 Git 仓库中强制执行、验证、检查和管理约定式提交（Conventional Commits）。自动生成语义化变更日志并安装 Git Hooks。
* **安装**：
  ```bash
  npx skills add hankunpeng/skills --skill conventional-commits
  ```

### 4. Antigravity CLI 状态栏定制 (`antigravity-cli-statusline`)
* **说明**：定制 Antigravity CLI 的状态栏，显示文件夹图标、家目录缩写的当前工作目录、模型名称，以及 5 小时/7 天的 Token 配额使用情况（带实时刷新倒计时）。
* **安装**：
  ```bash
  npx skills add hankunpeng/skills --skill antigravity-cli-statusline
  ```

### 5. Gemini 网页客户端 (`gemini-cli`)
* **说明**：通过逆向的 Gemini 网页 API 生成图像和文本。适用于 AI Pro 及更高订阅级别的用户。支持文本生成、根据提示词生成图像、参考图像视觉输入以及多轮对话。
* **安装**：
  ```bash
  npx skills add hankunpeng/skills --skill gemini-cli
  ```

### 6. 中文排版纠错 Linter (`chinese-copywriting-linter`)
* **说明**：根据《中文文案排版指南》，对 Markdown 文档中的中文文案和排版格式进行检查并自动格式化。
* **安装**：
  ```bash
  npx skills add hankunpeng/skills --skill chinese-copywriting-linter
  ```

### 7. LlamaParse 文档解析 (`llama-parse`)
* **说明**：使用 LlamaParse API 将复杂的 PDF、Word 文档 (docx)、PowerPoint 演示文稿 (pptx)、Excel 表格 (xlsx) 和图像解析为干净的 Markdown 或结构化 JSON。可精确保留排版布局并准确提取表格。
* **安装**：
  ```bash
  npx skills add hankunpeng/skills --skill llama-parse
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
