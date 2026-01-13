/**
 * ============================================================
 * Run Database Migrations Script
 * ============================================================
 * 
 * This script runs the database migrations for the multi-vendor system
 * using Supabase REST API (PostgREST).
 * 
 * Usage:
 *   node scripts/run-migrations.js
 * 
 * Requirements:
 *   - NEXT_PUBLIC_SUPABASE_URL in .env.local
 *   - SUPABASE_SERVICE_ROLE_KEY in .env.local
 * ============================================================
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Load .env.local manually (simple parser)
function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  const env = {};
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').replace(/^["']|["']$/g, '');
        env[key.trim()] = value.trim();
      }
    }
  });
  return env;
}

// Load environment variables
const envLocal = loadEnvFile(path.join(__dirname, '../.env.local'));
Object.keys(envLocal).forEach(key => {
  if (!process.env[key]) {
    process.env[key] = envLocal[key];
  }
});

// ============================================================
// Configuration
// ============================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Error: Missing Supabase credentials');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

// Extract project reference from URL
const projectRef = SUPABASE_URL.match(/https?:\/\/([^.]+)\.supabase\.co/)?.[1];
if (!projectRef) {
  console.error('❌ Error: Invalid Supabase URL format');
  console.error('Expected format: https://<project-ref>.supabase.co');
  process.exit(1);
}

// ============================================================
// Load Migration File
// ============================================================

const migrationFile = path.join(__dirname, '../supabase/migrations/RUN_ALL_MIGRATIONS.sql');

if (!fs.existsSync(migrationFile)) {
  console.error(`❌ Error: Migration file not found: ${migrationFile}`);
  process.exit(1);
}

const migrationSQL = fs.readFileSync(migrationFile, 'utf-8');

// ============================================================
// Helper: Make HTTP Request
// ============================================================

function makeRequest(url, options, body = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;

    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        ...options.headers,
      },
    };

    const req = client.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const json = data ? JSON.parse(data) : null;
          resolve({ status: res.statusCode, data: json, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: data, headers: res.headers });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

// ============================================================
// Execute SQL via Supabase REST API
// ============================================================

async function executeSQL(sql) {
  // Supabase doesn't support raw SQL execution via REST API directly
  // We need to use the Management API or create a function
  // For now, we'll use a workaround: create a temporary function
  
  // Alternative: Use Supabase Dashboard SQL Editor URL
  console.log('\n⚠️  Note: Supabase REST API does not support raw SQL execution.');
  console.log('   Please use one of these methods:\n');
  console.log('   Method 1: Copy-Paste in Supabase Dashboard');
  console.log('   1. Open: https://app.supabase.com/project/' + projectRef + '/sql/new');
  console.log('   2. Copy content from: supabase/migrations/RUN_ALL_MIGRATIONS.sql');
  console.log('   3. Paste and Run\n');
  
  console.log('   Method 2: Use Supabase CLI');
  console.log('   supabase db push\n');
  
  return false;
}

// ============================================================
// Run Migration
// ============================================================

async function runMigration() {
  console.log('🚀 Database Migration Script\n');
  console.log('📋 Migration file: RUN_ALL_MIGRATIONS.sql\n');

  // Check if we can connect to Supabase
  try {
    const testUrl = `${SUPABASE_URL}/rest/v1/`;
    const response = await makeRequest(testUrl, { method: 'GET' });
    
    if (response.status === 200 || response.status === 404) {
      console.log('✅ Connected to Supabase\n');
    } else {
      console.log('⚠️  Warning: Could not verify Supabase connection\n');
    }
  } catch (error) {
    console.log('⚠️  Warning: Could not connect to Supabase');
    console.log('   Error:', error.message, '\n');
  }

  // Since Supabase REST API doesn't support raw SQL, show instructions
  await executeSQL(migrationSQL);

  console.log('📝 Migration SQL is ready in:');
  console.log('   ' + migrationFile + '\n');
  
  console.log('💡 Quick Copy Command (Windows):');
  console.log('   type "' + migrationFile.replace(/\//g, '\\') + '" | clip\n');
  
  console.log('💡 Quick Copy Command (Mac/Linux):');
  console.log('   cat "' + migrationFile + '" | pbcopy\n');

  return false;
}

// ============================================================
// Main
// ============================================================

if (require.main === module) {
  runMigration().then(() => {
    console.log('✅ Script completed. Please run the migration manually in Supabase Dashboard.');
  }).catch((error) => {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  });
}

module.exports = { runMigration };
