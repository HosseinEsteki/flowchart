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
} from 'lucide-react';
import { FONT_OPTIONS, COLOR_SWATCHES } from '../utils/defaultSettings';
import { trimShapeText, trimNodeTextAndAdjustHeight } from '../utils/shapePaths';

interface PropertiesPanelProps {
  theme: ColorTheme;
  t: TranslationDictionary;
  selectedNode: FlowchartNode | null;
  selectedEdge: FlowchartEdge | null;
  onUpdateNode: (node: FlowchartNode) => void;
  onDeleteNode: (id: string) => void;
  onDuplicateNode: (id: string) => void;
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
  selectedEdge,
  onUpdateNode,
  onDeleteNode,
  onDuplicateNode,
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

      {/* ================= CASE 1: NODE SELECTED ================= */}
      {selectedNode && (
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

            {/* Quick Size Presets */}
            <div className="grid grid-cols-4 gap-1 pt-1">
              {[
                { label: 'فشرده', w: 120, h: 55 },
                { label: 'عادی', w: 160, h: 75 },
                { label: 'عریض', w: 210, h: 80 },
                { label: 'بزرگ', w: 240, h: 110 },
              ].map((sz) => (
                <button
                  key={sz.label}
                  type="button"
                  onClick={() => onUpdateNode({ ...selectedNode, width: sz.w, height: sz.h })}
                  className="py-1 rounded text-[10px] border hover:opacity-85 text-center font-medium"
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
      {!selectedNode && !selectedEdge && (
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
