/**
 * Simple Query Example
 *
 * Basic usage of LLM client without ACE framework
 */

import { LLMClient, LLMServerManager } from '../src';

async function main() {
  // Start local LLM server
  console.log('Starting local LLM server...');
  const serverManager = new LLMServerManager({
    port: 42002,
    pythonPath: process.env.LLM_PYTHON_PATH || './venv/bin/python',
    serverScript: './llm_server/server.py',
    modelName: 'gpt-oss-20b',
    modelPath: './models'
  });

  await serverManager.start();
  console.log('✅ Server started\n');

  // Create client
  const client = new LLMClient({
    localServer: {
      enabled: true,
      port: 42002
    },
    defaults: {
      maxMessages: 10,
      maxTurns: 1,
      queryTimeout: 60000
    }
  });

  // Listen for thinking blocks
  client.on('thinking', (block) => {
    console.log(`\n🧠 [Thinking] ${block.content.substring(0, 200)}...`);
  });

  // Simple query
  console.log('Querying LLM...\n');
  try {
    const response = await client.queryDirect(
      'Explain what a recursive function is in 2 sentences.',
      {
        temperature: 0.7,
        context: 'simple-example'
      }
    );

    console.log('\n📝 Response:');
    console.log(response);
  } catch (error) {
    console.error('❌ Query failed:', error);
  }

  // Clean up
  console.log('\n\nShutting down...');
  client.shutdown();
  await serverManager.stop();
  console.log('✅ Done');
}

main().catch(console.error);
