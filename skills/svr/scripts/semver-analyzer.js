#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const usage = "Usage: semver-analyzer.js [--staged | --working | --commits A..B] [--file PATH] [--current VERSION] [--json]";

function parseArgs(args) {
  const options = { mode: "all", json: false };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--json") {
      options.json = true;
      continue;
    }
    if (["--staged", "--working", "--commits"].includes(arg)) {
      if (options.mode !== "all") throw new Error("Select just one analysis mode.");
      options.mode = arg.slice(2);
      if (arg !== "--commits") continue;
    } else if (arg !== "--file" && arg !== "--current") {
      throw new Error(`Unknown option ${arg}. ${usage}`);
    }
    const value = args[++i];
    if (!value || value.startsWith("--")) throw new Error(`${arg} requires a value.`);
    options[arg === "--commits" ? "range" : arg.slice(2)] = value;
  }
  return options;
}

function git(...args) {
  return execFileSync("git", args, { encoding: "utf8", input: "", stdio: "pipe", maxBuffer: 16 * 1024 * 1024 });
}

function resolveCommit(ref) {
  return git("rev-parse", "--verify", "--end-of-options", `${ref}^{commit}`).trim();
}

function getHead() {
  try {
    return git("rev-parse", "--verify", "--quiet", "HEAD").trim();
  } catch (error) {
    if (error.status === 1) return null;
    throw error;
  }
}

function getChanges(options) {
  const diffArgs = ["diff", "--no-ext-diff", "--no-textconv", "--no-color", "--no-relative", "-U3"];
  if (options.mode === "commits") {
    const range = /^(.*?)\.\.(\.?)(.*)$/.exec(options.range);
    if (!range) throw new Error("--commits expects A..B or A...B.");
    const leftRef = range[1] || "HEAD";
    const left = resolveCommit(leftRef);
    const target = resolveCommit(range[3] || "HEAD");
    const base = range[2] ? git("merge-base", left, target).trim() : left;
    const log = git("log", "-z", "--no-show-signature", "--format=%h%x00%s%x00%b", `${base}..${target}`, "--");
    const fields = log.split("\0");
    const commits = [];
    for (let i = 0; i < fields.length - 1; i += 3) {
      commits.push({ hash: fields[i], subject: fields[i + 1], body: fields[i + 2] });
    }
    return { base, target, baseRef: base === left ? leftRef : null, diff: git(...diffArgs, base, target, "--"), commits, untrackedFiles: [] };
  }

  const base = getHead();
  const compare = options.mode === "all" ? [base || git("hash-object", "-t", "tree", "--stdin").trim()] : [];
  if (options.mode === "staged") compare.push("--cached");
  const untrackedFiles = options.mode === "staged" ? [] : git("ls-files", "--others", "--exclude-standard", "--full-name", "-z", "--", ":/").split("\0").filter(Boolean);
  return { base, target: null, diff: git(...diffArgs, ...compare, "--"), commits: [], untrackedFiles };
}

function parseVersion(value) {
  if (typeof value !== "string") return null;
  const match = /^v?((0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?)$/.exec(value.trim());
  if (!match || (match[5] && match[5].split(".").some(part => /^0\d+$/.test(part)))) return null;
  return { value: match[1], major: match[2], minor: match[3], patch: match[4], prerelease: match[5] };
}

function getVersion(options, changes) {
  if (options.current) {
    const version = parseVersion(options.current);
    if (!version) throw new Error("--current requires a valid SemVer version.");
    return { version, source: "--current" };
  }
  if (options.file) {
    const content = fs.readFileSync(options.file, "utf8");
    const ext = path.extname(options.file).toLowerCase();
    let value;
    if (ext === ".json") {
      value = JSON.parse(content)?.version;
    } else if ([".html", ".htm"].includes(ext)) {
      const title = content.match(/<title\b[^>]*>([^<]*)<\/title>/i)?.[1].trim();
      const markedVersion = title?.match(/\b(?:v|version\s+)(\d[\w.+-]*)(?=$|[\s)\]])/i)?.[1];
      value = markedVersion || title;
    }
    const version = parseVersion(value);
    if (!version) throw new Error(`No valid SemVer version in ${options.file}. Use --current to supply one.`);
    return { version, source: options.file };
  }

  if (changes.base) {
    const tags = git("tag", "--points-at", changes.base).trim().split("\n");
    const namedTag = changes.baseRef?.replace(/^refs\/tags\//, "");
    const candidates = tags.filter(tag => parseVersion(tag));
    if (candidates.includes(namedTag)) return { version: parseVersion(namedTag), source: `tag ${namedTag}` };

    let manifestVersion = null;
    if (git("ls-tree", "--full-tree", "--name-only", changes.base, "--", "package.json").trim() === "package.json") {
      const manifest = git("show", `${changes.base}:package.json`);
      try {
        manifestVersion = parseVersion(JSON.parse(manifest)?.version);
      } catch (error) {
        if (!(error instanceof SyntaxError)) throw error;
      }
    }
    const versionedTags = new Set(candidates.map(tag => parseVersion(tag).value));
    if (manifestVersion) versionedTags.add(manifestVersion.value);
    if (versionedTags.size > 1) return { version: null, source: "conflicting versions at the baseline revision" };
    if (candidates.length) return { version: parseVersion(candidates[0]), source: `tag ${candidates[0]}` };
    if (manifestVersion) {
      const source = options.mode === "commits" ? "package.json at comparison base" : "package.json at HEAD";
      return { version: manifestVersion, source };
    }
  }
  return { version: null, source: null };
}

function hasBreakingFooter(body) {
  const paragraphs = body.trim().split(/\r?\n[ \t]*\r?\n/);
  const footer = paragraphs[paragraphs.length - 1];
  return /^(?:BREAKING CHANGE|[\w-]+)(?:: | #)/.test(footer) && /^BREAKING(?: |-)CHANGE: \S/m.test(footer);
}

function analyze({ diff, commits, untrackedFiles }) {
  const analysis = { breaking: [], features: [], fixes: [], chores: [], untrackedFiles };
  for (const commit of commits) {
    const header = /^([\w-]+)(?:\([^)]+\))?(!)?: \S/i.exec(commit.subject);
    const type = header?.[1].toLowerCase();
    const hint = { source: `commit ${commit.hash}`, desc: commit.subject };
    if (header?.[2] || hasBreakingFooter(commit.body)) analysis.breaking.push(hint);
    else if (type === "feat") analysis.features.push(hint);
    else if (type === "fix") analysis.fixes.push(hint);
    else if (["chore", "refactor", "perf", "style", "docs", "test", "build", "ci"].includes(type)) analysis.chores.push(hint);
  }
  const exported = "(?:export\\s+(?:const|function|class|type|interface|default)|module\\.exports)\\b";
  analysis.stats = {
    diffLines: diff ? diff.trimEnd().split("\n").length : 0,
    deletedExports: (diff.match(new RegExp(`^-\\s*${exported}`, "gm")) || []).length,
    addedExports: (diff.match(new RegExp(`^\\+\\s*${exported}`, "gm")) || []).length,
    commitCount: commits.length,
  };
  return analysis;
}

function getHint(changes, analysis, version) {
  if (!changes.diff && !changes.untrackedFiles.length) {
    return { status: "no-changes", reason: "The selected scope has no net changes." };
  }
  const type = [["MAJOR", analysis.breaking], ["MINOR", analysis.features], ["PATCH", analysis.fixes]].find(([, hints]) => hints.length)?.[0];
  if (!type) return { status: "needs-review", reason: "Review the net diff and public contract to classify the changes." };
  if (!version) return { status: "needs-review", type, reason: "A comparable release version is required." };
  if (version.major === "0" || version.prerelease) {
    return { status: "needs-review", type, reason: "Use the project's 0.x or prerelease policy to choose a version." };
  }

  const next = {
    MAJOR: `${BigInt(version.major) + 1n}.0.0`,
    MINOR: `${version.major}.${BigInt(version.minor) + 1n}.0`,
    PATCH: `${version.major}.${version.minor}.${BigInt(version.patch) + 1n}`,
  };
  return { status: "preliminary", type, version: next[type], reason: "Commit message hints require verification against the net diff and public contract." };
}

function main(args) {
  if (args.length === 1 && ["--help", "-h"].includes(args[0])) {
    console.log(usage);
    return;
  }
  const options = parseArgs(args);
  git("rev-parse", "--git-dir");
  const changes = getChanges(options);
  const { version, source } = getVersion(options, changes);
  const analysis = analyze(changes);
  const hint = getHint(changes, analysis, version);
  const result = {
    currentVersion: version?.value ?? null,
    versionSource: source,
    scope: {
      mode: options.mode,
      base: options.mode === "working" ? "index" : changes.base,
      target: changes.target ?? (options.mode === "staged" ? "index" : "worktree"),
    },
    status: hint.status,
    reason: hint.reason,
    recommendedType: hint.type ?? null,
    recommendedVersion: hint.version ? `v${hint.version}` : null,
    rawNextVersion: hint.version ?? null,
    analysis,
  };

  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  const stats = analysis.stats;
  console.log(`Current version: ${result.currentVersion ?? "unknown"}${source ? ` (${source})` : ""}`);
  console.log(`Status: ${result.status}. ${result.reason}`);
  if (hint.type) console.log(`Commit message hint: ${hint.type}${result.recommendedVersion ? ` -> ${result.recommendedVersion}` : ""}`);
  console.log(`Evidence: ${stats.commitCount} commits, ${stats.diffLines} diff lines, ${stats.deletedExports} removed export lines, ${stats.addedExports} added export lines.`);
  if (changes.untrackedFiles.length) console.log(`Untracked files to inspect: ${JSON.stringify(changes.untrackedFiles)}`);
}

try {
  main(process.argv.slice(2));
} catch (error) {
  const detail = error.stderr?.trim() || error.message;
  console.error(`semver-analyzer: ${detail}`);
  process.exitCode = 1;
}
