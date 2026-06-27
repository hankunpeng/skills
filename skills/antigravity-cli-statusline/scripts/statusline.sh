#!/bin/bash
# 读取标准输入的 JSON 数据
read -r JSON_INPUT

# 使用 jq 解析当前工作目录、模型名称和终端宽度
cwd_full=$(echo "$JSON_INPUT" | jq -r '.cwd // ""')
model_name=$(echo "$JSON_INPUT" | jq -r '.model.display_name // "Gemini"')
terminal_width=$(echo "$JSON_INPUT" | jq -r '.terminal_width // 80')

# 使用 jq 计算 5H 和 7D 的剩余百分比并取整
gemini_5h_pct=$(echo "$JSON_INPUT" | jq -r '.quota["gemini-5h"].remaining_fraction // 1 | . * 100 | round')
gemini_weekly_pct=$(echo "$JSON_INPUT" | jq -r '.quota["gemini-weekly"].remaining_fraction // 1 | . * 100 | round')

# 解析 5H 刷新时间
gemini_5h_reset_sec=$(echo "$JSON_INPUT" | jq -r '.quota["gemini-5h"].reset_in_seconds // 0')
if [ "$gemini_5h_reset_sec" -gt 0 ]; then
  hours=$((gemini_5h_reset_sec / 3600))
  minutes=$(((gemini_5h_reset_sec % 3600) / 60))
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

# 第二行（右侧部分）的可见文本与总长度
right_text="${refresh_text}5H: ${gemini_5h_pct}% | 7D: ${gemini_weekly_pct}% | ● ${model_name}"
visible_len=${#right_text}

# 计算宽度阈值
# 左侧显示宽度：📂 (占2列) + 空格 (占1列) + 路径长度
left_width=$(( ${#cwd_formatted} + 3 ))

# 右侧显示宽度：有 emoji 时需在字符数基础上加 1
if [ -n "$refresh_text" ]; then
  right_width=$(( visible_len + 1 ))
else
  right_width=$(( visible_len ))
fi

# 单行显示所需的最小宽度（左侧 + 最小间隔 4 个空格 + 右侧 + 1个右侧安全边距）
min_total_width=$(( left_width + 4 + right_width + 1 ))

if [ "$terminal_width" -ge "$min_total_width" ]; then
  # 宽度足够：单行显示
  # 计算中间填充的空格数（保留 1 个空格的右侧安全边距）
  padding_count=$(( terminal_width - left_width - right_width - 1 ))
  padding=$(printf '%*s' "$padding_count" "")

  # 输出单行状态栏
  if [ -n "$refresh_text" ]; then
    printf "📂 \033[34m%s\033[0m%s\033[33m%s ${hours}h ${minutes}m\033[0m | \033[35m5H: %s%%\033[0m | \033[36m7D: %s%%\033[0m | \033[32m● %s\033[0m\n" \
      "$cwd_formatted" "$padding" "$emoji" "$gemini_5h_pct" "$gemini_weekly_pct" "$model_name"
  else
    printf "📂 \033[34m%s\033[0m%s\033[35m5H: %s%%\033[0m | \033[36m7D: %s%%\033[0m | \033[32m● %s\033[0m\n" \
      "$cwd_formatted" "$padding" "$gemini_5h_pct" "$gemini_weekly_pct" "$model_name"
  fi
else
  # 宽度不足：分两行显示
  # 第一行：左对齐显示带有 📂 的蓝色缩写当前目录的路径
  printf "📂 \033[34m%s\033[0m\n" "$cwd_formatted"

  # 计算第二行右对齐所需填充 of 的空格数
  if [ -n "$refresh_text" ]; then
    padding_count=$(( terminal_width - visible_len - 2 ))
  else
    padding_count=$(( terminal_width - visible_len - 1 ))
  fi
  if [ "$padding_count" -lt 0 ]; then
    padding_count=0
  fi
  padding=$(printf '%*s' "$padding_count" "")

  # 输出第二行
  if [ -n "$refresh_text" ]; then
    printf "%s\033[33m%s ${hours}h ${minutes}m\033[0m | \033[35m5H: %s%%\033[0m | \033[36m7D: %s%%\033[0m | \033[32m● %s\033[0m\n" \
      "$padding" "$emoji" "$gemini_5h_pct" "$gemini_weekly_pct" "$model_name"
  else
    printf "%s\033[35m5H: %s%%\033[0m | \033[36m7D: %s%%\033[0m | \033[32m● %s\033[0m\n" \
      "$padding" "$gemini_5h_pct" "$gemini_weekly_pct" "$model_name"
  fi
fi
