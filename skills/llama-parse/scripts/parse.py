#!/usr/bin/env python3
"""
LlamaParse Helper Script
Parses PDF, Word, PowerPoint, Excel, and image documents into Markdown or JSON.
If LlamaParse credits are exhausted or the service fails, it falls back to local LiteParse (lit).
"""

import os
import sys
import argparse
import json
import urllib.request
import urllib.error
import warnings
import subprocess

# Suppress LlamaParse deprecation warning to keep console output clean
warnings.filterwarnings("ignore", category=DeprecationWarning)

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

def print_free_plan_usage(api_key, prefix=""):
    try:
        # 1. Get organization ID
        orgs_req = urllib.request.Request(
            "https://api.cloud.llamaindex.ai/api/v1/organizations",
            headers={"Authorization": f"Bearer {api_key}"}
        )
        with urllib.request.urlopen(orgs_req) as response:
            orgs = json.loads(response.read().decode())
            if not orgs:
                return
            org_id = orgs[0]["id"]
            
        # 2. Get usage details
        usage_req = urllib.request.Request(
            f"https://api.cloud.llamaindex.ai/api/v1/organizations/{org_id}/usage",
            headers={"Authorization": f"Bearer {api_key}"}
        )
        with urllib.request.urlopen(usage_req) as response:
            usage_data = json.loads(response.read().decode())
            
        # 3. Extract and display
        free_credits = usage_data.get("usage", {}).get("active_free_credits_usage", [])
        if free_credits:
            start = free_credits[0].get("starting_balance", 0)
            remain = free_credits[0].get("remaining_balance", 0)
            used = start - remain
            print(f"{prefix}[LlamaParse Free Plan Usage]: Monthly limit is {start} credits. Currently used: {used} credits ({remain} remaining).", file=sys.stderr)
    except Exception:
        # Gracefully ignore if we cannot fetch billing info
        pass

def run_liteparse_fallback(input_file, args):
    """
    Runs the local LiteParse (lit) command as a fallback.
    """
    cmd = ["lit", "parse"]
    if args.json:
        cmd += ["--format", "json"]
    elif args.type == "markdown":
        cmd += ["--format", "markdown"]
    else:
        cmd += ["--format", "text"]
        
    if args.pages:
        cmd += ["--target-pages", args.pages]
        
    cmd.append(input_file)
    
    if args.verbose:
        print(f"Executing local LiteParse: {' '.join(cmd)}", file=sys.stderr)
        
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode == 0:
        return res.stdout
    else:
        print(f"Error: Local LiteParse failed with exit code {res.returncode}.", file=sys.stderr)
        print(res.stderr, file=sys.stderr)
        sys.exit(1)

def main():
    parser = argparse.ArgumentParser(
        description="Parse documents to Markdown or JSON using LlamaParse API (with local LiteParse fallback)."
    )
    parser.add_argument(
        "input_files", 
        nargs="*", 
        help="One or more paths to the documents to parse (PDF, DOCX, PPTX, XLSX, PNG, etc.)"
    )
    parser.add_argument(
        "-o", "--output", 
        help="Path to output file or directory. If a directory is specified, outputs are written there with matching basenames."
    )
    parser.add_argument(
        "-k", "--api-key", 
        help="LlamaCloud API key. If omitted, reads LLAMA_CLOUD_API_KEY environment variable."
    )
    parser.add_argument(
        "-t", "--type", 
        choices=["markdown", "text"], 
        default="markdown", 
        help="Result type (default: markdown)"
    )
    parser.add_argument(
        "-i", "--instruction", 
        help="Custom parsing instruction (prompt) to guide the parser"
    )
    parser.add_argument(
        "-l", "--language", 
        help="Language code (e.g., 'en', 'ch_sim' for simplified Chinese)"
    )
    parser.add_argument(
        "-p", "--pages", 
        help="Target pages to parse (comma-separated page numbers/ranges, e.g., '0,2-5')."
    )
    parser.add_argument(
        "-j", "--json", 
        action="store_true", 
        help="Output raw JSON results instead of text"
    )
    parser.add_argument(
        "--use-vendor-model", 
        action="store_true", 
        help="Enable vendor multimodal model parsing for complex layout and images"
    )
    parser.add_argument(
        "--vendor-model-name", 
        default="gpt-4o", 
        help="Name of the vendor multimodal model to use (default: gpt-4o)"
    )
    parser.add_argument(
        "--show-usage",
        action="store_true",
        help="Only query and print the LlamaParse Free Plan credit usage, then exit."
    )
    parser.add_argument(
        "-v", "--verbose", 
        action="store_true", 
        help="Print verbose logs from LlamaParse"
    )
    
    args = parser.parse_args()
    
    # 1. Check dependencies
    check_dependencies()
    
    # 2. Check API Key
    api_key = args.api_key or os.environ.get("LLAMA_CLOUD_API_KEY")
    use_fallback_only = False
    if not api_key:
        print("Warning: LLAMA_CLOUD_API_KEY is not set and no --api-key flag was provided.", file=sys.stderr)
        print("Falling back to local LiteParse (lit) directly...", file=sys.stderr)
        use_fallback_only = True
        
    # If only showing usage
    if args.show_usage:
        if use_fallback_only:
            print("Cannot show usage because no API key is available.", file=sys.stderr)
            sys.exit(1)
        print_free_plan_usage(api_key)
        sys.exit(0)
        
    # Check if input files exist when not showing usage
    if not args.input_files:
        parser.error("the following arguments are required: input_files (or use --show-usage)")
        
    for f in args.input_files:
        if not os.path.exists(f):
            print(f"Error: Input file '{f}' does not exist.", file=sys.stderr)
            sys.exit(1)
        
    llama_parser = None
    if not use_fallback_only:
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
            target_pages=args.pages,
            use_vendor_multimodal_model=args.use_vendor_model,
            vendor_multimodal_model_name=args.vendor_model_name if args.use_vendor_model else None,
            verbose=args.verbose
        )
    
    try:
        results = []
        for input_file in args.input_files:
            if args.verbose:
                print(f"Processing '{input_file}'...", file=sys.stderr)
            
            output_content = None
            if not use_fallback_only and llama_parser:
                try:
                    if args.json:
                        json_result = llama_parser.get_json_result(input_file)
                        output_content = json.dumps(json_result, indent=2, ensure_ascii=False)
                    else:
                        documents = llama_parser.load_data(input_file)
                        output_content = "\n\n".join([doc.text for doc in documents])
                    
                    # Show Free plan usage after each file is parsed
                    print_free_plan_usage(api_key, prefix="\n")
                except Exception as e:
                    print(f"Warning: LlamaParse failed with error: {e}", file=sys.stderr)
                    print("Falling back to local LiteParse (lit)...", file=sys.stderr)
            
            if output_content is None:
                output_content = run_liteparse_fallback(input_file, args)
                print("Successfully processed with local LiteParse (lit).", file=sys.stderr)
                
            results.append((input_file, output_content))
            
        # 4. Handle Output
        if args.output:
            if os.path.isdir(args.output):
                for input_file, content in results:
                    base = os.path.splitext(os.path.basename(input_file))[0]
                    ext = ".json" if args.json else ".md"
                    out_path = os.path.join(args.output, base + ext)
                    with open(out_path, "w", encoding="utf-8") as f:
                        f.write(content)
                    print(f"Successfully saved parsed content to: {out_path}", file=sys.stderr)
            else:
                # If single output file and multiple inputs, concatenate them
                concatenated = ""
                for idx, (input_file, content) in enumerate(results):
                    if len(results) > 1:
                        concatenated += f"<!-- START OF FILE: {input_file} -->\n"
                    concatenated += content
                    if len(results) > 1:
                        concatenated += f"\n<!-- END OF FILE: {input_file} -->\n\n"
                
                with open(args.output, "w", encoding="utf-8") as f:
                    f.write(concatenated)
                print(f"Successfully saved parsed content to: {args.output}", file=sys.stderr)
        else:
            for idx, (input_file, content) in enumerate(results):
                if len(results) > 1:
                    print(f"--- File: {input_file} ---", file=sys.stderr)
                print(content)
                if len(results) > 1 and idx < len(results) - 1:
                    print("\n" + "="*40 + "\n", file=sys.stderr)
            
    except Exception as e:
        print(f"Error occurred during parsing: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
