/**
 * AC — G2 Cultural Product Policy Runtime Adapter v1.1
 *
 * Purpose:
 * - Apply approved Cultural Product Rules v1.1 to planning-time runtime behavior.
 * - Keep historical policy deterministic and outside model intuition.
 * - This adapter currently governs recommendation eligibility and accessory selection.
 */

import type {
  GarmentId,
  GenderPresentation,
  GarmentRecommendationOutput,
} from '../../src/types/index';
import {
  CULTURAL_PRODUCT_RULES_VERSION,
  PRODUCT_POLICY_V11,
  STYLING_ELEMENTS_V11,
  getTraditionalityBand,
  getWearerCompatibilityRule,
  type SocialContext,
  type StylingProfile,
} from '../../src/data/culturalProductRulesV11';
import { ACCESSORIES } from '../../src/data/canonicalCatalog';

export interface PlanningPolicyContext {
  garmentId?: GarmentId;
  genderPresentation?: GenderPresentation | string | null;
  promptText?: string;
  selectedOccasion?: string;
  selectedStyle?: string;
  traditionalRatio?: number;
}

export interface BlueprintAccessoryPolicy {
  version: typeof CULTURAL_PRODUCT_RULES_VERSION;
  genderPresentation: GenderPresentation;
  traditionalityBand: ReturnType<typeof getTraditionalityBand>;
  socialContext: SocialContext;
  autoAllowedAccessoryIds: string[];
  explicitAllowedAccessoryIds: string[];
  preferredAccessoryIds: string[];
  availableAccessoryIds: string[];
  policyInstruction: string;
}

const POLICY_TO_CATALOG_ACCESSORY_IDS: Record<string, string[]> = {
  khan_dong_male: ['khan_dong_truyen_thong'],
  // Female khăn vấn is culturally documented, but the current canonical catalog
  // does not distinguish it safely from the male-oriented khan-dong label.
  // Do not auto-map until the catalog is split in a later integration step.
  khan_van_female: [],
  khan_mo_qua: ['khan_mo_qua'],
  non_thung_quai_thao: ['non_thung_quai_thao'],
  modern_bag: ['tui_coton_theu_tay'],
  modern_eyewear: ['kinh_ram_gong_tron'],
  pearl_necklace: ['chuoi_ngoc_trai_co'],
  handheld_fan: ['quat_giay_tram_huong'],
};

const ACCESSORY_EXPLICIT_KEYWORDS: Record<string, string[]> = {
  khan_dong_truyen_thong: ['khăn đóng', 'khan dong', 'khăn xếp', 'khan xep'],
  khan_mo_qua: ['khăn mỏ quạ', 'khan mo qua'],
  non_thung_quai_thao: ['nón thúng quai thao', 'nón quai thao', 'non quai thao'],
  tui_coton_theu_tay: ['túi', 'tote', 'bag'],
  kinh_ram_gong_tron: ['kính', 'kinh', 'eyewear', 'sunglasses'],
  chuoi_ngoc_trai_co: ['ngọc trai', 'ngoc trai', 'pearl'],
  quat_giay_tram_huong: ['quạt', 'quat', 'fan'],
};

function normalizeText(value?: string | null): string {
  return (value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function normalizeGenderPresentationV11(
  value?: GenderPresentation | string | null,
): GenderPresentation {
  if (value === 'nam' || value === 'nu' || value === 'neutral') return value;
  return 'neutral';
}

function ratioOf(value?: number): number {
  if (typeof value !== 'number' || Number.isNaN(value)) return 50;
  return Math.max(0, Math.min(100, value));
}

export function deriveSocialContextV11(input: PlanningPolicyContext): SocialContext {
  const occ = normalizeText(input.selectedOccasion);
  const style = normalizeText(input.selectedStyle);
  const prompt = normalizeText(input.promptText);

  if (
    style.includes('editorial') ||
    style.includes('pha cach') ||
    style.includes('remix') ||
    style.includes('fusion') ||
    prompt.includes('editorial') ||
    prompt.includes('pha cach') ||
    prompt.includes('remix') ||
    prompt.includes('fusion')
  ) {
    return 'EDITORIAL';
  }

  if (
    occ.includes('street') ||
    occ.includes('cafe') ||
    occ.includes('dao pho') ||
    occ.includes('duong pho')
  ) {
    return 'URBAN';
  }

  if (
    occ.includes('tet') ||
    occ.includes('temple') ||
    occ.includes('dinh') ||
    occ.includes('mieu') ||
    occ.includes('wedding') ||
    occ.includes('cuoi') ||
    occ.includes('cultural')
  ) {
    return 'RITUAL';
  }

  return 'GENERAL';
}

function hasExplicitAccessoryRequest(accessoryId: string, promptText?: string): boolean {
  const prompt = normalizeText(promptText);
  const keywords = ACCESSORY_EXPLICIT_KEYWORDS[accessoryId] || [];
  return keywords.some((kw) => prompt.includes(normalizeText(kw)));
}

function profileMatches(
  profile: StylingProfile,
  garmentId: GarmentId,
  gender: GenderPresentation,
  ratio: number,
  socialContext: SocialContext,
): boolean {
  if (!profile.garmentIds.includes(garmentId)) return false;

  const wearerMatches =
    profile.wearer === 'both' ||
    profile.wearer === gender ||
    (
      gender === 'neutral' &&
      garmentId === 'ao_tu_than' &&
      ratio >= 70 &&
      profile.wearer === 'nu'
    );

  if (!wearerMatches) return false;

  if (typeof profile.minTraditionalRatio === 'number' && ratio < profile.minTraditionalRatio) {
    return false;
  }

  if (typeof profile.maxTraditionalRatio === 'number' && ratio > profile.maxTraditionalRatio) {
    return false;
  }

  if (
    Array.isArray(profile.socialContexts) &&
    profile.socialContexts.length > 0 &&
    !profile.socialContexts.includes(socialContext) &&
    !profile.socialContexts.includes('GENERAL')
  ) {
    return false;
  }

  return true;
}

export function isExplicitMaleTuThanReinterpretationV11(
  input: PlanningPolicyContext,
): boolean {
  const gender = normalizeGenderPresentationV11(input.genderPresentation);
  if (gender !== 'nam') return false;

  const ratio = ratioOf(input.traditionalRatio);
  if (ratio > 39) return false;

  const prompt = normalizeText(input.promptText);
  const explicitlyNamesTuThan =
    prompt.includes('tu than') ||
    prompt.includes('ao tu than');

  const explicitModernIntent =
    prompt.includes('hien dai') ||
    prompt.includes('cach tan') ||
    prompt.includes('remix') ||
    prompt.includes('editorial') ||
    prompt.includes('pha cach') ||
    prompt.includes('fusion') ||
    prompt.includes('reinterpret');

  return explicitlyNamesTuThan && explicitModernIntent;
}

export function isRecommendationGarmentAllowedV11(
  garmentId: GarmentId,
  input: PlanningPolicyContext,
): boolean {
  const gender = normalizeGenderPresentationV11(input.genderPresentation);

  if (gender === 'neutral') return true;

  const rule = getWearerCompatibilityRule(garmentId, gender);
  if (!rule) return false;

  if (rule.recommendationPolicy === 'AUTO_ELIGIBLE') return true;

  if (
    garmentId === 'ao_tu_than' &&
    gender === 'nam' &&
    rule.recommendationPolicy === 'EXPLICIT_REINTERPRETATION_ONLY'
  ) {
    return isExplicitMaleTuThanReinterpretationV11(input);
  }

  return rule.recommendationPolicy === 'CONTEXTUAL';
}

function fallbackGarmentForContext(input: PlanningPolicyContext): GarmentId {
  const occ = normalizeText(input.selectedOccasion);
  const ratio = ratioOf(input.traditionalRatio);

  const ceremonial =
    occ.includes('tet') ||
    occ.includes('temple') ||
    occ.includes('dinh') ||
    occ.includes('mieu') ||
    occ.includes('wedding') ||
    occ.includes('cuoi') ||
    occ.includes('cultural');

  return ceremonial || ratio >= 70 ? 'ao_tac' : 'ngu_than_chen';
}

export function enforceRecommendationPolicyV11(
  result: GarmentRecommendationOutput,
  input: PlanningPolicyContext,
): GarmentRecommendationOutput {
  const primaryAllowed = isRecommendationGarmentAllowedV11(result.primary.garmentId, input);
  const altAllowed =
    result.alternative &&
    isRecommendationGarmentAllowedV11(result.alternative.garmentId, input);

  let primary = result.primary;
  let alternative = result.alternative;

  if (!primaryAllowed) {
    if (alternative && altAllowed) {
      primary = alternative;
      alternative = null;
    } else {
      const fallback = fallbackGarmentForContext(input);
      primary = {
        garmentId: fallback,
        rationale:
          fallback === 'ao_tac'
            ? 'Áo tấc phù hợp hơn với mức độ trang trọng và bối cảnh nghi lễ của lựa chọn hiện tại.'
            : 'Áo ngũ thân tay chẽn phù hợp hơn với nhu cầu ứng dụng linh hoạt và bối cảnh hiện tại.',
      };
      alternative = null;
    }
  } else if (alternative && !altAllowed) {
    alternative = null;
  }

  if (
    primary.garmentId === 'ao_tu_than' &&
    normalizeGenderPresentationV11(input.genderPresentation) === 'nam' &&
    isExplicitMaleTuThanReinterpretationV11(input) &&
    !normalizeText(primary.rationale).includes('duong dai')
  ) {
    primary = {
      ...primary,
      rationale: `${primary.rationale} Đây là hướng tái diễn giải đương đại, không được trình bày như cấu hình nam lịch sử đã được xác lập.`,
    };
  }

  return { primary, alternative };
}

export function buildRecommendationPolicyInstructionV11(
  input: PlanningPolicyContext,
): string {
  const gender = normalizeGenderPresentationV11(input.genderPresentation);
  const ratio = ratioOf(input.traditionalRatio);
  const band = getTraditionalityBand(ratio);

  const lines = [
    '',
    `CULTURAL PRODUCT RULES ${CULTURAL_PRODUCT_RULES_VERSION}:`,
    `- wearer context: ${gender}; traditionality: ${ratio}/100 (${band}).`,
    '- Ngũ thân tay chẽn: historically documented for both male and female wearer profiles.',
    '- Áo tấc: historically documented for both male and female wearer profiles; prefer when ceremonial function fits.',
    '- Northern/Kinh áo tứ thân in the current AC corpus: female use is documented; male historical canonical use is NOT_ESTABLISHED.',
    '- NOT_ESTABLISHED does not mean historically impossible.',
  ];

  if (gender === 'nam') {
    if (isExplicitMaleTuThanReinterpretationV11(input)) {
      lines.push(
        '- Because the user explicitly requests a contemporary male áo tứ thân reinterpretation at a contemporary-leaning ratio, áo_tu_than may be considered only as clearly labeled contemporary reinterpretation.',
      );
    } else {
      lines.push(
        '- Do NOT auto-recommend ao_tu_than as historical/traditional male dress in this request.',
      );
    }
  }

  if (gender === 'neutral') {
    lines.push(
      '- neutral means no user presentation preference; do not convert it into a historical gender claim.',
    );
  }

  return lines.join('\n');
}

export function buildBlueprintAccessoryPolicyV11(
  input: PlanningPolicyContext & { garmentId: GarmentId },
): BlueprintAccessoryPolicy {
  const garmentId = input.garmentId;
  const gender = normalizeGenderPresentationV11(input.genderPresentation);
  const ratio = ratioOf(input.traditionalRatio);
  const traditionalityBand = getTraditionalityBand(ratio);
  const socialContext = deriveSocialContextV11(input);

  const autoAllowed = new Set<string>();
  const explicitAllowed = new Set<string>();
  const preferred = new Set<string>();

  for (const element of STYLING_ELEMENTS_V11) {
    const catalogIds = POLICY_TO_CATALOG_ACCESSORY_IDS[element.id] || [];
    if (catalogIds.length === 0) continue;

    for (const profile of element.profiles) {
      if (!profileMatches(profile, garmentId, gender, ratio, socialContext)) continue;

      for (const catalogId of catalogIds) {
        if (!ACCESSORIES.some((a) => a.id === catalogId)) continue;

        if (profile.autoSelection === 'PREFER') {
          preferred.add(catalogId);
          autoAllowed.add(catalogId);
        } else if (profile.autoSelection === 'ALLOW') {
          autoAllowed.add(catalogId);
        } else if (
          profile.autoSelection === 'EXPLICIT_ONLY' &&
          hasExplicitAccessoryRequest(catalogId, input.promptText)
        ) {
          explicitAllowed.add(catalogId);
        }
      }
    }
  }

  // Explicit mention may use an already-compatible ALLOW/PREFER item too.
  for (const id of autoAllowed) {
    if (hasExplicitAccessoryRequest(id, input.promptText)) {
      explicitAllowed.add(id);
    }
  }

  const available = Array.from(new Set([...autoAllowed, ...explicitAllowed]));

  const policyInstruction = [
    `CULTURAL PRODUCT RULES ${CULTURAL_PRODUCT_RULES_VERSION} — ACCESSORIES:`,
    `- wearer=${gender}; traditionality=${ratio}/100 (${traditionalityBand}); socialContext=${socialContext}.`,
    `- Auto-allowed canonical accessory IDs for this exact context: ${autoAllowed.size ? Array.from(autoAllowed).join(', ') : '(none)'}.`,
    `- Explicit-only accessory IDs unlocked by the user's own prompt: ${explicitAllowed.size ? Array.from(explicitAllowed).join(', ') : '(none)'}.`,
    `- Preferred IDs when suitable: ${preferred.size ? Array.from(preferred).join(', ') : '(none)'}.`,
    '- If no approved accessory is available, return accessoryIds: []. Prefer no accessory over invention.',
    '- Do not infer female → hairpin.',
    '- Do not infer male + áo tấc → jade pendant.',
    '- Pearl necklace and handheld fan are never historical defaults; they require explicit compatible contemporary/editorial intent.',
    '- Never describe contemporary styling as historical evidence.',
  ].join('\n');

  return {
    version: CULTURAL_PRODUCT_RULES_VERSION,
    genderPresentation: gender,
    traditionalityBand,
    socialContext,
    autoAllowedAccessoryIds: Array.from(autoAllowed),
    explicitAllowedAccessoryIds: Array.from(explicitAllowed),
    preferredAccessoryIds: Array.from(preferred),
    availableAccessoryIds: available,
    policyInstruction,
  };
}

export function sanitizeAccessoryIdsV11(
  accessoryIds: unknown,
  input: PlanningPolicyContext & { garmentId: GarmentId },
): { accessoryIds: string[]; removedAccessoryIds: string[] } {
  const policy = buildBlueprintAccessoryPolicyV11(input);
  const allowed = new Set(policy.availableAccessoryIds);

  const proposed = Array.isArray(accessoryIds)
    ? accessoryIds.filter((id): id is string => typeof id === 'string')
    : [];

  const kept: string[] = [];
  const removed: string[] = [];

  for (const id of proposed) {
    if (!ACCESSORIES.some((a) => a.id === id) || !allowed.has(id)) {
      removed.push(id);
      continue;
    }
    if (!kept.includes(id)) kept.push(id);
    if (kept.length >= 2) break;
  }

  return {
    accessoryIds: kept,
    removedAccessoryIds: removed,
  };
}

export function shouldLabelMaleTuThanAsContemporaryV11(
  input: PlanningPolicyContext & { garmentId: GarmentId },
): boolean {
  return (
    input.garmentId === 'ao_tu_than' &&
    normalizeGenderPresentationV11(input.genderPresentation) === 'nam'
  );
}

export const CULTURAL_PRODUCT_POLICY_V11 = {
  version: CULTURAL_PRODUCT_RULES_VERSION,
  noEvidenceFallback: PRODUCT_POLICY_V11.accessorySelection.noEvidenceFallback,
  neutralWearerRule: PRODUCT_POLICY_V11.neutralWearer.rule,
} as const;
