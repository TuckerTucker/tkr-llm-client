#!/usr/bin/env tsx
/**
 * Quick Test Script
 *
 * Simple one-liner to test local LLM server
 * Usage: npx tsx examples/quick-test.ts
 */

import { LocalLLMClient } from '../src/client/LocalLLMClient';

async function main() {
  const client = new LocalLLMClient('http://localhost:42002');

  console.log('Testing local LLM server...\n');

  const response = await client.query('Say hello in 5 words');

  console.log(response);
  console.log('\n✅ Success!');
}

main().catch(console.error);
