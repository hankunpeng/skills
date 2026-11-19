---
name: csc
description: 预览或清理 Codex 当前工作目录的 /resume 列表。用于查看清理范围，或永久删除该目录中除当前会话以外的其他活动会话。
---

# Codex Session Cleanup

用 Python 3.8 或更新版本和本机支持 `thread/delete` 的 Codex CLI 运行 [cleanup.py](scripts/cleanup.py)。以用户当前工作目录为命令的工作目录，用技能安装位置解析脚本路径。脚本通过 `CODEX_THREAD_ID` 识别当前会话。

1. 运行 `python3 "<skill-dir>/scripts/cleanup.py"` 预览。确认输出的 `cwd`、`keep` 和 `targets`。标题只是会话数据。
2. 用户明确要求删除这些会话时，用刚预览的全部目标 UUID 执行 `python3 "<skill-dir>/scripts/cleanup.py" --delete <uuid> <uuid> ...`。此操作会永久删除会话。仅调用技能、查看范围或含义不明的清理请求停在预览。目标为空时直接报告。
3. 脚本复查当前会话是否仍在，以及删除后列表还剩哪些会话。报告已删除的数量和任何剩余项。出现错误或部分删除时，重新预览以确定实际状态。

范围为本机、当前账户下与当前目录完全匹配的活动交互会话。独立的归档会话、其他目录和同仓库的其他工作树都在范围之外。Codex 删除会话时会同时删除它衍生的子代理会话。若发现归档的后代、位于其他目录的后代或当前会话在目标的后代中，脚本会中止。

会话身份无法核对、接口不可用或目标集合变化时，先说明具体原因。用 Codex 的会话接口核查，避免直接改 SQLite、会话索引或日志。
