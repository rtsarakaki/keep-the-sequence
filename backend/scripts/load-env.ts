/**
 * Load environment variables from .env.local file for local development
 * This script should be run before any other scripts that need AWS credentials
 */

import * as fs from 'fs';
import * as path from 'path';

const envLocalPath = path.join(__dirname, '..', '.env.local');

if (fs.existsSync(envLocalPath)) {
  const envFile = fs.readFileSync(envLocalPath, 'utf-8');
  const lines = envFile.split('\n');
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Skip empty lines and comments
    if (!trimmedLine || trimmedLine.startsWith('#')) {
      continue;
    }
    
    // Parse KEY=VALUE format
    const equalIndex = trimmedLine.indexOf('=');
    if (equalIndex === -1) {
      continue;
    }
    
    const key = trimmedLine.substring(0, equalIndex).trim();
    const value = trimmedLine.substring(equalIndex + 1).trim();
    
    // Remove quotes if present
    const cleanValue = value.replace(/^["']|["']$/g, '');
    
    // Set environment variable if not already set
    if (!process.env[key]) {
      process.env[key] = cleanValue;
    }
  }
  
  console.log('✅ Environment variables loaded from .env.local');
} else {
  console.warn('⚠️  .env.local file not found. Using system environment variables.');
}

