#!/usr/bin/python3

import sys
import subprocess
import tempfile
from pathlib import Path
import shlex

import httpx

from api_client import print_streaming_response, App, set_process_name

DEFAULT_MODEL = 'gemini-3.5-flash'
# DEFAULT_MODEL = 'gemini-3.1-flash-lite'
# DEFAULT_MODEL = 'gemma-4-26b-a4b-it-bf16'
# DEFAULT_MODEL = 'gemma-4-31b-it-bf16'
PROMPT = '根据以下字幕文本总结视频内容。总结结果中请不要包含任何赞助商推广信息。'

import re
import hashlib

def get_video_id(url: str) -> str:
  # Try regex first
  patterns = [
      r'(?:v=|\/v\/|embed\/|shorts\/|youtu\.be\/|watch\?v=|&v=)([^#\&\?]{11})',
  ]
  for pattern in patterns:
      match = re.search(pattern, url)
      if match:
          return match.group(1)
  
  # Fallback to yt-dlp --get-id
  try:
      res = subprocess.run(['yt-dlp', '--get-id', url], capture_output=True, text=True, check=True)
      video_id = res.stdout.strip()
      if video_id:
          return video_id
  except Exception:
      pass
      
  # Fallback to hashing URL if we absolutely can't get it
  return hashlib.md5(url.encode()).hexdigest()[:11]

def main(args) -> None:
  if args.ytdlp_arg:
    extra_args = shlex.split(args.ytdlp_arg)
  else:
    extra_args = []

  app = App(args.api, args.model or DEFAULT_MODEL)

  video_id = get_video_id(args.url)
  target_dir = Path(f"yt_{video_id}")
  target_dir.mkdir(parents=True, exist_ok=True)

  subprocess.run([
    'yt-dlp', '--sub-langs', args.lang, '--write-subs', '--write-auto-subs', '--skip-download',
    *extra_args,
    args.url,
  ],
    cwd=target_dir,
    check=True,
  )

  sub_files = [f for f in target_dir.iterdir() if f.is_file() and not f.name.startswith('.') and f.name != 'summary.md']
  if not sub_files:
    sys.exit('No subtitles found.')
  # Filter for common subtitle formats (e.g. .vtt, .srt, .ass)
  sub_files = [f for f in sub_files if f.suffix in ('.vtt', '.srt', '.ass', '.sbv')]
  if not sub_files:
    sys.exit('No valid subtitle files (.vtt, .srt, .ass, .sbv) found.')
    
  file = sub_files[0]

  for _ in range(2):
    try:
      do_request(app, file, target_dir, args.interact)
      break
    except httpx.ReadError as e:
      print(e, file=sys.stderr)

def do_request(app, filepath: Path, target_dir: Path, interact: bool) -> None:
  filename = filepath.name
  with filepath.open(encoding='utf-8') as f:
    subtitles = f.read()

  parts = [{
    'role': 'user',
    'content': PROMPT,
  }, {
    'role': 'user',
    'content': f'文件名：{filename}\n文件内容：\n{subtitles}',
  }]

  with app.stream(parts) as r:
    res = print_streaming_response(r)

  summary_text = ''.join(res)
  
  # Save summary to target folder
  summary_file = target_dir / "summary.md"
  with summary_file.open('w', encoding='utf-8') as sf:
    sf.write(summary_text)
  print(f"\n✔ Summary saved to {summary_file}")

  if interact:
    parts.append({
      'role': 'assistant',
      'content': summary_text,
    })
    app.interact(parts)

if __name__ == '__main__':
  set_process_name('yt-summarize')

  import argparse

  parser = argparse.ArgumentParser()
  parser.add_argument('url',
                      help='YouTube URL')
  parser.add_argument('--lang', default='en',
                      help='choose subtitles language')
  parser.add_argument('--ytdlp-arg',
                      help='extra args to pass to yt-dlp')
  parser.add_argument('--interact', '-i', action='store_true',
                      help='Enter interactive chat mode after summarizing')
  App.add_common_argument(parser, default_api='gemini')
  args = parser.parse_args()

  main(args)
