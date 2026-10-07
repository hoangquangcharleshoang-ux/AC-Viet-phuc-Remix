/**
 * AC — G2 Planning Policy Integration Tests
 * Deterministic only. ZERO live Gemini/OpenAI calls.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  buildBlueprintAccessoryPolicyV11,
  enforceRecommendationPolicyV11,
  isRecommendationGarmentAllowedV11,
  sanitizeAccessoryIdsV11,
} from '../server/services/culturalProductPolicyV11';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function run() {
  // 1. Male historical/traditional áo tứ thân must not be auto-eligible.
  assert(
    !isRecommendationGarmentAllowedV11('ao_tu_than', {
      genderPresentation: 'nam',
      promptText: 'Tôi muốn trang phục truyền thống cho dịp lễ',
      selectedOccasion: 'tet_temple',
      traditionalRatio: 85,
    }),
    'Male traditional Northern/Kinh áo tứ thân must not be auto-eligible.'
  );

  // 2. Explicit contemporary male reinterpretation is allowed.
  assert(
    isRecommendationGarmentAllowedV11('ao_tu_than', {
      genderPresentation: 'nam',
      promptText: 'Tôi muốn áo tứ thân nam hiện đại, remix editorial',
      selectedOccasion: 'street_cafe',
      selectedStyle: 'editorial',
      traditionalRatio: 20,
    }),
    'Explicit contemporary male áo tứ thân reinterpretation should be allowed.'
  );

  // 3. Recommendation enforcement removes unsupported male historical tứ thân.
  const enforced = enforceRecommendationPolicyV11(
    {
      primary: {
        garmentId: 'ao_tu_than',
        rationale: 'Phù hợp bối cảnh dân gian.',
      },
      alternative: {
        garmentId: 'ngu_than_chen',
        rationale: 'Linh hoạt hơn.',
      },
    },
    {
      genderPresentation: 'nam',
      promptText: '',
      selectedOccasion: 'street_cafe',
      traditionalRatio: 60,
    }
  );
  assert(
    enforced.primary.garmentId === 'ngu_than_chen',
    'Unsupported male historical tứ thân should not remain primary.'
  );

  // 4. Traditional male áo tấc may auto-use khan dong, but not fan/pearls by default.
  const maleTacPolicy = buildBlueprintAccessoryPolicyV11({
    garmentId: 'ao_tac',
    genderPresentation: 'nam',
    promptText: '',
    selectedOccasion: 'tet_temple',
    selectedStyle: 'trang_trong',
    traditionalRatio: 85,
  });
  assert(
    maleTacPolicy.availableAccessoryIds.includes('khan_dong_truyen_thong'),
    'Traditional male áo tấc should allow khan dong.'
  );
  assert(
    !maleTacPolicy.availableAccessoryIds.includes('quat_giay_tram_huong'),
    'Hand fan must not be a traditional default.'
  );
  assert(
    !maleTacPolicy.availableAccessoryIds.includes('chuoi_ngoc_trai_co'),
    'Pearl necklace must not be a traditional default.'
  );

  // 5. Female traditional áo tấc must not reuse male khan-dong catalog mapping.
  const femaleTacPolicy = buildBlueprintAccessoryPolicyV11({
    garmentId: 'ao_tac',
    genderPresentation: 'nu',
    promptText: '',
    selectedOccasion: 'tet_temple',
    selectedStyle: 'trang_trong',
    traditionalRatio: 85,
  });
  assert(
    !femaleTacPolicy.availableAccessoryIds.includes('khan_dong_truyen_thong'),
    'Female khăn vấn must not silently map to the current male-oriented khan-dong catalog ID.'
  );

  // 6. Pearl necklace becomes available only through explicit contemporary/editorial request.
  const pearlPolicy = buildBlueprintAccessoryPolicyV11({
    garmentId: 'ao_tac',
    genderPresentation: 'nam',
    promptText: 'Editorial hiện đại, tôi muốn vòng ngọc trai',
    selectedOccasion: 'street_cafe',
    selectedStyle: 'editorial',
    traditionalRatio: 20,
  });
  assert(
    pearlPolicy.availableAccessoryIds.includes('chuoi_ngoc_trai_co'),
    'Explicit contemporary/editorial pearl request should be available.'
  );

  // 7. Sanitizer strips unapproved accessories deterministically.
  const sanitized = sanitizeAccessoryIdsV11(
    ['chuoi_ngoc_trai_co', 'vong_bac_cham_hoa', 'khan_dong_truyen_thong'],
    {
      garmentId: 'ao_tac',
      genderPresentation: 'nam',
      promptText: '',
      selectedOccasion: 'tet_temple',
      selectedStyle: 'trang_trong',
      traditionalRatio: 85,
    }
  );
  assert(
    sanitized.accessoryIds.length === 1 &&
      sanitized.accessoryIds[0] === 'khan_dong_truyen_thong',
    'Sanitizer must preserve only context-approved accessories.'
  );

  // 8. Client must transmit gender context to both planning APIs.
  const clientTs = fs.readFileSync(path.resolve(__dirname, '../src/services/geminiService.ts'), 'utf8');
  const genderPayloadCount = (clientTs.match(/genderPresentation: input\.genderPresentation \|\| 'neutral'/g) || []).length;
  assert(
    genderPayloadCount >= 2,
    'Client must send genderPresentation in both Recommendation and Blueprint payloads.'
  );

  // 9. Server cache keys include wearer context for Call A and Call B.
  const serverTs = fs.readFileSync(path.resolve(__dirname, '../server.ts'), 'utf8');
  const neutralKeyCount = (serverTs.match(/genderPresentation \|\| 'neutral'/g) || []).length;
  assert(
    neutralKeyCount >= 4,
    'Server/client planning paths must include wearer context in cache/payload logic.'
  );

  // 10. Server runtime imports and applies deterministic policy.
  assert(
    serverTs.includes('enforceRecommendationPolicyV11') &&
      serverTs.includes('buildBlueprintAccessoryPolicyV11') &&
      serverTs.includes('sanitizeAccessoryIdsV11'),
    'Server must wire v1.1 deterministic policy into planning runtime.'
  );

  console.log('G2_PLANNING_POLICY_INTEGRATION_TEST: PASS');
}

run();
