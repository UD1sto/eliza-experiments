#!/usr/bin/env node

/*
 * This script can perform stress tests on two different gateways that each support LLM and/or Image calls.
 * You can specify which gateways to test and which call types ("llm", "image", or "both").
 * By default, it will test both LLM and Image calls concurrently on both gateways.
 *
 * Usage:
 *   node dualStressTest.ts \
 *     --test=both \
 *     --concurrency=10 \
 *     --gateway1Url=https://firstgateway.example \
 *     --gateway2Url=https://secondgateway.example \
 *     --llmEndpoint=llm \
 *     --imageEndpoint=text-to-image
 *
 * Options:
 *   --test          "llm", "image", or "both"  (default: "both")
 *   --concurrency   Number of concurrent requests per call type per gateway (default: 10)
 *   --gateway1Url   Base URL for Gateway 1
 *   --gateway2Url   Base URL for Gateway 2
 *   --llmEndpoint   Path segment for LLM calls (default: "llm")
 *   --imageEndpoint Path segment for Image calls (default: "text-to-image")
 *
 * Each request will be retried up to 3 times on failure, with a 2-second delay.
 */

import axios, { AxiosResponse } from 'axios';
import fs from 'fs';
import path from 'path';

// -----------------------------
// Parse Command-Line Arguments
// -----------------------------
const args = process.argv.slice(2);

// Helper function to get a flag value or an env var fallback
function getArgValue(flag: string, envVar: string, defaultValue: string) {
  const flagPrefix = `--${flag}=`;
  const arg = args.find((a) => a.startsWith(flagPrefix));
  if (arg) return arg.replace(flagPrefix, '');
  if (process.env[envVar]) return process.env[envVar];
  return defaultValue;
}

// Determine which gateways to test
const TEST_MODE = getArgValue('test', 'TEST_GATEWAYS', 'both');    // "llm", "image", or "both"
const CONCURRENT_REQUESTS = Number(getArgValue('concurrency', 'TOTAL_REQUESTS', '10'));

// Two gateway base URLs
const GATEWAY1_URL = getArgValue('gateway1Url', 'GATEWAY_1_URL', '');
const GATEWAY2_URL = getArgValue('gateway2Url', 'GATEWAY_2_URL', '');

// Endpoint path segments (shared by both gateways)
const LLM_ENDPOINT = getArgValue('llmEndpoint', 'LLM_GATEWAY_ENDPOINT', 'llm');
const IMAGE_ENDPOINT = getArgValue('imageEndpoint', 'IMAGE_GATEWAY_ENDPOINT', 'text-to-image');

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000; // 2 seconds
const TIMEOUT_MS = 300000;   // 5 minutes

// Output directories
const OUTPUT_DIR: string = 'output/dual_stress_test';
const GW1_IMG_DIR: string = path.join(OUTPUT_DIR, 'gateway1_images');
const GW2_IMG_DIR: string = path.join(OUTPUT_DIR, 'gateway2_images');
const GW1_LLM_LOG: string = path.join(
  OUTPUT_DIR,
  `gateway1_llm_${new Date().toISOString().replace(/[:.]/g, '-')}.log`
);
const GW1_IMG_LOG: string = path.join(
  OUTPUT_DIR,
  `gateway1_image_${new Date().toISOString().replace(/[:.]/g, '-')}.log`
);
const GW2_LLM_LOG: string = path.join(
  OUTPUT_DIR,
  `gateway2_llm_${new Date().toISOString().replace(/[:.]/g, '-')}.log`
);
const GW2_IMG_LOG: string = path.join(
  OUTPUT_DIR,
  `gateway2_image_${new Date().toISOString().replace(/[:.]/g, '-')}.log`
);

// Add new interface for tracking gateway stats
interface GatewayStats {
  llm: {
    success: number;
    failure: number;
    retries: number;
    totalDuration: number;
    requests: number;
  };
  image: {
    success: number;
    failure: number;
    retries: number;
    totalDuration: number;
    requests: number;
  };
}

// Add new summary log file
const SUMMARY_LOG: string = path.join(
  OUTPUT_DIR,
  `gateway_summary_${new Date().toISOString().replace(/[:.]/g, '-')}.log`
);

// Initialize stats tracking
const gateway1Stats: GatewayStats = {
  llm: { success: 0, failure: 0, retries: 0, totalDuration: 0, requests: 0 },
  image: { success: 0, failure: 0, retries: 0, totalDuration: 0, requests: 0 }
};
const gateway2Stats: GatewayStats = {
  llm: { success: 0, failure: 0, retries: 0, totalDuration: 0, requests: 0 },
  image: { success: 0, failure: 0, retries: 0, totalDuration: 0, requests: 0 }
};

// Interfaces
interface RequestResult {
  success: boolean;
  duration: number;
  retryCount?: number;
  status?: number;
}

interface ImageRequestPayload {
  model_id: string;
  prompt: string;
  width: number;
  height: number;
}

interface LLMRequestPayload {
  model: string;
  messages: {
    role: string;
    content: string;
  }[];
  max_tokens: number;
  stream: boolean;
}

// Helper Functions

/**
 * Reads the image prompt from the prompts file.
 */
function readImagePrompt(): string {
  const promptsPath = path.join(__dirname, 'prompts');
  if (!fs.existsSync(promptsPath)) {
    throw new Error('Could not find prompts file for image prompt');
  }
  const promptsContent = fs.readFileSync(promptsPath, 'utf-8');
  const match = promptsContent.match(/img_prompt\s*=\s*(.*)$/m);
  if (!match) {
    throw new Error('Could not find img_prompt in prompts file');
  }
  return match[1].trim();
}

/**
 * Reads the LLM prompt from the prompts file.
 */
function readLLMPrompt(): string {
  const promptsPath = path.join(__dirname, 'prompts');
  if (!fs.existsSync(promptsPath)) {
    throw new Error('Could not find prompts file for LLM prompt');
  }
  const promptsContent = fs.readFileSync(promptsPath, 'utf-8');
  const match = promptsContent.match(/llm_prompt\s*=\s*(.*?)(?=\n\s*img_prompt|$)/s);
  if (!match) {
    throw new Error('Could not find llm_prompt in prompts file');
  }
  return match[1].trim();
}

/**
 * Sleeps for the specified number of milliseconds.
 */
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Prepares directories for logs and images.
 */
function setupDirectories() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.mkdirSync(GW1_IMG_DIR, { recursive: true });
  fs.mkdirSync(GW2_IMG_DIR, { recursive: true });

  // Initialize log files for whichever tests are needed
  if (TEST_MODE === 'llm' || TEST_MODE === 'both') {
    fs.writeFileSync(GW1_LLM_LOG, '--- Gateway1 LLM Test ---\n');
    fs.writeFileSync(GW2_LLM_LOG, '--- Gateway2 LLM Test ---\n');
  }
  if (TEST_MODE === 'image' || TEST_MODE === 'both') {
    fs.writeFileSync(GW1_IMG_LOG, '--- Gateway1 Image Test ---\n');
    fs.writeFileSync(GW2_IMG_LOG, '--- Gateway2 Image Test ---\n');
  }
}

/**
 * Performs a single request with retries.
 */
async function makeRequest(
  baseUrl: string,
  endpoint: string,
  payload: any,
  requestNum: number,
  type: 'LLM' | 'Image',
  gatewayId: 1 | 2
): Promise<RequestResult> {

  // Decide which log file and which image directory to use
  const logFile = gatewayId === 1
    ? (type === 'LLM' ? GW1_LLM_LOG : GW1_IMG_LOG)
    : (type === 'LLM' ? GW2_LLM_LOG : GW2_IMG_LOG);

  const imageDir = gatewayId === 1 ? GW1_IMG_DIR : GW2_IMG_DIR;

  // Build full URL
  const url = `${baseUrl}/${endpoint}`;

  let retryCount = 0;
  const startTime = Date.now();
  const startTimeStr = new Date(startTime).toISOString();

  while (retryCount <= MAX_RETRIES) {
    const attemptSuffix = retryCount > 0 ? `(Retry ${retryCount}/${MAX_RETRIES})` : '';
    console.log(`[Gateway${gatewayId}][${type} Req#${requestNum}] ${attemptSuffix} => ${url}`);
    console.log(`[Gateway${gatewayId}][${type} Req#${requestNum}] Payload:`, JSON.stringify(payload, null, 2));

    try {
      const response: AxiosResponse = await axios({
        method: 'post',
        url,
        headers: type === 'LLM'
          ? {
              accept: 'text/event-stream',
              'Content-Type': 'application/json',
            }
          : {
              'Content-Type': 'application/json',
            },
        data: payload,
        timeout: TIMEOUT_MS,
      });

      console.log(`[Gateway${gatewayId}][${type} Req#${requestNum}] Response status: ${response.status}`);

      // Handle Image
      if (type === 'Image' && response.data.images) {
        for (let i = 0; i < response.data.images.length; i++) {
          const relativeUrl = response.data.images[i].url;
          const imageUrl = baseUrl + relativeUrl; // or if relativeUrl includes slash, etc.
          console.log(`[Gateway${gatewayId}][Image Req#${requestNum}] Image URL: ${imageUrl}`);
          try {
            const imageResponse = await axios({
              method: 'get',
              url: imageUrl,
              responseType: 'arraybuffer',
            });
            const imagePath = path.join(imageDir, `req${requestNum}_image${i + 1}.png`);
            fs.writeFileSync(imagePath, imageResponse.data);
            console.log(`[Gateway${gatewayId}][Image Req#${requestNum}] Saved image to ${imagePath}`);
          } catch (e: any) {
            console.error(`[Gateway${gatewayId}][Image Req#${requestNum}] Failed to fetch/save image ${i + 1}: ${e.message}`);
          }
        }
      }

      // Handle LLM
      if (type === 'LLM') {
        console.log(`[Gateway${gatewayId}][LLM Req#${requestNum}] Response data:`, JSON.stringify(response.data, null, 2));
      }

      // Pause briefly to avoid overwhelming servers
      await sleep(1000);

      const endTime = Date.now();
      const endTimeStr = new Date(endTime).toISOString();
      const duration = endTime - startTime;
      const status = response.status;

      // Update stats
      const stats = gatewayId === 1 ? gateway1Stats : gateway2Stats;
      const typeKey = type.toLowerCase() as keyof GatewayStats;
      stats[typeKey].success++;
      stats[typeKey].totalDuration += duration;
      stats[typeKey].requests++;
      if (retryCount > 0) {
        stats[typeKey].retries += retryCount;
      }

      const logEntry = `Request ${requestNum}${retryCount > 0 ? ` (After ${retryCount} retries)` : ''}: ` +
        `Start=${startTimeStr}, End=${endTimeStr}, Duration=${duration}ms, Status=${status}\n`;
      fs.appendFileSync(logFile, logEntry);

      return { success: true, duration, retryCount, status };
    } catch (error: any) {
      const isFinalAttempt = retryCount >= MAX_RETRIES;
      console.error(`[Gateway${gatewayId}][${type} Req#${requestNum}] Error: ${error.message} (status=${error.response?.status})`);

      if (isFinalAttempt) {
        const endTime = Date.now();
        const endTimeStr = new Date(endTime).toISOString();
        const duration = endTime - startTime;

        // Update failure stats
        const stats = gatewayId === 1 ? gateway1Stats : gateway2Stats;
        const typeKey = type.toLowerCase() as keyof GatewayStats;
        stats[typeKey].failure++;
        stats[typeKey].requests++;
        if (retryCount > 0) {
          stats[typeKey].retries += retryCount;
        }

        const logEntry = `Request ${requestNum} (FAILED after ${retryCount} retries): ` +
          `Start=${startTimeStr}, End=${endTimeStr}, Duration=${duration}ms, ` +
          `Status=${error.response?.status || 'unknown'}, Error=${error.message}\n`;
        fs.appendFileSync(logFile, logEntry);
        break;
      }

      retryCount++;
      console.log(`[Gateway${gatewayId}][${type} Req#${requestNum}] Retrying in ${RETRY_DELAY_MS}ms... (${retryCount}/${MAX_RETRIES})`);
      await sleep(RETRY_DELAY_MS);
    }
  }

  return { success: false, duration: 0, retryCount };
}

/**
 * Add function to write summary
 */
function writeSummary() {
  const summary = `
=== Gateway Performance Summary ===
Time: ${new Date().toISOString()}

Gateway 1 (${GATEWAY1_URL})
---------------------------
LLM Requests:
  Total: ${gateway1Stats.llm.requests}
  Success: ${gateway1Stats.llm.success}
  Failures: ${gateway1Stats.llm.failure}
  Retries: ${gateway1Stats.llm.retries}
  Avg Duration: ${gateway1Stats.llm.requests ? (gateway1Stats.llm.totalDuration / gateway1Stats.llm.requests).toFixed(2) : 0}ms

Image Requests:
  Total: ${gateway1Stats.image.requests}
  Success: ${gateway1Stats.image.success}
  Failures: ${gateway1Stats.image.failure}
  Retries: ${gateway1Stats.image.retries}
  Avg Duration: ${gateway1Stats.image.requests ? (gateway1Stats.image.totalDuration / gateway1Stats.image.requests).toFixed(2) : 0}ms

Gateway 2 (${GATEWAY2_URL})
---------------------------
LLM Requests:
  Total: ${gateway2Stats.llm.requests}
  Success: ${gateway2Stats.llm.success}
  Failures: ${gateway2Stats.llm.failure}
  Retries: ${gateway2Stats.llm.retries}
  Avg Duration: ${gateway2Stats.llm.requests ? (gateway2Stats.llm.totalDuration / gateway2Stats.llm.requests).toFixed(2) : 0}ms

Image Requests:
  Total: ${gateway2Stats.image.requests}
  Success: ${gateway2Stats.image.success}
  Failures: ${gateway2Stats.image.failure}
  Retries: ${gateway2Stats.image.retries}
  Avg Duration: ${gateway2Stats.image.requests ? (gateway2Stats.image.totalDuration / gateway2Stats.image.requests).toFixed(2) : 0}ms
`;

  fs.writeFileSync(SUMMARY_LOG, summary);
  console.log('\nSummary written to:', SUMMARY_LOG);
  console.log(summary);
}

/**
 * Main function that coordinates stress tests on both gateways.
 */
async function main(): Promise<void> {
  if (!GATEWAY1_URL && !GATEWAY2_URL) {
    console.error('At least one gateway URL must be specified (gateway1Url or gateway2Url).');
    process.exit(1);
  }

  console.log('--- Dual Stress Test for Two Gateways ---');
  console.log(`TEST_MODE: ${TEST_MODE}`);
  console.log(`CONCURRENT_REQUESTS: ${CONCURRENT_REQUESTS}`);
  console.log(`Gateway1 URL: ${GATEWAY1_URL || '(none provided)'}`);
  console.log(`Gateway2 URL: ${GATEWAY2_URL || '(none provided)'}`);
  console.log(`LLM Endpoint: ${LLM_ENDPOINT}`);
  console.log(`Image Endpoint: ${IMAGE_ENDPOINT}`);
  console.log('-----------------------------------------\n');

  // Prepare directories and logs
  setupDirectories();

  // Read prompts
  let imagePrompt: string | null = null;
  let llmPrompt: string | null = null;

  if (TEST_MODE === 'both' || TEST_MODE === 'image') {
    imagePrompt = readImagePrompt();
  }
  if (TEST_MODE === 'both' || TEST_MODE === 'llm') {
    llmPrompt = readLLMPrompt();
  }

  // Prepare payloads
  const imagePayload: ImageRequestPayload | null =
    imagePrompt
      ? {
          model_id: 'ByteDance/SDXL-Lightning',
          prompt: imagePrompt,
          width: 512,
          height: 512,
        }
      : null;

  const llmPayload: LLMRequestPayload | null =
    llmPrompt
      ? {
          model: 'meta-llama/Meta-Llama-3.1-8B-Instruct',
          messages: [
            { role: 'system', content: 'You are a helpful assistant' },
            { role: 'user', content: llmPrompt },
          ],
          max_tokens: 1000,
          stream: false,
        }
      : null;

  // We'll collect results (although in this script we mostly log to files)
  const tasks: Promise<RequestResult>[] = [];

  // Helper to generate tasks
  const addTasks = (
    baseUrl: string,
    gatewayLabel: 1 | 2,
    testType: 'LLM' | 'Image',
    payload: any
  ) => {
    for (let i = 0; i < CONCURRENT_REQUESTS; i++) {
      tasks.push(makeRequest(baseUrl, testType === 'LLM' ? LLM_ENDPOINT : IMAGE_ENDPOINT, payload, i + 1, testType, gatewayLabel));
    }
  };

  // If Gateway1 URL is present
  if (GATEWAY1_URL) {
    if (TEST_MODE === 'both' || TEST_MODE === 'image') {
      if (imagePayload) {
        addTasks(GATEWAY1_URL, 1, 'Image', imagePayload);
      }
    }

    if (TEST_MODE === 'both' || TEST_MODE === 'llm') {
      if (llmPayload) {
        addTasks(GATEWAY1_URL, 1, 'LLM', llmPayload);
      }
    }
  }

  // If Gateway2 URL is present
  if (GATEWAY2_URL) {
    if (TEST_MODE === 'both' || TEST_MODE === 'image') {
      if (imagePayload) {
        addTasks(GATEWAY2_URL, 2, 'Image', imagePayload);
      }
    }

    if (TEST_MODE === 'both' || TEST_MODE === 'llm') {
      if (llmPayload) {
        addTasks(GATEWAY2_URL, 2, 'LLM', llmPayload);
      }
    }
  }

  // Wait for all tasks to complete
  const results = await Promise.all(tasks);

  // Summaries for each gateway + type
  function computeStats(gatewayId: 1 | 2, testType: 'LLM' | 'Image') {
    // Filter out results for this gateway and test type
    // We'll rely on the request order in tasks matching the order we created them
    // Instead of storing extra info, we can guess by grouping, but let's do a quick check:
    // We'll do it by re-checking logs or by splitting tasks above, but for simplicity here,
    // let's just do a naive approach. We won't have a direct way to filter unless we store gating info in results.
    // So let's rely on concurrency * (some number) approach or keep it simple:
    // We'll only log final instructions about how we've run tasks. The actual success/failure is in log files.

    console.log(`\n[Gateway${gatewayId}] [${testType}] => Please see log files for full details.`);
  }

  if (GATEWAY1_URL) {
    if (TEST_MODE === 'both' || TEST_MODE === 'image') computeStats(1, 'Image');
    if (TEST_MODE === 'both' || TEST_MODE === 'llm') computeStats(1, 'LLM');
  }
  if (GATEWAY2_URL) {
    if (TEST_MODE === 'both' || TEST_MODE === 'image') computeStats(2, 'Image');
    if (TEST_MODE === 'both' || TEST_MODE === 'llm') computeStats(2, 'LLM');
  }

  // After all tasks complete and before final console.log
  writeSummary();

  console.log('\n--- Dual Stress Test Complete ---');
  console.log(`Total requests attempted: ${tasks.length} (across both gateways)`);
  console.log('Please refer to the output logs for detailed results and timings.\n');
}

// Run the main function
main().catch((err: Error) => {
  console.error('Error during dual stress test:', err);
  fs.appendFileSync(
    path.join(OUTPUT_DIR, 'dual_stress_test_errors.log'),
    `Error: ${err.message}\n`
  );
});