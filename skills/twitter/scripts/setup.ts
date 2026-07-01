import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

function setup() {
  const configDir = path.join(os.homedir(), '.config', 'skills');
  const configPath = path.join(configDir, 'twitter.yaml');

  console.log(`Setting up skills twitter configuration...`);

  // 1. Create directory if not exists
  if (!fs.existsSync(configDir)) {
    console.log(`Creating directory: ${configDir}`);
    fs.mkdirSync(configDir, { recursive: true });
  }

  // 2. Create template twitter.yaml if not exists
  if (!fs.existsSync(configPath)) {
    console.log(`Creating template configuration: ${configPath}`);
    const currentMonth = new Date().toISOString().substring(0, 7); // "YYYY-MM"
    const template = `# Twitter API credentials and state configuration for skills

x_api:
  api_key: "YOUR_CONSUMER_API_KEY_HERE"
  api_key_secret: "YOUR_CONSUMER_API_KEY_SECRET_HERE"
  access_token: "YOUR_ACCESS_TOKEN_HERE"
  access_token_secret: "YOUR_ACCESS_TOKEN_SECRET_HERE"

state:
  use_api: true
  last_reset_month: "${currentMonth}"
`;
    fs.writeFileSync(configPath, template, 'utf8');
    console.log(`Successfully initialized twitter configuration template.`);
    console.log(`IMPORTANT: Please open ${configPath} and fill in your X API credentials to use the API mode.`);
  } else {
    console.log(`Twitter configuration already exists at: ${configPath}`);
    console.log(`No changes were made to preserve your existing credentials.`);
  }
}

setup();
