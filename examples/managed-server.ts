#!/usr/bin/env tsx
/**
 * Example: Managed Server
 *
 * Demonstrates automatic server lifecycle management.
 * The LLMServerManager handles starting/stopping the Python server.
 *
 * Usage: npx tsx examples/managed-server.ts
 */

import { LLMClient } from '../src/client/LLMClient';
import { LLMServerManager } from '../src/server/LLMServerManager';

async function main() {
  console.log('🚀 Managed Server Example\n');

  // Create server manager
  const serverManager = new LLMServerManager({
    port: 42002,
    pythonPath: 'python3',
    serverScript: 'llm_server/server.py',
    modelName: 'mlx-community/gpt-oss-20b-MXFP4-Q8',
  });

  // Listen to server events
  serverManager.on('stdout', (data) => console.log(`[SERVER] ${data}`));
  serverManager.on('stderr', (data) => console.error(`[SERVER] ${data}`));

  try {
    // Start server automatically
    console.log('📡 Starting server...');
    await serverManager.start();
    console.log('✅ Server started!\n');

    // Create client
    const client = new LLMClient({
      localServer: {
        enabled: true,
        baseURL: 'http://localhost:42002',
      },
    });

    // Run inference
    console.log('💬 Running inference...\n');

    for await (const msg of client.query('Explain recursion in one sentence')) {
      if (msg.type === 'text') {
        process.stdout.write(msg.text);
      }
    }

    console.log('\n\n✅ Inference complete!');

    // Cleanup
    await client.shutdown();
    console.log('🔄 Stopping server...');
    await serverManager.stop();
    console.log('✅ Server stopped');

  } catch (error) {
    console.error('❌ Error:', error);
    await serverManager.stop();
    process.exit(1);
  }
}

main().catch(console.error);
