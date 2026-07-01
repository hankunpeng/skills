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
   Get a free API key at [Llama Cloud](https://cloud.llamaindex.ai/).

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

### 2. Custom Parsing Instructions
To parse with specific guidelines (e.g., how to treat tables or formatting):
```bash
python3 <skill_dir>/scripts/parse.py path/to/document.pdf -i "Format all headers with ## and convert all tables to clean markdown tables."
```

### 3. Parsing to JSON
To extract raw structured JSON metadata containing page breakdowns, bounding boxes, or text blocks:
```bash
python3 <skill_dir>/scripts/parse.py path/to/document.pdf -j -o output.json
```

### 4. Language Selection
Specify the document language for better OCR/parsing accuracy (e.g., `en` for English, `ch_sim` for Simplified Chinese):
```bash
python3 <skill_dir>/scripts/parse.py path/to/chinese_doc.pdf -l ch_sim
```

## Python API Quick Reference

You can also import and use LlamaParse directly inside Python:

```python
from llama_parse import LlamaParse

# Initialize parser (reads LLAMA_CLOUD_API_KEY from environment)
parser = LlamaParse(
    result_type="markdown",  # "markdown" or "text"
    parsing_instruction="Extract tables cleanly.", # Optional
    language="en", # Optional
    verbose=True
)

# Parse a file into LlamaIndex Document objects
documents = parser.load_data("./my_document.pdf")
full_text = "\n\n".join([doc.text for doc in documents])

# Parse a file to raw JSON
json_results = parser.get_json_result("./my_document.pdf")
# json_results[0]["pages"] contains page-by-page JSON elements
```

## User Communication
- Always check if `LLAMA_CLOUD_API_KEY` is configured before executing LlamaParse. If missing, explain how to set it up.
- Report parsing completion details (e.g., number of pages, output format, output file path).
- Show a brief preview of the parsed content to the user (e.g., the first 500 characters of the markdown or key tables extracted).
