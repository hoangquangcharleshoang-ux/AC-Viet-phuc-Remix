/**
 * AC — Context-Aware Cultural Remix Co-pilot
 * Phase 2C: Visual QA Client Service
 *
 * Requirements:
 * - In-flight dedup + session caching
 * - Calls POST /api/verify-lookbook
 * - Handles 409 Conflict, 410 Gone, 429 Quota Cooldown, 503 Service Unavailable gracefully
 * - Connects with localStorage persistence (ac_visual_qa_v1)
 */

import { CulturalVisualQAOutput, VerifyLookbookRequest } from '../types/index';
import { loadPersistedVisualQA, savePersistedVisualQA } from './visualQAPersistence';

// In-memory session cache
const sessionVisualQACache = new Map<string, CulturalVisualQAOutput>();

// In-flight request deduplication map
const inFlightVisualQAMap = new Map<string, Promise<CulturalVisualQAOutput>>();

export class VisualQAError extends Error {
  code: string;
  status: number;
  retryable: boolean;

  constructor(code: string, message: string, status: number, retryable = true) {
    super(message);
    this.name = 'VisualQAError';
    this.code = code;
    this.status = status;
    this.retryable = retryable;
  }
}

export function clearVisualQASessionCache(): void {
  sessionVisualQACache.clear();
  inFlightVisualQAMap.clear();
}

export async function verifyLookbookImage(
  req: VerifyLookbookRequest,
  signal?: AbortSignal
): Promise<CulturalVisualQAOutput> {
  const cacheKey = `${req.generationId}_${req.boundFingerprint}`;

  // 1. In-memory session cache check
  if (sessionVisualQACache.has(cacheKey)) {
    return sessionVisualQACache.get(cacheKey)!;
  }

  // 2. LocalStorage persistence check
  const persisted = loadPersistedVisualQA(req.generationId);
  if (persisted && persisted.boundFingerprint === req.boundFingerprint) {
    sessionVisualQACache.set(cacheKey, persisted);
    return persisted;
  }

  // 3. In-flight Promise deduplication
  if (inFlightVisualQAMap.has(cacheKey)) {
    return inFlightVisualQAMap.get(cacheKey)!;
  }

  const promise = (async () => {
    try {
      console.log('[VisualQA Client Diagnostic] Starting verifyLookbookImage:', {
        generationId: req.generationId,
        boundFingerprint: req.boundFingerprint,
        timestamp: new Date().toISOString(),
        hasSignal: !!signal,
        signalAborted: signal?.aborted || false,
        abortReason: signal?.reason ? String(signal.reason) : null
      });

      const res = await fetch('/api/verify-lookbook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
        signal
      });

      const contentType = res.headers.get('content-type') || '';
      const xAcApiResponse = res.headers.get('x-ac-api-response') || '0';
      const isJson = contentType.includes('application/json');

      if (!isJson || xAcApiResponse !== '1') {
        const bodyText = await res.text().catch(() => '');
        console.warn('[VisualQA Client Diagnostic] Non-JSON or Non-API Response Encountered:', {
          method: 'POST',
          requestUrl: '/api/verify-lookbook',
          responseUrl: res.url,
          redirected: res.redirected,
          status: res.status,
          statusText: res.statusText,
          contentType,
          xAcApiResponse,
          bodySnippet: bodyText.slice(0, 150).replace(/\s+/g, ' ')
        });

        const code = res.status === 504 ? 'GATEWAY_TIMEOUT' : 'NON_JSON_RESPONSE';
        const message = 'AC chưa hoàn tất được phần đánh giá này. Ảnh của bạn đã được tạo bình thường, nhưng phần tư vấn đang tạm gián đoạn.';
        throw new VisualQAError(code, message, res.status, true);
      }

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        const code = errJson.code || (res.status === 410 ? 'EPHEMERAL_IMAGE_EXPIRED' : res.status === 409 ? 'FINGERPRINT_MISMATCH' : 'VISUAL_QA_ERROR');
        const message = errJson.message || `Lỗi đánh giá bản phối (${res.status})`;
        const retryable = res.status !== 410 && res.status !== 409;
        throw new VisualQAError(code, message, res.status, retryable);
      }

      const data: CulturalVisualQAOutput = await res.json();
      sessionVisualQACache.set(cacheKey, data);
      savePersistedVisualQA(data);
      return data;
    } finally {
      inFlightVisualQAMap.delete(cacheKey);
    }
  })();

  inFlightVisualQAMap.set(cacheKey, promise);
  return promise;
}
