#!/usr/bin/env python3
import sys
import re
import argparse
from pathlib import Path

# Common term casing mappings
TECH_TERMS = {
    r'\bgithub\b': 'GitHub',
    r'\btypescript\b': 'TypeScript',
    r'\bjavascript\b': 'JavaScript',
    r'\breact\b': 'React',
    r'\bnextjs\b': 'Next.js',
    r'\bnext\.js\b': 'Next.js',
    r'\bhtml5\b': 'HTML5',
    r'\bcss3\b': 'CSS3',
    r'\bvscode\b': 'VS Code',
    r'\bvs\s+code\b': 'VS Code',
    r'\bnodejs\b': 'Node.js',
    r'\bnode\.js\b': 'Node.js',
    r'\biphone\b': 'iPhone',
    r'\bmacbook\b': 'MacBook',
    r'\bipad\b': 'iPad',
    r'\bleancloud\b': 'LeanCloud',
}

# Fullwidth numbers mapping
FULLWIDTH_NUMS = {
    '０': '0', '１': '1', '２': '2', '３': '3', '４': '4',
    '５': '5', '６': '6', '７': '7', '８': '8', '９': '9'
}

# Halfwidth punctuation mapping (when in CJK context)
HALFWIDTH_PUNC = {
    '!': '！',
    ',': '，',
    ';': '；',
    ':': '：',
    '?': '？',
    '(': '（',
    ')': '）'
}

def mask_line(line):
    # Mask URLs: replace http://... or https://... with spaces of same length
    url_pattern = re.compile(r'https?://[^\s)\]]+')
    masked = line
    for m in url_pattern.finditer(line):
        start, end = m.span()
        masked = masked[:start] + ' ' * (end - start) + masked[end:]
        
    # Mask inline code content but preserve backticks: `code` -> `    `
    inline_code_pattern = re.compile(r'`([^`]+)`')
    for m in inline_code_pattern.finditer(line):
        # We preserve the backticks at start and end, but mask the content
        start, end = m.span(1)
        masked = masked[:start] + ' ' * (end - start) + masked[end:]
        
    return masked

def lint_file(file_path, fix=False):
    try:
        content = Path(file_path).read_text(encoding='utf-8')
    except Exception as e:
        print(f"Error reading file {file_path}: {e}", file=sys.stderr)
        return []

    lines = content.splitlines()
    errors = []
    fixed_lines = list(lines)
    is_modified = False
    in_code_block = False

    # Regex definitions
    cjk_char = r'[\u4e00-\u9fff]'
    latin_or_num = r'[a-zA-Z0-9]'

    # 1. CJK and Latin spacing (CJK followed by Latin/Backtick, or Latin/Backtick followed by CJK)
    pattern_cjk_latin = re.compile(rf'({cjk_char})({latin_or_num}|`)')
    pattern_latin_cjk = re.compile(rf'({latin_or_num}|`)({cjk_char})')

    # 2. Number and physical unit spacing (e.g., 10Gbps -> 10 Gbps)
    pattern_num_unit = re.compile(r'(\d+)(Gbps|Mbps|TB|GB|MB|KB|B|GHz|MHz|Hz|px|em|rem|vh|vw|s|ms|mm|cm|m|km|μm|um|nm|μs|us|ns|kg|g|mg|μg|ug|L|mL|μL|uL|oz|lb)\b', re.IGNORECASE)

    # 3. Number and degree/percentage (no space) (e.g., 15 % -> 15%)
    pattern_no_space_unit = re.compile(r'(\d+)\s+([%°])')

    # 4. Spaces before/after fullwidth punctuation
    pattern_space_before_punc = re.compile(rf'({cjk_char}|{latin_or_num})\s+([，。！？：；（）])')
    pattern_space_after_punc = re.compile(rf'([，。！？：；（）])\s+({cjk_char}|{latin_or_num})')

    # 5. Duplicate punctuation
    pattern_dup_punc = re.compile(r'([！\uff01？\uff1f])\1+')

    # 6. Range connector spacing (e.g. 50Hz~8000Hz -> 50Hz ~ 8000Hz)
    pattern_range = re.compile(r'([a-zA-Z0-9%°\u4e00-\u9fff]+)\s*(?<!~)~(?!~)\s*([a-zA-Z0-9%°\u4e00-\u9fff]+)')

    # 7. Chinese quote style (e.g. “...” -> 「...」)
    pattern_quotes = re.compile(r'“([^”]+)”')

    # 8. Chinese single quote style (e.g. ‘...’ -> 『...』)
    pattern_single_quotes = re.compile(r'‘([^’]+)’')

    # Process line by line
    for line_idx, line in enumerate(lines):
        line_num = line_idx + 1
        
        # Track code blocks
        if line.strip().startswith('```'):
            in_code_block = not in_code_block
            continue
            
        if in_code_block:
            continue

        current_line = line
        line_modified = False

        # Create masked line to avoid matching inside URLs and inline code content
        masked_line = mask_line(current_line)

        # --- A. Spacing between CJK and Latin/Numbers/Backticks ---
        # CJK + Latin/Backtick
        matches = list(pattern_cjk_latin.finditer(masked_line))
        for m in reversed(matches):
            cjk, latin = m.group(1), m.group(2)
            col_num = m.start() + 1
            errors.append({
                'line': line_num, 'col': col_num,
                'msg': f"Missing space between CJK '{cjk}' and Latin/Backtick '{latin}'",
                'suggest': f"{cjk} {latin}"
            })
            if fix:
                current_line = current_line[:m.start()] + f"{cjk} {latin}" + current_line[m.end():]
                masked_line = masked_line[:m.start()] + f"{cjk} {latin}" + masked_line[m.end():]
                line_modified = True

        # Latin/Backtick + CJK
        matches = list(pattern_latin_cjk.finditer(masked_line))
        for m in reversed(matches):
            latin, cjk = m.group(1), m.group(2)
            col_num = m.start() + 1
            errors.append({
                'line': line_num, 'col': col_num,
                'msg': f"Missing space between Latin/Backtick '{latin}' and CJK '{cjk}'",
                'suggest': f"{latin} {cjk}"
            })
            if fix:
                current_line = current_line[:m.start()] + f"{latin} {cjk}" + current_line[m.end():]
                masked_line = masked_line[:m.start()] + f"{latin} {cjk}" + masked_line[m.end():]
                line_modified = True

        # --- B. Spacing between Numbers and Units ---
        matches = list(pattern_num_unit.finditer(masked_line))
        for m in reversed(matches):
            num, unit = m.group(1), m.group(2)
            col_num = m.start() + 1
            errors.append({
                'line': line_num, 'col': col_num,
                'msg': f"Missing space between number '{num}' and unit '{unit}'",
                'suggest': f"{num} {unit}"
            })
            if fix:
                current_line = current_line[:m.start()] + f"{num} {unit}" + current_line[m.end():]
                masked_line = masked_line[:m.start()] + f"{num} {unit}" + masked_line[m.end():]
                line_modified = True

        # --- C. Degree & Percent Spacing (No Space) ---
        matches = list(pattern_no_space_unit.finditer(masked_line))
        for m in reversed(matches):
            num, unit = m.group(1), m.group(2)
            col_num = m.start() + 1
            errors.append({
                'line': line_num, 'col': col_num,
                'msg': f"Should not have space between number '{num}' and unit '{unit}'",
                'suggest': f"{num}{unit}"
            })
            if fix:
                current_line = current_line[:m.start()] + f"{num}{unit}" + current_line[m.end():]
                masked_line = masked_line[:m.start()] + f"{num}{unit}" + masked_line[m.end():]
                line_modified = True

        # --- D. Spaces around Fullwidth Punctuation ---
        # Spaces before fullwidth punc
        matches = list(pattern_space_before_punc.finditer(masked_line))
        for m in reversed(matches):
            char, punc = m.group(1), m.group(2)
            col_num = m.start() + 1
            errors.append({
                'line': line_num, 'col': col_num,
                'msg': f"Should not have space before fullwidth punctuation '{punc}' after '{char}'",
                'suggest': f"{char}{punc}"
            })
            if fix:
                current_line = current_line[:m.start()] + f"{char}{punc}" + current_line[m.end():]
                masked_line = masked_line[:m.start()] + f"{char}{punc}" + masked_line[m.end():]
                line_modified = True

        # Spaces after fullwidth punc
        matches = list(pattern_space_after_punc.finditer(masked_line))
        for m in reversed(matches):
            punc, char = m.group(1), m.group(2)
            col_num = m.start() + 1
            errors.append({
                'line': line_num, 'col': col_num,
                'msg': f"Should not have space after fullwidth punctuation '{punc}' before '{char}'",
                'suggest': f"{punc}{char}"
            })
            if fix:
                current_line = current_line[:m.start()] + f"{punc}{char}" + current_line[m.end():]
                masked_line = masked_line[:m.start()] + f"{punc}{char}" + masked_line[m.end():]
                line_modified = True

        # --- E. Duplicate Punctuation ---
        matches = list(pattern_dup_punc.finditer(masked_line))
        for m in reversed(matches):
            punc = m.group(1)
            col_num = m.start() + 1
            errors.append({
                'line': line_num, 'col': col_num,
                'msg': f"Duplicate punctuation '{m.group(0)}'",
                'suggest': punc
            })
            if fix:
                current_line = current_line[:m.start()] + punc + current_line[m.end():]
                masked_line = masked_line[:m.start()] + punc + masked_line[m.end():]
                line_modified = True

        # --- E2. Range Connector Spacing ---
        matches = list(pattern_range.finditer(masked_line))
        for m in reversed(matches):
            g1, g2 = m.group(1), m.group(2)
            expected = f"{g1} ~ {g2}"
            if m.group(0) != expected:
                col_num = m.start() + 1
                errors.append({
                    'line': line_num, 'col': col_num,
                    'msg': f"Range connector tilde '~' should have spaces around it: '{m.group(0)}'",
                    'suggest': expected
                })
                if fix:
                    current_line = current_line[:m.start()] + expected + current_line[m.end():]
                    masked_line = masked_line[:m.start()] + expected + masked_line[m.end():]
                    line_modified = True

        # --- F. Fullwidth Numbers ---
        for fw_num, hw_num in FULLWIDTH_NUMS.items():
            if fw_num in masked_line:
                col_num = masked_line.index(fw_num) + 1
                errors.append({
                    'line': line_num, 'col': col_num,
                    'msg': f"Fullwidth number '{fw_num}' should be halfwidth '{hw_num}'",
                    'suggest': hw_num
                })
                if fix:
                    current_line = current_line.replace(fw_num, hw_num)
                    masked_line = masked_line.replace(fw_num, hw_num)
                    line_modified = True

        # --- G. Halfwidth Punctuation next to CJK ---
        # Checking for CJK followed by halfwidth punctuation
        pattern_cjk_hwp = re.compile(rf'({cjk_char})([!,;:?\(\)])')
        matches = list(pattern_cjk_hwp.finditer(masked_line))
        for m in reversed(matches):
            cjk, hwp = m.group(1), m.group(2)
            fwp = HALFWIDTH_PUNC[hwp]
            col_num = m.start() + 1
            errors.append({
                'line': line_num, 'col': col_num,
                'msg': f"Halfwidth punctuation '{hwp}' next to CJK should be fullwidth '{fwp}'",
                'suggest': f"{cjk}{fwp}"
            })
            if fix:
                current_line = current_line[:m.start()] + f"{cjk}{fwp}" + current_line[m.end():]
                masked_line = masked_line[:m.start()] + f"{cjk}{fwp}" + masked_line[m.end():]
                line_modified = True

        # Checking for halfwidth punctuation followed by CJK
        pattern_hwp_cjk = re.compile(rf'([!,;:?\(\)])({cjk_char})')
        matches = list(pattern_hwp_cjk.finditer(masked_line))
        for m in reversed(matches):
            hwp, cjk = m.group(1), m.group(2)
            fwp = HALFWIDTH_PUNC[hwp]
            col_num = m.start() + 1
            errors.append({
                'line': line_num, 'col': col_num,
                'msg': f"Halfwidth punctuation '{hwp}' next to CJK should be fullwidth '{fwp}'",
                'suggest': f"{fwp}{cjk}"
            })
            if fix:
                current_line = current_line[:m.start()] + f"{fwp}{cjk}" + current_line[m.end():]
                masked_line = masked_line[:m.start()] + f"{fwp}{cjk}" + masked_line[m.end():]
                line_modified = True

        # --- H. Tech Term Casing ---
        for term_pattern, correct_term in TECH_TERMS.items():
            matches = list(re.finditer(term_pattern, masked_line, re.IGNORECASE))
            for m in reversed(matches):
                matched_term = m.group(0)
                if matched_term != correct_term:
                    col_num = m.start() + 1
                    errors.append({
                        'line': line_num, 'col': col_num,
                        'msg': f"Incorrect capitalization for '{matched_term}'. Use '{correct_term}'",
                        'suggest': correct_term
                    })
                    if fix:
                        current_line = current_line[:m.start()] + correct_term + current_line[m.end():]
                        masked_line = masked_line[:m.start()] + correct_term + masked_line[m.end():]
                        line_modified = True

        # --- I. Quote Style (Chinese double quotes to corner brackets) ---
        matches = list(pattern_quotes.finditer(masked_line))
        for m in reversed(matches):
            content_inside = m.group(1)
            col_num = m.start() + 1
            errors.append({
                'line': line_num, 'col': col_num,
                'msg': f"Use corner brackets '「{content_inside}」' instead of double quotes '“{content_inside}”'",
                'suggest': f"「{content_inside}」"
            })
            if fix:
                current_line = current_line[:m.start()] + f"「{content_inside}」" + current_line[m.end():]
                masked_line = masked_line[:m.start()] + f"「{content_inside}」" + masked_line[m.end():]
                line_modified = True

        # --- J. Single Quote Style (Chinese single quotes to double corner brackets) ---
        matches = list(pattern_single_quotes.finditer(masked_line))
        for m in reversed(matches):
            content_inside = m.group(1)
            col_num = m.start() + 1
            errors.append({
                'line': line_num, 'col': col_num,
                'msg': f"Use double corner brackets '『{content_inside}』' instead of single quotes '‘{content_inside}’'",
                'suggest': f"『{content_inside}』"
            })
            if fix:
                current_line = current_line[:m.start()] + f"『{content_inside}』" + current_line[m.end():]
                masked_line = masked_line[:m.start()] + f"『{content_inside}』" + masked_line[m.end():]
                line_modified = True

        if line_modified:
            fixed_lines[line_idx] = current_line
            is_modified = True

    if fix and is_modified:
        try:
            Path(file_path).write_text('\n'.join(fixed_lines) + '\n', encoding='utf-8')
            print(f"Fixed formatting issues in {file_path}")
        except Exception as e:
            print(f"Error writing fixes to file {file_path}: {e}", file=sys.stderr)

    return errors

def main():
    parser = argparse.ArgumentParser(description="Chinese Copywriting and Writing Style Linter")
    parser.add_argument("paths", nargs="+", help="Files or directories to lint")
    parser.add_argument("--fix", "-f", action="store_true", help="Automatically fix issues where possible")
    args = parser.parse_args()

    all_errors = {}
    files_to_process = []

    for path_str in args.paths:
        path = Path(path_str).resolve()
        if path.is_file():
            if path.suffix == '.md':
                files_to_process.append(path)
        elif path.is_dir():
            files_to_process.extend(path.glob('**/*.md'))

    for file_path in files_to_process:
        errors = lint_file(file_path, fix=args.fix)
        if errors:
            all_errors[file_path] = errors

    if not all_errors:
        print("No copywriting style issues found.")
        sys.exit(0)

    # Print results
    total_errors = 0
    for file_path, errors in all_errors.items():
        print(f"\n{file_path}:")
        for err in errors:
            total_errors += 1
            print(f"  Line {err['line']}, Col {err['col']}: {err['msg']} (Suggestion: {err['suggest']})")

    print(f"\nTotal issues found: {total_errors}")
    if not args.fix:
        sys.exit(1)
    else:
        sys.exit(0)

if __name__ == '__main__':
    main()
