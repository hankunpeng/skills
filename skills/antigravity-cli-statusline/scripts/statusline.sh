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

# 使用 jq 计算 5H 和 7D 的剩余百分比并取整
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
  refresh_5h_text="${emoji_5h} ${hours_5h}h ${minutes_5h}m | "
else
  refresh_5h_text=""
fi

# 解析 Weekly (7D) 刷新时间
quota_weekly_reset_sec=$(echo "$JSON_INPUT" | jq -r ".quota[\"${quota_prefix}-weekly\"].reset_in_seconds // 0")
if [ "$quota_weekly_reset_sec" -gt 0 ]; then
  weekly_days=$((quota_weekly_reset_sec / 86400))
  weekly_hours=$(((quota_weekly_reset_sec % 86400) / 3600))
  weekly_minutes=$(((quota_weekly_reset_sec % 3600) / 60))
  total_weekly_hours=$((quota_weekly_reset_sec / 3600))
  if [ "$total_weekly_hours" -lt 1 ]; then
    emoji_weekly="⌛"
  else
    emoji_weekly="⏳"
  fi
  if [ "$weekly_days" -gt 0 ]; then
    weekly_time_str="${weekly_days}d ${weekly_hours}h"
  else
    weekly_time_str="${weekly_hours}h ${weekly_minutes}m"
  fi
  refresh_weekly_text="${emoji_weekly} ${weekly_time_str} | "
else
  refresh_weekly_text=""
fi

# 获取家目录（优先使用 $HOME，如果为空或未设置则通过当前用户名和系统类型动态获取/构建）
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
SEP="|"

# --- Line 1: Native Status Line ---
# Left native text: show agent state or shortcut hint
if [ "$agent_state" = "idle" ] || [ -z "$agent_state" ]; then
  left_native="? for shortcuts"
else
  left_native="${agent_state}..."
fi
left_native_len=${#left_native}

# Right native text elements: model and context window
context_used_pct=$(echo "$JSON_INPUT" | jq -r '.context_window.used_percentage // 0 | . * 10 | round / 10')
context_tokens_formatted=$(echo "$JSON_INPUT" | jq -r 'if .context_window then (if (.context_window.total_input_tokens // 0) >= 1000000 then "\((.context_window.total_input_tokens/1000000 | round))M" else "\((.context_window.total_input_tokens/1000 | round))k" end) else "0k" end')
context_limit_formatted=$(echo "$JSON_INPUT" | jq -r 'if .context_window then (if (.context_window.context_window_size // 0) >= 1000000 then "\((.context_window.context_window_size/1000000 | round))M" else "\((.context_window.context_window_size/1000 | round))k" end) else "0k" end')

# 根据上下文窗口使用率动态判定颜色 (<= 10% 微软绿, 11% ~ 20% 微软黄, > 20% 微软红)
context_color_code=$(awk -v pct="${context_used_pct:-0}" 'BEGIN {
  if (pct <= 10) print "green"
  else if (pct <= 20) print "yellow"
  else print "red"
}')
if [ "$context_color_code" = "green" ]; then
  color_context="$COLOR_MS_GREEN"
elif [ "$context_color_code" = "yellow" ]; then
  color_context="$COLOR_MS_YELLOW"
else
  color_context="$COLOR_MS_RED"
fi

right_native="● ${model_name} | 📜 ${context_used_pct}% (${context_tokens_formatted}/${context_limit_formatted})"
right_native_len=${#right_native}

# Calculate padding for Line 1
padding_native_count=$(( terminal_width - left_native_len - right_native_len - 1 ))
if [ "$padding_native_count" -lt 1 ]; then
  padding_native_count=1
fi
padding_native=$(printf '%*s' "$padding_native_count" "")

# Print Line 1: Native Status Line (Left side in dim grey, ● in green, model in default color, context window dynamically colored)
printf "\033[90m%s\033[0m%s\033[32m●\033[0m \033[37m%s\033[0m \033[32m|\033[0m %b📜 %s%% (%s/%s)\033[0m\n" \
  "$left_native" "$padding_native" "$model_name" "$color_context" "$context_used_pct" "$context_tokens_formatted" "$context_limit_formatted"


# --- Line 2: Custom Status Line Additions ---
# Left custom text
left_custom="📂 ${cwd_formatted}"
left_custom_width=$(( ${#cwd_formatted} + 3 ))

# 阈值规则: <= 30% 微软红 (#F25022), 31% ~ 60% 微软黄 (#FFB900), > 60% 微软绿 (#7FBA00)
# 倒计时与对应余量项同色，分隔符默认无颜色

# 根据 5H 余量动态判定颜色
if [ "${quota_5h_pct:-100}" -le 30 ]; then
  color_5h="$COLOR_MS_RED"
elif [ "${quota_5h_pct:-100}" -le 60 ]; then
  color_5h="$COLOR_MS_YELLOW"
else
  color_5h="$COLOR_MS_GREEN"
fi

# 根据 7D 余量动态判定颜色
if [ "${quota_weekly_pct:-100}" -le 30 ]; then
  color_weekly="$COLOR_MS_RED"
elif [ "${quota_weekly_pct:-100}" -le 60 ]; then
  color_weekly="$COLOR_MS_YELLOW"
else
  color_weekly="$COLOR_MS_GREEN"
fi

# Build 5H part (colored and plain)
# 倒计时不设置颜色，余量项动态着色
if [ -n "$refresh_5h_text" ]; then
  part_5h_colored=$(printf "%s %dh %dm %s %b5H: %s%%%b" \
    "$emoji_5h" "$hours_5h" "$minutes_5h" \
    "$SEP" \
    "$color_5h" "$quota_5h_pct" "$COLOR_RESET")
  part_5h_plain="${emoji_5h} ${hours_5h}h ${minutes_5h}m | 5H: ${quota_5h_pct}%"
else
  part_5h_colored=$(printf "%b5H: %s%%%b" "$color_5h" "$quota_5h_pct" "$COLOR_RESET")
  part_5h_plain="5H: ${quota_5h_pct}%"
fi

# Build 7D part (colored and plain)
# 倒计时不设置颜色，余量项动态着色
if [ -n "$refresh_weekly_text" ]; then
  part_weekly_colored=$(printf "%s %s %s %b7D: %s%%%b" \
    "$emoji_weekly" "$weekly_time_str" \
    "$SEP" \
    "$color_weekly" "$quota_weekly_pct" "$COLOR_RESET")
  part_weekly_plain="${emoji_weekly} ${weekly_time_str} | 7D: ${quota_weekly_pct}%"
else
  part_weekly_colored=$(printf "%b7D: %s%%%b" "$color_weekly" "$quota_weekly_pct" "$COLOR_RESET")
  part_weekly_plain="7D: ${quota_weekly_pct}%"
fi

# Combine right custom text
right_custom_colored="${part_5h_colored} ${SEP} ${part_weekly_colored}"
right_custom_plain="${part_5h_plain} | ${part_weekly_plain}"

# Calculate visual width (accounting for emoji display width of 2 columns)
emoji_count=0
if [ -n "$refresh_5h_text" ]; then
  emoji_count=$((emoji_count + 1))
fi
if [ -n "$refresh_weekly_text" ]; then
  emoji_count=$((emoji_count + 1))
fi
right_custom_width=$(( ${#right_custom_plain} + emoji_count ))

min_total_width=$(( left_custom_width + 4 + right_custom_width + 1 ))

if [ "$terminal_width" -ge "$min_total_width" ]; then
  # Width sufficient: Print left and right side on Line 2
  padding_custom_count=$(( terminal_width - left_custom_width - right_custom_width - 1 ))
  padding_custom=$(printf '%*s' "$padding_custom_count" "")
  printf "📂 \033[34m%s\033[0m%s%b\n" "$cwd_formatted" "$padding_custom" "$right_custom_colored"
else
  # Width insufficient: Print CWD on Line 2, and Quotas on Line 3
  printf "📂 \033[34m%s\033[0m\n" "$cwd_formatted"

  padding_count=$(( terminal_width - right_custom_width - 1 ))
  if [ "$padding_count" -lt 0 ]; then
    padding_count=0
  fi
  padding=$(printf '%*s' "$padding_count" "")
  printf "%s%b\n" "$padding" "$right_custom_colored"
fi
