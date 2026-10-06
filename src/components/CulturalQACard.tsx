/**
 * AC — Context-Aware Cultural Remix Co-pilot
 * Phase 2C: Cultural Visual QA Card Component
 *
 * Requirements:
 * - "Ảnh Hiện Trước, QA Theo Sau": Automatic visual verification on lookbook render
 * - Neutral User-Friendly labeling (PRESERVES_IDENTITY, CONTEXT_SENSITIVE, WEAKENS_RECOGNIZABILITY, CHANGES_CORE_IDENTIFICATION, INSUFFICIENT_EVIDENCE)
 * - Trait-level breakdown with badges (PASS, PARTIAL, FAIL, NOT_ASSESSABLE)
 * - Outfit Fidelity panel (Palette, Fabric, Lower garment, Footwear, Accessories, Unexpected items)
 * - Dual-Source Grounded Revision Plan display
 * - User Agency CTA button: "Tinh chỉnh theo thẩm định ✦" (Max 2 Revisions limit)
 * - Embeds Trait Transitions tracking across versions without percentage scores
 */

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  AlertCircle,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  XCircle,
  Eye,
  Palette,
  Layers,
  RotateCw,
  Wand2,
  ArrowRight,
  Lock
} from 'lucide-react';
import {
  CulturalVisualQAOutput,
  CulturalIdentityStatus,
  TraitVerdict,
  VisualQAState,
  GroundedCorrectionPlan,
  LookbookRevisionItem
} from '../types/index';
import { TraitTransitionsView } from './TraitTransitionsView';

interface CulturalQACardProps {
  qaState: VisualQAState;
  generationId?: string;
  boundFingerprint?: string;
  isGeneratingLookbook?: boolean;
  revisionIndex?: number;
  correctionPlan?: GroundedCorrectionPlan;
  revisions?: LookbookRevisionItem[];
  onVerify: () => void;
  onTriggerRevision?: () => void;
}

export const CulturalQACard: React.FC<CulturalQACardProps> = ({
  qaState,
  generationId,
  boundFingerprint,
  isGeneratingLookbook = false,
  revisionIndex = 0,
  correctionPlan,
  revisions = [],
  onVerify,
  onTriggerRevision
}) => {
  const [activeTab, setActiveTab] = useState<'IDENTITY' | 'FIDELITY' | 'TRANSITIONS'>('IDENTITY');
  const [isDetailsExpanded, setIsDetailsExpanded] = useState<boolean>(false);

  // If no generationId exists yet, card does not render
  if (!generationId) {
    return null;
  }

  // -------------------------------------------------------------------------
  // Helper: Status Styling
  // -------------------------------------------------------------------------
  const getStatusBadge = (status: CulturalIdentityStatus) => {
    switch (status) {
      case 'PRESERVES_IDENTITY':
        return {
          badge: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
          icon: <ShieldCheck className="w-4 h-4 text-emerald-600" />,
          dot: 'bg-emerald-500',
          desc: 'Hình thái trang phục bảo toàn chuẩn mực các đặc trưng cốt lõi theo quy chế cổ truyền.'
        };
      case 'CONTEXT_SENSITIVE':
        return {
          badge: 'bg-indigo-50 text-indigo-800 border-indigo-200/80',
          icon: <Sparkles className="w-4 h-4 text-indigo-600" />,
          dot: 'bg-indigo-500',
          desc: 'Trang phục giữ vững cốt lõi nhận diện, kết hợp hài hòa với các biến tấu thời trang đương đại.'
        };
      case 'WEAKENS_RECOGNIZABILITY':
        return {
          badge: 'bg-amber-50 text-amber-800 border-amber-200/80',
          icon: <AlertTriangle className="w-4 h-4 text-amber-600" />,
          dot: 'bg-amber-500',
          desc: 'Một số đặc trưng thứ cấp hoặc chi tiết cổ áo/ống tay bị lai tạp làm giảm nét nhận diện đặc thù.'
        };
      case 'CHANGES_CORE_IDENTIFICATION':
        return {
          badge: 'bg-rose-50 text-rose-800 border-rose-200/80',
          icon: <XCircle className="w-4 h-4 text-rose-600" />,
          dot: 'bg-rose-500',
          desc: 'Có đặc trưng thiết yếu bị biến đổi trực tiếp, làm diện mạo dịch chuyển khỏi dáng áo nền ban đầu.'
        };
      case 'INSUFFICIENT_EVIDENCE':
      default:
        return {
          badge: 'bg-stone-100 text-stone-700 border-stone-200',
          icon: <HelpCircle className="w-4 h-4 text-stone-500" />,
          dot: 'bg-stone-400',
          desc: 'Góc chụp hoặc bố cục ảnh chưa cung cấp đủ bằng chứng trực quan để khẳng định trọn vẹn.'
        };
    }
  };

  const getVerdictBadge = (verdict: TraitVerdict) => {
    switch (verdict) {
      case 'PASS':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Quan sát thấy</span>
          </span>
        );
      case 'PARTIAL':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/60">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            <span>Biến tấu nhẹ</span>
          </span>
        );
      case 'FAIL':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/60">
            <XCircle className="w-3 h-3 text-rose-600" />
            <span>Lệch chuẩn</span>
          </span>
        );
      case 'NOT_ASSESSABLE':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-stone-100 text-stone-600 border border-stone-200/80">
            <Eye className="w-3 h-3 text-stone-400" />
            <span>Khuất tầm nhìn</span>
          </span>
        );
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'essential':
        return { label: 'Yếu tố cốt lõi (Essential)', color: 'text-amber-800 bg-amber-50 border-amber-200/80' };
      case 'strongly_characteristic':
        return { label: 'Đặc trưng nổi bật', color: 'text-indigo-800 bg-indigo-50 border-indigo-200/80' };
      case 'supporting':
        return { label: 'Đặc trưng bổ trợ', color: 'text-stone-700 bg-stone-100 border-stone-200' };
      case 'variable':
      default:
        return { label: 'Biến thể linh hoạt', color: 'text-stone-600 bg-stone-50 border-stone-200/60' };
    }
  };

  const hasCorrectionTargets =
    correctionPlan &&
    ((correctionPlan.culturalDeltas && correctionPlan.culturalDeltas.length > 0) ||
      (correctionPlan.fidelityDeltas && correctionPlan.fidelityDeltas.length > 0));

  const isRevisionLimitReached = revisionIndex >= 2;

  return (
    <div className="rounded-3xl p-5 sm:p-6 bg-white/95 border border-stone-200/90 shadow-sm space-y-4 transition-all duration-300">
      {/* ------------------------------------------------------------------- */}
      {/* 1. LOADING / IDLE AUTO-INITIALIZING STATE ("Ảnh Hiện Trước, QA Theo Sau") */}
      {/* ------------------------------------------------------------------- */}
      {(qaState.status === 'loading' || qaState.status === 'idle') && (
        <div className="flex items-center gap-4 py-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200/80 flex items-center justify-center shrink-0 shadow-2xs">
            <div className="w-5 h-5 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
          </div>
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-stone-900">
                Đang thẩm định trực quan các đặc trưng nhận diện...
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 animate-pulse">
                Gemini Vision
              </span>
            </div>
            <p className="text-xs text-stone-500 font-normal truncate">
              Đang đối chiếu tỉ lệ ống tay, nẹp cổ lập lĩnh, vạt áo và độ hòa sắc của bản phối.
            </p>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* 3. ERROR STATE */}
      {/* ------------------------------------------------------------------- */}
      {qaState.status === 'error' && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-1">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200/70 text-amber-700 flex items-center justify-center shrink-0 shadow-2xs">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <span className="text-xs font-semibold text-stone-900">
                Chưa thể hoàn tất kiểm định thị giác
              </span>
              <p className="text-xs text-stone-600 font-normal leading-relaxed">
                {qaState.message}
              </p>
            </div>
          </div>

          {qaState.retryable && (
            <button
              type="button"
              onClick={onVerify}
              className="rounded-full px-4 py-1.5 text-xs font-medium bg-stone-100 hover:bg-stone-200 border border-stone-200 text-stone-800 transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer self-start sm:self-center"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Thử lại</span>
            </button>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* 4. SUCCESS STATE: Verified Results Card */}
      {/* ------------------------------------------------------------------- */}
      {qaState.status === 'success' && qaState.result && (
        <div className="space-y-5">
          {/* Top Banner: Overall Status */}
          {(() => {
            const statusStyle = getStatusBadge(qaState.result.culturalIdentity.overallStatus);
            return (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-stone-100">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-stone-50 border border-stone-200/80 flex items-center justify-center shrink-0 shadow-2xs">
                    {statusStyle.icon}
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                        KẾT QUẢ THẨM ĐỊNH THỊ GIÁC (v{revisionIndex})
                      </span>
                      <span className="text-stone-300">•</span>
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold border ${statusStyle.badge}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                        <span>{qaState.result.culturalIdentity.statusLabelVi}</span>
                      </span>
                    </div>
                    <p className="text-xs text-stone-600 font-normal leading-relaxed">
                      {statusStyle.desc}
                    </p>
                  </div>
                </div>

                {/* Metric Pill & Expand Toggle */}
                <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                  {(() => {
                    const traitsList = qaState.result.culturalIdentity.traits || [];
                    const passCount = traitsList.filter(t => t.verdict === 'PASS').length;
                    const needFixCount = traitsList.filter(t => t.verdict === 'FAIL' || t.verdict === 'PARTIAL').length;
                    const assessable = qaState.result.culturalIdentity.assessableTraitsCount;
                    const total = qaState.result.culturalIdentity.totalTraitsCount;
                    return (
                      <span className="px-3 py-1 rounded-full text-[11px] font-medium bg-stone-100 text-stone-700 border border-stone-200/80 shadow-2xs">
                        Đánh giá được {assessable}/{total} · {passCount} đạt{needFixCount > 0 ? ` · ${needFixCount} cần chỉnh` : ''}
                      </span>
                    );
                  })()}
                  <button
                    type="button"
                    onClick={() => setIsDetailsExpanded(prev => !prev)}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200/80 border border-stone-200 transition-colors cursor-pointer"
                  >
                    <span>{isDetailsExpanded ? 'Thu gọn' : 'Xem chi tiết'}</span>
                    {isDetailsExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            );
          })()}

          {/* DUAL-SOURCE GROUNDED REVISION PLAN & USER CTA / COMPACT SUCCESS STATE */}
          {hasCorrectionTargets ? (
            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/90 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-900">
                    <Wand2 className="w-4 h-4 text-amber-600" />
                    <span>Kế hoạch tinh chỉnh chuẩn xác hai nguồn (Grounded Correction)</span>
                  </div>
                  <p className="text-[11px] text-amber-700 font-normal">
                    {correctionPlan?.revisionTargetSummary}
                  </p>
                </div>

                {!isRevisionLimitReached && onTriggerRevision ? (
                  <button
                    type="button"
                    onClick={onTriggerRevision}
                    disabled={isGeneratingLookbook}
                    className="rounded-full px-5 py-2 text-xs font-semibold bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-sm shadow-indigo-200/50 flex items-center gap-2 shrink-0 cursor-pointer self-start sm:self-center transition-all disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Tinh chỉnh theo thẩm định ✦ (Lần {revisionIndex + 1}/2)</span>
                  </button>
                ) : isRevisionLimitReached ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-stone-200/80 text-stone-700 border border-stone-300 shadow-2xs self-start sm:self-center">
                    <Lock className="w-3.5 h-3.5 text-stone-500" />
                    <span>Đã đạt giới hạn tối đa 2 lần tinh chỉnh</span>
                  </div>
                ) : null}
              </div>

              {/* Deltas breakdown */}
              <div className="space-y-2 pt-1 border-t border-amber-200/60 text-xs">
                {correctionPlan?.culturalDeltas && correctionPlan.culturalDeltas.length > 0 && (
                  <div className="space-y-1 text-[11px] text-amber-900">
                    <span className="font-semibold">Mục tiêu chuẩn hóa văn hóa:</span>
                    <ul className="list-disc list-inside pl-1 text-amber-800 space-y-0.5">
                      {correctionPlan.culturalDeltas.map(cd => (
                        <li key={cd.traitId}>
                          <strong>{cd.traitNameVi}</strong>: {cd.canonicalGuidance}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {correctionPlan?.fidelityDeltas && correctionPlan.fidelityDeltas.length > 0 && (
                  <div className="space-y-1 text-[11px] text-amber-900">
                    <span className="font-semibold">Mục tiêu khớp bản phối:</span>
                    <ul className="list-disc list-inside pl-1 text-amber-800 space-y-0.5">
                      {correctionPlan.fidelityDeltas.map((fd, idx) => (
                        <li key={idx}>
                          <strong>{fd.element}</strong>: {fd.description} ({fd.expectedValue})
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Compact Success State when no actionable FAIL or PARTIAL targets exist */
            <div className="p-3.5 sm:p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 flex items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-start sm:items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 border border-emerald-200/70 flex items-center justify-center shrink-0 shadow-2xs">
                  <CheckCircle2 className="w-4.5 h-4.5" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <span className="text-xs font-semibold text-emerald-950 block">
                    Không có điểm cần tinh chỉnh theo thẩm định
                  </span>
                  <p className="text-[11px] text-emerald-800/90 font-normal leading-relaxed">
                    Tất cả đặc trưng quan sát được đều đạt chuẩn mực; các yếu tố không đánh giá được (nếu có) không được coi là lỗi.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Collapsible Details Section */}
          {isDetailsExpanded && (
            <div className="space-y-4 pt-1 animate-in fade-in duration-200">
              {/* Tab Navigation */}
              <div className="flex items-center gap-2 border-b border-stone-200/70 pb-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('IDENTITY')}
                  className={`px-3.5 py-1.5 rounded-full text-xs transition-all cursor-pointer ${
                    activeTab === 'IDENTITY'
                      ? 'bg-indigo-600 text-white font-semibold shadow-2xs'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100 font-medium'
                  }`}
                >
                  Đặc trưng nhận diện cổ phục
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('FIDELITY')}
                  className={`px-3.5 py-1.5 rounded-full text-xs transition-all cursor-pointer ${
                    activeTab === 'FIDELITY'
                      ? 'bg-indigo-600 text-white font-semibold shadow-2xs'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100 font-medium'
                  }`}
                >
                  Độ tương khớp bản phối (Fidelity)
                </button>
                {revisions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('TRANSITIONS')}
                    className={`px-3.5 py-1.5 rounded-full text-xs transition-all cursor-pointer ${
                      activeTab === 'TRANSITIONS'
                        ? 'bg-indigo-600 text-white font-semibold shadow-2xs'
                        : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100 font-medium'
                    }`}
                  >
                    Chuyển dịch qua các lần tinh chỉnh ({revisions.length})
                  </button>
                )}
              </div>

              {/* TAB 1: CULTURAL TRAITS BREAKDOWN */}
              {activeTab === 'IDENTITY' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 gap-2.5">
                    {qaState.result.culturalIdentity.traits.map(trait => {
                      const cat = getCategoryLabel(trait.category);
                      return (
                        <div
                          key={trait.traitId}
                          className="p-3.5 rounded-2xl bg-stone-50/90 border border-stone-200/70 space-y-2 text-xs"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${cat.color} shrink-0`}
                              >
                                {cat.label}
                              </span>
                              <span className="font-semibold text-stone-900 truncate">
                                {trait.traitNameVi}
                              </span>
                            </div>
                            {getVerdictBadge(trait.verdict)}
                          </div>

                          <p className="text-stone-600 font-normal leading-relaxed pl-1">
                            {trait.visualEvidence}
                          </p>

                          {trait.observedDeviation && (
                            <div className="p-2 rounded-xl bg-amber-50/80 border border-amber-200/60 text-[11px] text-amber-900 flex items-start gap-1.5">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                              <span>Ghi nhận sai lệch: {trait.observedDeviation}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 2: OUTFIT FIDELITY DETAILS */}
              {activeTab === 'FIDELITY' && (
                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Palette Match */}
                    <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/70 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-stone-900 flex items-center gap-1.5">
                          <Palette className="w-3.5 h-3.5 text-stone-500" />
                          <span>Hòa sắc bảng màu</span>
                        </span>
                        {getVerdictBadge(qaState.result.outfitFidelity.details.palette.primaryMatch)}
                      </div>
                      <div className="space-y-1 text-[11px] text-stone-600">
                        <div className="flex items-center justify-between">
                          <span>Màu chủ đạo:</span>
                          {getVerdictBadge(qaState.result.outfitFidelity.details.palette.primaryMatch)}
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Màu phối cùng:</span>
                          {getVerdictBadge(qaState.result.outfitFidelity.details.palette.supportingMatch)}
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Màu điểm nhấn:</span>
                          {getVerdictBadge(qaState.result.outfitFidelity.details.palette.accentMatch)}
                        </div>
                      </div>
                      {qaState.result.outfitFidelity.details.palette.notes && (
                        <p className="text-[11px] text-stone-500 italic">
                          {qaState.result.outfitFidelity.details.palette.notes}
                        </p>
                      )}
                    </div>

                    {/* Fabric & Structure */}
                    <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/70 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-stone-900 flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-stone-500" />
                          <span>Chất liệu & Cấu trúc</span>
                        </span>
                        {getVerdictBadge(qaState.result.outfitFidelity.details.fabricMatch)}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-stone-600">Hạ phục:</span>
                        {getVerdictBadge(qaState.result.outfitFidelity.details.lowerGarmentMatch)}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-stone-600">Giày dép:</span>
                        {getVerdictBadge(qaState.result.outfitFidelity.details.footwearMatch)}
                      </div>
                    </div>
                  </div>

                  {/* Accessories Match & Unexpected Accessories */}
                  <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/70 space-y-2">
                    <span className="font-semibold text-stone-900">
                      Phụ kiện đối soát
                    </span>
                    {qaState.result.outfitFidelity.details.expectedAccessories.length > 0 ? (
                      <div className="space-y-1.5">
                        {qaState.result.outfitFidelity.details.expectedAccessories.map((acc, idx) => (
                          <div
                            key={acc.accessoryId || idx}
                            className="flex items-center justify-between p-2 rounded-xl bg-white border border-stone-200/60"
                          >
                            <span className="font-medium text-stone-800">
                              Phụ kiện: {acc.accessoryId}
                            </span>
                            {getVerdictBadge(acc.verdict)}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-stone-500 text-[11px]">
                        Bản phối yêu cầu không dùng phụ kiện.
                      </p>
                    )}

                    {/* Unexpected Accessories Warning */}
                    {qaState.result.outfitFidelity.details.unexpectedAccessories.length > 0 && (
                      <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200/70 text-[11px] text-amber-900 space-y-1">
                        <div className="font-semibold flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          <span>Phát hiện chi tiết ngoài bản phối:</span>
                        </div>
                        <ul className="list-disc list-inside pl-1 text-amber-800">
                          {qaState.result.outfitFidelity.details.unexpectedAccessories.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: TRAIT TRANSITIONS */}
              {activeTab === 'TRANSITIONS' && revisions.length > 1 && (
                <TraitTransitionsView
                  revisions={revisions}
                  activeRevisionIndex={revisionIndex}
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
