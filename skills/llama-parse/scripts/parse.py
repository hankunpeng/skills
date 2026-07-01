#!/usr/bin/env python3
"""
LlamaParse Helper Script
Parses PDF, Word, PowerPoint, Excel, and image documents into Markdown or JSON.
"""

import os
import sys
import argparse
import json

def check_dependencies():
    missing = []
    try:
        import llama_parse
    except ImportError:
        missing.append("llama-parse")
    
    if missing:
        print(f"Error: Missing dependencies: {', '.join(missing)}", file=sys.stderr)
        print("Please install them using: pip install llama-parse", file=sys.stderr)
        sys.exit(1)

def main():
    parser = argparse.ArgumentParser(
        description="Parse documents to Markdown or JSON using LlamaParse API."
    )
    parser.add_argument("input_file", help="Path to the document to parse (PDF, DOCX, PPTX, XLSX, PNG, etc.)")
    parser.add_argument("-o", "--output", help="Path to output file. If omitted, writes to stdout (or <filename>.md/json if a directory is specified)")
    parser.add_argument("-t", "--type", choices=["markdown", "text"], default="markdown", help="Result type (default: markdown)")
    parser.add_argument("-i", "--instruction", help="Custom parsing instruction (prompt) to guide the parser")
    parser.add_argument("-l", "--language", help="Language code (e.g., 'en', 'ch_sim' for simplified Chinese)")
    parser.add_argument("-j", "--json", action="store_true", help="Output raw JSON results instead of text")
    parser.add_argument("-v", "--verbose", action="store_true", help="Print verbose logs from LlamaParse")
    
    args = parser.parse_args()
    
    # 1. Check dependencies
    check_dependencies()
    
    # 2. Check API Key
    api_key = os.environ.get("LLAMA_CLOUD_API_KEY")
    if not api_key:
        print("Error: LLAMA_CLOUD_API_KEY environment variable is not set.", file=sys.stderr)
        print("Please obtain an API key from https://cloud.llamaindex.ai/ and set it:", file=sys.stderr)
        print("  export LLAMA_CLOUD_API_KEY=\"your_key_here\"", file=sys.stderr)
        sys.exit(1)
        
    # Check if input file exists
    if not os.path.exists(args.input_file):
        print(f"Error: Input file '{args.input_file}' does not exist.", file=sys.stderr)
        sys.exit(1)
        
    from llama_parse import LlamaParse
    
    # 3. Initialize parser
    # We apply nest_asyncio in case we are in an environment with a running event loop
    try:
        import nest_asyncio
        nest_asyncio.apply()
    except Exception:
        pass

    llama_parser = LlamaParse(
        api_key=api_key,
        result_type=args.type,
        parsing_instruction=args.instruction,
        language=args.language,
        verbose=args.verbose
    )
    
    try:
        if args.json:
            if args.verbose:
                print("Parsing and fetching JSON result...", file=sys.stderr)
            json_result = llama_parser.get_json_result(args.input_file)
            output_content = json.dumps(json_result, indent=2, ensure_ascii=False)
        else:
            if args.verbose:
                print("Parsing and fetching document result...", file=sys.stderr)
            documents = llama_parser.load_data(args.input_file)
            output_content = "\n\n".join([doc.text for doc in documents])
            
        # 4. Output the result
        if args.output:
            with open(args.output, "w", encoding="utf-8") as f:
                f.write(output_content)
            print(f"Successfully saved parsed content to: {args.output}", file=sys.stderr)
        else:
            print(output_content)
            
    except Exception as e:
        print(f"Error occurred during parsing: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
