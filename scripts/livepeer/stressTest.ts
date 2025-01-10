#!/usr/bin/env node

/*
 * This script demonstrates a basic async stress test against the Livepeer LLM gateway.
 * It makes multiple concurrent requests to test performance and logs timing data.
 */

import axios, { AxiosResponse } from 'axios';
import fs from 'fs';
import path from 'path';

// Save initial prompt tokens to track usage
const SYSTEM_PROMPT_TOKENS = 32; // Estimated tokens for system prompt
const USER_PROMPT_TOKENS = 1024; // Estimated tokens for user prompt
const TOTAL_PROMPT_TOKENS = SYSTEM_PROMPT_TOKENS + USER_PROMPT_TOKENS;

const totalRequests: number = Number(process.env.TOTAL_REQUESTS) || 50;
const logFile: string = `stress_test_results_${new Date().toISOString().replace(/[:.]/g, '-')}.log`;

interface RequestResult {
  success: boolean;
  duration: number;
}

interface RequestPayload {
  model: string;
  messages: {
    role: string;
    content: string;
  }[];
  max_tokens: number;
  stream: boolean;
}

/**
 * A helper function to perform a single request and log timing data
 */
async function makeRequest(url: string, payload: RequestPayload, requestNum: number): Promise<RequestResult> {
  const startTime: number = Date.now();
  const startTimeStr: string = new Date(startTime).toISOString();

  console.log(`\n[Request ${requestNum}] Starting request to ${url}`);
  console.log(`[Request ${requestNum}] Payload:`, JSON.stringify(payload, null, 2));

  try {
    const response: AxiosResponse = await axios({
      method: 'post',
      url: url,
      headers: {
        'accept': 'text/event-stream',
        'Content-Type': 'application/json'
      },
      data: payload,
      timeout: 300000
    });

    console.log(`[Request ${requestNum}] Response status: ${response.status}`);
    console.log(`[Request ${requestNum}] Response data:`, JSON.stringify(response.data, null, 2));

    // Add a small delay between requests to prevent overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 1000));

    const endTime: number = Date.now();
    const endTimeStr: string = new Date(endTime).toISOString();
    const duration: number = endTime - startTime;

    const logEntry: string = `Request ${requestNum}: Start=${startTimeStr}, End=${endTimeStr}, Duration=${duration}ms\n`;
    fs.appendFileSync(logFile, logEntry);

    return { success: true, duration };
  } catch (error: any) {
    console.error(`[Request ${requestNum}] Failed with error:`, {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      code: error.code,
      url: url,
      payload: payload
    });

    const endTime: number = Date.now();
    const endTimeStr: string = new Date(endTime).toISOString();
    const duration: number = endTime - startTime;

    const logEntry: string = `Request ${requestNum} (FAILED): Start=${startTimeStr}, End=${endTimeStr}, Duration=${duration}ms, Error=${error.message}\n`;
    fs.appendFileSync(logFile, logEntry);

    return { success: false, duration };
  }
}

/**
 * The main function orchestrates running the stress test.
 */
async function main(): Promise<void> {
  // Clear previous log file
  fs.writeFileSync(logFile, '--- New Stress Test Run ---\n');
  fs.appendFileSync(logFile, `Initial prompt tokens: ${TOTAL_PROMPT_TOKENS}\n`);

  // Get gateway URL from environment variable
  const gatewayUrl: string | undefined = process.env.LIVEPEER_GATEWAY_URL;
  if (!gatewayUrl) {
    console.error('LIVEPEER_GATEWAY_URL environment variable not set');
    process.exit(1);
  }

  // Read the content from this.txt
  const thisContent = fs.readFileSync(path.join(__dirname, 'this.txt'), 'utf-8');

  const url: string = `${gatewayUrl}/llm`;
  const payload: RequestPayload = {
    model: "meta-llama/Meta-Llama-3.1-8B-Instruct",
    messages: [
      {
        role: "system",
        content: "You are a helpful assistant"
      },
      {
        role: "user",
        content: thisContent
      }
    ],
    max_tokens: 1000,
    stream: false
  };

  console.log('Request configuration:', {
    url,
    payload
  });

  console.log(`Starting stress test with ${totalRequests} concurrent requests`);

  // Create array of promises for concurrent execution
  const requests: Promise<RequestResult>[] = Array.from({ length: totalRequests }, (_, i) =>
    makeRequest(url, payload, i + 1)
  );

  // Execute all requests concurrently
  const results: RequestResult[] = await Promise.all(requests);

  // Calculate statistics
  const successCount: number = results.filter(r => r.success).length;
  const failureCount: number = results.filter(r => !r.success).length;
  const durations: number[] = results.map(r => r.duration);
  const avgDuration: number = durations.reduce((acc, cur) => acc + cur, 0) / durations.length;

  // Log final results
  const summary: string = `
--- Final Results ---
Total Requests: ${totalRequests}
Successes: ${successCount}
Failures: ${failureCount}
Average Response Time: ${avgDuration.toFixed(2)}ms
`;

  fs.appendFileSync(logFile, summary);
  console.log(summary);
}

// Run the main function
main().catch((err: Error) => {
  console.error('Error during stress test:', err);
  fs.appendFileSync(logFile, `Error during stress test: ${err.message}\n`);
});