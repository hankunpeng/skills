#!/usr/bin/env python3
"""
LlamaParse Helper Script (Modernized)
Parses PDF, Word, PowerPoint, Excel, and image documents into Markdown or JSON
using the new unified llama-cloud SDK.
"""

import os
import sys
import time
import argparse
import json
import urllib.request
import urllib.parse
import warnings

# Suppress warnings to keep console output clean
warnings.filterwarnings("ignore")

def check_dependencies():
    missing = []
    try:
        import llama_cloud
    except ImportError:
        missing.append("llama-cloud")
    
    if missing:
        print(f"Error: Missing dependencies: {', '.join(missing)}", file=sys.stderr)
        print("Please install them using: pip install llama-cloud", file=sys.stderr)
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
            
            # Warn if remaining credits are below 100
            if remain < 100:
                print(f"[WARNING] LlamaParse remaining credits are below 100! Current remaining: {remain} credits.", file=sys.stderr)
    except Exception:
        # Gracefully ignore if we cannot fetch billing info
        pass

def main():
    parser = argparse.ArgumentParser(
        description="Parse documents to Markdown or JSON using the unified LlamaCloud API."
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
        "--tier",
        choices=["fast", "cost_effective", "agentic", "agentic_plus"],
        default="agentic",
        help="Parsing tier (default: agentic). Replaces older --use-vendor-model flag."
    )
    parser.add_argument(
        "-i", "--instruction", 
        help="Custom parsing instruction (prompt) to guide the parser"
    )
    parser.add_argument(
        "-l", "--language", 
        help="Language code for OCR (e.g., 'en', 'de', 'ch_sim' for simplified Chinese)"
    )
    parser.add_argument(
        "-p", "--pages", 
        help="Target pages to parse (comma-separated page numbers/ranges, e.g., '0,2-5')."
    )
    parser.add_argument(
        "-j", "--json", 
        action="store_true", 
        help="Output raw JSON results instead of text/markdown"
    )
    parser.add_argument(
        "-d", "--download-images",
        action="store_true",
        help="Download extracted images/screenshots to the output directory"
    )
    parser.add_argument(
        "--use-vendor-model", 
        action="store_true", 
        help="Deprecated flag (mapped to tier='agentic')"
    )
    parser.add_argument(
        "--vendor-model-name", 
        help="Deprecated flag. Model selection is now handled on the server side via the tier configuration."
    )
    parser.add_argument(
        "--show-usage",
        action="store_true",
        help="Only query and print the LlamaParse Free Plan credit usage, then exit."
    )
    parser.add_argument(
        "-v", "--verbose", 
        action="store_true", 
        help="Print verbose logs"
    )
    
    args = parser.parse_args()
    
    # 1. Check dependencies
    check_dependencies()
    
    # 2. Check API Key
    api_key = args.api_key or os.environ.get("LLAMA_CLOUD_API_KEY")
    if not api_key:
        print("Error: LLAMA_CLOUD_API_KEY is not set and no --api-key flag was provided.", file=sys.stderr)
        print("Please obtain an API key from https://cloud.llamaindex.ai/ and configure it.", file=sys.stderr)
        sys.exit(1)
        
    # If only showing usage
    if args.show_usage:
        print_free_plan_usage(api_key)
        sys.exit(0)
        
    # Check if input files exist when not showing usage
    if not args.input_files:
        parser.error("the following arguments are required: input_files (or use --show-usage)")
        
    for f in args.input_files:
        if not os.path.exists(f):
            print(f"Error: Input file '{f}' does not exist.", file=sys.stderr)
            sys.exit(1)
            
    # Handle deprecated flags
    tier = args.tier
    if args.use_vendor_model:
        if args.verbose:
            print("[Info] Deprecated flag --use-vendor-model mapped to tier='agentic'.", file=sys.stderr)
        tier = "agentic"
    if args.vendor_model_name and args.verbose:
        print(f"[Warning] Deprecated flag --vendor-model-name '{args.vendor_model_name}' ignored. Model selection is handled via --tier.", file=sys.stderr)

    from llama_cloud.client import LlamaCloud
    from llama_cloud import (
        LlamaParseAgenticOptions,
        LlamaParseInputOptions,
        LlamaParseOutputOptions,
        LlamaParseProcessingOptions,
        LlamaParseOcrParameters,
        LlamaParsePageRanges
    )
    
    # 3. Initialize LlamaCloud Client
    client = LlamaCloud(token=api_key)
    
    try:
        results = []
        for input_file in args.input_files:
            if args.verbose:
                print(f"Uploading '{input_file}' to Llama Cloud...", file=sys.stderr)
                
            # Step 1: Upload file to get file_id
            with open(input_file, "rb") as f:
                file_obj = client.files.upload_file(upload_file=f)
            file_id = file_obj.id
            
            if args.verbose:
                print(f"Uploaded successfully. File ID: {file_id}. Starting parse job...", file=sys.stderr)
                
            # Step 2: Configure parsing options
            agentic_opts = None
            if args.instruction:
                agentic_opts = LlamaParseAgenticOptions(custom_prompt=args.instruction)
                
            processing_opts = None
            if args.language:
                processing_opts = LlamaParseProcessingOptions(
                    ocr_parameters=LlamaParseOcrParameters(languages=[args.language])
                )
                
            page_ranges = None
            if args.pages:
                page_ranges = LlamaParsePageRanges(target_pages=args.pages)
                
            output_opts = None
            if args.download_images:
                output_opts = LlamaParseOutputOptions(images_to_save=["screenshot"])
                
            # Step 3: Trigger the parsing job
            job = client.v_2.parse_file(
                file_id=file_id,
                tier=tier,
                version="latest",
                agentic_options=agentic_opts,
                processing_options=processing_opts,
                page_ranges=page_ranges,
                output_options=output_opts
            )
            
            # Step 4: Poll for completion
            if args.verbose:
                print(f"Job ID: {job.id}. Polling status...", file=sys.stderr)
                
            expand_fields = ["items"] if args.json else [args.type]
            if args.download_images:
                expand_fields.append("images_content_metadata")
                
            while True:
                # Retrieve status
                res = client.v_2.get_parse_job(job.id, expand=expand_fields)
                status = res.job.status
                
                if args.verbose:
                    print(f"Current status: {status}", file=sys.stderr)
                    
                if status == "COMPLETED":
                    break
                elif status in ("FAILED", "CANCELLED"):
                    raise Exception(f"Parsing job failed/cancelled with status '{status}'. Error: {res.job.error_message}")
                    
                time.sleep(2)
                
            # Step 5: Format parsed content
            if args.json:
                # Fetch raw JSON result
                json_res = client.parsing.get_job_json_result(job.id)
                output_content = json.dumps(json_res.dict(), indent=2, ensure_ascii=False)
            else:
                if args.type == "markdown":
                    output_content = "\n\n".join([page.markdown for page in res.markdown.pages if page.markdown])
                else:
                    output_content = "\n\n".join([page.text for page in res.text.pages if page.text])
                    
            results.append((input_file, output_content, res))
            
            # Download images if requested
            if args.download_images and res.images_content_metadata:
                for img in res.images_content_metadata.images:
                    if img.url:
                        img_name = os.path.basename(img.url)
                        
                        # Determine output path
                        if args.output:
                            if os.path.isdir(args.output):
                                img_path = os.path.join(args.output, img_name)
                            else:
                                img_path = os.path.join(os.path.dirname(args.output) or ".", img_name)
                        else:
                            img_path = img_name
                            
                        if args.verbose:
                            print(f"Downloading image: {img_name} -> {img_path}", file=sys.stderr)
                            
                        try:
                            img_req = urllib.request.Request(
                                img.url,
                                headers={"Authorization": f"Bearer {api_key}"}
                            )
                            with urllib.request.urlopen(img_req) as img_resp:
                                with open(img_path, "wb") as img_file:
                                    img_file.write(img_resp.read())
                        except Exception as img_err:
                            print(f"Warning: Failed to download image {img_name}: {img_err}", file=sys.stderr)
                            
            # Show Free plan usage after each file is parsed
            print_free_plan_usage(api_key, prefix="\n")
            
        # 6. Handle Output Writing
        if args.output:
            if os.path.isdir(args.output):
                for input_file, content, _ in results:
                    base = os.path.splitext(os.path.basename(input_file))[0]
                    ext = ".json" if args.json else ".md" if args.type == "markdown" else ".txt"
                    out_path = os.path.join(args.output, base + ext)
                    with open(out_path, "w", encoding="utf-8") as out_file:
                        out_file.write(content)
                    print(f"Successfully saved parsed content to: {out_path}", file=sys.stderr)
            else:
                # If single output file and multiple inputs, concatenate them
                concatenated = ""
                for idx, (input_file, content, _) in enumerate(results):
                    if len(results) > 1:
                        concatenated += f"<!-- START OF FILE: {input_file} -->\n"
                    concatenated += content
                    if len(results) > 1:
                        concatenated += f"\n<!-- END OF FILE: {input_file} -->\n\n"
                
                with open(args.output, "w", encoding="utf-8") as out_file:
                    out_file.write(concatenated)
                print(f"Successfully saved parsed content to: {args.output}", file=sys.stderr)
        else:
            for idx, (input_file, content, _) in enumerate(results):
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
