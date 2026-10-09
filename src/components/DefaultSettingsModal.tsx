import React, { useState, useEffect } from 'react';
import {
  X,
  Settings,
  Type,
  Palette,
  Maximize2,
  Share2,
  RotateCcw,
  Check,
  Sparkles,
  Sliders,
  Grid,
  FileCode,
  Layers,
  ArrowRightLeft,
  Square,
  Eye,
} from 'lucide-react';
import { SiteDefaultSettings, LineType, FlowchartNodeType, FlowchartNode, ShapeTypeColorConfig } from '../types/flowchart';
import { ColorTheme, THEMES } from '../constants/themes';
import { TranslationDictionary } from '../constants/translations';
import { FONT_OPTIONS, COLOR_SWATCHES, DEFAULT_SITE_SETTINGS, DEFAULT_SHAPE_TYPE_COLORS } from '../utils/defaultSettings';
import { renderNodeShapePath } from '../utils/shapePaths';

interface DefaultSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: ColorTheme;
  t: TranslationDictionary;
  lang: 'fa' | 'en';
  currentSettings: SiteDefaultSettings;
  onSaveSettings: (settings: SiteDefaultSettings) => void;
  onApplyToExistingNodes?: (settings: SiteDefaultSettings) => void;
  onResetToFactory?: () => void;
}

const SHAPE_TYPE_LIST: Array<{
  type: FlowchartNodeType;
  label: string;
  badge: string;
  desc: string;
  defaultText: string;
}> = [
  { type: 'terminal', label: 'شروع / پایان', badge: 'Terminal', desc: 'بیضی کپسولی برای نقطه آغاز و فرجام جریان فرآیند', defaultText: 'شروع / پایان' },
  { type: 'process', label: 'عملیات / فرآیند', badge: 'Process', desc: 'مستطیل برای انجام محاسبات، فعالیت‌ها و اقدامات اجرایی', defaultText: 'عملیات فرآیند' },
  { type: 'decision', label: 'شرط / تصمیم‌گیری', badge: 'Decision', desc: 'لوزی برای ارزیابی شروط، انشعابات بله / خیر و تصمیم‌ها', defaultText: 'آیا معتبر است؟' },
  { type: 'input-output', label: 'ورودی / خروجی', badge: 'I/O', desc: 'متوازی‌الاضلاع برای دریافت ورودی از کاربر یا صدور خروجی', defaultText: 'دریافت داده‌ها' },
  { type: 'document', label: 'سند / گزارش', badge: 'Document', desc: 'شکل سند برای گزارش‌های آماری، فاکتورها، اسناد و فرم‌ها', defaultText: 'سند و گزارش' },
  { type: 'subroutine', label: 'زیرفرآیند / تابع', badge: 'Subroutine', desc: 'مستطیل دوبل برای زیرسیستم‌ها، توابع مجزا و رویه‌ها', defaultText: 'فراخوانی سرویس' },
  { type: 'database', label: 'پایگاه داده', badge: 'Database', desc: 'استوانه برای ذخیره‌سازی، جستجو و بازیابی داده‌ها', defaultText: 'پایگاه داده' },
  { type: 'connector', label: 'ارجاع / اتصال‌دهنده', badge: 'Connector', desc: 'دایره برای اتصال بخش‌های مختلف و پرش بین مسیرها', defaultText: 'A' },
  { type: 'note', label: 'یادداشت / نکته', badge: 'Note', desc: 'برگه یادداشت تاخورده برای توضیحات، نکات کلیدی و هشدارها', defaultText: 'یادداشت توضیحی' },
];

export const DefaultSettingsModal: React.FC<DefaultSettingsModalProps> = ({
  isOpen,
  onClose,
  theme,
  t,
  lang,
  currentSettings,
  onSaveSettings,
  onApplyToExistingNodes,
  onResetToFactory,
}) => {
  const [draft, setDraft] = useState<SiteDefaultSettings>(currentSettings);
  const [activeTab, setActiveTab] = useState<'shapes' | 'shapeColors' | 'connectors' | 'canvas'>('shapes');
  const [selectedShapeType, setSelectedShapeType] = useState<FlowchartNodeType>('terminal');
  const [isSavedNotice, setIsSavedNotice] = useState(false);
  const [isAppliedNotice, setIsAppliedNotice] = useState(false);
  const [customFontInput, setCustomFontInput] = useState('');

  useEffect(() => {
    if (isOpen) {
      setDraft(currentSettings);
      setIsSavedNotice(false);
      setIsAppliedNotice(false);
      const isKnown = FONT_OPTIONS.some((f) => f.family === currentSettings.shapeFontFamily);
      if (!isKnown) {
        setCustomFontInput(currentSettings.shapeFontFamily);
      }
    }
  }, [isOpen, currentSettings]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveSettings(draft);
    setIsSavedNotice(true);
    setTimeout(() => {
      setIsSavedNotice(false);
      onClose();
    }, 900);
  };

  const handleApplyToAll = () => {
    if (onApplyToExistingNodes) {
      onApplyToExistingNodes(draft);
      setIsAppliedNotice(true);
      setTimeout(() => setIsAppliedNotice(false), 2000);
    }
  };

  const handleReset = () => {
    setDraft({ ...DEFAULT_SITE_SETTINGS });
    if (onResetToFactory) {
      onResetToFactory();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs select-none animate-in fade-in">
      <div
        className="w-full max-w-3xl max-h-[92vh] flex flex-col rounded-2xl shadow-2xl border overflow-hidden transition-all"
        style={{
          backgroundColor: theme.ui.cardBg,
          borderColor: theme.ui.border,
          color: theme.ui.textPrimary,
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-3.5 border-b shrink-0"
          style={{ borderColor: theme.ui.border }}
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base leading-tight">
                تنظیمات پیش‌فرض سایت و اشکال
              </h3>
              <p className="text-[11px] opacity-65 leading-tight">
                پیکربندی استایل پیش‌فرض برای ایجاد اشکال جدید، قلم‌ها، رنگ‌ها و بوم کار
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:opacity-75 transition-opacity"
            title="بستن"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div
          className="flex items-center gap-2 px-5 pt-3 border-b shrink-0 text-xs font-semibold"
          style={{ borderColor: theme.ui.border }}
        >
          <button
            onClick={() => setActiveTab('shapes')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'shapes'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
                : 'border-transparent opacity-70 hover:opacity-100'
            }`}
          >
            <Type className="w-4 h-4" />
            <span>قلم و ابعاد اشکال</span>
          </button>
          <button
            onClick={() => setActiveTab('shapeColors')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'shapeColors'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
                : 'border-transparent opacity-70 hover:opacity-100'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>رنگ اختصاصی هر شکل</span>
          </button>
          <button
            onClick={() => setActiveTab('connectors')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'connectors'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
                : 'border-transparent opacity-70 hover:opacity-100'
            }`}
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>خطوط و اتصالات</span>
          </button>
          <button
            onClick={() => setActiveTab('canvas')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'canvas'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
                : 'border-transparent opacity-70 hover:opacity-100'
            }`}
          >
            <Grid className="w-4 h-4" />
            <span>شبکه شطرنجی و محیط بوم</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* LIVE PREVIEW OF DEFAULT SHAPE */}
          <div
            className="p-4 rounded-xl border flex flex-col md:flex-row items-center justify-between gap-4"
            style={{
              backgroundColor: theme.ui.surface,
              borderColor: theme.ui.border,
            }}
          >
            <div className="flex items-center gap-2 text-xs">
              <Eye className="w-4 h-4 text-blue-500" />
              <span className="font-bold">پیش‌نمایش زنده شکل با تنظیمات پیش‌فرض:</span>
            </div>

            <div className="flex items-center justify-center p-3 bg-white dark:bg-slate-950/40 rounded-lg border border-slate-200 dark:border-slate-800 shadow-inner min-w-[240px]">
              <div
                style={{
                  width: `${Math.min(220, Math.max(120, draft.shapeWidth * 0.9))}px`,
                  height: `${Math.min(95, Math.max(48, draft.shapeHeight * 0.9))}px`,
                  backgroundColor: draft.shapeFill === 'transparent' ? 'transparent' : draft.shapeFill,
                  borderWidth: `${draft.shapeStrokeWidth}px`,
                  borderColor: draft.shapeStroke,
                  borderStyle: draft.shapeStrokeStyle,
                  borderRadius: `${draft.shapeBorderRadius}px`,
                  color: draft.shapeTextColor,
                  fontFamily: draft.shapeFontFamily,
                  fontSize: `${draft.shapeFontSize}px`,
                  fontWeight: draft.shapeFontWeight,
                  fontStyle: draft.shapeFontStyle,
                  textAlign: draft.shapeTextAlign,
                  opacity: draft.shapeOpacity,
                }}
                className="flex items-center justify-center px-2 py-1 shadow-xs transition-all overflow-hidden"
              >
                نمونه شکل پیش‌فرض
              </div>
            </div>
          </div>

          {/* ================= TAB 1: SHAPES & TYPOGRAPHY ================= */}
          {activeTab === 'shapes' && (
            <div className="space-y-5">
              {/* 1. FONT SELECTION */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold flex items-center gap-1.5">
                    <Type className="w-4 h-4 text-indigo-500" />
                    <span>فونت پیش‌فرض اشکال (Shape Font Family)</span>
                  </label>
                  <span className="text-[11px] opacity-60">انتخاب قلم استاندارد یا دستی</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {FONT_OPTIONS.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setDraft((s) => ({ ...s, shapeFontFamily: f.family }))}
                      className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer ${
                        draft.shapeFontFamily === f.family
                          ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 font-bold ring-2 ring-blue-500/20'
                          : 'hover:opacity-85'
                      }`}
                      style={{
                        borderColor: draft.shapeFontFamily === f.family ? '#2563EB' : theme.ui.border,
                        fontFamily: f.family,
                      }}
                    >
                      <div className="text-xs truncate">{f.label}</div>
                      <div className="text-[11px] opacity-60 mt-0.5 font-normal">نمونه متن ۱۲۳</div>
                    </button>
                  ))}
                </div>

                {/* Custom Font Name Input */}
                <div className="pt-2 flex items-center gap-2">
                  <span className="text-xs opacity-75 whitespace-nowrap">یا نام قلم دلخواه:</span>
                  <input
                    type="text"
                    value={customFontInput}
                    onChange={(e) => {
                      setCustomFontInput(e.target.value);
                      if (e.target.value.trim()) {
                        setDraft((s) => ({ ...s, shapeFontFamily: e.target.value.trim() }));
                      }
                    }}
                    placeholder="مثلاً: IRANSans, Sahel, B Nazanin..."
                    className="flex-1 px-3 py-1.5 rounded-lg border text-xs bg-transparent outline-none focus:ring-1 focus:ring-blue-500"
                    style={{ borderColor: theme.ui.border }}
                  />
                </div>
              </div>

              {/* 2. FONT SIZE, WEIGHT, STYLE, ALIGN */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t" style={{ borderColor: theme.ui.border }}>
                {/* Font Size */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold">اندازه قلم پیش‌فرض (Font Size)</label>
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      {draft.shapeFontSize}px
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={9}
                      max={32}
                      value={draft.shapeFontSize}
                      onChange={(e) =>
                        setDraft((s) => ({ ...s, shapeFontSize: Number(e.target.value) }))
                      }
                      className="flex-1 accent-blue-600"
                    />
                    <div className="flex gap-1">
                      {[11, 13, 16, 20].map((sz) => (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => setDraft((s) => ({ ...s, shapeFontSize: sz }))}
                          className={`px-2 py-1 rounded text-[11px] border font-mono ${
                            draft.shapeFontSize === sz
                              ? 'bg-blue-600 text-white font-bold'
                              : 'hover:opacity-80'
                          }`}
                          style={{ borderColor: theme.ui.border }}
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Text Formatting & Alignment */}
                <div className="space-y-2">
                  <label className="text-xs font-bold">فرمت و چیدمان متن</label>
                  <div className="flex items-center gap-2">
                    {/* Weight */}
                    <div className="flex rounded-lg border overflow-hidden" style={{ borderColor: theme.ui.border }}>
                      <button
                        type="button"
                        onClick={() => setDraft((s) => ({ ...s, shapeFontWeight: 'normal' }))}
                        className={`px-3 py-1.5 text-xs transition-colors ${
                          draft.shapeFontWeight === 'normal'
                            ? 'bg-blue-600 text-white font-bold'
                            : 'hover:opacity-80'
                        }`}
                      >
                        عادی
                      </button>
                      <button
                        type="button"
                        onClick={() => setDraft((s) => ({ ...s, shapeFontWeight: 'bold' }))}
                        className={`px-3 py-1.5 text-xs transition-colors ${
                          draft.shapeFontWeight === 'bold'
                            ? 'bg-blue-600 text-white font-bold'
                            : 'hover:opacity-80'
                        }`}
                      >
                        بولد
                      </button>
                    </div>

                    {/* Style */}
                    <button
                      type="button"
                      onClick={() =>
                        setDraft((s) => ({
                          ...s,
                          shapeFontStyle: s.shapeFontStyle === 'italic' ? 'normal' : 'italic',
                        }))
                      }
                      className={`px-3 py-1.5 text-xs rounded-lg border italic transition-colors ${
                        draft.shapeFontStyle === 'italic'
                          ? 'bg-blue-600 text-white font-bold'
                          : 'hover:opacity-80'
                      }`}
                      style={{ borderColor: theme.ui.border }}
                    >
                      مورب (Italic)
                    </button>

                    {/* Alignment */}
                    <div className="flex rounded-lg border overflow-hidden" style={{ borderColor: theme.ui.border }}>
                      {(
                        [
                          { id: 'right', label: 'راست' },
                          { id: 'center', label: 'وسط' },
                          { id: 'left', label: 'چپ' },
                        ] as const
                      ).map((al) => (
                        <button
                          key={al.id}
                          type="button"
                          onClick={() => setDraft((s) => ({ ...s, shapeTextAlign: al.id }))}
                          className={`px-2.5 py-1.5 text-xs transition-colors ${
                            draft.shapeTextAlign === al.id
                              ? 'bg-blue-600 text-white font-bold'
                              : 'hover:opacity-80'
                          }`}
                        >
                          {al.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. COLOR PALETTES & ADVANCED PICKERS */}
              <div className="space-y-3 pt-3 border-t" style={{ borderColor: theme.ui.border }}>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold flex items-center gap-1.5">
                    <Palette className="w-4 h-4 text-emerald-500" />
                    <span>رنگ‌بندی پیش‌فرض شکل‌ها (Fill, Stroke, Text)</span>
                  </label>
                  <span className="text-[11px] opacity-60">پالت‌های سریع یا انتخاب دستی Hex</span>
                </div>

                {/* Quick Swatches */}
                <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
                  {COLOR_SWATCHES.map((sw) => (
                    <button
                      key={sw.name}
                      type="button"
                      onClick={() =>
                        setDraft((s) => ({
                          ...s,
                          shapeFill: sw.fill,
                          shapeStroke: sw.stroke,
                          shapeTextColor: sw.text,
                        }))
                      }
                      className="h-8 rounded-lg border flex items-center justify-center transition-transform hover:scale-105 cursor-pointer shadow-xs"
                      style={{
                        backgroundColor: sw.fill === 'transparent' ? '#FFFFFF' : sw.fill,
                        borderColor: sw.stroke,
                      }}
                      title={sw.name}
                    >
                      <span className="text-[10px] font-bold" style={{ color: sw.text }}>
                        Aa
                      </span>
                    </button>
                  ))}
                </div>

                {/* Individual Color Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  {/* Fill Color */}
                  <div className="p-3 rounded-xl border space-y-1.5" style={{ borderColor: theme.ui.border }}>
                    <label className="text-[11px] font-semibold block">رنگ پس‌زمینه (Fill):</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={draft.shapeFill === 'transparent' ? '#ffffff' : draft.shapeFill}
                        onChange={(e) => setDraft((s) => ({ ...s, shapeFill: e.target.value }))}
                        className="w-8 h-8 rounded border cursor-pointer shrink-0"
                      />
                      <input
                        type="text"
                        value={draft.shapeFill}
                        onChange={(e) => setDraft((s) => ({ ...s, shapeFill: e.target.value }))}
                        className="flex-1 px-2 py-1 text-xs rounded border font-mono uppercase bg-transparent outline-none"
                        style={{ borderColor: theme.ui.border }}
                      />
                    </div>
                    <label className="flex items-center gap-1.5 text-[11px] pt-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={draft.shapeFill === 'transparent'}
                        onChange={(e) =>
                          setDraft((s) => ({
                            ...s,
                            shapeFill: e.target.checked ? 'transparent' : '#EEF2FF',
                          }))
                        }
                        className="rounded accent-blue-600 w-3.5 h-3.5"
                      />
                      <span className="opacity-75">بدون پس‌زمینه (شفاف)</span>
                    </label>
                  </div>

                  {/* Border / Stroke Color */}
                  <div className="p-3 rounded-xl border space-y-1.5" style={{ borderColor: theme.ui.border }}>
                    <label className="text-[11px] font-semibold block">رنگ خط دور (Stroke):</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={draft.shapeStroke}
                        onChange={(e) => setDraft((s) => ({ ...s, shapeStroke: e.target.value }))}
                        className="w-8 h-8 rounded border cursor-pointer shrink-0"
                      />
                      <input
                        type="text"
                        value={draft.shapeStroke}
                        onChange={(e) => setDraft((s) => ({ ...s, shapeStroke: e.target.value }))}
                        className="flex-1 px-2 py-1 text-xs rounded border font-mono uppercase bg-transparent outline-none"
                        style={{ borderColor: theme.ui.border }}
                      />
                    </div>
                  </div>

                  {/* Text Color */}
                  <div className="p-3 rounded-xl border space-y-1.5" style={{ borderColor: theme.ui.border }}>
                    <label className="text-[11px] font-semibold block">رنگ متن (Text):</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={draft.shapeTextColor}
                        onChange={(e) => setDraft((s) => ({ ...s, shapeTextColor: e.target.value }))}
                        className="w-8 h-8 rounded border cursor-pointer shrink-0"
                      />
                      <input
                        type="text"
                        value={draft.shapeTextColor}
                        onChange={(e) => setDraft((s) => ({ ...s, shapeTextColor: e.target.value }))}
                        className="flex-1 px-2 py-1 text-xs rounded border font-mono uppercase bg-transparent outline-none"
                        style={{ borderColor: theme.ui.border }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. SHAPE DIMENSIONS, CORNER RADIUS & STROKE */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t" style={{ borderColor: theme.ui.border }}>
                {/* Dimensions */}
                <div className="space-y-2">
                  <label className="text-xs font-bold flex items-center gap-1.5">
                    <Maximize2 className="w-4 h-4 text-blue-500" />
                    <span>ابعاد پیش‌فرض اشکال (عرض و ارتفاع)</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] opacity-60 block mb-0.5">عرض (W):</span>
                      <input
                        type="number"
                        min={80}
                        max={300}
                        value={draft.shapeWidth}
                        onChange={(e) =>
                          setDraft((s) => ({ ...s, shapeWidth: Math.max(80, Number(e.target.value)) }))
                        }
                        className="w-full px-2.5 py-1.5 rounded-lg border text-xs font-mono bg-transparent outline-none"
                        style={{ borderColor: theme.ui.border }}
                      />
                    </div>
                    <div>
                      <span className="text-[10px] opacity-60 block mb-0.5">ارتفاع (H):</span>
                      <input
                        type="number"
                        min={40}
                        max={200}
                        value={draft.shapeHeight}
                        onChange={(e) =>
                          setDraft((s) => ({ ...s, shapeHeight: Math.max(40, Number(e.target.value)) }))
                        }
                        className="w-full px-2.5 py-1.5 rounded-lg border text-xs font-mono bg-transparent outline-none"
                        style={{ borderColor: theme.ui.border }}
                      />
                    </div>
                  </div>
                </div>

                {/* Border Radius & Stroke Width */}
                <div className="space-y-2">
                  <label className="text-xs font-bold">گردی گوشه‌ها و ضخامت خط دور</label>
                  <div className="grid grid-cols-2 gap-2">
                    {/* Radius */}
                    <div>
                      <span className="text-[10px] opacity-60 block mb-0.5">گردی گوشه (Radius):</span>
                      <div className="flex gap-1">
                        {[0, 6, 12, 20].map((r) => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => setDraft((s) => ({ ...s, shapeBorderRadius: r }))}
                            className={`flex-1 py-1 rounded text-[11px] border font-mono ${
                              draft.shapeBorderRadius === r
                                ? 'bg-blue-600 text-white font-bold'
                                : 'hover:opacity-80'
                            }`}
                            style={{ borderColor: theme.ui.border }}
                          >
                            {r}px
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Stroke Width */}
                    <div>
                      <span className="text-[10px] opacity-60 block mb-0.5">ضخامت خط (Stroke):</span>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4].map((w) => (
                          <button
                            key={w}
                            type="button"
                            onClick={() => setDraft((s) => ({ ...s, shapeStrokeWidth: w }))}
                            className={`flex-1 py-1 rounded text-[11px] border font-mono ${
                              draft.shapeStrokeWidth === w
                                ? 'bg-blue-600 text-white font-bold'
                                : 'hover:opacity-80'
                            }`}
                            style={{ borderColor: theme.ui.border }}
                          >
                            {w}px
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 2: SHAPE-SPECIFIC COLORS ================= */}
          {activeTab === 'shapeColors' && (
            <div className="space-y-4">
              {/* Header / Intro Card */}
              <div
                className="p-3.5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                style={{ backgroundColor: theme.ui.surface, borderColor: theme.ui.border }}
              >
                <div className="flex items-center gap-2">
                  <Palette className="w-5 h-5 text-indigo-500 shrink-0" />
                  <div>
                    <span className="font-bold block">رنگ‌بندی منحصربه‌فرد برای هر نوع شکل</span>
                    <span className="opacity-70 text-[11px]">
                      هر شکل دارای رنگ زمینه، کادر و متن اختصاصی است تا در فلوچارت به‌راحتی تفکیک شود.
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setDraft((s) => ({
                      ...s,
                      shapeTypeColors: { ...DEFAULT_SHAPE_TYPE_COLORS },
                    }));
                  }}
                  className="px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold hover:bg-black/5 dark:hover:bg-white/5 transition-colors shrink-0 cursor-pointer"
                  style={{ borderColor: theme.ui.border }}
                >
                  بازنشانی همه اشکال به حالت استاندارد
                </button>
              </div>

              {/* Shape Type Selector Grid */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold block">انتخاب شکل جهت سفارشی‌سازی رنگ:</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {SHAPE_TYPE_LIST.map((item) => {
                    const typeColor =
                      draft.shapeTypeColors?.[item.type] || DEFAULT_SHAPE_TYPE_COLORS[item.type];
                    const isSelected = selectedShapeType === item.type;
                    return (
                      <button
                        key={item.type}
                        type="button"
                        onClick={() => setSelectedShapeType(item.type)}
                        className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 text-right transition-all cursor-pointer ${
                          isSelected
                            ? 'ring-2 ring-blue-500 border-blue-500 shadow-sm font-bold bg-blue-50/60 dark:bg-blue-950/40'
                            : 'hover:opacity-90'
                        }`}
                        style={{
                          backgroundColor: isSelected ? undefined : theme.ui.surface,
                          borderColor: isSelected ? undefined : theme.ui.border,
                        }}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="text-xs truncate">{item.label}</div>
                          <div className="text-[10px] opacity-60 font-mono">{item.badge}</div>
                        </div>
                        {/* Mini preview pill */}
                        <div
                          className="w-7 h-7 rounded-lg border shrink-0 flex items-center justify-center text-[10px] font-bold shadow-2xs"
                          style={{
                            backgroundColor: typeColor.fill === 'transparent' ? '#FFFFFF' : typeColor.fill,
                            borderColor: typeColor.stroke,
                            color: typeColor.textColor,
                            borderWidth: '2px',
                          }}
                        >
                          Aa
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Detail Customizer for Selected Shape */}
              {(() => {
                const selectedItem =
                  SHAPE_TYPE_LIST.find((item) => item.type === selectedShapeType) || SHAPE_TYPE_LIST[0];
                const currentColor =
                  draft.shapeTypeColors?.[selectedItem.type] || DEFAULT_SHAPE_TYPE_COLORS[selectedItem.type];

                const previewNode: FlowchartNode = {
                  id: 'preview',
                  type: selectedItem.type,
                  x: 10,
                  y: 10,
                  width: 180,
                  height: 70,
                  label: selectedItem.defaultText,
                  fill: currentColor.fill,
                  stroke: currentColor.stroke,
                  strokeWidth: 2,
                  strokeStyle: 'solid',
                  textColor: currentColor.textColor,
                  fontSize: 13,
                  fontWeight: 'bold',
                  textAlign: 'center',
                  fontFamily: draft.shapeFontFamily || 'Vazirmatn, sans-serif',
                  borderRadius: 8,
                };

                const shapeRender = renderNodeShapePath(previewNode);

                const updateSelectedColor = (partial: Partial<ShapeTypeColorConfig>) => {
                  setDraft((s) => ({
                    ...s,
                    shapeTypeColors: {
                      ...DEFAULT_SHAPE_TYPE_COLORS,
                      ...(s.shapeTypeColors || {}),
                      [selectedItem.type]: {
                        ...currentColor,
                        ...partial,
                      },
                    },
                  }));
                };

                return (
                  <div
                    className="p-4 rounded-xl border space-y-4"
                    style={{ backgroundColor: theme.ui.surface, borderColor: theme.ui.border }}
                  >
                    <div
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b"
                      style={{ borderColor: theme.ui.border }}
                    >
                      <div>
                        <div className="font-bold text-xs sm:text-sm flex items-center gap-2">
                          <span>رنگ اختصاصی:</span>
                          <span className="text-blue-600 dark:text-blue-400">{selectedItem.label}</span>
                        </div>
                        <p className="text-[11px] opacity-65 mt-0.5">{selectedItem.desc}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          updateSelectedColor(DEFAULT_SHAPE_TYPE_COLORS[selectedItem.type]);
                        }}
                        className="px-2.5 py-1 text-[11px] rounded-lg border hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer text-blue-600 dark:text-blue-400 font-semibold"
                        style={{ borderColor: theme.ui.border }}
                      >
                        بازنشانی این شکل به پیش‌فرض
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                      {/* Live SVG Preview */}
                      <div className="md:col-span-5 flex flex-col items-center justify-center p-4 bg-white dark:bg-slate-950/50 rounded-xl border border-slate-200 dark:border-slate-800 shadow-inner min-h-[140px]">
                        <div className="text-[10px] opacity-60 mb-2 font-semibold">پیش‌نمایش شکل:</div>
                        <svg width="200" height="90" viewBox="0 0 200 90" className="overflow-visible">
                          <g transform="translate(10, 10)">
                            {shapeRender.element === 'rect' && <rect {...shapeRender.props} />}
                            {shapeRender.element === 'polygon' && <polygon {...shapeRender.props} />}
                            {shapeRender.element === 'circle' && <circle {...shapeRender.props} />}
                            {shapeRender.element === 'path' && <path {...shapeRender.props} />}
                            {shapeRender.auxiliaryElements?.map((aux, i) => {
                              if (aux.element === 'line') return <line key={i} {...aux.props} />;
                              if (aux.element === 'ellipse') return <ellipse key={i} {...aux.props} />;
                              if (aux.element === 'polygon') return <polygon key={i} {...aux.props} />;
                              return null;
                            })}
                            <text
                              x="90"
                              y="39"
                              textAnchor="middle"
                              dominantBaseline="middle"
                              fill={currentColor.textColor}
                              fontSize="12"
                              fontWeight="bold"
                              fontFamily={draft.shapeFontFamily}
                            >
                              {selectedItem.defaultText}
                            </text>
                          </g>
                        </svg>
                      </div>

                      {/* Color controls */}
                      <div className="md:col-span-7 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          {/* Fill */}
                          <div className="p-2.5 rounded-xl border space-y-1" style={{ borderColor: theme.ui.border, backgroundColor: theme.ui.cardBg }}>
                            <label className="text-[11px] font-semibold block">رنگ پس‌زمینه (Fill):</label>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="color"
                                value={currentColor.fill === 'transparent' ? '#ffffff' : currentColor.fill}
                                onChange={(e) => updateSelectedColor({ fill: e.target.value })}
                                className="w-7 h-7 rounded border cursor-pointer shrink-0"
                              />
                              <input
                                type="text"
                                value={currentColor.fill}
                                onChange={(e) => updateSelectedColor({ fill: e.target.value })}
                                className="w-full px-1.5 py-1 text-[11px] rounded border font-mono uppercase bg-transparent outline-none"
                                style={{ borderColor: theme.ui.border }}
                              />
                            </div>
                            <label className="flex items-center gap-1 text-[10px] pt-0.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={currentColor.fill === 'transparent'}
                                onChange={(e) =>
                                  updateSelectedColor({
                                    fill: e.target.checked
                                      ? 'transparent'
                                      : DEFAULT_SHAPE_TYPE_COLORS[selectedItem.type].fill,
                                  })
                                }
                                className="rounded accent-blue-600 w-3 h-3"
                              />
                              <span className="opacity-75">شفاف</span>
                            </label>
                          </div>

                          {/* Stroke */}
                          <div className="p-2.5 rounded-xl border space-y-1" style={{ borderColor: theme.ui.border, backgroundColor: theme.ui.cardBg }}>
                            <label className="text-[11px] font-semibold block">رنگ خط دور (Stroke):</label>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="color"
                                value={currentColor.stroke}
                                onChange={(e) => updateSelectedColor({ stroke: e.target.value })}
                                className="w-7 h-7 rounded border cursor-pointer shrink-0"
                              />
                              <input
                                type="text"
                                value={currentColor.stroke}
                                onChange={(e) => updateSelectedColor({ stroke: e.target.value })}
                                className="w-full px-1.5 py-1 text-[11px] rounded border font-mono uppercase bg-transparent outline-none"
                                style={{ borderColor: theme.ui.border }}
                              />
                            </div>
                          </div>

                          {/* Text Color */}
                          <div className="p-2.5 rounded-xl border space-y-1" style={{ borderColor: theme.ui.border, backgroundColor: theme.ui.cardBg }}>
                            <label className="text-[11px] font-semibold block">رنگ متن (Text):</label>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="color"
                                value={currentColor.textColor}
                                onChange={(e) => updateSelectedColor({ textColor: e.target.value })}
                                className="w-7 h-7 rounded border cursor-pointer shrink-0"
                              />
                              <input
                                type="text"
                                value={currentColor.textColor}
                                onChange={(e) => updateSelectedColor({ textColor: e.target.value })}
                                className="w-full px-1.5 py-1 text-[11px] rounded border font-mono uppercase bg-transparent outline-none"
                                style={{ borderColor: theme.ui.border }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Quick Swatches */}
                        <div className="space-y-1 pt-1">
                          <span className="text-[11px] opacity-70 block font-semibold">پالت‌های آماده برای این شکل:</span>
                          <div className="grid grid-cols-5 sm:grid-cols-10 gap-1">
                            {COLOR_SWATCHES.map((sw) => (
                              <button
                                key={sw.name}
                                type="button"
                                onClick={() =>
                                  updateSelectedColor({
                                    fill: sw.fill,
                                    stroke: sw.stroke,
                                    textColor: sw.text,
                                  })
                                }
                                className="h-7 rounded-lg border flex items-center justify-center transition-transform hover:scale-105 cursor-pointer shadow-2xs"
                                style={{
                                  backgroundColor: sw.fill === 'transparent' ? '#FFFFFF' : sw.fill,
                                  borderColor: sw.stroke,
                                }}
                                title={sw.name}
                              >
                                <span className="text-[9px] font-bold" style={{ color: sw.text }}>
                                  Aa
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
          {activeTab === 'connectors' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold">نوع خط اتصال پیش‌فرض (Line Type)</label>
                <div className="grid grid-cols-3 gap-2.5">
                  {(
                    [
                      { id: 'orthogonal', title: 'شکسته عمود (Orthogonal)', desc: 'زاویه ۹۰ درجه استاندارد' },
                      { id: 'curved', title: 'منحنی نرم (Curved)', desc: 'قوس روان بزیر' },
                      { id: 'straight', title: 'مستقیم (Straight)', desc: 'خط مستقیم نقطه به نقطه' },
                    ] as const
                  ).map((lt) => (
                    <button
                      key={lt.id}
                      type="button"
                      onClick={() => setDraft((s) => ({ ...s, connectorLineType: lt.id }))}
                      className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                        draft.connectorLineType === lt.id
                          ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 ring-2 ring-blue-500/20'
                          : 'hover:opacity-80'
                      }`}
                      style={{ borderColor: draft.connectorLineType === lt.id ? '#2563EB' : theme.ui.border }}
                    >
                      <div className="text-xs font-bold">{lt.title}</div>
                      <div className="text-[10px] opacity-60 mt-0.5">{lt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Connector Color and Width */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t" style={{ borderColor: theme.ui.border }}>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold">رنگ خط اتصال:</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={draft.connectorColor}
                      onChange={(e) => setDraft((s) => ({ ...s, connectorColor: e.target.value }))}
                      className="w-8 h-8 rounded border cursor-pointer shrink-0"
                    />
                    <input
                      type="text"
                      value={draft.connectorColor}
                      onChange={(e) => setDraft((s) => ({ ...s, connectorColor: e.target.value }))}
                      className="flex-1 px-2.5 py-1.5 text-xs rounded border font-mono uppercase bg-transparent outline-none"
                      style={{ borderColor: theme.ui.border }}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold">ضخامت و استایل خط اتصال:</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4].map((w) => (
                      <button
                        key={w}
                        type="button"
                        onClick={() => setDraft((s) => ({ ...s, connectorStrokeWidth: w }))}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-mono border ${
                          draft.connectorStrokeWidth === w
                            ? 'bg-blue-600 text-white font-bold'
                            : 'hover:opacity-80'
                        }`}
                        style={{ borderColor: theme.ui.border }}
                      >
                        {w}px
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() =>
                        setDraft((s) => ({
                          ...s,
                          connectorStyle: s.connectorStyle === 'dashed' ? 'solid' : 'dashed',
                        }))
                      }
                      className={`px-3 py-1.5 rounded-lg text-xs border ${
                        draft.connectorStyle === 'dashed'
                          ? 'bg-blue-600 text-white font-bold'
                          : 'hover:opacity-80'
                      }`}
                      style={{ borderColor: theme.ui.border }}
                    >
                      خط‌چین
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 3: CANVAS & ENVIRONMENT ================= */}
          {activeTab === 'canvas' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold">شبکه شطرنجی پیش‌فرض بوم (Grid Mode)</label>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { id: 'dots', label: 'نقاط شطرنجی (Dots)' },
                      { id: 'lines', label: 'خطوط شطرنجی (Lines)' },
                      { id: 'none', label: 'صفحه خالی (None)' },
                    ] as const
                  ).map((gm) => (
                    <button
                      key={gm.id}
                      type="button"
                      onClick={() => setDraft((s) => ({ ...s, gridMode: gm.id }))}
                      className={`py-2 px-3 rounded-xl border text-xs transition-colors ${
                        draft.gridMode === gm.id
                          ? 'bg-blue-600 text-white font-bold shadow-xs'
                          : 'hover:opacity-80'
                      }`}
                      style={{ borderColor: draft.gridMode === gm.id ? '#2563EB' : theme.ui.border }}
                    >
                      {gm.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Snap to Grid */}
              <div
                className="p-3.5 rounded-xl border flex items-center justify-between"
                style={{ borderColor: theme.ui.border, backgroundColor: theme.ui.surface }}
              >
                <div>
                  <div className="font-bold text-xs">قفل و تراز خودکار به شبکه شطرنجی (Snap to Grid)</div>
                  <div className="text-[11px] opacity-60">
                    هنگام جابجایی یا کشیدن شکل‌ها، نقاط به صورت مرتب روی گره‌های شبکه قرار می‌گیرند.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={draft.snapToGrid}
                  onChange={(e) => setDraft((s) => ({ ...s, snapToGrid: e.target.checked }))}
                  className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                />
              </div>

              {/* Default Theme */}
              <div className="space-y-2 pt-2">
                <label className="text-xs font-bold">تم ظاهری پیش‌فرض سیستم</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {Object.values(THEMES).map((th) => (
                    <button
                      key={th.id}
                      type="button"
                      onClick={() => setDraft((s) => ({ ...s, defaultTheme: th.id }))}
                      className={`p-2.5 rounded-xl border text-right transition-colors ${
                        draft.defaultTheme === th.id
                          ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 font-bold'
                          : 'hover:opacity-80'
                      }`}
                      style={{ borderColor: draft.defaultTheme === th.id ? '#2563EB' : theme.ui.border }}
                    >
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-3 h-3 rounded-full border shrink-0"
                          style={{ backgroundColor: th.ui.accent, borderColor: th.ui.border }}
                        />
                        <span className="text-xs">{lang === 'fa' ? th.nameFa : th.nameEn}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 border-t shrink-0 text-xs"
          style={{ borderColor: theme.ui.border, backgroundColor: theme.ui.surface }}
        >
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border opacity-75 hover:opacity-100 transition-opacity"
              style={{ borderColor: theme.ui.border }}
              title="بازنشانی تمام مقادیر به حالت اولیه کارخانه"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>پیش‌فرض کارخانه</span>
            </button>

            {onApplyToExistingNodes && (
              <button
                type="button"
                onClick={handleApplyToAll}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
                style={{ borderColor: theme.ui.border }}
                title="اعمال فونت، رنگ و استایل این تنظیمات روی تمام اشکال موجود در پروژه کنونی"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>اعمال روی اشکال موجود</span>
                {isAppliedNotice && <Check className="w-3.5 h-3.5 text-emerald-500" />}
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border hover:opacity-80 transition-opacity"
              style={{ borderColor: theme.ui.border }}
            >
              انصراف
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center justify-center gap-1.5 px-5 py-2 rounded-xl font-bold text-white shadow-md transition-all hover:opacity-95"
              style={{ backgroundColor: theme.ui.accent }}
            >
              {isSavedNotice ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>ذخیره شد!</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>ذخیره تنظیمات پیش‌فرض</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
