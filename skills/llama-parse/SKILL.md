---
name: llama-parse
description: "Use this skill to parse complex documents (PDFs, Word documents, PowerPoint presentations, Excel spreadsheets, or images) into clean Markdown or structured JSON using the LlamaParse API. Make sure to use this skill whenever the user asks to extract tables from PDFs, handle complex document structures (multi-column, charts, forms), parse files with custom prompt guidelines, or convert documents to LLM-ready markdown, even if they don't explicitly mention 'LlamaParse'."
---

# LlamaParse Document Parsing

A skill to parse complex files (PDF, DOCX, PPTX, XLSX, images) into clean Markdown or structured JSON using LlamaParse (Llama Cloud API). It preserves layouts, extracts tables accurately, and supports custom formatting instructions.

## When to use

Use this skill when:
- Normal text extractors (like `pdfplumber` or `pypdf`) fail to extract structured tables or handle complex document layouts.
- You need to parse files containing mathematical equations, complex charts, or forms.
- You need to convert documents (PDF/DOCX/PPTX) into high-quality Markdown optimized for RAG or LLM context ingestion.
- You need custom parsing rules (e.g. "Extract tables as CSV", "Ignore headers and footers").

## Setup and Prerequisites

1. **Environment Variables**:
   LlamaParse requires a LlamaCloud API Key. Ensure the key is set:
   ```bash
   export LLAMA_CLOUD_API_KEY="llx-..."
   ```
   Get a free API key at [Llama Cloud](https://cloud.llamaindex.ai/). Alternatively, you can pass the key via the `-k` / `--api-key` command-line argument.

2. **Dependencies**:
   Ensure `llama-parse` is installed:
   ```bash
   pip install llama-parse
   ```

## How to Run the Parser Script

This skill includes a helper script `parse.py` in the `scripts/` directory.

### 1. Basic Parsing to Markdown
To parse a document and print the output to standard output:
```bash
python3 <skill_dir>/scripts/parse.py path/to/document.pdf
```

To save the markdown result to a specific file:
```bash
python3 <skill_dir>/scripts/parse.py path/to/document.pdf -o output.md
```

### 2. Batch Parsing (Multiple Files)
To parse multiple files at once. If `-o` is a directory, the parsed files will be written there using their original basenames (e.g. `doc1.md`, `doc2.md`):
```bash
python3 <skill_dir>/scripts/parse.py doc1.pdf doc2.pdf -o path/to/output_dir/
```

If `-o` is a file path, the outputs will be concatenated:
```bash
python3 <skill_dir>/scripts/parse.py doc1.pdf doc2.pdf -o combined_output.md
```

### 3. API Key Flag
If you don't have the environment variable configured:
```bash
python3 <skill_dir>/scripts/parse.py document.pdf -k "llx-your-api-key-here"
```

### 4. Page Range Control (target_pages)
To save API tokens and only parse specific page ranges:
```bash
python3 <skill_dir>/scripts/parse.py document.pdf -p "0,2-5"
```

### 5. Multimodal / Vendor Model Mode (Recommended for Charts & Forms)
To enable LlamaParse's advanced multimodal parsing using an LLM like GPT-4o to achieve high layout-fidelity extraction of complex figures and tables:
```bash
python3 <skill_dir>/scripts/parse.py document.pdf --use-vendor-model
```

### 6. Custom Parsing Instructions
To parse with specific guidelines (e.g., how to treat tables or formatting):
```bash
python3 <skill_dir>/scripts/parse.py path/to/document.pdf -i "Format all headers with ## and convert all tables to clean markdown tables."
```

### 7. Parsing to JSON
To extract raw structured JSON metadata containing page breakdowns, bounding boxes, or text blocks:
```bash
python3 <skill_dir>/scripts/parse.py path/to/document.pdf -j -o output.json
```

### 8. Language Selection
Specify the document language for better OCR/parsing accuracy (e.g., `en` for English, `ch_sim` for Simplified Chinese):
```bash
python3 <skill_dir>/scripts/parse.py path/to/chinese_doc.pdf -l ch_sim
```

### 9. Querying Account Usage/Quota
To query your LlamaParse Free Plan credit usage directly without parsing files:
```bash
python3 <skill_dir>/scripts/parse.py --show-usage
```


## Python API Quick Reference

You can also import and use LlamaParse directly inside Python:

```python
from llama_parse import LlamaParse

# Initialize parser
parser = LlamaParse(
    api_key="llx-...",                            # Optional if LLAMA_CLOUD_API_KEY is in env
    result_type="markdown",                      # "markdown" or "text"
    parsing_instruction="Extract tables cleanly.", # Optional
    language="en",                               # Optional
    target_pages="0,2-5",                        # Optional
    use_vendor_multimodal_model=True,            # Optional
    vendor_multimodal_model_name="gpt-4o",       # Optional
    verbose=True
)

# Parse a file into LlamaIndex Document objects
documents = parser.load_data("./my_document.pdf")
full_text = "\n\n".join([doc.text for doc in documents])

# Parse a file to raw JSON
json_results = parser.get_json_result("./my_document.pdf")
```

## Troubleshooting & Best Practices

- **Invalid API Key Error**: Double-check your `LLAMA_CLOUD_API_KEY`. It should start with `llx-`.
- **Rate Limits**: If you run out of credits or hit concurrency rate limits, LlamaParse calls might fail. Use `-p` to target specific pages to save credits, or run with `-v` to debug API response codes.
- **Form and Table Extraction**: For documents with heavily structured forms or graphics, always pass `--use-vendor-model` to invoke multimodal GPT-4o parsing.
- **Empty Output**: Ensure the file type is supported. Supported file types include `.pdf`, `.docx`, `.pptx`, `.xlsx`, `.png`, `.jpg`, `.jpeg`, `.tiff`.
- **LiteParse (lit) Fallback**: If LlamaParse credits are exhausted, or the API call fails/times out, or no API key is set, the helper script prompts the user for confirmation before falling back to local LiteParse (`lit`). Passing `-y` or `--yes` will automatically approve the fallback without prompting.


## User Communication
- **Immediately upon triggering**, before running any parsing tasks, run `python3 <skill_dir>/scripts/parse.py --show-usage` (or fetch programmatically) and notify the user of LlamaParse's Free Plan monthly limit (10,000 Credits) and how many credits have currently been used.
- **Every time a conversion task completes**, display the updated Free Plan usage as printed by the script.
- Report parsing completion details (e.g., number of pages, output format, output file path).
- Show a brief preview of the parsed content to the user.
