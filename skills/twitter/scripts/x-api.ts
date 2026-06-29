import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

function rawPercentEncode(str: string): string {
  return encodeURIComponent(str)
    .replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());
}

function generateOAuthHeader(
  method: string,
  url: string,
  queryParams: Record<string, string>,
  consumerKey: string,
  consumerSecret: string,
  token: string,
  tokenSecret: string
): string {
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: consumerKey,
    oauth_nonce: crypto.randomBytes(32).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: token,
    oauth_version: '1.0'
  };

  const allParams = { ...queryParams, ...oauthParams };
  const sortedKeys = Object.keys(allParams).sort();
  const parameterString = sortedKeys
    .map(key => `${rawPercentEncode(key)}=${rawPercentEncode(allParams[key]!)}`)
    .join('&');

  const signatureBaseString = [
    method.toUpperCase(),
    rawPercentEncode(url),
    rawPercentEncode(parameterString)
  ].join('&');

  const signingKey = [
    rawPercentEncode(consumerSecret),
    rawPercentEncode(tokenSecret)
  ].join('&');

  const signature = crypto
    .createHmac('sha1', signingKey)
    .update(signatureBaseString)
    .digest('base64');

  oauthParams.oauth_signature = signature;

  const authorizationHeader = 'OAuth ' + Object.keys(oauthParams)
    .sort()
    .map(key => `${rawPercentEncode(key)}="${rawPercentEncode(oauthParams[key]!)}"`)
    .join(', ');

  return authorizationHeader;
}

function parseYaml(content: string): any {
  const result: any = {};
  const lines = content.split('\n');
  let currentKey = '';
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    
    const indent = line.length - line.trimStart().length;
    
    if (indent === 0) {
      const parts = trimmed.split(':');
      const key = parts[0]?.trim();
      let val: any = parts.slice(1).join(':').trim();
      if (val === '') {
        result[key] = {};
        currentKey = key;
      } else {
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        result[key] = val;
        currentKey = '';
      }
    } else if (indent > 0 && currentKey) {
      const parts = trimmed.split(':');
      const key = parts[0]?.trim();
      let val: any = parts.slice(1).join(':').trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (val === 'true') val = true;
      if (val === 'false') val = false;
      result[currentKey][key] = val;
    }
  }
  return result;
}

interface TwitterConfig {
  x_api: {
    api_key: string;
    api_key_secret: string;
    access_token: string;
    access_token_secret: string;
    client_id?: string;
    client_secret?: string;
  };
  state: {
    use_api: boolean;
    last_reset_month: string;
  };
}

function getTwitterYamlPath(): string {
  return path.join(os.homedir(), '.config', 'hkp-skills', 'twitter.yaml');
}

function serializeToYaml(obj: any): string {
  let yaml = '';
  if (obj.x_api) {
    yaml += 'x_api:\n';
    yaml += `  api_key: "${obj.x_api.api_key || ''}"\n`;
    yaml += `  api_key_secret: "${obj.x_api.api_key_secret || ''}"\n`;
    yaml += `  access_token: "${obj.x_api.access_token || ''}"\n`;
    yaml += `  access_token_secret: "${obj.x_api.access_token_secret || ''}"\n`;
    if (obj.x_api.client_id) {
      yaml += `  client_id: "${obj.x_api.client_id}"\n`;
    }
    if (obj.x_api.client_secret) {
      yaml += `  client_secret: "${obj.x_api.client_secret}"\n`;
    }
  }
  if (obj.state) {
    yaml += '\nstate:\n';
    yaml += `  use_api: ${obj.state.use_api}\n`;
    yaml += `  last_reset_month: "${obj.state.last_reset_month || ''}"\n`;
  }
  return yaml;
}

function loadConfig(): TwitterConfig {
  const p = getTwitterYamlPath();
  const currentMonth = new Date().toISOString().substring(0, 7); // "YYYY-MM"
  const defaultConfig: TwitterConfig = {
    x_api: { api_key: '', api_key_secret: '', access_token: '', access_token_secret: '' },
    state: { use_api: true, last_reset_month: currentMonth }
  };
  
  if (!fs.existsSync(p)) {
    fs.writeFileSync(p, serializeToYaml(defaultConfig), 'utf8');
    return defaultConfig;
  }
  
  try {
    const content = fs.readFileSync(p, 'utf8');
    const parsed = parseYaml(content);
    const config: TwitterConfig = {
      x_api: parsed.x_api || defaultConfig.x_api,
      state: parsed.state || defaultConfig.state
    };
    if (config.state.last_reset_month !== currentMonth) {
      config.state.use_api = true;
      config.state.last_reset_month = currentMonth;
      fs.writeFileSync(p, serializeToYaml(config), 'utf8');
    }
    return config;
  } catch (err) {
    return defaultConfig;
  }
}

function saveConfig(config: TwitterConfig) {
  try {
    fs.writeFileSync(getTwitterYamlPath(), serializeToYaml(config), 'utf8');
  } catch {}
}

async function main() {
  const tweetText = process.argv[2];
  if (!tweetText) {
    console.error('Error: Missing tweet text.');
    process.exit(2);
  }

  // Load unified config
  const config = loadConfig();

  // Check state first (Circuit Breaker pattern)
  if (!config.state.use_api) {
    console.log('Circuit breaker active: Skipping API, falling back directly to Chrome.');
    process.exit(3); // Special exit code: bypass API and fallback directly
  }

  const creds = config.x_api;
  if (!creds || !creds.api_key || !creds.api_key_secret || !creds.access_token || !creds.access_token_secret) {
    console.log('API fallback: X API credentials not fully configured in twitter.yaml.');
    process.exit(3);
  }

  const url = 'https://api.twitter.com/2/tweets';
  const method = 'POST';

  try {
    const oauthHeader = generateOAuthHeader(
      method,
      url,
      {},
      creds.api_key,
      creds.api_key_secret,
      creds.access_token,
      creds.access_token_secret
    );

    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': oauthHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text: tweetText })
    });

    const resBody = await response.text();
    if (!response.ok) {
      // If billing issue (402), rate limit (429), or unauthorized (403), flip switch to false
      if (response.status === 402 || response.status === 429 || response.status === 403) {
        console.log(`X API returned error status ${response.status}. Tripping circuit breaker (use_api = false).`);
        config.state.use_api = false;
        saveConfig(config);
      }
      throw new Error(`X API returned status ${response.status}: ${resBody}`);
    }

    console.log('SUCCESS: Tweet posted via X API.');
    console.log(resBody);
    process.exit(0);
  } catch (err) {
    console.error('API Error:', err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}

main();
