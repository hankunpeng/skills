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
  hours=$((quota_5h_reset_sec / 3600))
  minutes=$(((quota_5h_reset_sec % 3600) / 60))
  if [ "$hours" -lt 1 ]; then
    emoji="⌛"
  else
    emoji="⏳"
  fi
  refresh_text="${emoji} ${hours}h ${minutes}m | "
else
  refresh_text=""
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

right_native="● ${model_name} | ${context_used_pct}% (${context_tokens_formatted}/${context_limit_formatted})"
right_native_len=${#right_native}

# Calculate padding for Line 1
padding_native_count=$(( terminal_width - left_native_len - right_native_len - 1 ))
if [ "$padding_native_count" -lt 1 ]; then
  padding_native_count=1
fi
padding_native=$(printf '%*s' "$padding_native_count" "")

# Print Line 1: Native Status Line (Left side in dim grey, ● in green, model and context in default colors)
printf "\033[90m%s\033[0m%s\033[32m●\033[0m \033[37m%s\033[0m \033[32m|\033[0m \033[37m%s%% (%s/%s)\033[0m\n" \
  "$left_native" "$padding_native" "$model_name" "$context_used_pct" "$context_tokens_formatted" "$context_limit_formatted"


# --- Line 2: Custom Status Line Additions ---
# Left custom text
left_custom="📂 ${cwd_formatted}"
left_custom_width=$(( ${#cwd_formatted} + 3 ))

# Right custom text
if [ -n "$refresh_text" ]; then
  right_custom="${refresh_text}5H: ${quota_5h_pct}% | 7D: ${quota_weekly_pct}%"
  right_custom_width=$(( ${#right_custom} + 1 )) # add 1 to compensate for emoji width
else
  right_custom="5H: ${quota_5h_pct}% | 7D: ${quota_weekly_pct}%"
  right_custom_width=${#right_custom}
fi

min_total_width=$(( left_custom_width + 4 + right_custom_width + 1 ))

if [ "$terminal_width" -ge "$min_total_width" ]; then
  # Width sufficient: Print left and right side on Line 2
  padding_custom_count=$(( terminal_width - left_custom_width - right_custom_width - 1 ))
  padding_custom=$(printf '%*s' "$padding_custom_count" "")

  if [ -n "$refresh_text" ]; then
    printf "📂 \033[34m%s\033[0m%s\033[33m%s ${hours}h ${minutes}m\033[0m \033[32m|\033[0m \033[35m5H: %s%%\033[0m \033[32m|\033[0m \033[36m7D: %s%%\033[0m\n" \
      "$cwd_formatted" "$padding_custom" "$emoji" "$quota_5h_pct" "$quota_weekly_pct"
  else
    printf "📂 \033[34m%s\033[0m%s\033[35m5H: %s%%\033[0m \033[32m|\033[0m \033[36m7D: %s%%\033[0m\n" \
      "$cwd_formatted" "$padding_custom" "$quota_5h_pct" "$quota_weekly_pct"
  fi
else
  # Width insufficient: Print CWD on Line 2, and Quotas on Line 3
  printf "📂 \033[34m%s\033[0m\n" "$cwd_formatted"

  if [ -n "$refresh_text" ]; then
    padding_count=$(( terminal_width - ${#right_custom} - 2 ))
  else
    padding_count=$(( terminal_width - ${#right_custom} - 1 ))
  fi
  if [ "$padding_count" -lt 0 ]; then
    padding_count=0
  fi
  padding=$(printf '%*s' "$padding_count" "")

  if [ -n "$refresh_text" ]; then
    printf "%s\033[33m%s ${hours}h ${minutes}m\033[0m \033[32m|\033[0m \033[35m5H: %s%%\033[0m \033[32m|\033[0m \033[36m7D: %s%%\033[0m\n" \
      "$padding" "$emoji" "$quota_5h_pct" "$quota_weekly_pct"
  else
    printf "%s\033[35m5H: %s%%\033[0m \033[32m|\033[0m \033[36m7D: %s%%\033[0m\n" \
      "$padding" "$quota_5h_pct" "$quota_weekly_pct"
  fi
fi
