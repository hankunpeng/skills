#!/bin/bash
# 读取标准输入的 JSON 数据
read -r JSON_INPUT

# 使用 jq 解析当前工作目录、模型名称、终端宽度、agent_state 等
cwd_full=$(echo "$JSON_INPUT" | jq -r '.cwd // ""')
model_name=$(echo "$JSON_INPUT" | jq -r '.model.display_name // "Gemini"')
terminal_width=$(echo "$JSON_INPUT" | jq -r '.terminal_width // 80')
agent_state=$(echo "$JSON_INPUT" | jq -r '.agent_state // "idle"')

# Determine the quota prefix based on the model name
if [[ "$model_name" =~ [Gg]emini ]]; then
  quota_prefix="gemini"
else
  quota_prefix="3p"
fi

# 计算 5H 和 7D 的剩余百分比并取整
quota_5h_pct=$(echo "$JSON_INPUT" | jq -r ".quota[\"${quota_prefix}-5h\"].remaining_fraction // 1 | . * 100 | round")
quota_weekly_pct=$(echo "$JSON_INPUT" | jq -r ".quota[\"${quota_prefix}-weekly\"].remaining_fraction // 1 | . * 100 | round")

# 解析 5H 刷新时间
quota_5h_reset_sec=$(echo "$JSON_INPUT" | jq -r ".quota[\"${quota_prefix}-5h\"].reset_in_seconds // 0")
if [ "$quota_5h_reset_sec" -gt 0 ]; then
  hours_5h=$((quota_5h_reset_sec / 3600))
  minutes_5h=$(((quota_5h_reset_sec % 3600) / 60))
  if [ "$hours_5h" -lt 1 ]; then
    emoji_5h="⌛"
  else
    emoji_5h="⏳"
  fi
  has_5h_timer=1
  time_5h_str="${hours_5h}h ${minutes_5h}m"
else
  has_5h_timer=0
  time_5h_str=""
fi

# 解析 Weekly (7D) 刷新时间
quota_weekly_reset_sec=$(echo "$JSON_INPUT" | jq -r ".quota[\"${quota_prefix}-weekly\"].reset_in_seconds // 0")
if [ "$quota_weekly_reset_sec" -gt 0 ]; then
  weekly_days=$((quota_weekly_reset_sec / 86400))
  weekly_hours=$(((quota_weekly_reset_sec % 86400) / 3600))
  weekly_minutes=$(((quota_weekly_reset_sec % 3600) / 60))
  if [ "$weekly_days" -gt 0 ]; then
    weekly_time_str="${weekly_days}d ${weekly_hours}h"
  else
    weekly_time_str="${weekly_hours}h ${weekly_minutes}m"
  fi
  if [ $((quota_weekly_reset_sec / 3600)) -lt 1 ]; then
    emoji_weekly="⌛"
  else
    emoji_weekly="⏳"
  fi
  has_weekly_timer=1
else
  has_weekly_timer=0
  weekly_time_str=""
fi

# 获取家目录（格式化 ~）
home_dir="$HOME"
if [ -z "$home_dir" ]; then
  username="${USER:-$(whoami)}"
  home_dir=$(eval echo "~$username")
  if [ -z "$home_dir" ] || [ "$home_dir" = "~$username" ]; then
    if [ "$(uname)" = "Darwin" ]; then
      home_dir="/Users/$username"
    else
      home_dir="/home/$username"
    fi
  fi
fi
cwd_formatted=$(echo "$cwd_full" | sed "s|^$home_dir|~|")

# Color definitions (24-bit TrueColor)
COLOR_RESET="\033[0m"
COLOR_MS_RED="\033[38;2;242;80;34m"    # #F25022
COLOR_MS_YELLOW="\033[38;2;255;185;0m" # #FFB900
COLOR_MS_GREEN="\033[38;2;127;186;0m"  # #7FBA00
SEP_COLOR="\033[32m|\033[0m"

# Context window tokens
context_used_pct=$(echo "$JSON_INPUT" | jq -r '.context_window.used_percentage // 0 | . * 10 | round / 10')
context_tokens_formatted=$(echo "$JSON_INPUT" | jq -r 'if .context_window then (if (.context_window.total_input_tokens // 0) >= 1000000 then "\((.context_window.total_input_tokens/1000000 | round))M" else "\((.context_window.total_input_tokens/1000 | round))k" end) else "0k" end')
context_limit_formatted=$(echo "$JSON_INPUT" | jq -r 'if .context_window then (if (.context_window.context_window_size // 0) >= 1000000 then "\((.context_window.context_window_size/1000000 | round))M" else "\((.context_window.context_window_size/1000 | round))k" end) else "0k" end')

# 上下文窗口颜色
if awk -v pct="${context_used_pct:-0}" 'BEGIN { exit !(pct <= 10) }'; then
  color_context="$COLOR_MS_GREEN"
elif awk -v pct="${context_used_pct:-0}" 'BEGIN { exit !(pct <= 20) }'; then
  color_context="$COLOR_MS_YELLOW"
else
  color_context="$COLOR_MS_RED"
fi

# 5H 余量颜色
if [ "${quota_5h_pct:-100}" -le 30 ]; then
  color_5h="$COLOR_MS_RED"
elif [ "${quota_5h_pct:-100}" -le 60 ]; then
  color_5h="$COLOR_MS_YELLOW"
else
  color_5h="$COLOR_MS_GREEN"
fi

# 7D 余量颜色
if [ "${quota_weekly_pct:-100}" -le 30 ]; then
  color_weekly="$COLOR_MS_RED"
elif [ "${quota_weekly_pct:-100}" -le 60 ]; then
  color_weekly="$COLOR_MS_YELLOW"
else
  color_weekly="$COLOR_MS_GREEN"
fi

# 左侧原生状态文本
if [ "$agent_state" = "idle" ] || [ -z "$agent_state" ]; then
  left_text="? for shortcuts"
else
  left_text="${agent_state}..."
fi

# 计算显示宽度（中文字符/宽 emoji 按 2 列宽计算）
calc_width() {
  local str="$1"
  local len=${#str}
  local emoji_extra=$(echo "$str" | grep -o -E '[📂📜⏳⌛]' | wc -l | tr -d ' ')
  echo $(( len + emoji_extra ))
}

# 响应式宽度自适应（单行保障，按优先级逐级精简）
show_weekly_timer=$has_weekly_timer
show_5h_timer=$has_5h_timer
show_tokens_detail=1
active_model="$model_name"
active_cwd="$cwd_formatted"

build_right() {
  local p_cwd="📂 ${active_cwd}"
  local p_model="● ${active_model}"
  local p_ctx
  if [ "$show_tokens_detail" -eq 1 ]; then
    p_ctx="📜 ${context_used_pct}% (${context_tokens_formatted}/${context_limit_formatted})"
  else
    p_ctx="📜 ${context_used_pct}%"
  fi
  local p_5h
  if [ "$show_5h_timer" -eq 1 ]; then
    p_5h="${emoji_5h} ${time_5h_str} | 5H: ${quota_5h_pct}%"
  else
    p_5h="5H: ${quota_5h_pct}%"
  fi
  local p_weekly
  if [ "$show_weekly_timer" -eq 1 ]; then
    p_weekly="${emoji_weekly} ${weekly_time_str} | 7D: ${quota_weekly_pct}%"
  else
    p_weekly="7D: ${quota_weekly_pct}%"
  fi

  echo "${p_cwd} | ${p_model} | ${p_ctx} | ${p_5h} | ${p_weekly}"
}

plain_right=$(build_right)
right_w=$(calc_width "$plain_right")
left_w=${#left_text}
needed=$(( left_w + 2 + right_w ))

# 降级策略 1：如果空间不足，移除 7D 刷新倒计时
if [ "$needed" -gt "$terminal_width" ] && [ "$show_weekly_timer" -eq 1 ]; then
  show_weekly_timer=0
  plain_right=$(build_right)
  right_w=$(calc_width "$plain_right")
  needed=$(( left_w + 2 + right_w ))
fi

# 降级策略 2：如果空间仍不足，移除 5H 刷新倒计时
if [ "$needed" -gt "$terminal_width" ] && [ "$show_5h_timer" -eq 1 ]; then
  show_5h_timer=0
  plain_right=$(build_right)
  right_w=$(calc_width "$plain_right")
  needed=$(( left_w + 2 + right_w ))
fi

# 降级策略 3：如果空间仍不足，隐藏 token 具体数量 (15k/1M)，仅保留百分比
if [ "$needed" -gt "$terminal_width" ] && [ "$show_tokens_detail" -eq 1 ]; then
  show_tokens_detail=0
  plain_right=$(build_right)
  right_w=$(calc_width "$plain_right")
  needed=$(( left_w + 2 + right_w ))
fi

# 降级策略 4：如果路径过长，精简路径为 .../<dirname>
if [ "$needed" -gt "$terminal_width" ] && [ ${#active_cwd} -gt 15 ]; then
  active_cwd=".../$(basename "$cwd_full")"
  plain_right=$(build_right)
  right_w=$(calc_width "$plain_right")
  needed=$(( left_w + 2 + right_w ))
fi

# 降级策略 5：精简模型后缀（去除 (High)/(Medium)/(Low)）
if [ "$needed" -gt "$terminal_width" ]; then
  active_model=$(echo "$active_model" | sed -E 's/ \(High\)|\(Medium\)|\(Low\)//')
  plain_right=$(build_right)
  right_w=$(calc_width "$plain_right")
  needed=$(( left_w + 2 + right_w ))
fi

# 降级策略 6：左侧提示缩短为 ?
if [ "$needed" -gt "$terminal_width" ] && [ "$left_text" = "? for shortcuts" ]; then
  left_text="?"
  left_w=1
  needed=$(( left_w + 2 + right_w ))
fi

# 计算左侧与右侧之间的空格填充量
padding_count=$(( terminal_width - left_w - right_w ))
if [ "$padding_count" -lt 1 ]; then
  padding_count=1
fi
padding=$(printf '%*s' "$padding_count" "")

# 构建带颜色的右侧渲染内容
colored_cwd="📂 \033[34m${active_cwd}\033[0m"
colored_model="\033[32m●\033[0m \033[37m${active_model}\033[0m"

if [ "$show_tokens_detail" -eq 1 ]; then
  colored_ctx="${color_context}📜 ${context_used_pct}% (${context_tokens_formatted}/${context_limit_formatted})\033[0m"
else
  colored_ctx="${color_context}📜 ${context_used_pct}%\033[0m"
fi

if [ "$show_5h_timer" -eq 1 ]; then
  colored_5h="${emoji_5h} ${time_5h_str} ${SEP_COLOR} ${color_5h}5H: ${quota_5h_pct}%\033[0m"
else
  colored_5h="${color_5h}5H: ${quota_5h_pct}%\033[0m"
fi

if [ "$show_weekly_timer" -eq 1 ]; then
  colored_weekly="${emoji_weekly} ${weekly_time_str} ${SEP_COLOR} ${color_weekly}7D: ${quota_weekly_pct}%\033[0m"
else
  colored_weekly="${color_weekly}7D: ${quota_weekly_pct}%\033[0m"
fi

right_colored="${colored_cwd} ${SEP_COLOR} ${colored_model} ${SEP_COLOR} ${colored_ctx} ${SEP_COLOR} ${colored_5h} ${SEP_COLOR} ${colored_weekly}"

# 输出唯一的单行状态栏
printf "\033[90m%s\033[0m%s%b\n" "$left_text" "$padding" "$right_colored"
