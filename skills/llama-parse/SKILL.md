---
name: llama-parse
description: "Use this skill to parse complex documents (PDFs, Word documents, PowerPoint presentations, Excel spreadsheets, or images) into clean Markdown or structured JSON using the LlamaParse API. Make sure to use this skill whenever the user asks to extract tables from PDFs, handle complex document structures (multi-column, charts, forms), parse files with custom prompt guidelines, or convert documents to LLM-ready markdown, even if they don't explicitly mention 'LlamaParse'."
compatibility: Needs a `LLAMA_CLOUD_API_KEY` defined within the environment. Works in both Python and Node.js environments.
license: MIT
metadata:
  author: LlamaIndex
  version: "2.0.0"
---

# LlamaParse Document Parsing Skill

Parse unstructured documents (such as PDF, DOCX, PPTX, XLSX, images) with LlamaParse and extract their contents (text, markdown, images, JSON). This skill supports both **Python** (`llama-cloud` SDK) and **Node.js/TypeScript** (`@llamaindex/llama-cloud` SDK).

## When to use

Use this skill when:
- Normal text extractors (like `pdfplumber` or `pypdf`) fail to extract structured tables or handle complex document layouts.
- You need to parse files containing mathematical equations, complex charts, or forms.
- You need to convert documents (PDF/DOCX/PPTX) into high-quality Markdown optimized for RAG or LLM context ingestion.
- You need custom parsing rules (e.g., "Extract tables as CSV", "Ignore headers and footers").
- You need to extract and download embedded images/screenshots from the documents.

---

## Setup and Prerequisites

### 1. API Key
LlamaParse requires a LlamaCloud API Key. Ensure the key is set:
```bash
export LLAMA_CLOUD_API_KEY="llx-..."
```
Get a free API key at [Llama Cloud](https://cloud.llamaindex.ai/).

### 2. Environment Selection & Installation

Depending on the workspace project stack, select either Python or TypeScript:

#### For Python Environments
Install the unified Python SDK:
```bash
pip install llama-cloud
```
> [!NOTE]
> The older `llama-parse` package is deprecated. Always use `llama-cloud` for new implementations.

#### For TypeScript/Node.js Environments
Install the unified Node.js SDK:
```bash
npm install @llamaindex/llama-cloud@latest
```

---

## Helper Scripts

This skill includes pre-built helper scripts under the `scripts/` directory:
- [parse.py](file:///Users/alex/github/hankunpeng/skills/skills/llama-parse/scripts/parse.py) — Unified Python script.
- [parse.ts](file:///Users/alex/github/hankunpeng/skills/skills/llama-parse/scripts/parse.ts) — Unified TypeScript script (execute via `npx tsx`).

### Command-Line Arguments (Unified)

Both scripts support the same arguments:

| Option | Description |
|--------|-------------|
| `-o, --output <path>` | Path to output file or directory. If a directory is specified, outputs are written there with matching basenames. |
| `-k, --api-key <key>` | LlamaCloud API key (falls back to `LLAMA_CLOUD_API_KEY` env var). |
| `-t, --type <type>` | Result type: `markdown` or `text` (default: `markdown`). |
| `--tier <tier>` | Parsing tier: `fast`, `cost_effective`, `agentic`, `agentic_plus` (default: `agentic`). |
| `-i, --instruction <text>` | Custom parsing instructions (e.g. prompt guidelines). |
| `-l, --language <lang>` | OCR language code (e.g., `en`, `de`, `ch_sim`). |
| `-p, --pages <ranges>` | Page ranges to parse (comma-separated page numbers or ranges, e.g. `0,2-5`). |
| `-j, --json` | Output raw JSON containing structural page elements. |
| `-d, --download-images` | Download extracted images and screenshots from the document. |
| `--show-usage` | Show remaining credit usage of the free plan quota, then exit. |
| `-v, --verbose` | Enable verbose status/polling logs. |

---

## Execution Examples

### 1. Basic Parsing to Markdown
```bash
# Python
python3 <skill_dir>/scripts/parse.py document.pdf -o output.md

# TypeScript
npx tsx <skill_dir>/scripts/parse.ts document.pdf -o output.md
```

### 2. Extracting and Downloading Images
To download screenshots/extracted figures from the PDF to the output directory:
```bash
# Python
python3 <skill_dir>/scripts/parse.py document.pdf -d -o output_dir/

# TypeScript
npx tsx <skill_dir>/scripts/parse.ts document.pdf -d -o output_dir/
```

### 3. Target Page Selection (Credit-Saving)
```bash
# Parse pages 1, 3, 4, 5, 6 (0-indexed)
python3 <skill_dir>/scripts/parse.py document.pdf -p "0,2-5"
```

### 4. Custom Parsing Instruction & Advanced Tier
```bash
python3 <skill_dir>/scripts/parse.py document.pdf --tier agentic_plus -i "Format all tables as markdown, ignoring headers/footers."
```

### 5. Parse to Structured JSON
```bash
python3 <skill_dir>/scripts/parse.py document.pdf -j -o output.json
```

---

## SDK Integration Reference

For code integrations inside projects:

### Python SDK Integration (`llama-cloud`)

```python
import os
import time
from llama_cloud.client import LlamaCloud
from llama_cloud import LlamaParseAgenticOptions, LlamaParseOutputOptions

client = LlamaCloud(token=os.environ["LLAMA_CLOUD_API_KEY"])

# 1. Upload file
with open("document.pdf", "rb") as f:
    file_obj = client.files.upload_file(upload_file=f)

# 2. Start parse job
job = client.v_2.parse_file(
    file_id=file_obj.id,
    tier="agentic",
    version="latest",
    agentic_options=LlamaParseAgenticOptions(custom_prompt="Format tables cleanly."),
    output_options=LlamaParseOutputOptions(images_to_save=["screenshot"])
)

# 3. Poll for completion
while True:
    res = client.v_2.get_parse_job(job.id, expand=["markdown", "images_content_metadata"])
    if res.job.status == "COMPLETED":
        break
    elif res.job.status in ("FAILED", "CANCELLED"):
        raise Exception(f"Job failed: {res.job.error_message}")
    time.sleep(2)

# 4. Extract results
markdown_text = "\n\n".join([p.markdown for p in res.markdown.pages if p.markdown])
print(markdown_text)
```

### TypeScript SDK Integration (`@llamaindex/llama-cloud`)

```typescript
import LlamaCloud from "@llamaindex/llama-cloud";
import { readFile } from "fs/promises";
import { basename } from "path";

const client = new LlamaCloud({
  apiKey: process.env.LLAMA_CLOUD_API_KEY,
});

// 1. Upload file
const fileBuffer = await readFile("document.pdf");
const fileBlob = new File([fileBuffer], basename("document.pdf"));
const fileObj = await client.files.create({
  file: fileBlob,
  purpose: "parse",
});

// 2. Start parse job
const job = await client.v_2.parseFile({
  file_id: fileObj.id,
  tier: "agentic",
  version: "latest",
  output_options: {
    images_to_save: ["screenshot"],
  },
});

// 3. Poll for completion
let res: any;
while (true) {
  res = await client.v_2.getParseJob(job.id, {
    expand: ["markdown_full", "images_content_metadata"],
  });
  if (res.job?.status === "COMPLETED") break;
  if (res.job?.status === "FAILED" || res.job?.status === "CANCELLED") {
    throw new Error(`Job failed: ${res.job?.error_message}`);
  }
  await new Promise((resolve) => setTimeout(resolve, 2000));
}

// 4. Extract results
const markdownText = res.markdown_full ?? "";
console.log(markdownText);
```

---

## Troubleshooting & Best Practices

- **Deprecated SDK Warning**: Avoid installing or importing the `llama-parse` pip library. Always use `llama-cloud` for Python development to prevent deprecation issues.
- **Model Selection in V2**: In LlamaCloud V2, model configuration (e.g. GPT-4o multimodal parsing) is determined by the `tier` parameter (`agentic` or `agentic_plus`) instead of legacy local parameters.
- **Save Quota / Page Range**: Use `-p` to target specific page numbers to avoid consuming unnecessary credits on long documents.
- **Image Auth Headers**: When downloading images/screenshots from LlamaCloud presigned URLs, you must include the Bearer Authorization header: `Authorization: Bearer <LLAMA_CLOUD_API_KEY>`.

---

## User Communication Guidelines

1. **Quota Warnings**: When initializing or executing a parse task, query and display LlamaParse's Free Plan credit usage to let the user know their current balance. Warn them clearly if remaining credits are below 100.
2. **Result Previews**: After parsing finishes, report the details (number of parsed pages, generated outputs) and print a concise Markdown preview of the parsed content.
