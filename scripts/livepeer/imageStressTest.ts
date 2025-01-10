#!/usr/bin/env node

/*
 * This script demonstrates a basic async stress test against the Livepeer image generation gateway.
 * It makes multiple concurrent requests to test performance and logs timing data.
 * Each request will be retried up to 3 times on failure.
 */

import axios, { AxiosResponse } from 'axios';
import fs from 'fs';
import path from 'path';

// Get total requests from command line arg, environment variable, or default
const totalRequests: number = Number(process.argv[2]) || Number(process.env.TOTAL_REQUESTS) || 2;
const maxRetries: number = 3;
const outputDir: string = 'output/img_gen';
const testRunDir: string = path.join(outputDir, `image_stress_test_results_${new Date().toISOString().replace(/[:.]/g, '-')}`);
const logFile: string = path.join(testRunDir, 'test_results.log');
const imageDir: string = path.join(testRunDir, 'images');
const retryDelayMs: number = Number(process.env.RETRY_DELAY_MS) || 2000; // Default 2 seconds between retries

interface RequestResult {
  success: boolean;
  duration: number;
  retryCount?: number;
}

interface RequestPayload {
  model_id: string;
  prompt: string;
  width: number;
  height: number;
}

/**
 * Function to read the prompt from the prompts file
 */
function readPrompt(): string {
  const promptsContent = fs.readFileSync(path.join(__dirname, 'prompts'), 'utf-8');
  const imgPromptMatch = promptsContent.match(/img_prompt=(.*?)$/s);
  if (!imgPromptMatch) {
    throw new Error('Could not find img_prompt in prompts file');
  }
  return imgPromptMatch[1].trim();
}

/**
 * A helper function to perform a single request with retries and log timing data
 */
async function makeRequest(url: string, payload: RequestPayload, requestNum: number): Promise<RequestResult> {
  let retryCount = 0;
  let lastError: any;

  while (retryCount <= maxRetries) {
    const startTime: number = Date.now();
    const startTimeStr: string = new Date(startTime).toISOString();

    const attemptNum = retryCount > 0 ? ` (Retry ${retryCount}/${maxRetries})` : '';
    console.log(`\n[Request ${requestNum}${attemptNum}] Starting request to ${url}`);
    console.log(`[Request ${requestNum}${attemptNum}] Payload:`, JSON.stringify(payload, null, 2));

    try {
      const response: AxiosResponse = await axios({
        method: 'post',
        url: url,
        headers: {
          'Content-Type': 'application/json'
        },
        data: payload,
        timeout: 300000 // 5 minute timeout
      });

      console.log(`[Request ${requestNum}${attemptNum}] Response status: ${response.status}`);

      // Only log first part of base64 image for brevity
      const truncatedResponse = {
        ...response.data,
        images: response.data.images?.map((img: any) => ({
          ...img,
          url: img.url?.substring(0, 100) + '...' // Truncate URL for logging
        }))
      };
      console.log(`[Request ${requestNum}${attemptNum}] Response data:`, JSON.stringify(truncatedResponse, null, 2));

      // Save each image in the response
      if (response.data.images) {
        for (let i = 0; i < response.data.images.length; i++) {
          const imageUrl = process.env.LIVEPEER_GATEWAY_URL+response.data.images[i].url;
          console.log('this is the image url',imageUrl);
          try {
            // Download the image from the URL
            const imageResponse = await axios({
              method: 'get',
              url: imageUrl,
              responseType: 'arraybuffer'
            });

            const imagePath = path.join(imageDir, `request_${requestNum}_image_${i + 1}.png`);
            fs.writeFileSync(imagePath, imageResponse.data);
            console.log(`[Request ${requestNum}] Saved image to ${imagePath}`);
          } catch (error) {
            console.error(`[Request ${requestNum}] Failed to save image ${i + 1}:`, error.message);
          }
        }
      }

      // Add a small delay between requests to prevent overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 1000));

      const endTime: number = Date.now();
      const endTimeStr: string = new Date(endTime).toISOString();
      const duration: number = endTime - startTime;

      const retryInfo = retryCount > 0 ? ` (After ${retryCount} retries)` : '';
      const logEntry: string = `Request ${requestNum}${retryInfo}: Start=${startTimeStr}, End=${endTimeStr}, Duration=${duration}ms\n`;
      fs.appendFileSync(logFile, logEntry);

      return { success: true, duration, retryCount };

    } catch (error: any) {
      lastError = error;
      retryCount++;

      console.error(`[Request ${requestNum}${attemptNum}] Failed with error:`, {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        code: error.code,
        url: url,
        payload: payload
      });

      if (retryCount > maxRetries) {
        const endTime: number = Date.now();
        const endTimeStr: string = new Date(endTime).toISOString();
        const duration: number = endTime - startTime;

        const logEntry: string = `Request ${requestNum} (FAILED after ${retryCount-1} retries): Start=${startTimeStr}, End=${endTimeStr}, Duration=${duration}ms, Error=${error.message}\n`;
        fs.appendFileSync(logFile, logEntry);
        break;
      }

      console.log(`[Request ${requestNum}] Retrying... (${retryCount}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, retryDelayMs)); // Configurable delay between retries
    }
  }

  return { success: false, duration: 0, retryCount: retryCount - 1 };
}

/**
 * The main function orchestrates running the stress test.
 */
async function main(): Promise<void> {
  // Create test run directory and subdirectories
  fs.mkdirSync(outputDir, { recursive: true });
  fs.mkdirSync(testRunDir, { recursive: true });
  fs.mkdirSync(imageDir, { recursive: true });

  // Clear previous log file
  fs.writeFileSync(logFile, '--- New Image Generation Stress Test Run ---\n');

  // Get gateway URL from environment variable
  const gatewayUrl: string | undefined = process.env.LIVEPEER_GATEWAY_URL;
  if (!gatewayUrl) {
    console.error('LIVEPEER_GATEWAY_URL environment variable not set');
    process.exit(1);
  }

  const url: string = `${gatewayUrl}/text-to-image`;
  const prompt = readPrompt();
  const payload: RequestPayload = {
    model_id: "ByteDance/SDXL-Lightning",
    prompt: prompt,
    width: 1024,
    height: 1024
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
  const retriedCount: number = results.filter(r => (r.retryCount || 0) > 0).length;
  const retriedSuccessCount: number = results.filter(r => r.success && (r.retryCount || 0) > 0).length;
  const durations: number[] = results.map(r => r.duration);
  const avgDuration: number = durations.reduce((acc, cur) => acc + cur, 0) / durations.length;

  // Log final results
  const summary: string = `
--- Final Results ---
Total Requests: ${totalRequests}
Successes: ${successCount}
Failures: ${failureCount}
Requests that needed retries: ${retriedCount}
Successfully retried requests: ${retriedSuccessCount}
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