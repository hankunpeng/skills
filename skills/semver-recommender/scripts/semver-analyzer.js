#!/usr/bin/env node

/**
 * semver-analyzer.js
 * 
 * 提取 Git 变更 (Diff) 与 Commit 提交记录，辅助分析破坏性改动、新增特性与修复，
 * 并支持自动读取 package.json / HTML 文件中的当前版本号。
 *
 * 用法:
 *   node semver-analyzer.js [options]
 *
 * 选项:
 *   --staged          分析已暂存 (git diff --staged) 的变更
 *   --working         分析工作区 (git diff) 未暂存的变更
 *   --commits <range> 分析指定 commit 区间的提交信息 (如 HEAD~5..HEAD 或 v1.0.0..HEAD)
 *   --file <path>     从指定文件提取当前版本号 (如 package.json 或 .html)
 *   --current <ver>   显式指定当前基准版本号 (默认: 1.0.0 或从文件解析)
 *   --json            以 JSON 格式输出变更概要
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    mode: "all", // staged, working, commits, all
    commitRange: null,
    targetFile: null,
    currentVersion: null,
    jsonOutput: false,
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--staged") {
      options.mode = "staged";
    } else if (args[i] === "--working") {
      options.mode = "working";
    } else if (args[i] === "--commits") {
      options.mode = "commits";
      options.commitRange = args[++i];
    } else if (args[i] === "--file") {
      options.targetFile = args[++i];
    } else if (args[i] === "--current") {
      options.currentVersion = args[++i];
    } else if (args[i] === "--json") {
      options.jsonOutput = true;
    }
  }

  return options;
}

function detectCurrentVersion(targetFile, fallback) {
  if (fallback) return cleanVersion(fallback);

  // 1. 如果指定了文件
  if (targetFile && fs.existsSync(targetFile)) {
    const ext = path.extname(targetFile);
    const content = fs.readFileSync(targetFile, "utf8");

    if (ext === ".json") {
      try {
        const pkg = JSON.parse(content);
        if (pkg.version) return cleanVersion(pkg.version);
      } catch (e) {}
    }

    if (ext === ".html" || ext === ".htm") {
      const match = content.match(/<title>.*?v?(\d+\.\d+\.\d+).*?<\/title>/i) ||
                    content.match(/v?(\d+\.\d+\.\d+)/i);
      if (match) return cleanVersion(match[1]);
    }
  }

  // 2. 尝试从当前目录 package.json 读取
  if (fs.existsSync("package.json")) {
    try {
      const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
      if (pkg.version) return cleanVersion(pkg.version);
    } catch (e) {}
  }

  // 3. 尝试从最近的 Git Tag 读取
  try {
    const tag = execSync("git describe --tags --abbrev=0 2>/dev/null", { encoding: "utf8" }).trim();
    if (tag) return cleanVersion(tag);
  } catch (e) {}

  return "1.0.0";
}

function cleanVersion(v) {
  const match = v.match(/(\d+\.\d+\.\d+.*)/);
  return match ? match[1] : v.replace(/^v/, "");
}

function getGitDiff(mode) {
  try {
    if (mode === "staged") {
      return execSync("git diff --staged -U3", { encoding: "utf8" });
    }
    if (mode === "working") {
      return execSync("git diff -U3", { encoding: "utf8" });
    }
    // 默认获取所有未提交的改动 (staged + working)
    return execSync("git diff HEAD -U3", { encoding: "utf8" });
  } catch (e) {
    return "";
  }
}

function getGitCommits(range) {
  try {
    const commitRange = range || "HEAD~10..HEAD";
    const log = execSync(`git log ${commitRange} --pretty=format:"%h|%s|%b<END>" 2>/dev/null`, {
      encoding: "utf8",
    });
    return log.split("<END>").map(item => item.trim()).filter(Boolean).map(entry => {
      const [hash, subject, ...bodyParts] = entry.split("|");
      return {
        hash,
        subject: (subject || "").trim(),
        body: (bodyParts.join("|") || "").trim(),
      };
    });
  } catch (e) {
    return [];
  }
}

function quickAnalyze(diffText, commits) {
  const breaking = [];
  const features = [];
  const fixes = [];
  const chores = [];

  // 分析 Commit 语义
  commits.forEach(c => {
    const isBreaking = c.subject.includes("!:") ||
                       c.body.includes("BREAKING CHANGE:") ||
                       c.body.includes("BREAKING-CHANGE:");
    if (isBreaking) {
      breaking.push({ source: `commit ${c.hash}`, desc: c.subject });
    } else if (/^feat(\(.*\))?:/i.test(c.subject)) {
      features.push({ source: `commit ${c.hash}`, desc: c.subject });
    } else if (/^fix(\(.*\))?:/i.test(c.subject)) {
      fixes.push({ source: `commit ${c.hash}`, desc: c.subject });
    } else if (/^(chore|refactor|perf|style|docs|test)(\(.*\))?:/i.test(c.subject)) {
      chores.push({ source: `commit ${c.hash}`, desc: c.subject });
    }
  });

  // 分析 Diff 中的显著线索
  const deletedExports = (diffText.match(/^-\s*(export\s+(const|function|class|type|interface|default)|module\.exports)/gm) || []).length;
  const addedExports = (diffText.match(/^\+\s*(export\s+(const|function|class|type|interface|default)|module\.exports)/gm) || []).length;

  return {
    breaking,
    features,
    fixes,
    chores,
    stats: {
      diffLines: diffText.split("\n").length,
      deletedExports,
      addedExports,
      commitCount: commits.length,
    }
  };
}

function bumpVersion(current, type) {
  const parts = current.split(".").map(n => parseInt(n, 10));
  if (parts.length < 3) return current;

  if (type === "MAJOR") {
    return `${parts[0] + 1}.0.0`;
  } else if (type === "MINOR") {
    return `${parts[0]}.${parts[1] + 1}.0`;
  } else if (type === "PATCH") {
    return `${parts[0]}.${parts[1]}.${parts[2] + 1}`;
  }
  return current;
}

function main() {
  const options = parseArgs();
  const currentVer = detectCurrentVersion(options.targetFile, options.currentVersion);

  let diffText = "";
  let commits = [];

  if (options.mode === "commits") {
    commits = getGitCommits(options.commitRange);
  } else {
    diffText = getGitDiff(options.mode);
    if (options.commitRange) {
      commits = getGitCommits(options.commitRange);
    }
  }

  const analysis = quickAnalyze(diffText, commits);

  // 推荐初始判断 (由 LLM 最终裁决或脚本初筛)
  let recommendedType = "PATCH";
  if (analysis.breaking.length > 0 || analysis.stats.deletedExports > 0) {
    recommendedType = "MAJOR";
  } else if (analysis.features.length > 0 || analysis.stats.addedExports > 0) {
    recommendedType = "MINOR";
  } else if (analysis.fixes.length > 0 || analysis.chores.length > 0 || analysis.stats.diffLines > 1) {
    recommendedType = "PATCH";
  }

  const nextVer = bumpVersion(currentVer, recommendedType);

  const result = {
    currentVersion: currentVer,
    recommendedType,
    recommendedVersion: `v${nextVer}`,
    rawNextVersion: nextVer,
    analysis,
  };

  if (options.jsonOutput) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(`=== SemVer 分析结果 ===`);
    console.log(`当前版本: v${currentVer}`);
    console.log(`建议升级: ${recommendedType} -> v${nextVer}\n`);
    console.log(`[破坏性变更 (Breaking)]: ${analysis.breaking.length} 项 (删除导出: ${analysis.stats.deletedExports})`);
    console.log(`[新增特性 (Features)]: ${analysis.features.length} 项 (新增导出: ${analysis.stats.addedExports})`);
    console.log(`[修复与优化 (Fixes/Chores)]: ${analysis.fixes.length + analysis.chores.length} 项`);
    console.log(`[Diff 代码行数]: ${analysis.stats.diffLines} 行`);
  }
}

main();
