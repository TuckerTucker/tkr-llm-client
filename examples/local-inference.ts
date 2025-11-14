#!/usr/bin/env tsx
/**
 * Example: Local LLM Inference
 *
 * Demonstrates how to use the LocalLLMClient to run inference
 * against the local MLX server.
 *
 * Prerequisites:
 * 1. Start the server: ./start-llm-server.sh
 * 2. Run this script: npx tsx examples/local-inference.ts
 */

import { LocalLLMClient } from '../src/client/LocalLLMClient';

async function main() {
  console.log('🚀 Local LLM Inference Example\n');

  // Create client
  const client = new LocalLLMClient('http://localhost:42002');

  // Check server health
  console.log('📊 Checking server health...');
  const healthy = await client.isHealthy();
  console.log(`   Status: ${healthy ? '✅ Healthy' : '❌ Unhealthy'}\n`);

  if (!healthy) {
    console.error('❌ Server is not healthy. Please start it with: ./start-llm-server.sh');
    process.exit(1);
  }

  // Example 1: Simple query
  console.log('💬 Example 1: Simple Question');
  console.log('   Question: "What is TypeScript?"\n');

  const response1 = await client.query('What is TypeScript in one sentence?', {
    temperature: 0.7,
  });
  console.log(response1);
  console.log('\n');

  // Example 2: With system prompt
  console.log('\n💬 Example 2: With System Prompt');
  console.log('   System: "You are a pirate. Speak like one."');
  console.log('   Question: "Tell me about JavaScript"\n');

  const response2 = await client.query('Tell me about JavaScript', {
    systemPrompt: 'You are a pirate. Speak like one.',
    temperature: 0.8,
  });
  console.log(response2);
  console.log('\n');

  // Example 3: Direct query
  console.log('\n💬 Example 3: Math Question');
  console.log('   Question: "What is 2+2?"\n');

  const response3 = await client.query('What is 2+2? Answer briefly.');
  console.log(`   Response: ${response3}\n`);

  // Example 4: Complex question
  console.log('\n💬 Example 4: Complex Question');
  console.log('   Question: "Explain how to make coffee"\n');

  const response4 = await client.query('Explain how to make coffee step by step');
  console.log(response4);

  console.log('\n✅ Done!');
}

main().catch(console.error);
