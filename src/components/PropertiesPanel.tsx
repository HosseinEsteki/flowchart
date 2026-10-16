import React, { useState } from 'react';
import {
  FlowchartNode,
  FlowchartEdge,
  LineType,
} from '../types/flowchart';
import { ColorTheme } from '../constants/themes';
import { TranslationDictionary } from '../constants/translations';
import {
  Sliders,
  Type,
  Maximize2,
  Palette,
  Trash2,
  Copy,
  Grid,
  Hash,
  Layers,
  Sparkles,
  Bold,
  Italic,
  Settings,
  Minimize2,
  Image as ImageIcon,
  Upload,
  Clipboard,
  Zap,
  ArrowLeft,
  ArrowRight,
  ArrowLeftRight,
} from 'lucide-react';
import { FONT_OPTIONS, COLOR_SWATCHES } from '../utils/defaultSettings';
import { trimShapeText, trimNodeTextAndAdjustHeight } from '../utils/shapePaths';

interface PropertiesPanelProps {
  theme: ColorTheme;
  t: TranslationDictionary;
  selectedNode: FlowchartNode | null;
  selectedNodes?: FlowchartNode[];
  selectedNodeIds?: string[];
  onSelectNodes?: (ids: string[]) => void;
  selectedEdge: FlowchartEdge | null;
  onUpdateNode: (node: FlowchartNode) => void;
  onUpdateNodes?: (nodes: FlowchartNode[]) => void;
  onDeleteNode: (id: string) => void;
  onDeleteNodes?: (ids: string[]) => void;
  onDuplicateNode: (id: string) => void;
  onDuplicateNodes?: (ids: string[]) => void;
  onAlignNodes?: (alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => void;
  onDistributeNodes?: (direction: 'horizontal' | 'vertical') => void;
  onBatchChangeColor?: (fill?: string, stroke?: string, textColor?: string) => void;
  onUpdateEdge: (edge: FlowchartEdge) => void;
  onDeleteEdge: (id: string) => void;
  gridMode: 'dots' | 'lines' | 'none';
  setGridMode: (mode: 'dots' | 'lines' | 'none') => void;
  snapToGrid: boolean;
  setSnapToGrid: (snap: boolean) => void;
  nodeCount: number;
  edgeCount: number;
  onClearCanvas: () => void;
  onOpenDefaultSettings?: () => void;
  onTrimAllNodes?: () => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  theme,
  t,
  selectedNode,
  selectedNodes,
  selectedNodeIds,
  onSelectNodes,
  selectedEdge,
  onUpdateNode,
  onUpdateNodes,
  onDeleteNode,
  onDeleteNodes,
  onDuplicateNode,
  onDuplicateNodes,
  onAlignNodes,
  onDistributeNodes,
  onBatchChangeColor,
  onUpdateEdge,
  onDeleteEdge,
  gridMode,
  setGridMode,
  snapToGrid,
  setSnapToGrid,
  nodeCount,
  edgeCount,
  onClearCanvas,
  onOpenDefaultSettings,
  onTrimAllNodes,
}) => {
  const [customFontInput, setCustomFontInput] = useState('');

  // Auto-fit node width and height based on text content
  const handleAutoFitSize = (node: FlowchartNode) => {
    const lines = (node.label || '').split('\n');
    const maxLineLength = Math.max(...lines.map((l) => l.length), 4);
    const fontSize = node.fontSize || 13;
    const estWidth = Math.max(100, Math.min(360, Math.round(maxLineLength * fontSize * 0.72 + 40)));
    const estHeight = Math.max(50, Math.min(260, Math.round(lines.length * fontSize * 1.45 + 32)));

    onUpdateNode({
      ...node,
      width: estWidth,
      height: estHeight,
    });
  };

  return (
    <aside
      className="hidden xl:flex w-72 h-[calc(100vh-3.5rem)] flex-col border-l select-none overflow-y-auto p-4 space-y-4"
      style={{
        backgroundColor: theme.ui.cardBg,
        borderColor: theme.ui.border,
        color: theme.ui.textPrimary,
      }}
    >
      <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: theme.ui.border }}>
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-blue-500" />
          <span className="text-xs font-bold uppercase tracking-wider">{t.properties}</span>
        </div>
        {onOpenDefaultSettings && (
          <button
            type="button"
            onClick={onOpenDefaultSettings}
            className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:opacity-80 transition-opacity"
            title="تنظیمات پیش‌فرض سایت"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>تنظیمات پیش‌فرض</span>
          </button>
        )}
      </div>

      {/* ================= CASE 0: MULTIPLE NODES SELECTED ================= */}
      {selectedNodes && selectedNodes.length > 1 && (
        <div className="space-y-4 text-right animate-in fade-in">
          {/* Header Card */}
          <div
            className="p-3 rounded-xl border flex items-center justify-between"
            style={{ backgroundColor: theme.ui.surface, borderColor: theme.ui.border }}
          >
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-500" />
              <div>
                <div className="text-xs font-bold">انتخاب گروهی اشکال</div>
                <div className="text-[10px] opacity-70">
                  {selectedNodes.length} شکل به‌طور همزمان انتخاب شده است
                </div>
              </div>
            </div>
            {onSelectNodes && (
              <button
                type="button"
                onClick={() => onSelectNodes([])}
                className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-semibold"
              >
                لغو انتخاب
              </button>
            )}
          </div>

          {/* Quick Tip for Dragging */}
          <div
            className="p-2.5 rounded-xl border text-[11px] leading-relaxed flex items-start gap-2 bg-blue-500/10 text-blue-700 dark:text-blue-300"
            style={{ borderColor: 'rgba(59, 130, 246, 0.3)' }}
          >
            <span className="text-base shrink-0">💡</span>
            <span>
              روی هر کدام از این شکل‌ها کلیک کرده و درگ کنید تا <strong>تمام اشکال با هم جابجا شوند</strong>. همچنین می‌توانید از کلیدهای جهت‌نما (←, →, ↑, ↓) استفاده کنید.
            </span>
          </div>

          {/* Alignment Tools */}
          {onAlignNodes && (
            <div className="space-y-2">
              <label className="text-xs font-bold flex items-center gap-1.5">
                <AlignLeft className="w-3.5 h-3.5 text-blue-500" />
                <span>تراز کردن اشکال نسبت به هم</span>
              </label>
              <div className="grid grid-cols-3 gap-1">
                <button
                  type="button"
                  onClick={() => onAlignNodes('right')}
                  className="p-1.5 rounded-lg border text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center gap-1"
                  style={{ borderColor: theme.ui.border }}
                  title="تراز راست"
                >
                  <AlignRight className="w-3.5 h-3.5" />
                  <span>راست</span>
                </button>
                <button
                  type="button"
                  onClick={() => onAlignNodes('center')}
                  className="p-1.5 rounded-lg border text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center gap-1"
                  style={{ borderColor: theme.ui.border }}
                  title="تراز وسط افقی"
                >
                  <AlignCenter className="w-3.5 h-3.5" />
                  <span>مرکز</span>
                </button>
                <button
                  type="button"
                  onClick={() => onAlignNodes('left')}
                  className="p-1.5 rounded-lg border text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center gap-1"
                  style={{ borderColor: theme.ui.border }}
                  title="تراز چپ"
                >
                  <AlignLeft className="w-3.5 h-3.5" />
                  <span>چپ</span>
                </button>
              </div>

              <div className="grid grid-cols-3 gap-1">
                <button
                  type="button"
                  onClick={() => onAlignNodes('top')}
                  className="p-1.5 rounded-lg border text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
                  style={{ borderColor: theme.ui.border }}
                  title="تراز بالا"
                >
                  بالا
                </button>
                <button
                  type="button"
                  onClick={() => onAlignNodes('middle')}
                  className="p-1.5 rounded-lg border text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
                  style={{ borderColor: theme.ui.border }}
                  title="تراز وسط عمودی"
                >
                  وسط
                </button>
                <button
                  type="button"
                  onClick={() => onAlignNodes('bottom')}
                  className="p-1.5 rounded-lg border text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
                  style={{ borderColor: theme.ui.border }}
                  title="تراز پایین"
                >
                  پایین
                </button>
              </div>
            </div>
          )}

          {/* Distribution Tools */}
          {onDistributeNodes && (
            <div className="space-y-2">
              <label className="text-xs font-bold flex items-center gap-1.5">
                <Grid className="w-3.5 h-3.5 text-blue-500" />
                <span>توزیع یکنواخت فاصله‌ها</span>
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => onDistributeNodes('horizontal')}
                  className="p-2 rounded-lg border text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center gap-1.5"
                  style={{ borderColor: theme.ui.border }}
                  title="توزیع یکنواخت افقی"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5 text-blue-500" />
                  <span>افقی یکنواخت</span>
                </button>
                <button
                  type="button"
                  onClick={() => onDistributeNodes('vertical')}
                  className="p-2 rounded-lg border text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center gap-1.5"
                  style={{ borderColor: theme.ui.border }}
                  title="توزیع یکنواخت عمودی"
                >
                  <span>عمودی یکنواخت</span>
                </button>
              </div>
            </div>
          )}

          {/* Batch Color Swatches */}
          {onBatchChangeColor && (
            <div className="space-y-3 pt-1 border-t" style={{ borderColor: theme.ui.border }}>
              <label className="text-xs font-bold flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-blue-500" />
                <span>تغییر رنگ دسته‌جمعی</span>
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {COLOR_SWATCHES.slice(0, 10).map((c) => (
                  <button
                    key={c.fill}
                    type="button"
                    onClick={() => onBatchChangeColor(c.fill, c.stroke, c.text)}
                    className="h-7 rounded-lg border transition-transform hover:scale-105 shadow-xs"
                    style={{ backgroundColor: c.fill, borderColor: c.stroke }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Batch Actions */}
          <div className="space-y-2 pt-2 border-t" style={{ borderColor: theme.ui.border }}>
            <label className="text-xs font-bold opacity-70">عملیات گروهی</label>
            <div className="grid grid-cols-2 gap-2">
              {onDuplicateNodes && (
                <button
                  type="button"
                  onClick={() => onDuplicateNodes(selectedNodeIds || [])}
                  className="p-2 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  style={{ borderColor: theme.ui.border }}
                >
                  <Copy className="w-3.5 h-3.5 text-blue-500" />
                  <span>تکثیر همه (Ctrl+D)</span>
                </button>
              )}
              {onDeleteNodes && (
                <button
                  type="button"
                  onClick={() => onDeleteNodes(selectedNodeIds || [])}
                  className="p-2 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                  style={{ borderColor: theme.ui.border }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>حذف همه (Del)</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= CASE 1: SINGLE NODE SELECTED ================= */}
      {(!selectedNodes || selectedNodes.length <= 1) && selectedNode && (
        <div className="space-y-4 text-right">
          {/* Label Text with Multi-line Support */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold">{t.text}</label>
              <span className="text-[10px] opacity-60">Shift+Enter = خط جدید | Enter = ثبت</span>
            </div>
            <textarea
              rows={3}
              value={selectedNode.label}
              onChange={(e) => {
                const newLabel = e.target.value;
                const lines = newLabel.split('\n');
                const minReqHeight = Math.round(lines.length * (selectedNode.fontSize * 1.35) + 26);
                const updatedHeight = Math.max(selectedNode.height, minReqHeight);
                onUpdateNode({
                  ...selectedNode,
                  label: newLabel,
                  height: updatedHeight,
                });
              }}
              onBlur={() => {
                const cleaned = trimShapeText(selectedNode.label);
                if (cleaned !== selectedNode.label) {
                  const updated = trimNodeTextAndAdjustHeight({ ...selectedNode, label: cleaned });
                  onUpdateNode(updated);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  const cleaned = trimShapeText(selectedNode.label);
                  const updated = trimNodeTextAndAdjustHeight({ ...selectedNode, label: cleaned });
                  onUpdateNode(updated);
                  (e.target as HTMLElement).blur();
                }
              }}
              placeholder="متن شکل را بنویسید (Shift+Enter برای خط جدید، Enter برای ثبت)..."
              className="w-full px-2.5 py-1.5 text-xs rounded-xl border outline-none resize-y leading-relaxed font-medium transition-colors focus:border-blue-500"
              style={{
                backgroundColor: theme.ui.surface,
                borderColor: theme.ui.border,
                color: theme.ui.textPrimary,
                fontFamily: selectedNode.fontFamily || 'Vazirmatn, sans-serif',
              }}
            />
            {/* Quick helper under textarea */}
            <div className="flex items-center justify-between text-[10px] opacity-70 px-0.5">
              <span>طول متن: {(selectedNode.label || '').length} کاراکتر</span>
              <span className="text-emerald-600 dark:text-emerald-400">پاکسازی خودکار فاصله‌ها فعال است</span>
            </div>
          </div>

          {/* ================= IMAGE SETTINGS (جایگذاری و تنظیم عکس در شکل) ================= */}
          <div className="space-y-2 pt-2 border-t" style={{ borderColor: theme.ui.border }}>
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold flex items-center gap-1.5 text-purple-600 dark:text-purple-400">
                <ImageIcon className="w-3.5 h-3.5" />
                <span>جایگذاری عکس و آیکون در شکل</span>
              </label>
              {selectedNode.imageUrl && (
                <button
                  type="button"
                  onClick={() => onUpdateNode({ ...selectedNode, imageUrl: undefined })}
                  className="text-[10px] text-red-500 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>حذف عکس</span>
                </button>
              )}
            </div>

            {/* Quick Actions: Paste from Clipboard & Upload */}
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={async () => {
                  try {
                    if (navigator.clipboard?.read) {
                      const clipboardItems = await navigator.clipboard.read();
                      for (const item of clipboardItems) {
                        const imgType = item.types.find((t) => t.startsWith('image/'));
                        if (imgType) {
                          const blob = await item.getType(imgType);
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            const dataUrl = ev.target?.result as string;
                            if (dataUrl) {
                              onUpdateNode({
                                ...selectedNode,
                                imageUrl: dataUrl,
                                width: Math.max(selectedNode.width, 180),
                                height: Math.max(selectedNode.height, 130),
                                imagePosition: selectedNode.imagePosition || 'top',
                              });
                            }
                          };
                          reader.readAsDataURL(blob);
                          return;
                        }
                      }
                    }
                    alert('لطفاً ابتدا با کلیدهای Win+Shift+S اسکرین‌شات گرفته یا عکسی را کپی کنید، سپس کلید ترکیبی Ctrl+V را در صفحه فشار دهید.');
                  } catch {
                    alert('برای جایگذاری سریع عکس کافیست در هر کجای صفحه کلید ترکیبی Ctrl+V را فشار دهید.');
                  }
                }}
                className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl border border-purple-300 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/30 hover:bg-purple-100/70 text-purple-700 dark:text-purple-300 text-[11px] font-semibold transition-all cursor-pointer shadow-2xs"
                title="جایگذاری عکس کپی‌شده یا اسکرین‌شات از حافظه موقت (Ctrl+V)"
              >
                <Clipboard className="w-3.5 h-3.5" />
                <span>پیست از کلیپ‌بورد</span>
              </button>

              <label className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl border border-dashed hover:border-purple-500 hover:bg-purple-50/20 cursor-pointer transition-all text-[11px] font-medium text-purple-600 dark:text-purple-400">
                <Upload className="w-3.5 h-3.5" />
                <span>{selectedNode.imageUrl ? 'تغییر فایل...' : 'آپلود فایل...'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        const dataUrl = ev.target?.result as string;
                        if (dataUrl) {
                          onUpdateNode({
                            ...selectedNode,
                            imageUrl: dataUrl,
                            width: Math.max(selectedNode.width, 180),
                            height: Math.max(selectedNode.height, 130),
                            imagePosition: selectedNode.imagePosition || 'top',
                          });
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="hidden"
                />
              </label>
            </div>

            <div className="text-[10px] opacity-60 leading-tight">
              💡 برای دستوراتی مانند «گزینه‌ای که فلان شکل است را بزن»، تصویر دکمه را با <strong>Ctrl+V</strong> پیست کنید.
            </div>

            {selectedNode.imageUrl && (
              <div className="space-y-2 pt-1 border-t" style={{ borderColor: theme.ui.border }}>
                {/* Image Position in Shape */}
                <div className="space-y-1">
                  <span className="text-[10px] opacity-70 block font-semibold">موقعیت قرارگیری در کادر:</span>
                  <div className="grid grid-cols-3 gap-1">
                    {[
                      { id: 'top', label: '⬆️ بالا' },
                      { id: 'inline', label: '⬅️ کنار متن (آیکون)' },
                      { id: 'cover', label: '🔲 کاور پس‌زمینه' },
                    ].map((pos) => (
                      <button
                        key={pos.id}
                        type="button"
                        onClick={() => onUpdateNode({ ...selectedNode, imagePosition: pos.id as any })}
                        className={`py-1 rounded text-[10px] border transition-colors ${
                          (selectedNode.imagePosition || 'top') === pos.id
                            ? 'bg-purple-600 text-white font-bold'
                            : 'opacity-70 hover:opacity-100'
                        }`}
                        style={{ borderColor: theme.ui.border }}
                      >
                        {pos.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Image Fit Mode */}
                <div className="flex items-center justify-between text-[11px] pt-1">
                  <span className="opacity-70">تناسب ابعاد عکس:</span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => onUpdateNode({ ...selectedNode, imageFit: 'contain' })}
                      className={`px-2 py-0.5 rounded text-[10px] border ${
                        selectedNode.imageFit !== 'cover'
                          ? 'bg-purple-600 text-white font-bold'
                          : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{ borderColor: theme.ui.border }}
                    >
                      متناسب (Fit)
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateNode({ ...selectedNode, imageFit: 'cover' })}
                      className={`px-2 py-0.5 rounded text-[10px] border ${
                        selectedNode.imageFit === 'cover'
                          ? 'bg-purple-600 text-white font-bold'
                          : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{ borderColor: theme.ui.border }}
                    >
                      پوشش کامل (Cover)
                    </button>
                  </div>
                </div>

                <div className="p-1 rounded-lg border bg-white dark:bg-slate-900/50" style={{ borderColor: theme.ui.border }}>
                  <img
                    src={selectedNode.imageUrl}
                    alt="پیش‌نمایش تصویر گره"
                    className="h-20 w-full object-contain rounded"
                  />
                </div>
              </div>
            )}
          </div>

          {/* ================= FONT & TYPOGRAPHY ================= */}
          <div className="space-y-2 pt-2 border-t" style={{ borderColor: theme.ui.border }}>
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5 text-indigo-500" />
                <span>فونت و تایپوگرافی شکل</span>
              </label>
            </div>

            {/* Font Family Dropdown */}
            <select
              value={selectedNode.fontFamily || 'Vazirmatn, sans-serif'}
              onChange={(e) =>
                onUpdateNode({
                  ...selectedNode,
                  fontFamily: e.target.value,
                })
              }
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border outline-none font-medium cursor-pointer"
              style={{
                backgroundColor: theme.ui.surface,
                borderColor: theme.ui.border,
                color: theme.ui.textPrimary,
              }}
            >
              {FONT_OPTIONS.map((f) => (
                <option key={f.id} value={f.family}>
                  {f.label}
                </option>
              ))}
              {selectedNode.fontFamily &&
                !FONT_OPTIONS.some((f) => f.family === selectedNode.fontFamily) && (
                  <option value={selectedNode.fontFamily}>
                    قلم سفارشی: {selectedNode.fontFamily}
                  </option>
                )}
            </select>

            {/* Quick manual font name if user wants custom font */}
            <div className="flex items-center gap-1 pt-0.5">
              <input
                type="text"
                placeholder="تایپ نام قلم دلخواه دستی..."
                value={customFontInput}
                onChange={(e) => setCustomFontInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && customFontInput.trim()) {
                    onUpdateNode({ ...selectedNode, fontFamily: customFontInput.trim() });
                    setCustomFontInput('');
                  }
                }}
                className="flex-1 px-2 py-1 text-[11px] rounded border outline-none"
                style={{
                  backgroundColor: theme.ui.surface,
                  borderColor: theme.ui.border,
                  color: theme.ui.textPrimary,
                }}
              />
              <button
                type="button"
                onClick={() => {
                  if (customFontInput.trim()) {
                    onUpdateNode({ ...selectedNode, fontFamily: customFontInput.trim() });
                    setCustomFontInput('');
                  }
                }}
                className="px-2 py-1 text-[11px] rounded bg-blue-600 text-white font-medium hover:opacity-90"
              >
                اعمال
              </button>
            </div>

            {/* Font Size with Wide Slider & Direct Input */}
            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold">اندازه قلم (سایز):</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateNode({
                        ...selectedNode,
                        fontSize: Math.max(8, selectedNode.fontSize - 1),
                      })
                    }
                    className="w-5 h-5 rounded border flex items-center justify-center text-[10px] font-bold hover:opacity-80"
                    style={{ borderColor: theme.ui.border }}
                    title="کاهش سایز قلم"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min={8}
                    max={48}
                    value={selectedNode.fontSize}
                    onChange={(e) =>
                      onUpdateNode({
                        ...selectedNode,
                        fontSize: Math.max(8, Math.min(48, Number(e.target.value) || 13)),
                      })
                    }
                    className="w-12 text-center text-xs font-mono font-bold rounded border py-0.5 outline-none"
                    style={{
                      backgroundColor: theme.ui.surface,
                      borderColor: theme.ui.border,
                      color: theme.ui.textPrimary,
                    }}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateNode({
                        ...selectedNode,
                        fontSize: Math.min(48, selectedNode.fontSize + 1),
                      })
                    }
                    className="w-5 h-5 rounded border flex items-center justify-center text-[10px] font-bold hover:opacity-80"
                    style={{ borderColor: theme.ui.border }}
                    title="افزایش سایز قلم"
                  >
                    +
                  </button>
                </div>
              </div>
              <input
                type="range"
                min={8}
                max={36}
                value={selectedNode.fontSize}
                onChange={(e) =>
                  onUpdateNode({ ...selectedNode, fontSize: Number(e.target.value) })
                }
                className="w-full accent-blue-600"
              />
            </div>

            {/* Weight & Italic */}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() =>
                  onUpdateNode({
                    ...selectedNode,
                    fontWeight: selectedNode.fontWeight === 'bold' ? 'normal' : 'bold',
                  })
                }
                className={`flex-1 py-1.5 rounded-lg text-xs border flex items-center justify-center gap-1.5 transition-colors ${
                  selectedNode.fontWeight === 'bold'
                    ? 'bg-blue-600 text-white font-bold'
                    : 'hover:opacity-80'
                }`}
                style={{
                  borderColor: selectedNode.fontWeight === 'bold' ? '#2563EB' : theme.ui.border,
                }}
                title="پررنگ (Bold)"
              >
                <Bold className="w-3.5 h-3.5" />
                <span>بولد</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  onUpdateNode({
                    ...selectedNode,
                    fontStyle: selectedNode.fontStyle === 'italic' ? 'normal' : 'italic',
                  })
                }
                className={`flex-1 py-1.5 rounded-lg text-xs border flex items-center justify-center gap-1.5 transition-colors ${
                  selectedNode.fontStyle === 'italic'
                    ? 'bg-blue-600 text-white font-bold'
                    : 'hover:opacity-80'
                }`}
                style={{
                  borderColor: selectedNode.fontStyle === 'italic' ? '#2563EB' : theme.ui.border,
                }}
                title="مورب (Italic)"
              >
                <Italic className="w-3.5 h-3.5" />
                <span>مورب</span>
              </button>
            </div>
          </div>

          {/* ================= COLOR CONTROLS ================= */}
          <div className="space-y-2.5 pt-2 border-t" style={{ borderColor: theme.ui.border }}>
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-emerald-500" />
                <span>رنگ‌بندی کامل شکل</span>
              </label>
            </div>

            {/* Quick Palettes */}
            <div className="grid grid-cols-5 gap-1.5">
              {COLOR_SWATCHES.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() =>
                    onUpdateNode({
                      ...selectedNode,
                      fill: p.fill,
                      stroke: p.stroke,
                      textColor: p.text,
                    })
                  }
                  className="h-7 rounded-lg border flex items-center justify-center transition-transform hover:scale-105 cursor-pointer shadow-xs"
                  style={{
                    backgroundColor: p.fill === 'transparent' ? '#FFFFFF' : p.fill,
                    borderColor: p.stroke,
                  }}
                  title={p.name}
                >
                  <span className="text-[10px] font-bold" style={{ color: p.text }}>
                    Aa
                  </span>
                </button>
              ))}
            </div>

            {/* Advanced Pickers: Fill, Stroke, Text */}
            <div className="grid grid-cols-3 gap-2 pt-1 text-[10px]">
              {/* Fill */}
              <div className="p-2 rounded-lg border space-y-1" style={{ borderColor: theme.ui.border }}>
                <span className="opacity-75 block font-semibold">پس‌زمینه:</span>
                <div className="flex items-center gap-1">
                  <input
                    type="color"
                    value={selectedNode.fill === 'transparent' ? '#ffffff' : selectedNode.fill}
                    onChange={(e) => onUpdateNode({ ...selectedNode, fill: e.target.value })}
                    className="w-5 h-5 rounded border cursor-pointer shrink-0"
                  />
                  <input
                    type="text"
                    value={selectedNode.fill}
                    onChange={(e) => onUpdateNode({ ...selectedNode, fill: e.target.value })}
                    className="w-full text-[10px] font-mono uppercase bg-transparent outline-none truncate"
                  />
                </div>
              </div>

              {/* Stroke */}
              <div className="p-2 rounded-lg border space-y-1" style={{ borderColor: theme.ui.border }}>
                <span className="opacity-75 block font-semibold">خط دور:</span>
                <div className="flex items-center gap-1">
                  <input
                    type="color"
                    value={selectedNode.stroke}
                    onChange={(e) => onUpdateNode({ ...selectedNode, stroke: e.target.value })}
                    className="w-5 h-5 rounded border cursor-pointer shrink-0"
                  />
                  <input
                    type="text"
                    value={selectedNode.stroke}
                    onChange={(e) => onUpdateNode({ ...selectedNode, stroke: e.target.value })}
                    className="w-full text-[10px] font-mono uppercase bg-transparent outline-none truncate"
                  />
                </div>
              </div>

              {/* Text Color */}
              <div className="p-2 rounded-lg border space-y-1" style={{ borderColor: theme.ui.border }}>
                <span className="opacity-75 block font-semibold">رنگ متن:</span>
                <div className="flex items-center gap-1">
                  <input
                    type="color"
                    value={selectedNode.textColor}
                    onChange={(e) => onUpdateNode({ ...selectedNode, textColor: e.target.value })}
                    className="w-5 h-5 rounded border cursor-pointer shrink-0"
                  />
                  <input
                    type="text"
                    value={selectedNode.textColor}
                    onChange={(e) => onUpdateNode({ ...selectedNode, textColor: e.target.value })}
                    className="w-full text-[10px] font-mono uppercase bg-transparent outline-none truncate"
                  />
                </div>
              </div>
            </div>

            {/* Transparent Fill Checkbox */}
            <label className="flex items-center gap-1.5 text-[11px] cursor-pointer">
              <input
                type="checkbox"
                checked={selectedNode.fill === 'transparent'}
                onChange={(e) =>
                  onUpdateNode({
                    ...selectedNode,
                    fill: e.target.checked ? 'transparent' : '#EEF2FF',
                  })
                }
                className="rounded accent-blue-600 w-3.5 h-3.5"
              />
              <span className="opacity-75">بدون پس‌زمینه (شفاف)</span>
            </label>
          </div>

          {/* Stroke Width & Style */}
          <div className="space-y-2 pt-2 border-t" style={{ borderColor: theme.ui.border }}>
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold">{t.strokeWidth}</label>
              <span className="text-[10px] opacity-60">ضخامت و نوع خط</span>
            </div>
            <div className="flex gap-1.5">
              {[0, 1, 2, 3, 4, 6].map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => onUpdateNode({ ...selectedNode, strokeWidth: w })}
                  className={`flex-1 py-1 rounded text-xs font-mono font-bold border transition-colors ${
                    selectedNode.strokeWidth === w
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'hover:opacity-80'
                  }`}
                  style={{
                    borderColor: selectedNode.strokeWidth === w ? '#2563EB' : theme.ui.border,
                    color: selectedNode.strokeWidth === w ? '#FFFFFF' : theme.ui.textPrimary,
                    backgroundColor: selectedNode.strokeWidth === w ? '#2563EB' : undefined,
                  }}
                >
                  {w}px
                </button>
              ))}
            </div>

            <div className="flex gap-1.5 pt-0.5">
              {(['solid', 'dashed', 'dotted'] as const).map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => onUpdateNode({ ...selectedNode, strokeStyle: style })}
                  className={`flex-1 py-1 rounded text-xs border capitalize transition-colors ${
                    selectedNode.strokeStyle === style
                      ? 'bg-blue-600 text-white font-bold shadow-xs'
                      : 'hover:opacity-80'
                  }`}
                  style={{
                    borderColor: selectedNode.strokeStyle === style ? '#2563EB' : theme.ui.border,
                    color: selectedNode.strokeStyle === style ? '#FFFFFF' : theme.ui.textPrimary,
                    backgroundColor: selectedNode.strokeStyle === style ? '#2563EB' : undefined,
                  }}
                >
                  {t[style]}
                </button>
              ))}
            </div>
          </div>

          {/* ================= DIMENSIONS & SIZING ================= */}
          <div className="space-y-2 pt-2 border-t" style={{ borderColor: theme.ui.border }}>
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold flex items-center gap-1.5">
                <Maximize2 className="w-3.5 h-3.5 text-blue-500" />
                <span>سایز و ابعاد شکل (اندازه)</span>
              </label>
              {/* Auto-fit Button */}
              <button
                type="button"
                onClick={() => handleAutoFitSize(selectedNode)}
                className="flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400 font-semibold hover:opacity-85"
                title="محاسبه و تنظیم هوشمند ابعاد بر اساس طول متن"
              >
                <Sparkles className="w-3 h-3" />
                <span>تنظیم خودکار با متن</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] opacity-60 block">عرض (W)</span>
                <input
                  type="number"
                  value={selectedNode.width}
                  onChange={(e) =>
                    onUpdateNode({ ...selectedNode, width: Math.max(50, Number(e.target.value)) })
                  }
                  className="w-full px-2 py-1 text-xs rounded-lg border outline-none font-mono"
                  style={{
                    backgroundColor: theme.ui.surface,
                    borderColor: theme.ui.border,
                    color: theme.ui.textPrimary,
                  }}
                />
              </div>
              <div>
                <span className="text-[10px] opacity-60 block">ارتفاع (H)</span>
                <input
                  type="number"
                  value={selectedNode.height}
                  onChange={(e) =>
                    onUpdateNode({ ...selectedNode, height: Math.max(30, Number(e.target.value)) })
                  }
                  className="w-full px-2 py-1 text-xs rounded-lg border outline-none font-mono"
                  style={{
                    backgroundColor: theme.ui.surface,
                    borderColor: theme.ui.border,
                    color: theme.ui.textPrimary,
                  }}
                />
              </div>
            </div>

            {/* Proportional Scaling Buttons */}
            <div className="flex items-center justify-between gap-1 pt-1">
              <span className="text-[10px] opacity-70">مقیاس سریع:</span>
              <div className="flex gap-1">
                {[
                  { label: '-20%', factor: 0.8 },
                  { label: '+20%', factor: 1.2 },
                  { label: '۱.۵×', factor: 1.5 },
                  { label: '۲×', factor: 2 },
                ].map((scale) => (
                  <button
                    key={scale.label}
                    type="button"
                    onClick={() =>
                      onUpdateNode({
                        ...selectedNode,
                        width: Math.max(50, Math.round(selectedNode.width * scale.factor)),
                        height: Math.max(30, Math.round(selectedNode.height * scale.factor)),
                      })
                    }
                    className="px-2 py-0.5 rounded text-[10px] border font-mono hover:opacity-85"
                    style={{ borderColor: theme.ui.border }}
                  >
                    {scale.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Size Presets */}
            <div className="grid grid-cols-5 gap-1 pt-1">
              {[
                { label: 'فشرده', w: 120, h: 55 },
                { label: 'عادی', w: 160, h: 75 },
                { label: 'مربع', w: 130, h: 130 },
                { label: 'عکس متوسط', w: 180, h: 130 },
                { label: 'عکس بزرگ', w: 260, h: 180 },
              ].map((sz) => (
                <button
                  key={sz.label}
                  type="button"
                  onClick={() => onUpdateNode({ ...selectedNode, width: sz.w, height: sz.h })}
                  className="py-1 rounded text-[9.5px] border hover:opacity-85 text-center font-medium truncate"
                  style={{ borderColor: theme.ui.border }}
                >
                  {sz.label}
                </button>
              ))}
            </div>

            {/* Corner Radius (for rectangular nodes) */}
            {(selectedNode.type === 'process' || selectedNode.type === 'subroutine') && (
              <div className="pt-1 space-y-1">
                <span className="text-[10px] opacity-60 block">گردی گوشه‌ها (Border Radius):</span>
                <div className="flex gap-1">
                  {[0, 6, 12, 20].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => onUpdateNode({ ...selectedNode, borderRadius: r })}
                      className={`flex-1 py-0.5 rounded text-[10px] border font-mono ${
                        (selectedNode.borderRadius || 6) === r
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
            )}
          </div>

          {/* Actions */}
          <div className="pt-3 border-t flex flex-col gap-2" style={{ borderColor: theme.ui.border }}>
            <button
              onClick={() => onDuplicateNode(selectedNode.id)}
              className="w-full flex items-center justify-center gap-2 py-1.5 rounded-lg border text-xs font-medium hover:opacity-90"
              style={{ backgroundColor: theme.ui.surface, borderColor: theme.ui.border }}
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{t.duplicate}</span>
            </button>
            <button
              onClick={() => onDeleteNode(selectedNode.id)}
              className="w-full flex items-center justify-center gap-2 py-1.5 rounded-lg text-xs font-medium text-red-600 bg-red-50 dark:bg-red-950/40 hover:bg-red-100"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t.deleteSelected}</span>
            </button>
          </div>
        </div>
      )}

      {/* ================= CASE 2: EDGE SELECTED ================= */}
      {selectedEdge && (
        <div className="space-y-4 text-right">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold">{t.edgeLabel}</label>
            <input
              type="text"
              placeholder="مثلاً: بله / خیر / تأیید"
              value={selectedEdge.label || ''}
              onChange={(e) => onUpdateEdge({ ...selectedEdge, label: e.target.value })}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border outline-none"
              style={{
                backgroundColor: theme.ui.surface,
                borderColor: theme.ui.border,
                color: theme.ui.textPrimary,
              }}
            />
          </div>

          {/* Line Type */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold">{t.lineType}</label>
            <div className="flex flex-col gap-1.5">
              {(
                [
                  { type: 'orthogonal', label: t.orthogonal },
                  { type: 'curved', label: t.curved },
                  { type: 'straight', label: t.straight },
                ] as const
              ).map((item) => (
                <button
                  key={item.type}
                  onClick={() => onUpdateEdge({ ...selectedEdge, lineType: item.type })}
                  className={`py-1.5 px-2.5 rounded-lg text-xs border text-right transition-colors ${
                    selectedEdge.lineType === item.type
                      ? 'bg-blue-600 text-white font-bold shadow-xs'
                      : 'hover:opacity-80'
                  }`}
                  style={{
                    borderColor: selectedEdge.lineType === item.type ? '#2563EB' : theme.ui.border,
                    color: selectedEdge.lineType === item.type ? '#FFFFFF' : theme.ui.textPrimary,
                    backgroundColor: selectedEdge.lineType === item.type ? '#2563EB' : undefined,
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Line Color & Width */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold">{t.colors}</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={selectedEdge.color}
                onChange={(e) => onUpdateEdge({ ...selectedEdge, color: e.target.value })}
                className="w-7 h-7 rounded border cursor-pointer shrink-0"
              />
              <input
                type="text"
                value={selectedEdge.color}
                onChange={(e) => onUpdateEdge({ ...selectedEdge, color: e.target.value })}
                className="flex-1 px-2 py-1 text-xs rounded border font-mono uppercase bg-transparent outline-none"
                style={{ borderColor: theme.ui.border }}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold">{t.strokeWidth}</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((w) => (
                <button
                  key={w}
                  onClick={() => onUpdateEdge({ ...selectedEdge, strokeWidth: w })}
                  className={`flex-1 py-1 rounded text-xs font-mono font-bold border transition-colors ${
                    selectedEdge.strokeWidth === w
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'hover:opacity-80'
                  }`}
                  style={{
                    borderColor: selectedEdge.strokeWidth === w ? '#2563EB' : theme.ui.border,
                    color: selectedEdge.strokeWidth === w ? '#FFFFFF' : theme.ui.textPrimary,
                    backgroundColor: selectedEdge.strokeWidth === w ? '#2563EB' : undefined,
                  }}
                >
                  {w}px
                </button>
              ))}
            </div>
          </div>

          {/* Line Style (Solid vs Dashed) */}
          <div className="flex gap-2">
            {(['solid', 'dashed'] as const).map((st) => (
              <button
                key={st}
                onClick={() => onUpdateEdge({ ...selectedEdge, style: st })}
                className={`flex-1 py-1 rounded text-xs border capitalize transition-colors ${
                  selectedEdge.style === st
                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                    : 'hover:opacity-80'
                }`}
                style={{
                  borderColor: selectedEdge.style === st ? '#2563EB' : theme.ui.border,
                  color: selectedEdge.style === st ? '#FFFFFF' : theme.ui.textPrimary,
                  backgroundColor: selectedEdge.style === st ? '#2563EB' : undefined,
                }}
              >
                {t[st]}
              </button>
            ))}
          </div>

          {/* Smart Obstacle Avoidance & Direction Guidance */}
          <div className="space-y-2 pt-2 border-t" style={{ borderColor: theme.ui.border }}>
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>مسیریابی هوشمند و هدایت خطوط</span>
              </label>
            </div>

            <div className="text-[10px] opacity-70 leading-relaxed">
              خطوط به طور خودکار از کنار اشکال عبور می‌کنند و زیر آن‌ها پنهان نمی‌شوند.
            </div>

            {/* Bypass Direction Buttons */}
            <div className="grid grid-cols-3 gap-1">
              <button
                type="button"
                onClick={() => onUpdateEdge({ ...selectedEdge, manualOffset: (selectedEdge.manualOffset || 0) - 35, routingMode: 'smart' })}
                className="py-1 px-1.5 rounded-lg border hover:opacity-85 flex items-center justify-center gap-1 text-[10px] font-semibold transition-colors"
                style={{ borderColor: theme.ui.border }}
                title="دور زدن از سمت چپ"
              >
                <ArrowLeft className="w-3 h-3 text-blue-500" />
                <span>از چپ</span>
              </button>

              <button
                type="button"
                onClick={() => onUpdateEdge({ ...selectedEdge, waypoints: undefined, manualOffset: 0, routingMode: 'smart' })}
                className="py-1 px-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-1 text-[10px] font-bold shadow-xs transition-colors"
                title="بازنشانی به مسیر هوشمند خودکار"
              >
                <Zap className="w-3 h-3 text-amber-300" />
                <span>هوشمند</span>
              </button>

              <button
                type="button"
                onClick={() => onUpdateEdge({ ...selectedEdge, manualOffset: (selectedEdge.manualOffset || 0) + 35, routingMode: 'smart' })}
                className="py-1 px-1.5 rounded-lg border hover:opacity-85 flex items-center justify-center gap-1 text-[10px] font-semibold transition-colors"
                style={{ borderColor: theme.ui.border }}
                title="دور زدن از سمت راست"
              >
                <span>از راست</span>
                <ArrowRight className="w-3 h-3 text-blue-500" />
              </button>
            </div>

            {/* Arrowheads selector */}
            <div className="space-y-1 pt-1">
              <span className="text-[10px] opacity-75 font-semibold block">پیکان‌های ابتدا و انتها:</span>
              <div className="grid grid-cols-4 gap-1 text-[10px] font-mono">
                <button
                  type="button"
                  onClick={() => onUpdateEdge({ ...selectedEdge, arrowStart: false, arrowEnd: true })}
                  className={`py-1 rounded border text-center transition-colors ${
                    !selectedEdge.arrowStart && selectedEdge.arrowEnd !== false
                      ? 'bg-blue-600 text-white font-bold'
                      : 'hover:opacity-80'
                  }`}
                  style={{ borderColor: theme.ui.border }}
                  title="فقط انتهای خط"
                >
                  ➔ انتها
                </button>

                <button
                  type="button"
                  onClick={() => onUpdateEdge({ ...selectedEdge, arrowStart: true, arrowEnd: true })}
                  className={`py-1 rounded border text-center transition-colors ${
                    selectedEdge.arrowStart && selectedEdge.arrowEnd
                      ? 'bg-blue-600 text-white font-bold'
                      : 'hover:opacity-80'
                  }`}
                  style={{ borderColor: theme.ui.border }}
                  title="پیکان دوطرفه"
                >
                  ↔️ دوطرفه
                </button>

                <button
                  type="button"
                  onClick={() => onUpdateEdge({ ...selectedEdge, arrowStart: true, arrowEnd: false })}
                  className={`py-1 rounded border text-center transition-colors ${
                    selectedEdge.arrowStart && !selectedEdge.arrowEnd
                      ? 'bg-blue-600 text-white font-bold'
                      : 'hover:opacity-80'
                  }`}
                  style={{ borderColor: theme.ui.border }}
                  title="فقط ابتدای خط"
                >
                  ⬅️ ابتدا
                </button>

                <button
                  type="button"
                  onClick={() => onUpdateEdge({ ...selectedEdge, arrowStart: false, arrowEnd: false })}
                  className={`py-1 rounded border text-center transition-colors ${
                    !selectedEdge.arrowStart && selectedEdge.arrowEnd === false
                      ? 'bg-blue-600 text-white font-bold'
                      : 'hover:opacity-80'
                  }`}
                  style={{ borderColor: theme.ui.border }}
                  title="خط ساده بدون پیکان"
                >
                  ─ ساده
                </button>
              </div>
            </div>

            {selectedEdge.waypoints && selectedEdge.waypoints.length > 0 && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => onUpdateEdge({ ...selectedEdge, waypoints: undefined, routingMode: 'smart' })}
                  className="w-full py-1 text-[10px] rounded border border-amber-500/50 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 flex items-center justify-center gap-1 font-semibold"
                >
                  <span>پاک کردن زوایای دستی (برگشت به خودکار)</span>
                </button>
              </div>
            )}
          </div>

          {/* Delete edge */}
          <div className="pt-3 border-t" style={{ borderColor: theme.ui.border }}>
            <button
              onClick={() => onDeleteEdge(selectedEdge.id)}
              className="w-full flex items-center justify-center gap-2 py-1.5 rounded-lg text-xs font-medium text-red-600 bg-red-50 dark:bg-red-950/40 hover:bg-red-100"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t.deleteSelected}</span>
            </button>
          </div>
        </div>
      )}

      {/* ================= CASE 3: NO SELECTION (CANVAS & DEFAULTS) ================= */}
      {(!selectedNodes || selectedNodes.length === 0) && !selectedNode && !selectedEdge && (
        <div className="space-y-4 text-right">
          {/* Quick Button to Site Defaults */}
          {onOpenDefaultSettings && (
            <button
              type="button"
              onClick={onOpenDefaultSettings}
              className="w-full p-3 rounded-xl border flex items-center justify-between text-xs font-bold transition-all hover:scale-[1.01] shadow-xs cursor-pointer"
              style={{
                backgroundColor: theme.ui.surface,
                borderColor: theme.ui.border,
              }}
            >
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-blue-500" />
                <span>تنظیمات پیش‌فرض سایت</span>
              </div>
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">
                مدیریت
              </span>
            </button>
          )}

          {/* Grid Mode */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold flex items-center gap-1.5">
              <Grid className="w-3.5 h-3.5 text-blue-500" />
              <span>شبکه شطرنجی</span>
            </label>
            <div className="grid grid-cols-3 gap-1">
              {(
                [
                  { mode: 'dots', label: t.gridDots },
                  { mode: 'lines', label: t.gridLines },
                  { mode: 'none', label: t.gridNone },
                ] as const
              ).map((item) => (
                <button
                  key={item.mode}
                  onClick={() => setGridMode(item.mode)}
                  className={`py-1.5 rounded-lg text-xs border transition-colors ${
                    gridMode === item.mode
                      ? 'bg-blue-600 text-white font-bold shadow-xs'
                      : 'hover:opacity-80'
                  }`}
                  style={{
                    borderColor: gridMode === item.mode ? '#2563EB' : theme.ui.border,
                    color: gridMode === item.mode ? '#FFFFFF' : theme.ui.textPrimary,
                    backgroundColor: gridMode === item.mode ? '#2563EB' : undefined,
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Snap to grid checkbox */}
          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium">
            <input
              type="checkbox"
              checked={snapToGrid}
              onChange={(e) => setSnapToGrid(e.target.checked)}
              className="rounded"
            />
            <span>{t.snapToGrid} (۱۵px)</span>
          </label>

          {/* Project Statistics */}
          <div className="p-3 rounded-xl border space-y-2" style={{ backgroundColor: theme.ui.surface, borderColor: theme.ui.border }}>
            <div className="text-xs font-bold opacity-70">آمار پروژه فعلی</div>
            <div className="flex justify-between text-xs">
              <span className="opacity-60">تعداد اشکال (گره‌ها):</span>
              <span className="font-mono font-bold">{nodeCount}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="opacity-60">تعداد اتصالات (خطوط):</span>
              <span className="font-mono font-bold">{edgeCount}</span>
            </div>
          </div>

          {/* Clear canvas */}
          <div className="pt-2">
            <button
              onClick={onClearCanvas}
              className="w-full py-1.5 rounded-lg border text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
              style={{ borderColor: theme.ui.border }}
            >
              {t.clearCanvas}
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};
