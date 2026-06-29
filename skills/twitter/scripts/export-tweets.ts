import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

function runAppleScript(script: string): string {
  const tempFile = '/tmp/temp_run.scpt';
  fs.writeFileSync(tempFile, script, 'utf8');
  try {
    return execSync(`osascript ${tempFile}`, { encoding: 'utf8' }).trim();
  } catch (err) {
    throw new Error(`AppleScript execution failed: ${err instanceof Error ? err.message : String(err)}`);
  } finally {
    try { fs.unlinkSync(tempFile); } catch {}
  }
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function scrapeTweets(profileUrl: string, maxScrolls = 40): Promise<Record<string, { text: string; date: string }>> {
  console.log(`Opening profile tab: ${profileUrl}`);
  
  // 1. Open and activate tab
  runAppleScript(`
    tell application "Google Chrome"
      activate
      tell window 1
        make new tab with properties {URL:"${profileUrl}"}
        set tabCount to count of tabs
        set active tab index to tabCount
      end tell
    end tell
  `);
  
  console.log('Waiting 8 seconds for page to load...');
  await sleep(8000);
  
  // 2. Initialize scraped tweets container in page context
  runAppleScript(`
    tell application "Google Chrome"
      execute front window's active tab javascript "window.__scrapedTweets = {};"
    end tell
  `);
  
  let consecutiveNoNew = 0;
  
  for (let scroll = 1; scroll <= maxScrolls; scroll++) {
    const jsPayload = `
      (function() {
        var articles = document.querySelectorAll('article');
        var newFound = 0;
        for (var i = 0; i < articles.length; i++) {
          var art = articles[i];
          var aLink = art.querySelector('a[href*="/status/"]');
          var textEl = art.querySelector('[data-testid="tweetText"]');
          var timeEl = art.querySelector('time');
          
          if (aLink && timeEl) {
            var href = aLink.getAttribute('href');
            var url = 'https://x.com' + href.split('?')[0];
            var text = textEl ? textEl.textContent.trim() : '';
            var dateStr = timeEl.getAttribute('datetime');
            
            if (!window.__scrapedTweets[url]) {
              window.__scrapedTweets[url] = { text: text, date: dateStr };
              newFound++;
            }
          }
        }
        window.scrollBy(0, 1200);
        return newFound;
      })()
    `.trim();

    // Use a temp file for Javascript payload to avoid single-quote escaping issues in AppleScript
    fs.writeFileSync('/tmp/tweet_scrape.js', jsPayload, 'utf8');

    const newFoundStr = runAppleScript(`
      tell application "Google Chrome"
        set js to read "/tmp/tweet_scrape.js"
        set result to execute front window's active tab javascript js
        return result
      end tell
    `);
    
    try { fs.unlinkSync('/tmp/tweet_scrape.js'); } catch {}
    
    const newFound = parseInt(newFoundStr || '0', 10);
    console.log(`Scroll ${scroll}/${maxScrolls}: Found ${newFound} new tweets.`);
    
    if (newFound === 0) {
      consecutiveNoNew++;
    } else {
      consecutiveNoNew = 0;
    }
    
    // If we hit bottom (no new tweets found for 5 consecutive scrolls), stop scraping
    if (consecutiveNoNew >= 5) {
      console.log('No new tweets found for 5 consecutive scrolls. Reached the bottom.');
      break;
    }
    
    await sleep(2000);
  }
  
  // 3. Retrieve final scraped tweets
  const resultsJson = runAppleScript(`
    tell application "Google Chrome"
      execute front window's active tab javascript "JSON.stringify(window.__scrapedTweets);"
    end tell
  `);
  
  // 4. Close the profile tab
  runAppleScript(`
    tell application "Google Chrome"
      close active tab of window 1
    end tell
  `);
  
  return JSON.parse(resultsJson || '{}');
}

interface TweetRecord {
  text: string;
  time: string;
  tweetId: string;
  url: string;
}

function formatYamlString(str: string): string {
  return JSON.stringify(str);
}

function convertToYaml(tweets: TweetRecord[]): string {
  let yaml = 'tweets:\n';
  for (const tweet of tweets) {
    yaml += `  - text: ${formatYamlString(tweet.text)}\n`;
    yaml += `    time: "${tweet.time}"\n`;
    yaml += `    tweetId: "${tweet.tweetId}"\n`;
    yaml += `    url: "${tweet.url}"\n`;
  }
  return yaml;
}

async function main() {
  const profileUrl = 'https://x.com/hankunpeng';
  const targetDir = '/Users/alex/twitter';
  const targetFile = path.join(targetDir, 'twitter.yaml');
  
  // Dates for filtering: user can filter by start/end date if passed
  const startDateStr = process.argv[2]; // e.g. "2026-06-01"
  const endDateStr = process.argv[3];   // e.g. "2026-06-30"
  
  const startDate = startDateStr ? new Date(startDateStr) : null;
  const endDate = endDateStr ? new Date(endDateStr) : null;
  
  try {
    const rawTweets = await scrapeTweets(profileUrl);
    const filteredTweets: TweetRecord[] = [];
    let totalCount = 0;
    let filteredCount = 0;
    
    for (const [url, data] of Object.entries(rawTweets)) {
      totalCount++;
      const tweetDate = new Date(data.date);
      
      let include = true;
      if (startDate && tweetDate < startDate) include = false;
      if (endDate && tweetDate > endDate) include = false;
      
      if (include) {
        const tweetId = url.split('/status/')[1] || '';
        filteredTweets.push({
          text: data.text,
          time: data.date,
          tweetId: tweetId,
          url: url
        });
        filteredCount++;
      }
    }
    
    console.log(`Scraped ${totalCount} total tweets. Filtered to ${filteredCount} tweets.`);
    
    // Create target directory if it doesn't exist
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    const yamlContent = convertToYaml(filteredTweets);
    fs.writeFileSync(targetFile, yamlContent, 'utf8');
    console.log(`Successfully saved ${filteredCount} tweets to ${targetFile}`);
    
  } catch (err) {
    console.error('Error occurred:', err);
    process.exit(1);
  }
}

main();
