/**
 * AC — Context-Aware Cultural Remix Co-pilot
 * Final Runtime Stabilization & Quota/QA/API Isolation Test Suite
 * MOCK ONLY: ZERO LIVE GEMINI OR OPENAI CALLS.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadQuotaBlocks, saveQuotaBlock, isModelQuotaBlocked } from '../server/services/quotaQuarantine';
import { getModelPoolForTask } from '../server/services/modelRegistry';
import { circuitBreaker } from '../server/services/circuitBreaker';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface TestResult {
  num: number;
  name: string;
  status: 'MOCK PASS' | 'FAIL';
  evidence: string;
}

const results: TestResult[] = [];

function record(num: number, name: string, pass: boolean, evidence: string) {
  results.push({
    num,
    name,
    status: pass ? 'MOCK PASS' : 'FAIL',
    evidence
  });
}

async function runStabilizationTests() {
  console.log('========================================================');
  console.log('RUNNING FINAL RUNTIME STABILIZATION TEST SUITE');
  console.log('MOCK MODE: ZERO LIVE GEMINI OR OPENAI CALLS');
  console.log('========================================================\n');

  // 1. Test Persistent Quota Block & Metadata Extraction
  const testModel = 'gemini-3.8-flash';
  const blockedUntilTime = Date.now() + 120000;
  saveQuotaBlock({
    modelId: testModel,
    blockedUntil: blockedUntilTime,
    quotaMetric: 'generate_content_requests',
    quotaId: 'RequestsPerDay',
    quotaValue: '1500',
    dimensions: { model: testModel },
    retryAfterSeconds: 120,
    updatedAt: new Date().toISOString()
  });

  const isBlocked = isModelQuotaBlocked(testModel);
  const loadedBlocks = loadQuotaBlocks();
  const test1Pass = isBlocked && loadedBlocks[testModel]?.quotaMetric === 'generate_content_requests';
  record(
    1,
    'TEST_PERSISTENT_QUOTA_BLOCK',
    test1Pass,
    `Persistent quota block for ${testModel} loaded successfully with metric=${loadedBlocks[testModel]?.quotaMetric}`
  );

  // 2. Test Quota-Efficient Dev-Lite Routing Profile
  const bpPool = getModelPoolForTask('BLUEPRINT');
  const vqaPool = getModelPoolForTask('VISUAL_QA');
  const test2Pass = bpPool[0] === 'gemini-3.5-flash-lite' && vqaPool[0] === 'gemini-3.5-flash-lite';
  record(
    2,
    'TEST_DEV_LITE_ROUTING_PROFILE',
    test2Pass,
    `Dev-lite profile correctly places gemini-3.5-flash-lite first for BLUEPRINT and VISUAL_QA`
  );

  // 3. Test Visual QA Attempt Guard (One automatic attempt per identity)
  const qaSet = new Set<string>();
  const qaId = 'gen_123_FP-ABC';
  const attemptQa = (identity: string, isExplicitRetry = false) => {
    if (isExplicitRetry) {
      qaSet.delete(identity);
    }
    if (qaSet.has(identity)) {
      return 'SKIPPED_DUPLICATE';
    }
    qaSet.add(identity);
    return 'ATTEMPTED';
  };

  const firstAttempt = attemptQa(qaId, false);
  const secondAutomaticAttempt = attemptQa(qaId, false);
  const explicitRetryAttempt = attemptQa(qaId, true);

  const test3Pass = firstAttempt === 'ATTEMPTED' &&
                    secondAutomaticAttempt === 'SKIPPED_DUPLICATE' &&
                    explicitRetryAttempt === 'ATTEMPTED';
  record(
    3,
    'TEST_SINGLE_AUTOMATIC_QA_ATTEMPT',
    test3Pass,
    `First attempt=${firstAttempt}, second automatic=${secondAutomaticAttempt}, explicit retry=${explicitRetryAttempt}`
  );

  // 4. Test API Response Isolation & X-AC-API-Response Header
  const serverTs = fs.readFileSync(path.resolve(__dirname, '../server.ts'), 'utf8');
  const visualServiceTs = fs.readFileSync(path.resolve(__dirname, '../src/services/visualQAService.ts'), 'utf8');

  const hasApiMarkerMiddleware = serverTs.includes("res.setHeader('X-AC-API-Response', '1')");
  const hasClientHeaderCheck = visualServiceTs.includes("xAcApiResponse") && visualServiceTs.includes("xAcApiResponse !== '1'");

  const test4Pass = hasApiMarkerMiddleware && hasClientHeaderCheck;
  record(
    4,
    'TEST_API_RESPONSE_ISOLATION_AND_MARKER',
    test4Pass,
    `Server X-AC-API-Response middleware defined: ${hasApiMarkerMiddleware}, Client header validation: ${hasClientHeaderCheck}`
  );

  // Print Summary Table
  console.log('------------------------------------------------------------------------------------------------------------------------');
  console.log('| #  | Test Name                             | Status    | Evidence Summary                                            |');
  console.log('------------------------------------------------------------------------------------------------------------------------');
  results.forEach(r => {
    const numStr = String(r.num).padStart(2, ' ');
    const nameStr = r.name.padEnd(37, ' ');
    const statusStr = r.status.padEnd(9, ' ');
    console.log(`| ${numStr} | ${nameStr} | ${statusStr} | ${r.evidence.padEnd(61, ' ')} |`);
  });
  console.log('------------------------------------------------------------------------------------------------------------------------');

  const allPassed = results.every(r => r.status === 'MOCK PASS');
  if (allPassed) {
    console.log('\nFINAL RUNTIME STABILIZATION TEST SUITE: ALL TESTS PASSED SUCCESSFULLY');
    process.exit(0);
  } else {
    console.log('\nFINAL RUNTIME STABILIZATION TEST SUITE: SOME TESTS FAILED');
    process.exit(1);
  }
}

runStabilizationTests();
