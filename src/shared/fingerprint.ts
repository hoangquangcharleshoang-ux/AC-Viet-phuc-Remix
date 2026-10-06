/**
 * AC — Context-Aware Cultural Remix Co-pilot
 * Canonical Outfit Fingerprint Generator (Shared Contract Client & Server)
 *
 * Requirements:
 * - Represents current effective outfit state
 * - Includes: garmentId, cohesive palette with roles, fabricId, lowerGarmentId, footwearId, ACTIVE accessoryIds, context
 * - Excludes: modelId, timestamps, UI state, generationId
 */

export interface FingerprintInput {
  garmentId: string;
  palette: Array<{ id: string; role?: string }>;
  fabricId: string;
  lowerGarmentId: string;
  footwearId: string;
  accessoryIds: string[];
  occasion?: string;
  style?: string;
  traditionalRatio?: number;
  genderPresentation?: string;
}

export function computeOutfitFingerprint(input: FingerprintInput): string {
  const paletteKey = (input.palette || [])
    .map(p => `${p.id}:${p.role || 'PRIMARY'}`)
    .join('-');
  const accStr = (input.accessoryIds || []).slice().sort().join(',');
  const occ = input.occasion || '';
  const sty = input.style || '';
  const ratio = typeof input.traditionalRatio === 'number' ? input.traditionalRatio : '';
  const gender = input.genderPresentation || 'nam';

  const payload = `${input.garmentId}|${occ}|${sty}|${ratio}|${gender}|${paletteKey}|${input.fabricId}|${input.lowerGarmentId}|${input.footwearId}|${accStr}`;

  let hashVal = 5381;
  for (let i = 0; i < payload.length; i++) {
    hashVal = (hashVal * 33) ^ payload.charCodeAt(i);
  }
  const hex = (hashVal >>> 0).toString(16).toUpperCase().padStart(8, '0');
  const gPrefix = (input.garmentId || 'GAR').toUpperCase().slice(0, 3);
  return `AC-${gPrefix}-${hex}`;
}
