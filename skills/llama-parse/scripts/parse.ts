#!/usr/bin/env node
/**
 * LlamaParse Helper Script (TypeScript)
 * Parses PDF, Word, PowerPoint, Excel, and image documents into Markdown or JSON
 * using the unified @llamaindex/llama-cloud SDK.
 */

import LlamaCloud from "@llamaindex/llama-cloud";
import { readFile, writeFile, mkdir } from "fs/promises";
import { basename, extname, join, dirname } from "path";

// Helper to print help/usage
function printHelp(): void {
  console.log(`
Usage: npx tsx parse.ts [options] <input_files...>

Options:
  -o, --output <path>       Path to output file or directory. If a directory, outputs are written there with matching basenames.
  -k, --api-key <key>       LlamaCloud API key. If omitted, reads LLAMA_CLOUD_API_KEY environment variable.
  -t, --type <type>         Result type: "markdown" or "text" (default: "markdown").
  --tier <tier>             Parsing tier: "fast", "cost_effective", "agentic", "agentic_plus" (default: "agentic").
  -i, --instruction <text>  Custom parsing instruction (prompt) to guide the parser.
  -l, --language <lang>     Language code for OCR (e.g. "en", "ch_sim").
  -p, --pages <ranges>      Target pages to parse (comma-separated page numbers/ranges, e.g. "0,2-5").
  -j, --json                Output raw JSON results instead of text/markdown.
  -d, --download-images     Download extracted images/screenshots to the output directory.
  -v, --verbose             Print verbose logs.
  --show-usage              Only query and print the LlamaParse Free Plan credit usage, then exit.
  -h, --help                Show this help message.
`);
}

// Helper to query usage
async function printFreePlanUsage(apiKey: string, prefix = ""): Promise<void> {
  try {
    // 1. Get organization ID
    const orgsRes = await fetch("https://api.cloud.llamaindex.ai/api/v1/organizations", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!orgsRes.ok) return;
    const orgs = (await orgsRes.json()) as any[];
    if (!orgs || orgs.length === 0) return;
    const orgId = orgs[0].id;

    // 2. Get usage details
    const usageRes = await fetch(`https://api.cloud.llamaindex.ai/api/v1/organizations/${orgId}/usage`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!usageRes.ok) return;
    const usageData = (await usageRes.json()) as any;

    // 3. Extract and display
    const freeCredits = usageData.usage?.active_free_credits_usage;
    if (freeCredits && freeCredits.length > 0) {
      const start = freeCredits[0].starting_balance ?? 0;
      const remain = freeCredits[0].remaining_balance ?? 0;
      const used = start - remain;
      console.warn(`${prefix}[LlamaParse Free Plan Usage]: Monthly limit is ${start} credits. Currently used: ${used} credits (${remain} remaining).`);
      if (remain < 100) {
        console.warn(`[WARNING] LlamaParse remaining credits are below 100! Current remaining: ${remain} credits.`);
      }
    }
  } catch (err) {
    // Gracefully ignore billing query failures
  }
}

async function main() {
  const args = process.argv.slice(2);
  const inputFiles: string[] = [];
  let output: string | undefined;
  let apiKey = process.env.LLAMA_CLOUD_API_KEY;
  let type: "markdown" | "text" = "markdown";
  let tier: "fast" | "cost_effective" | "agentic" | "agentic_plus" = "agentic";
  let instruction: string | undefined;
  let language: string | undefined;
  let pages: string | undefined;
  let json = false;
  let downloadImages = false;
  let verbose = false;
  let showUsage = false;

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "-h" || arg === "--help") {
      printHelp();
      process.exit(0);
    } else if (arg === "--show-usage") {
      showUsage = true;
    } else if (arg === "-o" || arg === "--output") {
      output = args[++i];
    } else if (arg === "-k" || arg === "--api-key") {
      apiKey = args[++i];
    } else if (arg === "-t" || arg === "--type") {
      const val = args[++i];
      if (val === "text" || val === "markdown") {
        type = val;
      } else {
        console.error(`Error: Invalid type value: ${val}`);
        process.exit(1);
      }
    } else if (arg === "--tier") {
      const val = args[++i];
      if (val === "fast" || val === "cost_effective" || val === "agentic" || val === "agentic_plus") {
        tier = val;
      } else {
        console.error(`Error: Invalid tier: ${val}`);
        process.exit(1);
      }
    } else if (arg === "-i" || arg === "--instruction") {
      instruction = args[++i];
    } else if (arg === "-l" || arg === "--language") {
      language = args[++i];
    } else if (arg === "-p" || arg === "--pages") {
      pages = args[++i];
    } else if (arg === "-j" || arg === "--json") {
      json = true;
    } else if (arg === "-d" || arg === "--download-images") {
      downloadImages = true;
    } else if (arg === "-v" || arg === "--verbose") {
      verbose = true;
    } else if (arg.startsWith("-")) {
      // Deprecated or unknown flags
      if (arg === "--use-vendor-model") {
        if (verbose) console.warn("[Info] Deprecated flag --use-vendor-model mapped to tier='agentic'.");
        tier = "agentic";
      } else if (arg === "--vendor-model-name") {
        i++; // skip model name value
        if (verbose) console.warn("[Warning] Deprecated flag --vendor-model-name ignored. Model selection is handled via --tier.");
      } else {
        console.error(`Error: Unknown option ${arg}`);
        printHelp();
        process.exit(1);
      }
    } else {
      inputFiles.push(arg);
    }
  }

  if (!apiKey) {
    console.error("Error: LLAMA_CLOUD_API_KEY is not set and no --api-key flag was provided.");
    console.error("Please obtain an API key from https://cloud.llamaindex.ai/ and configure it.");
    process.exit(1);
  }

  if (showUsage) {
    await printFreePlanUsage(apiKey);
    process.exit(0);
  }

  if (inputFiles.length === 0) {
    console.error("Error: No input files provided.");
    printHelp();
    process.exit(1);
  }

  // Initialize client
  const client = new LlamaCloud({ apiKey });

  try {
    const results: Array<{ inputFile: string; content: string; res: any }> = [];

    for (const inputFile of inputFiles) {
      if (verbose) console.warn(`Uploading '${inputFile}' to Llama Cloud...`);

      // 1. Upload file
      const fileBuffer = await readFile(inputFile);
      const fileName = basename(inputFile);
      const fileBlob = new File([fileBuffer], fileName);
      const fileObj = await client.files.create({
        file: fileBlob,
        purpose: "parse",
      });
      const fileId = fileObj.id;

      if (verbose) console.warn(`Uploaded successfully. File ID: {fileId}. Starting parse job...`);

      // 2. Build options
      const agenticOptions = instruction ? { custom_prompt: instruction } : undefined;
      const processingOptions = language ? { ocr_parameters: { languages: [language] } } : undefined;
      const pageRanges = pages ? { target_pages: pages } : undefined;
      const outputOptions = downloadImages ? { images_to_save: ["screenshot" as const] } : undefined;

      // 3. Start parsing job
      const job = await client.v_2.parseFile({
        file_id: fileId,
        tier,
        version: "latest",
        agentic_options: agenticOptions,
        processing_options: processingOptions,
        page_ranges: pageRanges,
        output_options: outputOptions,
      });

      if (verbose) console.warn(`Job ID: ${job.id}. Polling status...`);

      // 4. Poll for completion
      const expand: string[] = json ? ["items"] : [type + "_full"];
      if (downloadImages) {
        expand.push("images_content_metadata");
      }

      let res: any;
      while (true) {
        res = await client.v_2.getParseJob(job.id, { expand });
        const status = res.job?.status;

        if (verbose) console.warn(`Current status: ${status}`);

        if (status === "COMPLETED") {
          break;
        } else if (status === "FAILED" || status === "CANCELLED") {
          throw new Error(`Parsing job failed/cancelled with status '${status}'. Error: ${res.job?.error_message}`);
        }

        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      // 5. Retrieve content
      let outputContent = "";
      if (json) {
        outputContent = JSON.stringify(res.items ?? {}, null, 2);
      } else {
        outputContent = type === "markdown" ? (res.markdown_full ?? "") : (res.text_full ?? "");
      }

      results.push({ inputFile, content: outputContent, res });

      // 6. Download images if requested
      if (downloadImages && res.images_content_metadata?.images) {
        for (const img of res.images_content_metadata.images) {
          if (img.presigned_url || img.url) {
            const downloadUrl = img.presigned_url || img.url;
            const imgName = basename(downloadUrl.split("?")[0]); // Get basename without query params

            let imgPath = imgName;
            if (output) {
              // Simple check if output is a directory (has no extension)
              const hasExt = extname(output) !== "";
              if (!hasExt) {
                imgPath = join(output, imgName);
              } else {
                imgPath = join(dirname(output), imgName);
              }
            }

            if (verbose) console.warn(`Downloading image: ${imgName} -> ${imgPath}`);

            try {
              const response = await fetch(downloadUrl, {
                headers: { Authorization: `Bearer ${apiKey}` },
              });
              if (response.ok) {
                const buffer = Buffer.from(await response.arrayBuffer());
                await writeFile(imgPath, buffer);
              } else {
                console.error(`Warning: Failed to download image ${imgName}. Status: ${response.status}`);
              }
            } catch (imgErr) {
              console.error(`Warning: Failed to download image ${imgName}:`, imgErr);
            }
          }
        }
      }

      await printFreePlanUsage(apiKey, "\n");
    }

    // 7. Handle outputs writing
    if (output) {
      const hasExt = extname(output) !== "";
      if (!hasExt) {
        // Output path is a directory
        await mkdir(output, { recursive: true });
        for (const { inputFile, content } of results) {
          const baseName = basename(inputFile, extname(inputFile));
          const ext = json ? ".json" : type === "markdown" ? ".md" : ".txt";
          const outPath = join(output, baseName + ext);
          await writeFile(outPath, content, "utf-8");
          console.error(`Successfully saved parsed content to: ${outPath}`);
        }
      } else {
        // Output path is a single file (concatenate if multiple files parsed)
        let concatenated = "";
        for (const { inputFile, content } of results) {
          if (results.length > 1) {
            concatenated += `<!-- START OF FILE: ${inputFile} -->\n`;
          }
          concatenated += content;
          if (results.length > 1) {
            concatenated += `\n<!-- END OF FILE: ${inputFile} -->\n\n`;
          }
        }
        await writeFile(output, concatenated, "utf-8");
        console.error(`Successfully saved parsed content to: ${output}`);
      }
    } else {
      // Print to stdout
      for (let idx = 0; idx < results.length; idx++) {
        const { inputFile, content } = results[idx];
        if (results.length > 1) {
          console.error(`--- File: ${inputFile} ---`);
        }
        console.log(content);
        if (results.length > 1 && idx < results.length - 1) {
          console.error("\n" + "=".repeat(40) + "\n");
        }
      }
    }
  } catch (err: any) {
    console.error("Error occurred during parsing:", err.message || err);
    process.exit(1);
  }
}

main();
